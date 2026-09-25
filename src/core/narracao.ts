import narracaoJson from '@/data/narracao.json';
import type { Estado } from './estado';

/**
 * A narração para quem joga junto. A cada avanço dela (uma tarefa contada,
 * uma letra, um som, a chegada, o bilhete) um balão no topo da tela traz
 * uma frase curta para a mãe, o pai ou o Theo lerem em voz alta. As frases
 * vivem em `src/data/narracao.json` e se revezam.
 *
 * O texto é para o adulto, nunca para ela ler. Três coisas ele sempre faz:
 * nomeia o que ela fez de verdade (a força dela), diz o carinho e a
 * segurança da família, e coloca o Theo como quem torce por ela, nunca como
 * medida. Nada de comparação, nada de "melhor que".
 *
 * Este módulo é puro e sem DOM: anuncia avanços por um canal simples; quem
 * desenha o balão está em `src/ui/balao.ts`.
 */
export type Avanco = string;

const FRASES = narracaoJson as Record<string, string[] | string>;

/** os avanços que têm frase (o resto do json é comentário) */
export const AVANCOS_NARRADOS: string[] = Object.keys(FRASES).filter((k) => Array.isArray(FRASES[k]));

export function frasesDe(avanco: Avanco): string[] {
  const f = FRASES[avanco];
  return Array.isArray(f) ? f : [];
}

/** A frase da vez para um avanço: elas se revezam. `null` quando o avanço não tem narração. */
export function narracao(avanco: Avanco, vez = 0): string | null {
  const f = frasesDe(avanco);
  if (f.length === 0) return null;
  return f[((vez % f.length) + f.length) % f.length] ?? null;
}

/** Quantas vezes este avanço já aconteceu, contando pelo histórico das pedrinhas. */
export function vezesNoHistorico(e: Estado, avanco: Avanco): number {
  return e.pedrinhasHistorico.filter((r) => r.motivo === avanco && r.delta > 0).length;
}

/* ---------- o canal ---------- */

type Ouvinte = (avanco: Avanco) => void;
const ouvintes = new Set<Ouvinte>();

/** Um avanço dela aconteceu. Quem desenha o balão escuta aqui. */
export function anunciar(avanco: Avanco): void {
  for (const o of ouvintes) o(avanco);
}

export function aoAnunciar(o: Ouvinte): () => void {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}
