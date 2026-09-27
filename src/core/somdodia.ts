import { somInicialDaFigura } from '@/audio/fonemas';
import { embaralhar, semente } from './util';

export interface LetraDoSom {
  id: string;
  som: string;
  figuras: string[];
}

/** Uma rodada do som do dia: a letra, o som que o Theo diz, a figura certa e as que aparecem. */
export interface Rodada {
  letra: string;
  som: string;
  alvo: string;
  figuras: string[];
}

/** Três rodadas: a letra da semana, uma que ela já traçou, a da semana de novo. */
export const RODADAS = 3;

/** A primeira rodada aquece com três figuras; as outras têm quatro. */
export function figurasDaRodada(rodada: number): number {
  return rodada === 0 ? 3 : 4;
}

/**
 * As letras das três rodadas. A do meio revisita uma letra que ela já traçou,
 * para o som do dia crescer com o caderno; sem outra letra traçada, é a da
 * semana nas três.
 */
export function letrasDasRodadas(semana: string, tracadas: string[], seed: number): string[] {
  const outras = tracadas.filter((l) => l !== semana);
  const revisao = outras.length ? embaralhar(outras, seed)[0]! : semana;
  return [semana, revisao, semana];
}

/**
 * Monta as rodadas. O som dito é o som com que a figura certa começa de
 * verdade (ovo começa com ô, não com ó). Cada figura na tela é de uma letra
 * diferente e começa com um som diferente: ela ouve a diferença em todo toque.
 */
export function montarRodadas(letras: LetraDoSom[], semana: string, tracadas: string[], chave: string): Rodada[] {
  const porId = new Map(letras.map((l) => [l.id, l]));
  const ids = letrasDasRodadas(semana, tracadas.filter((l) => porId.has(l)), semente(chave + ':revisao'));
  const usadas = new Set<string>();
  return ids.map((id, r) => {
    const letra = porId.get(id) ?? letras[0]!;
    const seed = semente(`${chave}:${r}`);
    /* a figura certa: uma da letra que ainda não saiu hoje */
    const candidatas = embaralhar(letra.figuras, seed);
    const alvo = candidatas.find((f) => !usadas.has(f)) ?? candidatas[0]!;
    usadas.add(alvo);
    const som = somInicialDaFigura(alvo, letra.som);
    const sons = new Set([som]);
    const donas = new Set([letra.id]);
    const outras: string[] = [];
    const reserva = embaralhar(
      letras.flatMap((l) => l.figuras.map((f) => ({ f, dona: l.id, som: somInicialDaFigura(f, l.som) }))),
      seed + 0.3,
    );
    for (const c of reserva) {
      if (outras.length >= figurasDaRodada(r) - 1) break;
      if (sons.has(c.som) || donas.has(c.dona)) continue;
      sons.add(c.som);
      donas.add(c.dona);
      outras.push(c.f);
    }
    return { letra: letra.id, som, alvo, figuras: embaralhar([alvo, ...outras], seed + 0.1) };
  });
}
