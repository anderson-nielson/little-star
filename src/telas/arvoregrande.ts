import { cantos } from './comum';
import { alvoDoPulo, beatsDosObstaculos } from './jardim';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { observarCaixa } from '@/core/util';
import { naBorda } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { familia } from '@/puppet/boneco';
import { CENTELHA, gato, pinha } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { lira, ronronar, sininho, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** Dados do balanceamento da Árvore Grande. */
export const ARVORE = {
  duracao: 120,
  compassosPorPinha: 2,
  compassosPorPinhaInicio: 4,
  janelaDoPulo: 0.7,
  duracaoDoPulo: 0.75,
  /** quanto ela sobe por segundo, em alturas de tela */
  velocidade: 0.11,
};

function imagemDe(svgInterno: string, w: number, h: number): HTMLImageElement {
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svgInterno}</svg>`);
  return img;
}

/**
 * A Árvore Grande: ela sobe sozinha, galho por galho, para buscar o gatinho
 * que subiu até o topo. Lá em cima um esquilo de gorrinho rola pinhas galho
 * abaixo. Pinha é presente: toque = pular, ela gira no ar e pega a pinha; se
 * não pular, a pinha quica nela com um "toc" e cai na cestinha do Theo. De um
 * jeito ou de outro toda pinha chega em casa. Termina no palco, sempre.
 */
export function telaArvoreGrande(): Tela {
  const e = estado();
  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = '#dbe7ee';
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  const limpezas: (() => void)[] = [];
  limpezas.push(cantos(el, () => void sair('casa'), () => void sair('pais')));

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
  const sobe = imagemDe(familia.stella(100, 190, 160, 'sobe').svg, F, F);
  const parada = imagemDe(familia.stella(100, 190, 160, 'parado').svg, F, F);
  const pula = imagemDe(familia.stella(100, 190, 160, 'pulo').svg, F, F);
  const gatinho = imagemDe(gato(100, 160, 40), F, F);
  const pinhas = [0, 1, 2, 3].map((t) => imagemDe(pinha(50, 70, 34, t), 100, 100));

  const m = musica('marcha');
  const cada = e.aventuras < 2 ? ARVORE.compassosPorPinhaInicio : ARVORE.compassosPorPinha;
  const beats = beatsDosObstaculos(m.compasso, m.bpm, ARVORE.duracao, cada);
  const seq = new Sequenciador(m, { loop: true });
  seq.ganho = 0.36;
  const segPorBeat = 60 / m.bpm;
  let tInicio = 0;
  const pinhasDaArvore = beats.map((b, i) => ({ beat: b, tipo: i % 4, passou: false, pegou: false, devagar: false }));
  let pulo: { inicio: number; fim: number } | null = null;
  let acabou = false;
  let vivo = true;
  const ajuda = new Ajuda();
  let perdidas = 0;
  let pegas = 0;

  const tempo = () => audio.agora() - tInicio;
  const stellaY = () => H * 0.62;
  const stellaX = () => W * 0.5;
  /** a pinha desce pelo tronco: chega na Stella no instante dela */
  const py = (tPinha: number, agora: number) => stellaY() - (tPinha - agora) * ARVORE.velocidade * 2.2 * H;

  const pular = (agora: number, alvo: number | null) => {
    const dur = ARVORE.duracaoDoPulo;
    if (alvo !== null) pulo = { inicio: alvo - dur / 2, fim: alvo + dur / 2 };
    else pulo = { inicio: agora, fim: agora + dur * 0.6 };
    lira(76, undefined, 0.25);
  };
  const toque = (ev: PointerEvent) => {
    if (acabou || naBorda(ev.clientX, ev.clientY)) return;
    const r = canvas.getBoundingClientRect();
    const y = ev.clientY - r.top;
    if (y < H * 0.12) {
      tiquinho();
      return;
    }
    if (!audio.pronto) void audio.tentarDestravar();
    ajuda.tocou();
    const agora = tempo();
    const proximas = pinhasDaArvore.filter((o) => !o.passou).map((o) => o.beat * segPorBeat);
    const alvo = alvoDoPulo(agora, proximas, ARVORE.janelaDoPulo, ARVORE.duracaoDoPulo);
    if (pulo && agora < pulo.fim) return;
    pular(agora, alvo);
  };
  canvas.addEventListener('pointerdown', toque);
  canvas.style.touchAction = 'none';

  const noAr = (t: number) => pulo !== null && t >= pulo.inicio && t <= pulo.fim;
  const altura = (t: number) => {
    if (!pulo || t < pulo.inicio || t > pulo.fim) return 0;
    const k = (t - pulo.inicio) / (pulo.fim - pulo.inicio);
    return Math.sin(k * Math.PI) * H * 0.1;
  };

  /* o mundo da árvore, em px a partir do chão: ela sobe do pé do tronco até o gatinho lá em cima */
  const subida = () => ARVORE.duracao * ARVORE.velocidade * H;
  const altitude = (t: number) => Math.max(0, Math.min(t, ARVORE.duracao)) * ARVORE.velocidade * H;
  /** onde fica na tela um ponto do mundo: a câmera acompanha a Stella */
  const naTela = (z: number, t: number) => stellaY() + altitude(t) - z;

  function desenhar(): void {
    const t = tempo();
    const progresso = Math.max(0, Math.min(1, t / ARVORE.duracao));
    const topo = subida() + H * 0.24;
    /* o céu clareia conforme ela sobe */
    ctx.fillStyle = '#dbe7ee';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25 + 0.3 * progresso;
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.3, W * 0.7, H * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    /* o chão do quintal: aparece no começo e vai ficando lá embaixo */
    const chao = naTela(0, t);
    if (chao < H) {
      ctx.fillStyle = '#9fbf7f';
      ctx.fillRect(0, chao, W, H - chao + 1);
      ctx.fillStyle = '#8aad6c';
      ctx.fillRect(0, chao, W, 6);
    }
    /* o tronco: do chão até a copa lá em cima */
    const yTopo = naTela(topo, t);
    const y0 = Math.max(0, yTopo);
    const y1 = Math.min(H, chao);
    if (y1 > y0) {
      ctx.fillStyle = '#c9a189';
      ctx.fillRect(W * 0.5 - 22, y0, 44, y1 - y0);
      ctx.fillStyle = '#b08a70';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(W * 0.5 - 6, y0, 8, y1 - y0);
      ctx.globalAlpha = 1;
    }
    if (chao < H + 20) {
      /* a raiz abrindo no chão */
      ctx.fillStyle = '#c9a189';
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - 22, chao - 14);
      ctx.quadraticCurveTo(W * 0.5 - 26, chao, W * 0.5 - 40, chao + 4);
      ctx.lineTo(W * 0.5 + 40, chao + 4);
      ctx.quadraticCurveTo(W * 0.5 + 26, chao, W * 0.5 + 22, chao - 14);
      ctx.fill();
    }
    /* os galhos: cada um no seu lugar do tronco, alternando os lados */
    const passoGalho = H * 0.22;
    const primeiro = Math.max(1, Math.floor((altitude(t) - H) / passoGalho));
    for (let k = primeiro; k < primeiro + 8; k++) {
      const z = H * 0.3 + k * passoGalho;
      if (z > topo - H * 0.12) break;
      const gy = naTela(z, t);
      if (gy < -H * 0.1 || gy > H + H * 0.1) continue;
      const esq = k % 2 === 0;
      const gx = esq ? W * 0.22 : W * 0.78;
      ctx.strokeStyle = '#b08a70';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W * 0.5, gy + 8);
      ctx.lineTo(gx, gy + 14);
      ctx.stroke();
      ctx.fillStyle = esq ? '#35564d' : '#2c4a42';
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.ellipse(gx + (esq ? 10 : -10), gy - 10, W * 0.2, H * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    /* lá em cima, a copa: o esquilo de gorrinho e o gatinho esperando por ela */
    const topoY = yTopo;
    if (topoY > -H * 0.2 && topoY < H + H * 0.2) {
      ctx.fillStyle = '#2c4a42';
      ctx.beginPath();
      ctx.moveTo(W * 0.5, topoY - H * 0.12);
      ctx.lineTo(W * 0.72, topoY + 10);
      ctx.lineTo(W * 0.28, topoY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(gatinho, W * 0.5 - 50, topoY - 110, 150, 150);
      /* o esquilo */
      ctx.fillStyle = '#b06a3a';
      ctx.beginPath();
      ctx.ellipse(W * 0.5 - 46, topoY - 8, 12, 9, 0, 0, Math.PI * 2);
      ctx.arc(W * 0.5 - 56, topoY - 18, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - 34, topoY - 8);
      ctx.quadraticCurveTo(W * 0.5 - 18, topoY - 34, W * 0.5 - 30, topoY - 40);
      ctx.strokeStyle = '#b06a3a';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.fillStyle = '#d2463c';
      ctx.fillRect(W * 0.5 - 62, topoY - 30, 12, 8);
    }
    /* as pinhas descendo */
    for (const o of pinhasDaArvore) {
      if (o.passou) continue;
      const to = o.beat * segPorBeat;
      const y = py(to, t);
      if (y < -60 || y > H + 60) continue;
      const img = pinhas[o.tipo]!;
      ctx.save();
      ctx.translate(W * 0.5, y);
      ctx.rotate(t * 4);
      ctx.drawImage(img, -22, -22, 44, 44);
      ctx.restore();
      if (ajuda.nivel >= 1 && to - t < 2.5 && to - t > 0.2) {
        ctx.save();
        ctx.translate(W * 0.5 + 40, y);
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
    /* a Stella no tronco: mão ante mão, balançando de leve no ritmo; no pulo, estica os braços para a pinha */
    const hS = H * 0.2;
    const esc = hS / 160;
    const alt = altura(t);
    const subindo = t > 0 && t < ARVORE.duracao;
    const fase = subindo ? (t / segPorBeat) % 2 : 0;
    const lado = fase < 1 ? 1 : -1;
    const balanca = subindo && !noAr(t) ? Math.abs(Math.sin(fase * Math.PI)) * H * 0.008 : 0;
    ctx.save();
    ctx.translate(stellaX(), stellaY() - alt - balanca);
    if (noAr(t)) {
      ctx.drawImage(pula, (-F * esc) / 2, -F * esc * 0.9, F * esc, F * esc);
    } else {
      ctx.scale(subindo ? lado : 1, 1);
      ctx.drawImage(subindo ? sobe : parada, (-F * esc) / 2, -F * esc * 0.9, F * esc, F * esc);
    }
    ctx.restore();
    if (noAr(t) && alt > H * 0.08) {
      ctx.save();
      ctx.translate(stellaX() + 30, stellaY() - alt - hS);
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
    /* o caminho até o gatinho: um fio na beirada, com ela subindo nele */
    const fx = W - 14;
    const fTopo = H * 0.2;
    const fBase = H * 0.86;
    ctx.strokeStyle = '#fbf8f1';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(fx, fBase);
    ctx.lineTo(fx, fTopo);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const fy = fBase - (fBase - fTopo) * progresso;
    ctx.strokeStyle = '#c6a15b';
    ctx.beginPath();
    ctx.moveTo(fx, fBase);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.drawImage(gatinho, fx - 38, fTopo - 46, 60, 60);
    ctx.save();
    ctx.translate(fx - 10, fy - 10);
    ctx.fillStyle = '#c6a15b';
    ctx.fill(new Path2D(CENTELHA));
    ctx.restore();
    /* embaixo, a cestinha do Theo e a dela: quantas pinhas já chegaram */
    ctx.fillStyle = '#c9a189';
    ctx.beginPath();
    ctx.ellipse(W * 0.14, H * 0.93, 34, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8714a';
    for (let i = 0; i < Math.min(pegas, 8); i++) {
      ctx.beginPath();
      ctx.ellipse(W * 0.14 - 20 + (i % 4) * 13, H * 0.93 - 6 - Math.floor(i / 4) * 8, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function simular(): void {
    const t = tempo();
    for (const o of pinhasDaArvore) {
      const to = o.beat * segPorBeat;
      if (!o.passou && t > to + 0.15) {
        o.passou = true;
        if (noAr(to) || o.devagar) {
          o.pegou = true;
          pegas += 1;
          sininho(0.22);
          perdidas = Math.max(0, perdidas - 1);
        } else {
          /* a pinha quica nela: "toc", ela ri, e cai na cestinha do Theo */
          toc(300, 0.22);
          perdidas += 1;
          ajuda.tentativa();
        }
        ajuda.reset();
        if (perdidas >= 2) ajuda.tentativa();
        if (perdidas >= 4) for (const p of pinhasDaArvore) if (!p.passou) p.devagar = true;
      }
    }
    if (!acabou && t >= ARVORE.duracao) void terminar();
  }

  const laco = () => {
    if (!vivo) return;
    simular();
    desenhar();
    requestAnimationFrame(laco);
  };

  const terminar = async () => {
    acabou = true;
    seq.parar();
    ronronar();
    mudar((x) => {
      x.aventuras += 1;
      x.aventurasPor.arvore = (x.aventurasPor.arvore ?? 0) + 1;
      /* todas as pinhas chegam em casa: as dela e as da cestinha do Theo */
      for (const o of pinhasDaArvore) x.pinhas.push({ tipo: o.tipo, x: Math.random(), y: 0 });
      x.cesta += pinhasDaArvore.length;
      if (ajuda.nivel >= 1) x.registro.a1.arvore = (x.registro.a1.arvore ?? 0) + 1;
      if (ajuda.nivel >= 2) x.registro.a2.arvore = (x.registro.a2.arvore ?? 0) + 1;
    });
    await new Promise((r) => setTimeout(r, 1200));
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
  const tique = window.setInterval(() => ajuda.tick(1), 1000);
  limpezas.push(() => window.clearInterval(tique));

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
