import { dedilhar, mover, telaSvg } from './comum';
import { estado } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { familia, figurinoDe } from '@/puppet/boneco';
import { contornoLuz, veu } from '@/puppet/objetos';
import { pararFundo } from '@/audio/musica';
import { lira } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/**
 * A afinação padrão do ukulele, da corda de cima para a de baixo: sol4, dó4,
 * mi4, lá4 (a primeira corda é a mais aguda das três primeiras: afinação
 * reentrante, o "my dog has fleas"). Solta, cada corda soa nessa nota.
 */
export const AFINACAO = [67, 60, 64, 69];
/** quantas casas, no máximo, um dedo de cinco anos aperta */
export const CASAS = 3;

/**
 * Três acordes, três cores: dó maior, fá maior e sol com sétima, nas posições
 * de verdade do ukulele (cada nota é a corda solta ou até três casas acima).
 */
export const ACORDES: { nome: string; cor: string; notas: number[] }[] = [
  { nome: 'dó', cor: '#f2a9c4', notas: [67, 60, 64, 72] },
  { nome: 'fá', cor: '#c6a15b', notas: [69, 60, 65, 69] },
  { nome: 'sol', cor: '#8fae6b', notas: [67, 62, 65, 71] },
];
const CORDAS_X = [150, 180, 210, 240];
const PESTANA_Y = 226;
const CAVALETE_Y = 634;
const CORDA_COR = '#fbf8f1';
const MADEIRA = '#c9a189';
const MADEIRA_ESCURA = '#a97e63';
const ROSA = '#f2a9c4';
const ROSA_ESCURO = '#e98fb2';

/**
 * O ukulele rosa: quatro cordas afinadas em sol, dó, mi, lá. Passar o dedo
 * nas cordas soltas dá o som da afinação; um dos três botões de cor aperta um
 * acorde (corda dedilhada, Karplus-Strong). As bonecas da estante balançam.
 * Nenhuma combinação soa feia.
 */
export function telaUkulele(): Tela {
  const e = estado();
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<rect x="60" y="150" width="270" height="6" fill="${MADEIRA}"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(90 + i * 54, 150, 44, i, figurinoDe(e.figurinos[String(i)])).svg}</g>`;
  /* a mão do ukulele: quatro cravelhas, duas de cada lado */
  s += `<rect x="147" y="172" width="96" height="56" rx="14" fill="${MADEIRA_ESCURA}"/>`;
  [190, 212].forEach((y) => {
    s += `<circle cx="141" cy="${y}" r="6" fill="#8f6f2c"/><circle cx="249" cy="${y}" r="6" fill="#8f6f2c"/>`;
  });
  /* o braço com os trastes, e a pestana */
  s += `<rect x="137" y="222" width="116" height="250" rx="6" fill="${MADEIRA}"/>`;
  [256, 284, 310, 334, 356, 376].forEach((y) => {
    s += `<line x1="137" y1="${y}" x2="253" y2="${y}" stroke="#ebd9a8" stroke-width="2"/>`;
  });
  s += `<circle cx="195" cy="345" r="4" fill="#ebd9a8"/>`;
  s += `<rect x="137" y="${PESTANA_Y - 4}" width="116" height="7" rx="2" fill="#fbf8f1"/>`;
  /* o corpo em oito, com cintura: a boca redonda com a roseta, e o cavalete */
  s += `<circle cx="195" cy="445" r="84" fill="${ROSA}"/><circle cx="195" cy="570" r="112" fill="${ROSA}"/>`;
  s += `<circle cx="195" cy="510" r="38" fill="none" stroke="${ROSA_ESCURO}" stroke-width="4"/><circle cx="195" cy="510" r="30" fill="#6e1a27" opacity="0.8"/>`;
  s += `<rect x="150" y="${CAVALETE_Y - 6}" width="90" height="14" rx="5" fill="${MADEIRA}"/><rect x="150" y="${CAVALETE_Y - 8}" width="90" height="4" rx="2" fill="#fbf8f1"/>`;
  CORDAS_X.forEach((x, i) => {
    s += `<line class="corda" data-corda="${i}" x1="${x}" y1="${PESTANA_Y}" x2="${x}" y2="${CAVALETE_Y}" stroke="${CORDA_COR}" stroke-width="${2.6 + (3 - i) * 0.5}" stroke-linecap="round"/>`;
  });
  /* os botões dos acordes */
  ACORDES.forEach((a, i) => {
    s += `<g data-acorde="${i}"><circle cx="${90 + i * 105}" cy="734" r="36" fill="${a.cor}" opacity="0.9"/></g>`;
  });
  s += `<g class="luz"></g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  pararFundo();
  /* sem botão apertado, as cordas soam soltas: a afinação */
  let acorde = -1;
  const luz = svg.querySelector('.luz') as SVGGElement;
  const notas = () => (acorde < 0 ? AFINACAO : ACORDES[acorde]!.notas);
  const cor = () => (acorde < 0 ? ROSA_ESCURO : ACORDES[acorde]!.cor);

  const soa = (i: number) => {
    lira(notas()[i]!, undefined, 0.45);
    const c = svg.querySelector(`[data-corda="${i}"]`) as SVGElement;
    c.style.transition = 'none';
    c.setAttribute('stroke', cor());
    void esperar(160).then(() => c.setAttribute('stroke', CORDA_COR));
    svg.querySelectorAll('.boneca').forEach((b, k) => {
      mover(b, 0, -4, 120 + k * 30);
      void esperar(160 + k * 30).then(() => mover(b, 0, 0, 260));
    });
  };
  tela.aoDestruir(dedilhar(svg, CORDAS_X, [PESTANA_Y, 660], soa));
  tela.alvo(
    '[data-acorde]',
    (_ev, el) => {
      acorde = Number(el.getAttribute('data-acorde'));
      luz.innerHTML = contornoLuz(90 + acorde * 105, 734, 42, 42);
      /* o acorde inteiro soa uma vez, de cima para baixo */
      ACORDES[acorde]!.notas.forEach((_n, i) => void esperar(i * 70).then(() => soa(i)));
    },
    true,
  );
  /* ao entrar, as cordas soltas uma a uma: sol, dó, mi, lá */
  void esperar(400).then(() => AFINACAO.forEach((_n, i) => void esperar(i * 160).then(() => soa(i))));
  return tela;
}
