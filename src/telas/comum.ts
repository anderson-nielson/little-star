import { cena, esperar, pontoNoSvg, svgEl } from '@/core/util';
import { segurar, tocavel, travar } from '@/core/toque';
import { ir } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { casinha, centelhas, lua, maozinha } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { centelhasSom, tiquinho } from '@/audio/synth';
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
  if (o.fundo) el.style.background = o.fundo;
  const svg = cena(conteudo + (o.casinha ? casinha() : '') + (o.lua ? lua() : ''));
  el.appendChild(svg);
  const camadaMao = svgEl('<g class="camada-mao"></g>');
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
