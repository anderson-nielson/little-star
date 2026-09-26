import { dedilhar, mover, telaSvg } from './comum';
import { estado } from '@/core/estado';
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
/** até onde vai o braço desenhado: a casa mais alta que um acorde usa */
export const CASAS = 4;

/**
 * O campo harmônico de dó maior, as tríades de cada grau nas posições que
 * todo método de ukulele ensina, e a cor de cada botão:
 *
 *   dó 0003 · ré menor 2210 · mi menor 0432 · fá 2010 · sol 0232 ·
 *   lá menor 2000 · si diminuto 4212
 *
 * (os números são as casas apertadas nas cordas sol, dó, mi, lá). `notas` é o
 * que cada corda soa com o acorde apertado.
 */
export const ACORDES: { nome: string; cor: string; casas: number[]; notas: number[] }[] = (
  [
    ['dó', '#f2a9c4', [0, 0, 0, 3]],
    ['ré menor', '#eea38a', [2, 2, 1, 0]],
    ['mi menor', '#e7c86e', [0, 4, 3, 2]],
    ['fá', '#c6a15b', [2, 0, 1, 0]],
    ['sol', '#8fae6b', [0, 2, 3, 2]],
    ['lá menor', '#9cc3dd', [2, 0, 0, 0]],
    ['si diminuto', '#b9a3d6', [4, 2, 1, 2]],
  ] as const
).map(([nome, cor, casas]) => ({ nome, cor, casas: [...casas], notas: casas.map((c, i) => AFINACAO[i]! + c) }));
/** o meio de cada casa no braço desenhado, onde o dedo aperta (casa 1 a 4) */
const CASA_Y = [0, 241, 270, 297, 322];
/**
 * Os sete botões num arco em volta do corpo, do dó à esquerda ao si à
 * direita, passando por baixo: a escada do campo harmônico.
 */
const BOTAO_R = 30;
const botao = (i: number): [number, number] => {
  const a = Math.PI - (i * Math.PI) / (ACORDES.length - 1);
  return [Math.round(195 + 145 * Math.cos(a)), Math.round(570 + 145 * Math.sin(a))];
};
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
 * nas cordas soltas dá o som da afinação; um dos sete botões de cor aperta um
 * acorde do campo harmônico de dó (corda dedilhada, Karplus-Strong). As bonecas da estante balançam.
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
    const [x, y] = botao(i);
    s += `<g data-acorde="${i}" aria-label="${a.nome}"><circle cx="${x}" cy="${y}" r="${BOTAO_R}" fill="${a.cor}" opacity="0.9" stroke="#fbf8f1" stroke-width="3"/></g>`;
  });
  s += `<g class="dedos"></g><g class="luz"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  pararFundo();
  /* sem botão apertado, as cordas soam soltas: a afinação */
  let acorde = -1;
  const luz = svg.querySelector('.luz') as SVGGElement;
  const dedos = svg.querySelector('.dedos') as SVGGElement;
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
      const [x, y] = botao(acorde);
      luz.innerHTML = contornoLuz(x, y, BOTAO_R + 6, BOTAO_R + 6);
      /* os dedos aparecem no braço, onde apertariam de verdade */
      const a = ACORDES[acorde]!;
      dedos.innerHTML = a.casas
        .map((c, i) => (c > 0 ? `<circle cx="${CORDAS_X[i]}" cy="${CASA_Y[c]}" r="9" fill="${a.cor}" stroke="#fbf8f1" stroke-width="2.5"/>` : ''))
        .join('');
      /* o acorde inteiro soa uma vez, de cima para baixo */
      ACORDES[acorde]!.notas.forEach((_n, i) => void esperar(i * 70).then(() => soa(i)));
    },
    true,
  );
  /* ao entrar, as cordas soltas uma a uma: sol, dó, mi, lá */
  void esperar(400).then(() => AFINACAO.forEach((_n, i) => void esperar(i * 160).then(() => soa(i))));
  return tela;
}
