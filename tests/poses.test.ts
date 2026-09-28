import { describe, expect, it } from 'vitest';
import { familia, type Pose } from '@/puppet/boneco';
import type { Ponto } from '@/puppet/boneco';

/**
 * A biomecânica dos bonecos (SPEC, "Braços e pernas que fazem sentido"): em toda pose, de
 * todo mundo, dos dois lados, o cotovelo e o joelho dobram dentro do que uma pessoa dobra,
 * a mão não entra na cabeça, nada fica abaixo do chão e os segmentos têm o comprimento
 * certo. É a conferência que roda toda vez, para ninguém acordar com a mão no cabelo.
 */
const POSES: Pose[] = ['parado', 'acena', 'sentado', 'pulo', 'aponta', 'segura', 'giro', 'reverencia', 'deitado', 'abraca', 'anda', 'salto', 'escorrega', 'balanco', 'palma', 'mao', 'plie', 'releve', 'arabesque', 'agradece', 'segunda', 'tendu', 'passe', 'attitude'];
const QUEM = ['menina', 'meninaPalco', 'irmao', 'mae', 'pai'] as const;
const CHAO = 300;

const dist = (a: Ponto, b: Ponto) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** o ângulo de dentro da junta, em graus: 180 é esticado, 0 é dobrado até encostar */
function anguloDaJunta(a: Ponto, k: Ponto, b: Ponto): number {
  const u: Ponto = [a[0] - k[0], a[1] - k[1]];
  const v: Ponto = [b[0] - k[0], b[1] - k[1]];
  const cos = (u[0] * v[0] + u[1] * v[1]) / ((Math.hypot(u[0], u[1]) || 1) * (Math.hypot(v[0], v[1]) || 1));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

describe('braços e pernas que fazem sentido', () => {
  for (const quem of QUEM) {
    for (const pose of POSES) {
      for (const dir of [1, -1] as const) {
        for (const passo of pose === 'anda' ? [0, 0.25, 0.5, 0.75] : [0]) {
          it(`${quem} · ${pose} · ${dir > 0 ? 'direita' : 'esquerda'}${pose === 'anda' ? ` · passo ${passo}` : ''}`, () => {
            const h = quem === 'irmao' ? 150 : quem === 'menina' || quem === 'meninaPalco' ? 120 : 170;
            const d = familia[quem](150, CHAO, h, pose, { dir, passo });
            const j = d.juntas!;
            expect(j.bracos).toHaveLength(2);
            expect(j.pernas).toHaveLength(2);
            for (const [ombro, cotovelo, punho] of j.bracos) {
              /* o cotovelo dobra de esticado até uns 35°; menos que isso é o antebraço atravessando o braço */
              expect(anguloDaJunta(ombro, cotovelo, punho)).toBeGreaterThanOrEqual(35);
              /* a mão fica fora da cabeça: ao lado, acima ou abaixo, nunca por dentro dela */
              expect(dist(punho, d.cabeca)).toBeGreaterThanOrEqual(d.raioCabeca * 0.95);
              /* os segmentos têm o comprimento do corpo: braço 0,17 h, antebraço 0,15 h */
              expect(dist(ombro, cotovelo)).toBeCloseTo(0.17 * h, 0);
              expect(dist(cotovelo, punho)).toBeCloseTo(0.15 * h, 0);
              /* nada abaixo do chão */
              expect(punho[1]).toBeLessThanOrEqual(CHAO + 1);
            }
            for (const [quadril, joelho, tornozelo, pe] of j.pernas) {
              /* o joelho dobra de esticado até uns 30° (o passé e o giro chegam perto) */
              expect(anguloDaJunta(quadril, joelho, tornozelo)).toBeGreaterThanOrEqual(30);
              /* o pé não afunda no chão (no balanço o chão é o assento, e as pernas penduram abaixo dele) */
              if (pose !== 'balanco') {
                expect(tornozelo[1]).toBeLessThanOrEqual(CHAO + 0.02 * h);
                expect(pe[1]).toBeLessThanOrEqual(CHAO + 0.16 * h);
              }
            }
            /* em pé, pelo menos uma perna apoia: o tornozelo dela fica abaixo do quadril (a outra
               pode subir, no arabesque e na attitude); sentada ou deitada, as pernas saem para o lado */
            if (!['sentado', 'balanco', 'deitado', 'escorrega'].includes(pose)) expect(j.pernas.some(([quadril, , tornozelo]) => tornozelo[1] > quadril[1] + 0.2 * h)).toBe(true);
          });
        }
      }
    }
  }
});
