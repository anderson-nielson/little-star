/**
 * A fita do Ponta, aqui como o traço da letra: uma polilinha com comprimento
 * acumulado, projeção do dedo com busca local e monotônica, e o ponto de agarre.
 * Coordenadas normalizadas de 0 a 1 na caixa da letra.
 */
export type Ponto = [number, number];

export interface Fita {
  pontos: Ponto[];
  acumulado: number[];
  comprimento: number;
}

const dist = (a: Ponto, b: Ponto): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function fitaDePontos(pontos: Ponto[]): Fita {
  const acumulado = [0];
  for (let i = 1; i < pontos.length; i++) acumulado.push(acumulado[i - 1]! + dist(pontos[i - 1]!, pontos[i]!));
  return { pontos, acumulado, comprimento: acumulado[acumulado.length - 1] ?? 0 };
}

export function pontoEm(f: Fita, u: number): Ponto {
  const alvo = Math.max(0, Math.min(1, u)) * f.comprimento;
  if (f.pontos.length === 0) return [0.5, 0.5];
  let i = 1;
  while (i < f.acumulado.length && f.acumulado[i]! < alvo) i++;
  const a = f.pontos[i - 1]!;
  const b = f.pontos[Math.min(i, f.pontos.length - 1)]!;
  const d0 = f.acumulado[i - 1]!;
  const d1 = f.acumulado[Math.min(i, f.acumulado.length - 1)]!;
  const k = d1 > d0 ? (alvo - d0) / (d1 - d0) : 0;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

export interface Projecao {
  u: number;
  distancia: number;
}

/** Onde o dedo está ao longo da fita, sem saltar para trás mais que `recuoMax`. */
export function projetar(f: Fita, dedo: Ponto, uAnterior: number, recuoMax = 0.08, avancoMax = Infinity): Projecao {
  if (f.pontos.length < 2) return { u: uAnterior, distancia: 1 };
  const uMin = Math.max(0, uAnterior - recuoMax);
  const uMax = uAnterior + avancoMax;
  let melhorU = uMin;
  let melhorD = Infinity;
  for (let i = 1; i < f.pontos.length; i++) {
    const a = f.pontos[i - 1]!;
    const b = f.pontos[i]!;
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const len2 = vx * vx + vy * vy;
    const len = Math.sqrt(len2);
    const kMin = len > 0 && f.comprimento > 0 ? Math.max(0, (uMin * f.comprimento - f.acumulado[i - 1]!) / len) : 0;
    const kMax = len > 0 && f.comprimento > 0 ? Math.min(1, (uMax * f.comprimento - f.acumulado[i - 1]!) / len) : 1;
    if (kMin > kMax) continue;
    const kLivre = len2 > 0 ? ((dedo[0] - a[0]) * vx + (dedo[1] - a[1]) * vy) / len2 : 0;
    const k = Math.max(kMin, Math.min(kMax, kLivre));
    const proj: Ponto = [a[0] + vx * k, a[1] + vy * k];
    const u = f.comprimento > 0 ? (f.acumulado[i - 1]! + dist(a, proj)) / f.comprimento : 0;
    const d = dist(dedo, proj);
    if (d < melhorD) {
      melhorD = d;
      melhorU = u;
    }
  }
  return { u: melhorU, distancia: melhorD === Infinity ? 1 : melhorD };
}

/* ---------- os traços das letras, de dados para pontos ---------- */

export type TracoDado = Ponto[] | ['circulo', number, number, number] | ['curva', ...Ponto[]];

function bezier(p0: Ponto, p1: Ponto, p2: Ponto, p3: Ponto, n = 16): Ponto[] {
  const out: Ponto[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    const w = [m * m * m, 3 * m * m * t, 3 * m * t * t, t * t * t];
    out.push([w[0]! * p0[0] + w[1]! * p1[0] + w[2]! * p2[0] + w[3]! * p3[0], w[0]! * p0[1] + w[1]! * p1[1] + w[2]! * p2[1] + w[3]! * p3[1]]);
  }
  return out;
}

/** Expande um traço dos dados em pontos. O círculo começa em cima e vai para a esquerda (anti-horário). */
export function pontosDoTraco(t: TracoDado): Ponto[] {
  if (t[0] === 'circulo') {
    const [, cx, cy, r] = t as ['circulo', number, number, number];
    const out: Ponto[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI / 2 - (i / 40) * Math.PI * 2;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  if (t[0] === 'curva') {
    const ps = (t as ['curva', ...Ponto[]]).slice(1) as Ponto[];
    const out: Ponto[] = [];
    for (let i = 0; i + 3 < ps.length; i += 3) {
      const seg = bezier(ps[i]!, ps[i + 1]!, ps[i + 2]!, ps[i + 3]!);
      out.push(...(i ? seg.slice(1) : seg));
    }
    return out;
  }
  const reto = t as Ponto[];
  /* segmentos retos ganham pontos intermediários para a projeção ficar suave */
  const out: Ponto[] = [];
  for (let i = 0; i + 1 < reto.length; i++) {
    const a = reto[i]!;
    const b = reto[i + 1]!;
    for (let k = 0; k <= 12; k++) {
      if (i > 0 && k === 0) continue;
      out.push([a[0] + ((b[0] - a[0]) * k) / 12, a[1] + ((b[1] - a[1]) * k) / 12]);
    }
  }
  return out;
}

/** A forma manda, a precisão não: a partir daqui o traço conta como inteiro. Numa
 * letra fechada (o O), o fim é o começo, e o dedo ao lado do caminho projeta
 * um pouco atrás; 95% é o que uma mão de 5 anos alcança. */
export const LIMIAR_DE_TRACO_PRONTO = 0.95;

/**
 * O traçado de uma letra, traço a traço. `avancar` recebe o dedo e devolve
 * quanto da fita atual encheu. Tolerância larga; a forma manda.
 */
export class Tracado {
  fitas: Fita[];
  traco = 0;
  /** quanto de cada traço encheu, 0 a 1 */
  cheio: number[];
  private uDedo = 0;
  private agarrou = false;

  constructor(
    tracos: TracoDado[],
    /** distância máxima do dedo à fita, na caixa 0..1 */
    readonly tolerancia = 0.12,
  ) {
    this.fitas = tracos.map((t) => fitaDePontos(pontosDoTraco(t)));
    this.cheio = this.fitas.map(() => 0);
  }

  get fita(): Fita {
    return this.fitas[this.traco]!;
  }
  get completa(): boolean {
    return this.traco >= this.fitas.length;
  }

  /** O dedo encostou: agarra a fita se estiver perto do começo ou de onde parou. */
  comecar(dedo: Ponto): boolean {
    if (this.completa) return false;
    const u0 = this.cheio[this.traco]!;
    const alvo = pontoEm(this.fita, u0);
    const d = Math.hypot(alvo[0] - dedo[0], alvo[1] - dedo[1]);
    /* agarra perto de onde parou, ou em qualquer ponto já cheio (voltar não apaga) */
    const pr = projetar(this.fita, dedo, 0);
    this.agarrou = d <= this.tolerancia || (pr.distancia <= this.tolerancia && pr.u <= u0 + 0.05);
    this.uDedo = this.agarrou ? Math.min(u0, Math.max(pr.u, 0)) : 0;
    return this.agarrou;
  }

  /**
   * O dedo se moveu. `generoso` (ajuda A2): a fita enche seguindo o dedo em
   * qualquer direção, e a projeção pode andar para trás.
   */
  mover(dedo: Ponto, generoso = false): number {
    if (this.completa) return 1;
    if (!this.agarrou) {
      /* na ajuda A2 o dedo não precisa agarrar: qualquer movimento conta */
      if (generoso) this.agarrou = true;
      else if (!this.comecar(dedo)) return this.cheio[this.traco]!;
    }
    const pr = projetar(this.fita, dedo, this.uDedo, generoso ? 1 : 0.08, generoso ? 1 : 0.2);
    if (pr.distancia <= this.tolerancia * (generoso ? 2.5 : 1)) {
      this.uDedo = pr.u;
      this.cheio[this.traco] = Math.max(this.cheio[this.traco]!, pr.u);
    } else if (generoso) {
      /* longe da fita, mas ainda mexendo: anda devagar mesmo assim */
      this.uDedo = Math.min(1, this.uDedo + 0.01);
      this.cheio[this.traco] = Math.max(this.cheio[this.traco]!, this.uDedo);
    }
    if (this.cheio[this.traco]! >= LIMIAR_DE_TRACO_PRONTO) {
      this.cheio[this.traco] = 1;
      this.traco += 1;
      this.agarrou = false;
      this.uDedo = 0;
      return 1;
    }
    return this.cheio[this.traco]!;
  }

  /** Tirar o dedo não apaga nada. */
  soltar(): void {
    this.agarrou = false;
  }

  /** A ajuda A2 anda um pouco sozinha a partir de onde está. */
  empurrar(quanto = 0.05): void {
    if (this.completa) return;
    this.cheio[this.traco] = Math.min(1, this.cheio[this.traco]! + quanto);
    if (this.cheio[this.traco]! >= LIMIAR_DE_TRACO_PRONTO) {
      this.cheio[this.traco] = 1;
      this.traco += 1;
      this.agarrou = false;
      this.uDedo = 0;
    }
  }
}
