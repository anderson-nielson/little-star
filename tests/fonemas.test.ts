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

describe('o som certo em cada palavra e figura', () => {
  it('a lista de sons de uma palavra tem um som (ou null) por letra, e cada som existe', () => {
    for (const p of palavras as { palavra: string; sons?: (string | null)[] }[]) {
      if (!p.sons) continue;
      expect(p.sons.length, p.palavra).toBe([...p.palavra].length);
      for (const s of p.sons) if (s) expect(RECEITAS[s], `${s} de ${p.palavra}`).toBeDefined();
    }
  });
  it('a frase de ensinar só usa figura que começa com o som ensinado', async () => {
    const { figuraDoSom, fraseDeEnsinar } = await import('@/audio/fonemas');
    const o = letras.find((l) => l.id === 'O')!;
    const e = letras.find((l) => l.id === 'E')!;
    /* ovo, olho e onda começam com ô: o ó aberto fica sem figura */
    expect(figuraDoSom(o.som, o.figuras)).toBeNull();
    expect(fraseDeEnsinar(o.som, null)).toBe('{som_o}... {som_o:1.6}');
    expect(figuraDoSom(e.som, e.figuras)).toBe('egua');
  });
});
