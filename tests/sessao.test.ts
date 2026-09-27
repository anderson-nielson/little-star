import { beforeEach, describe, expect, it, vi } from 'vitest';

const idas: string[] = [];
vi.mock('@/core/roteador', () => ({
  ir: async (nome: string) => void idas.push(nome),
  telaAtual: () => idas[idas.length - 1] ?? null,
}));

const { sessao } = await import('@/core/sessao');

describe('a roda aberta da casa', () => {
  beforeEach(() => {
    idas.length = 0;
    sessao.partes = ['chegada', 'roda', 'prato', 'som', 'casa', 'bichos', 'despedida'];
    sessao.atual = 'casa';
  });

  it('volta para a casa quando acaba, sem refazer prato e som', async () => {
    await sessao.desviar('roda');
    expect(sessao.atual).toBe('roda');
    await sessao.avancar();
    expect(sessao.atual).toBe('casa');
    expect(idas).toEqual(['roda', 'casa']);
  });

  it('depois da volta, o laço segue na ordem de sempre', async () => {
    await sessao.desviar('roda');
    await sessao.avancar();
    await sessao.avancar();
    expect(sessao.atual).toBe('bichos');
  });

  it('saindo pela casinha no meio, o desvio some', async () => {
    await sessao.desviar('roda');
    await sessao.voltarParaCasa();
    await sessao.avancar();
    expect(sessao.atual).toBe('bichos');
  });
});
