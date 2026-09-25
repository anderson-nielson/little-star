import { TAREFAS, type Estado, type Tarefa } from './estado';
import { diaDaSemana, periodo } from './relogio';

/**
 * O laço de cada sessão. A forma é sempre a mesma; as partes que ainda não
 * existem (na primeira semana) ou que já aconteceram hoje são puladas em
 * silêncio. Puro: recebe o estado e a hora, devolve a lista de partes.
 *
 *   chegada -> roda -> prato -> som -> casa (brincadeira do dia e livre) -> bichos -> despedida
 */
export type Parte = 'chegada' | 'roda' | 'prato' | 'som' | 'casa' | 'bichos' | 'despedida' | 'noite' | 'dormindo';

export type Brincadeira = 'piano' | 'caderno' | 'palavras' | 'areia' | 'pinhas' | 'jardim' | 'familia' | 'cozinha';

/** O que cada sessão das primeiras abre. Da quinta em diante, tudo. */
export const ABERTURAS: Record<number, string[]> = {
  1: ['casa', 'piano', 'gato'],
  2: ['roda', 'caderno', 'som', 'bichos', 'quintal', 'areia', 'coelho', 'ukulele', 'lira', 'bonecas', 'bilhete', 'relogio'],
  3: ['prato', 'palavras', 'pinhas', 'arvore', 'horta'],
  4: ['jardim', 'cozinha'],
};
/** A partir desta sessão está tudo aberto. Tela é rara na casa dela: quatro sessões bastam. */
export const SESSAO_COMPLETA = 4;

/**
 * A etapa da casa: cresce com os dias de jogo e também com cada sessão terminada
 * (piano, casinha, bichos, despedida), para quem joga duas vezes no mesmo dia
 * não ficar preso na primeira sala.
 */
export function etapa(e: Estado): number {
  return Math.max(e.sessoes, e.sessoesCompletas + 1);
}

export function aberto(sessoes: number, coisa: string): boolean {
  for (let s = 1; s <= Math.min(sessoes, SESSAO_COMPLETA); s++) if (ABERTURAS[s]?.includes(coisa)) return true;
  return sessoes > SESSAO_COMPLETA;
}

/** A brincadeira do dia: na primeira semana, a coisa nova; depois, o ritmo da semana. */
export function brincadeiraDoDia(e: Estado, agora: Date): Brincadeira {
  const s = etapa(e);
  if (s <= 1) return 'piano';
  if (s === 2) return 'caderno';
  if (s === 3) return 'pinhas';
  if (s === 4) return 'jardim';
  /* segunda é o dia do pão no jardim Waldorf: a comidinha com a mãe (as palavras moram nela) */
  const semana: Brincadeira[] = ['familia', 'cozinha', 'caderno', 'pinhas', 'areia', 'piano', 'jardim'];
  return semana[diaDaSemana(agora)] ?? 'piano';
}

/* ---------- as aventuras da porta ---------- */

export type Aventura = 'jardim' | 'arvore' | 'lago';
export const AVENTURAS: Aventura[] = ['jardim', 'arvore', 'lago'];

/** As aventuras que a porta oferece: o Jardim primeiro; cada uma terminada abre a seguinte. */
export function aventurasAbertas(e: Estado): Aventura[] {
  if (!aberto(etapa(e), 'jardim')) return [];
  const a: Aventura[] = ['jardim'];
  if (e.aventuras >= 1) a.push('arvore');
  if (e.aventuras >= 2) a.push('lago');
  return a;
}

/** A aventura que brilha na porta hoje: elas se revezam, a nova primeiro. */
export function aventuraDoDia(e: Estado): Aventura {
  const abertas = aventurasAbertas(e);
  if (abertas.length === 0) return 'jardim';
  const nova = abertas.find((a) => !(e.aventurasPor[a] ?? 0));
  return nova ?? abertas[e.aventuras % abertas.length]!;
}

/* ---------- o espanhol ---------- */

/** Com este tanto de letras traçadas, os primeiros sons estão firmes e o espanhol entra sozinho. */
export const LETRAS_PARA_ESPANHOL = 3;

export function espanholAtivo(e: Estado): boolean {
  if (e.pais.espanhol === 'ligado') return true;
  if (e.pais.espanhol === 'desligado') return false;
  return e.letras.length >= LETRAS_PARA_ESPANHOL;
}

/* ---------- a roda ---------- */

export function tarefasAtivas(e: Estado): Tarefa[] {
  return TAREFAS.filter((t) => e.pais.tarefas[t]);
}

export function partesDaSessao(e: Estado, agora: Date): Parte[] {
  const p = periodo(agora, e.pais.horaDormir);
  if (p === 'dormindo') return ['dormindo'];
  if (p === 'noite') return ['noite'];
  const partes: Parte[] = ['chegada'];
  const et = etapa(e);
  /* o que já aconteceu hoje não volta; o que abriu depois da primeira abertura de hoje entra */
  if (aberto(et, 'roda') && !e.hoje.rodaFeita) partes.push('roda');
  if (aberto(et, 'prato') && e.pais.pratoLigado && !e.hoje.pratoFeito) partes.push('prato');
  if (aberto(et, 'som') && !e.hoje.somFeito) partes.push('som');
  partes.push('casa');
  if (aberto(et, 'bichos') || e.bichos.gato) partes.push('bichos');
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
