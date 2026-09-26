import { describe, expect, it } from 'vitest';
import { duracaoMaxima, espacoEmCompassos, fimDoPulo, JARDIM, obstaculosDoCaminho } from '@/telas/jardim';

describe('a aventura do Jardim', () => {
  const espaco = (n: number) => espacoEmCompassos(n, 3, 100, JARDIM.velocidade);
  it('a cada dois compassos dá uns oito obstáculos na ida, e o caminho de volta é o mesmo', () => {
    const o = obstaculosDoCaminho(JARDIM.caminho, espaco(2));
    expect(o.length).toBeGreaterThanOrEqual(6);
    expect(o.length).toBeLessThanOrEqual(10);
    /* folga na porta de casa e perto do coelhinho */
    expect(o[0]).toBeGreaterThanOrEqual(1);
    expect(o[o.length - 1]).toBeLessThanOrEqual(JARDIM.caminho - 1);
  });
  it('nas primeiras aventuras, metade dos obstáculos', () => {
    expect(obstaculosDoCaminho(JARDIM.caminho, espaco(4)).length).toBeLessThan(obstaculosDoCaminho(JARDIM.caminho, espaco(2)).length);
  });
  it('o pulo sai na hora do toque e estica para passar o obstáculo que chega em até 0,7 s', () => {
    expect(fimDoPulo(10, null, JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBeCloseTo(10 + JARDIM.duracaoDoPulo);
    /* o obstáculo chega depois do pouso normal: o pulo espera por ele */
    expect(fimDoPulo(10, 0.7, JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBeCloseTo(10.9);
    /* longe demais: pulinho normal, e ela escorrega se não pular de novo */
    expect(fimDoPulo(10, 0.9, JARDIM.janelaDoPulo, JARDIM.duracaoDoPulo)).toBeCloseTo(10 + JARDIM.duracaoDoPulo);
  });
  it('sem nenhum toque ela escorrega em tudo e ainda assim chega em casa em menos de dois minutos e meio', () => {
    const n = obstaculosDoCaminho(JARDIM.caminho, espaco(2)).length;
    expect(duracaoMaxima(JARDIM.caminho, JARDIM.velocidade, n, JARDIM.queda, JARDIM.encontro)).toBeLessThan(150);
  });
});
