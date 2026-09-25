import { h, ms } from '@/core/util';

/**
 * O balão de narração: um balão de história em quadrinhos no topo da tela,
 * suave, para quem joga junto ler em voz alta para a Stella. Um de cada vez,
 * some sozinho depois do tempo de ler, e um toque nele também o fecha. Só
 * `opacity` e `transform` se movem.
 */
export interface Balao {
  mostrar: (texto: string) => void;
  esconder: () => void;
  /** o texto que está aparecendo, para o passeio automático e os testes */
  atual: () => string;
}

/** segundos para ler: uma base mais um tanto por letra, com teto */
export const LEITURA_BASE = 4.5;
export const LEITURA_POR_LETRA = 0.06;
export const LEITURA_MAXIMA = 14;
export function tempoDeLeitura(texto: string): number {
  return Math.min(LEITURA_MAXIMA, LEITURA_BASE + texto.length * LEITURA_POR_LETRA) * 1000;
}

export function montarBalao(app: HTMLElement): Balao {
  const rotulo = h('span', { class: 'balao-rotulo' }, 'Para ler para a Stella');
  const texto = h('p', { class: 'balao-texto' });
  const el = h('div', { class: 'balao', role: 'status', 'aria-live': 'polite' }, rotulo, texto);
  app.appendChild(el);

  let visivel = false;
  let fila: string[] = [];
  let timer: number | null = null;
  let mostradoEm = 0;

  const proximo = () => {
    const t = fila.shift();
    if (t === undefined) return;
    texto.textContent = t;
    el.classList.add('visivel');
    visivel = true;
    mostradoEm = Date.now();
    timer = window.setTimeout(esconder, tempoDeLeitura(t));
  };

  const esconder = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    if (!visivel) return;
    visivel = false;
    el.classList.remove('visivel');
    /* o próximo espera o véu do anterior sair */
    window.setTimeout(proximo, (ms('--d-lento') || 0) + 400);
  };

  const mostrar = (t: string) => {
    /* nunca uma fila comprida: fica o que chegou por último */
    fila = [...fila.slice(-1), t];
    if (!visivel) {
      proximo();
      return;
    }
    /* já tem um aparecendo: deixa ele ser lido por um mínimo, depois troca */
    const lido = Date.now() - mostradoEm;
    const minimo = 3500;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(esconder, Math.max(0, minimo - lido));
  };

  el.addEventListener('pointerup', esconder);

  return { mostrar, esconder, atual: () => (visivel ? (texto.textContent ?? '') : '') };
}
