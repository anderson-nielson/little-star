import { convidarParaCasa, type TelaSvg } from './comum';
import { mudar } from '@/core/estado';
import { marcarCuidado, type Cuidado } from '@/core/cuidados';
import { anunciar } from '@/core/narracao';
import { esperar } from '@/core/util';
import { liraDesce } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';

/**
 * O que as três telas de cuidado têm igual: entrar anota o cuidado no dia (a
 * centelha na casa, o convite da despedida), e o fim é sempre o mesmo ritual
 * calmo. O resultado bonito fica um tempo na tela antes de qualquer convite,
 * para ela olhar o que fez.
 */

/** O avanço narrado no balão quando ela termina cada cuidado. */
export const AVANCO_DO_CUIDADO: Record<Cuidado, string> = {
  cama: 'arrumou_a_cama',
  dentes: 'escovou_os_dentes',
  brinquedos: 'guardou_os_brinquedos',
};

export function entrarNoCuidado(c: Cuidado): void {
  mudar((x) => marcarCuidado(x, c));
}

/**
 * Terminou: a lira desce, as centelhas sobem de onde ficou mais bonito, o balão
 * conta o que ela fez, a voz da família comemora, e só depois a casinha acende.
 */
export async function terminarCuidado(tela: TelaSvg, c: Cuidado, onde: [number, number], voz: string, vivo: () => boolean): Promise<void> {
  liraDesce();
  tela.comemorar(onde[0], onde[1]);
  mudar((x) => {
    x.registro.partes[c] = (x.registro.partes[c] ?? 0) + 1;
  });
  anunciar(AVANCO_DO_CUIDADO[c]);
  await esperar(900);
  if (!vivo()) return;
  tela.comemorar(onde[0] + 40, onde[1] - 30);
  if (temVoz(voz)) await falar(voz);
  else await esperar(1600);
  if (vivo()) convidarParaCasa(tela);
}

/**
 * A mãozinha mostra um gesto: anda pelos pontos, devagar, e some. Devolve como
 * parar antes do fim (outro gesto, ou ela já tocou).
 */
export function gesto(tela: TelaSvg, pontos: [number, number][], passoMs = 380): () => void {
  let vivo = true;
  void (async () => {
    for (const p of pontos) {
      if (!vivo) return;
      tela.mao(p, -15, true);
      await esperar(passoMs);
    }
    if (vivo) tela.mao(null);
  })();
  return () => {
    vivo = false;
  };
}

/** Um ursinho de pelúcia, sentado, com a base em (x, y) e altura perto de `s`. */
export function ursinho(x: number, y: number, s: number): string {
  const c = '#c48f5a';
  return `<g><ellipse cx="${x}" cy="${y - s * 0.3}" rx="${s * 0.32}" ry="${s * 0.3}" fill="${c}"/><ellipse cx="${x}" cy="${y - s * 0.26}" rx="${s * 0.17}" ry="${s * 0.16}" fill="#e2b9a0" opacity="0.8"/><circle cx="${x - s * 0.24}" cy="${y - s * 0.9}" r="${s * 0.11}" fill="${c}"/><circle cx="${x + s * 0.24}" cy="${y - s * 0.9}" r="${s * 0.11}" fill="${c}"/><circle cx="${x}" cy="${y - s * 0.74}" r="${s * 0.26}" fill="${c}"/><ellipse cx="${x}" cy="${y - s * 0.67}" rx="${s * 0.1}" ry="${s * 0.075}" fill="#e2b9a0"/><circle cx="${x - s * 0.09}" cy="${y - s * 0.79}" r="${s * 0.03}" fill="#1a1c2b"/><circle cx="${x + s * 0.09}" cy="${y - s * 0.79}" r="${s * 0.03}" fill="#1a1c2b"/><circle cx="${x}" cy="${y - s * 0.69}" r="${s * 0.03}" fill="#1a1c2b"/></g>`;
}

/** Um coelhinho de pano, sentado, com a base em (x, y). */
export function coelhinhoDePano(x: number, y: number, s: number): string {
  const c = '#e9e2d6';
  return `<g><ellipse cx="${x}" cy="${y - s * 0.28}" rx="${s * 0.28}" ry="${s * 0.28}" fill="${c}"/><path d="M${x - s * 0.14} ${y - s * 0.8}q-${s * 0.1} -${s * 0.36} ${s * 0.02} -${s * 0.38}q${s * 0.1} ${s * 0.04} ${s * 0.04} ${s * 0.38}zM${x + s * 0.14} ${y - s * 0.8}q${s * 0.1} -${s * 0.36} -${s * 0.02} -${s * 0.38}q-${s * 0.1} ${s * 0.04} -${s * 0.04} ${s * 0.38}z" fill="${c}" stroke="#f2a9c4" stroke-width="${s * 0.03}"/><circle cx="${x}" cy="${y - s * 0.66}" r="${s * 0.24}" fill="${c}"/><circle cx="${x - s * 0.08}" cy="${y - s * 0.69}" r="${s * 0.028}" fill="#1a1c2b"/><circle cx="${x + s * 0.08}" cy="${y - s * 0.69}" r="${s * 0.028}" fill="#1a1c2b"/><circle cx="${x}" cy="${y - s * 0.6}" r="${s * 0.035}" fill="#f2a9c4"/></g>`;
}
