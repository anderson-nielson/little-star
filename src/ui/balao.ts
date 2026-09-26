import { h } from '@/core/util';

/**
 * O balão de narração: um balão de história em quadrinhos no topo da tela,
 * suave, para quem joga junto ler em voz alta para a Stella. Ele fica até
 * alguém tocar no "x" para fechar; não some sozinho. Um de cada vez: se outra
 * frase chegar, ela toma o lugar da anterior. Só `opacity` e `transform` se
 * movem.
 *
 * Quando ela volta a brincar (um toque na cena), o balão se recolhe numa
 * bolinha no alto: aberto, ele cobria a casinha e a trilha do avanço, e o
 * jogo parecia travado. A frase não se perde: tocar na bolinha abre de novo.
 */
export interface Balao {
  mostrar: (texto: string) => void;
  esconder: () => void;
  /** vira a bolinha no alto, com a frase guardada */
  recolher: () => void;
  /** o texto que está aparecendo, para o passeio automático e os testes */
  atual: () => string;
}

export function montarBalao(app: HTMLElement): Balao {
  const rotulo = h('span', { class: 'balao-rotulo' }, 'Para ler para a Stella');
  const texto = h('p', { class: 'balao-texto' });
  const fechar = h('button', { type: 'button', class: 'balao-fechar', 'aria-label': 'Fechar' }, '×');
  const el = h('div', { class: 'balao', role: 'status', 'aria-live': 'polite' }, rotulo, texto, fechar);
  const bolinha = h('button', { type: 'button', class: 'balao-bolinha', 'aria-label': 'Abrir a frase para ler' }, h('span', { class: 'balao-bolinha-miolo' }));
  app.appendChild(el);
  app.appendChild(bolinha);

  let visivel = false;
  let recolhido = false;

  const pintar = () => {
    el.classList.toggle('visivel', visivel && !recolhido);
    bolinha.classList.toggle('visivel', visivel && recolhido);
  };

  const mostrar = (t: string) => {
    texto.textContent = t;
    visivel = true;
    recolhido = false;
    pintar();
  };

  const esconder = () => {
    if (!visivel) return;
    visivel = false;
    recolhido = false;
    pintar();
  };

  const recolher = () => {
    if (!visivel || recolhido) return;
    recolhido = true;
    pintar();
  };

  bolinha.addEventListener('pointerup', (ev) => {
    ev.stopPropagation();
    if (!visivel) return;
    recolhido = false;
    pintar();
  });
  bolinha.addEventListener('pointerdown', (ev) => ev.stopPropagation());

  /* só o "x" fecha; um toque no resto do balão não chega na cena */
  fechar.addEventListener('pointerup', (ev) => {
    ev.stopPropagation();
    esconder();
  });
  el.addEventListener('pointerup', (ev) => ev.stopPropagation());

  /* ela tocou na cena: o balão sai da frente e vira a bolinha */
  app.addEventListener(
    'pointerdown',
    (ev) => {
      const t = ev.target as Element;
      if (el.contains(t) || bolinha.contains(t)) return;
      recolher();
    },
    { capture: true, passive: true },
  );

  return { mostrar, esconder, recolher, atual: () => (visivel ? (texto.textContent ?? '') : '') };
}
