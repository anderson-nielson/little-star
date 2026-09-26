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
  const sobe = [familia.stella(100, 190, 160, 'parado').svg, familia.stella(100, 190, 160, 'acena').svg].map((s) => imagemDe(s, F, F));
  const gira = imagemDe(familia.stella(100, 190, 160, 'giro').svg, F, F);
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

  function desenhar(): void {
    const t = tempo();
    const progresso = Math.min(1, t / ARVORE.duracao);
    /* o céu clareia conforme ela sobe */
    ctx.fillStyle = '#dbe7ee';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25 + 0.3 * progresso;
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.3, W * 0.7, H * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    /* o tronco e os galhos que passam para baixo */
    const desloc = t * ARVORE.velocidade * H;
    ctx.fillStyle = '#c9a189';
    ctx.fillRect(W * 0.5 - 22, 0, 44, H);
    ctx.fillStyle = '#b08a70';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(W * 0.5 - 6, 0, 8, H);
    ctx.globalAlpha = 1;
    const passoGalho = H * 0.22;
    for (let i = -1; i < 7; i++) {
      const gy = ((i * passoGalho + desloc) % (passoGalho * 6) + passoGalho * 6) % (passoGalho * 6) - passoGalho;
      const esq = Math.floor((i * passoGalho + desloc) / passoGalho) % 2 === 0;
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
    /* lá em cima: o esquilo de gorrinho e o gatinho, chegando no fim */
    /* o topo começa bem acima da tela e desce conforme ela sobe; chega no fim */
    const topoY = H * 0.14 - (1 - progresso) * H * 1.3;
    if (topoY > -H * 0.2) {
      ctx.fillStyle = '#2c4a42';
      ctx.beginPath();
      ctx.moveTo(W * 0.5, topoY - H * 0.12);
      ctx.lineTo(W * 0.72, topoY + 10);
      ctx.lineTo(W * 0.28, topoY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(gatinho, W * 0.5 - 20, topoY - 40, 60, 48);
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
      if (o.passou && !o.pegou) continue;
      const to = o.beat * segPorBeat;
      const y = py(to, t);
      if (y < -60 || y > H + 60) continue;
      if (o.passou) continue;
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
    /* a Stella subindo, no tronco; no pulo, gira */
    const hS = H * 0.2;
    const esc = hS / 160;
    const alt = altura(t);
    const img = noAr(t) ? gira : sobe[Math.abs(Math.floor(t * 4)) % 2]!;
    ctx.save();
    ctx.translate(stellaX() + (noAr(t) ? 0 : -8), stellaY() - alt);
    if (noAr(t)) ctx.rotate(((t - (pulo?.inicio ?? 0)) / ARVORE.duracaoDoPulo) * Math.PI * 2);
    ctx.drawImage(img, (-F * esc) / 2, -F * esc * 0.9, F * esc, F * esc);
    ctx.restore();
    if (noAr(t) && alt > H * 0.08) {
      ctx.save();
      ctx.translate(stellaX() + 30, stellaY() - alt - hS);
      ctx.fillStyle = '#c6a15b';
      ctx.fill(new Path2D(CENTELHA));
      ctx.restore();
    }
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
