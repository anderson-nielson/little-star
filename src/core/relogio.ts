/**
 * O relógio da casa: o dia, a semana, a estação e a hora de dormir.
 * Tudo puro, com a data como argumento, para o teste andar no tempo.
 */

export type Periodo = 'manha' | 'tarde' | 'noite' | 'dormindo';
export type Estacao = 'verao' | 'outono' | 'inverno' | 'primavera';

const dois = (n: number) => String(n).padStart(2, '0');

/** 'AAAA-MM-DD' no fuso local. */
export function chaveDoDia(d: Date): string {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** 0 = domingo ... 6 = sábado. */
export function diaDaSemana(d: Date): number {
  return d.getDay();
}

/** Chave da semana que começa na segunda: 'AAAA-MM-DD' da segunda-feira. */
export function chaveDaSemana(d: Date): string {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const desloc = (s.getDay() + 6) % 7;
  s.setDate(s.getDate() - desloc);
  return chaveDoDia(s);
}

export function minutosDoDia(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function horaParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 20) * 60 + (m ?? 0);
}

/** Quanto antes da hora de dormir a casa escurece, em minutos. */
export const ANTES_DE_DORMIR = 30;
/** Antes disto de manhã, ainda é noite de dormir. */
export const AMANHECER = 6 * 60;

export function periodo(d: Date, horaDormir: string): Periodo {
  const m = minutosDoDia(d);
  const dormir = horaParaMinutos(horaDormir);
  if (m < AMANHECER) return 'dormindo';
  if (m >= dormir) return 'dormindo';
  if (m >= dormir - ANTES_DE_DORMIR) return 'noite';
  return m < 12 * 60 ? 'manha' : 'tarde';
}

/** Hemisfério sul. */
export function estacao(d: Date): Estacao {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return 'outono';
  if (m >= 5 && m <= 7) return 'inverno';
  if (m >= 8 && m <= 10) return 'primavera';
  return 'verao';
}

/** A cor do céu pela hora: manhã clara, tarde rosa, noite azul. */
export function ceuDaHora(d: Date): 'ceu-dia' | 'ceu-tarde' | 'ceu-noite' {
  const h = d.getHours();
  if (h < 6 || h >= 19) return 'ceu-noite';
  if (h >= 16) return 'ceu-tarde';
  return 'ceu-dia';
}

/** A cor do dia da semana, na tradição dos jardins Waldorf. */
export const COR_DO_DIA = ['dia-dom', 'dia-seg', 'dia-ter', 'dia-qua', 'dia-qui', 'dia-sex', 'dia-sab'] as const;
