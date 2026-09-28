import { describe, expect, it } from 'vitest';
import { figurasDaRodada, letrasDasRodadas, montarRodadas, RODADAS } from '@/core/somdodia';
import { somInicialDaFigura } from '@/audio/fonemas';
import letrasJson from '@/data/letras.json';

const letras = letrasJson as { id: string; som: string; figuras: string[] }[];
const somDe = (f: string) => somInicialDaFigura(f, letras.find((l) => l.figuras.includes(f))!.som);

describe('o som do dia', () => {
  it('três rodadas: a letra da semana, uma já traçada, a da semana de novo', () => {
    expect(letrasDasRodadas('S', ['A', 'E', 'S'], 0.4)).toHaveLength(RODADAS);
    const [a, b, c] = letrasDasRodadas('S', ['A', 'E', 'S'], 0.4);
    expect(a).toBe('S');
    expect(['A', 'E']).toContain(b);
    expect(c).toBe('S');
  });

  it('sem outra letra traçada, as três rodadas são da letra da semana', () => {
    expect(letrasDasRodadas('A', [], 0.1)).toEqual(['A', 'A', 'A']);
    expect(letrasDasRodadas('A', ['A'], 0.1)).toEqual(['A', 'A', 'A']);
  });

  it('a primeira rodada tem três figuras e as outras quatro', () => {
    const r = montarRodadas(letras, 'L', ['A', 'E'], 'x');
    expect(r.map((x) => x.figuras.length)).toEqual([0, 1, 2].map(figurasDaRodada));
    expect(r.map((x) => x.figuras.length)).toEqual([3, 4, 4]);
  });

  it('em toda letra e todo dia: o som dito é o da figura certa, e cada figura é de uma letra e de um som', () => {
    for (const semana of letras) {
      for (let d = 0; d < 20; d++) {
        const rodadas = montarRodadas(letras, semana.id, letras.map((l) => l.id), `dia${d}`);
        for (const r of rodadas) {
          expect(r.figuras).toContain(r.alvo);
          expect(somDe(r.alvo)).toBe(r.som);
          const sons = r.figuras.map(somDe);
          expect(new Set(sons).size).toBe(sons.length);
          expect(new Set(r.figuras).size).toBe(r.figuras.length);
          const donas = r.figuras.map((f) => letras.find((l) => l.figuras.includes(f))!.id);
          expect(new Set(donas).size).toBe(donas.length);
        }
      }
    }
  });

  it('o som dito é o da figura certa: ó com os óculos, ô com ovo e ônibus', () => {
    const r = montarRodadas(letras, 'O', [], 'y');
    for (const x of r) expect(x.som).toBe(x.alvo === 'oculos' ? 'som_o' : 'som_o2');
  });

  it('a letra da semana não repete a figura certa no mesmo dia', () => {
    const [a, , c] = montarRodadas(letras, 'M', [], 'z');
    expect(a!.alvo).not.toBe(c!.alvo);
  });
});
