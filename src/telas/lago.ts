import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { observarCaixa } from '@/core/util';
import { naBorda, segurar, tocavel } from '@/core/toque';
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
  duracao: 120,
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
};

export interface Faixa {
  velocidade: number;
  /** vai e volta: nunca some pela beirada */
  amplitude: number;
  fase: number;
  dir: 1 | -1;
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

function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

/**
 * O Lago dos Cisnes: atravessar de baixo para cima pulando em vitórias-régias
 * e cisnes que nadam em faixas. Toque = pular para a frente; o pulo espera a
 * plataforma chegar. Cada travessia acende uma parte do coreto do outro lado.
 * Caiu na água? O Theo pesca com a rede de borboleta, sem perder nada.
 */
export function telaLago(): Tela {
  const e = estado();
  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = '#9fc3cf';
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  const hud = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  hud.setAttribute('viewBox', '0 0 390 780');
  hud.setAttribute('class', 'cena');
  hud.setAttribute('preserveAspectRatio', 'xMidYMid meet');
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

  const F = 200;
  const parada = imagemDe(familia.stella(100, 190, 150, 'parado').svg, F, F);
  const pula = imagemDe(familia.stella(100, 190, 150, 'pulo').svg, F, F);
  const sentada = imagemDe(familia.stella(100, 190, 120, 'sentado').svg, F, F);
  const theo = imagemDe(familia.theo(100, 190, 170, 'aponta').svg, F, F);

  const faixas: Faixa[] = LAGO.velocidades.map((v, i) => ({ velocidade: v, amplitude: 0.5, fase: (i * 0.37) % 1, dir: i % 2 ? -1 : 1 }));
  const m = musica('cisnes');
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.36;
  let tInicio = 0;
  let vivo = true;
  let acabou = false;
  const ajuda = new Ajuda();
  /** -1 é a margem de baixo; LAGO.faixas é a margem de cima */
  let faixa = -1;
  let x = 0.5;
  let pulo: { de: number; para: number; inicio: number; fim: number; xDe: number; xPara: number | null } | null = null;
  let pescando = 0;
  let travessias = 0;
  let quedas = 0;

  const tempo = () => audio.agora() - tInicio;
  const margemBaixo = () => H * 0.82;
  const margemCima = () => H * 0.2;
  const yDaFaixa = (i: number) => (i < 0 ? margemBaixo() : i >= LAGO.faixas ? margemCima() : margemBaixo() - ((i + 1) * (margemBaixo() - margemCima())) / (LAGO.faixas + 1));
  const xAgora = (t: number) => (faixa >= 0 && faixa < LAGO.faixas ? posicaoNaFaixa(faixas[faixa]!, t) : x);

  const pular = (t: number) => {
    if (pulo || pescando > t || acabou) return;
    const de = faixa;
    const para = faixa + 1;
    const xDe = xAgora(t);
    let inicio = t;
    let xPara: number | null = null;
    if (para < LAGO.faixas) {
      const f = faixas[para]!;
      const enc = ajuda.nivel >= 2 ? t : proximoEncontro(f, xDe, t, LAGO.janelaDoPulo, LAGO.largura);
      if (enc !== null) {
        inicio = Math.max(t, enc - LAGO.duracaoDoPulo);
        xPara = ajuda.nivel >= 2 ? xDe : posicaoNaFaixa(f, inicio + LAGO.duracaoDoPulo);
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
        /* chegou do outro lado: uma parte do coreto acende, e ela volta para a margem */
        faixa = LAGO.faixas;
        x = p.xDe;
        travessias += 1;
        sininho();
        mudar((s) => void (s.coreto = Math.min(LAGO.partesDoCoreto, s.coreto + 1)));
        ajuda.reset();
        window.setTimeout(() => {
          if (!vivo) return;
          faixa = -1;
          x = 0.5;
        }, 1800);
      } else if (p.xPara !== null && Math.abs(posicaoNaFaixa(faixas[p.para]!, t) - p.xPara) < LAGO.largura * 0.5) {
        faixa = p.para;
        ajuda.reset();
        toc(520, 0.12);
      } else {
        /* caiu na água: o Theo pesca com a rede, ela volta para onde estava */
        toc(220, 0.25);
        pescando = t + 1.6;
        quedas += 1;
        ajuda.tentativa();
        if (temVoz('lago_pescou')) void falar('lago_pescou');
        faixa = p.de;
        x = p.xDe;
      }
    }
    /* A2 depois de um tempo parada: o Theo empurra a vitória-régia e ela passa */
    if (!acabou && t >= LAGO.duracao) void terminar();
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
    ctx.fillRect(0, margemBaixo() + 20, W, H);
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
      /* ajuda A1: a mãozinha pulsa quando a plataforma da próxima faixa está embaixo dela */
      if (ajuda.nivel >= 1 && i === faixa + 1 && !pulo && Math.abs(posicaoNaFaixa(f, t) - xAgora(t)) < LAGO.largura * 0.45) {
        ctx.save();
        ctx.translate(px - 6, y - 60);
        ctx.fillStyle = '#f6e3dc';
        ctx.strokeStyle = '#4f6b3a';
        ctx.lineWidth = 1.6;
        const p = new Path2D('M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z');
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
        ctx.fill(p);
        ctx.stroke(p);
        ctx.restore();
      }
    });
    /* o Theo na margem de baixo com a rede, e a Stella */
    const hS = H * 0.17;
    const esc = hS / 150;
    ctx.drawImage(theo, W * 0.12 - (F * esc * 1.1) / 2, margemBaixo() + 24 - F * esc * 1.1 * 0.95, F * esc * 1.1, F * esc * 1.1);
    if (pescando > t) {
      ctx.strokeStyle = '#c9a189';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W * 0.2, margemBaixo() - 10);
      ctx.lineTo(xAgora(t) * W, yDaFaixa(faixa) - 10);
      ctx.stroke();
      ctx.strokeStyle = '#fbf8f1';
      ctx.beginPath();
      ctx.arc(xAgora(t) * W, yDaFaixa(faixa) - 10, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    let sx = xAgora(t) * W;
    let sy = yDaFaixa(faixa);
    let img = pescando > t ? sentada : parada;
    if (pulo && t >= pulo.inicio) {
      const k = Math.min(1, (t - pulo.inicio) / (pulo.fim - pulo.inicio));
      const xFim = pulo.xPara ?? pulo.xDe;
      sx = (pulo.xDe + (xFim - pulo.xDe) * k) * W;
      sy = yDaFaixa(pulo.de) + (yDaFaixa(pulo.para) - yDaFaixa(pulo.de)) * k - Math.sin(k * Math.PI) * H * 0.06;
      img = pula;
    }
    ctx.drawImage(img, sx - (F * esc) / 2, sy - F * esc * 0.95, F * esc, F * esc);
  }

  const laco = () => {
    if (!vivo) return;
    simular();
    desenhar();
    requestAnimationFrame(laco);
  };
  const tique = window.setInterval(() => {
    ajuda.tick(1);
    /* A2: se ela não toca, o Theo empurra e ela passa sozinha */
    if (ajuda.nivel >= 2 && !pulo && !acabou && tempo() > 2) pular(tempo());
  }, 1000);
  limpezas.push(() => window.clearInterval(tique));

  const terminar = async () => {
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
    void ir(para);
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
