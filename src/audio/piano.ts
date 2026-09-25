/**
 * Piano gravado: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0), um
 * Yamaha C5 amostrado nota a nota. Uma amostra a cada terça menor, de C2 a C7,
 * em mono e cortada em 4 s com a cauda esmaecida: 21 arquivos, uns 500 KB, em
 * `public/piano/`. Decodificadas, as 21 ocupam uns 16 MB de memória (float32 a
 * 48 kHz); aceito, porque o download é o que pesa para quem joga no celular.
 *
 * A nota pedida sai da amostra mais próxima com a velocidade de leitura
 * ajustada: no máximo um semitom e meio dentro de C2 a C7; o baixo mais grave
 * das músicas (lá 1, MIDI 33) desce três semitons da amostra de dó 2.
 *
 * O relógio não muda: a amostra é agendada no mesmo instante do contexto que o
 * oscilador era. O piano só vale quando as 21 amostras chegaram, e só a partir
 * da música que começa depois disso (o sequenciador decide no início): antes,
 * trocava de instrumento nota a nota enquanto baixava. Se faltar alguma, a
 * próxima tela de dança tenta de novo. O jogo nunca espera o piano.
 */
export const AMOSTRAS_DO_PIANO: readonly number[] = Array.from({ length: 21 }, (_, i) => 36 + i * 3);

/* a amostra gravada é mais baixa que a onda sintética; o fator iguala o volume percebido */
const GANHO = 1.6;
/* o abafador do piano: a nota não corta seco quando acaba, some em ~0,2 s;
   em nota curta, menos, senão a semicolcheia da Marcha Turca vira pedal */
const SOLTURA = 0.07;
const solturaDa = (dur: number) => Math.min(SOLTURA, dur * 0.15);
/* limiar do ataque: -40 dB */
const LIMIAR_DO_ATAQUE = 0.01;
/* a amostra tem 4 s e esmaece desde 3,2 s; dali em diante a nota longa segue numa senoide baixa */
const DURACAO_DA_AMOSTRA = 4;
const INICIO_DO_ESMAECIMENTO = 3.2;
const NIVEL_DA_CONTINUACAO = 0.1;

const buffers = new Map<number, AudioBuffer>();
const ataques = new Map<number, number>();
let carregando: Promise<void> | null = null;

/** A amostra que serve à nota: a mais próxima (com amostras de três em três semitons nunca há empate). */
export function amostraMaisProxima(midi: number): number {
  let melhor = AMOSTRAS_DO_PIANO[0]!;
  for (const a of AMOSTRAS_DO_PIANO) if (Math.abs(a - midi) < Math.abs(melhor - midi)) melhor = a;
  return melhor;
}

/**
 * Onde o som começa dentro da amostra, em segundos. O MP3 traz uns 45 a 50 ms
 * de silêncio antes do ataque (atraso do codificador, medido nas 21 notas):
 * tocando do zero, o piano soava sempre atrasado em relação ao clique e à
 * janela, e a criança que conta pelo piano chegava tarde.
 */
export function inicioDoSom(dados: Float32Array, taxaDeAmostragem: number): number {
  const limite = Math.min(dados.length, Math.round(taxaDeAmostragem * 0.2));
  for (let i = 0; i < limite; i++) if (Math.abs(dados[i]!) > LIMIAR_DO_ATAQUE) return Math.max(0, i / taxaDeAmostragem - 0.002);
  return 0;
}

/** As 21 amostras chegaram. O piano é tudo ou nada: meio piano, meio sintetizador soa como defeito. */
export function pianoPronto(): boolean {
  return buffers.size === AMOSTRAS_DO_PIANO.length;
}

/**
 * Busca e decodifica as amostras que faltam. Chamado a cada tela de dança:
 * se a rede caiu no meio (túnel, primeira visita antes do service worker),
 * a próxima tentativa completa o que faltou.
 */
export function carregarPiano(ctx: BaseAudioContext, base = import.meta.env.BASE_URL): Promise<void> {
  if (pianoPronto()) return Promise.resolve();
  if (carregando) return carregando;
  carregando = Promise.all(
    AMOSTRAS_DO_PIANO.filter((m) => !buffers.has(m)).map(async (m) => {
      try {
        const r = await fetch(`${base}piano/p${m}.mp3`);
        if (!r.ok) return;
        const b = await ctx.decodeAudioData(await r.arrayBuffer());
        ataques.set(m, inicioDoSom(b.getChannelData(0), b.sampleRate));
        buffers.set(m, b);
      } catch {
        /* fica para a próxima tentativa */
      }
    }),
  ).then(() => {
    carregando = null;
  });
  return carregando;
}

/** Quanto da amostra soa antes de esmaecer, já contando a velocidade de leitura. */
export function duracaoUtil(midi: number): number {
  const taxa = Math.pow(2, (midi - amostraMaisProxima(midi)) / 12);
  return INICIO_DO_ESMAECIMENTO / taxa;
}

/** Toca a nota com a amostra mais próxima. Devolve false se o piano ainda não está completo. */
export function tocarAmostra(ctx: BaseAudioContext, out: AudioNode, midi: number, t: number, dur: number, vel: number): boolean {
  if (!pianoPronto()) return false;
  const base = amostraMaisProxima(midi);
  const s = ctx.createBufferSource();
  s.buffer = buffers.get(base)!;
  const taxa = Math.pow(2, (midi - base) / 12);
  s.playbackRate.value = taxa;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * GANHO, t);
  const soltura = solturaDa(dur);
  g.gain.setTargetAtTime(0.0001, t + dur, soltura);
  s.connect(g);
  g.connect(out);
  s.start(t, ataques.get(base) ?? 0);
  s.stop(t + Math.min(dur + soltura * 6, DURACAO_DA_AMOSTRA / taxa));
  /* nota mais longa que a amostra (a Gymnopédie segura um fá# por ~10 s):
     uma senoide baixa entra enquanto a amostra esmaece e segura até o fim,
     senão a música sumia no meio do equilíbrio da seleção */
  const util = duracaoUtil(midi);
  if (dur > util) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    const go = ctx.createGain();
    const entra = t + util * 0.8;
    go.gain.setValueAtTime(0, entra);
    go.gain.linearRampToValueAtTime(vel * NIVEL_DA_CONTINUACAO, t + util + 0.6);
    go.gain.setTargetAtTime(0.0001, t + dur, soltura);
    o.connect(go);
    go.connect(out);
    o.start(entra);
    o.stop(t + dur + soltura * 6);
  }
  return true;
}
