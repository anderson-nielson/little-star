import palavrasJson from '@/data/palavras.json';
import letrasJson from '@/data/letras.json';
import type { Estado } from './estado';

/**
 * As palavras do escorregador de sons e a ordem em que ela as encontra.
 * Puro e sem DOM, para o teste guardar a regra.
 */
export interface Palavra {
  palavra: string;
  figura: string;
  silabas: string[];
}
export const palavras = palavrasJson as Palavra[];

interface LetraDoCaderno {
  id: string;
  palavra: string;
}
const letras = letrasJson as unknown as LetraDoCaderno[];

/** a letra base de uma acentuada: Á é A, Ó é O */
export function semAcento(p: string): string {
  return p.replace(/Á/g, 'A').replace(/Ó/g, 'O');
}

/**
 * A fila de palavras desta fase: a palavra de cada letra que ela já traçou
 * (mais a da letra da vez), toda palavra feita só de letras traçadas, e a
 * palavra pedida (a mala da sala abre MALA mesmo antes do M). Na ordem do
 * arquivo, que é a ordem do fônico.
 */
export function sequenciaDePalavras(e: Estado, pedida: string): Palavra[] {
  const atual = letras[Math.min(e.letraIndice, letras.length - 1)]!;
  const tracadas = new Set([...e.letras, atual.id]);
  const dasLetras = new Set(letras.filter((l) => tracadas.has(l.id)).map((l) => l.palavra));
  const sabe = (p: string) => [...semAcento(p)].every((c) => tracadas.has(c));
  return palavras.filter((p) => p.palavra === pedida || dasLetras.has(p.palavra) || sabe(p.palavra));
}

/**
 * A próxima palavra depois desta: a primeira ainda não lida à frente na fila,
 * senão a primeira ainda não lida atrás, senão a seguinte na fila (para ela
 * poder continuar passeando). `null` quando a fila só tem esta.
 */
export function proximaPalavra(e: Estado, fila: Palavra[], atual: string): Palavra | null {
  const i = fila.findIndex((p) => p.palavra === atual);
  if (fila.length <= 1 || i < 0) return null;
  const lida = (p: Palavra) => e.palavras.includes(p.palavra);
  const frente = fila.slice(i + 1).find((p) => !lida(p));
  if (frente) return frente;
  const tras = fila.slice(0, i).find((p) => !lida(p));
  if (tras) return tras;
  return fila[(i + 1) % fila.length]!;
}
