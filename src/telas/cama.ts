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

type Item = 'travesseiro' | 'ursinho' | 'coelho';

/** onde cada coisa começa (bagunçada em cima da cama), onde espera (na cadeira e no chão) e onde fica no fim */
const LUGAR: Record<Item, { cama: [number, number]; fora: [number, number]; fim: [number, number] }> = {
  travesseiro: { cama: [196, 462], fora: [322, 632], fim: [88, 452] },
  ursinho: { cama: [108, 486], fora: [290, 742], fim: [142, 466] },
  coelho: { cama: [262, 482], fora: [350, 742], fim: [180, 468] },
};
/** as rugas do lençol, em x; a coberta dobrada no pé da cama fica depois da última */
const RUGAS = [112, 172, 232];
/** a coberta aberta vai de x 120 a 338; dobrada no pé, ocupa só a ponta */
const COBERTA_X = 120;
const COBERTA_W = 218;
const DOBRADA = 70 / COBERTA_W;

const ICONES: Record<PassoDaCama, (x: number, y: number) => string> = {
  tirar: (x, y) => `<rect x="${x - 10}" y="${y + 2}" width="20" height="7" rx="3" fill="#f2a9c4"/><rect x="${x - 7}" y="${y - 7}" width="14" height="7" rx="3" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M${x + 6} ${y - 4}q7 -6 4 -11" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round"/><path d="M${x + 7} ${y - 16}l3 1l-1 3" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round"/>`,
  lencol: (x, y) => `<rect x="${x - 11}" y="${y - 7}" width="22" height="14" rx="3" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M${x - 7} ${y}h14" stroke="#c9a189" stroke-width="1.2"/><path d="M${x - 8} ${y - 11}h16" stroke="#c6a15b" stroke-width="1.4" stroke-linecap="round"/>`,
  coberta: (x, y) => `<rect x="${x - 4}" y="${y - 7}" width="15" height="14" rx="3" fill="#f2a9c4"/><path d="M${x - 5} ${y}h-7M${x - 9} ${y - 3}l-3 3l3 3" fill="none" stroke="#c6a15b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  travesseiro: (x, y) => `<rect x="${x - 10}" y="${y - 5}" width="20" height="11" rx="5" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M${x - 12} ${y - 9}l-2 -2M${x} ${y - 10}v-3M${x + 12} ${y - 9}l2 -2" stroke="#c6a15b" stroke-width="1.4" stroke-linecap="round"/>`,
  bichinhos: (x, y) => ursinho(x, y + 9, 20),
};

/**
 * Arrumar a cama, passo a passo, na ordem de verdade: tirar o travesseiro e os
 * bichinhos de cima, esticar o lençol (o dedo passa pelas rugas e elas somem),
 * puxar a coberta do pé até a cabeceira, afofar o travesseiro com três toques
 * e pôr os bichinhos de volta. A coberta é pesada: soltou antes de chegar perto,
 * ela escorrega de volta devagar e a mãozinha mostra de novo. No fim, a cama
 * fica bonita e o gatinho sobe para deitar nela.
 */
export function telaCama(): Tela {
  const e = estado();
  entrarNoCuidado('cama');

  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 4, 0.28);
  s += arco(150, 170, 90, 110, '#dbe7ee') + nuvem(196, 222, 9);
  s += `<rect x="-400" y="600" width="1190" height="600" fill="#ebcdc3" opacity="0.75"/><ellipse cx="190" cy="700" rx="150" ry="34" fill="#f2a9c4" opacity="0.3"/>`;
  /* a cadeira, onde o que sai da cama espera */
  s += `<rect x="356" y="560" width="10" height="92" rx="3" fill="#c9a189"/><rect x="280" y="644" width="88" height="12" rx="4" fill="#c9a189"/><path d="M288 656v70M360 656v70" stroke="#c9a189" stroke-width="6" stroke-linecap="round"/>`;
  /* a cama: cabeceira, pé, colchão, lençol com as rugas, coberta dobrada no pé */
  s += `<rect x="30" y="330" width="22" height="270" rx="8" fill="#c9a189"/><rect x="338" y="420" width="18" height="180" rx="6" fill="#c9a189"/>`;
  s += `<rect x="48" y="500" width="294" height="58" rx="8" fill="#f3d9cf"/><rect x="44" y="556" width="302" height="14" rx="4" fill="#b08a70"/>`;
  s += `<g class="lencol"><rect x="52" y="426" width="286" height="84" rx="10" fill="#fbf8f1" stroke="#ebcdc3" stroke-width="2"/>`;
  RUGAS.forEach((x, i) => {
    s += `<path data-ruga="${i}" d="M${x} 434q10 9 0 18q-10 9 0 18q10 9 0 18q-10 9 0 14" fill="none" stroke="#e3c3b8" stroke-width="3.5" stroke-linecap="round"/>`;
  });
  s += `<rect class="pega-lencol" x="52" y="404" width="210" height="130" fill="transparent"/></g>`;
  s += `<g class="coberta"><rect x="${COBERTA_X}" y="420" width="${COBERTA_W}" height="94" rx="10" fill="#f2a9c4"/>`;
  for (let x = COBERTA_X + 36; x < COBERTA_X + COBERTA_W; x += 36) s += `<path d="M${x} 426v82" stroke="#e58fb0" stroke-width="2" opacity="0.55"/>`;
  s += `<rect x="${COBERTA_X}" y="420" width="18" height="94" rx="8" fill="#fbf8f1" opacity="0.9"/></g>`;
  s += `<rect class="pega-coberta" x="262" y="398" width="96" height="140" fill="transparent"/>`;
  s += `<g class="gato-cama" opacity="0"></g>`;
  /* o que está em cima da cama, bagunçado */
  const desenho: Record<Item, string> = {
    travesseiro: `<rect x="-32" y="-15" width="64" height="30" rx="14" fill="#fbf8f1" stroke="#e3c3b8" stroke-width="2"/><path d="M-20 0h40" stroke="#ebcdc3" stroke-width="1.5" opacity="0.7"/>`,
    ursinho: ursinho(0, 18, 46),
    coelho: coelhinhoDePano(0, 18, 44),
  };
  for (const it of Object.keys(LUGAR) as Item[]) {
    const [x, y] = LUGAR[it].cama;
    s += `<g data-item="${it}"><g transform="translate(${x} ${y})">${desenho[it]}<circle r="38" fill="transparent"/></g></g>`;
  }
  s += `<g class="luz"></g>`;
  /* a Stella ao pé da cama: só olha, o toque passa por ela */
  s += `<g style="pointer-events:none">${familia.stella(74, 752, 150, 'parado').svg}</g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  tela.aoDestruir(() => pararFundo());
  const luz = svg.querySelector('.luz') as SVGGElement;
  const coberta = svg.querySelector('.coberta') as SVGGElement;
  coberta.style.transformBox = 'fill-box';
  coberta.style.transformOrigin = 'right center';
  const dobrar = (k: number, ms: number) => {
    coberta.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
    coberta.style.transform = `scaleX(${k})`;
  };
  dobrar(DOBRADA, 0);
  const passos = quadroDePassos(tela, PASSOS.cama.map((p) => ICONES[p]));

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  let k = 0;
  let ocupado = false;
  const onde: Record<Item, 'cama' | 'fora' | 'fim'> = { travesseiro: 'cama', ursinho: 'cama', coelho: 'cama' };
  const lisas = RUGAS.map(() => false);
  let afofadas = 0;
  let pararGesto = () => {};
  const passo = (): PassoDaCama | null => PASSOS.cama[k] ?? null;
  const item = (it: Item) => svg.querySelector(`[data-item="${it}"]`) as SVGGElement;
  const levar = (it: Item, para: 'fora' | 'fim', ms = 700) => {
    const [x0, y0] = LUGAR[it].cama;
    const [x, y] = LUGAR[it][para];
    onde[it] = para;
    mover(item(it), x - x0, y - y0, ms);
  };

  /* o que acende em cada passo, e o que a mãozinha mostra */
  const pendentes = (): Item[] => {
    const p = passo();
    if (p === 'tirar') return (Object.keys(onde) as Item[]).filter((i) => onde[i] === 'cama');
    if (p === 'travesseiro') return ['travesseiro'];
    if (p === 'bichinhos') return (['ursinho', 'coelho'] as Item[]).filter((i) => onde[i] === 'fora');
    return [];
  };
  const acender = () => {
    const p = passo();
    let l = '';
    for (const it of pendentes()) {
      const [x, y] = LUGAR[it][onde[it] === 'cama' ? 'cama' : 'fora'];
      l += contornoLuz(x, y - (it === 'travesseiro' ? 0 : 18), it === 'travesseiro' ? 40 : 32, 30);
    }
    if (p === 'lencol') l += contornoLuz(160, 468, 110, 48);
    if (p === 'coberta') l += contornoLuz(304, 468, 44, 52);
    luz.innerHTML = l;
  };
  const mostrar = () => {
    pararGesto();
    const p = passo();
    if (p === 'lencol') pararGesto = gesto(tela, [[80, 486], [130, 486], [180, 486], [240, 486]]);
    else if (p === 'coberta') pararGesto = gesto(tela, [[312, 490], [260, 490], [200, 490], [150, 490]], 420);
    else {
      const it = pendentes()[0];
      if (it) {
        const [x, y] = LUGAR[it][onde[it] === 'cama' ? 'cama' : 'fora'];
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
    if (p === 'lencol') {
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
    if (p === 'tirar' && onde[it] === 'cama') {
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
      const [x0, y0] = LUGAR.travesseiro.cama;
      const [x, y] = LUGAR.travesseiro.fora;
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
    if (p === 'bichinhos' && onde[it] === 'fora') {
      travar(500);
      toc(560, 0.18);
      levar(it, 'fim');
      if (pendentes().length === 0) void esperar(700).then(concluir);
      else acender();
      return;
    }
    /* não é a vez dele: balança um pouquinho, e a luz continua no passo de agora */
    tiquinho();
    const lugar = onde[it] === 'cama' ? LUGAR[it].cama : LUGAR[it][onde[it]];
    const [x0, y0] = LUGAR[it].cama;
    mover(el, lugar[0] - x0, lugar[1] - y0 - 5, 150);
    void esperar(170).then(() => mover(el, lugar[0] - x0, lugar[1] - y0, 250));
  };
  for (const it of Object.keys(LUGAR) as Item[]) tela.alvo(`[data-item="${it}"]`, () => tocarItem(it), true);

  /* esticar o lençol: o dedo passa por cima, e cada ruga que ele cruza fica lisa */
  const alisarRuga = (i: number) => {
    if (lisas[i]) return;
    lisas[i] = true;
    const r = svg.querySelector(`[data-ruga="${i}"]`) as SVGElement;
    r.style.transition = 'opacity 500ms';
    r.style.opacity = '0';
    toc(820 + i * 60, 0.09);
    if (lisas.every(Boolean)) void esperar(400).then(concluir);
  };
  const pega = svg.querySelector('.pega-lencol') as SVGRectElement;
  let dedoLencol = -1;
  let xAnterior = 0;
  pega.addEventListener('pointerdown', (ev) => {
    if (passo() !== 'lencol' || ocupado) return tiquinho();
    if (!reivindicarDedo(ev.pointerId)) return;
    dedoLencol = ev.pointerId;
    xAnterior = pontoNoSvg(svg, ev.clientX, ev.clientY)[0];
    try {
      pega.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  });
  pega.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedoLencol || passo() !== 'lencol') return;
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
  pega.classList.add('alvo');

  /* puxar a coberta: soltou passando de 40% do caminho, ela vai sozinha até a cabeceira;
     antes disso, escorrega de volta para o pé, devagar, e dá para puxar de novo */
  const puxada = async (fracao: number) => {
    if (passo() !== 'coberta' || ocupado) return;
    if (foiLongeOBastante(fracao)) {
      ocupado = true;
      dobrar(1, 700);
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

  /* pronta: a luz passa pela cama, e o gatinho sobe para deitar no pé dela */
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
