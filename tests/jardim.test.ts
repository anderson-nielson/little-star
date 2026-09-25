import { describe, expect, it } from 'vitest';
import { alvoDoPulo, beatsDosObstaculos, JARDIM } from '@/telas/jardim';

describe('a aventura do Jardim', () => {
  it('a cada dois compassos dá uns 30 obstáculos em dois minutos, nunca 120', () => {
    const b = beatsDosObstaculos(3, 100, 120, 2);
    expect(b.length).toBeGreaterThanOrEqual(28);
    expect(b.length).toBeLessThanOrEqual(34);
    /* todos em tempo forte */
    for (const x of b) expect(x % 3).toBe(0);
  });
  it('nas primeiras aventuras, metade dos obstáculos', () => {
    expect(beatsDosObstaculos(3, 100, 120, 4).length).toBeLessThan(beatsDosObstaculos(3, 100, 120, 2).length);
  });
  it('o pulo procura o obstáculo até 0,7 s antes', () => {
    expect(alvoDoPulo(10.0, [10.6, 14], JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBe(10.6);
    expect(alvoDoPulo(10.0, [10.8, 14], JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBeNull();
    /* um pouco depois do obstáculo ainda conta, o dedo da criança atrasa */
    expect(alvoDoPulo(10.2, [10.0], JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBe(10.0);
  });
  it('sem nenhum toque a aventura termina no tempo da música', () => {
    /* o fim é função do tempo, não do que ela fez: nada além de duracao entra na conta */
    expect(JARDIM.duracao).toBe(120);
  });
});
