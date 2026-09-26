/**
 * O parquinho do condomínio, a parte pura: o balanço como pêndulo e a
 * gangorra como tábua que sobe e desce. Sem DOM, sem áudio; as telas em
 * `src/telas/parquinho.ts` desenham e tocam.
 *
 * O balanço: seno e amortecimento, período de 2,4 s (quatro tempos a 100
 * bpm), perde metade da altura em uns oito ciclos. O impulso é dela: cada
 * toque estica as pernas a favor do movimento, e vale mais perto do ponto
 * mais baixo, que é como se ganha altura num balanço de verdade. Não existe
 * toque errado.
 */
export interface Balanco {
  /** ângulo da corda, em radianos; positivo é para a frente */
  th: number;
  /** velocidade angular, rad/s */
  om: number;
}

export const PERIODO = 2.4;
export const OMEGA = (2 * Math.PI) / PERIODO;
export const AMORTECIMENTO = 0.016;
/** a velocidade máxima que o impulso dela alcança (uns 0,88 rad de altura) */
export const OMEGA_MAX = 2.3;
/** até onde o arrasto leva o balanço */
export const ANGULO_MAX = 0.9;
/** abaixo disso o balanço parou */
export const PARADO = 0.03;
/** o impulso das pernas, na velocidade */
export const IMPULSO = 0.85;
/** só uma ida com o balanço alto conta uma pedrinha */
export const AMPLITUDE_PARA_CONTAR = 0.15;
/** ela já conta até dez no balanço de verdade */
export const CONTA_ATE = 10;
/** com o balanço assim de alto o Theo bate palma */
export const AMPLITUDE_ALTA = 0.55;

export function novoBalanco(): Balanco {
  return { th: 0, om: 0 };
}

/** A altura do balanço: o ângulo máximo que ele alcança neste ciclo. */
export function amplitude(b: Balanco): number {
  return Math.hypot(b.th, b.om / OMEGA);
}

/**
 * Um passo de `dt` segundos. Devolve por onde o balanço cruzou o ponto mais
 * baixo: 1 indo para a frente, -1 voltando, 0 se não cruzou.
 */
export function passo(b: Balanco, dt: number): 1 | -1 | 0 {
  const antes = b.th;
  const acc = -OMEGA * OMEGA * Math.sin(b.th) - 2 * AMORTECIMENTO * OMEGA * b.om;
  b.om += acc * dt;
  b.th += b.om * dt;
  if (Math.abs(b.th) < 0.002 && Math.abs(b.om) < 0.005) {
    b.th = 0;
    b.om = 0;
  }
  if (antes !== 0 && b.th !== 0 && Math.sign(b.th) !== Math.sign(antes) && amplitude(b) > PARADO) return b.th > 0 ? 1 : -1;
  return 0;
}

/**
 * O impulso dela: sempre a favor do movimento (parado, para a frente), e
 * vale mais perto do chão. Devolve o fator do impulso, de 0,5 a 1,2.
 */
export function impulso(b: Balanco): number {
  const amp = amplitude(b);
  const dir = b.om !== 0 ? Math.sign(b.om) : b.th !== 0 ? -Math.sign(b.th) : 1;
  const fator = amp > 0.02 ? 0.5 + 0.7 * Math.max(0, 1 - Math.abs(b.th) / amp) : 1;
  b.om = limitar(b, b.om + dir * IMPULSO * fator);
  return fator;
}

/**
 * A velocidade que cabe aqui: a energia nunca passa da que OMEGA_MAX teria no
 * ponto mais baixo, então a altura tem teto em qualquer ângulo, e não só
 * quando o impulso vem embaixo.
 */
function limitar(b: Balanco, om: number): number {
  const sobra = OMEGA_MAX * OMEGA_MAX - 2 * OMEGA * OMEGA * (1 - Math.cos(b.th));
  const teto = Math.sqrt(Math.max(0, sobra));
  return Math.max(-teto, Math.min(teto, om));
}

/** O dedo leva o balanço: um ângulo a partir de onde ele toca, limitado. */
export function anguloDoDedo(dx: number, dy: number): number {
  return Math.max(-ANGULO_MAX, Math.min(ANGULO_MAX, Math.atan2(dx, Math.max(60, dy))));
}

/** Soltou: a velocidade do arrasto vira a do balanço, limitada. */
export function soltar(b: Balanco, velocidade: number): void {
  b.om = limitar(b, velocidade);
}

export function parado(b: Balanco): boolean {
  return amplitude(b) < PARADO;
}

/* ---------- a gangorra ---------- */

/**
 * A gangorra: ela numa ponta, o Theo de pé na outra segurando a tábua. Só o
 * pé no chão faz subir; lá em cima ela fica um instante e desce devagar,
 * porque ele segura. Nunca bate no chão.
 */
export interface Gangorra {
  /** ângulo da tábua; positivo é o lado dela para cima */
  th: number;
  om: number;
}

export const GANGORRA_MAX = 0.3;
const GANGORRA_OMEGA = 2.4;
const GANGORRA_AMORTECIMENTO = 0.12;
/** o Theo segurando a tábua na descida: quase crítico, nunca bate */
const GANGORRA_SEGURA = 1.3;
export const EMPURRAO = 2.6;

export function novaGangorra(): Gangorra {
  return { th: -GANGORRA_MAX, om: 0 };
}

export function peNoChao(g: Gangorra): boolean {
  return g.th <= -GANGORRA_MAX + 0.02;
}

/** Ela empurra o chão com o pé: só vale com o pé no chão. */
export function empurrar(g: Gangorra): boolean {
  if (!peNoChao(g)) return false;
  g.om = EMPURRAO;
  return true;
}

/** Um passo. Devolve true no instante em que o lado dela volta ao chão. */
export function passoGangorra(g: Gangorra, dt: number): boolean {
  /* o lado dela é o pesado: descansa no chão. Descendo, o Theo segura: a descida é macia. */
  const segurando = g.om < 0 && g.th < 0 ? GANGORRA_SEGURA : GANGORRA_AMORTECIMENTO;
  const acc = -GANGORRA_OMEGA * GANGORRA_OMEGA * (g.th + GANGORRA_MAX * 1.15) - 2 * segurando * GANGORRA_OMEGA * g.om;
  g.om += acc * dt;
  g.th += g.om * dt;
  if (g.th > GANGORRA_MAX) {
    g.th = GANGORRA_MAX;
    g.om = Math.min(0, g.om) * 0.2;
  }
  if (g.th < -GANGORRA_MAX) {
    g.th = -GANGORRA_MAX;
    const pousou = g.om < -0.3;
    g.om = 0;
    return pousou;
  }
  return false;
}
