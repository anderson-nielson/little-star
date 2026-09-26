import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ajuda from '@/data/ajuda-telas.json';
import { ajudaDaTela, chaveDaAjuda } from '@/ui/opcoes';

/* as telas que o main registra; pais e styleguide não têm o botão do canto */
const registradas = [...readFileSync('src/main.ts', 'utf8').matchAll(/registrar\('([a-z]+)'/g)].map((m) => m[1]!);
const COM_BOTAO = registradas.filter((n) => n !== 'pais' && n !== 'styleguide');

describe('a ajuda de cada tela, no painel das opções', () => {
  it('existe para toda tela do jogo', () => {
    expect(COM_BOTAO.length).toBeGreaterThan(20);
    for (const nome of COM_BOTAO) expect(ajudaDaTela(nome), nome).not.toBeNull();
  });

  it('a mesa da estação tem a sua, separada das pinhas embaixo do pinheiro', () => {
    expect(chaveDaAjuda('pinhas', { mesa: '1' })).toBe('pinhas.mesa');
    expect(chaveDaAjuda('pinhas')).toBe('pinhas');
    expect(ajudaDaTela('pinhas', { mesa: '1' })?.titulo).not.toBe(ajudaDaTela('pinhas')?.titulo);
  });

  it('diz o que é e o que fazer, sem travessão', () => {
    for (const [nome, a] of Object.entries(ajuda)) {
      expect(a.titulo.length, nome).toBeGreaterThan(2);
      expect(a.oque.length, nome).toBeGreaterThan(20);
      expect(a.fazer.length, nome).toBeGreaterThan(5);
      expect(`${a.titulo} ${a.oque} ${a.fazer}`, nome).not.toMatch(/—/);
    }
  });

  it('não sobra ajuda de tela que não existe', () => {
    for (const chave of Object.keys(ajuda)) expect(registradas, chave).toContain(chave.split('.')[0]);
  });
});
