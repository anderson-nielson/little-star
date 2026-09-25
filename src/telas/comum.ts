import { cena, esperar, pontoNoSvg, svgEl } from '@/core/util';
import { reivindicarDedo, segurar, soltarDedo, tocavel, travar } from '@/core/toque';
import { ir } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { casinha, centelhas, lua, maozinha } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { centelhasSom, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

export interface TelaSvg extends Tela {
  svg: SVGSVGElement;
  /** liga um alvo do svg a uma ação, com as regras do toque */
  alvo: (seletor: string, ao: (ev: PointerEvent, el: Element) => void, semTrava?: boolean) => void;
  /** centelhas rosa e ouro subindo num ponto da cena */
  comemorar: (x: number, y: number) => void;
  /** a mãozinha aparece num ponto; `null` tira */
  mao: (p: [number, number] | null, rot?: number) => void;
  /** ponto de um evento no espaço da cena */
  ponto: (ev: PointerEvent) => [number, number];
  aoDestruir: (f: () => void) => void;
}

export interface OpcoesTela {
  /** a casinha verde no canto: volta para a casa (ou o que se passar) */
  casinha?: boolean | (() => void);
  /** a lua do cantinho dos pais */
  lua?: boolean;
  fundo?: string;
}

/**
 * Uma tela feita de um SVG de cena inteira (390 x 780), com a casinha e a
 * lua opcionais e os utilitários que todas as telas usam.
 */
export function telaSvg(conteudo: string, o: OpcoesTela = {}): TelaSvg {
  const el = document.createElement('div');
  el.className = 'tela';
  /* o fundo da tela segue a cor da cena, para as faixas dos lados não aparecerem */
  const corDeFundo = o.fundo ?? /^<rect width="390" height="780" fill="(#[0-9a-fA-F]{3,8})"/.exec(conteudo)?.[1];
  if (corDeFundo) el.style.background = corDeFundo;
  const svg = cena(conteudo + (o.casinha ? casinha() : '') + (o.lua ? lua() : ''));
  el.appendChild(svg);
  /* a mãozinha só mostra: nunca fica na frente do que ela vai tocar */
  const camadaMao = svgEl('<g class="camada-mao" style="pointer-events:none"></g>');
  svg.appendChild(camadaMao);
  const limpezas: (() => void)[] = [];

  const alvo: TelaSvg['alvo'] = (seletor, ao, semTrava = false) => {
    /* 'svg' é a cena inteira: toque em qualquer lugar */
    const nos = seletor === 'svg' ? [svg] : [...svg.querySelectorAll(seletor)];
    nos.forEach((n) => {
      limpezas.push(tocavel(n, (ev) => ao(ev, n), { semTrava }));
    });
  };

  if (o.casinha) {
    alvo('.casinha', () => {
      travar(400);
      if (typeof o.casinha === 'function') o.casinha();
      else void sessao.voltarParaCasa();
    });
  }
  if (o.lua) {
    const luaEl = svg.querySelector('.lua-pais');
    if (luaEl) limpezas.push(segurar(luaEl, 2000, () => void ir('pais')));
  }

  /* toque em algo que não faz nada: um sininho baixinho. Nada parece quebrado. */
  const fundo = (ev: Event) => {
    const t = ev.target as Element;
    if (t.closest('.alvo') || t.closest('.lua-pais')) return;
    if (!audio.pronto) void audio.tentarDestravar();
    tiquinho();
  };
  svg.addEventListener('pointerdown', fundo);
  limpezas.push(() => svg.removeEventListener('pointerdown', fundo));

  const comemorar = (x: number, y: number) => {
    const g = svgEl(`<g>${centelhas(x, y)}</g>`);
    svg.appendChild(g);
    centelhasSom();
    void esperar(1400).then(() => g.remove());
  };

  const mao: TelaSvg['mao'] = (p, rot = -15) => {
    camadaMao.innerHTML = p ? maozinha(p[0], p[1], 1.1, rot) : '';
  };

  return {
    el,
    svg,
    alvo,
    comemorar,
    mao,
    ponto: (ev) => pontoNoSvg(svg, ev.clientX, ev.clientY),
    aoDestruir: (f) => limpezas.push(f),
    destruir: () => {
      for (const l of limpezas) l();
    },
  };
}

/** Move um elemento do svg com transição suave (transform em CSS). */
export function mover(el: Element, x: number, y: number, ms = 600, escala = 1): void {
  const e = el as SVGElement;
  e.style.transformBox = 'fill-box';
  e.style.transformOrigin = 'center';
  e.style.transition = `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1), opacity ${ms}ms`;
  e.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
}

export function sumir(el: Element, ms = 600): void {
  const e = el as SVGElement;
  e.style.transition = `opacity ${ms}ms`;
  e.style.opacity = '0';
}

/** Um relógio de ociosidade para a ajuda: chama `tick(dt)` a cada segundo enquanto a tela vive. */
export function relogioDeAjuda(tela: TelaSvg, tick: (dt: number) => void): void {
  const id = window.setInterval(() => tick(1), 1000);
  tela.aoDestruir(() => window.clearInterval(id));
}

/**
 * Um elemento do svg que se arrasta com o primeiro dedo. `aoSoltar` recebe o
 * deslocamento e devolve true se o elemento fica onde soltou; senão volta.
 */
export function arrastavel(svg: SVGSVGElement, el: SVGGElement, aoSoltar: (dx: number, dy: number) => boolean | void): void {
  let id = -1;
  let x0 = 0;
  let y0 = 0;
  el.addEventListener('pointerdown', (ev) => {
    if (!reivindicarDedo(ev.pointerId)) return;
    id = ev.pointerId;
    [x0, y0] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    el.style.transition = 'none';
    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      /* sem captura, a janela libera o dedo */
    }
  });
  el.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== id) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    el.style.transform = `translate(${x - x0}px, ${y - y0}px)`;
  });
  const fim = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    soltarDedo(id);
    id = -1;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const ficou = aoSoltar(x - x0, y - y0);
    if (!ficou) mover(el, 0, 0, 400);
  };
  el.addEventListener('pointerup', fim);
  el.addEventListener('pointercancel', fim);
  el.classList.add('alvo');
}

/**
 * Cordas para dedilhar: o dedo desce em qualquer lugar e, ao passar por cima
 * de cada corda (posições x no espaço da cena), ela soa. Um toque parado numa
 * corda também soa. `aoTocar` recebe o índice da corda.
 */
export function dedilhar(svg: SVGSVGElement, xs: number[], faixaY: [number, number], aoTocar: (i: number) => void): () => void {
  let id = -1;
  let ultimoX: number | null = null;
  const cordaEm = (x: number) => {
    let melhor = -1;
    let d = Infinity;
    xs.forEach((cx, i) => {
      const dd = Math.abs(cx - x);
      if (dd < d) {
        d = dd;
        melhor = i;
      }
    });
    return d < 26 ? melhor : -1;
  };
  const baixo = (ev: PointerEvent) => {
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (y < faixaY[0] || y > faixaY[1]) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    id = ev.pointerId;
    ultimoX = x;
    const i = cordaEm(x);
    if (i >= 0) aoTocar(i);
    try {
      svg.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  };
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== id || ultimoX === null) return;
    const [x] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const a = Math.min(ultimoX, x);
    const b = Math.max(ultimoX, x);
    xs.forEach((cx, i) => {
      if (cx > a && cx <= b && Math.abs(x - ultimoX!) > 1) aoTocar(i);
    });
    ultimoX = x;
  };
  const cima = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    soltarDedo(id);
    id = -1;
    ultimoX = null;
  };
  svg.addEventListener('pointerdown', baixo);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', cima);
  svg.addEventListener('pointercancel', cima);
  return () => {
    svg.removeEventListener('pointerdown', baixo);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', cima);
    svg.removeEventListener('pointercancel', cima);
  };
}

/* ---------- as pedrinhas ---------- */

const COR_PEDRINHA = ['#f2a9c4', '#c6a15b', '#9fc3cf', '#ebd9a8', '#a58bc4'];

/** Uma pedrinha desenhada: uma pedra lisa de rio, um brilho. */
export function pedrinha(x: number, y: number, s: number, i = 0): string {
  return `<g><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.78}" fill="${COR_PEDRINHA[i % COR_PEDRINHA.length]}"/><ellipse cx="${x - s * 0.3}" cy="${y - s * 0.3}" rx="${s * 0.3}" ry="${s * 0.18}" fill="#fbf8f1" opacity="0.6"/></g>`;
}

/** `n` pedrinhas sobem de um ponto da cena, com um tique cada: ela ganhou. */
export function pedrinhasSobem(tela: TelaSvg, n: number, x: number, y: number): void {
  let s = '';
  for (let i = 0; i < n; i++) s += `<g class="sobe" style="animation-delay:${i * 120}ms">${pedrinha(x + (i - (n - 1) / 2) * 22, y, 9, i)}</g>`;
  const g = svgEl(`<g>${s}</g>`);
  tela.svg.appendChild(g);
  for (let i = 0; i < n; i++) void esperar(i * 120).then(() => toc(520 + i * 40, 0.14));
  void esperar(1600).then(() => g.remove());
}

/** Uma pedrinha rola para fora, devagar, sem som de erro: um combinado não aconteceu. */
export function pedrinhaRola(tela: TelaSvg, x: number, y: number): void {
  const g = svgEl(`<g>${pedrinha(x, y, 9, 1)}</g>`);
  tela.svg.appendChild(g);
  toc(260, 0.1);
  requestAnimationFrame(() => mover(g, 120, 300, 1400, 0.8));
  void esperar(1500).then(() => g.remove());
}
