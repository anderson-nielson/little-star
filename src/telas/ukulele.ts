import { dedilhar, mover, telaSvg } from './comum';
import { estado } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { familia, figurinoDe } from '@/puppet/boneco';
import { contornoLuz, veu } from '@/puppet/objetos';
import { pararFundo } from '@/audio/musica';
import { lira } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** três acordes, três cores: as notas de cada corda (sol, dó, mi, lá) em cada acorde */
export const ACORDES: { cor: string; notas: number[] }[] = [
  { cor: '#f2a9c4', notas: [67, 60, 64, 72] },
  { cor: '#c6a15b', notas: [69, 60, 65, 69] },
  { cor: '#8fae6b', notas: [67, 62, 65, 71] },
];
const CORDAS_X = [135, 175, 215, 255];

/**
 * O ukulele rosa: passar o dedo nas quatro cordas dá um acorde (corda
 * dedilhada, Karplus-Strong). Três botões grandes de cor trocam o acorde. As
 * bonecas da estante balançam. Nenhuma combinação soa feia.
 */
export function telaUkulele(): Tela {
  const e = estado();
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<rect x="60" y="150" width="270" height="6" fill="#c9a189"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(90 + i * 54, 150, 44, i, figurinoDe(e.figurinos[String(i)])).svg}</g>`;
  /* o corpo do ukulele: dois círculos, o braço, a boca */
  s += `<rect x="175" y="200" width="40" height="150" rx="8" fill="#c9a189"/><rect x="170" y="190" width="50" height="30" rx="8" fill="#b08a70"/>`;
  s += `<circle cx="195" cy="470" r="110" fill="#f2a9c4"/><circle cx="195" cy="600" r="130" fill="#f2a9c4"/><circle cx="195" cy="510" r="40" fill="#6e1a27" opacity="0.8"/>`;
  s += `<rect x="150" y="640" width="90" height="16" rx="5" fill="#c9a189"/>`;
  CORDAS_X.forEach((x, i) => {
    s += `<line class="corda" data-corda="${i}" x1="${x}" y1="200" x2="${x}" y2="648" stroke="#fbf8f1" stroke-width="${3 + (3 - i) * 0.6}" stroke-linecap="round"/>`;
  });
  /* os botões dos acordes */
  ACORDES.forEach((a, i) => {
    s += `<g data-acorde="${i}"><circle cx="${90 + i * 105}" cy="720" r="38" fill="${a.cor}" opacity="0.9"/></g>`;
  });
  s += `<g class="luz">${contornoLuz(90, 720, 44, 44)}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  pararFundo();
  let acorde = 0;
  const luz = svg.querySelector('.luz') as SVGGElement;

  const soa = (i: number) => {
    lira(ACORDES[acorde]!.notas[i]!, undefined, 0.45);
    const c = svg.querySelector(`[data-corda="${i}"]`) as SVGElement;
    c.style.transition = 'none';
    c.setAttribute('stroke', ACORDES[acorde]!.cor);
    void esperar(160).then(() => c.setAttribute('stroke', '#fbf8f1'));
    svg.querySelectorAll('.boneca').forEach((b, k) => {
      mover(b, 0, -4, 120 + k * 30);
      void esperar(160 + k * 30).then(() => mover(b, 0, 0, 260));
    });
  };
  tela.aoDestruir(dedilhar(svg, CORDAS_X, [200, 650], soa));
  tela.alvo(
    '[data-acorde]',
    (_ev, el) => {
      acorde = Number(el.getAttribute('data-acorde'));
      luz.innerHTML = contornoLuz(90 + acorde * 105, 720, 44, 44);
      /* o acorde inteiro soa uma vez, de baixo para cima */
      ACORDES[acorde]!.notas.forEach((_n, i) => void esperar(i * 70).then(() => soa(i)));
    },
    true,
  );
  return tela;
}
