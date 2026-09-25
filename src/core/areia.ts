/**
 * A geometria da caixa de areia em estrela, sem DOM: a estrela vista de cima
 * e a caixa onde uma letra cabe inteira dentro da areia. As letras vivem em
 * coordenadas de 0 a 1 (ver `fita.ts`); aqui elas ganham lugar na cena.
 */
import { pontosDoTraco, type Ponto, type TracoDado } from './fita';

export const ESTRELA = { cx: 195, cy: 380, R: 230, achatamento: 0.92, miolo: 0.45, areia: 0.86 };

/** Os dez vértices da estrela, em escala `k` do raio (1 é a borda vermelha, `areia` é a areia). */
export function verticesDaEstrela(k: number): Ponto[] {
  const { cx, cy, R, achatamento, miolo } = ESTRELA;
  const out: Ponto[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = (i % 2 ? R * miolo : R) * k;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * achatamento]);
  }
  return out;
}

export function caminhoDaEstrela(k: number): string {
  return verticesDaEstrela(k)
    .map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1))
    .join('') + 'z';
}

/** Um ponto está dentro de um polígono (raio para a direita). */
export function dentroDoPoligono(p: Ponto, poli: Ponto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i]!;
    const [xj, yj] = poli[j]!;
    const cruza = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

export interface CaixaDaLetra {
  x: number;
  y: number;
  lado: number;
}

/** A folga em volta do traço, para o sulco do dedo não bater na borda vermelha. */
export const FOLGA_DA_LETRA = 16;
export const LADO_MAXIMO = 210;
export const LADO_MINIMO = 120;

/**
 * A maior caixa quadrada, centrada na estrela, em que a letra inteira cabe na
 * areia com folga. Cada letra tem a sua: o A é fino em cima e cabe grande, o
 * T é largo em cima e cabe menor. Nunca fica menor que `LADO_MINIMO`.
 */
export function caixaDaLetra(tracos: TracoDado[]): CaixaDaLetra {
  const areia = verticesDaEstrela(ESTRELA.areia);
  const pontos = tracos.flatMap((t) => pontosDoTraco(t));
  const cabe = (lado: number, cy: number) => {
    const x0 = ESTRELA.cx - lado / 2;
    const y0 = cy - lado / 2;
    for (const p of pontos) {
      const q: Ponto = [x0 + p[0] * lado, y0 + p[1] * lado];
      for (const [dx, dy] of [[0, 0], [FOLGA_DA_LETRA, 0], [-FOLGA_DA_LETRA, 0], [0, FOLGA_DA_LETRA], [0, -FOLGA_DA_LETRA]] as Ponto[]) {
        if (!dentroDoPoligono([q[0] + dx, q[1] + dy], areia)) return false;
      }
    }
    return true;
  };
  for (let lado = LADO_MAXIMO; lado >= LADO_MINIMO; lado -= 10) {
    /* o centro pode subir ou descer um pouco para achar o lugar mais largo */
    for (const dy of [0, -10, 10, -20, 20, -30, 30]) {
      const cy = ESTRELA.cy + dy;
      if (cabe(lado, cy)) return { x: ESTRELA.cx - lado / 2, y: cy - lado / 2, lado };
    }
  }
  return { x: ESTRELA.cx - LADO_MINIMO / 2, y: ESTRELA.cy - LADO_MINIMO / 2, lado: LADO_MINIMO };
}
