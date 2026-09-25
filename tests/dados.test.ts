import { describe, expect, it } from 'vitest';
import palavras from '@/data/palavras.json';
import letras from '@/data/letras.json';
import frases from '@/data/frases.json';
import nomes from '@/data/figuras-nomes.json';
import { parseMusica } from '@/audio/musica';
import { readdirSync, readFileSync } from 'node:fs';
import { TODAS_AS_FIGURAS } from '@/puppet/figuras';

const LETRAS_V1 = ['A', 'E', 'L', 'S', 'T', 'O', 'M', 'U', 'I'];

describe('as palavras do fônico', () => {
  it('só usam as letras da v1 (mais o nome dela)', () => {
    for (const p of palavras) {
      if (p.palavra === 'STELLA') continue;
      for (const l of p.palavra.replace('Á', 'A')) expect(LETRAS_V1, p.palavra).toContain(l);
    }
  });
  it('nenhuma tem L no fim da sílaba (soa U), nem TE ou TI (soa tchi), nem O átono final', () => {
    for (const p of palavras) {
      if (p.palavra === 'STELLA') continue;
      expect(p.palavra, `${p.palavra} termina em L`).not.toMatch(/L$/);
      expect(p.palavra, `${p.palavra} tem L antes de consoante`).not.toMatch(/L[^AEIOUÁ]/);
      expect(p.palavra, `${p.palavra} tem TI`).not.toMatch(/TI/);
      expect(p.palavra, `${p.palavra} termina em O átono`).not.toMatch(/O$/);
      expect(p.palavra, `${p.palavra} termina em E átono`).not.toMatch(/E$/);
    }
  });
  it('cada palavra tem figura com nome e sílabas que a recompõem', () => {
    for (const p of palavras) {
      expect((nomes as Record<string, string>)[p.figura], p.figura).toBeTruthy();
      expect(TODAS_AS_FIGURAS, p.figura).toContain(p.figura);
      expect(p.silabas.join('')).toBe(p.palavra);
    }
  });
});

describe('as letras', () => {
  it('vêm na ordem do fônico e cada uma tem som, história, imagem, palavra e três figuras desenhadas', () => {
    expect(letras.map((l) => l.id)).toEqual(LETRAS_V1);
    for (const l of letras) {
      expect(frases.some((f) => f.id === l.som), l.som).toBe(true);
      expect(frases.some((f) => f.id === l.historia), l.historia).toBe(true);
      expect(palavras.some((p) => p.palavra === l.palavra), l.palavra).toBe(true);
      expect(l.figuras.length).toBe(3);
      for (const f of l.figuras) {
        expect(TODAS_AS_FIGURAS, f).toContain(f);
        expect((nomes as Record<string, string>)[f]!.toUpperCase().replace(/[ÁÂÃ]/g, 'A').replace(/[ÉÊ]/g, 'E').replace(/[ÍÎ]/g, 'I').replace(/[ÓÔÕ]/g, 'O').replace(/[ÚÛ]/g, 'U').startsWith(l.id), `${f} começa com ${l.id}`).toBe(true);
      }
    }
  });
});

describe('as frases de voz', () => {
  it('têm ids únicos, dono e umas 50 obrigatórias', () => {
    const ids = new Set(frases.map((f) => f.id));
    expect(ids.size).toBe(frases.length);
    const obrig = frases.filter((f) => f.obrigatoria);
    expect(obrig.length).toBeGreaterThanOrEqual(40);
    expect(obrig.length).toBeLessThanOrEqual(60);
    for (const f of frases) expect(['mae', 'pai', 'theo', 'qualquer']).toContain(f.dono);
  });
  it('as frases da roda e do prato não dizem "hoje": perguntam sobre o que houve desde a última vez', () => {
    for (const f of frases.filter((x) => x.grupo === 'roda' || x.grupo === 'prato')) expect(f.texto.toLowerCase()).not.toContain('hoje');
  });
});

describe('as músicas', () => {
  it('todas parseiam, têm baixo e melodia e compassos inteiros', () => {
    const dir = new URL('../src/data/musicas/', import.meta.url);
    for (const arq of readdirSync(dir)) {
      const m = parseMusica(JSON.parse(readFileSync(new URL(arq, dir), 'utf8')));
      expect(m.notasMelodia.length, arq).toBeGreaterThan(4);
      expect(m.notasBaixo.length, arq).toBeGreaterThan(2);
      const fim = Math.max(...m.notasMelodia.map((n) => n.beat + n.dur));
      expect(Math.abs(fim / m.compasso - Math.round(fim / m.compasso)), `${arq} não fecha o compasso`).toBeLessThan(0.01);
    }
  });
});
