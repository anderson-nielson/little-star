import { mover, telaSvg } from './comum';
import { estado, mudar, type Quem } from '@/core/estado';
import { carimbosDoBilhete } from '@/core/laco';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { arco, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { anunciar } from '@/core/narracao';
import { falarPalavra } from '@/audio/fala';
import { notaAgora, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const SOM_DA_LETRA: Record<string, string> = { A: 'som_a', E: 'som_e', O: 'som_o', S: 'som_s', L: 'som_l', M: 'som_m', U: 'som_u', I: 'som_i', T: 'som_t' };
const MAXIMO = 8;

/**
 * O bilhetinho: as vogais (que ela já sabe) e as letras que ela traçou são
 * carimbos. Ela toca nos carimbos, as letras vão para o papel rosa, e entrega para a mãe, o pai ou o Theo, que
 * lê em voz alta o que ela "escreveu", mesmo que seja SSTAEL. Os bilhetes
 * ficam guardados e os pais veem no cantinho.
 */
export function telaBilhete(): Tela {
  const e = estado();
  const letras = carimbosDoBilhete(e.letras);
  let texto = '';
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  /* o papel rosa */
  s += `<g class="papel" data-alvo="papel">${arco(55, 80, 280, 200, '#fbf8f1', '#c6a15b')}<rect x="55" y="120" width="280" height="160" fill="#f2a9c4" opacity="0.25"/><text class="texto" x="195" y="230" text-anchor="middle" font-family="Jost, sans-serif" font-size="46" font-weight="500" letter-spacing="4" fill="#6e1a27"></text></g>`;
  /* os carimbos */
  s += `<g class="carimbos">`;
  letras.forEach((l, i) => {
    const x = 70 + (i % 3) * 125;
    const y = 370 + Math.floor(i / 3) * 90;
    s += `<g data-carimbo="${l}"><circle cx="${x}" cy="${y}" r="38" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><text x="${x}" y="${y + 14}" text-anchor="middle" font-family="Jost, sans-serif" font-size="40" font-weight="500" fill="#f2a9c4">${l}</text></g>`;
  });
  s += `</g>`;
  /* para quem: a mãe, o pai e o Theo esperam embaixo */
  s += `<g data-para="mae"><circle cx="80" cy="690" r="46" fill="transparent"/>${familia.mae(80, 740, 120).svg}</g>`;
  s += `<g data-para="pai"><circle cx="195" cy="690" r="46" fill="transparent"/>${familia.pai(195, 740, 126).svg}</g>`;
  s += `<g data-para="theo"><circle cx="310" cy="700" r="46" fill="transparent"/>${familia.theo(310, 742, 96).svg}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  tocarFundo('preludio_bach');
  const textoEl = svg.querySelector('.texto') as SVGTextElement;
  let entregue = false;

  tela.alvo('[data-carimbo]', (_ev, el) => {
    if (entregue || texto.length >= MAXIMO) {
      toc(400, 0.1);
      return;
    }
    const l = el.getAttribute('data-carimbo')!;
    texto += l;
    textoEl.textContent = texto;
    toc(600, 0.15);
    notaAgora(60 + texto.length * 2, 0.5, 0.25);
    mover(el, 0, -4, 120);
    void esperar(140).then(() => mover(el, 0, 0, 240));
    const som = SOM_DA_LETRA[l];
    if (som && temVoz(som)) void falar(som);
  });
  /* tocar no papel tira a última letra */
  tela.alvo('[data-alvo="papel"]', () => {
    if (entregue || !texto) return;
    texto = texto.slice(0, -1);
    textoEl.textContent = texto;
    toc(300, 0.12);
  });
  tela.alvo('[data-para]', async (_ev, el) => {
    if (entregue || !texto) {
      toc(400, 0.1);
      return;
    }
    entregue = true;
    const quem = el.getAttribute('data-para') as Quem;
    travar(6000);
    const papel = svg.querySelector('.papel') as SVGGElement;
    const alvoX = { mae: 80, pai: 195, theo: 310 }[quem];
    mover(papel, alvoX - 195, 420, 900, 0.4);
    sininho();
    mudar((x) => {
      x.bilhetes.push({ para: quem, letras: texto, dia: x.hoje.dia });
    });
    await esperar(1000);
    if (temVoz('bilhete_' + quem)) await falar('bilhete_' + quem);
    /* quem recebe lê em voz alta o que ela escreveu, letra a letra e depois junto */
    await falarPalavra([...texto].join(' '), 0.6);
    await falarPalavra(texto, 0.7);
    tela.comemorar(alvoX, 640);
    anunciar('bilhete');
    /* o abraço */
    const g = el as SVGGElement;
    g.innerHTML = quem === 'theo' ? familia.theo(alvoX, 742, 96, 'abraca').svg : quem === 'mae' ? familia.mae(alvoX, 740, 120, 'abraca').svg : familia.pai(alvoX, 740, 126, 'abraca').svg;
    await esperar(2200);
    void ir('casa');
  });
  return tela;
}
