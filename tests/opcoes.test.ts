import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import ajuda from '@/data/ajuda-telas.json';
import sobre from '@/data/musicas-sobre.json';
import musicaTelas from '@/data/musica-telas.json';
import { musicas } from '@/audio/musica';
import { ajudaDaTela, chaveDaAjuda, musicasDaTela, sobreMusica } from '@/ui/opcoes';

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

describe('a música de cada tela, no painel das opções', () => {
  const ids = Object.keys(musicas);

  it('toda música do jogo tem autor, estilo, ano, significado e curiosidade, sem travessão', () => {
    for (const id of ids) {
      const s = sobreMusica(id);
      expect(s, id).not.toBeNull();
      for (const campo of Object.values(s!)) {
        expect(campo.length, id).toBeGreaterThan(3);
        expect(campo, id).not.toMatch(/—/);
      }
    }
    for (const id of Object.keys(sobre)) expect(ids, id).toContain(id);
  });

  it('cada tela aponta para músicas que existem, e só telas que existem', () => {
    for (const [tela, lista] of Object.entries(musicaTelas)) {
      expect(registradas, tela).toContain(tela);
      for (const id of lista) expect(ids, `${tela}: ${id}`).toContain(id);
    }
  });

  it('toda música que o código das telas toca aparece em alguma tela', () => {
    const noMapa = new Set(Object.values(musicaTelas).flat());
    for (const arq of readdirSync('src/telas')) {
      const fonte = readFileSync(`src/telas/${arq}`, 'utf8');
      for (const m of fonte.matchAll(/'([a-z_]+)'/g)) if (ids.includes(m[1]!)) expect(noMapa, `${arq}: ${m[1]}`).toContain(m[1]);
    }
  });

  it('a que está no ar vem primeiro, marcada, sem repetir', () => {
    expect(musicasDaTela('casa', ['preludio_bach'])).toEqual([
      { id: 'preludio_bach', tocando: true },
      { id: 'gymnopedie', tocando: false },
      { id: 'ninar_brahms', tocando: false },
    ]);
    expect(musicasDaTela('roda', ['gymnopedie'])).toEqual([{ id: 'gymnopedie', tocando: true }]);
    expect(musicasDaTela('roda')).toEqual([]);
    expect(musicasDaTela('ukulele')).toEqual([]);
  });
});
