import { describe, expect, it } from 'vitest';
import { estadoNovo, migrar, abrirDia, VERSAO_DO_SAVE } from '@/core/estado';
import { Ajuda, SEGUNDOS_PARA_A1, SEGUNDOS_PARA_A2 } from '@/core/ajuda';

describe('o estado', () => {
  it('um save antigo com campos faltando ganha os padrões', () => {
    const e = migrar({ versao: VERSAO_DO_SAVE, letras: ['A'], pais: { horaDormir: '19:30' } } as unknown as Record<string, unknown>);
    expect(e.letras).toEqual(['A']);
    expect(e.pais.horaDormir).toBe('19:30');
    expect(e.pais.limiteMin).toBe(15);
    expect(e.flores).toEqual([]);
    expect(e.hoje.brincadas).toEqual([]);
    expect(e.visitadas).toEqual([]);
  });
  it('cada tarefa vale uma vez por dia e nada se perde', () => {
    let e = estadoNovo(new Date(2026, 8, 1, 10));
    e = abrirDia(e, new Date(2026, 8, 1, 10));
    e.hoje.roda.cama = true;
    e = abrirDia(e, new Date(2026, 8, 1, 18));
    expect(e.hoje.roda.cama).toBe(true);
    e = abrirDia(e, new Date(2026, 8, 2, 10));
    expect(e.hoje.roda.cama).toBeUndefined();
  });
});

describe('a ajuda invisível', () => {
  it('sobe com o tempo parada e zera a cada etapa', () => {
    const niveis: number[] = [];
    const a = new Ajuda((n) => niveis.push(n));
    for (let i = 0; i < SEGUNDOS_PARA_A1; i++) a.tick(1);
    expect(a.nivel).toBe(1);
    for (let i = SEGUNDOS_PARA_A1; i < SEGUNDOS_PARA_A2; i++) a.tick(1);
    expect(a.nivel).toBe(2);
    a.reset();
    expect(a.nivel).toBe(0);
    expect(niveis).toEqual([1, 2, 0]);
  });
  it('sobe com tentativas sem completar e não desce quando ela toca', () => {
    const a = new Ajuda();
    a.tentativa();
    a.tentativa();
    expect(a.nivel).toBe(1);
    a.tocou();
    expect(a.nivel).toBe(1);
    a.tentativa();
    a.tentativa();
    expect(a.nivel).toBe(2);
  });
});
