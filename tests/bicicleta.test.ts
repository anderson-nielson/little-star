import { describe, expect, it } from 'vitest';
import {
  alturaChao,
  alturaDoPulo,
  BICICLETA,
  bicicletaVazia,
  cadaDaRota,
  decolagem,
  depoisDoPasseio,
  deslizar,
  duracaoEstimada,
  gestosDaRota,
  inclinacao,
  kitDaRota,
  montarPasseio,
  noAr,
  passeioBom,
  passoDeVelocidade,
  pedalar,
  pularPara,
  ritmoDaRota,
  ROTA_ABRE_COM,
  ROTAS,
  rotaDoDia,
  rotasAbertas,
  vooDaRampa,
  type Morro,
} from '@/core/bicicleta';
import { estadoNovo, migrar } from '@/core/estado';
import { COISAS, NOME_COISA, aberto, sessaoQueAbre } from '@/core/laco';

/* um sorteio fixo, para o caminho ser sempre o mesmo nos testes */
const fixo = () => 0.5;

describe('as rotas da bicicletinha', () => {
  it('são cinco, em dados, cada uma com quem espera, um enfeite e um kit que começa com duas coisas', () => {
    expect(ROTAS).toHaveLength(5);
    expect(new Set(ROTAS.map((r) => r.enfeite)).size).toBe(5);
    for (const r of ROTAS) {
      expect(['mae', 'pai', 'theo', 'familia']).toContain(r.quem);
      expect(kitDaRota(r, 0).length).toBeGreaterThanOrEqual(2);
      expect(kitDaRota(r, 100).length).toBe(r.kit.length);
    }
  });
  it('pular entra sempre; acelerar entra na rua com a rampinha; frear e abaixar entram no bosque', () => {
    const rua = ROTAS[0]!;
    expect(gestosDaRota(rua, 0)).toEqual({ pular: true, acelerar: false, frear: false, abaixar: false });
    expect(gestosDaRota(rua, 3).acelerar).toBe(true);
    expect(kitDaRota(rua, 3)).toContain('rampa');
    expect(kitDaRota(rua, 2)).not.toContain('rampa');
    const bosque = ROTAS[1]!;
    expect(gestosDaRota(bosque, 3).frear).toBe(true);
    expect(kitDaRota(bosque, 3)).toContain('gamba');
    expect(gestosDaRota(bosque, 6).abaixar).toBe(true);
    expect(kitDaRota(bosque, 6)).toContain('galho');
  });
  it('a areia é trecho intercalado nas rotas, nunca uma rota só de areia', () => {
    for (const r of ROTAS) expect(kitDaRota(r, 100).filter((k) => k !== 'areia').length).toBeGreaterThanOrEqual(2);
    expect(ROTAS.filter((r) => r.kit.some(([k]) => k === 'areia')).length).toBeGreaterThanOrEqual(4);
  });
  it('a primeira rota está aberta; cada uma abre depois de três passeios na anterior, e a nova brilha primeiro', () => {
    const b = bicicletaVazia();
    expect(rotasAbertas(b).map((r) => r.id)).toEqual(['rua']);
    expect(rotaDoDia(b).id).toBe('rua');
    b.passeios.rua = ROTA_ABRE_COM;
    expect(rotasAbertas(b).map((r) => r.id)).toEqual(['rua', 'bosque']);
    expect(rotaDoDia(b).id).toBe('bosque');
    b.passeios.bosque = 1;
    expect(rotasAbertas(b)).toHaveLength(2);
    expect(['rua', 'bosque']).toContain(rotaDoDia(b).id);
  });
});

describe('a progressão, devagar', () => {
  it('o ritmo sobe 4% por passeio bom, com teto de 30%', () => {
    expect(ritmoDaRota(0)).toBe(1);
    expect(ritmoDaRota(1)).toBeCloseTo(1.04);
    expect(ritmoDaRota(100)).toBeCloseTo(1.3);
  });
  it('um obstáculo a cada 4, 3 e 2 compassos nos degraus 0, 3 e 6', () => {
    expect(cadaDaRota(0)).toBe(4);
    expect(cadaDaRota(2)).toBe(4);
    expect(cadaDaRota(3)).toBe(3);
    expect(cadaDaRota(6)).toBe(2);
    expect(cadaDaRota(40)).toBe(2);
  });
  it('um passeio é bom quando ela passou sozinha pelo menos metade das coisas; sem coisas, é bom', () => {
    expect(passeioBom(0, 0)).toBe(true);
    expect(passeioBom(2, 4)).toBe(true);
    expect(passeioBom(1, 4)).toBe(false);
  });
  it('depois do passeio: conta, sobe um degrau se foi bom, desce se a A2 entrou duas vezes, e dá o enfeite na primeira chegada', () => {
    const b = bicicletaVazia();
    const rua = ROTAS[0]!;
    expect(depoisDoPasseio(b, rua, true, 0)).toBe(rua.enfeite);
    expect(b.passeios.rua).toBe(1);
    expect(b.bons.rua).toBe(1);
    expect(depoisDoPasseio(b, rua, true, 0)).toBeNull();
    expect(b.bons.rua).toBe(2);
    depoisDoPasseio(b, rua, true, 2);
    expect(b.bons.rua).toBe(1);
    depoisDoPasseio(b, rua, false, 5);
    depoisDoPasseio(b, rua, false, 5);
    expect(b.bons.rua).toBe(0);
    expect(b.passeios.rua).toBe(5);
    expect(b.enfeites).toEqual([rua.enfeite]);
  });
});

describe('o chão e a velocidade', () => {
  const morros: Morro[] = [{ x: 2, h: 0.1, subida: 0.3, descida: 0.3 }];
  it('o morrinho sobe até a crista e desce do outro lado, e fora dele o chão é plano', () => {
    expect(alturaChao(morros, 0)).toBe(0);
    expect(alturaChao(morros, 2)).toBeCloseTo(-0.1);
    expect(alturaChao(morros, 1.85)).toBeLessThan(0);
    expect(alturaChao(morros, 1.85)).toBeGreaterThan(-0.1);
    expect(inclinacao(morros, 1.85)).toBeLessThan(0);
    expect(inclinacao(morros, 2.15)).toBeGreaterThan(0);
    /* na volta, a mesma subida vira descida */
    expect(inclinacao(morros, 1.85, -1)).toBeGreaterThan(0);
  });
  it('a subida pesa e a descida empurra, dentro dos limites; sem toque ela nunca para', () => {
    const plano = { inclinacao: 0, trecho: null, freando: false, deslizando: false, noAr: false, parada: false };
    let v = 1;
    for (let i = 0; i < 40; i++) v = passoDeVelocidade(v, { ...plano, inclinacao: -0.6 }, 0.05);
    expect(v).toBeGreaterThanOrEqual(BICICLETA.minimo);
    expect(v).toBeLessThan(1);
    let d = 1;
    for (let i = 0; i < 40; i++) d = passoDeVelocidade(d, { ...plano, inclinacao: 0.6 }, 0.05);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThanOrEqual(BICICLETA.maximo);
    expect(passoDeVelocidade(1, { ...plano, parada: true }, 0.05)).toBe(0);
  });
  it('a pedalada soma, a freada puxa para baixo, a areia e o pedregulho seguram, a deslizada acelera', () => {
    const plano = { inclinacao: 0, trecho: null, freando: false, deslizando: false, noAr: false, parada: false };
    expect(pedalar(1)).toBeCloseTo(1 + BICICLETA.pedalada);
    expect(pedalar(BICICLETA.maximo)).toBe(BICICLETA.maximo);
    let v = 1;
    for (let i = 0; i < 20; i++) v = passoDeVelocidade(v, { ...plano, freando: true }, 0.05);
    expect(v).toBeLessThan(0.5);
    let a = 1;
    for (let i = 0; i < 40; i++) a = passoDeVelocidade(a, { ...plano, trecho: 'areia' }, 0.05);
    expect(a).toBeLessThan(0.7);
    expect(deslizar(1)).toBeCloseTo(1 + BICICLETA.deslizada);
  });
  it('rápido na crista ela decola; devagar, não. Na rampinha, quanto mais rápido mais alto, e um giro quando é alto de verdade', () => {
    expect(decolagem(1)).toBe(0);
    expect(decolagem(1.6)).toBeGreaterThan(0);
    expect(vooDaRampa(1).h).toBeLessThan(vooDaRampa(1.8).h);
    expect(vooDaRampa(1).giro).toBe(false);
    expect(vooDaRampa(1.9).giro).toBe(true);
  });
});

describe('o pulo', () => {
  it('é uma parábola; o pulinho da campainha não conta como estar no ar, o pulo de verdade conta', () => {
    const p = pularPara(0, null, 1);
    expect(alturaDoPulo(p, 0)).toBe(0);
    expect(alturaDoPulo(p, (p.fim - p.inicio) / 2)).toBeCloseTo(p.h);
    expect(noAr({ inicio: 0, fim: 0.3, h: 0.02 }, 0.15)).toBe(false);
    const q = pularPara(0, 0.4, 1);
    expect(noAr(q, (q.fim - q.inicio) / 2)).toBe(true);
    expect(q.fim - q.inicio).toBeGreaterThanOrEqual(BICICLETA.duracaoDoPulo);
  });
  it('o pulo procura a coisa: com ela mais longe, o pulo estica até passar', () => {
    const perto = pularPara(0, 0.2, 1);
    const longe = pularPara(0, 0.65, 1);
    expect(longe.fim).toBeGreaterThan(perto.fim);
  });
});

describe('o caminho montado', () => {
  it('as coisas ficam espaçadas em compassos, com folga na casa e no destino, e a primeira de cada tipo é nova', () => {
    for (const r of ROTAS) {
      const p = montarPasseio(r, 0, fixo);
      expect(p.coisas.length).toBeGreaterThanOrEqual(Math.min(r.obstaculos, 6));
      expect(p.coisas[0]!.x).toBeGreaterThan(1);
      expect(p.fim).toBeGreaterThan(p.coisas[p.coisas.length - 1]!.x + 0.5);
      const tipos = new Set<string>();
      for (const c of p.coisas) {
        expect(c.nova).toBe(!tipos.has(c.tipo));
        tipos.add(c.tipo);
      }
      for (let i = 1; i < p.coisas.length; i++) expect(p.coisas[i]!.x).toBeGreaterThan(p.coisas[i - 1]!.x);
    }
  });
  it('nos morrinhos, morrinho após morrinho, cada um mais alto, e a descida grande no fim', () => {
    const p = montarPasseio(ROTAS.find((r) => r.id === 'morrinhos')!, 0, fixo);
    expect(p.morros.length).toBeGreaterThanOrEqual(4);
    const grande = p.morros.filter((m) => m.grande);
    expect(grande).toHaveLength(1);
    expect(grande[0]!.descida).toBeGreaterThan(grande[0]!.subida * 2);
    const cadeia = p.morros.filter((m) => !m.grande).slice(0, 3);
    expect(cadeia[1]!.h).toBeGreaterThan(cadeia[0]!.h);
    expect(cadeia[2]!.h).toBeGreaterThan(cadeia[1]!.h);
  });
  it('com mais passeios bons, as coisas ficam mais perto e o passeio mais curto', () => {
    const rua = ROTAS[0]!;
    expect(montarPasseio(rua, 6, fixo).fim).toBeLessThan(montarPasseio(rua, 0, fixo).fim);
  });
  it('mesmo sem nenhum toque, ida e volta cabem na rede de segurança', () => {
    for (const r of ROTAS) {
      const p = montarPasseio(r, 0, fixo);
      expect(duracaoEstimada(p, 1), r.id).toBeLessThan(BICICLETA.duracaoMaxima);
    }
  });
});

describe('a bicicleta na casa', () => {
  it('é uma coisa da casa, abre na etapa 3 com o parquinho, tem nome para o adulto e mora no save', () => {
    expect(COISAS).toContain('bicicleta');
    expect(sessaoQueAbre('bicicleta')).toBe(3);
    expect(aberto(3, 'bicicleta')).toBe(true);
    expect(aberto(2, 'bicicleta')).toBe(false);
    expect(NOME_COISA.bicicleta.length).toBeGreaterThan(3);
    const e = estadoNovo();
    expect(e.bicicleta).toEqual({ passeios: {}, bons: {}, enfeites: [] });
    expect(e.pais.tarefas.bicicleta).toBe(true);
    /* um save antigo, sem o campo, ganha o padrão */
    const antigo = migrar({ versao: 1, sessoes: 3 } as never);
    expect(antigo.bicicleta.enfeites).toEqual([]);
  });
});
