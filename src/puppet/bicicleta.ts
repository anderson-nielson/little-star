import { circ, CORES as C, familia, type Desenho } from './boneco';
import { coelho } from './objetos';
import { escuro, fio, fios, forma } from './pincel';
import type { Enfeite } from '@/core/bicicleta';

/**
 * A bicicletinha, a lápis e aquarela: rosa, com rodinhas, cestinha de vime com
 * o coelhinho, e os enfeites que ela ganha rota a rota (a bandeirinha, as
 * fitas do guidão, a campainha, a buzina de pera). Tudo em função de `R`, o
 * raio da roda. A origem é o chão, no meio entre as rodas; x é para a frente.
 * Com a Stella, ela vai sentada na marionete (`familia.stella`, sentada), o
 * capacete rosa-claro por cima do cabelo e as mãos no guidão.
 */
export interface OpcoesBicicleta {
  /** o ângulo do pedal e das rodas, em voltas (0 a 1) */
  volta?: number;
  rodinhas?: boolean;
  enfeites?: Enfeite[];
  /** só a bicicleta encostada, sem ninguém */
  semStella?: boolean;
  /** abaixada, para passar embaixo do galho */
  abaixada?: boolean;
  capacete?: boolean;
  cor?: string;
}

const f = (n: number) => Math.round(n * 10) / 10;
function elipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;
}

function roda(cx: number, cy: number, R: number, ang: number): string {
  let s = forma(circ([cx, cy], R), C.creme, { lapis: 0.5, op: 0.5 });
  s += `<path d="${circ([cx, cy], R)}" fill="none" stroke="${escuro(C.preto, 0.1)}" stroke-width="${f(R * 0.25)}" opacity="0.8"/>`;
  let raios = '';
  for (let i = 0; i < 6; i++) {
    const a = ang + (i * Math.PI) / 3;
    raios += `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a) * (R - 2))} ${f(cy + Math.sin(a) * (R - 2))}`;
  }
  s += fio(raios, C.ouro, 1, 0.7);
  s += forma(circ([cx, cy], R * 0.16), C.ouro, { mudo: true });
  return s;
}

/** A proporção da Stella para a roda: a altura dela é sete raios. */
export const ALTURA_POR_RAIO = 7;

/** O capacete rosa-claro: uma calota sobre a cabeça, com os fios do lápis. */
export function capacete(cabeca: [number, number], hr: number): string {
  const [hx, hy] = cabeca;
  const d = `M${f(hx - hr - 2)} ${f(hy - 2)}C${f(hx - hr - 2)} ${f(hy - hr - 10)} ${f(hx + hr + 3)} ${f(hy - hr - 10)} ${f(hx + hr + 3)} ${f(hy - 3)}Q${f(hx)} ${f(hy - 6)} ${f(hx - hr - 2)} ${f(hy - 2)}z`;
  return forma(d, C.rosaClara, { lapis: 0.45 }) + fios([`M${f(hx - 6)} ${f(hy - hr - 5)}q6 -2 12 0`, `M${f(hx + hr + 2)} ${f(hy - 3)}l-2 12`], escuro(C.rosaClara, 0.35), 0.9, 0.6);
}

/** A bicicleta, na origem (o chão entre as rodas). Devolve o svg e, com a Stella, onde fica a cabeça dela. */
export function bicicleta(R: number, o: OpcoesBicicleta = {}): { svg: string; cabeca: [number, number] | null } {
  const volta = o.volta ?? 0;
  const cor = o.cor ?? C.rosaDoce;
  const enf = o.enfeites ?? [];
  const rx = -1.7 * R;
  const fx = 1.7 * R;
  const cy = -R;
  const cr: [number, number] = [0.6 * R, -1.3 * R];
  const sela: [number, number] = [-0.9 * R, -3.0 * R];
  const tubo: [number, number] = [1.3 * R, -2.8 * R];
  const guidao: [number, number] = [1.55 * R, -3.25 * R];
  let s = '';
  if (o.rodinhas ?? true) s += forma(circ([rx - 0.5 * R, -0.4 * R], 0.4 * R), C.creme, { lapis: 0.45, op: 0.8 }) + fio(`M${f(rx - 0.5 * R)} ${f(-0.4 * R)}L${f(rx - 0.1 * R)} ${f(-1.3 * R)}`, '#b9b2a6', R * 0.14, 0.9);
  const ang = volta * Math.PI * 2;
  s += roda(rx, cy, R, ang) + roda(fx, cy, R, ang);
  /* o quadro: um tubo grosso da cor dela com o lápis por baixo */
  const q = `M${f(rx)} ${f(cy)}L${f(cr[0])} ${f(cr[1])}L${f(sela[0])} ${f(sela[1])}M${f(cr[0])} ${f(cr[1])}L${f(tubo[0])} ${f(tubo[1])}L${f(sela[0] + 0.15 * R)} ${f(sela[1] + 0.25 * R)}M${f(tubo[0])} ${f(tubo[1])}L${f(fx)} ${f(cy)}M${f(rx)} ${f(cy)}L${f(sela[0])} ${f(sela[1])}`;
  s += fio(q, escuro(cor, 0.15), R * 0.26, 1) + fio(q, cor, R * 0.16, 1);
  /* o selim, o guidão, o pedal */
  s += forma(`M${f(sela[0] - 0.5 * R)} ${f(sela[1] - 0.12 * R)}q${f(0.5 * R)} ${f(-0.25 * R)} ${f(R)} 0l${f(-0.06 * R)} ${f(0.2 * R)}h${f(-0.88 * R)}z`, C.preto, { lapis: 0.2 });
  s += fio(`M${f(tubo[0])} ${f(tubo[1])}L${f(guidao[0])} ${f(guidao[1])}`, escuro(cor, 0.15), R * 0.24, 1) + fio(`M${f(tubo[0])} ${f(tubo[1])}L${f(guidao[0])} ${f(guidao[1])}`, cor, R * 0.15, 1);
  s += fio(`M${f(guidao[0] - 0.45 * R)} ${f(guidao[1] - 0.05 * R)}q${f(0.5 * R)} ${f(-0.25 * R)} ${f(R)} 0`, C.preto, R * 0.18, 0.9);
  s += forma(circ(cr, 0.25 * R), '#8f6f2c', { mudo: true });
  const p1: [number, number] = [cr[0] + Math.cos(ang) * 0.55 * R, cr[1] + Math.sin(ang) * 0.55 * R];
  const p2: [number, number] = [cr[0] - Math.cos(ang) * 0.55 * R, cr[1] - Math.sin(ang) * 0.55 * R];
  s += fio(`M${f(cr[0])} ${f(cr[1])}L${f(p1[0])} ${f(p1[1])}M${f(cr[0])} ${f(cr[1])}L${f(p2[0])} ${f(p2[1])}`, C.preto, R * 0.12, 0.9);
  for (const p of [p1, p2]) s += forma(`M${f(p[0] - 0.25 * R)} ${f(p[1] - 0.09 * R)}h${f(0.5 * R)}v${f(0.18 * R)}h${f(-0.5 * R)}z`, C.preto, { mudo: true });
  /* a cestinha, de vime quando ela ganha, com o coelhinho espiando */
  const vime = enf.includes('cestinha');
  const cx0 = fx - 0.2 * R;
  const cyT = -4.1 * R;
  s += forma(`M${f(cx0)} ${f(cyT)}h${f(1.4 * R)}l${f(-0.2 * R)} ${f(R)}h${f(-R)}z`, vime ? C.madeira : C.creme, { lapis: 0.45 });
  s += fios([`M${f(cx0 + 0.2 * R)} ${f(cyT + 0.3 * R)}h${f(R)}`, `M${f(cx0 + 0.25 * R)} ${f(cyT + 0.6 * R)}h${f(0.9 * R)}`], escuro(vime ? C.madeira : C.creme, 0.3), 0.9, 0.6);
  s += coelho(cx0 + 0.35 * R, cyT + 0.05 * R, R * 0.55);
  if (enf.includes('bandeirinha')) s += fio(`M${f(rx)} ${f(-2.2 * R)}V${f(-4.9 * R)}`, C.madeira, R * 0.1, 0.9) + forma(`M${f(rx)} ${f(-4.9 * R)}l${f(R)} ${f(0.3 * R)}l${f(-R)} ${f(0.3 * R)}z`, C.rosaDoce, { lapis: 0.35 });
  if (enf.includes('fitas')) s += fios([`M${f(guidao[0] + 0.4 * R)} ${f(guidao[1])}q${f(0.5 * R)} ${f(-0.3 * R)} ${f(0.9 * R)} ${f(-0.9 * R)}`, `M${f(guidao[0] + 0.4 * R)} ${f(guidao[1])}q${f(0.6 * R)} ${f(0.1 * R)} ${f(1.1 * R)} ${f(-0.3 * R)}`], C.rosaDoce, R * 0.11, 0.9);
  if (enf.includes('campainha')) s += forma(circ([guidao[0] - 0.7 * R, guidao[1] - 0.15 * R], 0.2 * R), C.ouro, { lapis: 0.35 });
  if (enf.includes('buzina')) s += forma(circ([tubo[0] - 0.3 * R, tubo[1] - 0.2 * R], 0.22 * R), '#d2463c', { lapis: 0.3 }) + fio(`M${f(tubo[0] - 0.15 * R)} ${f(tubo[1] - 0.3 * R)}q${f(0.5 * R)} ${f(-0.25 * R)} ${f(0.9 * R)} ${f(-0.35 * R)}`, C.preto, R * 0.12, 0.9);
  if (o.semStella) return { svg: `<g>${s}</g>`, cabeca: null };

  /* a Stella sentada no selim: a marionete, com o quadril na sela e os pés nos pedais */
  const h = ALTURA_POR_RAIO * R;
  const ySela = sela[1] + 0.153 * h;
  const d: Desenho = familia.stella(sela[0], ySela, h, 'sentado');
  let t = `<g${o.abaixada ? ` transform="translate(0 ${f(0.6 * R)}) scale(1 0.82) translate(0 ${f(-0.6 * R)})" transform-origin="0 ${f(-R)}"` : ''}>${d.svg}`;
  /* as mãos chegam ao guidão: a haste vai do tubo até a mão da frente */
  t += fio(`M${f(tubo[0])} ${f(tubo[1])}L${f(d.maoR[0])} ${f(d.maoR[1])}`, cor, R * 0.12, 0.9);
  if (o.capacete ?? true) t += capacete(d.cabeca, d.raioCabeca);
  t += '</g>';
  return { svg: `<g>${s}${t}</g>`, cabeca: d.cabeca };
}

/** A bicicletinha pequena, encostada: no quintal, na mesa da estação, na roda. */
export function bicicletinha(x: number, y: number, R: number, enfeites: Enfeite[] = [], inclinada = -6): string {
  return `<g transform="translate(${x} ${y}) rotate(${inclinada})">${bicicleta(R, { semStella: true, enfeites, rodinhas: true, volta: 0.15 }).svg}</g>`;
}

/**
 * O gambá de verdade (o marsupial), com os filhotes nas costas: corpo pardo,
 * carinha clara e comprida, nariz rosa, o rabo comprido. Anda gingando (`passo`).
 */
export function gamba(x: number, chao: number, s: number, passo = 0): string {
  const b = Math.sin(passo) * s * 0.06;
  const cor = '#8f8478';
  const claro = '#e8e0d2';
  let g = '';
  g += fio(`M${f(x - 0.65 * s)} ${f(chao - 0.4 * s + b)}q${f(-0.55 * s)} ${f(0.08 * s)} ${f(-0.72 * s)} ${f(-0.4 * s)}`, claro, s * 0.14, 0.9) + fio(`M${f(x - 0.65 * s)} ${f(chao - 0.4 * s + b)}q${f(-0.55 * s)} ${f(0.08 * s)} ${f(-0.72 * s)} ${f(-0.4 * s)}`, escuro(cor, 0.2), s * 0.06, 0.7);
  g += forma(`M${f(x - 0.68 * s)} ${f(chao - 0.08 * s + b)}C${f(x - 0.88 * s)} ${f(chao - 0.72 * s)} ${f(x - 0.32 * s)} ${f(chao - 1.04 * s)} ${f(x + 0.32 * s)} ${f(chao - 0.88 * s)}L${f(x + 0.64 * s)} ${f(chao - 0.4 * s)}L${f(x + 0.48 * s)} ${f(chao)}z`, cor, { lapis: 0.35 });
  g += forma(elipse(x - 0.32 * s, chao - 0.04 * s, 0.16 * s, 0.08 * s), cor, { mudo: true }) + forma(elipse(x + 0.24 * s, chao - 0.04 * s - b, 0.16 * s, 0.08 * s), cor, { mudo: true });
  g += forma(`M${f(x + 0.24 * s)} ${f(chao - 0.96 * s)}q${f(0.4 * s)} ${f(-0.08 * s)} ${f(0.72 * s)} ${f(0.32 * s)}q${f(-0.32 * s)} ${f(0.24 * s)} ${f(-0.64 * s)} ${f(0.08 * s)}z`, claro, { lapis: 0.35 });
  g += forma(`M${f(x + 0.32 * s)} ${f(chao - 1.04 * s)}l${f(-0.08 * s)} ${f(-0.32 * s)}l${f(0.24 * s)} ${f(0.2 * s)}z`, cor, { lapis: 0.35 }) + forma(`M${f(x + 0.6 * s)} ${f(chao - 0.88 * s)}l${f(0.12 * s)} ${f(-0.32 * s)}l${f(0.12 * s)} ${f(0.32 * s)}z`, cor, { lapis: 0.35 });
  g += `<circle cx="${f(x + 0.98 * s)}" cy="${f(chao - 0.62 * s)}" r="${f(0.065 * s)}" fill="${C.rosaDoce}"/><circle cx="${f(x + 0.6 * s)}" cy="${f(chao - 0.76 * s)}" r="${f(0.045 * s)}" fill="${C.lapisTinta}" opacity=".8"/>`;
  for (let i = 0; i < 3; i++) {
    const fx = x - 0.48 * s + i * 0.32 * s;
    const fy = chao - 0.96 * s - (i === 1 ? 0.12 * s : 0.04 * s) + b * 0.5;
    g += forma(circ([fx, fy], 0.14 * s), cor, { lapis: 0.35 }) + forma(`M${f(fx - 0.08 * s)} ${f(fy - 0.12 * s)}l${f(-0.04 * s)} ${f(-0.12 * s)}l${f(0.12 * s)} ${f(0.04 * s)}z`, cor, { mudo: true }) + forma(`M${f(fx + 0.08 * s)} ${f(fy - 0.12 * s)}l${f(0.04 * s)} ${f(-0.12 * s)}l${f(-0.12 * s)} ${f(0.04 * s)}z`, cor, { mudo: true }) + `<circle cx="${f(fx + 0.04 * s)}" cy="${f(fy)}" r="${f(0.03 * s)}" fill="${C.lapisTinta}" opacity=".8"/>`;
  }
  return `<g>${g}</g>`;
}
