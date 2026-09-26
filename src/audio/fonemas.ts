import { audio } from './engine';
import { falar, temVoz } from './vozes';
import { falarPalavra, temVozPt } from './fala';
import { RECEITAS, sintetizarSom, somDaLetra } from './sintese-fonemas';

export { duracaoDoSom, RECEITAS, sintetizarSom, somDaLetra } from './sintese-fonemas';

/* ---------- no jogo ---------- */

/**
 * As vogais vêm da voz do aparelho: nelas o nome da letra é o próprio som, e
 * a voz de gente soa muito melhor que a vogal sintetizada, que sustentada
 * ficava parecendo fantasma ("uuuu"). O acento diz qual vogal: á, é, ê...
 */
const VOGAL_FALADA: Record<string, string> = { som_a: 'á', som_e: 'é', som_e2: 'ê', som_i: 'í', som_o: 'ó', som_o2: 'ô', som_u: 'ú' };

/**
 * Diz o som de uma letra: a gravação da família se houver; a vogal pela voz
 * do aparelho; senão, o som montado pelo sintetizador. Resolve quando o som
 * termina. Devolve se soou. `esticar` alonga os sons que se seguram (vogais,
 * M, S...); os de estalo são sempre curtos.
 */
export async function falarSom(id: string, esticar = 1): Promise<boolean> {
  if (temVoz(id) && (await falar(id))) return true;
  const vogal = VOGAL_FALADA[id];
  if (vogal && temVozPt()) {
    /* esticar na voz do aparelho é falar mais devagar; juntar, mais depressa */
    await falarPalavra(vogal, esticar >= 1.3 ? 0.6 : esticar < 0.7 ? 1.15 : 0.85);
    return true;
  }
  const ctx = audio.ctx;
  if (!ctx || !audio.efeitos || !audio.musica || !RECEITAS[id]) return false;
  const t = ctx.currentTime + 0.02;
  const saida = ctx.createGain();
  saida.gain.value = 0.9;
  saida.connect(audio.efeitos);
  audio.comecarFala();
  const dur = sintetizarSom(ctx, saida, id, t, esticar);
  await new Promise<void>((r) => setTimeout(r, (dur + 0.1) * 1000));
  saida.disconnect();
  audio.terminarFala();
  return true;
}

/** O som de uma letra (A, S, Ó...), se ela tiver um. */
export function falarSomDaLetra(letra: string, esticar = 1): Promise<boolean> {
  const id = somDaLetra(letra);
  return id ? falarSom(id, esticar) : Promise.resolve(false);
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Uma frase de ensinar com o som no meio: o texto vai para a voz do aparelho
 * e cada `{som_x}` é o som da letra, montado aqui. "{som_s}... {som_s}...
 * sapo" soa "sss... sssss... sapo", sem a voz do aparelho dizer "esse".
 * Um `{som_x:1.6}` estica o som. Reticências viram uma pausa curta.
 */
export async function dizerComSons(frase: string): Promise<void> {
  const partes = frase.split(/(\{som_\w+(?::[\d.]+)?\})/).filter((p) => p.trim());
  /* a música fica calada a frase inteira, não só em cada pedaço */
  audio.comecarFala();
  try {
    await dizerPartes(partes);
  } finally {
    audio.terminarFala();
  }
}

async function dizerPartes(partes: string[]): Promise<void> {
  for (const parte of partes) {
    const m = /^\{(som_\w+?)(?::([\d.]+))?\}$/.exec(parte);
    if (m) {
      await falarSom(m[1]!, m[2] ? Number(m[2]) : 1);
      continue;
    }
    if (/\.\.\.|…/.test(parte)) await esperar(250);
    const texto = parte.replace(/\.\.\.|…/g, ' ').replace(/^[\s,.]+|[\s,.]+$/g, '');
    if (texto) await falarPalavra(texto);
  }
}

/**
 * O som com que cada figura começa, quando não é o som ensinado da letra
 * dela: ovo, olho e onda começam com ô (fechado), não com ó; elefante com ê.
 */
const SOM_INICIAL_DIFERENTE: Record<string, string> = { ovo: 'som_o2', olho: 'som_o2', onda: 'som_o2', elefante: 'som_e2' };

export function somInicialDaFigura(figura: string, somDaLetraDela: string): string {
  return SOM_INICIAL_DIFERENTE[figura] ?? somDaLetraDela;
}

/** A primeira figura que começa exatamente com o som ensinado, ou null. */
export function figuraDoSom(som: string, figuras: string[]): string | null {
  return figuras.find((f) => somInicialDaFigura(f, som) === som) ?? null;
}

/**
 * A frase do caderno e da areia: o som curto, o som esticado e, depois de
 * uma pausa, a figura que começa com ele ("sss... sssss... sapo"). Sem "de"
 * no meio: só o som e a palavra. Nunca o nome da letra.
 */
export function fraseDeEnsinar(som: string, figura: string | null): string {
  /* sem figura que comece com esse som (o ó aberto): só o som, para não ensinar ó com ovo */
  return figura ? `{${som}}... {${som}:1.6}... ${figura}` : `{${som}}... {${som}:1.6}`;
}
