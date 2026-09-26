import { audio } from './engine';

/**
 * A voz do aparelho, só para palavras inteiras e nomes de figuras, em
 * velocidade 0,85 e tom alto (alegre). Nunca para o som isolado de uma letra: a voz sintética lê
 * "g" como "gê" e ensinaria o contrário (o som isolado vem de `fonemas.ts`).
 * Nunca para o nome dela nem dos bichos.
 */
export function podeFalar(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

function vozPt(): SpeechSynthesisVoice | null {
  const vozes = speechSynthesis.getVoices();
  return vozes.find((v) => /pt[-_]BR/i.test(v.lang)) ?? vozes.find((v) => /^pt/i.test(v.lang)) ?? null;
}

export function falarPalavra(texto: string, velocidade = 0.85): Promise<void> {
  return new Promise((r) => {
    if (!podeFalar() || audio.mudo) return r();
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto.toLowerCase());
      u.lang = 'pt-BR';
      u.rate = velocidade;
      /* mais aguda e mais ligeira que o padrão: a voz lenta e grave soava desanimada */
      u.pitch = 1.3;
      const v = vozPt();
      if (v) u.voice = v;
      let acabou = false;
      const fim = () => {
        if (acabou) return;
        acabou = true;
        audio.terminarFala();
        r();
      };
      u.onend = fim;
      u.onerror = fim;
      audio.comecarFala();
      speechSynthesis.speak(u);
      /* alguns navegadores nunca disparam onend em segundo plano */
      setTimeout(fim, 4000);
    } catch {
      r();
    }
  });
}
