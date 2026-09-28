import { convidarParaCasa, telaSvg } from './comum';
import { guiar } from './guia';
import { apertoDaMao } from './jardim';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { ceuDaHora } from '@/core/relogio';
import { cena, encaixar, esperar, observarCaixa, svgEl } from '@/core/util';
import { naBorda, saida, travar } from '@/core/toque';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { anunciar } from '@/core/narracao';
import { familia } from '@/puppet/boneco';
import { casinha, centelha, CENTELHA, coelho, contornoLuz, nuvem, pinheiro, veu } from '@/puppet/objetos';
import { bicicleta, bicicletinha, gamba, ALTURA_POR_RAIO } from '@/puppet/bicicleta';
import { escuro, formaNoCanvas, lapisNoCanvas } from '@/puppet/pincel';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador, tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { aplauso, centelhasSom, chiado, lira, liraDesce, liraSobe, PENTATONICA, sininho, tiquinho, toc } from '@/audio/synth';
import {
  alturaChao,
  alturaDoPulo,
  BICICLETA,
  bonsDe,
  cadaDaRota,
  decolagem,
  depoisDoPasseio,
  deslizar,
  gestosDaRota,
  inclinacao,
  montarPasseio,
  noAr,
  passeioBom,
  passoDeVelocidade,
  pedalar,
  PULAVEIS,
  pularPara,
  ritmoDaRota,
  rota as rotaDe,
  rotaDoDia,
  rotasAbertas,
  vooDaRampa,
  type Coisa,
  type Enfeite,
  type Gesto,
  type Pulo,
  type Rota,
} from '@/core/bicicleta';
import type { Tela } from '@/core/roteador';

/*
 * A bicicletinha: um passeio pelo condomínio que sai da porta da casa verde e
 * cresce devagar, rota a rota. Duas telas: a saída (o capacete, subir, escolher
 * a rota no mapinha) e o passeio (em canvas, como o Jardim). Ela pedala
 * sozinha; a criança decide quando pular, acelerar, frear e abaixar. Cada coisa
 * do chão responde de um jeito se o gesto não vier, e nada dói. Toda ida tem
 * alguém da família esperando no fim, e a volta é pelo mesmo caminho.
 * O estudo está em docs/bicicleta.md e docs/referencia/bicicleta.html.
 */

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };
const ICONE_DESTINO: Record<string, string> = {
  padaria: `<path d="M-14 8V-4h28V8z" fill="#ebd9a8"/><path d="M-16 -4L0 -14L16 -4z" fill="#8a3a44"/><ellipse cy="3" rx="7" ry="3.4" fill="#c9a189"/>`,
  lago: `<ellipse cy="3" rx="17" ry="8" fill="#9fc3cf"/><path d="M-3 -2q-8 -10 -3 -14q4 2 6 8q4 -2 8 2q-4 2 -6 8q-3 -2 -5 -4z" fill="#fbf8f1"/>`,
  portao: `<path d="M-14 8V-2h28V8z" fill="#f6e3dc"/><path d="M-16 -2L0 -14L16 -2z" fill="#4f6b3a"/><path d="M-4 8V2h8v6z" fill="#8a3a44"/><circle cx="9" cy="2" r="2.6" fill="#f2a9c4"/>`,
  parquinho: `<path d="M-12 10L-4 -10L4 10" fill="none" stroke="#c9a189" stroke-width="3" stroke-linecap="round"/><path d="M-14 -2L14 2" stroke="#c9a189" stroke-width="3.5" stroke-linecap="round"/><circle cx="-4" cy="-10" r="3.5" fill="#c9a189"/>`,
  casa: `<path d="M-14 8L0 -8L14 8V18H-14z" fill="#8fae6b"/><path d="M-5 18V11h10v7z" fill="#f2a9c4"/>`,
};

/* ---------- a saída ---------- */

/**
 * A saída: a bicicletinha encostada no muro, o capacete no gancho, a mãe na
 * porta. Toca no capacete (põe), toca na bicicleta (sobe, o coelhinho pula na
 * cestinha) e escolhe a rota no mapinha do céu; a de hoje brilha e vai sozinha
 * depois de um tempo.
 */
export function telaBicicleta(): Tela {
  const e = estado();
  const ceu = ceuDaHora(sessao.agora());
  const noite = ceu === 'ceu-noite';
  const abertas = rotasAbertas(e.bicicleta);
  const doDia = rotaDoDia(e.bicicleta);
  const enfeites = e.bicicleta.enfeites as Enfeite[];

  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, 390, 420, noite ? '#1b2140' : '#f6e3dc', 4, 0.35);
  if (!noite) s += nuvem(300, 250, 13);
  s += `<rect x="0" y="470" width="390" height="310" fill="#c9dbb2"/>` + veu(0, 470, 390, 310, '#8fae6b', 4, 0.32);
  /* um pedaço da casa verde, com a porta e a mãe */
  s += `<rect x="0" y="236" width="210" height="234" fill="#8fae6b"/>` + veu(0, 236, 210, 234, '#c9dbb2', 3, 0.22, true);
  s += `<path d="M-20 240L110 150L236 240z" fill="#4f6b3a"/><path d="M30 300V260a20 20 0 0 1 40 0v40z" fill="#ebd9a8"/>`;
  s += `<path d="M118 466V324a34 34 0 0 1 68 0v142z" fill="#6e1a27"/>`;
  s += `<g class="mae">${familia.mae(152, 464, 172, 'acena').svg}</g>`;
  /* o gancho com o capacete, o alvo da vez */
  s += `<path d="M240 300v22" stroke="#8f6f2c" stroke-width="2" stroke-linecap="round"/>`;
  s += `<g data-alvo="capacete"><circle cx="240" cy="344" r="36" fill="transparent"/><path d="M216 344C216 318 264 318 264 344Q240 340 216 344z" fill="#f6e3dc"/><path d="M232 324q8 -2 16 0" fill="none" stroke="#b9948c" stroke-width="1" opacity="0.6"/></g>`;
  /* a bicicleta encostada e a Stella de pé */
  s += `<g data-alvo="bici"><circle cx="292" cy="490" r="40" fill="transparent"/><g class="bici-parada">${bicicletinha(292, 522, 17, enfeites, -6)}</g><g class="bici-montada" opacity="0"></g></g>`;
  s += `<g class="stella">${familia.stella(190, 524, 96).svg}</g>`;
  s += `<g class="coelho">${coelho(340, 530, 16)}</g>`;
  s += pinheiro(365, 640, 220, true);
  /* o mapinha: a casa, as rotas abertas (uma figura por destino), a de hoje acesa */
  s += `<g class="mapinha">`;
  const y0 = 150;
  s += `<path d="M-14 4L0 -10L14 4V16H-14z" fill="#8fae6b" transform="translate(50 ${y0 - 3})"/><path d="M-5 16V9h10v7z" fill="#f2a9c4" transform="translate(50 ${y0 - 3})"/>`;
  abertas.forEach((r, i) => {
    const y = y0 + i * 44;
    s += `<path d="M68 ${y0}Q${150 + i * 20} ${y0 + 10} 320 ${y}" fill="none" stroke="${r.id === doDia.id ? '#f2a9c4' : '#c9dbb2'}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`;
    s += `<g data-rota="${r.id}"><circle cx="320" cy="${y}" r="26" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.2"/><g transform="translate(320 ${y})">${ICONE_DESTINO[r.destino] ?? ''}</g></g>`;
  });
  s += `</g><g class="luz"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('manha_grieg');
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  type Etapa = 'capacete' | 'subir' | 'rota' | 'foi';
  let etapa: Etapa = 'capacete';
  const luz = svg.querySelector('.luz') as SVGGElement;
  const acender = () => {
    if (etapa === 'capacete') luz.innerHTML = contornoLuz(240, 340, 40, 30);
    else if (etapa === 'subir') luz.innerHTML = contornoLuz(292, 500, 54, 40);
    else if (etapa === 'rota') {
      const i = abertas.findIndex((r) => r.id === doDia.id);
      luz.innerHTML = contornoLuz(320, y0 + i * 44, 32, 32);
    } else luz.innerHTML = '';
  };
  acender();
  const guia = guiar(tela, {
    proximo: () => {
      if (etapa === 'capacete') return { tipo: 'tocar', em: [240, 340] };
      if (etapa === 'subir') return { tipo: 'tocar', em: [292, 500] };
      if (etapa === 'rota') return { tipo: 'tocar', em: [320, y0 + abertas.findIndex((r) => r.id === doDia.id) * 44] };
      return null;
    },
    atraso: 1200,
  });

  const ir_ = (r: Rota) => {
    if (etapa === 'foi' || !vivo) return;
    etapa = 'foi';
    guia.calar();
    acender();
    travar(900);
    /* a campainha: trim trim, e o passeio começa */
    lira(PENTATONICA[6]!, undefined, 0.3);
    void esperar(140).then(() => lira(PENTATONICA[7]!, undefined, 0.3));
    tela.comemorar(292, 470);
    void esperar(900).then(() => {
      if (vivo) void ir('passeio', { rota: r.id });
    });
  };

  tela.alvo('[data-alvo="capacete"]', (_ev, el) => {
    if (etapa !== 'capacete') return tiquinho();
    etapa = 'subir';
    sininho();
    /* o capacete voa para a cabeça dela */
    const st = svg.querySelector('.stella') as SVGGElement;
    const cab = familia.stella(190, 524, 96).cabeca;
    (el as SVGGElement).style.transition = 'transform 600ms cubic-bezier(0.2, 0, 0, 1)';
    (el as SVGGElement).style.transform = `translate(${cab[0] - 240}px, ${cab[1] - 336}px) scale(0.72)`;
    (el as SVGGElement).style.transformOrigin = '240px 344px';
    void st;
    acender();
    guia.passo();
    void esperar(700).then(() => guia.mostrar());
  });
  tela.alvo('[data-alvo="bici"]', () => {
    if (etapa === 'capacete') {
      tiquinho();
      guia.mostrar();
      return;
    }
    if (etapa !== 'subir') return tiquinho();
    etapa = 'rota';
    sininho();
    /* ela sobe: a bicicleta parada some e aparece com ela em cima; o coelhinho pula na cestinha */
    (svg.querySelector('.stella') as SVGGElement).style.opacity = '0';
    (svg.querySelector('[data-alvo="capacete"]') as SVGGElement).style.opacity = '0';
    const parada = svg.querySelector('.bici-parada') as SVGGElement;
    parada.style.opacity = '0';
    const montada = svg.querySelector('.bici-montada') as SVGGElement;
    montada.innerHTML = `<g transform="translate(272 522)">${bicicleta(17, { enfeites, rodinhas: true, volta: 0.15 }).svg}</g>`;
    montada.style.transition = 'opacity 400ms';
    montada.style.opacity = '1';
    const co = svg.querySelector('.coelho') as SVGGElement;
    co.style.transition = 'opacity 500ms';
    co.style.opacity = '0';
    acender();
    guia.passo();
    void esperar(600).then(() => guia.mostrar());
    /* sem escolha em 14 s, a rota de hoje vai sozinha */
    void esperar(14000).then(() => {
      if (vivo && etapa === 'rota') ir_(doDia);
    });
  });
  tela.alvo('[data-rota]', (_ev, el) => {
    if (etapa !== 'rota') {
      tiquinho();
      guia.mostrar();
      return;
    }
    ir_(rotaDe(el.getAttribute('data-rota') ?? doDia.id));
  });
  return tela;
}

/* ---------- o passeio ---------- */

/** Um svg de figura vira imagem para o canvas, sem raster no repositório. */
function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

let maoFeita: Path2D | null = null;
const MAO = () => (maoFeita ??= new Path2D('M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z'));

/** A casinha por cima do canvas, com um jeito de acender no fim. */
function hudDaCasinha(el: HTMLElement, aoCasa: () => void): { limpar: () => void; acender: () => void } {
  const hud = cena(`<g class="topo">${casinha()}</g>`);
  hud.dataset.encaixe = '1';
  encaixar(hud);
  hud.style.pointerEvents = 'none';
  el.appendChild(hud);
  const casa = hud.querySelector('.casinha') as SVGGElement;
  casa.style.pointerEvents = 'auto';
  const limpar = saida(casa, () => {
    travar(400);
    aoCasa();
  });
  return {
    limpar,
    acender: () => {
      if (hud.querySelector('.convite-casa')) return;
      casa.after(svgEl(`<g class="convite-casa" style="pointer-events:none">${contornoLuz(44, 44, 42, 42)}</g>`));
    },
  };
}

type Fase = 'ida' | 'chegando' | 'encontro' | 'volta' | 'entrando' | 'fim';

interface CoisaViva extends Coisa {
  feito: boolean;
  /** a ajuda A2 resolveu esta por ela: a poça vira tábua, o tronco vira rampinha, o gambá foge na frente */
  a2: boolean;
  /** o gambá foge para a frente, fora do caminho */
  foge: boolean;
  /** o gambá gingando */
  passo: number;
  maoMostrada: boolean;
  x0: number;
}

/**
 * O passeio, em retrato: céu em cima, a faixa de jogo no meio, o chão que sobe
 * e desce. Ela pedala sozinha; toque no céu é pulo (o pulo procura a coisa),
 * na frente dela é acelerar, atrás dela é frear, nela é abaixar. Ida até quem
 * espera, festa, volta pelo mesmo caminho, e a família na porta.
 */
export function telaPasseio(params: Record<string, string> = {}): Tela {
  const e = estado();
  const r = rotaDe(params.rota ?? rotaDoDia(e.bicicleta).id);
  const n = bonsDe(e, r.id);
  const gestos = gestosDaRota(r, n);
  const ritmo = ritmoDaRota(n);
  const passeio = montarPasseio(r, n);
  const coisas: CoisaViva[] = passeio.coisas.map((c) => ({ ...c, feito: false, a2: false, foge: false, passo: Math.random() * 6, maoMostrada: false, x0: c.x }));
  const morros = passeio.morros;
  const trechos = passeio.trechos;
  const D = passeio.fim;
  /* `turbo` só pela URL de depuração: o passeio anda mais rápido para ver o fim */
  const v0 = BICICLETA.velocidade * ritmo * (params.turbo ? Number(params.turbo) || 1 : 1);
  const enfeites = [...(e.bicicleta.enfeites as Enfeite[])];

  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = r.ceu === 'tarde' ? '#f3d9cf' : '#dbe7ee';
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  const limpezas: (() => void)[] = [];
  const hud = hudDaCasinha(el, () => void sair());
  limpezas.push(hud.limpar);

  const ctx = canvas.getContext('2d')!;
  let W = 390;
  let H = 780;
  const redimensionar = () => {
    const rc = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(rc.width));
    H = Math.max(1, Math.round(rc.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const obs = observarCaixa(canvas, redimensionar);
  limpezas.push(() => obs?.disconnect());

  /* as figuras: a bicicleta com ela em oito voltas de pedal, abaixada, e quem espera */
  const F = 260;
  const R = 18;
  const QUADROS = 8;
  const quadro = (k: number, abaixada = false) => imagemDe(`<g transform="translate(130 200)">${bicicleta(R, { volta: k / QUADROS, rodinhas: true, enfeites, abaixada }).svg}</g>`, F, F);
  const bici = Array.from({ length: QUADROS }, (_, i) => quadro(i));
  const biciAbaixada = quadro(2, true);
  const alturaBici = ALTURA_POR_RAIO * R + 3 * R;
  const quemImg = (quem: 'mae' | 'pai' | 'theo', dir: 1 | -1 = -1) => imagemDe((quem === 'mae' ? familia.mae(100, 190, 170, 'acena', { dir }) : quem === 'pai' ? familia.pai(100, 190, 176, 'acena', { dir }) : familia.theo(100, 190, 130, 'acena', { dir })).svg, 200, 200);
  const espera = r.quem === 'familia' ? [quemImg('mae'), quemImg('pai'), quemImg('theo')] : [quemImg(r.quem)];
  const familiaEmCasa = [quemImg('mae', 1), quemImg('pai', 1), quemImg('theo', 1)];
  const gambaImg = Array.from({ length: 4 }, (_, i) => imagemDe(`<g transform="translate(70 100)">${gamba(0, 0, 40, (i / 4) * Math.PI * 2)}</g>`, 140, 110));
  const pinheiroImg = [imagemDe(pinheiro(60, 220, 210), 120, 230), imagemDe(pinheiro(60, 220, 150), 120, 230)];

  const m = musica(r.musica);
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.34;
  let tInicio = 0;

  /* o estado do passeio */
  let fase: Fase = 'ida';
  let x = 0;
  let vRel = 1;
  let sentido: 1 | -1 = 1;
  let tFase = 0;
  let tAnterior = 0;
  let rodou = 0;
  let pulo: Pulo | null = null;
  let paradaAte = 0;
  let freioAte = 0;
  let deslizaAte = 0;
  let abaixaAte = 0;
  let ultimoChiado = 0;
  let vivo = true;
  let erros = 0;
  let sozinha = 0;
  let pediram = 0;
  let a2Vezes = 0;
  let ajudou = false;
  let maoEm: { coisa: CoisaViva; ate: number } | null = null;
  let parada = 0;
  const marcas: { x: number; t: number; cor: string }[] = [];
  const gotas: { x: number; y: number; t: number; cor: string }[] = [];
  const centelhasVivas: { x: number; y: number; t: number }[] = [];
  let enfeiteNovo: Enfeite | null = null;
  let tEnfeite = 0;
  /* as cristas já passadas (na ida e na volta): cada uma decola uma vez */
  const cristas = new Set<string>();

  const tempo = () => audio.agora() - tInicio;
  /* a freada da chegada, em vezes a base por segundo; e quanto ela ainda anda até parar, em larguras de tela */
  const FREADA = 1.4;
  const distanciaDeFreada = () => (BICICLETA.velocidade * vRel * vRel) / (2 * FREADA);
  const faixaTopo = () => H * 0.32;
  const chao = () => H * 0.64;
  const xDaStella = () => (fase === 'ida' || fase === 'chegando' ? W * 0.33 : fase === 'encontro' ? W * 0.33 + (W * 0.34) * suave(Math.min(1, (tempo() - tFase) / 3)) : W * 0.67);
  const suave = (u: number) => u * u * (3 - 2 * u);
  const yChao = (wx: number) => chao() + alturaChao(morros, wx) * H;
  const trechoEm = (wx: number) => trechos.find((t) => wx >= t.x0 && wx <= t.x1)?.tipo ?? null;
  const andando = () => fase === 'ida' || fase === 'volta';
  const noArAgora = () => noAr(pulo, tempo());
  const proxima = () => coisas.find((c) => !c.feito && (c.x - x) * sentido > -0.02 && !['morro', ...(['pedregulho', 'areia', 'ponte'] as const)].includes(c.tipo as never));

  /* ---------- o toque: quatro gestos, cada um num lugar da tela ---------- */

  const pular = (agora: number) => {
    if (!andando() || tempo() < paradaAte) return;
    if (noArAgora()) {
      /* no ar, num voo alto, um toque é o giro */
      if (pulo && pulo.h >= 0.13 && !pulo.giro) {
        pulo.giro = true;
        centelhasVivas.push({ x: xDaStella(), y: yChao(x) - H * 0.2, t: agora });
        centelhasSom();
      }
      return;
    }
    const prox = coisas.find((c) => !c.feito && PULAVEIS.includes(c.tipo) && (c.x - x) * sentido > -0.02 && ((c.x - x) * sentido) / Math.max(0.3 * v0, vRel * v0) <= BICICLETA.janelaDoPulo + 0.05);
    if (prox) {
      const ate = ((prox.x - x) * sentido) / Math.max(0.3 * v0, vRel * v0);
      pulo = pularPara(agora, ate, vRel);
      prox.feito = true;
      sozinha += 1;
      pediram += 1;
      erros = 0;
      liraSobe();
    } else if (!pulo || agora > pulo.fim) {
      pulo = pularPara(agora, null, vRel);
      lira(PENTATONICA[6]!, undefined, 0.22);
      void esperar(120).then(() => lira(PENTATONICA[7]!, undefined, 0.22));
    }
  };
  const acelerar = (agora: number) => {
    if (!andando() || tempo() < paradaAte) return;
    vRel = pedalar(vRel);
    lira(PENTATONICA[2 + (rodou % 4)]!, undefined, 0.25);
    marcas.push({ x, t: agora, cor: '#d9c69a' });
  };
  const frear = (agora: number) => {
    if (!andando() || tempo() < paradaAte) return;
    freioAte = agora + BICICLETA.freioDura;
    chiado(0.3, 420, 0.06, 'lowpass');
    marcas.push({ x, t: agora, cor: escuro('#8fae6b', 0.5) });
    /* freou com o gambá chegando: ela para, a família atravessa, e isso é dela */
    const g = coisas.find((c) => !c.feito && c.tipo === 'gamba' && (c.x - x) * sentido > 0 && ((c.x - x) * sentido) / Math.max(0.3 * v0, vRel * v0) < 1.6);
    if (g) {
      g.feito = true;
      g.foge = true;
      sozinha += 1;
      pediram += 1;
      erros = 0;
      paradaAte = agora + BICICLETA.parada;
      sininho(0.2);
    }
  };
  const abaixar = (agora: number) => {
    if (!andando()) return;
    abaixaAte = agora + BICICLETA.abaixaDura;
    chiado(0.08, 500, 0.04);
  };
  const toque = (ev: PointerEvent) => {
    if (fase === 'fim' || naBorda(ev.clientX, ev.clientY)) return;
    const rc = canvas.getBoundingClientRect();
    const px = ev.clientX - rc.left;
    const py = ev.clientY - rc.top;
    if (!audio.pronto) void audio.tentarDestravar();
    parada = 0;
    maoEm = null;
    const agora = tempo();
    const sX = xDaStella();
    const noCeu = py < chao() - H * 0.19;
    const frente = (px - sX) * sentido;
    if (!noCeu && Math.abs(frente) <= 46 && gestos.abaixar) return abaixar(agora);
    if (!noCeu && frente > 46 && gestos.acelerar) return acelerar(agora);
    if (!noCeu && frente < -46 && gestos.frear) return frear(agora);
    pular(agora);
  };
  canvas.addEventListener('pointerdown', toque);
  canvas.style.touchAction = 'none';

  /* ---------- desenho ---------- */

  function fundo(topo: number, ch: number, t: number): void {
    /* o céu em véu, como no Jardim; na volta grande a tarde vai chegando */
    const tarde = r.ceu === 'tarde' ? 1 : r.ceu === 'muda' ? Math.min(1, fase === 'ida' || fase === 'chegando' ? (x / D) * 0.5 : 0.5 + (1 - x / D) * 0.5) : 0;
    ctx.fillStyle = '#dbe7ee';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.ellipse(W * 0.3, topo * 0.5, W * 0.5, topo * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3 + tarde * 0.45;
    ctx.fillStyle = '#f3d9cf';
    ctx.beginPath();
    ctx.ellipse(W * 0.7, topo * 0.7, W * 0.55, topo * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ebd9a8';
    ctx.beginPath();
    ctx.arc(W * 0.68, topo * 0.36, 22, 0, Math.PI * 2);
    ctx.fill();
    /* a faixa do meio: o que fica longe passa mais devagar e fica um pouco acima do caminho */
    ctx.fillStyle = '#c9dbb2';
    ctx.fillRect(0, topo, W, ch - topo);
    const sX = xDaStella();
    const longe = (p: number) => sX + (p - x * 0.5) * W;
    const base = ch - 40;
    const tipoFundo = r.fundo;
    for (let i = -2; i < Math.ceil((D * 0.5 + 3) / 0.5); i++) {
      const xx = longe(i * 0.5);
      if (xx < -120 || xx > W + 120) continue;
      const k = Math.abs(i % 3);
      const t2 = tipoFundo === 'tudo' ? ['rua', 'bosque', 'morros'][Math.abs(Math.floor(i / 2)) % 3]! : tipoFundo;
      if (t2 === 'rua') {
        /* as casas dos vizinhos */
        const cor = ['#f6e3dc', '#ebd9a8', '#c9dbb2'][k]!;
        ctx.beginPath();
        ctx.rect(xx - 28, base - 44, 56, 44);
        formaNoCanvas(ctx, cor, { lapis: 0.35 });
        ctx.beginPath();
        ctx.moveTo(xx - 33, base - 42);
        ctx.lineTo(xx, base - 70);
        ctx.lineTo(xx + 33, base - 42);
        ctx.closePath();
        formaNoCanvas(ctx, ['#4f6b3a', '#8a3a44', '#35564d'][k]!, { lapis: 0.3 });
        ctx.beginPath();
        ctx.rect(xx - 7, base - 24, 14, 24);
        formaNoCanvas(ctx, '#fbf8f1', { lapis: 0.35 });
      } else if (t2 === 'bosque' || t2 === 'atalho') {
        const img = pinheiroImg[k % 2]!;
        ctx.drawImage(img, xx - 50, base - 192, 100, 192);
      } else if (t2 === 'morros') {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(xx - 120, base + 10);
        ctx.quadraticCurveTo(xx, base - 120, xx + 120, base + 10);
        ctx.closePath();
        ctx.fillStyle = '#8fae6b';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    void t;
  }

  function chaoDesenho(ch: number): void {
    const sX = xDaStella();
    const sx = (p: number) => sX + (p - x) * W;
    /* o chão sobe e desce: um caminho pela função de altura */
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    const passo = 10;
    for (let px = -10; px <= W + 10; px += passo) {
      const wx = x + (px - sX) / W;
      ctx.lineTo(px, yChao(wx));
    }
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
    ctx.fillStyle = '#8fae6b';
    ctx.fill();
    ctx.beginPath();
    for (let px = -10; px <= W + 10; px += passo) {
      const wx = x + (px - sX) / W;
      if (px === -10) ctx.moveTo(px, yChao(wx));
      else ctx.lineTo(px, yChao(wx));
    }
    lapisNoCanvas(ctx, '#8fae6b', { lapis: 0.35, w: 1.3 });
    /* na rua, a calçada */
    if (r.fundo === 'rua') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#d9c69a';
      ctx.lineWidth = 9;
      ctx.beginPath();
      for (let px = -10; px <= W + 10; px += passo) {
        const wx = x + (px - sX) / W;
        if (px === -10) ctx.moveTo(px, yChao(wx) + 6);
        else ctx.lineTo(px, yChao(wx) + 6);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#4f6b3a';
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, ch + (H - ch) * 0.65, W * 0.6, (H - ch) * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    /* os trechos: pedregulhos, areia, a ponte */
    for (const tr of trechos) {
      const a = sx(tr.x0);
      const b = sx(tr.x1);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      if (hi < -80 || lo > W + 80) continue;
      const cx = (a + b) / 2;
      const cy = yChao((tr.x0 + tr.x1) / 2);
      if (tr.tipo === 'areia') {
        ctx.beginPath();
        ctx.moveTo(lo, cy + 6);
        ctx.quadraticCurveTo(lo + (hi - lo) * 0.3, cy - 6, cx, cy);
        ctx.quadraticCurveTo(cx + (hi - lo) * 0.3, cy + 6, hi, cy + 6);
        ctx.closePath();
        formaNoCanvas(ctx, '#eeddb4', { lapis: 0.3 });
        ctx.beginPath();
        ctx.ellipse(cx + 18, cy - 3, 5, 4, 0, 0, Math.PI * 2);
        formaNoCanvas(ctx, '#f6e3dc', { lapis: 0.35 });
      } else if (tr.tipo === 'pedregulho') {
        const pedras: [number, number, number, number][] = [[-42, 0, 6, 3.5], [-22, -1, 4, 2.5], [-6, 0, 7, 4], [12, -1, 5, 3], [30, 0, 6, 3.5], [44, -1, 3.5, 2]];
        for (const [dx, dy, rx, ry] of pedras) {
          ctx.beginPath();
          ctx.ellipse(cx + dx, yChao((tr.x0 + tr.x1) / 2 + dx / W) + dy, rx, ry, 0, 0, Math.PI * 2);
          formaNoCanvas(ctx, '#b9b2a6', { lapis: 0.4 });
        }
      } else {
        /* a ponte: a água embaixo e as tábuas */
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, (hi - lo) / 2 + 6, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#9fc3cf';
        ctx.fill();
        ctx.globalAlpha = 1;
        for (let k = 0; k < 7; k++) {
          const px = lo + 4 + k * ((hi - lo - 8) / 7);
          ctx.beginPath();
          ctx.rect(px, cy - 5, (hi - lo - 8) / 7 - 3, 6);
          formaNoCanvas(ctx, '#c9a189', { lapis: 0.4 });
        }
        ctx.strokeStyle = '#c9a189';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lo, cy - 30);
        ctx.lineTo(hi, cy - 30);
        ctx.moveTo(lo + 6, cy - 30);
        ctx.lineTo(lo + 6, cy - 5);
        ctx.moveTo(hi - 6, cy - 30);
        ctx.lineTo(hi - 6, cy - 5);
        ctx.stroke();
      }
    }
    /* as marcas: a pedalada e a freada deixam risquinhos, que somem */
    const t = tempo();
    for (const mk of marcas) {
      const k = (t - mk.t) / 1.2;
      if (k > 1) continue;
      const px = sx(mk.x);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = mk.cor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(px - 26 * sentido, yChao(mk.x) - 2);
      ctx.lineTo(px - 4 * sentido, yChao(mk.x) - 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function coisa(c: CoisaViva, px: number, cy: number, t: number): void {
    if (c.tipo === 'lombada') {
      ctx.beginPath();
      ctx.ellipse(px, cy + 1, 26, 8, 0, 0, Math.PI * 2);
      formaNoCanvas(ctx, '#ebd9a8', { lapis: 0.4 });
    } else if (c.tipo === 'poca') {
      if (c.a2) {
        ctx.beginPath();
        ctx.rect(px - 30, cy - 3, 60, 5);
        formaNoCanvas(ctx, '#c9a189', { lapis: 0.4 });
        return;
      }
      ctx.beginPath();
      ctx.ellipse(px, cy + 2, 30, 6, 0, 0, Math.PI * 2);
      formaNoCanvas(ctx, '#9fc3cf', { lapis: 0.3 });
      ctx.strokeStyle = '#fbf8f1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 18, cy);
      ctx.quadraticCurveTo(px - 12, cy - 2, px - 6, cy);
      ctx.stroke();
    } else if (c.tipo === 'rampa') {
      ctx.beginPath();
      ctx.moveTo(px - 24 * sentido, cy);
      ctx.lineTo(px + 24 * sentido, cy);
      ctx.lineTo(px + 20 * sentido, cy - 22);
      ctx.closePath();
      formaNoCanvas(ctx, '#c9a189', { lapis: 0.4 });
    } else if (c.tipo === 'tronco') {
      if (c.a2) {
        ctx.beginPath();
        ctx.moveTo(px - 26 * sentido, cy);
        ctx.lineTo(px + 26 * sentido, cy);
        ctx.lineTo(px + 22 * sentido, cy - 20);
        ctx.closePath();
        formaNoCanvas(ctx, '#c9a189', { lapis: 0.4 });
        return;
      }
      ctx.beginPath();
      ctx.rect(px - 26, cy - 22, 52, 22);
      formaNoCanvas(ctx, '#c9a189', { lapis: 0.4 });
      ctx.beginPath();
      ctx.arc(px + 26 * sentido, cy - 11, 11, 0, Math.PI * 2);
      formaNoCanvas(ctx, '#eeddb4', { lapis: 0.4 });
      ctx.strokeStyle = escuro('#eeddb4', 0.3);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(px + 26 * sentido, cy - 11, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (c.tipo === 'gamba') {
      const img = gambaImg[Math.floor(((c.passo % (Math.PI * 2)) / (Math.PI * 2)) * 4) % 4]!;
      ctx.save();
      ctx.translate(px, cy);
      ctx.scale(-sentido, 1);
      ctx.drawImage(img, -70, -100, 140, 110);
      ctx.restore();
    } else if (c.tipo === 'galho') {
      ctx.strokeStyle = '#c9a189';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px + 40 * sentido, cy - 190);
      ctx.quadraticCurveTo(px + 10 * sentido, cy - 140, px - 10 * sentido, cy - 108);
      ctx.stroke();
      for (const [a, b] of [[-4, -112], [8, -122], [18, -134], [2, -126]] as [number, number][]) {
        ctx.beginPath();
        ctx.ellipse(px + a * sentido, cy + b, 7, 4, 0, 0, Math.PI * 2);
        formaNoCanvas(ctx, '#8fae6b', { lapis: 0.35 });
      }
    }
    void t;
  }

  /** O caminho lá em cima: a casa, o lugar de hoje e a cabecinha dela entre os dois. */
  function mapa(y: number): void {
    const x0 = W * 0.2;
    const x1 = W * 0.8;
    const k = Math.min(1, Math.max(0, x / D));
    const xs = x0 + (x1 - x0) * k;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4f6b3a';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const voltando = fase === 'volta' || fase === 'entrando' || fase === 'fim';
    ctx.strokeStyle = '#f2a9c4';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(voltando ? x1 : xs, y);
    ctx.stroke();
    if (voltando) {
      ctx.strokeStyle = '#c6a15b';
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(xs, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#8fae6b';
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0 - 12, y + 9);
    ctx.lineTo(x0 - 12, y - 3);
    ctx.lineTo(x0, y - 14);
    ctx.lineTo(x0 + 12, y - 3);
    ctx.lineTo(x0 + 12, y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2a9c4';
    ctx.fillRect(x0 - 3, y + 1, 6, 8);
    /* o destino: uma figura simples */
    ctx.save();
    ctx.translate(x1, y);
    const d = r.destino;
    if (d === 'lago') {
      ctx.fillStyle = '#9fc3cf';
      ctx.beginPath();
      ctx.ellipse(0, 3, 17, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d === 'parquinho') {
      ctx.strokeStyle = '#c9a189';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.lineTo(-4, -10);
      ctx.lineTo(4, 10);
      ctx.moveTo(-14, -2);
      ctx.lineTo(14, 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = d === 'casa' ? '#8fae6b' : d === 'portao' ? '#f6e3dc' : '#ebd9a8';
      ctx.fillRect(-14, -4, 28, 12);
      ctx.fillStyle = d === 'padaria' ? '#8a3a44' : '#4f6b3a';
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(0, -14);
      ctx.lineTo(16, -4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#c79a5e';
    ctx.beginPath();
    ctx.arc(xs, y - 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9c39c';
    ctx.beginPath();
    ctx.arc(xs, y + 1, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function maozinha(px: number, py: number, k: number, t: number, escala = 1.3): void {
    ctx.save();
    ctx.translate(px + 3.6, py + k * 30 + (k === 0 ? Math.sin(t * 4) * 3 : 0));
    ctx.scale(escala, escala);
    ctx.fillStyle = '#f6e3dc';
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.fill(MAO());
    ctx.stroke(MAO());
    ctx.restore();
  }

  function desenhar(): void {
    const t = tempo();
    const topo = faixaTopo();
    const ch = chao();
    const sX = xDaStella();
    const sx = (p: number) => sX + (p - x) * W;
    fundo(topo, ch, t);
    mapa(topo * 0.62);
    chaoDesenho(ch);
    /* as coisas do chão */
    for (const c of coisas) {
      if (c.tipo === 'morro' || c.tipo === 'pedregulho' || c.tipo === 'areia' || c.tipo === 'ponte') continue;
      const px = sx(c.x);
      if (px < -100 || px > W + 100) continue;
      coisa(c, px, yChao(c.x), t);
    }
    /* quem espera no fim, e a família na porta */
    const xFim = sx(D + 0.22);
    if (fase !== 'volta' && fase !== 'entrando' && fase !== 'fim' && xFim > -120 && xFim < W + 120) {
      const yq = yChao(D + 0.22);
      espera.forEach((img, i) => ctx.drawImage(img, xFim - 100 + i * 46, yq - 190, 200, 200));
    }
    const xCasa = sx(-0.25);
    if (xCasa > -200 && xCasa < W + 200) {
      /* a casa verde, onde começa e termina */
      const w = Math.min(150, W * 0.36);
      const h = w * 0.62;
      const yc = yChao(-0.25);
      ctx.beginPath();
      ctx.moveTo(xCasa - w / 2, yc);
      ctx.lineTo(xCasa - w / 2, yc - h);
      ctx.lineTo(xCasa, yc - h - w * 0.4);
      ctx.lineTo(xCasa + w / 2, yc - h);
      ctx.lineTo(xCasa + w / 2, yc);
      ctx.closePath();
      formaNoCanvas(ctx, '#8fae6b');
      ctx.beginPath();
      ctx.rect(xCasa - w * 0.11, yc - h * 0.62, w * 0.22, h * 0.62);
      formaNoCanvas(ctx, '#6e1a27');
      /* a família na porta, recebendo: aparece quando a casa se aproxima, na volta */
      if (fase === 'volta' || fase === 'entrando' || fase === 'fim') familiaEmCasa.forEach((img, i) => ctx.drawImage(img, xCasa + w * 0.5 + 8 + i * 40 - 100, yc - 190, 200, 200));
    }
    /* a Stella na bicicleta */
    const alt = alturaDoPulo(pulo, t) * H;
    const esc = (H * BICICLETA.alturaDaStella) / alturaBici;
    const tam = F * esc;
    /* a bicicleta inclina com o chão: o ângulo é o da tangente na tela, para onde quer que ela olhe */
    let ang = Math.atan2(inclinacao(morros, x, 1) * H, W) * 0.6;
    if (pulo && !pulo.lento && t >= pulo.inicio && t <= pulo.fim) {
      const k = (t - pulo.inicio) / (pulo.fim - pulo.inicio);
      ang = pulo.giro ? -k * Math.PI * 2 * sentido : -(0.5 - k) * 0.5 * sentido;
    }
    const treme = trechoEm(x) === 'pedregulho' && !noArAgora() && andando() ? Math.sin(t * 60) * 1.6 : 0;
    const abaixada = t < abaixaAte;
    const img = abaixada ? biciAbaixada : bici[Math.floor(((rodou % 1) + 1) % 1 * QUADROS) % QUADROS]!;
    ctx.save();
    ctx.translate(sX, yChao(x) - alt + treme);
    ctx.rotate(ang);
    ctx.scale(sentido, 1);
    ctx.drawImage(img, -tam / 2, -200 * esc, tam, tam);
    ctx.restore();
    /* as gotas da poça e do borrifo */
    for (const g of gotas) {
      const k = (t - g.t) / 0.7;
      if (k > 1) continue;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = g.cor;
      ctx.beginPath();
      ctx.ellipse(sx(g.x) + (g.y - 3) * 10 * k, yChao(g.x) - 30 * k + 40 * k * k, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const c of centelhasVivas) {
      const k = (t - c.t) / 1.4;
      if (k > 1) continue;
      ctx.save();
      ctx.translate(c.x - 10, c.y - 10 - k * 40);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = k < 0.5 ? '#c6a15b' : '#f2a9c4';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
    /* o enfeite novo: sobe do bolso de quem esperava e brilha na bicicleta */
    if (enfeiteNovo && t - tEnfeite < 3) {
      const k = Math.min(1, (t - tEnfeite) / 1.2);
      ctx.save();
      ctx.translate(sX + 40 * sentido * (1 - k), yChao(x) - H * 0.12 - (1 - k) * 60);
      ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
    /* a mãozinha: no lugar do gesto que a coisa pede, na hora certa */
    if (maoEm && andando() && t < maoEm.ate) {
      const c = maoEm.coisa;
      const ate = ((c.x - x) * sentido) / Math.max(0.3 * v0, vRel * v0);
      const g: Gesto = c.tipo === 'galho' ? 'abaixar' : c.tipo === 'morro' || c.tipo === 'areia' || c.tipo === 'rampa' ? 'acelerar' : 'pular';
      const k = g === 'pular' ? apertoDaMao(ate) : Math.abs(Math.sin(t * 5)) > 0.5 ? 1 : 0;
      if (g === 'pular') {
        const px = Math.max(30, Math.min(W - 30, sx(c.x)));
        maozinha(px, yChao(c.x) - 100, k, t);
      } else if (g === 'acelerar') maozinha(sX + 90 * sentido, ch - 30, k, t);
      else maozinha(sX + 4, ch - 60, k, t);
    }
  }

  /* ---------- simulação ---------- */

  function simular(): void {
    const t = tempo();
    const dt = Math.min(0.05, Math.max(0, t - tAnterior));
    tAnterior = t;
    const inc = inclinacao(morros, x, sentido);
    const tr = trechoEm(x);
    if (andando()) {
      vRel = passoDeVelocidade(vRel, { inclinacao: inc, trecho: tr, freando: t < freioAte, deslizando: t < deslizaAte, noAr: noArAgora(), parada: t < paradaAte }, dt);
      x += sentido * vRel * v0 * dt;
      rodou += (vRel * v0 * dt * W) / 40;
      /* pedregulhos: trrrr; a ponte: toc toc, uma nota por tábua; a areia: o rastro */
      if (tr === 'pedregulho' && !noArAgora() && t - ultimoChiado > 0.09) {
        ultimoChiado = t;
        chiado(0.05, 700, 0.025);
      } else if (tr === 'ponte' && !noArAgora() && t - ultimoChiado > 0.22) {
        ultimoChiado = t;
        toc(900, 0.08);
        lira(PENTATONICA[Math.floor(x * 6) % 5]!, undefined, 0.15);
      } else if (tr === 'areia' && !noArAgora() && t - ultimoChiado > 0.12) {
        ultimoChiado = t;
        marcas.push({ x: x - 0.06 * sentido, t, cor: '#d9c69a' });
      }
      /* a crista: rápido no alto, ela decola; a descida grande, o uuuh */
      for (const mo of morros) {
        const chave = `${fase}:${mo.x}`;
        if (cristas.has(chave)) continue;
        if ((mo.x - x) * sentido <= 0) {
          cristas.add(chave);
          const h = decolagem(vRel);
          if (h > 0 && !noArAgora()) {
            pulo = { inicio: t, fim: t + 0.6 + h * 3, h };
            liraSobe();
            if (h > 0.08) centelhasVivas.push({ x: xDaStella(), y: yChao(x) - H * 0.2, t });
          } else if (mo.grande) liraDesce();
        }
      }
    } else if (fase === 'chegando' || fase === 'entrando') {
      /* ela freia sozinha ao ver quem espera, e na porta de casa (a freada anda com a base: para sempre no mesmo lugar) */
      vRel = Math.max(0, vRel - FREADA * dt * (v0 / BICICLETA.velocidade));
      x += sentido * vRel * v0 * dt;
      rodou += (vRel * v0 * dt * W) / 40;
    }
    /* o pulo acabou: o pouso */
    if (pulo && t > pulo.fim) {
      pulo = null;
      toc(300, 0.06);
    }
    /* o gambá anda: devagar quando ela chega, e foge na frente na ajuda */
    for (const c of coisas) {
      if (c.tipo !== 'gamba') continue;
      c.passo += dt * (c.foge ? 6 : 3);
      if (c.foge) c.x += Math.max(vRel * v0 * 1.05, 0.15) * dt * sentido;
    }
    if (andando()) {
      for (const c of coisas) {
        if (c.feito) continue;
        const d = (c.x - x) * sentido;
        const ate = d / Math.max(0.3 * v0, vRel * v0);
        const mostra = ['lombada', 'tronco', 'gamba', 'galho', 'morro', 'areia', 'rampa'].includes(c.tipo);
        if (!c.maoMostrada && d > 0 && ate < 1.4 && (c.nova || erros >= BICICLETA.errosParaA1) && mostra) {
          c.maoMostrada = true;
          maoEm = { coisa: c, ate: t + 1.3 };
          if (erros >= BICICLETA.errosParaA1) ajudou = true;
        }
        /* A2: a coisa se resolve à vista: o gambá foge na frente, a poça vira tábua, o tronco vira rampinha */
        if (erros >= BICICLETA.errosParaA2 && !c.a2 && d > 0 && ate < 1.6 && ['gamba', 'tronco', 'lombada', 'galho', 'poca'].includes(c.tipo)) {
          c.a2 = true;
          a2Vezes += 1;
          if (c.tipo === 'gamba') c.foge = true;
        }
        /* um tiquinho de folga depois da borda: o dedo da criança atrasa */
        if (d > -0.03) continue;
        c.feito = true;
        const ar = noArAgora();
        switch (c.tipo) {
          case 'lombada':
            pediram += 1;
            if (ar) {
              sozinha += 1;
              sininho(0.2);
              break;
            }
            if (c.a2) break;
            erros += 1;
            toc(140, 0.2);
            pulo = { inicio: t, fim: t + 0.3, h: 0.02 };
            break;
          case 'poca':
            if (ar) {
              sininho(0.2);
              break;
            }
            /* passar direto é a deslizada: shhh, borrifo, rastro molhado e uma aceleradinha */
            chiado(0.5, 2600, 0.05, 'highpass');
            for (let i = 0; i < 6; i++) gotas.push({ x: c.x, y: i, t, cor: '#9fc3cf' });
            vRel = deslizar(vRel);
            deslizaAte = t + BICICLETA.deslizaDura;
            marcas.push({ x: c.x, t, cor: '#9fc3cf' });
            break;
          case 'rampa': {
            if (ar) break;
            const voo = vooDaRampa(vRel);
            pulo = { inicio: t, fim: t + 0.6 + voo.h * 2.5, h: voo.h, giro: voo.giro };
            liraSobe();
            if (voo.giro) {
              centelhasVivas.push({ x: xDaStella(), y: yChao(x) - H * 0.22, t });
              centelhasSom();
            }
            break;
          }
          case 'tronco':
            pediram += 1;
            if (ar) {
              sozinha += 1;
              sininho(0.2);
              break;
            }
            if (c.a2) {
              pulo = { inicio: t, fim: t + 0.75, h: 0.08 };
              break;
            }
            /* ela para, desce, passa a bicicleta por cima e segue */
            erros += 1;
            paradaAte = t + BICICLETA.parada;
            toc(600, 0.15);
            pulo = { inicio: t + 0.5, fim: t + 1.5, h: 0.05, lento: true };
            break;
          case 'gamba':
            pediram += 1;
            if (ar) {
              sozinha += 1;
              sininho(0.2);
              break;
            }
            if (c.a2) break;
            /* ela freia e espera a família atravessar; o gambá foge na frente */
            erros += 1;
            paradaAte = t + BICICLETA.parada;
            c.foge = true;
            chiado(0.3, 200, 0.05, 'lowpass');
            break;
          case 'galho':
            pediram += 1;
            if (t < abaixaAte) {
              sozinha += 1;
              erros = 0;
              sininho(0.2);
              break;
            }
            if (c.a2) break;
            erros += 1;
            toc(600, 0.15);
            for (let i = 0; i < 2; i++) gotas.push({ x: c.x, y: 3 + i, t, cor: '#8fae6b' });
            break;
          default:
            break;
        }
      }
    }
    /* as fases: ida, a chegada, o encontro, a volta, a casa */
    if (fase === 'ida' && x >= D - 0.3 - distanciaDeFreada()) {
      fase = 'chegando';
    } else if (fase === 'chegando' && vRel <= 0.02) {
      fase = 'encontro';
      tFase = t;
      pulo = null;
      void festa();
    } else if (fase === 'encontro' && t - tFase >= 3.4) {
      fase = 'volta';
      sentido = -1;
      vRel = 1;
      erros = 0;
      maoEm = null;
      for (const c of coisas) {
        c.feito = false;
        c.a2 = false;
        c.foge = false;
        c.maoMostrada = true;
        c.x = c.x0;
      }
    } else if (fase === 'volta' && x <= 0.3 + distanciaDeFreada()) {
      fase = 'entrando';
    } else if (fase === 'entrando' && vRel <= 0.02) {
      fase = 'fim';
      void terminar();
    }
    /* a rede de segurança: mesmo sem nenhum toque, o passeio acaba */
    if (fase !== 'fim' && t > BICICLETA.duracaoMaxima) {
      fase = 'fim';
      void terminar();
    }
  }

  /** A chegada: quem espera acena, centelhas, a lira sobe, palmas, e a voz gravada. Nunca a voz do aparelho. */
  async function festa(): Promise<void> {
    liraSobe();
    await esperar(350);
    if (!vivo) return;
    centelhasVivas.push({ x: xDaStella() + 30, y: yChao(x) - H * 0.16, t: tempo() });
    centelhasSom();
    aplauso(1.6);
    if (temVoz('chegou_bicicleta')) await falar('chegou_bicicleta');
  }

  let quadros = 0;
  const laco = () => {
    if (!vivo) return;
    simular();
    desenhar();
    quadros += 1;
    requestAnimationFrame(laco);
  };

  const terminar = async () => {
    liraDesce();
    const bom = passeioBom(sozinha, pediram);
    let novo: Enfeite | null = null;
    mudar((x) => {
      novo = depoisDoPasseio(x.bicicleta, r, bom, a2Vezes);
      x.lembrancas.push(`bicicleta:${x.hoje.dia}`);
      if (ajudou) x.registro.a1.passeio = (x.registro.a1.passeio ?? 0) + 1;
      if (a2Vezes) x.registro.a2.passeio = (x.registro.a2.passeio ?? 0) + 1;
      ganhar(x, PEDRINHAS.passeio, 'passeio');
    });
    if (novo) {
      enfeiteNovo = novo;
      enfeites.push(novo);
      tEnfeite = tempo();
      anunciar('enfeite');
      await esperar(1200);
      if (!vivo) return;
      /* os quadros com o enfeite novo */
      for (let i = 0; i < QUADROS; i++) bici[i] = quadro(i);
      centelhasVivas.push({ x: xDaStella(), y: yChao(x) - H * 0.14, t: tempo() });
      centelhasSom();
    }
    await esperar(900);
    seq.parar();
    if (vivo) hud.acender();
  };
  const sair = async () => {
    seq.parar();
    void sessao.voltarParaCasa();
  };

  /* começa */
  pararFundo();
  void audio.tentarDestravar().then(() => {
    tInicio = audio.agora() + 0.6;
    tAnterior = 0;
    seq.iniciar(tInicio);
    requestAnimationFrame(laco);
  });
  /* parada, a mãozinha volta a cada 6 s na próxima coisa que pede gesto */
  const tique = window.setInterval(() => {
    if (!andando()) return;
    parada += 1;
    if (parada % 6 === 0) {
      const c = proxima();
      if (c) maoEm = { coisa: c, ate: tempo() + 1.5 };
    }
  }, 1000);
  limpezas.push(() => window.clearInterval(tique));

  return {
    el,
    destruir: () => {
      vivo = false;
      seq.parar();
      canvas.removeEventListener('pointerdown', toque);
      for (const l of limpezas) l();
      void quadros;
      void cadaDaRota;
      void convidarParaCasa;
      void centelha;
    },
  };
}
