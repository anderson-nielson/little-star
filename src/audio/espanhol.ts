import { falar, temVoz } from './vozes';
import { podeFalar } from './fala';
import esJson from '@/data/espanhol.json';

/**
 * O espanhol da Estrellita: cada coisa tem dois nomes. A palavra escrita fica
 * sempre em português; o espanhol é só para ouvir. Se a família gravou a
 * palavra (`es_<id>`), vale a gravação; senão, a voz do aparelho em espanhol;
 * sem voz em espanhol instalada, a Estrellita fica quieta.
 */
const ES = esJson as Record<string, string>;

export function palavraEmEspanhol(id: string): string | null {
  return ES[id] ?? null;
}

function vozEs(): SpeechSynthesisVoice | null {
  const vozes = speechSynthesis.getVoices();
  return vozes.find((v) => /es[-_](MX|US|419)/i.test(v.lang)) ?? vozes.find((v) => /^es/i.test(v.lang)) ?? null;
}

export function podeFalarEspanhol(): boolean {
  return podeFalar() && vozEs() !== null;
}

/** Diz a palavra em espanhol. Devolve se conseguiu dizer. */
export async function falarEspanhol(id: string, velocidade = 0.75): Promise<boolean> {
  if (temVoz('es_' + id)) return falar('es_' + id);
  const texto = ES[id];
  if (!texto || !podeFalar()) return false;
  const v = vozEs();
  if (!v) return false;
  return new Promise((r) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto.replace(/[¡!¿?]/g, ''));
      u.lang = v.lang;
      u.voice = v;
      u.rate = velocidade;
      u.pitch = 1.15;
      u.onend = () => r(true);
      u.onerror = () => r(false);
      speechSynthesis.speak(u);
      setTimeout(() => r(true), 4000);
    } catch {
      r(false);
    }
  });
}
