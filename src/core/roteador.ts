import { esperar, ms } from './util';
import { destravar } from './toque';

export interface Tela {
  el: HTMLElement;
  destruir?: () => void;
}

type Construtor = (params: Record<string, string>) => Tela;

const telas = new Map<string, Construtor>();
let atual: Tela | null = null;
let nomeAtual = '';
let raiz: HTMLElement | null = null;
let cortina: HTMLElement | null = null;
let trocando = false;
let aoVoltar: (() => void) | null = null;
const aoTrocar = new Set<(nome: string, params: Record<string, string>) => void>();

export function registrar(nome: string, c: Construtor): void {
  telas.set(nome, c);
}

export function montar(app: HTMLElement): void {
  raiz = app;
  cortina = document.createElement('div');
  cortina.className = 'cortina';
  app.appendChild(cortina);
  /* o "voltar" do aparelho volta para a casa, nunca sai do jogo */
  history.replaceState({ ls: true }, '');
  history.pushState({ ls: true }, '');
  window.addEventListener('popstate', () => {
    history.pushState({ ls: true }, '');
    aoVoltar?.();
  });
}

export function definirVoltar(f: (() => void) | null): void {
  aoVoltar = f;
}

export function telaAtual(): string {
  return nomeAtual;
}

/** Avisa quando uma tela nova entrou. Devolve como parar de ouvir. */
export function aoTrocarTela(f: (nome: string, params: Record<string, string>) => void): () => void {
  aoTrocar.add(f);
  return () => aoTrocar.delete(f);
}

/** Troca de tela com um véu lento. Nunca um corte. */
export async function ir(nome: string, params: Record<string, string> = {}): Promise<void> {
  const c = telas.get(nome);
  if (!c || !raiz || !cortina) throw new Error(`tela desconhecida: ${nome}`);
  if (trocando) return;
  trocando = true;
  try {
    cortina.classList.add('fechada');
    await esperar(ms('--d-lento') || 0);
    try {
      atual?.destruir?.();
    } catch (e) {
      /* uma tela que tropeça ao sair não prende a próxima */
      console.error(e);
    }
    atual?.el.remove();
    destravar();
    const nova = c(params);
    atual = nova;
    nomeAtual = nome;
    raiz.insertBefore(nova.el, cortina);
  } finally {
    /* aconteça o que acontecer na tela nova, o roteador nunca fica preso */
    cortina.classList.remove('fechada');
    trocando = false;
  }
  for (const f of aoTrocar) f(nome, params);
}
