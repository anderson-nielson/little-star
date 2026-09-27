import type { Estado } from './estado';
import { marcarBrincada } from './laco';

/**
 * Os cuidados: arrumar a cama, escovar os dentes e guardar os brinquedos, cada
 * um numa tela, passo a passo. A roda pergunta se ela fez de verdade; aqui ela
 * treina o jeito de fazer. Três coisas cada tela ensina sem dizer:
 *
 * - a ordem: um quadro de passos no alto, com um desenho por passo, e só o
 *   passo da vez responde de verdade;
 * - o como: cada passo tem um gesto que parece o de verdade (esticar, puxar,
 *   esfregar devagar, levar até o lugar);
 * - a paciência de ir até o fim: o que foi feito fica feito, o que escorregou
 *   volta devagar para ela tentar de novo, e no fim a cena mostra o resultado
 *   bonito com calma.
 *
 * Puro e sem DOM: as regras moram aqui para serem testadas.
 */
export type Cuidado = 'cama' | 'dentes' | 'brinquedos';
export const CUIDADOS: Cuidado[] = ['cama', 'dentes', 'brinquedos'];

/** Os passos de cada cuidado, na ordem em que se faz de verdade. */
export const PASSOS = {
  /* tira o que está em cima, estica o lençol, puxa a coberta, afofa o travesseiro, os bichinhos voltam */
  cama: ['tirar', 'lencol', 'coberta', 'travesseiro', 'bichinhos'],
  /* molha a escova, um pouquinho de pasta, os de cima, a língua, os de baixo, enxágua, guarda */
  dentes: ['molhar', 'pasta', 'cima', 'lingua', 'baixo', 'enxaguar', 'guardar'],
} as const;

export type PassoDaCama = (typeof PASSOS.cama)[number];
export type PassoDosDentes = (typeof PASSOS.dentes)[number];

/* ---------- arrastar e puxar ---------- */

/** Soltou passando desta fração do caminho: a coisa vai sozinha o resto (GAMEPLAY, seção 1). */
export const FRACAO_QUE_BASTA = 0.4;

/** Quanto do caminho de `origem` até `destino` a coisa já andou, soltando em `solto`. De 0 a 1. */
export function fracaoDoCaminho(origem: [number, number], destino: [number, number], solto: [number, number]): number {
  const total = Math.hypot(destino[0] - origem[0], destino[1] - origem[1]);
  if (total === 0) return 1;
  /* a projeção no caminho: andar de lado não conta, só andar na direção certa */
  const px = (solto[0] - origem[0]) * (destino[0] - origem[0]) + (solto[1] - origem[1]) * (destino[1] - origem[1]);
  return Math.max(0, Math.min(1, px / (total * total)));
}

export function foiLongeOBastante(fracao: number): boolean {
  return fracao >= FRACAO_QUE_BASTA;
}

/* ---------- a cama ---------- */

/**
 * As rugas do lençol: cada uma é uma linha em pé, numa posição x. O dedo
 * passando de `xa` para `xb` alisa toda ruga que ele cruzou. Devolve os
 * índices das que foram alisadas agora (as já lisas não voltam).
 */
export function alisar(rugas: number[], lisas: boolean[], xa: number, xb: number): number[] {
  const a = Math.min(xa, xb);
  const b = Math.max(xa, xb);
  const agora: number[] = [];
  rugas.forEach((x, i) => {
    if (!lisas[i] && x >= a && x <= b && b - a > 0) agora.push(i);
  });
  return agora;
}

/** Quantas vezes se toca no travesseiro para ele ficar fofinho. */
export const AFOFADAS = 3;

/* ---------- os dentes ---------- */

/** Uma escovada a cada tanto que o dedo anda dentro da boca, em unidades da cena. */
export const PASSADA = 34;
/** Mais rápido que isto não escova mais depressa: esfregar com calma rende o mesmo que esfregar com pressa. */
export const VELOCIDADE_MAXIMA = 520;
/**
 * Escovadas por parte da boca. Cada escovada toca a próxima nota do Brilha,
 * brilha, e as três partes (em cima, a língua, embaixo) tocam a música inteira:
 * a canção acaba quando os dentes ficam limpos.
 */
export const ESCOVADAS_POR_PARTE = 14;

/**
 * Conta as escovadas. O dedo manda quanto andou e em quanto tempo; a conta
 * guarda o resto para a próxima vez, então muitos movimentos pequenos somam
 * igual a um grande.
 */
export class Escovacao {
  private resto = 0;

  /** O dedo andou `d` unidades em `dt` segundos. Devolve quantas escovadas novas isso deu. */
  esfregar(d: number, dt: number): number {
    if (d <= 0 || dt <= 0) return 0;
    this.resto += Math.min(d, VELOCIDADE_MAXIMA * dt);
    const n = Math.floor(this.resto / PASSADA);
    this.resto -= n * PASSADA;
    return n;
  }

  zerar(): void {
    this.resto = 0;
  }
}

/** Quantas sujeirinhas ainda aparecem numa parte da boca depois de `escovadas`. */
export function sujeirasQueFicam(escovadas: number, sujeiras: number, total = ESCOVADAS_POR_PARTE): number {
  if (escovadas <= 0) return sujeiras;
  if (escovadas >= total) return 0;
  return Math.ceil(sujeiras * (1 - escovadas / total));
}

/* ---------- os brinquedos ---------- */

/** As casas dos brinquedos na sala de brincar: cada coisa tem o seu lugar. */
export type Lugar = 'caixa' | 'estante' | 'cesto';
export const LUGARES: Lugar[] = ['estante', 'caixa', 'cesto'];

export interface Brinquedo {
  id: string;
  lugar: Lugar;
}

/** Os blocos moram na caixa, os livros na estante, os macios no cesto. */
export const BRINQUEDOS: Brinquedo[] = [
  { id: 'bloco_rosa', lugar: 'caixa' },
  { id: 'livro_verde', lugar: 'estante' },
  { id: 'ursinho', lugar: 'cesto' },
  { id: 'bloco_azul', lugar: 'caixa' },
  { id: 'livro_rosa', lugar: 'estante' },
  { id: 'bola', lugar: 'cesto' },
  { id: 'bloco_amarelo', lugar: 'caixa' },
];

/** O lugar mais perto de onde ela soltou, se estiver dentro do alcance. */
export function lugarPerto(x: number, y: number, lugares: Record<Lugar, [number, number]>, alcance: number): Lugar | null {
  let melhor: Lugar | null = null;
  let d = Infinity;
  for (const l of LUGARES) {
    const [lx, ly] = lugares[l];
    const dd = Math.hypot(x - lx, y - ly);
    if (dd < d) {
      d = dd;
      melhor = l;
    }
  }
  return d <= alcance ? melhor : null;
}

/**
 * Para onde vai um brinquedo solto. No chão, volta para onde estava. Numa casa
 * qualquer, vai para a casa dele: se ela soltou na casa certa, fica; se soltou
 * na de outro, ele pula sozinho para a dele e a casa dele acende. Nada é
 * errado, e ela vê onde ele mora.
 */
export function destinoDoBrinquedo(b: Brinquedo, soltoEm: Lugar | null): { vai: Lugar | null; certo: boolean } {
  if (!soltoEm) return { vai: null, certo: false };
  return { vai: b.lugar, certo: soltoEm === b.lugar };
}

/* ---------- a casa ---------- */

/** O que fica anotado no dia para cada cuidado: a centelha da casa e o convite da despedida. */
export function marcaDoCuidado(c: Cuidado): string {
  return `cuidado_${c}`;
}

/** Guarda que ela treinou um cuidado hoje. Muda o estado no lugar, dentro de `mudar()`. */
export function marcarCuidado(e: Estado, c: Cuidado): void {
  marcarBrincada(e, 'cuidados');
  const m = marcaDoCuidado(c);
  e.hoje.brincadas = e.hoje.brincadas.filter((b) => b !== m);
  e.hoje.brincadas.push(m);
}

export function cuidouHoje(e: Estado, c: Cuidado): boolean {
  return e.hoje.brincadas.includes(marcaDoCuidado(c));
}

/** O último cuidado que ela treinou hoje, para o convite da despedida; `null` se nenhum. */
export function ultimoCuidadoDeHoje(e: Estado): Cuidado | null {
  for (let i = e.hoje.brincadas.length - 1; i >= 0; i--) {
    const c = CUIDADOS.find((k) => marcaDoCuidado(k) === e.hoje.brincadas[i]);
    if (c) return c;
  }
  return null;
}
