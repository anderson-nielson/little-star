import { describe, expect, it } from 'vitest';
import { abrirDia, estadoNovo } from '@/core/estado';
import { aberto, brincouHoje, COISAS, disponivel, etapa } from '@/core/laco';
import {
  alisar,
  BRINQUEDOS,
  CUIDADOS,
  cuidouHoje,
  destinoDoBrinquedo,
  ESCOVADAS_POR_PARTE,
  Escovacao,
  foiLongeOBastante,
  fracaoDoCaminho,
  lugarPerto,
  LUGARES,
  marcarCuidado,
  PASSADA,
  PASSOS,
  sujeirasQueFicam,
  ultimoCuidadoDeHoje,
  VELOCIDADE_MAXIMA,
} from '@/core/cuidados';
import frases from '@/data/frases.json';
import ajuda from '@/data/ajuda-telas.json';
import musicaTelas from '@/data/musica-telas.json';
import brilha from '@/data/musicas/brilha.json';

const dia = (h: number, d = 15) => new Date(2026, 8, d, h, 0);

describe('os cuidados: a ordem de verdade', () => {
  it('a cama: tira o que está em cima, estica o lençol, puxa a coberta, afofa o travesseiro, os bichinhos voltam', () => {
    expect(PASSOS.cama).toEqual(['tirar', 'lencol', 'coberta', 'travesseiro', 'bichinhos']);
  });
  it('os dentes: molha, pasta, os de cima, a língua, os de baixo, enxágua, guarda', () => {
    expect(PASSOS.dentes).toEqual(['molhar', 'pasta', 'cima', 'lingua', 'baixo', 'enxaguar', 'guardar']);
  });
  it('escovar as três partes toca o Brilha, brilha inteiro, nota por nota', () => {
    const notas = brilha.melodia.split(/\s+/).filter((n) => n.includes(':')).length;
    expect(ESCOVADAS_POR_PARTE * 3).toBe(notas);
  });
});

describe('puxar e arrastar', () => {
  it('passando de 40% do caminho, vai sozinho o resto; antes disso, volta', () => {
    expect(fracaoDoCaminho([300, 0], [100, 0], [220, 0])).toBeCloseTo(0.4);
    expect(foiLongeOBastante(fracaoDoCaminho([300, 0], [100, 0], [220, 0]))).toBe(true);
    expect(foiLongeOBastante(fracaoDoCaminho([300, 0], [100, 0], [260, 0]))).toBe(false);
  });
  it('andar de lado ou para trás não conta como caminho', () => {
    expect(fracaoDoCaminho([300, 0], [100, 0], [300, 200])).toBe(0);
    expect(fracaoDoCaminho([300, 0], [100, 0], [360, 0])).toBe(0);
    expect(fracaoDoCaminho([300, 0], [100, 0], [0, 0])).toBe(1);
  });
});

describe('o lençol', () => {
  it('o dedo alisa as rugas que cruzou, em qualquer direção, e a lisa não volta', () => {
    const rugas = [100, 160, 220];
    const lisas = [false, false, false];
    expect(alisar(rugas, lisas, 90, 170)).toEqual([0, 1]);
    lisas[0] = true;
    lisas[1] = true;
    expect(alisar(rugas, lisas, 250, 80)).toEqual([2]);
    expect(alisar(rugas, lisas, 150, 150)).toEqual([]);
  });
});

describe('a escovação', () => {
  it('esfregar com calma rende uma escovada por passada', () => {
    const c = new Escovacao();
    let n = 0;
    for (let i = 0; i < 10; i++) n += c.esfregar(PASSADA / 2, 0.1);
    expect(n).toBe(5);
  });
  it('esfregar com pressa não escova mais depressa', () => {
    const calma = new Escovacao();
    const pressa = new Escovacao();
    let a = 0;
    let b = 0;
    for (let i = 0; i < 20; i++) {
      a += calma.esfregar(VELOCIDADE_MAXIMA * 0.05, 0.05);
      b += pressa.esfregar(VELOCIDADE_MAXIMA * 0.05 * 6, 0.05);
    }
    expect(b).toBe(a);
  });
  it('as sujeirinhas somem aos poucos e acabam quando a parte fica limpa', () => {
    expect(sujeirasQueFicam(0, 5)).toBe(5);
    expect(sujeirasQueFicam(7, 5)).toBeLessThan(5);
    expect(sujeirasQueFicam(7, 5)).toBeGreaterThan(0);
    expect(sujeirasQueFicam(ESCOVADAS_POR_PARTE, 5)).toBe(0);
    for (let k = 1; k <= ESCOVADAS_POR_PARTE; k++) expect(sujeirasQueFicam(k, 5)).toBeLessThanOrEqual(sujeirasQueFicam(k - 1, 5));
  });
});

describe('os brinquedos', () => {
  const casas = { estante: [80, 360], caixa: [195, 410], cesto: [310, 400] } as Record<(typeof LUGARES)[number], [number, number]>;
  it('cada coisa tem a sua casa, e toda casa tem pelo menos dois moradores', () => {
    for (const l of LUGARES) expect(BRINQUEDOS.filter((b) => b.lugar === l).length).toBeGreaterThanOrEqual(2);
    expect(new Set(BRINQUEDOS.map((b) => b.id)).size).toBe(BRINQUEDOS.length);
  });
  it('solto no chão, volta; solto numa casa, vai para a dele, e a gente sabe se era a certa', () => {
    const bloco = BRINQUEDOS.find((b) => b.lugar === 'caixa')!;
    expect(lugarPerto(195, 600, casas, 80)).toBeNull();
    expect(destinoDoBrinquedo(bloco, null)).toEqual({ vai: null, certo: false });
    expect(destinoDoBrinquedo(bloco, lugarPerto(200, 420, casas, 80))).toEqual({ vai: 'caixa', certo: true });
    expect(destinoDoBrinquedo(bloco, lugarPerto(300, 410, casas, 80))).toEqual({ vai: 'caixa', certo: false });
  });
});

describe('os cuidados na casa', () => {
  it('abrem na quarta sessão, com uma bandeirinha só no varal', () => {
    expect(COISAS.filter((c) => c === 'cuidados')).toHaveLength(1);
    expect(aberto(3, 'cuidados')).toBe(false);
    expect(aberto(4, 'cuidados')).toBe(true);
    let e = estadoNovo(dia(15));
    for (let d = 1; d <= 4; d++) e = abrirDia(e, dia(15, d));
    expect(etapa(e)).toBe(4);
    expect(disponivel(e, 'cuidados')).toBe(true);
  });
  it('cada cuidado fica anotado no dia, e o último é o do convite da despedida', () => {
    const e = abrirDia(estadoNovo(dia(15)), dia(15));
    expect(ultimoCuidadoDeHoje(e)).toBeNull();
    marcarCuidado(e, 'dentes');
    marcarCuidado(e, 'cama');
    expect(brincouHoje(e, 'cuidados')).toBe(true);
    expect(cuidouHoje(e, 'dentes')).toBe(true);
    expect(cuidouHoje(e, 'brinquedos')).toBe(false);
    expect(ultimoCuidadoDeHoje(e)).toBe('cama');
    marcarCuidado(e, 'dentes');
    expect(ultimoCuidadoDeHoje(e)).toBe('dentes');
    expect(e.hoje.brincadas.filter((b) => b === 'cuidados')).toHaveLength(1);
  });
  it('toda tela de cuidado tem ajuda para os pais, música, voz de cada passo e convite para fazer de verdade', () => {
    const ids = new Set(frases.map((f) => f.id));
    for (const c of CUIDADOS) {
      expect(Object.keys(ajuda), c).toContain(c);
      expect(Object.keys(musicaTelas), c).toContain(c);
      expect(ids.has(`convite_${c}`), c).toBe(true);
    }
    for (const id of ['cama_tirar', 'cama_lencol', 'cama_coberta', 'cama_travesseiro', 'cama_bichinhos', 'cama_pronta', 'dentes_molhar', 'dentes_pasta', 'dentes_escovar', 'dentes_enxaguar', 'dentes_guardar', 'dentes_pronto', 'brinquedos_comeca', 'brinquedos_pronto']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
