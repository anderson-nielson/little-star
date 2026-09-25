import { h } from '@/core/util';

/**
 * O balão de narração: um balão de história em quadrinhos no topo da tela,
 * suave, para quem joga junto ler em voz alta para a Stella. Ele fica na
 * tela até alguém tocar no "x" para fechar; não some sozinho. Um de cada
 * vez: se outra frase chegar, ela toma o lugar da anterior. Só `opacity` e
 * `transform` se movem.
 */
export interface Balao {
  mostrar: (texto: string) => void;
  esconder: () => void;
  /** o texto que está aparecendo, para o passeio automático e os testes */
  atual: () => string;
}

export function montarBalao(app: HTMLElement): Balao {
  const rotulo = h('span', { class: 'balao-rotulo' }, 'Para ler para a Stella');
  const texto = h('p', { class: 'balao-texto' });
  const fechar = h('button', { type: 'button', class: 'balao-fechar', 'aria-label': 'Fechar' }, '×');
  const el = h('div', { class: 'balao', role: 'status', 'aria-live': 'polite' }, rotulo, texto, fechar);
  app.appendChild(el);

  let visivel = false;

  const mostrar = (t: string) => {
    texto.textContent = t;
    el.classList.add('visivel');
    visivel = true;
  };

  const esconder = () => {
    if (!visivel) return;
    visivel = false;
    el.classList.remove('visivel');
  };

  /* só o "x" fecha; um toque no resto do balão não chega na cena */
  fechar.addEventListener('pointerup', (ev) => {
    ev.stopPropagation();
    esconder();
  });
  el.addEventListener('pointerup', (ev) => ev.stopPropagation());

  return { mostrar, esconder, atual: () => (visivel ? (texto.textContent ?? '') : '') };
}
