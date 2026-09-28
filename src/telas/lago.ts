import { cantos } from './comum';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { observarCaixa } from '@/core/util';
import { naBorda } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { familia } from '@/puppet/boneco';
import { CENTELHA } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { lira, sininho, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** Dados do balanceamento do Lago dos Cisnes. */
export const LAGO = {
  /** rede de segurança: mesmo sem nenhum toque (a A2 leva uns 12 s por faixa), a aventura termina */
  duracao: 180,
  /** a ida até o coreto e a volta para casa, mostradas nas contas da margem de baixo */
  travessias: 2,
  faixas: 5,
  /** o toque procura a plataforma: até tantos segundos à frente */
  janelaDoPulo: 0.7,
  duracaoDoPulo: 0.6,
  /** velocidade das faixas em larguras de tela por segundo, da mais lenta à mais rápida */
  velocidades: [0.05, 0.065, 0.055, 0.07, 0.06],
  /** largura da plataforma em fração da tela */
  largura: 0.26,
  /** partes do coreto que acendem */
  partesDoCoreto: 6,
  /** cada ida e volta completa acelera as faixas nesta fração, até o teto */
  acelera: 0.08,
  aceleraTeto: 0.5,
  /** a queda, em segundos: o splash onde ela caiu, o nado de volta e a sacudida em cima */
  splash: 0.5,
  nado: 1.1,
  sacode: 0.5,
};

export interface Faixa {
  velocidade: number;
  /** vai e volta: nunca some pela beirada */
  amplitude: number;
  fase: number;
  dir: 1 | -1;
}

/** O ritmo das faixas depois de `n` idas e voltas completas: um pouquinho mais rápido a cada uma, com teto. */
export function ritmoDoLago(n: number): number {
  return 1 + Math.min(Math.max(0, n) * LAGO.acelera, LAGO.aceleraTeto);
}

/** Posição (em frações da largura) do centro da plataforma de uma faixa no instante t: um vaivém suave. */
export function posicaoNaFaixa(f: Faixa, t: number): number {
  const periodo = (f.amplitude * 2) / f.velocidade;
  const k = (((t * f.dir) / periodo + f.fase) % 1 + 1) % 1;
  const tri = k < 0.5 ? k * 2 : 2 - k * 2;
  return 0.5 - f.amplitude / 2 + tri * f.amplitude;
}

/** O próximo instante, até `janela` segundos à frente, em que a plataforma da faixa passa embaixo de x. */
export function proximoEncontro(f: Faixa, x: number, tAgora: number, janela: number, largura: number): number | null {
  for (let dt = 0; dt <= janela; dt += 0.05) {
    if (Math.abs(posicaoNaFaixa(f, tAgora + dt) - x) < largura * 0.45) return tAgora + dt;
  }
  return null;
}

/** O mesmo desenho da mãozinha das telas em svg, para o canvas. Feito na hora: nos testes não há Path2D. */
let maoFeita: Path2D | null = null;
const MAO = () => (maoFeita ??= new Path2D('M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z'));

function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

/**
 * O Lago dos Cisnes: atravessar de baixo para cima pulando em vitórias-régias
 * e cisnes que nadam em faixas. Toque = pular para a frente; o pulo espera a
 * plataforma chegar. Vai até o coreto do outro lado, acende uma parte dele e
 * volta pulando para a margem de casa. Caiu na água? Splash onde caiu, ela nada
 * de volta, sacode e tenta de novo, sem perder nada.
 */
export function telaLago(): Tela {
  const e = estado();
  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = '#9fc3cf';
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  const limpezas: (() => void)[] = [];
  limpezas.push(cantos(el, () => void sair('casa')));

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

  const F = 200;
  const parada = imagemDe(familia.stella(100, 190, 150, 'parado').svg, F, F);
  const pula = imagemDe(familia.stella(100, 190, 150, 'pulo').svg, F, F);
  const sentada = imagemDe(familia.stella(100, 190, 120, 'sentado').svg, F, F);

  const ritmo = ritmoDoLago(e.idasEVoltasNoLago);
  const faixas: Faixa[] = LAGO.velocidades.map((v, i) => ({ velocidade: v * ritmo, amplitude: 0.5, fase: (i * 0.37) % 1, dir: i % 2 ? -1 : 1 }));
  const m = musica('cisnes');
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.36;
  let tInicio = 0;
  let vivo = true;
  let acabou = false;
  /* a mãozinha à vista: logo na entrada, quando a ajuda sobe e a cada 6 s
     parada; tocar tira. Ela segue a próxima plataforma e toca quando a
     plataforma passa embaixo da Stella: a hora certa do pulo, mostrada */
  let maoAVista = true;
  let semTocar = 0;
  const ajuda = new Ajuda((n) => {
    if (n >= 1) maoAVista = true;
  });
  /** -1 é a margem de baixo; LAGO.faixas é a margem de cima */
  let faixa = -1;
  let x = 0.5;
  let pulo: { de: number; para: number; inicio: number; fim: number; xDe: number; xPara: number | null } | null = null;
  let splash = 0;
  /** onde ela caiu, para o splash e o nado de volta acontecerem ali, à vista */
  let queda: { inicio: number; x: number; y: number } | null = null;
  /** 0 na ida, 1 na volta, 2 quando chegou em casa */
  let travessias = 0;
  /** parada no coreto, olhando a luz acender, antes de virar para voltar */
  let noCoreto = false;
  /** a flor rosa que espera no coreto: ela pega na ida e traz para casa na volta */
  let pegouAFlor: number | null = null;
  /** para onde é a frente: para cima na ida, para baixo na volta */
  const passo = () => (travessias === 0 ? 1 : -1);
  let quedas = 0;

  const tempo = () => audio.agora() - tInicio;
  const margemBaixo = () => H * 0.82;
  const margemCima = () => H * 0.2;
  const yDaFaixa = (i: number) => (i < 0 ? margemBaixo() : i >= LAGO.faixas ? margemCima() : margemBaixo() - ((i + 1) * (margemBaixo() - margemCima())) / (LAGO.faixas + 1));
  const xAgora = (t: number) => (faixa >= 0 && faixa < LAGO.faixas ? posicaoNaFaixa(faixas[faixa]!, t) : x);

  const pular = (t: number) => {
    if (pulo || splash > t || acabou || noCoreto) return;
    const de = faixa;
    const para = faixa + passo();
    const xDe = xAgora(t);
    let inicio = t;
    let xPara: number | null = null;
    if (para >= 0 && para < LAGO.faixas) {
      const f = faixas[para]!;
      /* na A2 ela espera a vitória-régia chegar embaixo dela, quanto for preciso */
      const janela = ajuda.nivel >= 2 ? (f.amplitude * 2) / f.velocidade : LAGO.janelaDoPulo;
      const enc = proximoEncontro(f, xDe, t, janela, LAGO.largura);
      if (enc !== null) {
        inicio = Math.max(t, enc - LAGO.duracaoDoPulo);
        xPara = posicaoNaFaixa(f, inicio + LAGO.duracaoDoPulo);
      }
    } else xPara = xDe;
    pulo = { de, para, inicio, fim: inicio + LAGO.duracaoDoPulo, xDe, xPara };
    lira(74, undefined, 0.25);
  };

  const toque = (ev: PointerEvent) => {
    if (acabou || naBorda(ev.clientX, ev.clientY)) return;
    const r = canvas.getBoundingClientRect();
    if (ev.clientY - r.top < H * 0.1) {
      tiquinho();
      return;
    }
    if (!audio.pronto) void audio.tentarDestravar();
    ajuda.tocou();
    maoAVista = false;
    semTocar = 0;
    pular(tempo());
  };
  canvas.addEventListener('pointerdown', toque);
  canvas.style.touchAction = 'none';

  function simular(): void {
    const t = tempo();
    if (pulo && t >= pulo.fim) {
      const p = pulo;
      pulo = null;
      if (p.para >= LAGO.faixas) {
        /* chegou do outro lado: uma parte do coreto acende, ela olha um pouquinho e vira para voltar */
        faixa = LAGO.faixas;
        x = p.xDe;
        travessias = 1;
        noCoreto = true;
        pegouAFlor = t;
        sininho();
        mudar((s) => void (s.coreto = Math.min(LAGO.partesDoCoreto, s.coreto + 1)));
        ajuda.reset();
        window.setTimeout(() => void (noCoreto = false), 1800);
      } else if (p.para < 0) {
        /* de volta à margem de casa: a aventura fecha */
        faixa = -1;
        x = p.xDe;
        travessias = 2;
        sininho();
        /* só ida e volta de verdade conta para a próxima vez ficar um pouquinho mais rápida;
           a flor que ela trouxe vira lembrança, num copinho em cima do piano */
        mudar((s) => {
          s.idasEVoltasNoLago += 1;
          const l = `lago:${s.hoje.dia}`;
          if (!s.lembrancas.includes(l)) s.lembrancas.push(l);
        });
        window.setTimeout(() => void terminar(), 1200);
      } else if (p.xPara !== null && Math.abs(posicaoNaFaixa(faixas[p.para]!, t) - p.xPara) < LAGO.largura * 0.5) {
        faixa = p.para;
        ajuda.reset();
        toc(520, 0.12);
      } else {
        /* caiu na água: splash ali mesmo, ela nada de volta para onde estava e sobe */
        toc(220, 0.25);
        queda = { inicio: t, x: p.xPara ?? p.xDe, y: yDaFaixa(p.para) };
        splash = t + LAGO.splash + LAGO.nado + LAGO.sacode;
        quedas += 1;
        ajuda.tentativa();
        if (temVoz('lago_splash')) void falar('lago_splash');
        faixa = p.de;
        x = p.xDe;
      }
    }
    /* A2 depois de um tempo parada: a vitória-régia chega perto e ela pula */
    if (!acabou && t >= LAGO.duracao) void terminar();
  }

  /** a flor da vitória-régia: pétalas rosa em volta de um miolo dourado */
  function flor(fx: number, fy: number, r: number): void {
    ctx.fillStyle = '#f2a9c4';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * r * 0.55, fy + Math.sin(a) * r * 0.55, r * 0.5, r * 0.3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ebd9a8';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  /** onde está a flor: no coreto antes de ela chegar, voando até a mão quando ela pega, depois na mão */
  function desenharFlor(t: number, maoX: number, maoY: number): void {
    const ex = W * 0.5;
    const ey = margemCima() + 2;
    if (pegouAFlor === null) {
      /* esperando por ela, com um brilho que pulsa: é para lá que ela vai */
      ctx.fillStyle = '#fbf8f1';
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3);
      ctx.beginPath();
      ctx.arc(ex, ey, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      flor(ex, ey + Math.sin(t * 2) * 1.5, 15);
      return;
    }
    const k = Math.min(1, (t - pegouAFlor) / 0.5);
    flor(ex + (maoX - ex) * k, ey + (maoY - ey) * k - Math.sin(k * Math.PI) * 30, 11);
  }

  function desenhar(): void {
    const t = tempo();
    /* a água em véus */
    ctx.fillStyle = '#9fc3cf';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#dbe7ee';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(W * (0.2 + i * 0.25), H * (0.35 + (i % 2) * 0.2) + Math.sin(t + i) * 6, W * 0.35, H * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* margens */
    ctx.fillStyle = '#c9dbb2';
    /* a margem de baixo começa um pouco acima dos pés dela: ela começa na grama */
    ctx.fillRect(0, margemBaixo() - 18, W, H);
    ctx.fillStyle = '#b6cd98';
    ctx.fillRect(0, margemBaixo() - 18, W, 4);
    ctx.fillRect(0, 0, W, margemCima() + 16);
    /* o coreto do outro lado, com as partes já acesas */
    const aceso = estado().coreto;
    ctx.fillStyle = '#fbf8f1';
    ctx.fillRect(W * 0.32, margemCima() - 70, W * 0.36, 60);
    ctx.fillStyle = '#c6a15b';
    ctx.beginPath();
    ctx.moveTo(W * 0.28, margemCima() - 70);
    ctx.lineTo(W * 0.5, margemCima() - 120);
    ctx.lineTo(W * 0.72, margemCima() - 70);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < LAGO.partesDoCoreto; i++) {
      ctx.fillStyle = i < aceso ? '#ebd9a8' : '#dbe7ee';
      ctx.beginPath();
      ctx.arc(W * 0.35 + (i * W * 0.3) / (LAGO.partesDoCoreto - 1), margemCima() - 40, 7, 0, Math.PI * 2);
      ctx.fill();
      if (i < aceso) {
        ctx.save();
        ctx.translate(W * 0.35 + (i * W * 0.3) / (LAGO.partesDoCoreto - 1) - 10, margemCima() - 70);
        ctx.scale(0.6, 0.6);
        ctx.fillStyle = '#c6a15b';
        ctx.fill(new Path2D(CENTELHA));
        ctx.restore();
      }
    }
    /* quanto falta: as contas das travessias na margem de baixo (a de agora brilha) */
    const yContas = Math.min(H - 24, margemBaixo() + (H - margemBaixo()) * 0.55);
    for (let k = 0; k < LAGO.travessias; k++) {
      const cx = W / 2 + (k - (LAGO.travessias - 1) / 2) * 30;
      if (k === travessias && !acabou) {
        ctx.fillStyle = 'rgba(251,248,241,0.8)';
        ctx.beginPath();
        ctx.arc(cx, yContas, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(cx - 10, yContas - 10);
        ctx.scale(20 / 24, 20 / 24);
        ctx.fillStyle = '#c6a15b';
        ctx.fill(new Path2D(CENTELHA));
        ctx.restore();
      } else {
        ctx.fillStyle = k < travessias ? '#c6a15b' : 'rgba(251,248,241,0.8)';
        ctx.strokeStyle = '#c6a15b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, yContas, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    /* e nesta travessia: uma pedrinha por faixa na beirada, acesas do ponto de partida até onde ela chegou */
    const ondeEsta = pulo && t >= pulo.inicio ? pulo.para : faixa;
    for (let i = -1; i <= LAGO.faixas; i++) {
      const acesa = travessias === 0 ? i <= ondeEsta : i >= ondeEsta;
      ctx.fillStyle = acesa ? '#c6a15b' : '#fbf8f1';
      ctx.strokeStyle = '#c6a15b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(W - 22, yDaFaixa(i), i === ondeEsta ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    /* as faixas: vitórias-régias nas ímpares, cisnes nas pares */
    const largura = W * LAGO.largura;
    faixas.forEach((f, i) => {
      const y = yDaFaixa(i);
      const px = posicaoNaFaixa(f, t) * W;
      if (i % 2 === 0) {
        ctx.fillStyle = '#8fae6b';
        ctx.beginPath();
        ctx.ellipse(px, y + 6, largura / 2, 14, 0, 0.15 * Math.PI, 1.85 * Math.PI);
        ctx.lineTo(px, y + 6);
        ctx.fill();
        ctx.fillStyle = '#f2a9c4';
        ctx.beginPath();
        ctx.arc(px + largura * 0.25, y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        /* o cisne: corpo, pescoço, bico */
        ctx.fillStyle = '#fbf8f1';
        ctx.beginPath();
        ctx.ellipse(px, y + 4, largura / 2, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbf8f1';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px + f.dir * largura * 0.35, y + 2);
        ctx.quadraticCurveTo(px + f.dir * largura * 0.55, y - 30, px + f.dir * largura * 0.45, y - 36);
        ctx.stroke();
        ctx.fillStyle = '#e8a24a';
        ctx.beginPath();
        ctx.moveTo(px + f.dir * largura * 0.45, y - 40);
        ctx.lineTo(px + f.dir * largura * 0.58, y - 34);
        ctx.lineTo(px + f.dir * largura * 0.45, y - 30);
        ctx.closePath();
        ctx.fill();
      }
    });
    /* a Stella; se caiu, o splash em volta dela */
    const hS = H * 0.17;
    const esc = hS / 150;
    let sx = xAgora(t) * W;
    let sy = yDaFaixa(faixa);
    let img = splash > t ? sentada : parada;
    const kq = queda ? t - queda.inicio : Infinity;
    if (queda && kq < LAGO.splash + LAGO.nado) {
      /* na água: ondinhas e gotas onde caiu, e ela nada de volta com só a metade de cima para fora */
      const qx = queda.x * W;
      ctx.strokeStyle = '#fbf8f1';
      ctx.lineWidth = 3;
      for (let r = 0; r < 3; r++) {
        const kr = kq - r * 0.25;
        if (kr < 0 || kr > 1.2) continue;
        ctx.globalAlpha = 1 - kr / 1.2;
        ctx.beginPath();
        ctx.ellipse(qx, queda.y, 18 + kr * 60, 6 + kr * 18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (kq < LAGO.splash) {
        ctx.fillStyle = '#fbf8f1';
        ctx.globalAlpha = 1 - kq / LAGO.splash;
        for (let g = 0; g < 7; g++) {
          const ang = Math.PI * (0.15 + (g * 0.7) / 6);
          const d = 20 + kq * 110;
          ctx.beginPath();
          ctx.arc(qx - Math.cos(ang) * d, queda.y - Math.sin(ang) * d + kq * kq * 160, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const kn = Math.max(0, kq - LAGO.splash) / LAGO.nado;
      const suave = kn * kn * (3 - 2 * kn);
      const nx = qx + (sx - qx) * suave;
      const ny = queda.y + (sy - queda.y) * suave + Math.sin(t * 9) * 2;
      /* o rastro do nado */
      if (kn > 0) {
        ctx.strokeStyle = 'rgba(251,248,241,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(nx, ny, 26, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, ny);
      ctx.clip();
      const afunda = kq < LAGO.splash ? (kq / LAGO.splash) * hS * 0.55 : hS * 0.55;
      ctx.drawImage(parada, nx - (F * esc) / 2, ny + afunda - F * esc * 0.95, F * esc, F * esc);
      ctx.restore();
      ctx.fillStyle = 'rgba(219,231,238,0.9)';
      ctx.beginPath();
      ctx.ellipse(nx, ny, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      /* se já pegou a flor, nada com ela bem no alto, para não molhar */
      desenharFlor(t, nx + hS * 0.18, ny - hS * 0.42);
      return;
    }
    /* de volta em cima, molhadinha: senta e sacode */
    if (queda && kq < LAGO.splash + LAGO.nado + LAGO.sacode) sx += Math.sin(t * 40) * 3;
    else queda = null;
    if (pulo && t >= pulo.inicio) {
      const k = Math.min(1, (t - pulo.inicio) / (pulo.fim - pulo.inicio));
      const xFim = pulo.xPara ?? pulo.xDe;
      sx = (pulo.xDe + (xFim - pulo.xDe) * k) * W;
      sy = yDaFaixa(pulo.de) + (yDaFaixa(pulo.para) - yDaFaixa(pulo.de)) * k - Math.sin(k * Math.PI) * H * 0.06;
      img = pula;
    }
    ctx.drawImage(img, sx - (F * esc) / 2, sy - F * esc * 0.95, F * esc, F * esc);
    desenharFlor(t, sx + hS * 0.2, sy - hS * 0.5);
    desenharMao(t);
  }

  /** A mãozinha na próxima plataforma: paira sobre ela e toca quando ela passa embaixo da Stella. */
  function desenharMao(t: number): void {
    const i = faixa + passo();
    if (!maoAVista || pulo || noCoreto || acabou || (splash > 0 && splash > t) || i < 0 || i >= LAGO.faixas) return;
    const f = faixas[i]!;
    const px = posicaoNaFaixa(f, t) * W;
    const y = yDaFaixa(i);
    const embaixo = Math.abs(posicaoNaFaixa(f, t) - xAgora(t)) < LAGO.largura * 0.45;
    /* A2: a plataforma acende também */
    if (ajuda.nivel >= 2) {
      ctx.strokeStyle = '#c6a15b';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
      ctx.beginPath();
      ctx.ellipse(px, y + 4, (W * LAGO.largura) / 2 + 8, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* embaixo dela: o dedo desce e sobe, tocando; longe, só paira esperando */
    const toque = embaixo ? Math.max(0, Math.sin(t * 7)) : 0;
    if (toque > 0.8) {
      ctx.strokeStyle = '#fbf8f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(px, y - 4, 16, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    /* a ponta do dedo fica em (-2.8, -1.2) do desenho */
    ctx.translate(px + 3.6, y - 40 + toque * 32 + (embaixo ? 0 : Math.sin(t * 3) * 3));
    ctx.scale(1.3, 1.3);
    ctx.fillStyle = '#f6e3dc';
    ctx.strokeStyle = '#4f6b3a';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.globalAlpha = embaixo ? 1 : 0.75;
    ctx.fill(MAO());
    ctx.stroke(MAO());
    ctx.restore();
  }

  const laco = () => {
    if (!vivo) return;
    simular();
    desenhar();
    requestAnimationFrame(laco);
  };
  const tique = window.setInterval(() => {
    ajuda.tick(1);
    /* parada, a mãozinha volta a cada 6 s, e fica até ela tocar */
    semTocar += 1;
    if (semTocar % 6 === 0) maoAVista = true;
    /* A2: se ela não toca, a vitória-régia chega perto e ela pula sozinha */
    if (ajuda.nivel >= 2 && !pulo && !acabou && tempo() > 2) pular(tempo());
  }, 1000);
  limpezas.push(() => window.clearInterval(tique));

  const terminar = async () => {
    if (acabou) return;
    acabou = true;
    seq.parar();
    mudar((s) => {
      s.aventuras += 1;
      s.aventurasPor.lago = (s.aventurasPor.lago ?? 0) + 1;
      if (ajuda.nivel >= 1) s.registro.a1.lago = (s.registro.a1.lago ?? 0) + 1;
      if (ajuda.nivel >= 2) s.registro.a2.lago = (s.registro.a2.lago ?? 0) + 1;
    });
    void travessias;
    void quedas;
    await new Promise((r) => setTimeout(r, 1000));
    if (vivo) void ir('palco');
  };
  const sair = async (para: string) => {
    seq.parar();
    /* a casinha passa pela sessão, como em toda tela */
    if (para === 'casa') void sessao.voltarParaCasa();
    else void ir(para);
  };

  pararFundo();
  void audio.tentarDestravar().then(() => {
    tInicio = audio.agora() + 0.6;
    seq.iniciar(tInicio);
    requestAnimationFrame(laco);
  });
  void e;
  return {
    el,
    destruir: () => {
      vivo = false;
      seq.parar();
      canvas.removeEventListener('pointerdown', toque);
      for (const l of limpezas) l();
    },
  };
}
