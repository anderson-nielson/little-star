import { mover, puxavel, quadroDePassos, relogioDeAjuda, telaSvg } from './comum';
import { coelhinhoDePano, entrarNoCuidado, gesto, terminarCuidado, ursinho } from './cuidados';
import { estado } from '@/core/estado';
import { AFOFADAS, alisar, foiLongeOBastante, PASSOS, type PassoDaCama } from '@/core/cuidados';
import { Ajuda } from '@/core/ajuda';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { esperar, pontoNoSvg } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, contornoLuz, gato, nuvem, veu } from '@/puppet/objetos';
import { pararFundo, tocarFundo } from '@/audio/musica';
import { lira, sininho, tiquinho, toc } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import type { Tela } from '@/core/roteador';

type Item = 'travesseiro' | 'coelho' | 'ursinho' | 'bola';
type Onde = 'ini' | 'fora' | 'fim';

/**
 * Como a cama amanhece: o travesseiro torto no meio da cama, o coelhinho com
 * quem ela dormiu deitado de lado, o ursinho e a bola caídos no chão. `ini` é
 * onde a noite deixou, `fora` é a cadeira (o que sai da cama espera ali), `fim`
 * é o lugar arrumado. `giro` é o quanto está torto de manhã.
 */
const LUGAR: Record<Item, { ini: [number, number]; fora?: [number, number]; fim: [number, number]; giro: number }> = {
  travesseiro: { ini: [178, 452], fora: [322, 632], fim: [88, 452], giro: 22 },
  coelho: { ini: [252, 488], fora: [350, 742], fim: [180, 468], giro: -68 },
  ursinho: { ini: [178, 722], fim: [142, 466], giro: 38 },
  bola: { ini: [128, 690], fim: [236, 728], giro: 0 },
};
/** o que a cama tem em cima de manhã, e o que volta para o lugar no fim */
const EM_CIMA: Item[] = ['travesseiro', 'coelho'];
const DE_VOLTA: Item[] = ['coelho', 'ursinho', 'bola'];
/** as rugas do lençol esticado, em x; a coberta dobrada no pé fica depois da última */
const RUGAS = [112, 172, 232];
/** o lençol esticado vai de x 52 a 338; de manhã está embolado no canto da cabeceira */
const LENCOL_X = 52;
const LENCOL_W = 286;
const EMBOLADO = 62 / LENCOL_W;
/** a coberta aberta vai de x 120 a 338; de manhã está embolada no pé, torta e caindo pelo lado */
const COBERTA_X = 120;
const COBERTA_W = 218;
const DOBRADA = 76 / COBERTA_W;
const TORTA = -9;

const ICONES: Record<PassoDaCama, (x: number, y: number) => string> = {
  tirar: (x, y) => `<rect x="${x - 10}" y="${y + 2}" width="20" height="7" rx="3" fill="#f2a9c4"/><rect x="${x - 7}" y="${y - 7}" width="14" height="7" rx="3" fill="#fbf8f1" stroke="#c9a189" stroke-width="1" transform="rotate(18 ${x} ${y - 4})"/><path d="M${x + 6} ${y - 4}q7 -6 4 -11" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round"/><path d="M${x + 7} ${y - 16}l3 1l-1 3" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round"/>`,
  lencol: (x, y) => `<rect x="${x - 11}" y="${y - 7}" width="22" height="14" rx="3" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M${x - 7} ${y}h14" stroke="#c9a189" stroke-width="1.2"/><path d="M${x - 8} ${y - 11}h14M${x + 3} ${y - 14}l3 3l-3 3" fill="none" stroke="#c6a15b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  coberta: (x, y) => `<rect x="${x - 4}" y="${y - 7}" width="15" height="14" rx="3" fill="#f2a9c4"/><path d="M${x - 5} ${y}h-7M${x - 9} ${y - 3}l-3 3l3 3" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  travesseiro: (x, y) => `<rect x="${x - 10}" y="${y - 5}" width="20" height="11" rx="5" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M${x - 12} ${y - 9}l-2 -2M${x} ${y - 10}v-3M${x + 12} ${y - 9}l2 -2" stroke="#c6a15b" stroke-width="1.4" stroke-linecap="round"/>`,
  bichinhos: (x, y) => ursinho(x - 3, y + 9, 18) + `<circle cx="${x + 9}" cy="${y + 5}" r="4" fill="#ebd9a8"/><path d="M${x + 9} ${y + 1}q-3 4 0 8" fill="none" stroke="#f2a9c4" stroke-width="1.4"/>`,
};

function bola(x: number, y: number, s: number): string {
  return `<circle cx="${x}" cy="${y}" r="${s}" fill="#ebd9a8"/><path d="M${x} ${y - s}q${-s * 0.66} ${s} 0 ${2 * s}" fill="#f2a9c4"/><path d="M${x} ${y - s}q${s * 0.66} ${s} 0 ${2 * s}" fill="none" stroke="#7FA5B8" stroke-width="${s * 0.22}"/>`;
}

/**
 * Arrumar a cama de manhã, depois de uma noite bem dormida, passo a passo e na
 * ordem de verdade: tirar o travesseiro torto e o coelhinho que dormiu junto,
 * puxar o lençol embolado no canto e alisar as rugas, puxar a coberta do pé
 * até a cabeceira (ela está torta e caindo pelo lado), afofar o travesseiro com
 * três toques, e por fim o que caiu no chão: os bichinhos voltam para a cama e
 * a bola vai para o cesto. Lençol e coberta são pesados: soltou antes de chegar
 * perto, escorregam de volta devagar e a mãozinha mostra de novo. No fim, a
 * cama fica bonita e o gatinho sobe para deitar nela.
 */
export function telaCama(): Tela {
  const e = estado();
  entrarNoCuidado('cama');

  /* a manhã: o sol nascendo na janela e a luz dele entrando no quarto */
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 4, 0.28);
  s += arco(150, 170, 90, 110, '#f3e6c8') + `<circle cx="206" cy="268" r="18" fill="#ebd9a8"/><rect x="151" y="264" width="88" height="15" fill="#f3d9cf" opacity="0.8"/>` + nuvem(178, 222, 8);
  s += `<path d="M152 280L238 280L330 560L40 560z" fill="#fbf3d0" opacity="0.22"/>`;
  s += `<rect x="-400" y="600" width="1190" height="600" fill="#ebcdc3" opacity="0.75"/><ellipse cx="190" cy="700" rx="150" ry="34" fill="#f2a9c4" opacity="0.3"/>`;
  /* a cadeira, onde o que sai da cama espera, e o fundo do cestinho da bola */
  s += `<rect x="356" y="560" width="10" height="92" rx="3" fill="#c9a189"/><rect x="280" y="644" width="88" height="12" rx="4" fill="#c9a189"/><path d="M288 656v70M360 656v70" stroke="#c9a189" stroke-width="6" stroke-linecap="round"/>`;
  s += `<ellipse cx="236" cy="724" rx="24" ry="6" fill="#b08a70"/>`;
  /* a cama: cabeceira, pé, e o colchão à mostra onde o lençol saiu */
  s += `<rect x="30" y="330" width="22" height="270" rx="8" fill="#c9a189"/><rect x="338" y="420" width="18" height="180" rx="6" fill="#c9a189"/>`;
  s += `<rect x="48" y="500" width="294" height="58" rx="8" fill="#f3d9cf"/><rect x="44" y="556" width="302" height="14" rx="4" fill="#b08a70"/>`;
  s += `<rect x="52" y="426" width="286" height="84" rx="10" fill="#efd8cf" stroke="#e3c3b8" stroke-width="2"/>`;
  for (let x = 96; x < 338; x += 44) s += `<path d="M${x} 434v68" stroke="#e3c3b8" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.7"/>`;
  /* o lençol, embolado no canto da cabeceira: puxado, ele se estica e mostra as rugas */
  s += `<g class="lencol"><rect x="${LENCOL_X}" y="426" width="${LENCOL_W}" height="84" rx="10" fill="#fbf8f1" stroke="#ebcdc3" stroke-width="2"/>`;
  RUGAS.forEach((x, i) => {
    s += `<path data-ruga="${i}" d="M${x} 434q10 9 0 18q-10 9 0 18q10 9 0 18q-10 9 0 14" fill="none" stroke="#e3c3b8" stroke-width="3.5" stroke-linecap="round"/>`;
  });
  s += `</g><g class="amarrotado"><path d="M50 440q14 -18 30 -4q16 -14 26 6q16 2 8 22q12 16 -6 26q2 18 -20 14q-12 14 -26 0q-18 4 -14 -18q-14 -14 2 -28q-10 -14 0 -18z" fill="#fbf8f1" stroke="#e3c3b8" stroke-width="2"/><path d="M64 452q12 6 22 -2M60 474q16 8 34 -4M70 494q10 4 22 -4" fill="none" stroke="#e3c3b8" stroke-width="2" stroke-linecap="round"/></g>`;
  s += `<rect class="pega-lencol" x="40" y="404" width="222" height="130" fill="transparent"/>`;
  /* a coberta, embolada no pé, torta, com uma ponta caindo pelo lado da cama */
  s += `<g class="coberta-torta"><g class="coberta"><rect x="${COBERTA_X}" y="420" width="${COBERTA_W}" height="94" rx="10" fill="#f2a9c4"/>`;
  for (let x = COBERTA_X + 36; x < COBERTA_X + COBERTA_W; x += 36) s += `<path d="M${x} 426v82" stroke="#e58fb0" stroke-width="2" opacity="0.55"/>`;
  s += `<rect x="${COBERTA_X}" y="420" width="18" height="94" rx="8" fill="#fbf8f1" opacity="0.9"/></g><path class="ponta" d="M276 506q24 4 58 0l-6 62q-22 10 -40 -4z" fill="#f2a9c4"/></g>`;
  s += `<rect class="pega-coberta" x="262" y="398" width="96" height="140" fill="transparent"/>`;
  s += `<g class="gato-cama" opacity="0"></g>`;
  /* o que a noite deixou: em cima da cama e no chão */
  const desenho: Record<Item, string> = {
    travesseiro: `<rect x="-32" y="-15" width="64" height="30" rx="14" fill="#fbf8f1" stroke="#e3c3b8" stroke-width="2"/><path d="M-20 0h40" stroke="#ebcdc3" stroke-width="1.5" opacity="0.7"/><path d="M-26 -6q6 4 12 0" fill="none" stroke="#ebcdc3" stroke-width="1.5"/>`,
    coelho: coelhinhoDePano(0, 18, 44),
    ursinho: ursinho(0, 18, 46),
    bola: bola(0, 0, 16),
  };
  for (const it of Object.keys(LUGAR) as Item[]) {
    const [x, y] = LUGAR[it].ini;
    s += `<g data-item="${it}"><g class="giro" style="transform-box:fill-box;transform-origin:center;transform:rotate(${LUGAR[it].giro}deg)"><g transform="translate(${x} ${y})">${desenho[it]}<circle r="38" fill="transparent"/></g></g></g>`;
  }
  /* a frente do cestinho, por cima da bola quando ela entrar */
  s += `<path d="M212 724h48l-5 20h-38z" fill="#d9b88f" style="pointer-events:none"/><path d="M214 732h44" stroke="#b08a70" stroke-width="1.5" opacity="0.6" style="pointer-events:none"/>`;
  s += `<g class="luz"></g>`;
  /* a Stella ao pé da cama: só olha, o toque passa por ela */
  s += `<g style="pointer-events:none">${familia.stella(74, 752, 150, 'parado').svg}</g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('primavera');
  tela.aoDestruir(() => pararFundo());
  const luz = svg.querySelector('.luz') as SVGGElement;
  const esticador = (el: SVGGElement, origem: string) => {
    el.style.transformBox = 'fill-box';
    el.style.transformOrigin = origem;
    return (k: number, ms: number) => {
      el.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
      el.style.transform = `scaleX(${k})`;
    };
  };
  const lencol = esticador(svg.querySelector('.lencol') as SVGGElement, 'left center');
  const dobrar = esticador(svg.querySelector('.coberta') as SVGGElement, 'right center');
  lencol(EMBOLADO, 0);
  dobrar(DOBRADA, 0);
  const torta = svg.querySelector('.coberta-torta') as SVGGElement;
  torta.style.transformBox = 'fill-box';
  torta.style.transformOrigin = 'right center';
  torta.style.transform = `rotate(${TORTA}deg)`;
  const amarrotado = svg.querySelector('.amarrotado') as SVGGElement;
  const passos = quadroDePassos(tela, PASSOS.cama.map((p) => ICONES[p]));

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  let k = 0;
  let ocupado = false;
  let esticado = false;
  const onde: Record<Item, Onde> = { travesseiro: 'ini', coelho: 'ini', ursinho: 'ini', bola: 'ini' };
  const lisas = RUGAS.map(() => false);
  let afofadas = 0;
  let pararGesto = () => {};
  const passo = (): PassoDaCama | null => PASSOS.cama[k] ?? null;
  const item = (it: Item) => svg.querySelector(`[data-item="${it}"]`) as SVGGElement;
  const pos = (it: Item): [number, number] => LUGAR[it][onde[it]] ?? LUGAR[it].ini;
  /* levar endireita: o que estava torto chega reto no lugar */
  const levar = (it: Item, para: Onde, ms = 700) => {
    const [x0, y0] = LUGAR[it].ini;
    onde[it] = para;
    const [x, y] = pos(it);
    mover(item(it), x - x0, y - y0, ms);
    const giro = item(it).querySelector('.giro') as SVGGElement;
    giro.style.transition = `transform ${ms}ms`;
    giro.style.transform = 'rotate(0deg)';
  };

  /* o que acende em cada passo, e o que a mãozinha mostra */
  const pendentes = (): Item[] => {
    const p = passo();
    if (p === 'tirar') return EM_CIMA.filter((i) => onde[i] === 'ini');
    if (p === 'travesseiro') return ['travesseiro'];
    if (p === 'bichinhos') return DE_VOLTA.filter((i) => onde[i] !== 'fim');
    return [];
  };
  const acender = () => {
    const p = passo();
    let l = '';
    for (const it of pendentes()) {
      const [x, y] = pos(it);
      const alto = it === 'travesseiro' || it === 'bola' ? 0 : 18;
      l += contornoLuz(x, y - alto, it === 'travesseiro' ? 40 : 32, 30);
    }
    if (p === 'lencol') l += esticado ? contornoLuz(160, 468, 110, 48) : contornoLuz(84, 468, 44, 50);
    if (p === 'coberta') l += contornoLuz(300, 470, 46, 56);
    luz.innerHTML = l;
  };
  const mostrar = () => {
    pararGesto();
    const p = passo();
    if (p === 'lencol' && !esticado) pararGesto = gesto(tela, [[84, 486], [150, 486], [220, 486], [290, 486]], 420);
    else if (p === 'lencol') pararGesto = gesto(tela, [[80, 486], [130, 486], [180, 486], [240, 486]]);
    else if (p === 'coberta') pararGesto = gesto(tela, [[312, 490], [260, 490], [200, 490], [150, 490]], 420);
    else {
      const it = pendentes()[0];
      if (it) {
        const [x, y] = pos(it);
        tela.mao([x + 12, y + 12]);
      }
    }
  };
  const VOZ: Record<PassoDaCama, string> = { tirar: 'cama_tirar', lencol: 'cama_lencol', coberta: 'cama_coberta', travesseiro: 'cama_travesseiro', bichinhos: 'cama_bichinhos' };
  const comecarPasso = () => {
    passos.agora(k);
    acender();
    const p = passo();
    if (p && temVoz(VOZ[p])) void falar(VOZ[p]);
  };
  const concluir = async () => {
    ocupado = true;
    pararGesto();
    tela.mao(null);
    luz.innerHTML = '';
    passos.encher(k);
    sininho(0.2);
    ajuda.reset();
    await esperar(700);
    if (!vivo) return;
    k += 1;
    ocupado = false;
    if (k < PASSOS.cama.length) comecarPasso();
    else void fim();
  };

  const ajuda = new Ajuda((n) => {
    if (n >= 1 && !ocupado) mostrar();
  });
  let vez = 0;
  relogioDeAjuda(tela, (dt) => {
    ajuda.tick(dt);
    /* A2: o jogo faz junto, um pedacinho de cada vez, devagar */
    if (ajuda.nivel < 2 || ocupado || !vivo) return;
    vez += 1;
    if (vez % 2) return;
    const p = passo();
    if (p === 'lencol' && !esticado) void puxarLencol(1);
    else if (p === 'lencol') {
      const i = lisas.indexOf(false);
      if (i >= 0) alisarRuga(i);
    } else if (p === 'coberta') void puxada(1);
    else {
      const it = pendentes()[0];
      if (it) tocarItem(it);
    }
  });
  const tocou = () => {
    ajuda.tocou();
    pararGesto();
    tela.mao(null);
  };
  svg.addEventListener('pointerdown', tocou);
  tela.aoDestruir(() => svg.removeEventListener('pointerdown', tocou));

  /* tirar, afofar, pôr de volta: tudo por toque */
  const tocarItem = (it: Item) => {
    const p = passo();
    const el = item(it);
    if (ocupado) return;
    if (p === 'tirar' && EM_CIMA.includes(it) && onde[it] === 'ini') {
      travar(500);
      toc(420 + pendentes().length * 40, 0.18);
      levar(it, 'fora');
      if (pendentes().length === 0) void esperar(600).then(concluir);
      else acender();
      return;
    }
    if (p === 'travesseiro' && it === 'travesseiro') {
      afofadas += 1;
      lira(64 + afofadas * 4, undefined, 0.3);
      const [x0, y0] = LUGAR.travesseiro.ini;
      const [x, y] = pos('travesseiro');
      mover(el, x - x0, y - y0, 140, 1.2);
      void esperar(160).then(() => mover(el, x - x0, y - y0, 260, 1));
      if (afofadas >= AFOFADAS) {
        ocupado = true;
        travar(900);
        void esperar(450).then(() => {
          levar('travesseiro', 'fim', 800);
          void esperar(850).then(concluir);
        });
      }
      return;
    }
    if (p === 'bichinhos' && DE_VOLTA.includes(it) && onde[it] !== 'fim') {
      travar(500);
      toc(it === 'bola' ? 380 : 560, 0.18);
      levar(it, 'fim');
      if (pendentes().length === 0) void esperar(700).then(concluir);
      else acender();
      return;
    }
    /* não é a vez dele: balança um pouquinho, e a luz continua no passo de agora */
    tiquinho();
    const [x0, y0] = LUGAR[it].ini;
    const [x, y] = pos(it);
    mover(el, x - x0, y - y0 - 5, 150);
    void esperar(170).then(() => mover(el, x - x0, y - y0, 250));
  };
  for (const it of Object.keys(LUGAR) as Item[]) tela.alvo(`[data-item="${it}"]`, () => tocarItem(it), true);

  const pega = svg.querySelector('.pega-lencol') as SVGRectElement;

  /* o lençol, primeiro: puxar do canto até o pé. Soltou antes, ele volta a embolar */
  const puxarLencol = async (fracao: number) => {
    if (passo() !== 'lencol' || esticado || ocupado) return;
    if (foiLongeOBastante(fracao)) {
      ocupado = true;
      esticado = true;
      lencol(1, 700);
      amarrotado.style.transition = 'opacity 500ms';
      amarrotado.style.opacity = '0';
      lira(62, undefined, 0.3);
      await esperar(750);
      ocupado = false;
      acender();
    } else {
      lencol(EMBOLADO, 900);
      amarrotado.style.transition = 'opacity 600ms';
      amarrotado.style.opacity = '1';
      toc(300, 0.1);
      ajuda.tentativa();
    }
  };
  tela.aoDestruir(
    puxavel(
      svg,
      pega,
      [84, 468],
      [320, 468],
      (f) => {
        ajuda.tocou();
        lencol(EMBOLADO + (1 - EMBOLADO) * f, 0);
        amarrotado.style.transition = 'none';
        amarrotado.style.opacity = String(Math.max(0, 1 - f * 1.6));
      },
      (f) => void puxarLencol(f),
      () => passo() === 'lencol' && !esticado && !ocupado,
    ),
  );

  /* depois, esticar: o dedo passa por cima, e cada ruga que ele cruza fica lisa */
  const alisarRuga = (i: number) => {
    if (lisas[i]) return;
    lisas[i] = true;
    const r = svg.querySelector(`[data-ruga="${i}"]`) as SVGElement;
    r.style.transition = 'opacity 500ms';
    r.style.opacity = '0';
    toc(820 + i * 60, 0.09);
    if (lisas.every(Boolean)) void esperar(400).then(concluir);
  };
  let dedoLencol = -1;
  let xAnterior = 0;
  pega.addEventListener('pointerdown', (ev) => {
    if (passo() !== 'lencol' || ocupado) return tiquinho();
    if (!esticado || !reivindicarDedo(ev.pointerId)) return;
    dedoLencol = ev.pointerId;
    xAnterior = pontoNoSvg(svg, ev.clientX, ev.clientY)[0];
    try {
      pega.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  });
  pega.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedoLencol || passo() !== 'lencol' || !esticado) return;
    const x = pontoNoSvg(svg, ev.clientX, ev.clientY)[0];
    for (const i of alisar(RUGAS, lisas, xAnterior, x)) alisarRuga(i);
    xAnterior = x;
    ajuda.tocou();
  });
  const soltaLencol = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoLencol) return;
    soltarDedo(dedoLencol);
    dedoLencol = -1;
  };
  pega.addEventListener('pointerup', soltaLencol);
  pega.addEventListener('pointercancel', soltaLencol);

  /* puxar a coberta: soltou passando de 40% do caminho, ela vai sozinha até a cabeceira
     e fica reta, sem a ponta caindo; antes disso, escorrega de volta para o pé, devagar */
  const puxada = async (fracao: number) => {
    if (passo() !== 'coberta' || ocupado) return;
    if (foiLongeOBastante(fracao)) {
      ocupado = true;
      dobrar(1, 700);
      torta.style.transition = 'transform 700ms';
      torta.style.transform = 'rotate(0deg)';
      const ponta = svg.querySelector('.ponta') as SVGElement;
      ponta.style.transition = 'opacity 500ms';
      ponta.style.opacity = '0';
      lira(67, undefined, 0.3);
      await esperar(750);
      ocupado = false;
      void concluir();
    } else {
      dobrar(DOBRADA, 900);
      toc(300, 0.1);
      ajuda.tentativa();
    }
  };
  const pegaCoberta = svg.querySelector('.pega-coberta')!;
  tela.aoDestruir(
    puxavel(
      svg,
      pegaCoberta,
      [304, 468],
      [140, 468],
      (f) => {
        ajuda.tocou();
        dobrar(DOBRADA + (1 - DOBRADA) * f, 0);
      },
      (f) => void puxada(f),
      () => passo() === 'coberta' && !ocupado,
    ),
  );
  pegaCoberta.addEventListener('pointerdown', () => {
    if (passo() !== 'coberta') tiquinho();
  });

  /* pronta: a luz da manhã passa pela cama, e o gatinho sobe para deitar no pé dela */
  const fim = async () => {
    passos.agora(-1);
    travar(2500);
    if (e.bichos.gato) {
      const g = svg.querySelector('.gato-cama') as SVGGElement;
      g.innerHTML = gato(292, 480, 20, '#c8b8a6', true);
      g.style.transition = 'opacity 900ms';
      await esperar(500);
      g.style.opacity = '1';
    }
    await terminarCuidado(tela, 'cama', [200, 430], 'cama_pronta', () => vivo);
  };

  void esperar(700).then(() => vivo && comecarPasso());
  return tela;
}
