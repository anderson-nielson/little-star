import { describe, expect, it } from 'vitest';
import { estadoNovo, migrar, VERSAO_DO_SAVE, type Canteiro } from '@/core/estado';
import { aventuraDoDia, aventurasAbertas, brincadeiraDoDia, espanholAtivo, tarefasAtivas, LETRAS_PARA_ESPANHOL } from '@/core/laco';
import { climaDoDia, festaDoDia, primeiroDomingoDoAdvento, velasDoAdvento } from '@/core/festas';
import { colher, diasEntre, estagio, plantar, proximaSemente, regar } from '@/core/horta';
import { palavraEmEspanhol } from '@/audio/espanhol';
import frases from '@/data/frases.json';

describe('a segunda semana da casa', () => {
  it('segunda é a comidinha com a mãe', () => {
    const e = estadoNovo();
    e.sessoes = 10;
    expect(brincadeiraDoDia(e, new Date(2026, 8, 14))).toBe('cozinha');
  });
  it('as aventuras abrem uma por vez: jardim, árvore, lago', () => {
    const e = estadoNovo();
    e.sessoes = 3;
    expect(aventurasAbertas(e)).toEqual([]);
    e.sessoes = 6;
    expect(aventurasAbertas(e)).toEqual(['jardim']);
    e.aventuras = 1;
    e.aventurasPor.jardim = 1;
    expect(aventurasAbertas(e)).toEqual(['jardim', 'arvore']);
    expect(aventuraDoDia(e)).toBe('arvore');
    e.aventuras = 2;
    e.aventurasPor.arvore = 1;
    expect(aventurasAbertas(e)).toEqual(['jardim', 'arvore', 'lago']);
    expect(aventuraDoDia(e)).toBe('lago');
    e.aventuras = 5;
    e.aventurasPor.lago = 3;
    expect(['jardim', 'arvore', 'lago']).toContain(aventuraDoDia(e));
  });
  it('o espanhol entra sozinho com os primeiros sons firmes, e os pais mandam', () => {
    const e = estadoNovo();
    expect(espanholAtivo(e)).toBe(false);
    e.letras = ['A', 'E', 'L'].slice(0, LETRAS_PARA_ESPANHOL);
    expect(espanholAtivo(e)).toBe(true);
    e.pais.espanhol = 'desligado';
    expect(espanholAtivo(e)).toBe(false);
    e.letras = [];
    e.pais.espanhol = 'ligado';
    expect(espanholAtivo(e)).toBe(true);
  });
  it('a roda pergunta só as tarefas ligadas, e um save antigo ganha as ligações padrão', () => {
    const e = estadoNovo();
    expect(tarefasAtivas(e)).toEqual(['cama', 'dentes', 'brinquedos', 'banho', 'parquinho']);
    e.pais.tarefas.gentil = true;
    e.pais.tarefas.banho = false;
    expect(tarefasAtivas(e)).toEqual(['cama', 'dentes', 'brinquedos', 'gentil', 'parquinho']);
    const antigo = migrar({ versao: VERSAO_DO_SAVE, pais: { horaDormir: '19:30', tarefas: { quarto: true } } } as unknown as Record<string, unknown>);
    expect(antigo.pais.tarefas.cama).toBe(true);
    expect(antigo.pais.tarefas.quarto).toBe(true);
    expect(antigo.horta).toEqual([null, null, null, null]);
    expect(antigo.companheira).toBe(-1);
  });
  it('toda tarefa nova tem pergunta e comemoração para gravar, e o espanhol tem palavra para cada figura de comida', () => {
    const ids = new Set((frases as { id: string }[]).map((f) => f.id));
    for (const t of ['banho', 'quarto', 'gentil']) {
      expect(ids.has('pergunta_' + t)).toBe(true);
      expect(ids.has('comemora_' + t)).toBe(true);
    }
    for (const f of ['tomate', 'cenoura', 'milho', 'alface', 'lua', 'pinha']) expect(palavraEmEspanhol(f)).toBeTruthy();
    expect(palavraEmEspanhol('coisa-que-nao-existe')).toBeNull();
  });
});

describe('as festas das estações', () => {
  it('o Advento começa quatro domingos antes do Natal e acende uma vela por semana', () => {
    expect(primeiroDomingoDoAdvento(2026).getDay()).toBe(0);
    expect(primeiroDomingoDoAdvento(2026)).toEqual(new Date(2026, 10, 29));
    expect(velasDoAdvento(new Date(2026, 10, 28))).toBe(0);
    expect(velasDoAdvento(new Date(2026, 10, 29))).toBe(1);
    expect(velasDoAdvento(new Date(2026, 11, 13))).toBe(3);
    expect(velasDoAdvento(new Date(2026, 11, 24))).toBe(4);
    expect(velasDoAdvento(new Date(2026, 11, 25))).toBe(0);
    /* quando o Natal cai num domingo, o quarto domingo é o dia 18 */
    expect(primeiroDomingoDoAdvento(2022)).toEqual(new Date(2022, 10, 27));
  });
  it('as festas de data fixa seguem o calendário do hemisfério sul', () => {
    expect(festaDoDia(new Date(2026, 4, 25))).toBe('lanterna');
    expect(festaDoDia(new Date(2026, 5, 20))).toBe('junina');
    expect(festaDoDia(new Date(2026, 8, 22))).toBe('primavera');
    expect(festaDoDia(new Date(2026, 11, 10))).toBe('advento');
    expect(festaDoDia(new Date(2026, 8, 15))).toBeNull();
  });
  it('o clima junta estação e festa, e os pais podem desligar as festas', () => {
    const c = climaDoDia(new Date(2026, 3, 10));
    expect(c.estacao).toBe('outono');
    expect(c.folhas).toBe(true);
    expect(c.festa).toBeNull();
    expect(climaDoDia(new Date(2026, 5, 20), false).festa).toBeNull();
    expect(climaDoDia(new Date(2026, 11, 13)).velas).toBe(3);
  });
});

describe('a horta', () => {
  const c = (plantado: string, regas: string[]): Canteiro => ({ semente: 'cenoura', plantado, regas });
  it('conta os dias entre duas chaves', () => {
    expect(diasEntre('2026-09-14', '2026-09-16')).toBe(2);
    expect(diasEntre('2026-09-30', '2026-10-01')).toBe(1);
  });
  it('cresce com os dias e com a água, e nunca murcha', () => {
    expect(estagio(c('2026-09-14', []), '2026-09-14')).toBe('semente');
    expect(estagio(c('2026-09-14', ['2026-09-14']), '2026-09-14')).toBe('broto');
    expect(estagio(c('2026-09-14', ['2026-09-14']), '2026-09-15')).toBe('planta');
    expect(estagio(c('2026-09-14', ['2026-09-14', '2026-09-15']), '2026-09-16')).toBe('pronta');
    /* sem regar, espera: um mês depois continua broto */
    expect(estagio(c('2026-09-14', []), '2026-10-14')).toBe('broto');
    expect(estagio(c('2026-09-14', ['2026-09-14', '2026-09-15']), '2026-12-16')).toBe('pronta');
  });
  it('plantar, regar uma vez por dia e colher só quando pronta', () => {
    const e = estadoNovo();
    plantar(e, 0, '2026-09-14');
    expect(e.horta[0]?.semente).toBe('cenoura');
    plantar(e, 1, '2026-09-14');
    expect(e.horta[1]?.semente).not.toBe('cenoura');
    expect(regar(e, 0, '2026-09-14')).toBe(true);
    expect(regar(e, 0, '2026-09-14')).toBe(false);
    expect(colher(e, 0, '2026-09-15')).toBeNull();
    regar(e, 0, '2026-09-15');
    expect(colher(e, 0, '2026-09-16')).toBe('cenoura');
    expect(e.horta[0]).toBeNull();
    expect(e.colheita).toEqual(['cenoura']);
  });
  it('a próxima semente não repete o que já está na terra', () => {
    expect(proximaSemente([c('2026-09-14', []), null, null, null], 0)).toBe('tomate');
  });
});
