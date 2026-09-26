import { describe, expect, it } from 'vitest';
import { duracaoDoSom, RECEITAS, somDaLetra } from '@/audio/sintese-fonemas';
import frases from '@/data/frases.json';
import letras from '@/data/letras.json';
import palavras from '@/data/palavras.json';

describe('os sons das letras sem gravação', () => {
  it('todo som da lista de gravações tem receita no sintetizador', () => {
    const sons = frases.filter((f) => f.grupo === 'sons').map((f) => f.id);
    expect(sons.length).toBeGreaterThan(20);
    for (const id of sons) expect(RECEITAS[id], id).toBeDefined();
  });
  it('toda letra do caderno e das palavras em destaque tem som, e é o som dela', () => {
    for (const l of letras) expect(somDaLetra(l.id)).toBe(l.som);
    for (const p of palavras) for (const l of p.palavra) expect(somDaLetra(l), `${l} de ${p.palavra}`).not.toBeNull();
  });
  it('o H não tem som, e Á e Ó soam como A e O', () => {
    expect(somDaLetra('H')).toBeNull();
    expect(somDaLetra('Á')).toBe('som_a');
    expect(somDaLetra('Ó')).toBe('som_o');
  });
  it('os que se seguram esticam; os de estalo ficam curtos', () => {
    expect(duracaoDoSom('som_s', 1.6)).toBeCloseTo(duracaoDoSom('som_s') * 1.6);
    expect(duracaoDoSom('som_t', 2)).toBe(duracaoDoSom('som_t'));
    expect(duracaoDoSom('som_t')).toBeLessThan(0.3);
  });
});

describe('a frase de ensinar', () => {
  it('é só o som, o som esticado e a palavra, sem "de" no meio', async () => {
    const { fraseDeEnsinar } = await import('@/audio/fonemas');
    expect(fraseDeEnsinar('som_s', 'sapo')).toBe('{som_s}... {som_s:1.6}... sapo');
  });
});
