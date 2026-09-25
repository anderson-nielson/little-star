import { describe, expect, it } from 'vitest';
import { caixaDaLetra, dentroDoPoligono, ESTRELA, FOLGA_DA_LETRA, LADO_MAXIMO, LADO_MINIMO, verticesDaEstrela } from '@/core/areia';
import { pontosDoTraco, type TracoDado } from '@/core/fita';
import letrasJson from '@/data/letras.json';

const letras = letrasJson as unknown as { id: string; tracos: TracoDado[] }[];

describe('a caixa de areia em estrela', () => {
  it('toda letra cabe inteira na areia, com folga para o sulco do dedo', () => {
    const areia = verticesDaEstrela(ESTRELA.areia);
    for (const l of letras) {
      const c = caixaDaLetra(l.tracos);
      expect(c.lado, l.id).toBeGreaterThanOrEqual(LADO_MINIMO);
      expect(c.lado, l.id).toBeLessThanOrEqual(LADO_MAXIMO);
      for (const t of l.tracos)
        for (const p of pontosDoTraco(t)) {
          const x = c.x + p[0] * c.lado;
          const y = c.y + p[1] * c.lado;
          expect(dentroDoPoligono([x, y], areia), `${l.id} ${x},${y}`).toBe(true);
          expect(dentroDoPoligono([x - FOLGA_DA_LETRA, y], areia), l.id).toBe(true);
          expect(dentroDoPoligono([x + FOLGA_DA_LETRA, y], areia), l.id).toBe(true);
          expect(dentroDoPoligono([x, y - FOLGA_DA_LETRA], areia), l.id).toBe(true);
          expect(dentroDoPoligono([x, y + FOLGA_DA_LETRA], areia), l.id).toBe(true);
        }
    }
  });
  it('a caixa fica centrada na estrela, e uma letra fina em cima (o A) cabe grande', () => {
    const a = caixaDaLetra(letras.find((l) => l.id === 'A')!.tracos);
    expect(a.x + a.lado / 2).toBe(ESTRELA.cx);
    expect(a.lado).toBeGreaterThanOrEqual(200);
    /* uma letra larga em cima, como o T, precisa ficar menor: a estrela é fina lá em cima */
    const t = caixaDaLetra(letras.find((l) => l.id === 'T')!.tracos);
    expect(t.lado).toBeLessThan(a.lado);
  });
  it('o miolo da estrela está dentro e a ponta de fora', () => {
    const areia = verticesDaEstrela(ESTRELA.areia);
    expect(dentroDoPoligono([ESTRELA.cx, ESTRELA.cy], areia)).toBe(true);
    expect(dentroDoPoligono([ESTRELA.cx, ESTRELA.cy + 220], areia)).toBe(false);
    expect(dentroDoPoligono([2, 2], areia)).toBe(false);
  });
});
