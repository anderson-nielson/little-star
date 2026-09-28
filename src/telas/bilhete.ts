import { convidarParaCasa, mover, telaSvg } from './comum';
import { guiar, type Gesto } from './guia';
import { estado, mudar, type Quem } from '@/core/estado';
import { carimbosDoBilhete } from '@/core/laco';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { arco, contornoLuz, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { falarSomDaLetra } from '@/audio/fonemas';
import { anunciar } from '@/core/narracao';
import { falarPalavra } from '@/audio/fala';
import { notaAgora, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const MAXIMO = 8;

/**
 * O bilhetinho: as vogais (que ela já sabe) e as letras que ela traçou são
 * carimbos. Ela toca nos carimbos, as letras vão para o papel rosa, e entrega para a mãe, o pai ou o Theo, que
 * lê em voz alta o que ela "escreveu", mesmo que seja SSTAEL. Os bilhetes
 * ficam guardados e os pais veem no cantinho.
 *
 * Sozinha, ela carimbava e não sabia que o bilhete se entrega: nada mostrava
 * que a família recebe. Agora a mãozinha toca num carimbo na entrada; com a
 * primeira letra no papel, a família acende e a mãozinha, se ela parar, toca
 * na mãe. Com o papel cheio, mostra a mãe na hora.
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
  /* a luz da família, acesa só quando já tem o que entregar */
  s += `<g class="luz-familia" style="pointer-events:none;opacity:0;transition:opacity 400ms">${contornoLuz(80, 680, 52, 60)}${contornoLuz(195, 680, 54, 62)}${contornoLuz(310, 690, 48, 54)}</g>`;
  s += `<g data-para="mae"><circle cx="80" cy="690" r="46" fill="transparent"/>${familia.mae(80, 740, 120).svg}</g>`;
  s += `<g data-para="pai"><circle cx="195" cy="690" r="46" fill="transparent"/>${familia.pai(195, 740, 126).svg}</g>`;
  s += `<g data-para="theo"><circle cx="310" cy="700" r="46" fill="transparent"/>${familia.theo(310, 742, 96).svg}</g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('preludio_bach');
  const textoEl = svg.querySelector('.texto') as SVGTextElement;
  let entregue = false;
  const luzFamilia = svg.querySelector('.luz-familia') as SVGGElement;
  const acenderFamilia = () => {
    luzFamilia.style.opacity = texto && !entregue ? '1' : '0';
  };
  /* sem letra, a mãozinha toca num carimbo; com letra, toca na mãe: o bilhete se entrega */
  const noCarimbo: Gesto = { tipo: 'tocar', em: [70, 366] };
  const naMae: Gesto = { tipo: 'tocar', em: [80, 668] };
  const guia = guiar(tela, {
    atraso: 1000,
    proximo: () => (entregue ? null : texto ? naMae : noCarimbo),
  });

  tela.alvo('[data-carimbo]', (_ev, el) => {
    if (entregue || texto.length >= MAXIMO) {
      toc(400, 0.1);
      /* o papel está cheio: a mãozinha mostra para quem entregar, sem esperar */
      if (!entregue) guia.mostrar();
      return;
    }
    const l = el.getAttribute('data-carimbo')!;
    texto += l;
    textoEl.textContent = texto;
    toc(600, 0.15);
    notaAgora(60 + texto.length * 2, 0.5, 0.25);
    mover(el, 0, -4, 120);
    void esperar(140).then(() => mover(el, 0, 0, 240));
    void falarSomDaLetra(l);
    acenderFamilia();
    guia.passo();
    if (texto.length >= MAXIMO) void esperar(700).then(() => guia.mostrar());
  });
  /* tocar no papel tira a última letra */
  tela.alvo('[data-alvo="papel"]', () => {
    if (entregue || !texto) return;
    texto = texto.slice(0, -1);
    textoEl.textContent = texto;
    toc(300, 0.12);
    acenderFamilia();
  });
  tela.alvo('[data-para]', async (_ev, el) => {
    if (entregue || !texto) {
      toc(400, 0.1);
      return;
    }
    entregue = true;
    guia.calar();
    acenderFamilia();
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
    /* quem recebe lê em voz alta o que ela escreveu, som a som (nunca o nome da letra) e depois junto */
    for (const l of texto) {
      if (!(await falarSomDaLetra(l))) await esperar(300);
      await esperar(180);
    }
    await falarPalavra(texto);
    tela.comemorar(alvoX, 640);
    anunciar('bilhete');
    /* o abraço */
    const g = el as SVGGElement;
    g.innerHTML = quem === 'theo' ? familia.theo(alvoX, 742, 96, 'abraca').svg : quem === 'mae' ? familia.mae(alvoX, 740, 120, 'abraca').svg : familia.pai(alvoX, 740, 126, 'abraca').svg;
    await esperar(1500);
    if (tela.el.isConnected) convidarParaCasa(tela);
  });
  return tela;
}
