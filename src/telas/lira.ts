import { dedilhar, telaSvg } from './comum';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { arco, veu } from '@/puppet/objetos';
import { pararFundo } from '@/audio/musica';
import { lira, PENTATONICA } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const NOTAS = PENTATONICA.slice(0, 7);
const XS = NOTAS.map((_n, i) => 75 + i * 40);

/**
 * A lira pendurada no quarto: sete cordas na pentatônica (ré, mi, sol, lá,
 * si, ré, mi). Tocar numa corda toca uma nota; o dedo deslizando toca várias.
 * Nenhuma combinação soa feia: é o clima da quinta do jardim Waldorf.
 */
export function telaLira(): Tela {
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += arco(40, 180, 310, 480, '#fbf8f1', '#c6a15b');
  s += `<path d="M70 640q125 60 250 0" fill="none" stroke="#c9a189" stroke-width="18" stroke-linecap="round"/><path d="M70 640V330a125 125 0 0 1 250 0v310" fill="none" stroke="#c9a189" stroke-width="14"/>`;
  s += `<rect x="60" y="250" width="270" height="14" rx="6" fill="#c9a189"/>`;
  XS.forEach((x, i) => {
    s += `<line class="corda" data-corda="${i}" x1="${x}" y1="262" x2="${x}" y2="${600 + Math.sin((i / 6) * Math.PI) * 40}" stroke="#c6a15b" stroke-width="${3.5 - i * 0.25}" stroke-linecap="round"/><circle cx="${x}" cy="257" r="5" fill="#8f6f2c"/>`;
  });
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  pararFundo();
  const soa = (i: number) => {
    lira(NOTAS[i]!, undefined, 0.45);
    const c = svg.querySelector(`[data-corda="${i}"]`) as SVGElement;
    c.setAttribute('stroke', '#f2a9c4');
    c.setAttribute('stroke-width', '6');
    void esperar(180).then(() => {
      c.setAttribute('stroke', '#c6a15b');
      c.setAttribute('stroke-width', String(3.5 - i * 0.25));
    });
  };
  tela.aoDestruir(dedilhar(svg, XS, [250, 660], soa));
  /* a lira sobe quando ela entra: começou uma coisa nova */
  void esperar(400).then(() => [0, 2, 3, 5].forEach((i, k) => void esperar(k * 160).then(() => soa(i))));
  return tela;
}
