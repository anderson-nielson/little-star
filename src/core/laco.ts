import type { Estado } from './estado';
import { diaDaSemana, periodo } from './relogio';

/**
 * O laço de cada sessão. A forma é sempre a mesma; as partes que ainda não
 * existem (na primeira semana) ou que já aconteceram hoje são puladas em
 * silêncio. Puro: recebe o estado e a hora, devolve a lista de partes.
 *
 *   chegada -> roda -> prato -> som -> casa (brincadeira do dia e livre) -> bichos -> despedida
 */
export type Parte = 'chegada' | 'roda' | 'prato' | 'som' | 'casa' | 'bichos' | 'despedida' | 'noite' | 'dormindo';

export type Brincadeira = 'piano' | 'caderno' | 'palavras' | 'areia' | 'pinhas' | 'jardim' | 'familia';

/** O que cada sessão da primeira semana abre. Da 7 em diante, tudo. */
export const ABERTURAS: Record<number, string[]> = {
  1: ['casa', 'piano', 'gato'],
  2: ['roda', 'caderno', 'som', 'bichos'],
  3: ['quintal', 'areia', 'coelho'],
  4: ['prato', 'palavras'],
  5: ['pinhas'],
  6: ['jardim'],
};

export function aberto(sessoes: number, coisa: string): boolean {
  for (let s = 1; s <= Math.min(sessoes, 6); s++) if (ABERTURAS[s]?.includes(coisa)) return true;
  return sessoes >= 7;
}

/** A brincadeira do dia: na primeira semana, a coisa nova; depois, o ritmo da semana. */
export function brincadeiraDoDia(e: Estado, agora: Date): Brincadeira {
  const s = e.sessoes;
  if (s <= 1) return 'piano';
  if (s === 2) return 'caderno';
  if (s === 3) return 'areia';
  if (s === 4) return 'palavras';
  if (s === 5) return 'pinhas';
  if (s === 6) return 'jardim';
  const semana: Brincadeira[] = ['familia', 'palavras', 'caderno', 'pinhas', 'areia', 'piano', 'jardim'];
  return semana[diaDaSemana(agora)] ?? 'piano';
}

export function partesDaSessao(e: Estado, agora: Date): Parte[] {
  const p = periodo(agora, e.pais.horaDormir);
  if (p === 'dormindo') return ['dormindo'];
  if (p === 'noite') return ['noite'];
  const partes: Parte[] = ['chegada'];
  const segundaVez = e.hoje.aberturas > 1;
  if (!segundaVez) {
    if (aberto(e.sessoes, 'roda') && !e.hoje.rodaFeita) partes.push('roda');
    if (aberto(e.sessoes, 'prato') && e.pais.pratoLigado && !e.hoje.pratoFeito) partes.push('prato');
    if (aberto(e.sessoes, 'som') && !e.hoje.somFeito) partes.push('som');
  }
  partes.push('casa');
  if (aberto(e.sessoes, 'bichos') || e.bichos.gato) partes.push('bichos');
  partes.push('despedida');
  return partes;
}

/** A parte que vem depois da atual. `null` quando a sessão acabou. */
export function proximaParte(partes: Parte[], atual: Parte): Parte | null {
  const i = partes.indexOf(atual);
  return i >= 0 && i + 1 < partes.length ? partes[i + 1]! : null;
}

/** Quanto tempo de casa livre antes de a família chamar para os bichos, em segundos. */
export const LIVRE_MAXIMO = 5 * 60;

/** O limite diário virou despedida? */
export function passouDoLimite(e: Estado): boolean {
  return e.hoje.segundos >= e.pais.limiteMin * 60;
}
