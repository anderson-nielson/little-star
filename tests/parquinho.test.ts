import { describe, expect, it } from 'vitest';
import { AMORTECIMENTO, AMPLITUDE_PARA_CONTAR, amplitude, ANGULO_MAX, anguloDoDedo, CONTA_ATE, empurrar, impulso, novaGangorra, novoBalanco, OMEGA_MAX, parado, passo, passoGangorra, peNoChao, PERIODO, soltar, GANGORRA_MAX } from '@/core/parquinho';
import { estadoNovo, migrar, VERSAO_DO_SAVE } from '@/core/estado';
import { aberto, COISAS, tarefasAtivas } from '@/core/laco';
import frases from '@/data/frases.json';

const DT = 1 / 120;

describe('o balanço do parquinho', () => {
  it('é um pêndulo com o período de quatro tempos a 100 bpm', () => {
    const b = novoBalanco();
    b.th = 0.3;
    const cruzamentos: number[] = [];
    for (let t = 0; t < 6; t += DT) {
      const c = passo(b, DT);
      if (c) cruzamentos.push(t);
    }
    /* meio período entre cruzamentos pelo ponto mais baixo */
    expect(cruzamentos.length).toBeGreaterThanOrEqual(4);
    const meio = cruzamentos[2]! - cruzamentos[1]!;
    expect(Math.abs(meio - PERIODO / 2)).toBeLessThan(0.05);
  });
  it('morre sozinho: perde metade da altura em uns oito ciclos, e para de vez', () => {
    const b = novoBalanco();
    b.th = 0.4;
    for (let t = 0; t < PERIODO * 8; t += DT) passo(b, DT);
    const amp = amplitude(b);
    expect(amp).toBeLessThan(0.4 * 0.6);
    expect(amp).toBeGreaterThan(0.4 * 0.3);
    expect(AMORTECIMENTO).toBeLessThan(0.05);
    for (let t = 0; t < 120; t += DT) passo(b, DT);
    expect(parado(b)).toBe(true);
    expect(b.th).toBe(0);
  });
  it('o impulso é dela, sempre a favor do movimento, e vale mais perto do chão', () => {
    const parada = novoBalanco();
    impulso(parada);
    expect(parada.om).toBeGreaterThan(0);
    /* indo para trás: o impulso empurra para trás, nunca contra */
    const voltando = novoBalanco();
    voltando.om = -1;
    impulso(voltando);
    expect(voltando.om).toBeLessThan(-1);
    /* no ponto mais baixo rende mais que lá em cima, com a mesma altura */
    const embaixo = { th: 0, om: 1.2 };
    const emCima = { th: amplitude(embaixo), om: 0 };
    const fEmbaixo = impulso(embaixo);
    const fEmCima = impulso(emCima);
    expect(fEmbaixo).toBeGreaterThan(fEmCima);
    expect(fEmbaixo).toBeCloseTo(1.2, 1);
    expect(fEmCima).toBeCloseTo(0.5, 1);
  });
  it('nunca passa da altura máxima, por mais que ela se impulsione, em qualquer ponto do balanço', () => {
    const b = novoBalanco();
    let maior = 0;
    let k = 0;
    for (let t = 0; t < 40; t += DT) {
      passo(b, DT);
      /* impulsos a cada 0,37 s, caindo em todas as fases do balanço */
      if (++k % 44 === 0) impulso(b);
      maior = Math.max(maior, Math.abs(b.th));
    }
    expect(maior).toBeLessThanOrEqual(ANGULO_MAX + 0.02);
    expect(Math.abs(b.om)).toBeLessThanOrEqual(OMEGA_MAX);
    const solto = novoBalanco();
    soltar(solto, 99);
    expect(solto.om).toBe(OMEGA_MAX);
    /* solto lá de cima, a velocidade que cabe é menor */
    const alto = { th: ANGULO_MAX, om: 0 };
    soltar(alto, 99);
    expect(alto.om).toBeLessThan(0.5);
  });
  it('o dedo leva o balanço até um limite, e conta-se até dez só com o balanço alto', () => {
    expect(anguloDoDedo(1000, 100)).toBe(ANGULO_MAX);
    expect(anguloDoDedo(-1000, 100)).toBe(-ANGULO_MAX);
    expect(anguloDoDedo(0, 300)).toBe(0);
    expect(CONTA_ATE).toBe(10);
    expect(AMPLITUDE_PARA_CONTAR).toBeGreaterThan(0.05);
  });
});

describe('a gangorra', () => {
  it('começa com o pé dela no chão, só sobe com o pé no chão, e desce devagar sem bater', () => {
    const g = novaGangorra();
    expect(peNoChao(g)).toBe(true);
    expect(empurrar(g)).toBe(true);
    let maior = -1;
    let pousou = false;
    for (let t = 0; t < 6; t += DT) {
      if (passoGangorra(g, DT)) pousou = true;
      maior = Math.max(maior, g.th);
      if (g.th > 0 && !peNoChao(g)) expect(empurrar(g)).toBe(false);
    }
    expect(maior).toBeGreaterThan(GANGORRA_MAX * 0.8);
    expect(maior).toBeLessThanOrEqual(GANGORRA_MAX);
    expect(peNoChao(g)).toBe(true);
    expect(pousou).toBe(false);
  });
});

describe('o parquinho no jogo', () => {
  it('abre na etapa 3, entra na roda por padrão e a contagem vem ligada; um save antigo ganha os dois', () => {
    expect(aberto(2, 'parquinho')).toBe(false);
    expect(aberto(3, 'parquinho')).toBe(true);
    expect(COISAS).toContain('parquinho');
    const e = estadoNovo();
    expect(tarefasAtivas(e)).toContain('parquinho');
    expect(e.pais.contarNoBalanco).toBe(true);
    const antigo = migrar({ versao: VERSAO_DO_SAVE, pais: { tarefas: { cama: false } }, hoje: { dia: '2026-09-25' } } as unknown as Record<string, unknown>);
    expect(antigo.pais.tarefas.parquinho).toBe(true);
    expect(antigo.pais.contarNoBalanco).toBe(true);
  });
  it('tem as frases da roda, do convite, do Theo e os dez números, nenhuma obrigatória', () => {
    const ids = ['pergunta_parquinho', 'comemora_parquinho', 'convite_parquinho', 'theo_forca', 'theo_coragem', 'theo_esperta', ...Array.from({ length: 10 }, (_, i) => `num_${i + 1}`)];
    for (const id of ids) {
      const f = frases.find((x) => x.id === id);
      expect(f, id).toBeTruthy();
      expect(f!.obrigatoria, id).toBe(false);
    }
  });
});
