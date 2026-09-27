import { describe, expect, it } from 'vitest';
import { CHAMADOS_POR_TELA, RelogioDoChamado } from '@/core/chamado';
import { estadoNovo, migrar } from '@/core/estado';

describe('o chamado quando ela fica parada', () => {
  const passar = (r: RelogioDoChamado, s: number) => {
    let chamou = 0;
    for (let i = 0; i < s; i++) if (r.tick(1)) chamou += 1;
    return chamou;
  };

  it('chama depois do tempo escolhido, não antes', () => {
    const r = new RelogioDoChamado(() => 20);
    expect(passar(r, 19)).toBe(0);
    expect(passar(r, 1)).toBe(1);
  });

  it('um toque zera a conta', () => {
    const r = new RelogioDoChamado(() => 10);
    passar(r, 9);
    r.tocou();
    expect(passar(r, 9)).toBe(0);
    expect(passar(r, 1)).toBe(1);
  });

  it('parada de vez, chama no máximo três vezes por tela e depois espera em silêncio', () => {
    const r = new RelogioDoChamado(() => 10);
    expect(passar(r, 600)).toBe(CHAMADOS_POR_TELA);
    r.trocouTela();
    expect(passar(r, 10)).toBe(1);
  });

  it('com zero segundos o chamado está desligado', () => {
    const r = new RelogioDoChamado(() => 0);
    expect(passar(r, 600)).toBe(0);
  });

  it('alternando, começa pelo assovio e depois diz "Ei!"', () => {
    const r = new RelogioDoChamado(() => 5);
    passar(r, 5);
    expect(r.som('alterna')).toBe('assovio');
    passar(r, 5);
    expect(r.som('alterna')).toBe('ei');
    expect(r.som('assovio')).toBe('assovio');
  });

  it('um save antigo ganha o chamado ligado em 20 s', () => {
    const e = estadoNovo() as unknown as { pais: Record<string, unknown> };
    delete e.pais.chamadoSeg;
    delete e.pais.chamadoSom;
    const m = migrar(e as unknown as Record<string, unknown>);
    expect(m.pais.chamadoSeg).toBe(20);
    expect(m.pais.chamadoSom).toBe('alterna');
  });
});
