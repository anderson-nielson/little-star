import { describe, expect, it } from 'vitest';
import { estadoNovo, abrirDia } from '@/core/estado';
import { partesDaSessao, proximaParte, brincadeiraDoDia, aberto, etapa, luzDaCasa, marcarBrincada, novidade, disponivel, sessaoQueAbre, COISAS } from '@/core/laco';

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

describe('a luz da casa', () => {
  it('na primeira sessão fica no piano e, tocado, passa para a família', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    expect(luzDaCasa(e, dia(15))).toBe('piano');
    expect(novidade(e, 'piano')).toBe(true);
    marcarBrincada(e, 'piano');
    expect(novidade(e, 'piano')).toBe(false);
    expect(e.hoje.brincadas).toEqual(['piano']);
    expect(luzDaCasa(e, dia(15))).toBe('familia');
    marcarBrincada(e, 'familia');
    expect(luzDaCasa(e, dia(15))).toBeNull();
  });

  it('com a casa aberta: a brincadeira do dia, depois o nunca tocado, depois o que falta hoje, depois nada', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 8; d++) e = abrirDia(e, dia(15, 0, d));
    e.letras = ['A'];
    e.visitadas = COISAS.filter((c) => c !== 'lira' && c !== 'horta');
    const hoje = dia(15, 0, 8);
    const doDia = brincadeiraDoDia(e, hoje);
    expect(luzDaCasa(e, hoje)).toBe(doDia);
    marcarBrincada(e, doDia);
    expect(luzDaCasa(e, hoje)).toBe('lira');
    marcarBrincada(e, 'lira');
    expect(luzDaCasa(e, hoje)).toBe('horta');
    marcarBrincada(e, 'horta');
    const resto = COISAS.filter((c) => !e.hoje.brincadas.includes(c));
    expect(luzDaCasa(e, hoje)).toBe(resto[0]);
    for (const c of COISAS) marcarBrincada(e, c);
    expect(luzDaCasa(e, hoje)).toBeNull();
    expect(new Set(e.hoje.brincadas).size).toBe(COISAS.length);
  });

  it('o que foi hoje some amanhã, mas o visitado fica', () => {
    let e = abrirDia(estadoNovo(dia(15)), dia(15));
    marcarBrincada(e, 'piano');
    e = abrirDia(e, dia(15, 0, 16));
    expect(e.hoje.brincadas).toEqual([]);
    expect(e.visitadas).toEqual(['piano']);
    expect(novidade(e, 'piano')).toBe(false);
  });

  it('o bilhete só espera por ela depois da primeira letra; a família sempre', () => {
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 2; d++) e = abrirDia(e, dia(15, 0, d));
    expect(disponivel(e, 'bilhete')).toBe(false);
    e.letras = ['S'];
    expect(disponivel(e, 'bilhete')).toBe(true);
    expect(disponivel(e, 'familia')).toBe(true);
    expect(disponivel(e, 'jardim')).toBe(false);
    expect(sessaoQueAbre('jardim')).toBe(4);
    expect(sessaoQueAbre('familia')).toBe(1);
  });
});
