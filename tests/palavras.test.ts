import { describe, expect, it } from 'vitest';
import { estadoNovo } from '@/core/estado';
import { palavras, proximaPalavra, sequenciaDePalavras } from '@/core/palavras';

const nomes = (xs: { palavra: string }[]) => xs.map((x) => x.palavra);

describe('a fila de palavras do escorregador de sons', () => {
  it('no começo só tem a palavra da letra da vez, e a que a casa pediu', () => {
    const e = estadoNovo();
    expect(nomes(sequenciaDePalavras(e, 'AVÓ'))).toEqual(['AVÓ']);
    expect(nomes(sequenciaDePalavras(e, 'MALA'))).toEqual(['AVÓ', 'MALA']);
  });
  it('cresce com as letras traçadas: a palavra de cada letra e as feitas só de letras conhecidas, na ordem do fônico', () => {
    const e = { ...estadoNovo(), letras: ['A', 'E', 'L', 'S', 'T'], letraIndice: 5 };
    expect(nomes(sequenciaDePalavras(e, 'ELA'))).toEqual(['LUA', 'AVÓ', 'ELA', 'OLÁ', 'SALA', 'TELA', 'LATA', 'STELLA']);
  });
  it('a próxima é a primeira não lida à frente, senão atrás, senão a seguinte; sozinha não tem próxima', () => {
    const e = { ...estadoNovo(), letras: ['A', 'E', 'L', 'S', 'T'], letraIndice: 5 };
    const fila = sequenciaDePalavras(e, 'ELA');
    expect(proximaPalavra(e, fila, 'ELA')?.palavra).toBe('OLÁ');
    const quaseTudo = { ...e, palavras: nomes(fila).filter((p) => p !== 'AVÓ') };
    expect(proximaPalavra(quaseTudo, fila, 'STELLA')?.palavra).toBe('AVÓ');
    const tudo = { ...e, palavras: nomes(fila) };
    expect(proximaPalavra(tudo, fila, 'STELLA')?.palavra).toBe('LUA');
    expect(proximaPalavra(tudo, fila, 'SALA')?.palavra).toBe('TELA');
    expect(proximaPalavra(estadoNovo(), sequenciaDePalavras(estadoNovo(), 'AVÓ'), 'AVÓ')).toBeNull();
  });
  it('toda palavra da fila existe na lista', () => {
    const e = { ...estadoNovo(), letras: ['A', 'E', 'L', 'S', 'T', 'O', 'M', 'U', 'I', 'V'], letraIndice: 9 };
    expect(nomes(sequenciaDePalavras(e, 'LUA'))).toEqual(nomes(palavras));
  });
});
