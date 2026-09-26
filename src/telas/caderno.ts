import { trilha } from './comum';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { chaveDaSemana } from '@/core/relogio';
import { ir } from '@/core/roteador';
import { esperar, observarCaixa } from '@/core/util';
import { Tracado, pontoEm, type Ponto, type TracoDado } from '@/core/fita';
import { Ajuda } from '@/core/ajuda';
import { reivindicarDedo, soltarDedo, tocavel, travar, segurar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { falar, temVoz } from '@/audio/vozes';
import { tocarFundo } from '@/audio/musica';
import { centelhasSom, sininho } from '@/audio/synth';
import { CENTELHA } from '@/puppet/objetos';
import letrasJson from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

interface Letra {
  id: string;
  som: string;
  historia: string;
  imagem: string;
  palavra: string;
  tracos: TracoDado[];
}
const letras = letrasJson as unknown as Letra[];

/** A letra da semana: uma por semana por padrão; os pais podem deixar livre. */
export function letraDaVez(): { letra: Letra; indice: number } {
  const e = estado();
  const semana = chaveDaSemana(sessao.agora());
  let indice = e.letraIndice;
  if (e.pais.ritmoLetras === 'semanal' && e.semanaDaLetra && e.semanaDaLetra !== semana && e.letras.includes(letras[indice]!.id)) {
    indice = Math.min(indice + 1, letras.length - 1);
    mudar((x) => {
      x.letraIndice = indice;
      x.semanaDaLetra = semana;
    });
  } else if (!e.semanaDaLetra) {
    mudar((x) => {
      x.semanaDaLetra = semana;
    });
  }
  return { letra: letras[Math.min(indice, letras.length - 1)]!, indice };
}

const CORES = { papel: '#fbf8f1', rosa: '#f6e3dc', rosaDoce: '#f2a9c4', luz: '#ebd9a8', ouro: '#c6a15b', musgoTinta: '#4f6b3a', tinta: '#1a1c2b' };

/**
 * O caderno: a letra nasce de uma imagem, a estrela guia percorre a fita,
 * ela traça com o dedo. Tolerância larga (40 px), tirar o dedo não apaga,
 * toda letra terminada é comemorada.
 */
export function telaCaderno(): Tela {
  const { letra } = letraDaVez();
  const el = document.createElement('div');
  el.className = 'tela';
  el.style.background = CORES.rosa;
  const canvas = document.createElement('canvas');
  canvas.className = 'cena';
  el.appendChild(canvas);
  /* a casinha e o Theo em svg por cima do canvas */
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 390 780');
  svg.setAttribute('class', 'cena');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.style.pointerEvents = 'none';
  svg.innerHTML = `<g class="theo">${familia.theo(84, 712, 118, 'aponta').svg}</g><g class="casinha" style="pointer-events:auto"><circle cx="40" cy="44" r="36" fill="#f6f0e4" opacity="0.85"/><path d="M23 46L40 29L57 46V60H23z" fill="#8FAE6B" stroke="#4f6b3a" stroke-width="1.6" stroke-linejoin="round"/><path d="M35.5 60V50H44.5V60" fill="#f2a9c4"/></g><g class="lua-pais" style="pointer-events:auto"><circle cx="352" cy="40" r="30" fill="transparent"/><path d="M352 31a9 9 0 1 0 8 13a7 7 0 1 1-8-13z" fill="#ebd9a8" opacity="0.5"/></g>`;
  el.appendChild(svg);
  /* a letra é traçada duas vezes: duas contas, no svg por cima do canvas */
  const contas = trilha({ svg }, 2);
  contas.agora(0);
  const limpezas: (() => void)[] = [];
  limpezas.push(tocavel(svg.querySelector('.casinha')!, () => void ir('casa')));
  limpezas.push(segurar(svg.querySelector('.lua-pais')!, 2000, () => void ir('pais')));

  const ctx = canvas.getContext('2d')!;
  let W = 390;
  let H = 780;
  let dpr = 1;
  /* a caixa da letra: metade da tela, centrada, acima do Theo */
  const caixa = () => {
    const lado = Math.min(W * 0.62, H * 0.42);
    return { x: (W - lado) / 2, y: H * 0.16, lado };
  };
  const redimensionar = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenhar();
  };
  const obs = observarCaixa(canvas, redimensionar);
  limpezas.push(() => obs?.disconnect());

  const tracado = new Tracado(letra.tracos, 0.14);
  let fase: 'historia' | 'guia' | 'tracar' | 'pronta' = 'historia';
  let guiaU = 0;
  let guiaTraco = 0;
  let imagemOpacidade = 0.9;
  let segundaVez = false;
  let dedoNaTela: Ponto | null = null;
  let vivo = true;
  const ajuda = new Ajuda();

  const paraTela = (p: Ponto): Ponto => {
    const c = caixa();
    return [c.x + p[0] * c.lado, c.y + p[1] * c.lado];
  };
  const paraCaixa = (x: number, y: number): Ponto => {
    const c = caixa();
    return [(x - c.x) / c.lado, (y - c.y) / c.lado];
  };

  function desenharImagem(): void {
    const c = caixa();
    ctx.save();
    ctx.globalAlpha = imagemOpacidade * 0.35;
    ctx.translate(c.x, c.y);
    ctx.scale(c.lado, c.lado);
    ctx.lineWidth = 0.03;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = CORES.musgoTinta;
    ctx.fillStyle = CORES.musgoTinta;
    ctx.beginPath();
    switch (letra.imagem) {
      case 'telhado':
        ctx.moveTo(0.05, 0.95);
        ctx.lineTo(0.5, 0.05);
        ctx.lineTo(0.95, 0.95);
        ctx.moveTo(0.2, 0.62);
        ctx.lineTo(0.8, 0.62);
        ctx.lineTo(0.8, 0.95);
        ctx.lineTo(0.2, 0.95);
        ctx.closePath();
        break;
      case 'estante':
        ctx.rect(0.22, 0.06, 0.6, 0.88);
        ctx.moveTo(0.22, 0.5);
        ctx.lineTo(0.72, 0.5);
        for (const [x, y] of [[0.35, 0.4], [0.6, 0.4], [0.35, 0.86], [0.6, 0.86]]) {
          ctx.moveTo(x! + 0.05, y!);
          ctx.arc(x!, y! - 0.08, 0.05, 0, Math.PI * 2);
        }
        break;
      case 'boca':
        ctx.ellipse(0.5, 0.5, 0.42, 0.42, 0, 0, Math.PI * 2);
        ctx.moveTo(0.35, 0.5);
        ctx.ellipse(0.5, 0.5, 0.15, 0.2, 0, 0, Math.PI * 2);
        break;
      case 'rabo':
        ctx.ellipse(0.3, 0.75, 0.22, 0.2, 0, 0, Math.PI * 2);
        ctx.moveTo(0.42, 0.45);
        ctx.arc(0.32, 0.45, 0.1, 0, Math.PI * 2);
        ctx.moveTo(0.24, 0.38);
        ctx.lineTo(0.22, 0.28);
        ctx.lineTo(0.3, 0.36);
        ctx.moveTo(0.4, 0.38);
        ctx.lineTo(0.42, 0.28);
        ctx.lineTo(0.34, 0.36);
        break;
      case 'deitada':
        ctx.ellipse(0.5, 0.94, 0.5, 0.04, 0, 0, Math.PI * 2);
        ctx.moveTo(0.34, 0.86);
        ctx.arc(0.28, 0.86, 0.06, 0, Math.PI * 2);
        ctx.moveTo(0.34, 0.88);
        ctx.lineTo(0.85, 0.88);
        ctx.moveTo(0.3, 0.8);
        ctx.lineTo(0.3, 0.1);
        break;
      case 'montanhas':
        ctx.moveTo(0.05, 0.95);
        ctx.lineTo(0.3, 0.2);
        ctx.lineTo(0.5, 0.6);
        ctx.lineTo(0.7, 0.1);
        ctx.lineTo(0.95, 0.95);
        break;
      case 'balanco':
        ctx.moveTo(0.15, 0.06);
        ctx.lineTo(0.15, 0.8);
        ctx.moveTo(0.85, 0.06);
        ctx.lineTo(0.85, 0.8);
        ctx.rect(0.1, 0.8, 0.8, 0.08);
        break;
      case 'pinheiro':
        ctx.moveTo(0.5, 0.05);
        ctx.lineTo(0.7, 0.4);
        ctx.lineTo(0.3, 0.4);
        ctx.closePath();
        ctx.moveTo(0.5, 0.3);
        ctx.lineTo(0.75, 0.7);
        ctx.lineTo(0.25, 0.7);
        ctx.closePath();
        ctx.moveTo(0.46, 0.7);
        ctx.lineTo(0.46, 0.95);
        ctx.lineTo(0.54, 0.95);
        ctx.lineTo(0.54, 0.7);
        break;
      case 'vale':
        ctx.moveTo(0.05, 0.3);
        ctx.lineTo(0.15, 0.06);
        ctx.lineTo(0.5, 0.94);
        ctx.lineTo(0.85, 0.06);
        ctx.lineTo(0.95, 0.3);
        ctx.moveTo(0.4, 0.94);
        ctx.lineTo(0.6, 0.94);
        break;
      case 'tronco':
        ctx.rect(0.42, 0.1, 0.16, 0.85);
        ctx.moveTo(0.1, 0.1);
        ctx.lineTo(0.9, 0.1);
        ctx.moveTo(0.2, 0.06);
        ctx.arc(0.2, 0.06, 0.08, 0, Math.PI * 2);
        ctx.moveTo(0.8, 0.06);
        ctx.arc(0.8, 0.06, 0.08, 0, Math.PI * 2);
        break;
    }
    ctx.stroke();
    ctx.restore();
  }

  function desenharFita(): void {
    const c = caixa();
    const larg = Math.max(22, c.lado * 0.11);
    tracado.fitas.forEach((f, i) => {
      const cheio = tracado.cheio[i]!;
      /* a fita pontilhada, o caminho todo */
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = CORES.rosaDoce;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = larg;
      ctx.setLineDash([1, larg * 1.15]);
      ctx.beginPath();
      f.pontos.forEach((p, k) => {
        const q = paraTela(p);
        if (k === 0) ctx.moveTo(q[0], q[1]);
        else ctx.lineTo(q[0], q[1]);
      });
      ctx.stroke();
      ctx.restore();
      /* o que já encheu de rosa, com um fio de luz */
      if (cheio > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = larg;
        ctx.strokeStyle = CORES.rosaDoce;
        ctx.beginPath();
        const n = Math.max(2, Math.round(cheio * 60));
        for (let k = 0; k <= n; k++) {
          const q = paraTela(pontoEm(f, (cheio * k) / n));
          if (k === 0) ctx.moveTo(q[0], q[1]);
          else ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
        ctx.lineWidth = larg * 0.22;
        ctx.strokeStyle = CORES.luz;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      /* a bolinha de partida do traço atual */
      if (i === tracado.traco && fase === 'tracar') {
        const q = paraTela(pontoEm(f, cheio));
        const pulso = 1 + 0.15 * Math.sin(performance.now() / 300);
        ctx.save();
        ctx.fillStyle = CORES.ouro;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(q[0], q[1], larg * 0.45 * pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  function desenharCentelha(x: number, y: number, s: number, cor: string): void {
    ctx.save();
    ctx.translate(x - s / 2, y - s / 2);
    ctx.scale(s / 20, s / 20);
    ctx.fillStyle = cor;
    ctx.fill(new Path2D(CENTELHA));
    ctx.restore();
  }

  function desenharGuia(): void {
    if (fase !== 'guia' && !(fase === 'tracar' && ajuda.nivel >= 1)) return;
    const f = tracado.fitas[guiaTraco];
    if (!f) return;
    const q = paraTela(pontoEm(f, guiaU));
    desenharCentelha(q[0], q[1], Math.max(28, caixa().lado * 0.14), CORES.ouro);
  }

  function desenhar(): void {
    ctx.clearRect(0, 0, W, H);
    /* a página com moldura em arco */
    ctx.fillStyle = CORES.rosa;
    ctx.fillRect(0, 0, W, H);
    const mx = W * 0.09;
    const r = (W - 2 * mx) / 2;
    const topo = H * 0.09;
    ctx.beginPath();
    ctx.moveTo(mx, H * 0.92);
    ctx.lineTo(mx, topo + r);
    ctx.arc(W / 2, topo + r, r, Math.PI, 0);
    ctx.lineTo(W - mx, H * 0.92);
    ctx.closePath();
    ctx.fillStyle = CORES.papel;
    ctx.fill();
    ctx.strokeStyle = CORES.ouro;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    desenharImagem();
    desenharFita();
    desenharGuia();
  }

  let quadro = 0;
  const laco = () => {
    if (!vivo) return;
    if (fase === 'guia') {
      const f = tracado.fitas[guiaTraco]!;
      guiaU += 0.009 / Math.max(0.3, f.comprimento);
      if (guiaU >= 1) {
        guiaU = 0;
        guiaTraco += 1;
        if (guiaTraco >= tracado.fitas.length) {
          guiaTraco = 0;
          fase = 'tracar';
          ajuda.reset();
        }
      }
    } else if (fase === 'tracar' && ajuda.nivel >= 1) {
      /* A1: a estrela guia repete o traço a partir de onde ela parou */
      guiaTraco = Math.min(tracado.traco, tracado.fitas.length - 1);
      const f = tracado.fitas[guiaTraco]!;
      if (guiaU < tracado.cheio[guiaTraco]!) guiaU = tracado.cheio[guiaTraco]!;
      guiaU += 0.006 / Math.max(0.3, f.comprimento);
      if (guiaU >= 1) guiaU = tracado.cheio[guiaTraco]!;
      /* A2: a fita enche sozinha um pouco enquanto o dedo estiver na tela */
      if (ajuda.nivel >= 2 && dedoNaTela && quadro % 6 === 0) {
        tracado.empurrar(0.01);
        conferirTraco();
      }
    }
    quadro += 1;
    desenhar();
    requestAnimationFrame(laco);
  };

  let ultimoTraco = 0;
  function conferirTraco(): void {
    if (tracado.traco > ultimoTraco && !tracado.completa) {
      ultimoTraco = tracado.traco;
      sininho();
      ajuda.reset();
      guiaU = 0;
    }
    if (tracado.completa && fase === 'tracar') void pronta();
  }

  async function pronta(): Promise<void> {
    fase = 'pronta';
    travar(4000);
    centelhasSom();
    sininho();
    imagemOpacidade = 1;
    contas.encher(segundaVez ? 1 : 0);
    mudar((x) => {
      if (!x.letras.includes(letra.id)) {
        x.letras.push(letra.id);
        ganhar(x, PEDRINHAS.letra, 'letra');
      }
      if (ajuda.nivel >= 1) x.registro.a1.caderno = (x.registro.a1.caderno ?? 0) + 1;
      if (ajuda.nivel >= 2) {
        x.registro.a2.caderno = (x.registro.a2.caderno ?? 0) + 1;
        x.ajudaA2.caderno = (x.ajudaA2.caderno ?? 0) + 1;
      } else x.ajudaA2.caderno = 0;
      if (x.pais.ritmoLetras === 'livre' && !segundaVez) x.letraIndice = Math.min(x.letraIndice + 1, letras.length - 1);
    });
    if (temVoz('letra_pronta')) await falar('letra_pronta');
    else await esperar(1500);
    if (!vivo) return;
    if (!segundaVez) {
      /* segunda vez, sem a estrela guia (se a primeira foi até o fim) */
      segundaVez = true;
      contas.agora(1);
      await esperar(800);
      tracado.cheio.fill(0);
      tracado.traco = 0;
      ultimoTraco = 0;
      fase = 'tracar';
      ajuda.reset();
      return;
    }
    await esperar(600);
    /* a palavra da letra, no escorregador de sons */
    if (vivo) void ir('palavra', { palavra: letra.palavra, volta: 'casa' });
  }

  /* o dedo */
  let dedoId = -1;
  const baixo = (ev: PointerEvent) => {
    if (fase !== 'tracar') {
      if (fase === 'historia' || fase === 'guia') return;
      return;
    }
    if (!reivindicarDedo(ev.pointerId)) return;
    dedoId = ev.pointerId;
    const r = canvas.getBoundingClientRect();
    const p = paraCaixa(ev.clientX - r.left, ev.clientY - r.top);
    dedoNaTela = p;
    ajuda.tocou();
    tracado.comecar(p);
    canvas.setPointerCapture(ev.pointerId);
  };
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoId || fase !== 'tracar') return;
    const r = canvas.getBoundingClientRect();
    const p = paraCaixa(ev.clientX - r.left, ev.clientY - r.top);
    dedoNaTela = p;
    tracado.mover(p, ajuda.nivel >= 2);
    conferirTraco();
  };
  const cima = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoId) return;
    soltarDedo(dedoId);
    dedoId = -1;
    dedoNaTela = null;
    tracado.soltar();
    if (fase === 'tracar' && !tracado.completa) ajuda.tentativa();
  };
  canvas.addEventListener('pointerdown', baixo);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', cima);
  canvas.addEventListener('pointercancel', cima);
  const tique = window.setInterval(() => {
    if (fase === 'tracar' && !dedoNaTela) ajuda.tick(1);
  }, 1000);
  limpezas.push(() => window.clearInterval(tique));

  /* a história, a imagem, depois a fita e a estrela guia */
  void (async () => {
    tocarFundo('preludio_bach');
    await esperar(600);
    if (temVoz(letra.historia)) await falar(letra.historia);
    else await esperar(2200);
    if (!vivo) return;
    imagemOpacidade = 0.5;
    if (temVoz(letra.som)) void falar(letra.som);
    fase = 'guia';
  })();
  requestAnimationFrame(laco);

  return {
    el,
    destruir: () => {
      vivo = false;
      for (const l of limpezas) l();
      canvas.removeEventListener('pointerdown', baixo);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', cima);
      canvas.removeEventListener('pointercancel', cima);
    },
  };
}
