import { h } from '@/core/util';

/**
 * O balão de narração: um balão de história em quadrinhos no topo da tela,
 * suave, para quem joga junto ler em voz alta para ela. Ele fica até
 * alguém tocar no "x" para fechar; não some sozinho. Um de cada vez: se outra
 * frase chegar, ela toma o lugar da anterior. Só `opacity` e `transform` se
 * movem.
 *
 * Ele abre logo abaixo da linha do cabeçalho, sem cobrir a casinha nem o
 * menu, e o "x" fica no canto de cima à direita do próprio balão, onde todo
 * mundo procura.
 *
 * Quando ela volta a brincar (um toque na cena), o balão se recolhe no botão
 * do balão de fala, no cabeçalho, ao lado das opções: aberto, ele cobria a trilha do
 * avanço, e o jogo parecia travado. A frase não se perde: tocar no botão abre
 * de novo.
 *
 * O balão não segura toque nenhum, só o "x": um toque em cima dele chega na
 * cena, também no quarto dormindo, onde o balão fica aberto.
 */
export interface Balao {
  mostrar: (texto: string) => void;
  esconder: () => void;
  /** vira a bolinha no alto, com a frase guardada */
  recolher: () => void;
  /** o texto que está aparecendo, para o passeio automático e os testes */
  atual: () => string;
}

/** um balão de fala com duas linhas de texto: aqui tem uma frase para ler */
const BALAOZINHO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 9.5h9M7.5 12.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

/** `linha`: a linha da direita do cabeçalho, onde o botão recolhido fica à esquerda das opções */
export function montarBalao(app: HTMLElement, linha: HTMLElement = app): Balao {
  const rotulo = h('span', { class: 'balao-rotulo' }, 'Para ler para ela');
  const texto = h('p', { class: 'balao-texto' });
  const fechar = h('button', { type: 'button', class: 'balao-fechar', 'aria-label': 'Fechar' }, '×');
  const el = h('div', { class: 'balao', role: 'status', 'aria-live': 'polite' }, rotulo, texto, fechar);
  const bolinha = h('button', { type: 'button', class: 'balao-bolinha', 'aria-label': 'Ler a frase', html: BALAOZINHO });
  app.appendChild(el);
  linha.prepend(bolinha);

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

  /* só o "x" fecha */
  fechar.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  fechar.addEventListener('pointerup', (ev) => {
    ev.stopPropagation();
    esconder();
  });

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
