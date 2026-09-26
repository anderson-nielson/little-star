import { audio } from './engine';
import { tocarAmostra } from './piano';

export function freq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Piano: a amostra gravada quando já chegou; antes disso, duas ondas com envelope e filtro que fecha. */
export function piano(midi: number, t: number, dur: number, vel = 0.5, gravado = false, saida: AudioNode | null = null): void {
  const ctx = audio.ctx;
  const out = saida ?? audio.musica;
  if (!ctx || !out) return;
  if (gravado && tocarAmostra(ctx, out, midi, t, dur, vel)) return;
  const f = freq(midi);
  const g = ctx.createGain();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(Math.min(9000, f * 6), t);
  filtro.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + Math.min(0.6, dur));
  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.25;
  o2.connect(g2);
  g2.connect(filtro);
  o1.connect(filtro);
  filtro.connect(g);
  g.connect(out);
  const fim = t + dur;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.008);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + Math.min(0.25, dur * 0.5));
  g.gain.setTargetAtTime(0.0001, fim - 0.04, 0.03);
  o1.start(t);
  o2.start(t);
  o1.stop(fim + 0.15);
  o2.stop(fim + 0.15);
}

/** Baixo: a mão esquerda do mesmo piano. */
export function baixo(midi: number, t: number, dur: number, vel = 0.35, gravado = false): void {
  const ctx = audio.ctx;
  const out = audio.musica;
  if (!ctx || !out) return;
  if (gravado && tocarAmostra(ctx, out, midi, t, dur, vel * 0.8)) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq(midi);
  const g = ctx.createGain();
  o.connect(g);
  g.connect(out);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.01);
  g.gain.setTargetAtTime(0.0001, t + dur * 0.8, 0.05);
  o.start(t);
  o.stop(t + dur + 0.2);
}

/** Uma nota do piano agora, pelo canal de efeitos (o piano do quarto, o sininho). */
export function notaAgora(midi: number, dur = 1.2, vel = 0.5): void {
  const ctx = audio.ctx;
  if (!ctx || !audio.efeitos) return;
  piano(midi, ctx.currentTime, dur, vel, true, audio.efeitos);
}

/* ---------- a lira pentatônica (Karplus-Strong), a corda da casa ---------- */

let ruidoBuffer: AudioBuffer | null = null;
function ruido(ctx: AudioContext): AudioBuffer {
  if (ruidoBuffer && ruidoBuffer.sampleRate === ctx.sampleRate) return ruidoBuffer;
  const n = ctx.sampleRate;
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  ruidoBuffer = b;
  return b;
}

const cordas = new Map<string, AudioBuffer>();

/**
 * Corda dedilhada: ruído curto passado por um atraso realimentado com filtro
 * (Karplus-Strong), calculado uma vez por nota. O laço (atraso inteiro, média
 * de duas amostras e um passa-tudo para a fração que sobra) dá exatamente o
 * período da nota: sem isso cada corda sai uns cents fora, cada uma para um
 * lado, e o acorde soa desafinado.
 */
export function cordaAmostras(sr: number, midi: number, dur = 2.2): Float32Array {
  const n = Math.floor(sr * dur);
  const periodo = sr / freq(midi);
  /* a média de duas amostras encurta o laço em meia amostra; o passa-tudo repõe a fração */
  const atraso = Math.max(2, Math.floor(periodo + 0.4));
  const fracao = periodo + 0.5 - atraso;
  const c = (1 - fracao) / (1 + fracao);
  const d = new Float32Array(n);
  const anel = new Float32Array(atraso);
  for (let i = 0; i < atraso; i++) anel[i] = Math.random() * 2 - 1;
  let idx = 0;
  let x1 = 0;
  let y1 = 0;
  const amortece = 0.996;
  for (let i = 0; i < n; i++) {
    const a = anel[idx]!;
    const prox = anel[(idx + 1) % atraso]!;
    const v = amortece * 0.5 * (a + prox);
    const y = c * v + x1 - c * y1;
    x1 = v;
    y1 = y;
    anel[idx] = y;
    d[i] = a * 0.6;
    idx = (idx + 1) % atraso;
  }
  return d;
}

export function cordaBuffer(ctx: BaseAudioContext, midi: number, dur = 2.2): AudioBuffer {
  const chave = `${midi}:${ctx.sampleRate}`;
  const pronto = cordas.get(chave);
  if (pronto) return pronto;
  const d = cordaAmostras(ctx.sampleRate, midi, dur);
  const b = ctx.createBuffer(1, d.length, ctx.sampleRate);
  b.getChannelData(0).set(d);
  cordas.set(chave, b);
  return b;
}

export function lira(midi: number, t?: number, vel = 0.4): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const s = ctx.createBufferSource();
  s.buffer = cordaBuffer(ctx, midi);
  const g = ctx.createGain();
  g.gain.value = vel;
  s.connect(g);
  g.connect(out);
  s.start(t ?? ctx.currentTime);
}

/** Pentatônica da lira Waldorf: ré, mi, sol, lá, si (clima da quinta). */
export const PENTATONICA = [62, 64, 67, 69, 71, 74, 76, 79];

/** Lira subindo: começou uma coisa nova. Descendo: esta parte acabou. */
export function liraSobe(): void {
  const ctx = audio.ctx;
  if (!ctx) return;
  [62, 67, 69, 74].forEach((m, i) => lira(m, ctx.currentTime + i * 0.16, 0.32));
}
export function liraDesce(): void {
  const ctx = audio.ctx;
  if (!ctx) return;
  [74, 69, 67, 62].forEach((m, i) => lira(m, ctx.currentTime + i * 0.18, 0.28));
}

/* ---------- respostas ao toque ---------- */

/** O sininho: deu certo. Duas notas curtas, na pentatônica, sem graves. */
export function sininho(vel = 0.26): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const t = ctx.currentTime;
  for (const [m, v, d, at] of [
    [86, vel, 0.5, 0],
    [93, vel * 0.7, 0.7, 0.06],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq(m);
    const g = ctx.createGain();
    o.connect(g);
    g.connect(out);
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(v, t + at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    o.start(t + at);
    o.stop(t + at + d + 0.05);
  }
}

/** O toque em algo que não faz nada: um sininho baixinho. Nada pode parecer quebrado. */
export function tiquinho(): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq(88);
  const g = ctx.createGain();
  o.connect(g);
  g.connect(out);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.start(t);
  o.stop(t + 0.2);
}

/** Centelhas: um arpejo curto e alegre. Alguém da família está feliz. */
export function centelhasSom(): void {
  const ctx = audio.ctx;
  if (!ctx) return;
  [76, 79, 83, 88].forEach((m, i) => lira(m, ctx.currentTime + i * 0.07, 0.3));
}

/** O ronronar do gatinho: grave, macio, sintetizado. */
export function ronronar(dur = 1.4): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = ruido(ctx);
  s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 180;
  const trem = ctx.createGain();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 25;
  const lg = ctx.createGain();
  lg.gain.value = 0.5;
  lfo.connect(lg);
  lg.connect(trem.gain);
  trem.gain.value = 0.5;
  const g = ctx.createGain();
  s.connect(f);
  f.connect(trem);
  trem.connect(g);
  g.connect(out);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.2);
  g.gain.setValueAtTime(0.5, t + dur - 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.start(t);
  lfo.start(t);
  s.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

/** O "toc" da pinha, a água no potinho, o baldinho: um tique curto e surdo. */
export function toc(tom = 400, vel = 0.25): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(tom, t);
  o.frequency.exponentialRampToValueAtTime(tom * 0.6, t + 0.08);
  const g = ctx.createGain();
  o.connect(g);
  g.connect(out);
  g.gain.setValueAtTime(vel, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.start(t);
  o.stop(t + 0.14);
}

/** Aplauso da família: ruído filtrado com envelope de alguns segundos, nunca alto. */
export function aplauso(dur = 3): void {
  const ctx = audio.ctx;
  const out = audio.efeitos;
  if (!ctx || !out) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = ruido(ctx);
  s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2200;
  f.Q.value = 0.6;
  const trem = ctx.createGain();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 9;
  const lg = ctx.createGain();
  lg.gain.value = 0.4;
  lfo.connect(lg);
  lg.connect(trem.gain);
  trem.gain.value = 0.6;
  const g = ctx.createGain();
  s.connect(f);
  f.connect(trem);
  trem.connect(g);
  g.connect(out);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.8);
  g.gain.setValueAtTime(0.16, t + dur - 1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.start(t);
  lfo.start(t);
  s.stop(t + dur + 0.1);
  lfo.stop(t + dur + 0.1);
}
