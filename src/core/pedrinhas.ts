import type { Estado } from './estado';
import { anunciar } from './narracao';

/**
 * As pedrinhas: o pote de vidro no quarto. Ela ganha pedrinhas pelo que faz de
 * verdade (as tarefas, dormir sozinha no quarto, dormir a noite toda) e pelo
 * que aprende (uma letra, uma palavra, um som, uma hora no relógio). Perde
 * uma quando um combinado não acontece: a pedrinha rola para fora do pote,
 * sem som de erro e sem ninguém dizer nada. Nunca fica abaixo de zero, e
 * aprender nunca tira pedrinha. Pote cheio vira uma medalha de feltro na
 * parede, e medalha não se perde.
 */
export const PEDRINHAS = {
  tarefa: 1,
  confirmacao: 1,
  tarefaNaoFeita: 1,
  dormiuSozinha: 2,
  noiteToda: 2,
  naoDormiuSozinha: 1,
  letra: 3,
  palavra: 1,
  som: 1,
  aventura: 1,
  comidinha: 1,
  colheita: 1,
  relogio: 1,
  /** pedrinhas para encher o pote e virar medalha */
  pote: 12,
} as const;

export interface RegistroDePedrinha {
  dia: string;
  delta: number;
  motivo: string;
}

const HISTORICO_MAXIMO = 80;

function anotar(e: Estado, delta: number, motivo: string): void {
  e.pedrinhasHistorico.push({ dia: e.hoje.dia, delta, motivo });
  if (e.pedrinhasHistorico.length > HISTORICO_MAXIMO) e.pedrinhasHistorico.splice(0, e.pedrinhasHistorico.length - HISTORICO_MAXIMO);
}

/** Ganha `n` pedrinhas. Devolve quantas medalhas nasceram (o pote encheu). */
export function ganhar(e: Estado, n: number, motivo: string): number {
  if (n <= 0) return 0;
  /* a narração para quem joga junto ouve todo avanço, com o pote ligado ou não */
  anunciar(motivo);
  if (!e.pais.pedrinhas) return 0;
  e.pedrinhas += n;
  anotar(e, n, motivo);
  let medalhas = 0;
  while (e.pedrinhas >= PEDRINHAS.pote) {
    e.pedrinhas -= PEDRINHAS.pote;
    e.medalhas += 1;
    medalhas += 1;
  }
  if (medalhas) anunciar('medalha');
  return medalhas;
}

/** Perde até `n` pedrinhas, nunca abaixo de zero. Devolve quantas rolaram de verdade. */
export function perder(e: Estado, n: number, motivo: string): number {
  if (!e.pais.pedrinhas || !e.pais.perdePedrinhas || n <= 0) return 0;
  const antes = e.pedrinhas;
  e.pedrinhas = Math.max(0, e.pedrinhas - n);
  const rolaram = antes - e.pedrinhas;
  if (rolaram > 0) anotar(e, -rolaram, motivo);
  return rolaram;
}

/** Ajuste dos pais, para cima ou para baixo, sempre com motivo. */
export function ajustar(e: Estado, delta: number, motivo: string): void {
  if (delta > 0) ganhar(e, delta, motivo);
  else if (delta < 0) {
    const antes = e.pedrinhas;
    e.pedrinhas = Math.max(0, e.pedrinhas + delta);
    if (antes !== e.pedrinhas) anotar(e, e.pedrinhas - antes, motivo);
  }
}
