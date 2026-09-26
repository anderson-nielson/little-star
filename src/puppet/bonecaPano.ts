import { circ, CORES as C, limb, type Desenho, type Ponto } from './boneco';
import { centelha } from './objetos';

/**
 * A boneca Waldorf de pano, desenhada à parte da marionete: cabeça grande e
 * redonda, corpo curtinho e macio, cabelo de lã em fios, rosto quase liso
 * (dois pontos e um sorriso pequeno), a costura aparecendo na barra. Cada
 * boneca tem o seu penteado, que é o jeito dela; o que a Stella troca é o
 * vestido e o enfeite da cabeça. A primeira é a Estrellita, a bailarina.
 */
export type Penteado = 'coque' | 'trancas' | 'cachos' | 'chiquinhas' | 'solto';
export type Enfeite = 'nenhum' | 'laco' | 'gorro' | 'flores' | 'chapeu';
export const ENFEITES: Exclude<Enfeite, 'nenhum'>[] = ['laco', 'gorro', 'flores', 'chapeu'];

/* só hex aqui em cima: o boneco.ts importa este arquivo, e as CORES dele ainda não existem
   quando este módulo é avaliado */
/** o vestido de cada uma quando chega, e o cabelo de lã (que não muda) */
export const BONECAS = [
  { nome: 'Estrellita', penteado: 'coque', roupa: '#f2a9c4', cabelo: '#e2c27a' },
  { nome: 'Lina', penteado: 'trancas', roupa: '#a58bc4', cabelo: '#b07a4f' },
  { nome: 'Nina', penteado: 'cachos', roupa: '#7FA5B8', cabelo: '#4a3222' },
  { nome: 'Lulu', penteado: 'chiquinhas', roupa: '#ebd9a8', cabelo: '#d97f74' },
  { nome: 'Bia', penteado: 'solto', roupa: '#D9B4A6', cabelo: '#c9a05f' },
] as const satisfies readonly { nome: string; penteado: Penteado; roupa: string; cabelo: string }[];

export interface OpcoesBoneca {
  roupa?: string;
  cabelo?: string;
  enfeite?: Enfeite;
  contorno?: string;
  /** a mão direita vai até este ponto (dar a mão para a Stella) */
  maoR?: Ponto;
}

const PELE = '#F3DCC8';
const SAPATO = '#c9a189';
const COR_ENFEITE: Record<Exclude<Enfeite, 'nenhum'>, string> = { laco: '#d97f74', gorro: '#c6a15b', flores: '#8fae6b', chapeu: '#eeddb4' };
export { COR_ENFEITE };

const r1 = (n: number) => Math.round(n * 10) / 10;

export function bonecaPano(x: number, y: number, h: number, i: number, o: OpcoesBoneca = {}): Desenho {
  const b = BONECAS[i % BONECAS.length]!;
  const s = h / 100;
  const P = (dx: number, dy: number): Ponto => [r1(x + dx * s), r1(y + dy * s)];
  const pt = (dx: number, dy: number) => P(dx, dy).join(' ');
  const roupa = o.roupa ?? b.roupa;
  const cabelo = o.cabelo ?? b.cabelo;
  const enfeite = o.enfeite ?? 'nenhum';
  const bailarina = b.penteado === 'coque';
  const ct = o.contorno ? ` stroke="${o.contorno}" stroke-width="1" stroke-linejoin="round"` : '';
  const fio = `stroke="${C.tinta}" stroke-opacity="0.14" stroke-width="${r1(0.9 * s)}" fill="none" stroke-linecap="round"`;
  const costura = (d: string, cor: string = C.papel) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${r1(0.8 * s)}" stroke-dasharray="${r1(1.6 * s)} ${r1(1.4 * s)}" stroke-linecap="round" opacity="0.85"/>`;

  const hr = 17;
  const cab = P(0, -79);
  const hy = -79;
  let atras = '';
  let frente = '';

  /* cabelo de lã: a touca de fios por cima da cabeça, sempre */
  const touca =
    `<path d="M${pt(-hr - 1.2, hy + 3)}A${r1((hr + 1.2) * s)} ${r1((hr + 1.2) * s)} 0 0 1 ${pt(hr + 1.2, hy + 3)}` +
    `Q${pt(hr - 2, hy - 9)} ${pt(4, hy - 8)}Q${pt(-3, hy - 12)} ${pt(-hr - 1.2, hy + 3)}z" fill="${cabelo}"${ct}/>` +
    `<path d="M${pt(3, hy - 17)}Q${pt(-8, hy - 12)} ${pt(-14, hy - 3)}M${pt(3, hy - 17)}Q${pt(12, hy - 13)} ${pt(15, hy - 4)}M${pt(3, hy - 17)}Q${pt(-2, hy - 12)} ${pt(-4, hy - 9)}" ${fio}/>`;

  const escondeTopo = enfeite === 'gorro' || enfeite === 'chapeu';
  switch (b.penteado) {
    case 'coque':
      if (!escondeTopo) frente += `<path d="${circ(P(0, hy - 19), 6.5 * s)}" fill="${cabelo}"${ct}/><path d="M${pt(-5, hy - 19)}Q${pt(0, hy - 23)} ${pt(5, hy - 18)}" ${fio}/>` + (enfeite === 'nenhum' ? centelha(x + 5 * s, y + (hy - 23) * s, 7 * s, C.ouro) : '');
      atras += `<path d="M${pt(-hr - 1, hy + 2)}Q${pt(-hr - 2, hy + 10)} ${pt(-hr + 3, hy + 13)}L${pt(hr - 3, hy + 13)}Q${pt(hr + 2, hy + 10)} ${pt(hr + 1, hy + 2)}z" fill="${cabelo}"/>`;
      break;
    case 'trancas':
      for (const lado of [-1, 1]) {
        let d = '';
        for (let k = 0; k < 4; k++) d += circ(P(lado * (hr + 1 - k * 0.6), hy + 6 + k * 6), (3.6 - k * 0.3) * s);
        atras += `<path d="${d}" fill="${cabelo}"${ct}/>`;
        atras += `<path d="M${pt(lado * (hr + 2.5), hy + 4)}q${r1(-lado * 2 * s)} ${r1(3 * s)} 0 ${r1(6 * s)}M${pt(lado * (hr + 1.9), hy + 10)}q${r1(-lado * 2 * s)} ${r1(3 * s)} 0 ${r1(6 * s)}M${pt(lado * (hr + 1.3), hy + 16)}q${r1(-lado * 2 * s)} ${r1(3 * s)} 0 ${r1(6 * s)}" ${fio}/>`;
        /* a fitinha e a pontinha da trança */
        atras += `<path d="M${pt(lado * (hr - 1.2), hy + 26)}l${r1(-lado * 1 * s)} ${r1(5 * s)}l${r1(lado * 1.6 * s)} 0l${r1(lado * 1.4 * s)} ${r1(-5 * s)}z" fill="${cabelo}"/>`;
        atras += `<path d="${circ(P(lado * (hr - 0.5), hy + 25.5), 1.8 * s)}" fill="${C.papel}"/>`;
      }
      break;
    case 'cachos': {
      let d = '';
      for (let k = 0; k <= 12; k++) {
        const a = Math.PI * (0.92 + (1.16 * k) / 12);
        d += circ(P(Math.cos(a) * (hr + 1), hy + Math.sin(a) * (hr + 1)), 4.4 * s);
      }
      for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) d += circ(P(lado * (hr + 0.5 - k * 0.8), hy + 8 + k * 5.5), 4 * s);
      atras += `<path d="${d}" fill="${cabelo}"${ct}/>`;
      break;
    }
    case 'chiquinhas':
      for (const lado of [-1, 1]) {
        atras += `<path d="${circ(P(lado * (hr + 4), hy - 7), 6.8 * s) + circ(P(lado * (hr + 7), hy - 1), 5 * s)}" fill="${cabelo}"${ct}/>`;
        atras += `<path d="M${pt(lado * (hr + 1), hy - 12)}q${r1(lado * 5 * s)} ${r1(1 * s)} ${r1(lado * 8 * s)} ${r1(8 * s)}M${pt(lado * (hr + 2), hy - 5)}q${r1(lado * 5 * s)} ${r1(1 * s)} ${r1(lado * 8 * s)} ${r1(7 * s)}" ${fio}/>`;
        if (!escondeTopo) frente += `<path d="${circ(P(lado * (hr - 1), hy - 10), 2.3 * s)}" fill="${roupa}" stroke="${C.papel}" stroke-width="${r1(0.8 * s)}"/>`;
      }
      break;
    case 'solto':
      atras += `<path d="M${pt(-hr - 1.5, hy)}Q${pt(-hr - 4, hy + 22)} ${pt(-hr + 1, hy + 30)}L${pt(hr - 1, hy + 30)}Q${pt(hr + 4, hy + 22)} ${pt(hr + 1.5, hy)}z" fill="${cabelo}"${ct}/>`;
      atras += `<path d="M${pt(-hr, hy + 6)}Q${pt(-hr - 2, hy + 20)} ${pt(-hr + 2, hy + 29)}M${pt(hr, hy + 6)}Q${pt(hr + 2, hy + 20)} ${pt(hr - 2, hy + 29)}M${pt(-hr + 3, hy + 14)}l0 ${r1(15 * s)}M${pt(hr - 3, hy + 14)}l0 ${r1(15 * s)}" ${fio}/>`;
      break;
  }

  /* o enfeite da cabeça */
  let enf = '';
  if (enfeite === 'laco') {
    const cor = COR_ENFEITE.laco;
    const [lx, ly] = [hr * 0.5, hy - hr * 0.85];
    enf += `<path d="M${pt(lx, ly)}L${pt(lx - 8, ly - 5.5)}Q${pt(lx - 10, ly)} ${pt(lx - 8, ly + 5.5)}zM${pt(lx, ly)}L${pt(lx + 8, ly - 5.5)}Q${pt(lx + 10, ly)} ${pt(lx + 8, ly + 5.5)}z" fill="${cor}"/>`;
    enf += `<path d="${circ(P(lx, ly), 2.6 * s)}" fill="${cor}" stroke="${C.papel}" stroke-width="${r1(0.6 * s)}" stroke-opacity="0.6"/>`;
  } else if (enfeite === 'gorro') {
    const cor = COR_ENFEITE.gorro;
    enf += `<path d="M${pt(-hr - 1.5, hy - 3)}Q${pt(-hr, hy - 25)} ${pt(0, hy - 25)}Q${pt(hr, hy - 25)} ${pt(hr + 1.5, hy - 3)}z" fill="${cor}"${ct}/>`;
    enf += `<rect x="${r1(x - (hr + 2.5) * s)}" y="${r1(y + (hy - 7) * s)}" width="${r1((2 * hr + 5) * s)}" height="${r1(6.5 * s)}" rx="${r1(3 * s)}" fill="#b08d4c"/>`;
    let riscas = '';
    for (let k = -8; k <= 8; k++) riscas += `M${pt(k * 2.2, hy - 6)}l0 ${r1(4.5 * s)}`;
    enf += `<path d="${riscas}" stroke="${C.papel}" stroke-opacity="0.35" stroke-width="${r1(0.7 * s)}"/>`;
    enf += `<path d="M${pt(-9, hy - 18)}q${r1(4 * s)} ${r1(-3 * s)} ${r1(8 * s)} 0M${pt(1, hy - 21)}q${r1(4 * s)} ${r1(-3 * s)} ${r1(8 * s)} 0" ${fio}/>`;
    enf += `<path d="${circ(P(0, hy - 27), 5 * s)}" fill="${C.papel}"/>`;
  } else if (enfeite === 'flores') {
    const cores = [C.papel, C.rosaDoce, C.luz, C.rosaDoce, C.papel];
    for (let k = 0; k < 5; k++) {
      const a = Math.PI * (1.12 + (0.76 * k) / 4);
      const c = P(Math.cos(a) * (hr + 0.5), hy + Math.sin(a) * (hr + 0.5));
      const folha = P(Math.cos(a + 0.18) * (hr + 1.5), hy + Math.sin(a + 0.18) * (hr + 1.5));
      enf += `<ellipse cx="${folha[0]}" cy="${folha[1]}" rx="${r1(3 * s)}" ry="${r1(1.6 * s)}" transform="rotate(${r1((a * 180) / Math.PI + 90)} ${folha[0]} ${folha[1]})" fill="${COR_ENFEITE.flores}"/>`;
      let pet = '';
      for (let p = 0; p < 5; p++) pet += circ([c[0] + Math.cos((p * 2 * Math.PI) / 5) * 2.2 * s, c[1] + Math.sin((p * 2 * Math.PI) / 5) * 2.2 * s], 1.9 * s);
      enf += `<path d="${pet}" fill="${cores[k]}"/><path d="${circ(c, 1.4 * s)}" fill="${C.ouro}"/>`;
    }
  } else if (enfeite === 'chapeu') {
    const cor = COR_ENFEITE.chapeu;
    enf += `<ellipse cx="${x}" cy="${r1(y + (hy - 7) * s)}" rx="${r1((hr + 10) * s)}" ry="${r1(5 * s)}" fill="${cor}" stroke="#d9c69a" stroke-width="${r1(0.8 * s)}"/>`;
    enf += `<path d="M${pt(-hr + 3, hy - 7)}Q${pt(-hr + 3, hy - 24)} ${pt(0, hy - 24)}Q${pt(hr - 3, hy - 24)} ${pt(hr - 3, hy - 7)}z" fill="${cor}" stroke="#d9c69a" stroke-width="${r1(0.8 * s)}"/>`;
    enf += `<path d="M${pt(-hr + 3.2, hy - 11)}L${pt(hr - 3.2, hy - 11)}L${pt(hr - 3.1, hy - 7.5)}L${pt(-hr + 3.1, hy - 7.5)}z" fill="${C.rosaDoce}"/>`;
    enf += costura(`M${pt(-hr - 7, hy - 7)}Q${pt(0, hy - 3)} ${pt(hr + 7, hy - 7)}`, '#d9c69a');
  }

  /* o corpo: pernas curtas, sapatinhos, vestido em A com gola e costura, bracinhos macios */
  const pernas = limb(P(-5, -30), P(-5.5, -4), 3.8 * s, 3.4 * s) + limb(P(5, -30), P(5.5, -4), 3.8 * s, 3.4 * s);
  let pes = '';
  if (bailarina) {
    pes = `<path d="${circ(P(-6, -3), 3.8 * s) + circ(P(6, -3), 3.8 * s)}" fill="${C.rosaDoce}"/>` + `<path d="M${pt(-8, -7)}l${r1(4 * s)} ${r1(-4 * s)}M${pt(-4, -7)}l${r1(-4 * s)} ${r1(-4 * s)}M${pt(4, -7)}l${r1(4 * s)} ${r1(-4 * s)}M${pt(8, -7)}l${r1(-4 * s)} ${r1(-4 * s)}" stroke="${C.rosaDoce}" stroke-width="${r1(0.9 * s)}" stroke-linecap="round"/>`;
  } else {
    pes = `<ellipse cx="${pt(-6.5, -3).split(' ')[0]}" cy="${r1(y - 3 * s)}" rx="${r1(5.2 * s)}" ry="${r1(3.4 * s)}" fill="${SAPATO}"/><ellipse cx="${pt(6.5, -3).split(' ')[0]}" cy="${r1(y - 3 * s)}" rx="${r1(5.2 * s)}" ry="${r1(3.4 * s)}" fill="${SAPATO}"/>`;
  }

  const ombroL = P(-11, -59);
  const ombroR = P(11, -59);
  const maoL = P(-21, -36);
  const maoR = o.maoR ?? P(21, -36);
  /* o braço dobra suave: cotovelo um pouco para fora */
  const cotovelo = (a: Ponto, m: Ponto, lado: number): Ponto => {
    const mx = (a[0] + m[0]) / 2;
    const my = (a[1] + m[1]) / 2;
    return [r1(mx + lado * 2.2 * s), r1(my)];
  };
  const cL = cotovelo(ombroL, maoL, -1);
  const cR = cotovelo(ombroR, maoR, o.maoR ? 0 : 1);
  const bracos = limb(ombroL, cL, 3.6 * s, 3.2 * s) + limb(cL, maoL, 3.2 * s, 3.2 * s) + circ(maoL, 4 * s) + limb(ombroR, cR, 3.6 * s, 3.2 * s) + limb(cR, maoR, 3.2 * s, 3.2 * s) + circ(maoR, 4 * s);

  let vestido = '';
  if (bailarina) {
    /* collant e tutu de tule em camadas */
    vestido += `<path d="M${pt(-10, -61)}Q${pt(0, -64)} ${pt(10, -61)}L${pt(9, -38)}Q${pt(0, -36)} ${pt(-9, -38)}z" fill="${roupa}"${ct}/>`;
    let tule = '';
    for (let k = 0; k <= 8; k++) tule += circ(P(-21 + k * 5.25, -35 + Math.abs(k - 4) * 0.5), 4.2 * s);
    vestido += `<path d="M${pt(-23, -38)}Q${pt(0, -46)} ${pt(23, -38)}L${pt(23, -35)}L${pt(-23, -35)}z${tule}" fill="${roupa}" opacity="0.72"/>`;
    vestido += `<path d="M${pt(-17, -40)}Q${pt(0, -46)} ${pt(17, -40)}L${pt(18, -36)}Q${pt(0, -34)} ${pt(-18, -36)}z" fill="${C.papel}" opacity="0.35"/>`;
    vestido += costura(`M${pt(-8, -40)}Q${pt(0, -42)} ${pt(8, -40)}`);
  } else {
    const barra = -24;
    vestido += `<path d="M${pt(-10, -61)}Q${pt(0, -63.5)} ${pt(10, -61)}L${pt(22, barra)}Q${pt(0, barra + 4.5)} ${pt(-22, barra)}z" fill="${roupa}"${ct}/>`;
    vestido += costura(`M${pt(-19.5, barra - 3)}Q${pt(0, barra + 1.2)} ${pt(19.5, barra - 3)}`);
    /* bolinhas bordadas */
    let bol = '';
    for (const [dx, dy] of [[-8, -40], [4, -46], [10, -34], [-2, -31], [-13, -30], [14, -27.5], [-5, -52], [6, -55]] as const) bol += circ(P(dx, dy), 1.1 * s);
    vestido += `<path d="${bol}" fill="${C.papel}" opacity="0.55"/>`;
    /* golinha redonda */
    vestido += `<path d="M${pt(-7, -61)}Q${pt(-7, -54)} ${pt(0, -57.5)}Q${pt(7, -54)} ${pt(7, -61)}Q${pt(0, -62)} ${pt(-7, -61)}z" fill="${C.papel}"/>`;
  }
  /* manguinhas bufantes (a bailarina tem alça) */
  const mangas = bailarina ? '' : `<path d="${circ(P(-11, -58), 5 * s) + circ(P(11, -58), 5 * s)}" fill="${roupa}"${ct}/>`;

  /* rosto: dois pontos, um sorriso pequeno, bochechas de tinta */
  const [cx, cy] = cab;
  const rosto =
    `<path d="${circ(P(-5.5, hy + 1.5), 1.35 * s) + circ(P(5.5, hy + 1.5), 1.35 * s)}" fill="${C.tinta}" opacity="0.72"/>` +
    `<path d="M${pt(-3.2, hy + 7)}q${r1(3.2 * s)} ${r1(2.6 * s)} ${r1(6.4 * s)} 0" fill="none" stroke="${C.veludo}" stroke-width="${r1(1 * s)}" stroke-linecap="round" opacity="0.6"/>` +
    `<path d="${circ(P(-9.5, hy + 5.5), 2.8 * s) + circ(P(9.5, hy + 5.5), 2.8 * s)}" fill="${C.rosaDoce}" opacity="0.5"/>`;

  const svg =
    `<g>` +
    atras +
    `<path d="${pernas}" fill="${PELE}"${ct}/>` +
    pes +
    vestido +
    `<path d="${bracos}" fill="${PELE}"${ct}/>` +
    mangas +
    `<path d="${circ(cab, hr * s)}" fill="${PELE}"${ct}/>` +
    touca +
    frente +
    rosto +
    enf +
    `</g>`;
  return { svg, maoL, maoR, cabeca: [cx, cy], raioCabeca: hr * s };
}
