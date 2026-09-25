import type { Canteiro, Estado, Semente } from './estado';

/**
 * A horta do quintal, pura: quatro canteiros; ela planta, rega um pouco por
 * dia, e dias depois colhe. Nada murcha se ela não vier: a planta só espera.
 */
export const SEMENTES: Semente[] = ['cenoura', 'tomate', 'milho', 'alface'];
export type Estagio = 'semente' | 'broto' | 'planta' | 'pronta';

/** Dias inteiros entre duas chaves 'AAAA-MM-DD'. */
export function diasEntre(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay ?? 0, (am ?? 1) - 1, ad ?? 1);
  const db = Date.UTC(by ?? 0, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((db - da) / 86400000);
}

/** Cresce com os dias e com a água: pronta com dois dias e duas regas. */
export function estagio(c: Canteiro, hoje: string): Estagio {
  const dias = Math.max(0, diasEntre(c.plantado, hoje));
  const regas = c.regas.length;
  if (dias >= 2 && regas >= 2) return 'pronta';
  if (dias >= 1 && regas >= 1) return 'planta';
  if (regas >= 1 || dias >= 1) return 'broto';
  return 'semente';
}

export function regadoHoje(c: Canteiro, hoje: string): boolean {
  return c.regas.includes(hoje);
}

/** A próxima semente a plantar: gira pelas quatro, sem repetir a que já está na terra. */
export function proximaSemente(horta: (Canteiro | null)[], colhidas: number): Semente {
  const naTerra = new Set(horta.filter((c): c is Canteiro => c !== null).map((c) => c.semente));
  for (let i = 0; i < SEMENTES.length; i++) {
    const s = SEMENTES[(colhidas + i) % SEMENTES.length]!;
    if (!naTerra.has(s)) return s;
  }
  return SEMENTES[colhidas % SEMENTES.length]!;
}

export function plantar(e: Estado, indice: number, hoje: string): void {
  if (e.horta[indice]) return;
  const colhidas = Object.values(e.aventurasPor).length + e.colheita.length + e.comidinhas;
  e.horta[indice] = { semente: proximaSemente(e.horta, colhidas + indice), plantado: hoje, regas: [] };
}

export function regar(e: Estado, indice: number, hoje: string): boolean {
  const c = e.horta[indice];
  if (!c || regadoHoje(c, hoje)) return false;
  c.regas.push(hoje);
  return true;
}

export function colher(e: Estado, indice: number, hoje: string): Semente | null {
  const c = e.horta[indice];
  if (!c || estagio(c, hoje) !== 'pronta') return null;
  e.horta[indice] = null;
  e.colheita.push(c.semente);
  return c.semente;
}
