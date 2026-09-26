import { describe, expect, it } from 'vitest';
import { ARVORE } from '@/telas/arvoregrande';
import { LAGO, posicaoNaFaixa, proximoEncontro, type Faixa } from '@/telas/lago';
import { beatsDosObstaculos } from '@/telas/jardim';
import { ACORDES, AFINACAO, CASAS } from '@/telas/ukulele';
import { cordaAmostras, freq } from '@/audio/synth';

describe('a Árvore Grande', () => {
  it('as pinhas chegam no tempo forte, e menos nas primeiras aventuras', () => {
    const normal = beatsDosObstaculos(4, 112, ARVORE.duracao, ARVORE.compassosPorPinha);
    const inicio = beatsDosObstaculos(4, 112, ARVORE.duracao, ARVORE.compassosPorPinhaInicio);
    expect(normal.length).toBeGreaterThan(inicio.length);
    for (const b of normal) expect(b % 4).toBe(0);
  });
  it('termina no tempo da música, com ou sem toque', () => {
    expect(ARVORE.duracao).toBe(120);
  });
});

describe('o Lago dos Cisnes', () => {
  const f: Faixa = { velocidade: 0.05, amplitude: 0.5, fase: 0, dir: 1 };
  it('a plataforma vai e volta e nunca sai da tela', () => {
    for (let t = 0; t < 60; t += 0.25) {
      const x = posicaoNaFaixa(f, t);
      expect(x).toBeGreaterThanOrEqual(0.25 - 1e-9);
      expect(x).toBeLessThanOrEqual(0.75 + 1e-9);
    }
    expect(posicaoNaFaixa(f, 0)).toBeCloseTo(0.25);
    expect(posicaoNaFaixa(f, 10)).toBeCloseTo(0.75);
  });
  it('o pulo espera a plataforma passar embaixo dela, dentro da janela', () => {
    /* em t = 0 a plataforma está em 0,25 e anda 0,05 por segundo: chega em 0,5 aos 5 s */
    expect(proximoEncontro(f, 0.5, 0, LAGO.janelaDoPulo, LAGO.largura)).toBeNull();
    const enc = proximoEncontro(f, 0.5, 4.5, LAGO.janelaDoPulo, LAGO.largura);
    expect(enc).not.toBeNull();
    expect(enc!).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(posicaoNaFaixa(f, enc!) - 0.5)).toBeLessThan(LAGO.largura * 0.45);
  });
  it('tem cinco faixas e um coreto de seis luzes', () => {
    expect(LAGO.velocidades).toHaveLength(LAGO.faixas);
    expect(LAGO.partesDoCoreto).toBe(6);
  });
});

describe('o ukulele', () => {
  it('tem quatro cordas, afinadas em sol, dó, mi e lá (a afinação padrão, reentrante)', () => {
    expect(AFINACAO).toEqual([67, 60, 64, 69]);
  });
  it('tem os sete acordes do campo harmônico de dó, cada um na sua fundamental e com a sua cor', () => {
    expect(ACORDES).toHaveLength(7);
    const graus = [0, 2, 4, 5, 7, 9, 11];
    ACORDES.forEach((a, i) => expect(a.notas.some((n) => n % 12 === graus[i])).toBe(true));
    expect(new Set(ACORDES.map((a) => a.cor)).size).toBe(7);
  });
  it('cada acorde é a tríade do seu grau: as notas são a fundamental, a terça e a quinta, nada mais', () => {
    const triades = [[0, 4, 7], [2, 5, 9], [4, 7, 11], [5, 9, 0], [7, 11, 2], [9, 0, 4], [11, 2, 5]];
    ACORDES.forEach((a, i) => {
      const classes = new Set(a.notas.map((n) => n % 12));
      expect([...classes].sort()).toEqual([...triades[i]!].sort());
    });
  });
  it('as posições são as dos métodos: C 0003, Dm 2210, Em 0432, F 2010, G 0232, Am 2000, B° 4212', () => {
    expect(ACORDES.map((a) => a.casas.join(''))).toEqual(['0003', '2210', '0432', '2010', '0232', '2000', '4212']);
  });
  it('a corda sintetizada soa na altura certa: menos de 2 cents de erro em cada nota do ukulele', () => {
    const notas = new Set([...AFINACAO, ...ACORDES.flatMap((a) => a.notas)]);
    for (const sr of [44100, 48000]) {
      for (const m of notas) {
        const d = cordaAmostras(sr, m, 0.8);
        const f0 = freq(m);
        const ini = Math.floor(sr * 0.2);
        const len = Math.floor(sr * 0.4);
        const r = (l: number) => {
          let c = 0;
          for (let i = ini; i < ini + len; i++) c += d[i]! * d[i + l]!;
          return c;
        };
        let melhor = 0;
        let lag = 0;
        for (let l = Math.floor((sr / f0) * 0.9); l <= Math.ceil((sr / f0) * 1.1); l++) {
          const c = r(l);
          if (c > melhor) [melhor, lag] = [c, l];
        }
        const [a, b, c] = [r(lag - 1), r(lag), r(lag + 1)];
        const f = sr / (lag + (0.5 * (a - c)) / (a - 2 * b + c));
        expect(Math.abs(1200 * Math.log2(f / f0))).toBeLessThan(2);
      }
    }
  });
  it('cada acorde tem quatro cordas e só notas do tom: nenhuma combinação soa feia', () => {
    const doMaior = new Set([0, 2, 4, 5, 7, 9, 11]);
    for (const a of ACORDES) {
      expect(a.notas).toHaveLength(4);
      for (const n of a.notas) expect(doMaior.has(n % 12)).toBe(true);
    }
  });
  it('cada nota de acorde é a corda solta ou até quatro casas acima: posições de ukulele de verdade', () => {
    for (const a of ACORDES) {
      a.notas.forEach((n, i) => {
        const casa = n - AFINACAO[i]!;
        expect(casa).toBeGreaterThanOrEqual(0);
        expect(casa).toBeLessThanOrEqual(CASAS);
      });
    }
  });
});
