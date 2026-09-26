/**
 * Os sons das letras sem gravação: o fonema montado na hora com o que o Web
 * Audio já tem (oscilador, ruído e filtros), no jeito de um sintetizador de
 * formantes. A voz do aparelho não serve para isso: ela lê o nome da letra
 * ("gê", "esse") e, esticada ("sss"), soletra. Aqui o som é o próprio som:
 *
 * - vogais e consoantes que soam com a voz (M, N, L) são pregas vocais de
 *   mentira (uma onda com os harmônicos caindo como os da garganta) passando
 *   por três filtros afinados nas ressonâncias da boca (os formantes);
 * - as que chiam (S, F, X, R) são ruído passado por filtros no lugar do chiado
 *   de cada uma; as mesmas com voz (Z, V, J) somam o zumbido da garganta e o
 *   chiado pulsa junto com ele;
 * - as de estalo (P, T, C, B, D, G) são um estouro curto de ruído e um "â"
 *   bem curto depois, porque sozinho o estalo não se ouve.
 *
 * A gravação da família, quando existe, vem sempre antes.
 */

type Formantes = [number, number, number];

interface Vogal {
  tipo: 'vogal';
  f: Formantes;
  /** quanto cada formante soa; a maior parte da voz está no primeiro */
  g?: Formantes;
  dur: number;
}

interface Soante {
  tipo: 'soante';
  f: Formantes;
  g: Formantes;
  /** corta o brilho: nasal e L são sons abafados */
  corte: number;
  dur: number;
  nivel: number;
  /** LH e NH não se seguram sozinhos: escorregam para um "é" */
  para?: Formantes;
  /** em que fração da duração começa a escorregar para `para` (padrão 0,35) */
  soltaEm?: number;
}

interface Chiado {
  tipo: 'chiado';
  /** o chiado: filtros em série sobre o ruído */
  filtros: { tipo: BiquadFilterType; f: number; q: number }[];
  nivel: number;
  vozeada: boolean;
  dur: number;
}

interface Estalo {
  tipo: 'estalo';
  /** onde o estouro soa: grave nos lábios (P, B), agudo nos dentes (T, D), no meio no céu da boca (C, G) */
  estouro: number;
  vozeada: boolean;
}

export type Receita = Vogal | Soante | Chiado | Estalo;

/** "â" curtinho, o apoio das consoantes de estalo */
const APOIO: Formantes = [620, 1250, 2550];
const E_ABERTO: Formantes = [650, 2100, 2900];

export const RECEITAS: Record<string, Receita> = {
  som_a: { tipo: 'vogal', f: [850, 1400, 2800], dur: 0.75 },
  som_e: { tipo: 'vogal', f: E_ABERTO, g: [1, 0.55, 0.3], dur: 0.75 },
  som_e2: { tipo: 'vogal', f: [440, 2300, 3000], g: [1, 0.5, 0.3], dur: 0.75 },
  som_i: { tipo: 'vogal', f: [310, 2750, 3350], g: [1, 0.35, 0.3], dur: 0.75 },
  som_o: { tipo: 'vogal', f: [640, 1000, 2700], g: [1, 0.7, 0.12], dur: 0.75 },
  som_o2: { tipo: 'vogal', f: [460, 880, 2700], g: [1, 0.6, 0.1], dur: 0.75 },
  som_u: { tipo: 'vogal', f: [340, 780, 2600], g: [1, 0.35, 0.06], dur: 0.75 },
  som_m: { tipo: 'soante', f: [260, 1100, 2400], g: [1, 0.04, 0.03], corte: 700, dur: 0.95, nivel: 1.3 },
  som_n: { tipo: 'soante', f: [260, 1700, 2600], g: [1, 0.08, 0.05], corte: 1200, dur: 0.95, nivel: 1.25 },
  /* o L sozinho soava como zumbido: agora é mais escuro (a língua no céu da boca abafa o
     brilho) e, no fim, solta a língua num "â" bem curtinho, que é o que faz o ouvido reconhecer o L */
  som_l: { tipo: 'soante', f: [340, 1100, 2700], g: [1, 0.25, 0.05], corte: 2000, dur: 0.95, nivel: 1.1, para: APOIO, soltaEm: 0.75 },
  som_lh: { tipo: 'soante', f: [300, 2150, 3000], g: [1, 0.3, 0.12], corte: 4000, dur: 0.7, nivel: 1, para: E_ABERTO },
  som_nh: { tipo: 'soante', f: [260, 2100, 2900], g: [1, 0.12, 0.06], corte: 2400, dur: 0.7, nivel: 1.2, para: E_ABERTO },
  som_s: { tipo: 'chiado', filtros: [{ tipo: 'highpass', f: 4200, q: 0.7 }, { tipo: 'peaking', f: 7000, q: 1.2 }], nivel: 0.5, vozeada: false, dur: 0.95 },
  som_z: { tipo: 'chiado', filtros: [{ tipo: 'highpass', f: 4200, q: 0.7 }, { tipo: 'peaking', f: 7000, q: 1.2 }], nivel: 0.32, vozeada: true, dur: 0.95 },
  som_x: { tipo: 'chiado', filtros: [{ tipo: 'bandpass', f: 3000, q: 1.1 }, { tipo: 'lowpass', f: 6500, q: 0.7 }], nivel: 0.9, vozeada: false, dur: 0.95 },
  som_j: { tipo: 'chiado', filtros: [{ tipo: 'bandpass', f: 3000, q: 1.1 }, { tipo: 'lowpass', f: 6500, q: 0.7 }], nivel: 0.55, vozeada: true, dur: 0.95 },
  som_f: { tipo: 'chiado', filtros: [{ tipo: 'highpass', f: 1400, q: 0.5 }, { tipo: 'bandpass', f: 4500, q: 0.35 }], nivel: 0.35, vozeada: false, dur: 0.95 },
  som_v: { tipo: 'chiado', filtros: [{ tipo: 'highpass', f: 1400, q: 0.5 }, { tipo: 'bandpass', f: 4500, q: 0.35 }], nivel: 0.22, vozeada: true, dur: 0.95 },
  /* o R de rato no português do Brasil é um chiado no fundo da garganta */
  som_r: { tipo: 'chiado', filtros: [{ tipo: 'bandpass', f: 1300, q: 1.4 }, { tipo: 'lowpass', f: 2600, q: 0.7 }], nivel: 0.9, vozeada: false, dur: 0.8 },
  som_p: { tipo: 'estalo', estouro: 900, vozeada: false },
  som_b: { tipo: 'estalo', estouro: 900, vozeada: true },
  som_t: { tipo: 'estalo', estouro: 4500, vozeada: false },
  som_d: { tipo: 'estalo', estouro: 4500, vozeada: true },
  som_c: { tipo: 'estalo', estouro: 2000, vozeada: false },
  som_g: { tipo: 'estalo', estouro: 2000, vozeada: true },
};

/**
 * O som de cada letra da palavra em destaque, do bilhete e do caderno:
 * sempre o som, nunca o nome. Á soa como A, Ó como O, Ê e Ô fechados. O H
 * não tem som (THEO), e o Ã fica sem som isolado.
 */
const SOM_DA_LETRA: Record<string, string> = {
  A: 'som_a', Á: 'som_a', À: 'som_a', E: 'som_e', É: 'som_e', Ê: 'som_e2', I: 'som_i', Í: 'som_i',
  O: 'som_o', Ó: 'som_o', Ô: 'som_o2', U: 'som_u', Ú: 'som_u',
  B: 'som_b', C: 'som_c', D: 'som_d', F: 'som_f', G: 'som_g', J: 'som_j', L: 'som_l', M: 'som_m',
  N: 'som_n', P: 'som_p', R: 'som_r', S: 'som_s', T: 'som_t', V: 'som_v', X: 'som_x', Z: 'som_z',
};

export function somDaLetra(letra: string): string | null {
  return SOM_DA_LETRA[letra.toUpperCase()] ?? null;
}

/** Quanto dura um som, em segundos, esticado por `esticar`. */
export function duracaoDoSom(id: string, esticar = 1): number {
  const r = RECEITAS[id];
  if (!r) return 0;
  if (r.tipo === 'estalo') return (r.vozeada ? 0.06 : 0.04) + 0.02 + 0.2;
  return r.dur * esticar;
}

/* ---------- a síntese ---------- */

const ruidos = new WeakMap<BaseAudioContext, AudioBuffer>();
function ruido(ctx: BaseAudioContext): AudioBuffer {
  const pronto = ruidos.get(ctx);
  if (pronto) return pronto;
  const n = ctx.sampleRate * 2;
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  ruidos.set(ctx, b);
  return b;
}

const gargantas = new WeakMap<BaseAudioContext, PeriodicWave>();
/** A onda das pregas vocais: todos os harmônicos, caindo uns 12 dB por oitava. */
function garganta(ctx: BaseAudioContext): PeriodicWave {
  const pronta = gargantas.get(ctx);
  if (pronta) return pronta;
  const n = 48;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  /* caindo menos que numa voz cansada: os agudos a mais deixam o som claro e animado */
  for (let k = 1; k < n; k++) im[k] = 1 / Math.pow(k, 1.25);
  const w = ctx.createPeriodicWave(re, im);
  gargantas.set(ctx, w);
  return w;
}

/**
 * A altura da voz: o tom alegre de quem brinca com criança. Começa alto, sobe
 * e fica lá em cima; nunca desce no fim, que é a entonação de quem está
 * triste ou cansado (o primeiro sintetizador descia e soava "pra baixo").
 */
export const F0 = 275;
let f0 = F0;

/** Muda a altura da voz (Hz). Só para testar de fora do jogo. */
export function definirAltura(hz: number): void {
  f0 = hz;
}

function voz(ctx: BaseAudioContext, t: number, dur: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.setPeriodicWave(garganta(ctx));
  o.frequency.setValueAtTime(f0, t);
  o.frequency.linearRampToValueAtTime(f0 * 1.12, t + dur * 0.35);
  o.frequency.linearRampToValueAtTime(f0 * 1.15, t + dur);
  /* um tremor leve, para não soar como apito */
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.8;
  const prof = ctx.createGain();
  prof.gain.value = f0 * 0.018;
  lfo.connect(prof);
  prof.connect(o.frequency);
  lfo.start(t);
  lfo.stop(t + dur + 0.05);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

function envelope(ctx: BaseAudioContext, t: number, dur: number, nivel: number, ataque = 0.05, soltura = 0.12): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(nivel, t + ataque);
  g.gain.setValueAtTime(nivel, Math.max(t + ataque, t + dur - soltura));
  g.gain.linearRampToValueAtTime(0, t + dur);
  return g;
}

/** A boca: três filtros em paralelo, um por formante. Devolve a entrada e os filtros (para escorregar). */
function boca(ctx: BaseAudioContext, f: Formantes, g: Formantes, saida: AudioNode, t: number): { entrada: GainNode; filtros: BiquadFilterNode[]; ganhos: GainNode[] } {
  const entrada = ctx.createGain();
  const larguras = [90, 110, 170];
  const filtros: BiquadFilterNode[] = [];
  const ganhos: GainNode[] = [];
  f.forEach((fr, i) => {
    const b = ctx.createBiquadFilter();
    b.type = 'bandpass';
    b.frequency.setValueAtTime(fr, t);
    b.Q.value = fr / larguras[i]!;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(g[i]!, t);
    entrada.connect(b);
    b.connect(gg);
    gg.connect(saida);
    filtros.push(b);
    ganhos.push(gg);
  });
  return { entrada, filtros, ganhos };
}

/** Os filtros de banda deixam passar pouca energia; este ganho devolve o volume de uma fala normal. */
const GANHO_DA_BOCA = 9;

function vogal(ctx: BaseAudioContext, saida: AudioNode, t: number, dur: number, f: Formantes, g: Formantes, nivel: number, ataque = 0.05): void {
  const env = envelope(ctx, t, dur, nivel * GANHO_DA_BOCA, ataque);
  env.connect(saida);
  const b = boca(ctx, f, g, env, t);
  voz(ctx, t, dur).connect(b.entrada);
}

function soante(ctx: BaseAudioContext, saida: AudioNode, t: number, dur: number, r: Soante): void {
  const env = envelope(ctx, t, dur, r.nivel * GANHO_DA_BOCA);
  const abafa = ctx.createBiquadFilter();
  abafa.type = 'lowpass';
  abafa.frequency.setValueAtTime(r.corte, t);
  abafa.connect(env);
  env.connect(saida);
  const b = boca(ctx, r.f, r.g, abafa, t);
  voz(ctx, t, dur).connect(b.entrada);
  if (r.para) {
    /* segura a consoante um pouco e escorrega para a vogal */
    const ini = t + dur * (r.soltaEm ?? 0.35);
    const fim = ini + dur * 0.2;
    b.filtros.forEach((fl, i) => {
      fl.frequency.setValueAtTime(r.f[i]!, ini);
      fl.frequency.linearRampToValueAtTime(r.para![i]!, fim);
    });
    const alvo: Formantes = [1, 0.55, 0.3];
    b.ganhos.forEach((gg, i) => {
      gg.gain.setValueAtTime(r.g[i]!, ini);
      gg.gain.linearRampToValueAtTime(alvo[i]!, fim);
    });
    abafa.frequency.setValueAtTime(r.corte, ini);
    abafa.frequency.linearRampToValueAtTime(8000, fim);
  }
}

function chiado(ctx: BaseAudioContext, saida: AudioNode, t: number, dur: number, r: Chiado): void {
  const env = envelope(ctx, t, dur, 1, 0.07, 0.14);
  env.connect(saida);
  const src = ctx.createBufferSource();
  src.buffer = ruido(ctx);
  src.loop = true;
  let no: AudioNode = src;
  for (const f of r.filtros) {
    const b = ctx.createBiquadFilter();
    b.type = f.tipo;
    b.frequency.value = f.f;
    b.Q.value = f.q;
    if (f.tipo === 'peaking') b.gain.value = 10;
    no.connect(b);
    no = b;
  }
  const nivel = ctx.createGain();
  nivel.gain.value = r.nivel;
  no.connect(nivel);
  nivel.connect(env);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
  if (r.vozeada) {
    const o = voz(ctx, t, dur);
    /* o chiado pulsa com a garganta, como no Z de verdade */
    const pulso = ctx.createGain();
    pulso.gain.value = r.nivel * 0.45;
    o.connect(pulso);
    pulso.connect(nivel.gain);
    /* e o zumbido grave da garganta, por baixo */
    const zumbido = ctx.createBiquadFilter();
    zumbido.type = 'lowpass';
    zumbido.frequency.value = 450;
    const gz = ctx.createGain();
    gz.gain.value = 0.35;
    o.connect(zumbido);
    zumbido.connect(gz);
    gz.connect(env);
  }
}

function estalo(ctx: BaseAudioContext, saida: AudioNode, t0: number, r: Estalo): void {
  let t = t0;
  if (r.vozeada) {
    /* B, D e G: a garganta zumbe com a boca fechada antes de abrir */
    const env = envelope(ctx, t, 0.07, 0.35, 0.01, 0.01);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    lp.connect(env);
    env.connect(saida);
    voz(ctx, t, 0.07).connect(lp);
    t += 0.06;
  } else t += 0.04;
  /* o estouro */
  const src = ctx.createBufferSource();
  src.buffer = ruido(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = r.estouro;
  bp.Q.value = 1.1;
  const ge = ctx.createGain();
  ge.gain.setValueAtTime(0, t);
  ge.gain.linearRampToValueAtTime(r.vozeada ? 0.9 : 1.4, t + 0.003);
  ge.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
  src.connect(bp);
  bp.connect(ge);
  ge.connect(saida);
  src.start(t, Math.random());
  src.stop(t + 0.05);
  /* P, T e C sopram um pouquinho antes da vogal */
  const sopro = r.vozeada ? 0.005 : 0.02;
  if (!r.vozeada) {
    const s2 = ctx.createBufferSource();
    s2.buffer = ruido(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 1800;
    hp.Q.value = 0.5;
    const gs = envelope(ctx, t + 0.005, 0.04, 0.25, 0.005, 0.02);
    s2.connect(hp);
    hp.connect(gs);
    gs.connect(saida);
    s2.start(t, Math.random());
    s2.stop(t + 0.06);
  }
  /* o "â" curtinho que deixa ouvir o estalo, caindo rápido */
  vogal(ctx, saida, t + sopro, 0.2 - sopro + 0.02, APOIO, [1, 0.45, 0.2], 0.8, 0.015);
}

/**
 * O volume de cada som, medido: renderizado sem este ajuste, o M saía dez
 * vezes mais alto que o F. Com ele, as vogais ficam um pouco à frente, as
 * consoantes que se seguram logo atrás e F e R (que são sopro) mais baixos,
 * como na fala. Refazer a medida quando mudar uma receita (scripts/fonemas.mjs).
 */
const VOLUME: Record<string, number> = { som_a: 0.215, som_e: 0.119, som_e2: 0.135, som_i: 0.042, som_o: 0.102, som_o2: 0.129, som_u: 0.051, som_m: 0.026, som_n: 0.029, som_l: 0.039, som_lh: 0.046, som_nh: 0.036, som_s: 0.244, som_z: 0.283, som_x: 0.537, som_j: 0.395, som_f: 0.538, som_v: 0.427, som_r: 0.56, som_p: 0.176, som_b: 0.17, som_t: 0.175, som_d: 0.17, som_c: 0.176, som_g: 0.17 };

/**
 * Agenda o som `id` no contexto, começando em `t`, e devolve quanto dura.
 * Serve para o contexto do jogo e para um OfflineAudioContext (testes e
 * para ouvir fora do jogo).
 */
export function sintetizarSom(ctx: BaseAudioContext, saida: AudioNode, id: string, t: number, esticar = 1): number {
  const r = RECEITAS[id];
  if (!r) return 0;
  const dur = duracaoDoSom(id, esticar);
  const vol = ctx.createGain();
  vol.gain.value = VOLUME[id] ?? 0.1;
  vol.connect(saida);
  saida = vol;
  if (r.tipo === 'vogal') vogal(ctx, saida, t, dur, r.f, r.g ?? [1, 0.5, 0.25], 1);
  else if (r.tipo === 'soante') soante(ctx, saida, t, dur, r);
  else if (r.tipo === 'chiado') chiado(ctx, saida, t, dur, r);
  else estalo(ctx, saida, t, r);
  return dur;
}

