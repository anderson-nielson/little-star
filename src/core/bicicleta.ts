import rotasJson from '@/data/rotas.json';
import type { Estado } from './estado';

/**
 * A bicicletinha: o passeio pelo condomínio, em rotas. É o motor puro, sem
 * DOM: o chão (uma soma de morrinhos em cosseno), a velocidade com inércia
 * (o chão puxa para um ritmo, o morro pesa, a pedalada soma e a freada tira),
 * o pulo do Jardim, as coisas do chão e a progressão lenta. O que a tela faz
 * é desenhar e ouvir o toque. As rotas moram em `src/data/rotas.json`.
 */

/** As coisas do chão. Cada uma pede um gesto e responde de um jeito se ele não vier; nada dói. */
export type TipoDeCoisa = 'lombada' | 'poca' | 'rampa' | 'tronco' | 'gamba' | 'galho' | 'morro' | 'pedregulho' | 'areia' | 'ponte';
/** As que se pula por cima (o pulo procura estas). A poça fica de fora: passar direto é a deslizada. */
export const PULAVEIS: TipoDeCoisa[] = ['lombada', 'tronco', 'gamba'];
/** As que são trecho de chão, não uma coisa num ponto. */
export const TRECHOS: TipoDeCoisa[] = ['pedregulho', 'areia', 'ponte'];
export type Gesto = 'pular' | 'acelerar' | 'frear' | 'abaixar';
export type Enfeite = 'cestinha' | 'bandeirinha' | 'fitas' | 'campainha' | 'buzina';

export interface Rota {
  id: string;
  nome: string;
  destino: string;
  quem: 'mae' | 'pai' | 'irmao' | 'familia';
  ceu: 'dia' | 'tarde' | 'muda';
  fundo: string;
  musica: string;
  /** [tipo, passeio bom em que entra] */
  kit: [TipoDeCoisa, number][];
  /** gesto -> passeio bom em que entra; pular entra sempre */
  gestos: Partial<Record<Gesto, number>>;
  enfeite: Enfeite;
  /** quantas coisas do chão na ida (e as mesmas na volta) */
  obstaculos: number;
}

const DADOS = rotasJson as unknown as { abreCom: number; rotas: Rota[] };
export const ROTAS: Rota[] = DADOS.rotas;
export const ROTA_ABRE_COM = DADOS.abreCom;

export function rota(id: string): Rota {
  return ROTAS.find((r) => r.id === id) ?? ROTAS[0]!;
}

/** Dados do balanceamento. Tudo que a criança sente está aqui. */
export const BICICLETA = {
  /** velocidade de base, em larguras de tela por segundo (a mesma do Jardim) */
  velocidade: 0.24,
  /** cada passeio bom deixa a rota mais rápida nesta fração, até o teto */
  ritmo: 0.04,
  ritmoTeto: 0.3,
  /** um obstáculo a cada tantos compassos, por degrau de passeios bons */
  degraus: [0, 3, 6],
  compassosPorObstaculo: [4, 3, 2],
  /** um compasso de caminhada, em segundos (a música muda; o espaço não). Com 4 por coisa, é o espaço das primeiras vezes do Jardim */
  compasso: 1.8,
  /** o pulo procura o obstáculo: um toque até tantos segundos antes estica o pulo até passar */
  janelaDoPulo: 0.7,
  duracaoDoPulo: 0.75,
  /** a altura do pulo, em fração da altura da tela */
  alturaDoPulo: 0.11,
  /** a parada: esperar o gambá, passar a bicicleta por cima do tronco, em segundos */
  parada: 1.6,
  /** a pedalada com força soma esta fração da base de uma vez */
  pedalada: 0.55,
  /** freando, o chão puxa para esta fração da base, por `freioDura` segundos */
  freio: 0.3,
  freioDura: 0.9,
  /** quanto a subida pesa e a descida empurra (por unidade de inclinação, por segundo, em frações da base) */
  gravidade: 0.95,
  /** sem nenhum toque ela nunca para nem dispara */
  minimo: 0.3,
  maximo: 2.0,
  /** chegando na crista mais rápido que isto (vezes a base), ela decola */
  decolagem: 1.25,
  /** quanto tempo a inércia leva para o chão puxar a velocidade de volta */
  inercia: 0.9,
  /** a deslizada na poça: a aceleradinha e quanto dura */
  deslizada: 0.7,
  deslizaDura: 0.7,
  /** abaixada, em segundos */
  abaixaDura: 0.9,
  /** a A2 entra depois de tantas coisas seguidas sem o gesto; a A1, depois de duas */
  errosParaA1: 2,
  errosParaA2: 4,
  /** a rede de segurança: mesmo sem nenhum toque, a ida e a volta acabam antes disto, em segundos */
  duracaoMaxima: 240,
  /** a altura da menina, em fração da altura da tela (com a bicicleta) */
  alturaDaMenina: 0.16,
};

/* ---------- a progressão ---------- */

/** O ritmo da rota depois de `n` passeios bons: um pouquinho mais rápido a cada um, com teto. */
export function ritmoDaRota(n: number): number {
  return 1 + Math.min(Math.max(0, n) * BICICLETA.ritmo, BICICLETA.ritmoTeto);
}

/** Um obstáculo a cada tantos compassos, pelo degrau de passeios bons. */
export function cadaDaRota(n: number): number {
  let i = 0;
  BICICLETA.degraus.forEach((d, k) => {
    if (n >= d) i = k;
  });
  return BICICLETA.compassosPorObstaculo[i]!;
}

/** O que aparece no caminho depois de `n` passeios bons. */
export function kitDaRota(r: Rota, n: number): TipoDeCoisa[] {
  return r.kit.filter(([, entra]) => n >= entra).map(([t]) => t);
}

/** Os gestos que já entraram: pular sempre; os outros, cada um com a coisa que dá motivo. */
export function gestosDaRota(r: Rota, n: number): Record<Gesto, boolean> {
  const g: Record<Gesto, boolean> = { pular: true, acelerar: false, frear: false, abaixar: false };
  for (const [k, entra] of Object.entries(r.gestos) as [Gesto, number][]) if (n >= entra) g[k] = true;
  return g;
}

/** O estado da bicicleta no save. */
export interface EstadoDaBicicleta {
  /** passeios completos por rota (ida e volta) */
  passeios: Record<string, number>;
  /** passeios bons por rota: ela passou sozinha pelo menos metade das coisas; sobe e desce */
  bons: Record<string, number>;
  /** os enfeites que a bicicleta já ganhou, um por rota (`Enfeite`; no save é texto) */
  enfeites: string[];
}

export function bicicletaVazia(): EstadoDaBicicleta {
  return { passeios: {}, bons: {}, enfeites: [] };
}

/** As rotas abertas: a primeira sempre; cada uma abre depois de tantos passeios completos na anterior. */
export function rotasAbertas(b: EstadoDaBicicleta): Rota[] {
  const abertas: Rota[] = [];
  for (let i = 0; i < ROTAS.length; i++) {
    const r = ROTAS[i]!;
    if (i === 0) abertas.push(r);
    else if ((b.passeios[ROTAS[i - 1]!.id] ?? 0) >= ROTA_ABRE_COM) abertas.push(r);
    else break;
  }
  return abertas;
}

/** A rota que brilha hoje: a nova primeiro; depois se revezam. */
export function rotaDoDia(b: EstadoDaBicicleta): Rota {
  const abertas = rotasAbertas(b);
  const nova = abertas.find((r) => !(b.passeios[r.id] ?? 0));
  if (nova) return nova;
  const total = Object.values(b.passeios).reduce((a, x) => a + x, 0);
  return abertas[total % abertas.length]!;
}

/** Um passeio foi bom quando ela passou sozinha pelo menos metade das coisas que pediam gesto. */
export function passeioBom(sozinha: number, pediram: number): boolean {
  return pediram === 0 || sozinha * 2 >= pediram;
}

/**
 * Depois de um passeio completo: conta o passeio; um bom sobe um degrau, um em
 * que a A2 entrou duas vezes desce um (nunca abaixo de zero); a primeira
 * chegada da rota dá o enfeite. Devolve o enfeite novo, se houver. Muda o
 * estado no lugar, dentro de `mudar()`.
 */
export function depoisDoPasseio(b: EstadoDaBicicleta, r: Rota, bom: boolean, a2Vezes: number): Enfeite | null {
  b.passeios[r.id] = (b.passeios[r.id] ?? 0) + 1;
  const n = b.bons[r.id] ?? 0;
  if (a2Vezes >= 2) b.bons[r.id] = Math.max(0, n - 1);
  else if (bom) b.bons[r.id] = n + 1;
  if (!b.enfeites.includes(r.enfeite)) {
    b.enfeites.push(r.enfeite);
    return r.enfeite;
  }
  return null;
}

/* ---------- o chão ---------- */

export interface Morro {
  /** a crista, em larguras de tela desde a casa */
  x: number;
  /** a altura, em fração da altura da tela */
  h: number;
  /** meia largura da subida e da descida, em larguras de tela */
  subida: number;
  descida: number;
  /** a descida grande, no fim da rota */
  grande?: boolean;
}

/** A altura do chão em `x` (larguras de tela): negativo é para cima. Uma soma de morrinhos em cosseno. */
export function alturaChao(morros: Morro[], x: number): number {
  let y = 0;
  for (const m of morros) {
    const d = x - m.x;
    const w = d < 0 ? m.subida : m.descida;
    if (Math.abs(d) < w) y -= m.h * (0.5 + 0.5 * Math.cos((Math.PI * d) / w));
  }
  return y;
}

/**
 * A inclinação em `x`, no sentido da ida: positivo é descida (o chão desce
 * para a frente), negativo é subida. Em unidades de altura por largura de tela.
 */
export function inclinacao(morros: Morro[], x: number, sentido: 1 | -1 = 1): number {
  const dx = 0.01;
  /* a altura é negativa para cima: subindo, ela fica mais negativa à frente (inclinação negativa) */
  return (alturaChao(morros, x + dx * sentido) - alturaChao(morros, x - dx * sentido)) / (2 * dx);
}

/* ---------- o caminho ---------- */

export interface Coisa {
  /** onde, em larguras de tela desde a casa */
  x: number;
  tipo: TipoDeCoisa;
  /** a primeira desta rota neste passeio: a mãozinha mostra o gesto */
  nova: boolean;
}

export interface Trecho {
  x0: number;
  x1: number;
  tipo: TipoDeCoisa;
}

export interface Passeio {
  coisas: Coisa[];
  morros: Morro[];
  trechos: Trecho[];
  /** onde fica o destino, em larguras de tela */
  fim: number;
}

/** meia largura de um trecho de pedregulhos, areia ou ponte, em larguras de tela */
export const MEIO_TRECHO = 0.18;

/**
 * Monta o caminho de uma rota para o passeio de número `n` (passeios bons):
 * as coisas do chão espaçadas em compassos, as cadeias de morrinhos (três, cada
 * um mais alto, e a descida grande no fim), os trechos. `sorteio` devolve
 * números em [0, 1) para o espaço variar um pouco; nos testes é fixo.
 */
export function montarPasseio(r: Rota, n: number, sorteio: () => number = Math.random): Passeio {
  const kit = kitDaRota(r, n);
  const cada = cadaDaRota(n);
  const v0 = BICICLETA.velocidade * ritmoDaRota(n);
  const espaco = cada * BICICLETA.compasso * v0;
  const coisas: Coisa[] = [];
  const morros: Morro[] = [];
  const trechos: Trecho[] = [];
  const vistas = new Set<TipoDeCoisa>();
  let x = 2 * BICICLETA.compasso * v0 + 0.6;
  let cadeias = 0;
  const cadeiasMax = r.id === 'morrinhos' ? 3 : 1;
  for (let i = 0; i < r.obstaculos; i++) {
    let tipo = kit[i % kit.length]!;
    if (i >= 2 && n >= 6 && sorteio() < 0.5) tipo = kit[Math.floor(sorteio() * kit.length)]!;
    if (tipo === 'morro' && cadeias >= cadeiasMax) tipo = kit.find((k) => k !== 'morro') ?? 'lombada';
    const nova = !vistas.has(tipo);
    vistas.add(tipo);
    if (tipo === 'morro') {
      cadeias++;
      coisas.push({ x, tipo, nova });
      /* a cadeia: morrinho após morrinho, cada um mais alto; a última acaba na descida grande */
      const ultima = cadeias === cadeiasMax;
      let mx = x + 0.25;
      [0.05, 0.075, 0.105].forEach((h, k) => {
        const w = 0.23 + k * 0.03;
        morros.push({ x: mx, h, subida: w, descida: w });
        mx += 2 * w + 0.03;
      });
      if (ultima) {
        morros.push({ x: mx + 0.1, h: 0.15, subida: 0.33, descida: 1.1, grande: true });
        mx += 0.1 + 0.33 + 1.1;
      }
      x = mx + 0.35;
      continue;
    }
    coisas.push({ x, tipo, nova });
    if (TRECHOS.includes(tipo)) trechos.push({ x0: x - MEIO_TRECHO, x1: x + MEIO_TRECHO, tipo });
    x += espaco * (0.85 + sorteio() * 0.3);
  }
  return { coisas, morros, trechos, fim: x + 0.7 };
}

/* ---------- a velocidade ---------- */

export interface Chao {
  /** a inclinação no sentido em que ela anda (positivo é descida) */
  inclinacao: number;
  trecho: TipoDeCoisa | null;
  freando: boolean;
  deslizando: boolean;
  noAr: boolean;
  parada: boolean;
}

/**
 * Um passo da velocidade (em vezes a base): o chão puxa para o alvo com
 * inércia, o morro pesa ou empurra, e os limites seguram. Parada é zero.
 * A pedalada e a freada vêm de fora (`pedalar`, `frear`).
 */
export function passoDeVelocidade(v: number, c: Chao, dt: number): number {
  if (c.parada) return 0;
  let alvo = 1;
  if (c.trecho === 'pedregulho') alvo = 0.85;
  if (c.trecho === 'areia') alvo = 0.5;
  if (c.freando) alvo = BICICLETA.freio;
  let nv = v;
  if (!c.noAr && !c.deslizando) {
    nv += (alvo - nv) * (1 - Math.exp(-dt / (c.freando ? 0.25 : BICICLETA.inercia)));
    nv += c.inclinacao * BICICLETA.gravidade * dt;
  }
  return Math.max(BICICLETA.minimo, Math.min(BICICLETA.maximo, nv));
}

/** A pedalada com força: soma de uma vez, até o máximo. */
export function pedalar(v: number): number {
  return Math.min(v + BICICLETA.pedalada, BICICLETA.maximo);
}

/** A deslizada na poça: uma aceleradinha. */
export function deslizar(v: number): number {
  return Math.min(v + BICICLETA.deslizada, BICICLETA.maximo);
}

/** Na crista, rápido assim ela decola: a altura do voo em fração da tela (0 é não decolar). */
export function decolagem(v: number): number {
  if (v <= BICICLETA.decolagem) return 0;
  return 0.04 + (v - BICICLETA.decolagem) * 0.16;
}

/** O voo na rampinha: quanto mais rápido chega, mais alto. Um giro quando é alto de verdade. */
export function vooDaRampa(v: number): { h: number; giro: boolean } {
  const h = 0.05 + Math.max(0, v - 1) * 0.19;
  return { h, giro: h >= 0.15 };
}

/* ---------- o pulo ---------- */

export interface Pulo {
  inicio: number;
  fim: number;
  /** altura, em fração da altura da tela */
  h: number;
  giro?: boolean;
  /** devagar: passar a bicicleta por cima do tronco; não conta como estar no ar */
  lento?: boolean;
}

/** A altura do pulo no instante `t`, em fração da tela: uma parábola. */
export function alturaDoPulo(p: Pulo | null, t: number): number {
  if (!p || t < p.inicio || t > p.fim) return 0;
  const k = (t - p.inicio) / (p.fim - p.inicio);
  return p.h * 4 * k * (1 - k);
}

/** Está mesmo no ar? O pulinho da campainha e o "tum" da lombadinha não contam como passar por cima. */
export function noAr(p: Pulo | null, t: number): boolean {
  return !!p && !p.lento && alturaDoPulo(p, t) > 0.028;
}

/**
 * O pulo sai na hora do toque. Se uma coisa pulável chega em até `janela`
 * segundos, o pulo estica até ela passar. Devolve o pulo.
 */
export function pularPara(agora: number, ateCoisa: number | null, v: number): Pulo {
  const dur = ateCoisa === null ? 0.55 : Math.min(1.3, Math.max(BICICLETA.duracaoDoPulo, ateCoisa + 0.5 / Math.max(0.3, v)));
  return { inicio: agora, fim: agora + dur, h: ateCoisa === null ? 0.07 : BICICLETA.alturaDoPulo };
}

/**
 * Quanto dura a ida e a volta sem nenhum toque: ela anda perto da base (as
 * subidas seguram um pouco, as descidas devolvem), para no tronco e no gambá,
 * e a chegada leva uns segundos. Serve para a rede de segurança ter folga.
 */
export function duracaoEstimada(p: Passeio, ritmo: number): number {
  const v = BICICLETA.velocidade * ritmo * 0.85;
  const paradas = p.coisas.filter((c) => c.tipo === 'tronco' || c.tipo === 'gamba').length;
  return (2 * p.fim) / v + 2 * paradas * BICICLETA.parada + 8;
}

/** Quantos passeios bons uma rota já tem, no estado. */
export function bonsDe(e: Estado, id: string): number {
  return e.bicicleta.bons[id] ?? 0;
}
