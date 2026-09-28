import { convidarParaCasa, mover, pedrinha, pedrinhasSobem, telaSvg, type TelaSvg } from './comum';
import { botaoPronto, guiar, type Pronto } from './guia';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { ceuDaHora } from '@/core/relogio';
import { esperar, pontoNoSvg, svgEl } from '@/core/util';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { anunciar } from '@/core/narracao';
import { familia } from '@/puppet/boneco';
import { centelha, coelho, nuvem, pinheiro, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { aplauso, lira, liraDesce, PENTATONICA, sininho, tiquinho, toc } from '@/audio/synth';
import { AMPLITUDE_ALTA, AMPLITUDE_PARA_CONTAR, amplitude, anguloDoDedo, CONTA_ATE, empurrar, impulso, novaGangorra, novoBalanco, parado, passo, passoGangorra, peNoChao, soltar, type Balanco } from '@/core/parquinho';
import type { Tela } from '@/core/roteador';

/*
 * O parquinho do condomínio, fora da porta. A Stella faz sempre a mesma volta
 * lá: se balança sozinha no balanço contando até dez, depois vai ao
 * escorregador, depois à gangorra. No balanço e no escorregador ela vai
 * sozinha; na gangorra, que é para dois, o Theo fica na outra ponta. Quem
 * sobe, empurra e desce é sempre ela.
 * Três telas, uma por brinquedo; os outros dois aparecem pequenos na cena e
 * se tocam para ir. Nada é trancado.
 * Sozinha, ela não sabia o que fazer em nenhum dos três, e nenhum acabava:
 * agora a mãozinha toca o brinquedo logo na entrada (e de novo se ela parar),
 * e depois da primeira vez o visto verde acende no céu, à direita: tocado,
 * a palma vem e ela volta para casa (o guia, em guia.ts).
 */

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };
const MADEIRA = '#c9a189';
const TERRA = '#8a6a4a';
const CORDA = '#8f6f2c';
const NUMEROS = ['um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];

/* ---------- a cena comum: céu da hora, grama e a areia do parquinho ---------- */

function fundoDoParquinho(): { s: string; noite: boolean } {
  const ceu = ceuDaHora(sessao.agora());
  const noite = ceu === 'ceu-noite';
  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, 390, 420, noite ? '#1b2140' : '#f6e3dc', 4, 0.35);
  s += noite ? `<circle cx="60" cy="70" r="14" fill="#ebd9a8"/>${centelha(300, 60, 8, '#ebd9a8')}${centelha(120, 110, 6, '#ebd9a8')}` : nuvem(300, 120, 22) + nuvem(80, 160, 16);
  s += `<rect x="0" y="600" width="390" height="180" fill="#8fae6b"/>` + veu(0, 600, 390, 180, '#c9dbb2', 4, 0.35);
  s += `<path d="M-20 660q120 -40 220 -34q140 6 210 30v70h-430z" fill="#eeddb4"/>` + veu(0, 630, 390, 120, '#ebd9a8', 3, 0.3);
  return { s, noite };
}

/* ---------- os brinquedos ---------- */

const PIV: [number, number] = [195, 300];
const LCORDA = 280;
const ASSENTO = PIV[1] + LCORDA;

function traveDoBalanco(): string {
  const [px, py] = PIV;
  let s = '';
  for (const cx of [px - 118, px + 118]) {
    s += `<path d="M${cx - 46} 620L${cx} ${py + 2}L${cx + 46} 620" fill="none" stroke="${MADEIRA}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M${cx - 28} 560h56" stroke="${MADEIRA}" stroke-width="8" stroke-linecap="round"/>`;
  }
  s += `<path d="M${px - 130} ${py}h260" stroke="${TERRA}" stroke-width="14" stroke-linecap="round"/>`;
  return s;
}

function escorregador(x: number, y: number, h: number): string {
  const w = h * 1.15;
  let s = `<path d="M${x - 14} ${y}V${y - h}M${x + 14} ${y}V${y - h}" stroke="${MADEIRA}" stroke-width="7" stroke-linecap="round"/>`;
  for (let i = 1; i <= 4; i++) s += `<path d="M${x - 14} ${y - (h * i) / 5}h28" stroke="${MADEIRA}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M${x - 4} ${y - h - 4}h48" stroke="${TERRA}" stroke-width="10" stroke-linecap="round"/>`;
  const rampa = `M${x + 40} ${y - h}Q${x + w * 0.55} ${y - h * 0.92} ${x + w * 0.72} ${y - h * 0.45}Q${x + w * 0.85} ${y - h * 0.1} ${x + w} ${y}`;
  s += `<path d="${rampa}" fill="none" stroke="#ebd9a8" stroke-width="16" stroke-linecap="round"/><path d="${rampa}" fill="none" stroke="#c6a15b" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
  s += `<path d="M${x + w * 0.72} ${y - h * 0.45}V${y}" stroke="${MADEIRA}" stroke-width="6" stroke-linecap="round"/>`;
  return s;
}

function gangorra(x: number, y: number, w: number, ang = -8): string {
  return `<path d="M${x - 12} ${y}L${x} ${y - 28}L${x + 12} ${y}z" fill="${TERRA}"/><g transform="rotate(${ang} ${x} ${y - 28})"><rect x="${x - w / 2}" y="${y - 34}" width="${w}" height="10" rx="5" fill="${MADEIRA}"/><path d="M${x - w / 2 + 14} ${y - 34}v-14M${x + w / 2 - 14} ${y - 34}v-14" stroke="${TERRA}" stroke-width="5" stroke-linecap="round"/><rect x="${x - w / 2 + 4}" y="${y - 40}" width="26" height="7" rx="3" fill="#f2a9c4"/><rect x="${x + w / 2 - 30}" y="${y - 40}" width="26" height="7" rx="3" fill="#f2a9c4"/></g>`;
}

/**
 * O visto verde do parquinho: tocado, a palma e de volta para casa. Fica no
 * céu à direita, longe da casinha, das Opções e dos brinquedos; no balanço,
 * acima da trave (y 230); nos outros, mais baixo (y 290), para o cartão do
 * anúncio aos pais, que desce do alto na primeira vez, não cobrir o visto.
 */
function prontoDoParquinho(tela: TelaSvg, y: number, aoAcabar: () => void): Pronto {
  const x = 330;
  let foi = false;
  return botaoPronto(tela, x, y, () => {
    if (foi) return;
    foi = true;
    aoAcabar();
    travar(1200);
    liraDesce();
    tela.comemorar(x, y);
    void esperar(900).then(() => {
      if (tela.el.isConnected) void sessao.voltarParaCasa();
    });
  });
}

/* ---------- a palma quando ela brilha: a voz vem de fora da cena ---------- */

async function viva(frase: string): Promise<void> {
  aplauso(1.6);
  if (temVoz(frase)) await falar(frase);
  else await esperar(1500);
}

/** Na gangorra o Theo está na outra ponta e bate palma junto. */
async function palmaDoTheo(tela: TelaSvg, x: number, y: number, frase: string): Promise<void> {
  const g = tela.svg.querySelector('.theo');
  if (!g) return;
  g.innerHTML = familia.theo(x, y, 190, 'palma', { dir: -1 }).svg;
  await viva(frase);
  g.innerHTML = familia.theo(x, y, 190, 'segura', { dir: -1 }).svg;
}

/** Um laço de quadros que morre com a tela. */
function laco(tela: TelaSvg, quadro: (dt: number) => void): void {
  let vivo = true;
  let ultimo = performance.now();
  const passo = (t: number) => {
    if (!vivo) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    quadro(dt);
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  tela.aoDestruir(() => {
    vivo = false;
  });
}

/** Diz um número: a voz da família se gravou, senão a do aparelho (número é palavra inteira). */
function dizNumero(n: number): void {
  const id = `num_${n}`;
  if (temVoz(id)) void falar(id);
  else void falarPalavra(NUMEROS[n - 1] ?? String(n), 0.95);
}

/* ---------- TELA 1: o balanço ---------- */

export function telaParquinho(): Tela {
  const e = estado();
  const contar = e.pais.contarNoBalanco;
  const { s: fundo } = fundoDoParquinho();
  let s = fundo + pinheiro(30, 600, 200, false);
  /* a faixa do balanço: o toque aqui é dela, não do fundo (a classe alvo cala o sininho do fundo) */
  s += `<g class="alvo"><rect x="24" y="320" width="342" height="380" fill="transparent"/></g>`;
  /* os outros dois brinquedos, pequenos; os alvos deles vêm por cima, no fim */
  s += gangorra(64, 632, 110) + escorregador(262, 640, 110);
  s += traveDoBalanco();
  const stella = familia.stella(PIV[0], ASSENTO + 22, 140, 'balanco');
  /* o grupo que gira não leva a classe alvo: ela muda a origem da rotação */
  s += `<g class="balanco"><path d="M${PIV[0] - 13} ${PIV[1]}V${ASSENTO - 2}M${PIV[0] + 13} ${PIV[1]}V${ASSENTO - 2}" stroke="${CORDA}" stroke-width="3.5" stroke-linecap="round"/><rect x="${PIV[0] - 36}" y="${ASSENTO - 6}" width="72" height="11" rx="5" fill="${MADEIRA}"/>${stella.svg}</g>`;
  s += coelho(330, 668, 24);
  /* o pote da contagem, só aqui: as pedrinhas dele são da brincadeira */
  if (contar) s += `<g class="pote"><path d="M300 640q0 -8 6 -8h48q6 0 6 8v6q-6 6 -6 14v40q0 12 -12 12h-24q-12 0 -12 -12v-40q0 -8 -6 -14z" fill="#9fc3cf" opacity="0.28" stroke="#ebd9a8" stroke-width="2"/><g class="pedrinhas"></g></g>`;
  s += `<g data-alvo="gangorra"><circle cx="64" cy="610" r="44" fill="transparent"/></g><g data-alvo="escorregador"><circle cx="320" cy="590" r="54" fill="transparent"/></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');

  const rider = svg.querySelector('.balanco') as SVGGElement;
  const cabelo = rider.querySelector('.cabelo-atras') as SVGGElement | null;
  const [hx, hy] = stella.cabeca;
  const b: Balanco = novoBalanco();
  let arrasto: { id: number; th0: number; t: number; vel: number; moveu: boolean; x0: number } | null = null;
  let conta = 0;
  let cheio = false;
  let ultimaPalma = 0;
  let fezDez = false;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const desenha = () => {
    rider.setAttribute('transform', `rotate(${(-b.th * 57.2958).toFixed(2)} ${PIV[0]} ${PIV[1]})`);
    if (cabelo) cabelo.setAttribute('transform', `rotate(${(b.om * 9).toFixed(2)} ${hx.toFixed(1)} ${hy.toFixed(1)})`);
  };

  /* o visto acende no primeiro empurrão: o balanço não acaba sozinho */
  const pronto = prontoDoParquinho(tela, 230, () => guia.calar());
  /* a mãozinha toca o assento, e o balanço sai de leve, como se fosse o toque:
     antes ela ia para o escorregador e ninguém mostrava o balanço. Balançando
     e parada de novo, aponta o visto */
  const ASSENTO_MAO: [number, number] = [PIV[0], ASSENTO - 14];
  const guia = guiar(tela, {
    atraso: 1000,
    proximo: () => {
      if (pronto.aceso && (fezDez || guia.ajuda.nivel >= 2)) return { tipo: 'apontar', em: pronto.onde };
      if (parado(b))
        void esperar(300).then(() => {
          /* baixinho: não chega a contar pedrinha, a conta é dela */
          if (vivo && parado(b) && !arrasto) b.om = 0.35;
        });
      return { tipo: 'tocar', em: ASSENTO_MAO };
    },
  });

  const umaPedrinha = () => {
    if (!contar || cheio) return;
    conta += 1;
    const g = svg.querySelector('.pote .pedrinhas') as SVGGElement | null;
    if (!g) return;
    const slot = [[-18, -12], [-6, -12], [6, -12], [18, -12], [-12, -26], [0, -26], [12, -26], [-18, -40], [-6, -40], [6, -40]][conta - 1] ?? [0, 0];
    const p = svgEl(`<g>${pedrinha(PIV[0] + 10, ASSENTO - 60, 6, conta)}</g>`);
    g.appendChild(p);
    toc(520 + conta * 30, 0.14);
    requestAnimationFrame(() => mover(p, 330 + slot[0]! - (PIV[0] + 10), 690 + slot[1]! - (ASSENTO - 60), 500));
    const n = conta;
    void esperar(420).then(() => {
      if (!vivo) return;
      lira(PENTATONICA[(n - 1) % PENTATONICA.length]!, undefined, 0.3);
      dizNumero(n);
    });
    if (conta >= CONTA_ATE) {
      cheio = true;
      let medalha = 0;
      mudar((x) => {
        medalha = ganhar(x, PEDRINHAS.balanco, 'balanco');
      });
      void (async () => {
        await esperar(900);
        if (!vivo) return;
        tela.comemorar(330, 620);
        tela.comemorar(PIV[0] + 40, ASSENTO - 150);
        if (e.pais.pedrinhas) pedrinhasSobem(tela, PEDRINHAS.balanco, PIV[0], ASSENTO - 120);
        if (medalha) sininho();
        await viva('viva_forca');
        if (!vivo) return;
        await esperar(600);
        g.querySelectorAll('g').forEach((c) => {
          (c as SVGElement).style.transition = 'opacity 900ms';
          (c as SVGElement).style.opacity = '0';
        });
        await esperar(1000);
        g.innerHTML = '';
        conta = 0;
        cheio = false;
        /* a primeira vez até dez é o fim natural: a casinha acende; pode seguir balançando */
        if (!fezDez) {
          fezDez = true;
          convidarParaCasa(tela);
        }
      })();
    }
  };

  laco(tela, (dt) => {
    if (!arrasto) {
      const cruzou = passo(b, dt);
      if (cruzou) {
        const amp = amplitude(b);
        lira(PENTATONICA[Math.min(PENTATONICA.length - 1, Math.floor(amp * 7))]!, undefined, 0.2 + Math.min(0.15, amp * 0.2));
        if (cruzou > 0 && amp > AMPLITUDE_PARA_CONTAR) umaPedrinha();
        if (cruzou > 0 && amp > AMPLITUDE_ALTA && performance.now() - ultimaPalma > 9000) {
          ultimaPalma = performance.now();
          tela.comemorar(PIV[0] + 20, ASSENTO - 150);
          void viva('viva_forca');
        }
      }
    }
    desenha();
  });

  /* o toque no balanço: arrastar e soltar dá o primeiro balanço; um toque é o impulso das pernas dela */
  const baixo = (ev: PointerEvent) => {
    if ((ev.target as Element).closest('[data-alvo]')) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (y < 320 || y > 700) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    arrasto = { id: ev.pointerId, th0: b.th, t: performance.now(), vel: 0, moveu: false, x0: x };
    try {
      svg.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  };
  const move = (ev: PointerEvent) => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const agora = performance.now();
    if (!arrasto.moveu && Math.abs(x - arrasto.x0) > 10) arrasto.moveu = true;
    if (!arrasto.moveu) return;
    const th = anguloDoDedo(x - PIV[0], y - PIV[1]);
    const dt = Math.max(0.008, (agora - arrasto.t) / 1000);
    arrasto.vel = 0.6 * arrasto.vel + (0.4 * (th - b.th)) / dt;
    b.th = th;
    b.om = 0;
    arrasto.t = agora;
  };
  const cima = (ev: PointerEvent) => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    const a = arrasto;
    arrasto = null;
    soltarDedo(a.id);
    if (a.moveu) soltar(b, a.vel);
    else impulso(b);
    pronto.acender();
    guia.passo();
  };
  svg.addEventListener('pointerdown', baixo);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', cima);
  svg.addEventListener('pointercancel', cima);
  tela.aoDestruir(() => {
    svg.removeEventListener('pointerdown', baixo);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', cima);
    svg.removeEventListener('pointercancel', cima);
  });

  tela.alvo('[data-alvo="escorregador"]', () => {
    travar(500);
    void ir('escorregador');
  });
  tela.alvo('[data-alvo="gangorra"]', () => {
    travar(500);
    void ir('gangorra');
  });
  return tela;
}

/* ---------- TELA 2: o escorregador ---------- */

const EX = 84;
const EY = 640;
const EH = 230;
const EW = EH * 1.15;
const DEGRAUS = 5;

/** um ponto da rampa, t de 0 (alto) a 1 (areia): os mesmos dois arcos do desenho */
function pontoDaRampa(t: number): [number, number] {
  const p0: [number, number] = [EX + 40, EY - EH];
  const c1: [number, number] = [EX + EW * 0.55, EY - EH * 0.92];
  const p1: [number, number] = [EX + EW * 0.72, EY - EH * 0.45];
  const c2: [number, number] = [EX + EW * 0.85, EY - EH * 0.1];
  const p2: [number, number] = [EX + EW, EY];
  const q = (a: [number, number], c: [number, number], b: [number, number], u: number): [number, number] => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
  ];
  return t < 0.5 ? q(p0, c1, p1, t * 2) : q(p1, c2, p2, (t - 0.5) * 2);
}

export function telaEscorregador(): Tela {
  const { s: fundo } = fundoDoParquinho();
  let s = fundo + `<g data-alvo="balanco" transform="translate(-100 300) scale(0.5)">${traveDoBalanco()}<path d="M${PIV[0] - 13} ${PIV[1]}V${ASSENTO - 2}M${PIV[0] + 13} ${PIV[1]}V${ASSENTO - 2}" stroke="${CORDA}" stroke-width="3.5"/><rect x="${PIV[0] - 36}" y="${ASSENTO - 6}" width="72" height="11" rx="5" fill="${MADEIRA}"/><circle cx="195" cy="480" r="120" fill="transparent"/></g>`;
  s += `<g data-alvo="escada">${escorregador(EX, EY, EH)}<rect x="${EX - 40}" y="${EY - EH - 20}" width="90" height="${EH + 40}" fill="transparent"/></g>`;
  s += `<g class="stella alvo"></g>`;
  s += `<g data-alvo="gangorra">${gangorra(340, 700, 90)}<circle cx="340" cy="690" r="40" fill="transparent"/></g>`;
  s += coelho(48, 668, 22);
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const gst = svg.querySelector('.stella') as SVGGElement;

  type Fase = 'chao' | 'escada' | 'subindo' | 'topo' | 'descendo' | 'areia' | 'voltando';
  const st = { fase: 'chao' as Fase, degrau: 0, t: 0, de: [0, 0] as [number, number], para: [0, 0] as [number, number], pos: [EX - 30, EY] as [number, number] };
  let desceu = 0;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  const posDegrau = (i: number): [number, number] => (i === 0 ? [EX - 30, EY] : i <= DEGRAUS ? [EX, EY - (EH * i) / (DEGRAUS + 1) + 4] : [EX + 22, EY - EH - 4]);

  const desenha = () => {
    let pose: 'parado' | 'sentado' = 'parado';
    let dir: 1 | -1 = 1;
    let [x, y] = st.pos;
    if (st.fase === 'topo') {
      pose = 'sentado';
      x = EX + 34;
      y = EY - EH + 8;
    } else if (st.fase === 'descendo') pose = 'sentado';
    else if (st.fase === 'voltando') dir = -1;
    const d = familia.stella(x, y, 120, pose, { dir, contorno: st.fase === 'descendo' ? '#ebd9a8' : undefined });
    gst.innerHTML = d.svg;
    if (st.fase === 'descendo') {
      const cab = gst.querySelector('.cabelo-atras');
      if (cab) cab.setAttribute('transform', `rotate(-28 ${d.cabeca[0].toFixed(1)} ${d.cabeca[1].toFixed(1)})`);
    }
  };
  desenha();

  /* o visto acende depois da primeira descida: ela escorrega quantas vezes quiser */
  const pronto = prontoDoParquinho(tela, 290, () => guia.calar());
  /* a mãozinha toca o degrau de cima dela (subir) e, lá no alto, toca ela
     (descer): antes nada mostrava isso na entrada. Já tendo descido e parada
     de novo no chão, aponta o visto */
  const guia = guiar(tela, {
    atraso: 1000,
    proximo: () => {
      if (st.fase === 'topo') return { tipo: 'tocar', em: [EX + 38, EY - EH - 30] };
      if (st.fase !== 'chao' && st.fase !== 'escada') return null;
      if (pronto.aceso && guia.ajuda.nivel >= 2) return { tipo: 'apontar', em: pronto.onde };
      const [, y] = posDegrau(Math.min(DEGRAUS, st.degrau + 1));
      return { tipo: 'tocar', em: [EX, y + 10] };
    },
  });

  laco(tela, (dt) => {
    if (st.fase === 'subindo' || st.fase === 'voltando') {
      st.t = Math.min(1, st.t + dt / (st.fase === 'subindo' ? 0.45 : 1.1));
      const k = 1 - Math.pow(1 - st.t, 2);
      st.pos = [st.de[0] + (st.para[0] - st.de[0]) * k, st.de[1] + (st.para[1] - st.de[1]) * k - (st.fase === 'subindo' ? Math.sin(Math.PI * st.t) * 10 : 0)];
      if (st.t >= 1) st.fase = st.fase === 'subindo' ? (st.degrau > DEGRAUS ? 'topo' : 'escada') : 'chao';
      desenha();
    } else if (st.fase === 'descendo') {
      st.t = Math.min(1, st.t + dt / 1.3);
      const k = st.t * st.t * (3 - 2 * st.t) * 0.3 + st.t * 0.7;
      const [x, y] = pontoDaRampa(k);
      st.pos = [x, y - 6];
      desenha();
      if (st.t >= 1) {
        st.fase = 'areia';
        st.pos = [EX + EW + 6, EY + 14];
        desenha();
        desceu += 1;
        tela.comemorar(st.pos[0], st.pos[1] - 110);
        if (desceu === 1) anunciar('escorregador');
        void (async () => {
          await viva('viva_coragem');
          if (!vivo) return;
          st.fase = 'voltando';
          st.t = 0;
          st.de = [...st.pos] as [number, number];
          st.para = posDegrau(0);
          st.degrau = 0;
          pronto.acender();
          guia.passo();
        })();
      }
    }
  });

  const tocou = () => {
    if (st.fase === 'chao' || st.fase === 'escada') {
      st.degrau += 1;
      st.fase = 'subindo';
      st.t = 0;
      st.de = [...st.pos] as [number, number];
      st.para = posDegrau(st.degrau);
      lira(PENTATONICA[Math.min(PENTATONICA.length - 1, st.degrau)]!, undefined, 0.32);
      travar(420);
      guia.passo();
    } else if (st.fase === 'topo') {
      st.fase = 'descendo';
      st.t = 0;
      /* o "uuuh" da descida: a lira descendo em escala */
      for (let i = 0; i < 7; i++) void esperar(150 + i * 160).then(() => vivo && lira(PENTATONICA[6 - i]!, undefined, 0.22));
      travar(1600);
      guia.passo();
    } else tiquinho();
  };
  tela.alvo('[data-alvo="escada"]', tocou, true);
  tela.alvo('.stella', tocou, true);
  tela.alvo('[data-alvo="gangorra"]', () => {
    travar(500);
    void ir('gangorra');
  });
  tela.alvo('[data-alvo="balanco"]', () => {
    travar(500);
    void ir('parquinho');
  });
  return tela;
}

/* ---------- TELA 3: a gangorra ---------- */

const GX = 195;
const GY = 596;
const GL = 150;
const THEO_G: [number, number] = [GX + GL + 4, 662];

export function telaGangorra(): Tela {
  const { s: fundo } = fundoDoParquinho();
  let s = fundo + `<g data-alvo="balanco" transform="translate(150 330) scale(0.45)">${traveDoBalanco()}<path d="M${PIV[0] - 13} ${PIV[1]}V${ASSENTO - 2}M${PIV[0] + 13} ${PIV[1]}V${ASSENTO - 2}" stroke="${CORDA}" stroke-width="3.5"/><rect x="${PIV[0] - 36}" y="${ASSENTO - 6}" width="72" height="11" rx="5" fill="${MADEIRA}"/><circle cx="195" cy="460" r="130" fill="transparent"/></g>`;
  s += `<g data-alvo="escorregador" transform="translate(60 250) scale(0.55)">${escorregador(262, 640, 110)}<circle cx="320" cy="580" r="80" fill="transparent"/></g>`;
  s += `<path d="M${GX - 16} ${GY}L${GX} ${GY - 34}L${GX + 16} ${GY}z" fill="${TERRA}"/>`;
  const stella = familia.stella(GX - GL + 24, GY - 34 + 16, 120, 'sentado');
  s += `<g class="tabua"><rect x="${GX - GL - 10}" y="${GY - 40}" width="${2 * GL + 20}" height="12" rx="6" fill="${MADEIRA}"/><path d="M${GX - GL + 26} ${GY - 40}v-16M${GX + GL - 26} ${GY - 40}v-16" stroke="${TERRA}" stroke-width="6" stroke-linecap="round"/><rect x="${GX - GL + 6}" y="${GY - 46}" width="40" height="8" rx="4" fill="#f2a9c4"/><rect x="${GX + GL - 46}" y="${GY - 46}" width="40" height="8" rx="4" fill="#f2a9c4"/>${stella.svg}</g>`;
  s += `<g class="theo">${familia.theo(THEO_G[0], THEO_G[1], 190, 'segura', { dir: -1 }).svg}</g>`;
  s += coelho(40, 668, 22);
  s += `<g data-alvo="tabua"><rect x="24" y="380" width="${GX + 40}" height="300" fill="transparent"/></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const tabua = svg.querySelector('.tabua') as SVGGElement;
  const cabelo = tabua.querySelector('.cabelo-atras') as SVGGElement | null;
  const [hx, hy] = stella.cabeca;
  const g = novaGangorra();
  let subidas = 0;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const desenha = () => {
    tabua.setAttribute('transform', `rotate(${(g.th * 57.2958).toFixed(2)} ${GX} ${GY - 34})`);
    if (cabelo) cabelo.setAttribute('transform', `rotate(${(g.om * 6).toFixed(2)} ${hx.toFixed(1)} ${hy.toFixed(1)})`);
  };
  desenha();
  /* o visto acende na primeira subida: a gangorra não acaba sozinha */
  const pronto = prontoDoParquinho(tela, 290, () => guia.calar());
  /* a mãozinha toca a ponta dela da tábua (antes, só parada, e alto demais);
     já tendo subido e parada de novo, aponta o visto */
  const guia = guiar(tela, {
    atraso: 1000,
    proximo: () => {
      if (pronto.aceso && guia.ajuda.nivel >= 2) return { tipo: 'apontar', em: pronto.onde };
      return peNoChao(g) ? { tipo: 'tocar', em: [GX - GL + 40, GY - 70] } : null;
    },
  });

  laco(tela, (dt) => {
    if (passoGangorra(g, dt)) toc(300, 0.12);
    desenha();
  });

  tela.alvo(
    '[data-alvo="tabua"]',
    () => {
      if (!empurrar(g)) {
        tiquinho();
        return;
      }
      subidas += 1;
      pronto.acender();
      guia.passo();
      for (let i = 0; i < 4; i++) void esperar(i * 90).then(() => vivo && lira(PENTATONICA[i + 1]!, undefined, 0.24));
      if (subidas % 5 === 0) {
        if (subidas === 5) anunciar('gangorra');
        void esperar(500).then(async () => {
          if (!vivo) return;
          tela.comemorar(GX - GL + 24, GY - 200);
          await palmaDoTheo(tela, THEO_G[0], THEO_G[1], 'theo_esperta');
        });
      }
    },
    true,
  );
  tela.alvo('[data-alvo="balanco"]', () => {
    travar(500);
    void ir('parquinho');
  });
  tela.alvo('[data-alvo="escorregador"]', () => {
    travar(500);
    void ir('escorregador');
  });
  return tela;
}
