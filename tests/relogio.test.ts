import { describe, expect, it } from 'vitest';
import { chaveDaSemana, chaveDoDia, estacao, periodo, ceuDaHora } from '@/core/relogio';

describe('o relógio da casa', () => {
  it('a chave do dia é local e com zeros', () => {
    expect(chaveDoDia(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('a semana começa na segunda', () => {
    expect(chaveDaSemana(new Date(2026, 8, 20))).toBe('2026-09-14'); // domingo pertence à semana da segunda 14
    expect(chaveDaSemana(new Date(2026, 8, 21))).toBe('2026-09-21');
  });
  it('o período respeita a hora de dormir dos pais', () => {
    expect(periodo(new Date(2026, 8, 15, 9), '20:00')).toBe('manha');
    expect(periodo(new Date(2026, 8, 15, 16), '20:00')).toBe('tarde');
    expect(periodo(new Date(2026, 8, 15, 19, 31), '20:00')).toBe('noite');
    expect(periodo(new Date(2026, 8, 15, 20, 0), '20:00')).toBe('dormindo');
    expect(periodo(new Date(2026, 8, 15, 5, 0), '20:00')).toBe('dormindo');
    expect(periodo(new Date(2026, 8, 15, 19, 31), '21:00')).toBe('tarde');
  });
  it('as estações são do hemisfério sul', () => {
    expect(estacao(new Date(2026, 0, 10))).toBe('verao');
    expect(estacao(new Date(2026, 3, 10))).toBe('outono');
    expect(estacao(new Date(2026, 6, 10))).toBe('inverno');
    expect(estacao(new Date(2026, 9, 10))).toBe('primavera');
  });
  it('o céu segue a hora', () => {
    expect(ceuDaHora(new Date(2026, 8, 15, 10))).toBe('ceu-dia');
    expect(ceuDaHora(new Date(2026, 8, 15, 17))).toBe('ceu-tarde');
    expect(ceuDaHora(new Date(2026, 8, 15, 21))).toBe('ceu-noite');
  });
});
