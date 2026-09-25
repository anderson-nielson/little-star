import { describe, expect, it } from 'vitest';
import { estadoNovo, abrirDia } from '@/core/estado';
import { partesDaSessao, proximaParte, brincadeiraDoDia, aberto, etapa, passouDoLimite, podeReabrir } from '@/core/laco';

const dia = (h: number, m = 0, d = 15) => new Date(2026, 8, d, h, m);

describe('o laço da sessão', () => {
  it('na primeira sessão só existem chegada, casa e despedida', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    expect(e.sessoes).toBe(1);
    expect(partesDaSessao(e, dia(15))).toEqual(['chegada', 'casa', 'despedida']);
  });

  it('a forma nunca muda: as partes que existem vêm sempre na mesma ordem', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 8; d++) e = abrirDia(e, dia(15, 0, d));
    expect(e.sessoes).toBe(8);
    expect(partesDaSessao(e, dia(15, 0, 8))).toEqual(['chegada', 'roda', 'prato', 'som', 'casa', 'bichos', 'despedida']);
  });

  it('a segunda abertura no mesmo dia pula o que já aconteceu hoje', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 8; d++) e = abrirDia(e, dia(15, 0, d));
    e.hoje.rodaFeita = true;
    e.hoje.pratoFeito = true;
    e.hoje.somFeito = true;
    e = abrirDia(e, dia(16, 0, 8));
    expect(e.hoje.aberturas).toBe(2);
    expect(partesDaSessao(e, dia(16, 0, 8))).toEqual(['chegada', 'casa', 'bichos', 'despedida']);
  });

  it('uma sessão terminada abre a etapa seguinte no mesmo dia', () => {
    let e = estadoNovo(dia(15));
    e = abrirDia(e, dia(15));
    expect(etapa(e)).toBe(1);
    expect(partesDaSessao(e, dia(15))).toEqual(['chegada', 'casa', 'despedida']);
    e.sessoesCompletas = 1;
    e = abrirDia(e, dia(16));
    expect(etapa(e)).toBe(2);
    expect(partesDaSessao(e, dia(16))).toEqual(['chegada', 'roda', 'som', 'casa', 'bichos', 'despedida']);
    expect(brincadeiraDoDia(e, dia(16))).toBe('caderno');
    /* dias de jogo continuam valendo: o que for maior */
    e.sessoes = 5;
    expect(etapa(e)).toBe(5);
  });

  it('o que já aconteceu hoje não volta, e nada do que cresceu se perde num dia novo', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 8; d++) e = abrirDia(e, dia(15, 0, d));
    e.hoje.rodaFeita = true;
    e.lembrancas.push('cama:x');
    expect(partesDaSessao(e, dia(15, 0, 8))).not.toContain('roda');
    const amanha = abrirDia(e, dia(15, 0, 9));
    expect(amanha.hoje.rodaFeita).toBe(false);
    expect(amanha.lembrancas).toEqual(['cama:x']);
    expect(amanha.sessoes).toBe(9);
  });

  it('meia hora antes de dormir só existe a noite; depois, dormindo', () => {
    let e = estadoNovo(dia(15));
    e = abrirDia(e, dia(19, 40));
    expect(partesDaSessao(e, dia(19, 40))).toEqual(['noite']);
    expect(partesDaSessao(e, dia(20, 5))).toEqual(['dormindo']);
    expect(partesDaSessao(e, dia(3, 0))).toEqual(['dormindo']);
  });

  it('o prato desligado some do laço', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 8; d++) e = abrirDia(e, dia(15, 0, d));
    e.pais.pratoLigado = false;
    expect(partesDaSessao(e, dia(15, 0, 8))).not.toContain('prato');
  });

  it('a próxima parte segue a lista e termina em null', () => {
    const partes = partesDaSessao(abrirDia(estadoNovo(), dia(15)), dia(15));
    expect(proximaParte(partes, 'chegada')).toBe('casa');
    expect(proximaParte(partes, 'despedida')).toBeNull();
  });

  it('as primeiras sessões abrem a casa aos poucos e da quinta em diante tudo', () => {
    expect(aberto(1, 'piano')).toBe(true);
    expect(aberto(1, 'roda')).toBe(false);
    expect(aberto(2, 'roda')).toBe(true);
    expect(aberto(2, 'coelho')).toBe(true);
    expect(aberto(3, 'jardim')).toBe(false);
    expect(aberto(4, 'jardim')).toBe(true);
    expect(aberto(9, 'qualquer coisa')).toBe(true);
  });

  it('a brincadeira do dia é a coisa nova na primeira semana e o ritmo da semana depois', () => {
    const e = estadoNovo();
    e.sessoes = 2;
    expect(brincadeiraDoDia(e, dia(15))).toBe('caderno');
    e.sessoes = 4;
    expect(brincadeiraDoDia(e, dia(15))).toBe('jardim');
    e.sessoes = 10;
    expect(brincadeiraDoDia(e, new Date(2026, 8, 15))).toBe('caderno'); // terça
    expect(brincadeiraDoDia(e, new Date(2026, 8, 19))).toBe('jardim'); // sábado
    expect(brincadeiraDoDia(e, new Date(2026, 8, 20))).toBe('familia'); // domingo
  });
});

describe('a porta fechada da despedida', () => {
  it('um toque reabre enquanto ainda há dia de tela', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    e.hoje.segundos = 10 * 60;
    expect(passouDoLimite(e)).toBe(false);
    expect(podeReabrir(e, dia(15))).toBe(true);
  });

  it('passado o limite do dia, a porta fica fechada: reabrir iria da chegada direto para outra despedida', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    e.hoje.segundos = 15 * 60;
    expect(passouDoLimite(e)).toBe(true);
    expect(podeReabrir(e, dia(19, 15))).toBe(false);
  });

  it('a rotina da noite nunca é barrada pelo limite', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    e.hoje.segundos = 40 * 60;
    expect(podeReabrir(e, dia(19, 45))).toBe(true);
    expect(podeReabrir(e, dia(20, 30))).toBe(true);
    expect(partesDaSessao(e, dia(19, 45))).toEqual(['noite']);
  });
});
