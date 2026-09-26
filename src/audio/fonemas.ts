import { audio } from './engine';
import { falar, temVoz } from './vozes';
import { falarPalavra } from './fala';
import { RECEITAS, sintetizarSom, somDaLetra } from './sintese-fonemas';

export { duracaoDoSom, RECEITAS, sintetizarSom, somDaLetra } from './sintese-fonemas';

/* ---------- no jogo ---------- */

let falando = 0;

/**
 * Diz o som de uma letra: a gravação da família se houver; senão, o som
 * montado pelo sintetizador. Resolve quando o som termina. Devolve se soou.
 * `esticar` alonga os sons que se seguram (vogais, M, S...); os de estalo
 * são sempre curtos.
 */
export async function falarSom(id: string, esticar = 1): Promise<boolean> {
  if (temVoz(id) && (await falar(id))) return true;
  const ctx = audio.ctx;
  if (!ctx || !audio.efeitos || !audio.musica || !RECEITAS[id]) return false;
  const t = ctx.currentTime + 0.02;
  const saida = ctx.createGain();
  saida.gain.value = 0.9;
  saida.connect(audio.efeitos);
  falando += 1;
  audio.musica.gain.setTargetAtTime(0.4, ctx.currentTime, 0.1);
  const dur = sintetizarSom(ctx, saida, id, t, esticar);
  await new Promise<void>((r) => setTimeout(r, (dur + 0.1) * 1000));
  saida.disconnect();
  falando -= 1;
  if (falando === 0) audio.musica.gain.setTargetAtTime(1, ctx.currentTime + 0.2, 0.4);
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
 * e cada `{som_x}` é o som da letra, montado aqui. "{som_s}... {som_s}, de
 * sapo" soa "sss... sssss, de sapo", sem a voz do aparelho dizer "esse".
 * Um `{som_x:1.6}` estica o som. Reticências viram uma pausa curta.
 */
export async function dizerComSons(frase: string): Promise<void> {
  const partes = frase.split(/(\{som_\w+(?::[\d.]+)?\})/).filter((p) => p.trim());
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
 * A frase do caderno e da areia: o som curto, o som esticado e a figura que
 * começa com ele ("sss... sssss, de sapo"). Nunca o nome da letra.
 */
export function fraseDeEnsinar(som: string, figura: string): string {
  return `{${som}}... {${som}:1.6}, de ${figura}`;
}
