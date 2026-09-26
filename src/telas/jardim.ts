import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { observarCaixa } from '@/core/util';
import { naBorda, segurar, tocavel } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { familia, type Pose } from '@/puppet/boneco';
import { CENTELHA } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { lira, liraSobe, sininho, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** Dados do balanceamento da aventura. */
export const JARDIM = {
  /** de casa até o coelhinho, em larguras de tela */
  caminho: 9,
  /** velocidade da caminhada, em larguras de tela por segundo */
  velocidade: 0.24,
  /** um obstáculo a cada tantos compassos de caminhada */
  compassosPorObstaculo: 2,
  /** nas duas primeiras aventuras, mais espaçado */
  compassosPorObstaculoInicio: 4,
  /** o pulo procura o obstáculo: um toque até tantos segundos antes estica o pulo até passar */
  janelaDoPulo: 0.7,
  /** duração do sauté, em segundos */
  duracaoDoPulo: 0.75,
  /** escorregou: cai, senta, ri e levanta, em segundos */
  queda: 1.6,
  /** o abraço no coelhinho, antes de virar para casa */
  encontro: 2.4,
  /** a Stella em fração da altura da tela */
  alturaDaStella: 0.13,
  /** passadas por segundo */
  passadas: 1.7,
};

/**
 * Os instantes (em beats desde o começo) em que os obstáculos chegam: sempre
 * num tempo forte, a cada N compassos, pulando os dois primeiros compassos.
 * A Árvore Grande usa para as pinhas.
 */
export function beatsDosObstaculos(compasso: number, bpm: number, duracao: number, cada: number): number[] {
  const beatsTotais = (duracao * bpm) / 60;
  const out: number[] = [];
  for (let b = compasso * 2; b < beatsTotais - compasso; b += compasso * cada) out.push(b);
  return out;
}

/**
 * O pulo procura o obstáculo: dado o instante do toque e os instantes dos
 * obstáculos, devolve o instante em que o pulo deve estar no ar (o do
 * obstáculo) ou null se não há obstáculo perto. A Árvore Grande usa.
 */
export function alvoDoPulo(tToque: number, obstaculos: number[], janela: number, duracaoDoPulo: number): number | null {
  for (const t of obstaculos) {
    if (t >= tToque - duracaoDoPulo * 0.3 && t <= tToque + janela) return t;
  }
  return null;
}

/**
 * Onde ficam os obstáculos no caminho (em larguras de tela, a casa é o 0):
 * um a cada `espaco`, com folga perto da casa e perto do coelhinho. Ida e
 * volta usam o mesmo caminho, como na vida.
 */
export function obstaculosDoCaminho(comprimento: number, espaco: number, folgaCasa = 1.2, folgaCoelho = 1.0): number[] {
  const out: number[] = [];
  for (let p = folgaCasa; p <= comprimento - folgaCoelho + 1e-9; p += espaco) out.push(Math.round(p * 1000) / 1000);
  return out;
}

/** Quantas larguras de tela ela anda em N compassos da música. */
export function espacoEmCompassos(compassos: number, compasso: number, bpm: number, velocidade: number): number {
  return compassos * compasso * (60 / bpm) * velocidade;
}

/**
 * O pulo sai na hora do toque. Se um obstáculo chega em até `janela`
 * segundos, o pulo estica para ela pousar só depois dele: o pulo procura o
 * obstáculo. Devolve o instante em que ela pousa.
 */
export function fimDoPulo(agora: number, ateObstaculo: number | null, janela: number, duracao: number): number {
  const fim = agora + duracao;
  if (ateObstaculo === null || ateObstaculo < 0 || ateObstaculo > janela) return fim;
  return Math.max(fim, agora + ateObstaculo + 0.2);
}

/** O pior caso: sem nenhum toque ela cai em todos e ainda assim chega em casa. */
export function duracaoMaxima(comprimento: number, velocidade: number, obstaculos: number, queda: number, encontro: number): number {
  return (2 * comprimento) / velocidade + 2 * obstaculos * queda + encontro;
}

/** Um svg de figura vira imagem para o canvas, sem raster no repositório. */
function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

/** onde fica a porta de casa no caminho */
const CASA = -0.2;

type Tipo = 'poca' | 'pedra' | 'tronco';
const TIPOS: Tipo[] = ['poca', 'pedra', 'poca', 'tronco'];

/**
 * A aventura do Jardim, em retrato: céu em cima, faixa de jogo no meio,
 * terra embaixo. O coelhinho fugiu para o fim do jardim: a Stella sai de
 * casa, vai buscar e volta com ele. Toque em qualquer lugar = pular poças,
 * pedras e troncos. Pulou fora da hora, escorrega, senta, ri e levanta. Sem
 * vida, sem tempo, sem pontos. Termina sempre, na porta de casa, e vai ao palco.
 */
export function telaJardim(): Tela {
  const e = estado();
  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = '#dbe7ee';
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  const hud = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  hud.setAttribute('viewBox', '0 0 390 780');
  hud.setAttribute('class', 'cena');
  hud.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  hud.style.pointerEvents = 'none';
  hud.innerHTML = `<g class="casinha" style="pointer-events:auto"><circle cx="40" cy="44" r="36" fill="#f6f0e4" opacity="0.85"/><path d="M23 46L40 29L57 46V60H23z" fill="#8FAE6B" stroke="#4f6b3a" stroke-width="1.6" stroke-linejoin="round"/><path d="M35.5 60V50H44.5V60" fill="#f2a9c4"/></g><g class="lua-pais" style="pointer-events:auto"><circle cx="352" cy="104" r="30" fill="transparent"/><path d="M352 95a9 9 0 1 0 8 13a7 7 0 1 1-8-13z" fill="#ebd9a8" opacity="0.5"/></g>`;
  el.appendChild(hud);
  const limpezas: (() => void)[] = [];
  limpezas.push(tocavel(hud.querySelector('.casinha')!, () => void sair('casa')));
  limpezas.push(segurar(hud.querySelector('.lua-pais')!, 2000, () => void sair('pais')));

  const ctx = canvas.getContext('2d')!;
  let W = 390;
  let H = 780;
  const redimensionar = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const obs = observarCaixa(canvas, redimensionar);
  limpezas.push(() => obs?.disconnect());

  /* as figuras: oito quadros de caminhada, o salto, o escorregão, sentada, de pé, o abraço */
  const F = 200;
  const pose = (p: Pose, extra = {}) => imagemDe(familia.stella(100, 190, 160, p, extra).svg, F, F);
  const QUADROS = 8;
  const stellaAnda = Array.from({ length: QUADROS }, (_, i) => pose('anda', { passo: i / QUADROS }));
  const stellaSalto = pose('salto');
  const stellaEscorrega = pose('escorrega');
  const stellaSenta = imagemDe(familia.stella(100, 190, 160, 'sentado').svg, F, F);
  const stellaParada = pose('parado');
  const stellaAbraca = pose('abraca');
  const stellaAcena = pose('acena');

  const m = musica('valsa_das_flores');
  const cada = e.aventuras < 2 ? JARDIM.compassosPorObstaculoInicio : JARDIM.compassosPorObstaculo;
  const D = JARDIM.caminho;
  const v = JARDIM.velocidade;
  const espaco = espacoEmCompassos(cada, m.compasso, m.bpm, v);
  const obst = obstaculosDoCaminho(D, espaco).map((p, i) => ({ p, tipo: TIPOS[i % TIPOS.length]!, resolvido: false, viraFolha: false }));
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.36;
  let tInicio = 0;

  /* o estado da caminhada */
  type Fase = 'ida' | 'encontro' | 'volta' | 'entrando' | 'fim';
  let fase: Fase = 'ida';
  let d = 0;
  let sentido: 1 | -1 = 1;
  let tFase = 0;
  let tAnterior = 0;
  let passo = 0;
  let pulo: { inicio: number; fim: number } | null = null;
  let queda: { inicio: number; tipo: Tipo } | null = null;
  let comCoelho = false;
  let vivo = true;
  const ajuda = new Ajuda();
  let perdidos = 0;

  const tempo = () => audio.agora() - tInicio;
  const faixaTopo = () => H * 0.34;
  const chao = () => H * 0.66;
  /* ela anda com o caminho à frente: na ida fica à esquerda, na volta à direita */
  const xDaStella = (t: number) => {
    const ida = W * 0.36;
    const volta = W * 0.64;
    if (fase === 'ida') return ida;
    if (fase === 'encontro') {
      const k = Math.min(1, Math.max(0, (t - tFase) / JARDIM.encontro));
      return ida + (volta - ida) * (0.5 - 0.5 * Math.cos(k * Math.PI));
    }
    return volta;
  };
  const caida = (t: number) => queda !== null && t < queda.inicio + JARDIM.queda;
  const noAr = (t: number) => pulo !== null && t >= pulo.inicio && t <= pulo.fim;
  const alturaDoPulo = (t: number) => {
    if (!pulo || t < pulo.inicio || t > pulo.fim) return 0;
    const k = (t - pulo.inicio) / (pulo.fim - pulo.inicio);
    return Math.sin(k * Math.PI) * H * 0.085;
  };
  const andando = () => fase === 'ida' || fase === 'volta' || fase === 'entrando';

  const toque = (ev: PointerEvent) => {
    if (fase === 'fim' || naBorda(ev.clientX, ev.clientY)) return;
    const r = canvas.getBoundingClientRect();
    const y = ev.clientY - r.top;
    if (y < faixaTopo() - 60) {
      tiquinho();
      return;
    }
    if (!audio.pronto) void audio.tentarDestravar();
    ajuda.tocou();
    const agora = tempo();
    if (!andando() || caida(agora) || (pulo && agora < pulo.fim)) return;
    const prox = obst.find((o) => !o.resolvido && (o.p - d) * sentido > -0.03);
    const ate = prox ? ((prox.p - d) * sentido) / v : null;
    pulo = { inicio: agora, fim: fimDoPulo(agora, ate, JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo) };
    lira(74, undefined, 0.25);
  };
  canvas.addEventListener('pointerdown', toque);
  canvas.style.touchAction = 'none';

  /* ---------- desenho ---------- */

  function coelho(x: number, y: number, s: number, olha: 1 | -1, t: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(olha * s, s);
    ctx.fillStyle = '#e9e2d6';
    ctx.beginPath();
    ctx.ellipse(0, -12, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -24, 9, 0, Math.PI * 2);
    ctx.fill();
    const orelha = Math.sin(t * 3) * 0.12;
    ctx.beginPath();
    ctx.ellipse(12, -40, 3, 10, -0.2 + orelha, 0, Math.PI * 2);
    ctx.ellipse(19, -40, 3, 10, 0.2 - orelha, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.arc(-15, -14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1c2b';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(17, -25, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function casa(x: number, ch: number): void {
    const w = Math.min(150, W * 0.36);
    const h = w * 0.62;
    ctx.fillStyle = '#8fae6b';
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, ch);
    ctx.lineTo(x - w / 2, ch - h);
    ctx.lineTo(x, ch - h - w * 0.4);
    ctx.lineTo(x + w / 2, ch - h);
    ctx.lineTo(x + w / 2, ch);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2a9c4';
    ctx.fillRect(x - w * 0.11, ch - h * 0.62, w * 0.22, h * 0.62);
    ctx.fillStyle = '#ebd9a8';
    ctx.fillRect(x + w * 0.2, ch - h * 0.75, w * 0.16, w * 0.14);
  }

  function obstaculo(o: (typeof obst)[number], x: number, ch: number): void {
    if (o.viraFolha) {
      /* a ajuda: a poça vira vitória-régia, a pedra e o tronco viram tufo de flor */
      ctx.fillStyle = '#8fae6b';
      ctx.beginPath();
      ctx.ellipse(x, ch + 2, 34, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a9c4';
      ctx.beginPath();
      ctx.arc(x, ch - 4, 6, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (o.tipo === 'poca') {
      ctx.fillStyle = '#9fc3cf';
      ctx.beginPath();
      ctx.ellipse(x, ch + 3, 40, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf8f1';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(x - 6, ch + 2, 24, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (o.tipo === 'pedra') {
      ctx.fillStyle = '#b6a58c';
      ctx.beginPath();
      ctx.ellipse(x, ch - 9, 17, 13, 0, Math.PI, 0);
      ctx.lineTo(x + 17, ch + 1);
      ctx.lineTo(x - 17, ch + 1);
      ctx.fill();
      ctx.fillStyle = '#d9d0c0';
      ctx.beginPath();
      ctx.ellipse(x - 5, ch - 14, 6, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#a8845f';
      ctx.beginPath();
      ctx.roundRect(x - 30, ch - 16, 60, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#c9a189';
      ctx.beginPath();
      ctx.ellipse(x + 26, ch - 8, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8fae6b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 10, ch - 16);
      ctx.quadraticCurveTo(x - 14, ch - 26, x - 6, ch - 28);
      ctx.stroke();
    }
  }

  /** O caminho lá em cima: a casa, o coelhinho e a Stella andando entre os dois. */
  function mapa(y: number): void {
    const x0 = W * 0.2;
    const x1 = W * 0.8;
    const xs = x0 + (x1 - x0) * Math.min(1, Math.max(0, d / D));
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4f6b3a';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    /* a ida pinta de rosa; a volta pinta de ouro por cima */
    ctx.strokeStyle = '#f2a9c4';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(comCoelho ? x1 : xs, y);
    ctx.stroke();
    if (comCoelho) {
      ctx.strokeStyle = '#c6a15b';
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(xs, y);
      ctx.stroke();
    }
    /* a casinha */
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
    /* o coelhinho espera no fim; depois vai junto */
    if (!comCoelho) coelho(x1 + 6, y + 10, 0.75, -1, tempo());
    /* a Stella: uma cabecinha loira */
    ctx.fillStyle = '#e2c27a';
    ctx.beginPath();
    ctx.arc(xs, y - 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F2D5BC';
    ctx.beginPath();
    ctx.arc(xs, y + 1, 7, 0, Math.PI * 2);
    ctx.fill();
    if (comCoelho) coelho(xs - sentido * 20, y + 10, 0.55, sentido, tempo());
  }

  function desenhar(): void {
    const t = tempo();
    const topo = faixaTopo();
    const ch = chao();
    const sX = xDaStella(t);
    const sx = (p: number) => sX + (p - d) * W;
    /* céu em véu */
    ctx.fillStyle = '#dbe7ee';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.ellipse(W * 0.3, topo * 0.5, W * 0.5, topo * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ebcdc3';
    ctx.beginPath();
    ctx.ellipse(W * 0.7, topo * 0.7, W * 0.5, topo * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ebd9a8';
    ctx.beginPath();
    ctx.arc(W * 0.82, topo * 0.3, 24, 0, Math.PI * 2);
    ctx.fill();
    mapa(topo * 0.62);
    /* faixa de jogo: mata ao fundo, árvores que passam mais devagar (ficam longe) */
    ctx.fillStyle = '#c9dbb2';
    ctx.fillRect(0, topo, W, ch - topo);
    const longe = (p: number) => sX + (p - d * 0.6) * W;
    for (let i = -2; i < Math.ceil((D * 0.6 + 2) / 0.45); i++) {
      const xx = longe(i * 0.45);
      if (xx < -80 || xx > W + 80) continue;
      ctx.fillStyle = '#c9a189';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(xx - 6, topo + 70, 12, ch - topo - 70);
      ctx.fillStyle = i % 2 ? '#35564d' : '#2c4a42';
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(xx, topo + 60, 60, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      /* fita de cetim pendurada */
      if (i % 2 === 0) {
        ctx.strokeStyle = '#f2a9c4';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xx, topo + 80);
        ctx.quadraticCurveTo(xx - 10 + Math.sin(t * 2 + i) * 8, topo + 140, xx + 8, topo + 190);
        ctx.stroke();
      }
    }
    /* chão */
    ctx.fillStyle = '#8fae6b';
    ctx.fillRect(0, ch, W, H - ch);
    ctx.fillStyle = '#4f6b3a';
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, ch + (H - ch) * 0.6, W * 0.6, (H - ch) * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(W, ch);
    ctx.stroke();
    ctx.globalAlpha = 1;
    /* pedrinhas do caminho, que mostram o avanço */
    ctx.fillStyle = '#4f6b3a';
    ctx.globalAlpha = 0.18;
    for (let i = Math.floor((d - 1) / 0.12); i < (d + 1) / 0.12; i++) {
      const x = sx(i * 0.12);
      ctx.beginPath();
      ctx.ellipse(x, ch + 14 + (i % 3) * 6, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* a casa, onde começa e termina */
    casa(sx(CASA), ch);
    /* flores: fechadas na ida, abrem quando ela passa e ficam abertas na volta */
    for (let i = 0; i < Math.ceil(D / 0.37); i++) {
      const p = 0.45 + i * 0.37;
      const fx = sx(p);
      if (fx < -20 || fx > W + 20) continue;
      const aberta = comCoelho || p < d;
      ctx.strokeStyle = '#4f6b3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, ch);
      ctx.lineTo(fx, ch - 18);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? '#f2a9c4' : '#ebd9a8';
      if (aberta) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 6, ch - 22 + Math.sin(a) * 6, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.ellipse(fx, ch - 22, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    /* obstáculos */
    for (const o of obst) {
      const x = sx(o.p);
      if (x < -80 || x > W + 80) continue;
      obstaculo(o, x, ch);
      /* ajuda A1: a mãozinha no obstáculo seguinte */
      const ate = ((o.p - d) * sentido) / v;
      if (ajuda.nivel >= 1 && !o.resolvido && ate < 2.5 && ate > 0.2 && andando()) {
        ctx.save();
        ctx.translate(x - 6, ch - 80);
        ctx.fillStyle = '#f6e3dc';
        ctx.strokeStyle = '#4f6b3a';
        ctx.lineWidth = 1.6;
        const p = new Path2D('M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z');
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
        ctx.fill(p);
        ctx.stroke(p);
        ctx.restore();
      }
    }
    /* a Stella */
    const hS = H * JARDIM.alturaDaStella;
    const esc = hS / 160;
    const tam = F * esc;
    const alt = alturaDoPulo(t);
    const escS = Math.min(1, esc * 1.6);
    /* o coelhinho: esperando no fim do caminho, depois pulando atrás dela */
    if (fase === 'ida') {
      const pulinho = Math.max(0, Math.sin(t * 2.4)) ** 6 * 10;
      coelho(sx(D), ch - pulinho, escS, -1, t);
    } else if (fase !== 'encontro') {
      const parado = caida(t);
      const hop = parado ? Math.abs(Math.sin(t * 5)) * 5 : Math.abs(Math.sin(passo * Math.PI * 2)) * 12;
      coelho(sX - sentido * 60 * escS, ch - hop - alt * 0.8, escS, sentido, t);
    }
    let img: HTMLImageElement = stellaAnda[Math.floor(passo * QUADROS) % QUADROS]!;
    let rot = 0;
    let dy = 0;
    let dx = 0;
    let alfa = 1;
    if (queda && caida(t)) {
      const k = t - queda.inicio;
      if (k < 0.35) {
        /* escorrega: os pés fogem para a frente e o corpo cai para trás */
        const q = k / 0.35;
        img = stellaEscorrega;
        rot = -sentido * 0.55 * q;
        dx = sentido * 14 * q;
        dy = -Math.sin(q * Math.PI) * hS * 0.12;
      } else if (k < 1.15) {
        /* sentadinha, ri */
        img = stellaSenta;
        dx = sentido * 14;
        dy = -Math.abs(Math.sin((k - 0.35) * 9)) * 3;
      } else {
        /* levanta e segue */
        img = stellaParada;
        const q = (k - 1.15) / (JARDIM.queda - 1.15);
        dx = sentido * 14 * (1 - q);
        dy = (1 - q) * hS * 0.15;
      }
    } else if (noAr(t)) {
      img = stellaSalto;
    } else if (fase === 'encontro') {
      const k = t - tFase;
      img = k < JARDIM.encontro * 0.6 ? stellaAbraca : stellaAcena;
    } else if (fase === 'fim') {
      img = stellaParada;
    }
    if (fase === 'entrando' || fase === 'fim') alfa = Math.max(0, Math.min(1, (d - CASA) / 0.2));
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(sX + dx, ch - alt + dy);
    ctx.rotate(rot);
    ctx.scale(sentido, 1);
    ctx.drawImage(img, -tam / 2, -190 * esc, tam, tam);
    ctx.restore();
    /* no encontro, o coelhinho no colo */
    if (fase === 'encontro') {
      const k = Math.min(1, (t - tFase) / 0.5);
      coelho(sX + sentido * (18 + (1 - k) * 50) * escS, ch - hS * 0.35 * k, escS * 0.8, -1, t);
      ctx.save();
      ctx.translate(sX - 10, ch - hS - 22 - (t - tFase) * 10);
      ctx.globalAlpha = Math.max(0, 1 - (t - tFase) / JARDIM.encontro);
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
    /* respingos da poça no escorregão */
    if (queda && queda.tipo === 'poca' && t - queda.inicio < 0.7) {
      const k = (t - queda.inicio) / 0.7;
      ctx.fillStyle = '#9fc3cf';
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.15 + (0.7 * i) / 5);
        ctx.beginPath();
        ctx.arc(sX + Math.cos(a) * 40 * k * (i % 2 ? 1 : -1), ch - Math.sin(a) * 36 * k + 30 * k * k, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /* pulo alto: uma centelha sobe */
    if (noAr(t) && alt > H * 0.07) {
      ctx.save();
      ctx.translate(sX - 10, ch - alt - hS - 18);
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
  }

  /* ---------- simulação ---------- */

  function escorregou(o: (typeof obst)[number], t: number): void {
    queda = { inicio: t, tipo: o.tipo };
    pulo = null;
    if (o.tipo === 'poca') toc(520, 0.14);
    toc(240, 0.2);
  }

  function simular(): void {
    const t = tempo();
    const dt = Math.min(0.05, Math.max(0, t - tAnterior));
    tAnterior = t;
    if (andando() && !caida(t)) {
      d += sentido * v * dt;
      passo = (passo + dt * JARDIM.passadas) % 1;
    }
    if (fase === 'ida' || fase === 'volta') {
      for (const o of obst) {
        /* um tiquinho de folga depois da borda: o dedo da criança atrasa */
        if (o.resolvido || (d - o.p) * sentido < 0.035) continue;
        o.resolvido = true;
        if (noAr(t) || o.viraFolha) {
          sininho(0.2);
          perdidos = Math.max(0, perdidos - 1);
        } else {
          escorregou(o, t);
          perdidos += 1;
        }
        /* cada obstáculo é uma etapa nova; a ajuda lembra quantos escorregões seguidos */
        ajuda.reset();
        for (let i = 0; i < Math.min(perdidos, 4); i++) ajuda.tentativa();
        if (ajuda.nivel >= 2) for (const p of obst) p.viraFolha = true;
      }
    }
    if (fase === 'ida' && d >= D - 0.3) {
      /* achou o coelhinho: abraço, e agora é voltar para casa */
      fase = 'encontro';
      tFase = t;
      pulo = null;
      liraSobe();
    } else if (fase === 'encontro' && t - tFase >= JARDIM.encontro) {
      fase = 'volta';
      sentido = -1;
      comCoelho = true;
      for (const o of obst) o.resolvido = false;
    } else if (fase === 'volta' && d <= 0.05) {
      fase = 'entrando';
    } else if (fase === 'entrando' && d <= CASA) {
      fase = 'fim';
      void terminar();
    }
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
    sininho(0.3);
    mudar((x) => {
      x.aventuras += 1;
      x.aventurasPor.jardim = (x.aventurasPor.jardim ?? 0) + 1;
      if (ajuda.alcancado[1] > 0) x.registro.a1.jardim = (x.registro.a1.jardim ?? 0) + 1;
      if (ajuda.alcancado[2] > 0) x.registro.a2.jardim = (x.registro.a2.jardim ?? 0) + 1;
    });
    await new Promise((r) => setTimeout(r, 900));
    seq.parar();
    if (vivo) void ir('palco');
  };
  const sair = async (para: string) => {
    seq.parar();
    void ir(para);
  };

  /* começa */
  pararFundo();
  void audio.tentarDestravar().then(() => {
    tInicio = audio.agora() + 0.6;
    tAnterior = 0;
    seq.iniciar(tInicio);
    requestAnimationFrame(laco);
  });
  const tique = window.setInterval(() => {
    if (andando()) ajuda.tick(1);
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
    },
  };
}
