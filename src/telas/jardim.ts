import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { observarCaixa } from '@/core/util';
import { naBorda, segurar, tocavel } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { familia } from '@/puppet/boneco';
import { CENTELHA } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { lira, sininho, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** Dados do balanceamento da aventura. */
export const JARDIM = {
  /** segundos de música */
  duracao: 120,
  /** um obstáculo a cada tantos compassos */
  compassosPorObstaculo: 2,
  /** nas duas primeiras aventuras, mais espaçado */
  compassosPorObstaculoInicio: 4,
  /** o toque procura o obstáculo: até tantos segundos antes vira o pulo certo */
  janelaDoPulo: 0.7,
  /** duração do sauté, em segundos */
  duracaoDoPulo: 0.75,
  /** velocidade do mundo em larguras de tela por segundo */
  velocidade: 0.28,
};

/**
 * Os instantes (em beats desde o começo) em que os obstáculos chegam na
 * Stella: sempre num tempo forte, a cada N compassos, pulando os dois
 * primeiros compassos para ela ver o jardim antes.
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
 * obstáculo) ou null se não há obstáculo perto.
 */
export function alvoDoPulo(tToque: number, obstaculos: number[], janela: number, duracaoDoPulo: number): number | null {
  for (const t of obstaculos) {
    if (t >= tToque - duracaoDoPulo * 0.3 && t <= tToque + janela) return t;
  }
  return null;
}

/** Um svg de figura vira imagem para o canvas, sem raster no repositório. */
function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

/**
 * A aventura do Jardim, em retrato: céu em cima, faixa de jogo no meio,
 * terra embaixo. A Stella corre sozinha; toque em qualquer lugar da faixa =
 * pular. Sem vida, sem tempo, sem pontos. Termina sempre, no palco.
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
  hud.innerHTML = `<g class="casinha" style="pointer-events:auto"><circle cx="40" cy="44" r="36" fill="#f6f0e4" opacity="0.85"/><path d="M23 46L40 29L57 46V60H23z" fill="#8FAE6B" stroke="#4f6b3a" stroke-width="1.6" stroke-linejoin="round"/><path d="M35.5 60V50H44.5V60" fill="#f2a9c4"/></g><g class="lua-pais" style="pointer-events:auto"><circle cx="352" cy="40" r="30" fill="transparent"/><path d="M352 31a9 9 0 1 0 8 13a7 7 0 1 1-8-13z" fill="#ebd9a8" opacity="0.5"/></g>`;
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

  /* as figuras */
  const F = 200;
  const stellaCorre = [familia.stella(100, 190, 160, 'parado').svg, familia.stella(100, 190, 160, 'acena').svg].map((s) => imagemDe(s, F, F));
  const stellaPula = imagemDe(familia.stella(100, 190, 160, 'pulo').svg, F, F);
  const stellaSenta = imagemDe(familia.stella(100, 190, 120, 'sentado').svg, F, F);

  const m = musica('valsa_das_flores');
  const cada = e.aventuras < 2 ? JARDIM.compassosPorObstaculoInicio : JARDIM.compassosPorObstaculo;
  const obstaculosBeats = beatsDosObstaculos(m.compasso, m.bpm, JARDIM.duracao, cada);
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.36;
  const segPorBeat = 60 / m.bpm;
  let tInicio = 0;
  const obst = obstaculosBeats.map((b, i) => ({ beat: b, tipo: i % 3 === 2 ? 'pedra' : 'poca', passou: false, tropecou: false, viraFolha: false }));
  let pulo: { inicio: number; fim: number } | null = null;
  let tropeco = 0;
  let acabou = false;
  let vivo = true;
  const ajuda = new Ajuda();
  let perdidos = 0;

  const tempo = () => audio.agora() - tInicio;
  const faixaTopo = () => H * 0.34;
  const chao = () => H * 0.66;
  const stellaX = () => W * 0.42;
  const px = (tObst: number, agora: number) => stellaX() + (tObst - agora) * JARDIM.velocidade * W;

  const pular = (agora: number, alvo: number | null) => {
    const dur = JARDIM.duracaoDoPulo;
    if (alvo !== null) pulo = { inicio: alvo - dur / 2, fim: alvo + dur / 2 };
    else pulo = { inicio: agora, fim: agora + dur * 0.6 };
    lira(74, undefined, 0.25);
  };

  const toque = (ev: PointerEvent) => {
    if (acabou || naBorda(ev.clientX, ev.clientY)) return;
    const r = canvas.getBoundingClientRect();
    const y = ev.clientY - r.top;
    if (y < faixaTopo() - 40 || y > chao() + 120) {
      tiquinho();
      return;
    }
    if (!audio.pronto) void audio.tentarDestravar();
    ajuda.tocou();
    const agora = tempo();
    const proximos = obst.filter((o) => !o.passou).map((o) => o.beat * segPorBeat);
    const alvo = alvoDoPulo(agora, proximos, JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo);
    if (pulo && agora < pulo.fim) return;
    pular(agora, alvo);
  };
  canvas.addEventListener('pointerdown', toque);
  canvas.style.touchAction = 'none';

  const noAr = (t: number) => pulo !== null && t >= pulo.inicio && t <= pulo.fim;
  const alturaDoPulo = (t: number) => {
    if (!pulo || t < pulo.inicio || t > pulo.fim) return 0;
    const k = (t - pulo.inicio) / (pulo.fim - pulo.inicio);
    return Math.sin(k * Math.PI) * H * 0.14;
  };

  function desenhar(): void {
    const t = tempo();
    const topo = faixaTopo();
    const ch = chao();
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
    /* faixa de jogo: mata ao fundo, grama, árvores que passam */
    ctx.fillStyle = '#c9dbb2';
    ctx.fillRect(0, topo, W, ch - topo);
    const desloc = t * JARDIM.velocidade * W;
    for (let i = -1; i < 5; i++) {
      const x = ((i * W * 0.45 - desloc) % (W * 2.25)) + (desloc % (W * 2.25) > 0 ? 0 : 0);
      const xx = ((x % (W * 2.25)) + W * 2.25) % (W * 2.25) - W * 0.3;
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
        ctx.quadraticCurveTo(xx - 10 + Math.sin(t * 2) * 8, topo + 140, xx + 8, topo + 190);
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
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(W, ch);
    ctx.stroke();
    ctx.globalAlpha = 1;
    /* flores que abrem quando ela passa */
    for (let i = 0; i < 8; i++) {
      const fx = ((i * W * 0.31 + W * 0.2 - desloc) % (W * 2.5) + W * 2.5) % (W * 2.5) - W * 0.2;
      const aberta = fx < stellaX();
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
      const to = o.beat * segPorBeat;
      const x = px(to, t);
      if (x < -80 || x > W + 80) continue;
      if (o.tipo === 'poca' || o.viraFolha) {
        ctx.fillStyle = o.viraFolha ? '#8fae6b' : '#9fc3cf';
        ctx.beginPath();
        ctx.ellipse(x, ch + 2, 44, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        if (o.viraFolha) {
          ctx.fillStyle = '#f2a9c4';
          ctx.beginPath();
          ctx.arc(x, ch - 4, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#fbf8f1';
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.ellipse(x, ch + 2, 30, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = '#b6a58c';
        ctx.beginPath();
        ctx.ellipse(x, ch - 4, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      /* ajuda A1: a mãozinha no obstáculo seguinte */
      if (ajuda.nivel >= 1 && !o.passou && to - t < 2.5 && to - t > 0.2) {
        ctx.save();
        ctx.translate(x - 6, ch - 70);
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
    /* o coelhinho, correndo junto (e na frente na ajuda A2) */
    const cx = stellaX() - 70 + (ajuda.nivel >= 2 ? 120 : 0);
    const cy = ch - Math.abs(Math.sin(t * 6)) * 14;
    ctx.fillStyle = '#e9e2d6';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 12, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 14, cy - 24, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 12, cy - 40, 3, 10, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 19, cy - 40, 3, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    /* a Stella: 20% da altura da tela */
    const hS = H * 0.2;
    const escala = hS / 160;
    const alt = alturaDoPulo(t);
    const sentada = t < tropeco;
    const img = sentada ? stellaSenta : noAr(t) ? stellaPula : stellaCorre[Math.abs(Math.floor(t * 6)) % 2]!;
    const wImg = F * escala;
    const hImg = F * escala;
    ctx.drawImage(img, stellaX() - wImg / 2, ch - alt - hImg * 0.95, wImg, hImg);
    /* pulo no tempo forte: uma centelha sobe */
    if (noAr(t) && alt > H * 0.12) {
      ctx.save();
      ctx.translate(stellaX() - 10, ch - alt - hImg - 6);
      ctx.scale(1, 1);
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
  }

  function simular(): void {
    const t = tempo();
    for (const o of obst) {
      const to = o.beat * segPorBeat;
      if (!o.passou && t > to + 0.2) {
        o.passou = true;
        if (noAr(to) || o.viraFolha) {
          sininho(0.2);
          perdidos = Math.max(0, perdidos - 1);
        } else {
          /* tropeçou: senta, ri, levanta. A fase não volta para trás. */
          o.tropecou = true;
          tropeco = t + 1.0;
          toc(240, 0.2);
          perdidos += 1;
          ajuda.tentativa();
          if (ajuda.nivel >= 2) for (const p of obst) if (!p.passou) p.viraFolha = true;
        }
        ajuda.reset();
        if (perdidos >= 2) ajuda.tentativa();
        if (perdidos >= 4) {
          ajuda.tentativa();
          ajuda.tentativa();
          ajuda.tentativa();
        }
        if (ajuda.nivel >= 2) for (const p of obst) if (!p.passou) p.viraFolha = true;
      }
    }
    if (!acabou && t >= JARDIM.duracao) void terminar();
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
    acabou = true;
    seq.parar();
    mudar((x) => {
      x.aventuras += 1;
      x.aventurasPor.jardim = (x.aventurasPor.jardim ?? 0) + 1;
      if (ajuda.nivel >= 1) x.registro.a1.jardim = (x.registro.a1.jardim ?? 0) + 1;
      if (ajuda.nivel >= 2) x.registro.a2.jardim = (x.registro.a2.jardim ?? 0) + 1;
    });
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
    seq.iniciar(tInicio);
    requestAnimationFrame(laco);
  });
  const tique = window.setInterval(() => ajuda.tick(1), 1000);
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
