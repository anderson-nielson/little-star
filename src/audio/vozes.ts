import { audio } from './engine';
import frasesJson from '@/data/frases.json';

/**
 * As vozes da família, gravadas no próprio app e guardadas só no aparelho
 * (IndexedDB). Enquanto não houver gravação, a cena acontece sem voz. Nunca
 * uma voz sintética fingindo ser a mãe.
 */
export type Dono = 'mae' | 'pai' | 'theo' | 'qualquer';

export interface Frase {
  id: string;
  texto: string;
  dono: Dono;
  grupo: string;
  obrigatoria: boolean;
}

export const frases: Frase[] = frasesJson as Frase[];

const BANCO = 'little-star-vozes';
const LOJA = 'gravacoes';

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((r) => {
    try {
      if (typeof indexedDB === 'undefined') return r(null);
      const req = indexedDB.open(BANCO, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(LOJA)) req.result.createObjectStore(LOJA);
      };
      req.onsuccess = () => r(req.result);
      req.onerror = () => r(null);
    } catch {
      r(null);
    }
  });
}

export async function guardarGravacao(id: string, blob: Blob): Promise<boolean> {
  const db = await abrir();
  if (!db) return false;
  return new Promise((r) => {
    const tx = db.transaction(LOJA, 'readwrite');
    tx.objectStore(LOJA).put(blob, id);
    tx.oncomplete = () => {
      buffers.delete(id);
      existentes.add(id);
      r(true);
    };
    tx.onerror = () => r(false);
  });
}

export async function apagarGravacao(id: string): Promise<void> {
  const db = await abrir();
  if (!db) return;
  await new Promise<void>((r) => {
    const tx = db.transaction(LOJA, 'readwrite');
    tx.objectStore(LOJA).delete(id);
    tx.oncomplete = () => r();
    tx.onerror = () => r();
  });
  buffers.delete(id);
  existentes.delete(id);
}

export async function lerGravacao(id: string): Promise<Blob | null> {
  const db = await abrir();
  if (!db) return null;
  return new Promise((r) => {
    const req = db.transaction(LOJA, 'readonly').objectStore(LOJA).get(id);
    req.onsuccess = () => r((req.result as Blob | undefined) ?? null);
    req.onerror = () => r(null);
  });
}

export async function idsGravados(): Promise<string[]> {
  const db = await abrir();
  if (!db) return [];
  return new Promise((r) => {
    const req = db.transaction(LOJA, 'readonly').objectStore(LOJA).getAllKeys();
    req.onsuccess = () => r((req.result as string[]).map(String));
    req.onerror = () => r([]);
  });
}

const buffers = new Map<string, AudioBuffer>();
const existentes = new Set<string>();
let carregou = false;

/** Lista as gravações existentes uma vez, para `temVoz` responder sem esperar. */
export async function prepararVozes(): Promise<void> {
  if (carregou) return;
  for (const id of await idsGravados()) existentes.add(id);
  carregou = true;
}

export function temVoz(id: string): boolean {
  return existentes.has(id);
}

async function bufferDe(id: string): Promise<AudioBuffer | null> {
  const pronto = buffers.get(id);
  if (pronto) return pronto;
  const ctx = audio.ctx;
  if (!ctx) return null;
  const blob = await lerGravacao(id);
  if (!blob) return null;
  try {
    const b = await ctx.decodeAudioData(await blob.arrayBuffer());
    buffers.set(id, b);
    return b;
  } catch {
    return null;
  }
}

/**
 * Fala uma frase gravada. A música de fundo some enquanto a voz fala e
 * volta devagar. Resolve quando a fala termina, ou logo se não houver
 * gravação (a cena segue sem voz). Devolve se falou.
 */
export async function falar(id: string): Promise<boolean> {
  const ctx = audio.ctx;
  if (!ctx || !audio.efeitos || !audio.musica) return false;
  const b = await bufferDe(id);
  if (!b) return false;
  const s = ctx.createBufferSource();
  s.buffer = b;
  const g = ctx.createGain();
  g.gain.value = 1;
  s.connect(g);
  g.connect(audio.efeitos);
  audio.comecarFala();
  s.start();
  await new Promise<void>((r) => {
    s.onended = () => r();
  });
  audio.terminarFala();
  return true;
}

/** Duração de uma gravação em segundos, ou 0. */
export async function duracaoDaVoz(id: string): Promise<number> {
  const b = await bufferDe(id);
  return b ? b.duration : 0;
}

/* ---------- gravar ---------- */

export function podeGravar(): boolean {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

export class Gravador {
  private rec: MediaRecorder | null = null;
  private pedacos: Blob[] = [];
  private stream: MediaStream | null = null;

  async comecar(): Promise<boolean> {
    if (!podeGravar()) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pedacos = [];
      this.rec = new MediaRecorder(this.stream);
      this.rec.ondataavailable = (ev) => {
        if (ev.data.size) this.pedacos.push(ev.data);
      };
      this.rec.start();
      return true;
    } catch {
      return false;
    }
  }

  parar(): Promise<Blob | null> {
    return new Promise((r) => {
      const rec = this.rec;
      if (!rec) return r(null);
      rec.onstop = () => {
        const blob = new Blob(this.pedacos, { type: rec.mimeType || 'audio/webm' });
        this.stream?.getTracks().forEach((t) => t.stop());
        this.stream = null;
        this.rec = null;
        r(blob.size ? blob : null);
      };
      rec.stop();
    });
  }
}

/** Exporta todas as gravações num único arquivo JSON (base64), para guardar fora do aparelho. */
export async function exportarGravacoes(): Promise<Blob> {
  const ids = await idsGravados();
  const itens: Record<string, { tipo: string; dados: string }> = {};
  for (const id of ids) {
    const b = await lerGravacao(id);
    if (!b) continue;
    const bytes = new Uint8Array(await b.arrayBuffer());
    let bin = '';
    for (const x of bytes) bin += String.fromCharCode(x);
    itens[id] = { tipo: b.type, dados: btoa(bin) };
  }
  return new Blob([JSON.stringify({ versao: 1, itens })], { type: 'application/json' });
}

export async function importarGravacoes(arquivo: Blob): Promise<number> {
  try {
    const json = JSON.parse(await arquivo.text()) as { itens: Record<string, { tipo: string; dados: string }> };
    let n = 0;
    for (const [id, it] of Object.entries(json.itens)) {
      const bin = atob(it.dados);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (await guardarGravacao(id, new Blob([bytes], { type: it.tipo }))) n++;
    }
    return n;
  } catch {
    return 0;
  }
}
