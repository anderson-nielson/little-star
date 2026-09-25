import { describe, expect, it } from 'vitest';
import { Tracado, pontoEm, pontosDoTraco, type TracoDado } from '@/core/fita';
import letras from '@/data/letras.json';

/** Um dedo que segue a fita com um erro constante ao lado. */
function seguir(t: Tracado, erro: number, passos = 80): void {
  while (!t.completa) {
    const f = t.fita;
    const antes = t.traco;
    const inicio = t.cheio[t.traco]!;
    for (let k = 0; k <= passos; k++) {
      const u = inicio + ((1 - inicio) * k) / passos;
      const p = pontoEm(f, u);
      t.mover([p[0] + erro, p[1] + erro * 0.3]);
      if (t.traco !== antes) break;
    }
    if (t.traco === antes) break;
    t.soltar();
  }
}

describe('o traçado da letra pela fita', () => {
  const tracos = (id: string) => (letras as unknown as { id: string; tracos: TracoDado[] }[]).find((l) => l.id === id)!.tracos;

  it('um dedo que segue a fita com 40 px de erro (0,1 da caixa) completa a letra', () => {
    for (const id of ['A', 'E', 'O', 'S', 'L', 'M', 'U', 'I', 'T']) {
      const t = new Tracado(tracos(id), 0.14);
      seguir(t, 0.1);
      expect(t.completa, `letra ${id}`).toBe(true);
    }
  });

  it('um dedo parado não completa nada', () => {
    const t = new Tracado(tracos('L'), 0.14);
    for (let i = 0; i < 50; i++) t.mover([0.28, 0.06]);
    expect(t.completa).toBe(false);
    expect(t.cheio[0]).toBeLessThan(0.1);
  });

  it('tirar o dedo não apaga o que já encheu', () => {
    const t = new Tracado(tracos('I'), 0.14);
    for (let k = 0; k <= 20; k++) t.mover([0.5, 0.06 + (0.88 * k) / 40]);
    const meio = t.cheio[0]!;
    expect(meio).toBeGreaterThan(0.3);
    t.soltar();
    t.comecar([0.5, 0.5]);
    expect(t.cheio[0]).toBe(meio);
  });

  it('longe da fita, o dedo não conta; com a ajuda A2, a fita enche mesmo assim', () => {
    const t = new Tracado(tracos('I'), 0.14);
    for (let k = 0; k <= 20; k++) t.mover([0.9, 0.06 + (0.88 * k) / 20]);
    expect(t.cheio[0]).toBeLessThan(0.1);
    const g = new Tracado(tracos('I'), 0.14);
    for (let k = 0; k <= 200; k++) g.mover([0.9, 0.06 + (0.88 * (k % 21)) / 20], true);
    expect(g.completa).toBe(true);
  });

  it('o círculo do O começa em cima e roda para a esquerda', () => {
    const ps = pontosDoTraco(['circulo', 0.5, 0.5, 0.4]);
    expect(ps[0]![1]).toBeCloseTo(0.1, 5);
    expect(ps[10]![0]).toBeLessThan(0.5);
  });

  it('os traços de toda letra têm começo e fim distintos e cabem na caixa', () => {
    for (const l of letras as unknown as { id: string; tracos: TracoDado[] }[]) {
      for (const t of l.tracos) {
        const ps = pontosDoTraco(t);
        expect(ps.length).toBeGreaterThan(2);
        for (const p of ps) {
          expect(p[0]).toBeGreaterThanOrEqual(-0.05);
          expect(p[0]).toBeLessThanOrEqual(1.05);
          expect(p[1]).toBeGreaterThanOrEqual(-0.1);
          expect(p[1]).toBeLessThanOrEqual(1.1);
        }
      }
    }
  });
});
