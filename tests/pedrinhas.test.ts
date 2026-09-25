import { describe, expect, it } from 'vitest';
import { estadoNovo, migrar, VERSAO_DO_SAVE } from '@/core/estado';
import { ajustar, ganhar, PEDRINHAS, perder } from '@/core/pedrinhas';
import { acertou, anguloDaHora, fraseDaHora, fraseDaHoraReal, horaDoAngulo } from '@/telas/relogio';

describe('o pote de pedrinhas', () => {
  it('ganha e anota o motivo; o pote cheio vira medalha e nunca se perde', () => {
    const e = estadoNovo();
    expect(ganhar(e, PEDRINHAS.letra, 'letra')).toBe(0);
    expect(e.pedrinhas).toBe(3);
    expect(e.pedrinhasHistorico.at(-1)).toMatchObject({ delta: 3, motivo: 'letra' });
    expect(ganhar(e, PEDRINHAS.pote, 'x')).toBe(1);
    expect(e.medalhas).toBe(1);
    expect(e.pedrinhas).toBe(3);
    perder(e, 99, 'y');
    expect(e.medalhas).toBe(1);
  });
  it('perde só até zero, e só se os pais deixarem', () => {
    const e = estadoNovo();
    ganhar(e, 2, 'tarefa');
    expect(perder(e, 5, 'nao_fez')).toBe(2);
    expect(e.pedrinhas).toBe(0);
    expect(perder(e, 1, 'nao_fez')).toBe(0);
    ganhar(e, 2, 'tarefa');
    e.pais.perdePedrinhas = false;
    expect(perder(e, 1, 'nao_fez')).toBe(0);
    expect(e.pedrinhas).toBe(2);
    e.pais.pedrinhas = false;
    expect(ganhar(e, 5, 'tarefa')).toBe(0);
    expect(e.pedrinhas).toBe(2);
  });
  it('os pais ajustam para os dois lados, com motivo, e o ajuste para baixo respeita o zero', () => {
    const e = estadoNovo();
    ajustar(e, 1, 'se vestiu sozinha');
    ajustar(e, -3, 'combinado');
    expect(e.pedrinhas).toBe(0);
    expect(e.pedrinhasHistorico.map((r) => r.delta)).toEqual([1, -1]);
  });
  it('dormir sozinha vale mais que uma tarefa, e a noite toda é bônus', () => {
    expect(PEDRINHAS.dormiuSozinha).toBeGreaterThan(PEDRINHAS.tarefa);
    expect(PEDRINHAS.noiteToda).toBeGreaterThan(0);
    expect(PEDRINHAS.letra).toBeGreaterThan(PEDRINHAS.tarefa);
  });
  it('um save antigo ganha o pote vazio e a noite toda por responder', () => {
    const e = migrar({ versao: VERSAO_DO_SAVE, hoje: { dia: '2026-09-01', noite: true } } as unknown as Record<string, unknown>);
    expect(e.pedrinhas).toBe(0);
    expect(e.medalhas).toBe(0);
    expect(e.hoje.noite).toBe(true);
    expect(e.hoje.noiteToda).toBeNull();
    expect(e.pais.pedrinhas).toBe(true);
  });
});

describe('o relógio', () => {
  it('o ângulo vira hora e volta', () => {
    expect(horaDoAngulo(0)).toBe(12);
    expect(horaDoAngulo(90)).toBe(3);
    expect(horaDoAngulo(-90)).toBe(9);
    expect(anguloDaHora(6)).toBe(180);
    expect(anguloDaHora(12)).toBe(0);
  });
  it('meia hora de tolerância, dando a volta no mostrador', () => {
    expect(acertou(3.4, 3)).toBe(true);
    expect(acertou(3.6, 3)).toBe(false);
    expect(acertou(11.7, 12)).toBe(true);
    expect(acertou(0.3, 12)).toBe(true);
  });
  it('fala a hora como a gente fala', () => {
    expect(fraseDaHora(1)).toBe('é uma hora');
    expect(fraseDaHora(3)).toBe('são três horas');
    expect(fraseDaHora(12)).toBe('são doze horas');
  });
  it('a hora de verdade nunca arredonda para cima: passou, e meia, quase', () => {
    expect(fraseDaHoraReal(6, 2)).toBe('são seis horas');
    expect(fraseDaHoraReal(6, 12)).toBe('passou das seis');
    expect(fraseDaHoraReal(6, 30)).toBe('são seis e meia');
    expect(fraseDaHoraReal(6, 40)).toBe('são quase sete horas');
    expect(fraseDaHoraReal(12, 50)).toBe('é quase uma hora');
    expect(fraseDaHoraReal(1, 10)).toBe('passou da uma');
    expect(fraseDaHoraReal(1, 33)).toBe('é uma e meia');
  });
});
