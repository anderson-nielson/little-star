/**
 * A voz do aparelho, só para palavras inteiras e nomes de figuras, em
 * velocidade 0,7. Nunca para o som isolado de uma letra: a voz sintética lê
 * "g" como "gê" e ensinaria o contrário. Nunca para o nome dela nem dos bichos.
 */
export function podeFalar(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

function vozPt(): SpeechSynthesisVoice | null {
  const vozes = speechSynthesis.getVoices();
  return vozes.find((v) => /pt[-_]BR/i.test(v.lang)) ?? vozes.find((v) => /^pt/i.test(v.lang)) ?? null;
}

export function falarPalavra(texto: string, velocidade = 0.7): Promise<void> {
  return new Promise((r) => {
    if (!podeFalar()) return r();
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto.toLowerCase());
      u.lang = 'pt-BR';
      u.rate = velocidade;
      u.pitch = 1.05;
      const v = vozPt();
      if (v) u.voice = v;
      u.onend = () => r();
      u.onerror = () => r();
      speechSynthesis.speak(u);
      /* alguns navegadores nunca disparam onend em segundo plano */
      setTimeout(r, 4000);
    } catch {
      r();
    }
  });
}
