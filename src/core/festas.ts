import { chaveDoDia, type Estacao, estacao } from './relogio';
import festasJson from '@/data/festas.json';

/**
 * As estações e as festas, no calendário do hemisfério sul. As festas de data
 * fixa vêm de dados; o Advento se calcula (quatro domingos antes do Natal).
 * Tudo puro, com a data como argumento.
 */
export type FestaId = 'lanterna' | 'junina' | 'primavera' | 'advento';

export interface Festa {
  id: FestaId;
  nome: string;
  /** [mês, dia], mês de 1 a 12 */
  de: [number, number];
  ate: [number, number];
}

export const FESTAS_FIXAS: Festa[] = festasJson as Festa[];

function dentro(d: Date, de: [number, number], ate: [number, number]): boolean {
  const m = d.getMonth() + 1;
  const dia = d.getDate();
  const a = m * 100 + dia;
  return a >= de[0] * 100 + de[1] && a <= ate[0] * 100 + ate[1];
}

/** O primeiro domingo do Advento do ano: o quarto domingo antes do Natal. */
export function primeiroDomingoDoAdvento(ano: number): Date {
  const natal = new Date(ano, 11, 25);
  const dow = natal.getDay();
  const quarto = new Date(ano, 11, 25 - (dow === 0 ? 7 : dow));
  return new Date(quarto.getFullYear(), quarto.getMonth(), quarto.getDate() - 21);
}

/** Quantas velas da espiral já acendem: 0 fora do Advento, 1 a 4 dentro. */
export function velasDoAdvento(d: Date): number {
  const primeiro = primeiroDomingoDoAdvento(d.getFullYear());
  const natal = new Date(d.getFullYear(), 11, 25);
  const hoje = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (hoje < primeiro || hoje >= natal) return 0;
  const dias = Math.round((hoje.getTime() - primeiro.getTime()) / 86400000);
  return Math.min(4, Math.floor(dias / 7) + 1);
}

export function festaDoDia(d: Date): FestaId | null {
  for (const f of FESTAS_FIXAS) if (dentro(d, f.de, f.ate)) return f.id;
  if (velasDoAdvento(d) > 0) return 'advento';
  return null;
}

/** O que muda na casa e no quintal com a estação, para as telas desenharem. */
export interface Clima {
  estacao: Estacao;
  festa: FestaId | null;
  /** folhas caindo no quintal */
  folhas: boolean;
  /** flores no pinheiro e na grama */
  flores: boolean;
  /** conchinhas na caixa de areia */
  conchas: boolean;
  /** fitinha no pinheiro (inverno) */
  fitinha: boolean;
  velas: number;
}

export function climaDoDia(d: Date, festasLigadas = true): Clima {
  const est = estacao(d);
  const festa = festasLigadas ? festaDoDia(d) : null;
  return {
    estacao: est,
    festa,
    folhas: est === 'outono',
    flores: est === 'primavera',
    conchas: est === 'verao',
    fitinha: est === 'inverno',
    velas: festa === 'advento' ? velasDoAdvento(d) : 0,
  };
}

export { chaveDoDia };
