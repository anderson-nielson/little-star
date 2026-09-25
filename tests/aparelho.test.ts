import { describe, expect, it } from 'vitest';
import { nomeDoAparelho, textoDaBusca, textoDeEspaco } from '@/core/aparelho';

describe('o aparelho', () => {
  it('reconhece o celular pelo user agent', () => {
    expect(nomeDoAparelho('Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36')).toBe('Samsung Galaxy');
    expect(nomeDoAparelho('Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120.0 Mobile')).toBe('Android');
    expect(nomeDoAparelho('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Version/17.4 Mobile/15E148 Safari/604.1')).toBe('iPhone');
    expect(nomeDoAparelho('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Safari/605.1.15')).toBe('Mac');
    expect(nomeDoAparelho('')).toBe('este aparelho');
  });
  it('explica o resultado da busca por versão nova em português', () => {
    expect(textoDaBusca('atualizada', 'abc1234')).toContain('abc1234');
    expect(textoDaBusca('nova')).toMatch(/reabrir sozinho/);
    expect(textoDaBusca('offline')).toMatch(/Sem internet/);
    expect(textoDaBusca('sem-suporte')).toMatch(/navegador/);
    expect(textoDaBusca('erro')).toMatch(/Tente de novo/);
  });
  it('diz quanto o jogo ocupa em KB ou MB', () => {
    expect(textoDeEspaco(null)).toBe('espaço usado desconhecido');
    expect(textoDeEspaco(512)).toBe('1 KB no aparelho');
    expect(textoDeEspaco(300 * 1024)).toBe('300 KB no aparelho');
    expect(textoDeEspaco(2.5 * 1024 * 1024)).toBe('2.5 MB no aparelho');
    expect(textoDeEspaco(48 * 1024 * 1024)).toBe('48 MB no aparelho');
  });
});
