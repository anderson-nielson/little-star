import { describe, expect, it } from 'vitest';
import { estadoNovo, migrar, VERSAO_DO_SAVE } from '@/core/estado';
import { ganhar, PEDRINHAS, perder } from '@/core/pedrinhas';
import { anunciar, aoAnunciar, AVANCOS_NARRADOS, frasesDe, narracao, vezesNoHistorico } from '@/core/narracao';

/** todo motivo que o jogo dá a `ganhar`, mais os momentos sem pedrinha */
const MOTIVOS_DO_JOGO = ['cama', 'dentes', 'brinquedos', 'banho', 'quarto', 'gentil', 'dormiu_sozinha', 'noite_toda', 'letra', 'areia', 'palavra', 'som', 'relogio', 'colheita', 'comidinha', 'aventura', 'medalha', 'chegada', 'bilhete', 'bichos', 'despedida', 'boa_noite'];

describe('a narração para quem joga junto', () => {
  it('todo avanço do jogo tem pelo menos três frases, e elas se revezam sem repetir de imediato', () => {
    for (const m of MOTIVOS_DO_JOGO) {
      expect(AVANCOS_NARRADOS, m).toContain(m);
      const f = frasesDe(m);
      expect(f.length, m).toBeGreaterThanOrEqual(3);
      expect(narracao(m, 0)).toBe(f[0]);
      expect(narracao(m, 1)).toBe(f[1]);
      expect(narracao(m, f.length)).toBe(f[0]);
      expect(narracao(m, -1)).toBe(f[f.length - 1]);
    }
  });
  it('um avanço sem frase fica em silêncio (o rolar da pedrinha, os ajustes dos pais)', () => {
    expect(narracao('nao_cama')).toBeNull();
    expect(narracao('pais_deram')).toBeNull();
    expect(narracao('confirmou_cama')).toBeNull();
  });
  it('as frases são curtas, para ler em voz alta, sem travessão, e nunca comparam nem cobram', () => {
    for (const m of AVANCOS_NARRADOS) {
      for (const f of frasesDe(m)) {
        expect(f.length, f).toBeLessThanOrEqual(160);
        expect(f, f).not.toMatch(/—/);
        expect(f.toLowerCase(), f).not.toMatch(/melhor que|melhor do que|pior|errad|feio|mais que o theo|igual ao theo|tem que|precisa ser/);
        expect(f.trim().endsWith('.') || f.trim().endsWith('!'), f).toBe(true);
      }
    }
  });
  it('o Theo aparece como quem torce por ela em cada avanço, e a família em todos', () => {
    for (const m of MOTIVOS_DO_JOGO) {
      const todas = frasesDe(m).join(' ').toLowerCase();
      expect(todas, m).toMatch(/theo/);
      expect(todas, m).toMatch(/mamãe|papai|família|casa/);
    }
  });
  it('ganhar anuncia o avanço, com o pote ligado ou desligado; perder não anuncia', () => {
    const e = estadoNovo();
    const ouvidos: string[] = [];
    const parar = aoAnunciar((a) => ouvidos.push(a));
    ganhar(e, PEDRINHAS.letra, 'letra');
    e.pais.pedrinhas = false;
    ganhar(e, PEDRINHAS.som, 'som');
    e.pais.pedrinhas = true;
    perder(e, 1, 'nao_cama');
    expect(ouvidos).toEqual(['letra', 'som']);
    parar();
    anunciar('cama');
    expect(ouvidos).toEqual(['letra', 'som']);
  });
  it('o pote cheio anuncia a medalha depois do avanço', () => {
    const e = estadoNovo();
    const ouvidos: string[] = [];
    aoAnunciar((a) => ouvidos.push(a));
    ganhar(e, PEDRINHAS.pote, 'cama');
    expect(ouvidos.slice(-2)).toEqual(['cama', 'medalha']);
  });
  it('a vez de cada avanço vem do histórico, só do que se ganhou', () => {
    const e = estadoNovo();
    ganhar(e, 1, 'cama');
    ganhar(e, 1, 'cama');
    perder(e, 1, 'cama');
    expect(vezesNoHistorico(e, 'cama')).toBe(2);
    expect(vezesNoHistorico(e, 'dentes')).toBe(0);
  });
  it('um save antigo chega com a narração ligada', () => {
    const e = migrar({ versao: VERSAO_DO_SAVE, pais: { pedrinhas: true } } as unknown as Record<string, unknown>);
    expect(e.pais.narracao).toBe(true);
  });
});
