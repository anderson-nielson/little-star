import { bonecaPano, type Enfeite, type OpcoesBoneca } from './bonecaPano';
import { claro, comLapis, escuro, fio, fios, forma, lapis, nivelPara, pontinhos, type Nivel } from './pincel';

/**
 * A marionete do jogo, em SVG, desenhada com o pincel Aquarela e Lápis
 * (src/puppet/pincel.ts): membros afilados com mão na ponta, roupa com
 * cintura e manga, rosto econômico (sobrancelha, olho, nariz de um traço, boca,
 * bochecha) e o cabelo que diferencia cada um. Proporções por idade: a criança
 * tem cabeça maior e pernas curtas. Tudo por dados: trocar roupa é trocar
 * variável, trocar o rosto é trocar `cara`.
 *
 * O rosto e o cabelo são desenhados numa cabeça de raio 30 e escalados; quanto
 * menor a cabeça na tela, menos detalhe (o nariz some, o lápis afina).
 * As faces vêm de docs/referencia/familia.html.
 */
export type Ponto = [number, number];
export type Pose = 'parado' | 'acena' | 'sentado' | 'pulo' | 'aponta' | 'segura' | 'giro' | 'reverencia' | 'deitado' | 'abraca' | 'anda' | 'salto' | 'escorrega' | 'balanco' | 'palma' | 'mao' | 'plie' | 'releve' | 'arabesque' | 'agradece' | 'segunda' | 'tendu' | 'passe' | 'attitude';
/**
 * Os passos de balé do palco: o plié (joelhos dobrados para fora), o relevé (na ponta dos
 * pés, braços em coroa), o arabesque (uma perna esticada atrás), a pirueta (`giro`), o
 * salto, o tendu (uma perna esticada para o lado, na ponta), o passé (o pé no joelho, braços
 * em coroa), a attitude (a perna dobrada atrás, um braço no alto) e o échappé (`pulo`).
 */
export const PASSOS_DE_BALE = ['plie', 'releve', 'arabesque', 'giro', 'salto', 'tendu', 'passe', 'attitude', 'pulo'] as const satisfies readonly Pose[];
export type PassoDeBale = (typeof PASSOS_DE_BALE)[number];
export type Cabelo = 'liso' | 'cacheado' | 'cachinhos' | 'coque' | 'curto' | 'rabo' | 'entradas' | 'testa-alta' | 'repartido' | 'rebelde' | 'camadas' | 'ralo';
export type Barba = 'baixa' | 'leve' | 'cheia';
export type Oculos = 'oval' | 'redondo' | 'fino';
/* os óculos não têm hastes: de frente, a haste saindo da cabeça parecia um brinco */

/** O rosto: o que muda de uma pessoa para outra além da cor. */
export interface Cara {
  olhos?: 'abertos' | 'sorriso';
  boca?: 'sorriso' | 'dentes' | 'largo' | 'leve' | 'firme';
  sobrancelha?: 'fina' | 'reta' | 'grossa';
  queixo?: 'redondo' | 'reto';
  bochecha?: boolean;
  brinco?: string;
}

export interface Figura {
  x: number;
  /** o chão, onde pisa */
  y: number;
  h: number;
  pose?: Pose;
  dir?: 1 | -1;
  crianca?: boolean;
  pele: string;
  cabelo: string;
  /** a luz nas pontas do cabelo (os cachos do irmão) */
  cabeloLuz?: string;
  cabeloTipo: Cabelo;
  roupa: string;
  vestido?: boolean;
  /** a camisa aberta por cima da camiseta (o xadrez do irmão): a cor da camisa */
  camisa?: string;
  /** o risco da camisa xadrez */
  xadrez?: string;
  /** flores estampadas no vestido */
  estampa?: string[];
  /** as manguinhas fofas do vestido */
  manguinhas?: boolean;
  /** a gola alta do vestido */
  gola?: boolean;
  /** o lacinho no cabelo */
  laco?: string;
  calca?: string;
  /** o calção: a calça para no joelho */
  calcaCurta?: boolean;
  tutu?: string;
  sapato?: string;
  /** (antigo) um contorno de luz; o lápis faz o contorno agora */
  contorno?: string;
  /** encorpado: multiplica a largura de ombros, membros e roupa (1 = magro) */
  forte?: number;
  /** óculos: ovais, redondos ou finos */
  oculos?: boolean | Oculos;
  /** barba, na cor dada */
  barba?: string;
  barbaEstilo?: Barba;
  /** sem rosto (a boneca de pano tem dois pontos e um fio) */
  pano?: boolean;
  /** a boneca de pano: sem cabelo, um gorro */
  gorro?: string;
  /** na pose 'anda', onde está o passo: 0 a 1 é uma passada inteira (as duas pernas) */
  passo?: number;
  cara?: Cara;
  /** o raio da orelha (6,5 numa cabeça de raio 30) */
  orelha?: number;
  /** a saia mais estreita (a mãe magra) */
  esbelta?: boolean;
}

export interface Desenho {
  svg: string;
  maoL: Ponto;
  maoR: Ponto;
  cabeca: Ponto;
  raioCabeca: number;
}

/* espelho de src/ui/tokens.css: o SVG precisa da cor escrita */
export const CORES = {
  peleMenina: '#e9c39c',
  peleIrmao: '#f1d6bd',
  peleMae: '#f0d2b6',
  pelePai: '#d9a97e',
  cabeloMenina: '#c79a5e',
  cabeloIrmao: '#6b4a32',
  luzIrmao: '#9a7350',
  cabeloMae: '#553a28',
  cabeloPai: '#6a5646',
  barbaPai: '#9b928a',
  rosaDoce: '#f2a9c4',
  rosaClara: '#f6e3dc',
  rosa: '#ebcdc3',
  salmao: '#f3b59a',
  veludo: '#6e1a27',
  vinho: '#8a3a44',
  roxo: '#8a5aa8',
  tinta: '#1a1c2b',
  lapisTinta: '#4a3a30',
  luz: '#ebd9a8',
  ouro: '#c6a15b',
  musgoTinta: '#4f6b3a',
  mata2: '#35564d',
  azul: '#7FA5B8',
  jeans: '#5b7aa0',
  preto: '#2f2f36',
  grafite: '#3a3a42',
  creme: '#efe6d6',
  madeira: '#c9a189',
  papel: '#fbf8f1',
  marfim: '#f6f0e4',
};
const C = CORES;

const f = (n: number) => Math.round(n * 10) / 10;
export function circ(c: Ponto, r: number): string {
  return `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
}
export function limb(a: Ponto, b: Ponto, wa: number, wb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  return (
    `M${f(a[0] + nx * wa)} ${f(a[1] + ny * wa)}L${f(b[0] + nx * wb)} ${f(b[1] + ny * wb)}L${f(b[0] - nx * wb)} ${f(b[1] - ny * wb)}L${f(a[0] - nx * wa)} ${f(a[1] - ny * wa)}z` +
    circ(a, wa) +
    circ(b, wb)
  );
}
/** O sentido do arco que fecha uma ponta: o arco tem que bojar para fora, no sentido `para`. */
function sentidoDoArco(corda: Ponto, para: Ponto): 0 | 1 {
  return corda[0] * para[1] - corda[1] * para[0] > 0 ? 0 : 1;
}
/** Um membro só de contorno fechado: o trapézio com as pontas em arco (o lápis não cruza por dentro). */
function membro(a: Ponto, b: Ponto, wa: number, wb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  const sb = sentidoDoArco([-2 * nx * wb, -2 * ny * wb], [dx, dy]);
  const sa = sentidoDoArco([2 * nx * wa, 2 * ny * wa], [-dx, -dy]);
  return `M${f(a[0] + nx * wa)} ${f(a[1] + ny * wa)}L${f(b[0] + nx * wb)} ${f(b[1] + ny * wb)}A${f(wb)} ${f(wb)} 0 0 ${sb} ${f(b[0] - nx * wb)} ${f(b[1] - ny * wb)}L${f(a[0] - nx * wa)} ${f(a[1] - ny * wa)}A${f(wa)} ${f(wa)} 0 0 ${sa} ${f(a[0] + nx * wa)} ${f(a[1] + ny * wa)}z`;
}
/** Um membro dobrado num contorno só: de `a` a `b` passando pela junta `k`, sem bolinha no joelho. */
function membroDobrado(a: Ponto, k: Ponto, b: Ponto, wa: number, wk: number, wb: number): string {
  const n = (p: Ponto, q: Ponto): Ponto => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  const n1 = n(a, k);
  const n2 = n(k, b);
  const P = (p: Ponto, nn: Ponto, w: number, lado: 1 | -1) => `${f(p[0] + nn[0] * w * lado)} ${f(p[1] + nn[1] * w * lado)}`;
  const sb = sentidoDoArco([-2 * n2[0] * wb, -2 * n2[1] * wb], [b[0] - k[0], b[1] - k[1]]);
  const sa = sentidoDoArco([2 * n1[0] * wa, 2 * n1[1] * wa], [a[0] - k[0], a[1] - k[1]]);
  return `M${P(a, n1, wa, 1)}L${P(k, n1, wk, 1)}Q${P(k, [n1[0] + n2[0], n1[1] + n2[1]], wk * 0.5, 1)} ${P(k, n2, wk, 1)}L${P(b, n2, wb, 1)}A${f(wb)} ${f(wb)} 0 0 ${sb} ${P(b, n2, wb, -1)}L${P(k, n2, wk, -1)}Q${P(k, [n1[0] + n2[0], n1[1] + n2[1]], wk * 0.5, -1)} ${P(k, n1, wk, -1)}L${P(a, n1, wa, -1)}A${f(wa)} ${f(wa)} 0 0 ${sa} ${P(a, n1, wa, 1)}z`;
}
function elipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;
}
/** Um cacho: um círculo meio torto, cada um do seu jeito. */
function blob(x: number, y: number, r: number, i: number): string {
  const n = 7;
  const pts: Ponto[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k * Math.PI * 2) / n + i * 0.7;
    const rr = r * (0.9 + 0.14 * ((Math.sin(a * 2.3 + i) + 1) / 2));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = pts[k]!;
    const b = pts[(k + 1) % n]!;
    const nb = pts[(k + 2) % n]!;
    if (k === 0) d += `M${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`;
    d += `Q${f(b[0])} ${f(b[1])} ${f((b[0] + nb[0]) / 2)} ${f((b[1] + nb[1]) / 2)}`;
  }
  return d + 'z';
}

/* ---------- a cabeça: rosto e cabelo numa cabeça de raio 30 ---------- */

const R = 30;
type Local = { atras: string; frente: string };
const NUVEM_GRANDE: [number, number, number][] = [[-31, -12, 13], [-18, -27, 13], [1, -33, 13], [20, -27, 13], [32, -11, 13], [37, 8, 11], [-37, 6, 11], [-34, 22, 10], [35, 22, 10], [-24, -38, 9], [12, -41, 9], [27, -36, 9], [-8, -42, 8], [-40, -8, 8], [41, -6, 8]];
const NUVEM_CURTA: [number, number, number][] = [[-27, -9, 11], [-15, -23, 11], [1, -28, 11], [17, -23, 11], [28, -9, 11], [31, 6, 9], [-31, 5, 9], [-20, -31, 7], [10, -34, 7], [24, -29, 7]];

function cachos(lista: [number, number, number][], base: string, luz: string, n: Nivel, espirais = true): string {
  let s = '';
  lista.forEach(([x, y, r], i) => {
    const cor = i % 3 === 1 ? luz : base;
    s += forma(blob(x, y, r, i), cor, { op: 0.9, opLapis: 0.5, mudo: n === 'mini' });
    if (n === 'grande' && espirais && i % 3 === 0) s += fio(`M${f(x + r * 0.6)} ${f(y - r * 0.5)}q${f(r * 0.5)} ${f(-r * 0.5)} ${f(r * 0.9)} ${f(-r * 0.2)}`, escuro(base, 0.25), 1.2, 0.7);
  });
  return s;
}

function cabeloLocal(o: Figura, n: Nivel): Local {
  const cor = o.cabelo;
  const luz = o.cabeloLuz ?? claro(cor, 0.3);
  const detalhe = n !== 'mini';
  const capa = () => forma('M-31.5 -3A31.5 31.5 0 0 1 31.5 -3Q18 -16.5 0 -6Q-21 -18 -31.5 -3z', cor);
  if (o.gorro) return { atras: '', frente: forma('M-31.5 0A31.5 31.5 0 0 1 31.5 0z', o.gorro) };
  switch (o.cabeloTipo) {
    case 'repartido':
      /* a menina: liso, repartido no meio, passando do ombro, com o lacinho de lado */
      return {
        atras: forma('M-37 -2C-37 -44 37 -44 37 -2L42 46Q30 40 20 48L12 36Q0 40 -12 36L-20 48Q-30 40 -42 46z', cor) + (detalhe ? fios(['M-34 6q-3 18 -1 34', 'M34 6q3 18 1 34'], escuro(cor, 0.3)) : ''),
        frente:
          forma('M-31 -4C-30 -26 -14 -34 -2 -34Q-10 -22 -18 -10Q-26 -6 -31 -4z', cor) +
          forma('M31 -4C30 -26 14 -34 0 -34Q10 -22 22 -12Q28 -8 31 -4z', cor) +
          (o.laco ? forma('M18 -26q6 -8 12 -2q-6 8 -12 2z M18 -26q-6 -8 -12 -2q6 8 12 2z', o.laco, { lapis: 0.35, mudo: !detalhe }) + `<circle cx="18" cy="-26" r="2" fill="${C.veludo}" opacity=".7"/>` : ''),
      };
    case 'rebelde':
    case 'cacheado':
      /* o irmão: a nuvem de cachos, irregular, com luz nas pontas */
      return {
        atras: cachos(NUVEM_GRANDE, cor, luz, n),
        frente: cachos([[-17, -22, 8.5], [2, -26, 8.5], [19, -20, 7.5], [-28, -9, 6]], cor, luz, n, false),
      };
    case 'cachinhos':
      return { atras: cachos(NUVEM_CURTA, cor, luz, n), frente: cachos([[-14, -20, 7], [3, -23, 7], [17, -18, 6.5]], cor, luz, n, false) };
    case 'camadas':
      /* a mãe: repartido de lado, em camadas até o ombro, atrás de uma orelha */
      return {
        atras: forma('M-38 -2C-38 -44 38 -44 38 -2C42 12 43 28 40 46C36 50 30 44 24 48C18 52 8 48 0 49C-8 48 -18 52 -24 48C-30 44 -36 50 -40 46C-43 28 -42 12 -38 -2z', cor) + (detalhe ? fios(['M-34 10q-4 16 -1 30', 'M34 10q4 16 1 30'], escuro(cor, 0.4), 1.1, 0.5) : ''),
        frente: forma('M-10 -34C8 -36 30 -27 33 -6Q29 -14 18 -17Q4 -19 -10 -30z', cor) + forma('M-10 -34C-20 -34 -28 -26 -31 -10Q-28 -16 -22 -20Q-16 -25 -10 -30z', cor) + forma('M-14 -32C-2 -31 10 -27 22 -15Q8 -15 -6 -19Q-14 -24 -14 -32z', cor, { mudo: true, op: 0.95 }),
      };
    case 'ralo':
    case 'entradas':
    case 'testa-alta':
    case 'curto':
      /* o pai: cabelo curto e ralo em cima, com as entradas nas têmporas */
      return {
        atras: '',
        frente:
          forma('M-29.5 -4A30 32.1 0 0 1 29.5 -4Q27 -14 19 -26Q0 -21 -19 -26Q-27 -14 -29.5 -4z', cor, { op: 0.75 }) +
          (detalhe ? pontinhos([[-20, -12], [-12, -22], [0, -19], [12, -22], [20, -12], [-26, -4], [26, -4], [-6, -24], [6, -24]], luz, 0.6) : ''),
      };
    case 'coque':
      return { atras: '', frente: capa() + forma(circ([15, -31.5], 12.6), cor) };
    case 'rabo':
      return { atras: forma(circ([-27, 27], 15), cor), frente: capa() };
    default:
      /* liso: a cortina que cai até o ombro */
      return { atras: forma('M-31.5 -6Q-34.5 63 -21 66L21 66Q34.5 63 31.5 -6z', cor), frente: capa() };
  }
}

function rostoLocal(o: Figura, n: Nivel): string {
  const c = o.cara ?? {};
  const olhos = c.olhos ?? 'sorriso';
  const boca = c.boca ?? 'sorriso';
  const sob = c.sobrancelha ?? 'fina';
  const lap = escuro(o.cabelo, 0.35);
  const tinta = C.lapisTinta;
  let s = '';
  if (o.pano) {
    return `<circle cx="-11" cy="1" r="2.4" fill="${tinta}" opacity="0.7"/><circle cx="11" cy="1" r="2.4" fill="${tinta}" opacity="0.7"/>` + fio('M-5.5 15h11', C.veludo, 1.4, 0.6);
  }
  /* sobrancelhas */
  if (n !== 'mini') {
    if (sob === 'grossa') s += fios(['M-19 -9q7 -1 14 1', 'M5 -8q7 -2 14 1'], escuro(o.cabelo, 0.25), n === 'grande' ? 2.6 : 2, 0.85);
    else s += fios(sob === 'reta' ? ['M-18 -11q7 -2.5 13 -1', 'M5 -12q6 -1.5 13 1'] : ['M-18 -11q7 -5 13 -1.5', 'M5 -12.5q6 -3.5 13 1.5'], escuro(o.cabelo, 0.3), 1.3, n === 'grande' ? 0.75 : 0.5);
  }
  /* olhos */
  if (olhos === 'sorriso' || n === 'mini') {
    s += fios(['M-17 -1q6 -6 12 0', 'M5 -1q6 -6 12 0'], tinta, n === 'mini' ? 1.7 : 1.5, 0.85);
  } else {
    const iris = (o.crianca ? 3 : 2.5) * (n === 'grande' ? 1 : 0.9);
    s += fios(['M-17 -2q6 -6.5 12 -0.5', 'M5 -2.5q6 -6 12 0.5'], lap, 1.5, 0.9);
    s += `<circle cx="-11" cy="0" r="${iris}" fill="${tinta}" opacity=".9"/><circle cx="11" cy="0" r="${iris}" fill="${tinta}" opacity=".9"/>`;
    if (n === 'grande') s += `<circle cx="-10" cy="-1" r=".9" fill="${C.papel}"/><circle cx="12" cy="-1" r=".9" fill="${C.papel}"/>`;
  }
  /* nariz de um traço */
  if (n === 'grande') s += fio('M1 2.5q3 6 -2 8', escuro(o.pele, 0.45), 1.1, 0.7);
  /* boca */
  if ((boca === 'dentes' || boca === 'largo') && n !== 'mini') {
    const d = boca === 'largo' ? 'M-12 11q12 15 24 0q-12 3 -24 0z' : 'M-10 12q10 13 20 0q-10 2.6 -20 0z';
    s += `<path d="${d}" fill="${C.papel}" opacity=".95"/>` + lapis(d, C.veludo, { w: 1.1, opLapis: 0.85 });
  } else if (boca === 'leve') s += fio('M-6 14q6 3.5 12 0', C.veludo, 1.4, 0.85);
  else if (boca === 'firme') s += fio('M-8 13q8 5 16 0', C.veludo, 1.6, 0.85);
  else s += fio('M-8 12.5q8 7.5 16 0', C.veludo, n === 'mini' ? 1.6 : 1.5, 0.85);
  /* bochecha */
  if (c.bochecha ?? o.crianca) s += `<circle cx="-19" cy="9" r="5.5" fill="${C.rosaDoce}" opacity=".38"/><circle cx="19" cy="9" r="5.5" fill="${C.rosaDoce}" opacity=".38"/>`;
  return s;
}

function barbaLocal(o: Figura, n: Nivel): string {
  if (!o.barba) return '';
  const estilo = o.barbaEstilo ?? 'cheia';
  const cor = o.barba;
  let s = forma('M-29.6 4A30 32.1 0 0 0 29.6 4Q18 9 0 10Q-18 9 -29.6 4z', cor, { op: estilo === 'leve' ? 0.4 : 0.75, lapis: 0.25, opLapis: 0.5, mudo: n === 'mini' });
  /* o sal e pimenta a lápis só de perto: de longe vira sujeira, e o grisalho já está na cor */
  if (n === 'grande') {
    s += pontinhos([[-22, 12], [-6, 26], [12, 22], [-18, 24], [4, 30], [22, 8], [-12, 30]], C.papel, 0.7, 1.2);
    s += pontinhos([[-20, 18], [8, 25], [18, 19], [-26, 10], [-2, 20]], C.lapisTinta, estilo === 'cheia' ? 0.5 : 0.35, 1.2);
  }
  /* a boca fica dentro da barba */
  s += forma(elipse(0, 14, 11, 6.5), o.pele, { mudo: true, op: 0.9 });
  s += forma('M-10 6q10 -4 20 0q-10 4.5 -20 0z', cor, { mudo: true, op: estilo === 'cheia' ? 0.8 : 0.45 });
  return s;
}

function oculosLocal(o: Figura, n: Nivel): string {
  if (!o.oculos) return '';
  const estilo: Oculos = o.oculos === true ? 'redondo' : o.oculos;
  const w = n === 'mini' ? 1.4 : 1.7;
  const aro = '#6f6052';
  if (estilo === 'redondo')
    return `<g fill="none" stroke="${aro}" stroke-width="${w}" vector-effect="non-scaling-stroke" opacity=".9"><circle cx="-11.5" cy="-1" r="10.5" vector-effect="non-scaling-stroke"/><circle cx="11.5" cy="-1" r="10.5" vector-effect="non-scaling-stroke"/><path d="M-1 -2.5h2" vector-effect="non-scaling-stroke"/></g><circle cx="-11.5" cy="-1" r="10.5" fill="#dbe7ee" opacity=".18"/><circle cx="11.5" cy="-1" r="10.5" fill="#dbe7ee" opacity=".18"/>`;
  const ry = estilo === 'fino' ? 6.5 : 7.5;
  return `<g fill="none" stroke="${aro}" stroke-width="${estilo === 'fino' ? w * 0.7 : w}" opacity=".9"><ellipse cx="-11" cy="-1" rx="9.5" ry="${ry}" vector-effect="non-scaling-stroke"/><ellipse cx="11" cy="-1" rx="9.5" ry="${ry}" vector-effect="non-scaling-stroke"/><path d="M-1.5 -2h3" vector-effect="non-scaling-stroke"/></g>`;
}

/* ---------- a marionete ---------- */

export function boneco(o: Figura): Desenho {
  const { x, y, h, pele, roupa } = o;
  const dir = o.dir ?? 1;
  const pose = o.pose ?? 'parado';
  const crianca = !!o.crianca;
  const hr = h * (crianca ? 0.115 : 0.085);
  const nivel = nivelPara(hr);
  return comLapis(nivel === 'grande' ? 1 : nivel === 'medio' ? 0.75 : 0.55, () => desenha(o, dir, pose, crianca, hr, nivel, x, y, h, pele, roupa));
}

function desenha(o: Figura, dir: 1 | -1, pose: Pose, crianca: boolean, hr: number, nivel: Nivel, x: number, y: number, h: number, pele: string, roupa: string): Desenho {
  const lg = h * (crianca ? 0.34 : 0.42);
  const forte = o.forte ?? 1;
  const sw = h * (crianca ? 0.17 : 0.16) * forte;
  const w = (crianca ? 1.15 : 1) * forte;
  const esc = h / 100;
  const L = {
    coxa: [3.6 * w * esc, 2.6 * w * esc] as const,
    perna: [2.5 * w * esc, 1.6 * w * esc] as const,
    braco: [2.1 * w * esc, 1.6 * w * esc] as const,
    ante: [1.6 * w * esc, 1.2 * w * esc] as const,
  };
  const noBalanco = pose === 'balanco';
  const sentado = pose === 'sentado' || noBalanco;
  const pulo = pose === 'pulo' || pose === 'giro';
  const reverencia = pose === 'reverencia';
  const deitado = pose === 'deitado';
  const anda = pose === 'anda';
  const salto = pose === 'salto';
  const escorrega = pose === 'escorrega';
  const plie = pose === 'plie';
  const releve = pose === 'releve';
  const arabesque = pose === 'arabesque';
  /* o agradecimento da bailarina (a révérence): um pé cruza atrás, os joelhos dobram, um braço
     abre para o lado e o outro desce na frente, a cabeça baixa agradecendo */
  const agradece = pose === 'agradece';
  const tendu = pose === 'tendu';
  const passe = pose === 'passe';
  const attitude = pose === 'attitude';
  /* no arabesque e na attitude o tronco inclina um pouco para a frente, sobre a perna de apoio */
  const inclina = arabesque ? dir * 0.05 * h : attitude ? dir * 0.03 * h : agradece ? dir * 0.02 * h : 0;
  /* andar: a perna balança da anca, o joelho dobra quando a perna volta; braço oposto à perna */
  const balanco = Math.sin((o.passo ?? 0) * Math.PI * 2);
  const perna = (hx: number, hy: number, coxaAng: number, canelaAng: number): [Ponto, Ponto, Ponto, Ponto] => {
    const k: Ponto = [hx + dir * Math.sin(coxaAng) * lg * 0.52, hy + Math.cos(coxaAng) * lg * 0.52];
    const a: Ponto = [k[0] + dir * Math.sin(canelaAng) * lg * 0.46, k[1] + Math.cos(canelaAng) * lg * 0.46];
    return [[hx, hy], k, a, [a[0] + dir * 0.06 * h, a[1] + 0.01 * h]];
  };
  const tor = h - lg - 2 * hr - 0.03 * h;
  let hipY: number;
  if (sentado) hipY = y - lg * 0.45;
  else if (pulo) hipY = y - lg - h * 0.12;
  else if (deitado) hipY = y - h * 0.12;
  else if (anda) hipY = y - lg * (0.96 + 0.04 * Math.cos(balanco * Math.PI * 0.5) ** 2) - h * 0.01;
  else if (salto || escorrega) hipY = y - lg - h * 0.04;
  else if (plie) hipY = y - lg * 0.74;
  else if (releve) hipY = y - lg - h * 0.05;
  else if (agradece) hipY = y - lg * 0.86;
  else hipY = y - lg;
  const shY = reverencia ? hipY - tor * 0.55 : arabesque ? hipY - tor * 0.96 : hipY - tor;
  const cabeca: Ponto = reverencia ? [x + dir * tor * 0.55, shY - hr * 0.6] : [x + inclina + dir * 0.01 * h, shY - 0.025 * h - hr + (agradece ? hr * 0.3 : 0)];
  const sL: Ponto = [x + inclina - sw / 2, shY];
  const sR: Ponto = [x + inclina + sw / 2, shY];
  const pl = { lapis: 0.4 };

  /* pernas */
  const legs: [Ponto, Ponto, Ponto, Ponto][] = [];
  if (noBalanco) {
    legs.push([[x - 0.03 * h, hipY + 0.02 * h], [x + dir * 0.17 * h, hipY + 0.06 * h], [x + dir * 0.22 * h, y + 0.08 * h], [x + dir * 0.29 * h, y + 0.1 * h]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + dir * 0.2 * h, hipY + 0.09 * h], [x + dir * 0.26 * h, y + 0.1 * h], [x + dir * 0.33 * h, y + 0.12 * h]]);
  } else if (sentado) {
    legs.push([[x - 0.05 * h, hipY + 0.02 * h], [x + dir * 0.18 * h, hipY + 0.02 * h], [x + dir * 0.2 * h, y - 0.02 * h], [x + dir * 0.26 * h, y]]);
    legs.push([[x + 0.05 * h, hipY + 0.02 * h], [x + dir * 0.2 * h, hipY + 0.05 * h], [x + dir * 0.22 * h, y - 0.02 * h], [x + dir * 0.28 * h, y]]);
  } else if (pose === 'pulo') {
    legs.push([[x - 0.04 * h, hipY + 0.02 * h], [x - 0.14 * h, hipY + 0.16 * h], [x - 0.2 * h, hipY + 0.3 * h], [x - 0.25 * h, hipY + 0.33 * h]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + 0.14 * h, hipY + 0.16 * h], [x + 0.2 * h, hipY + 0.3 * h], [x + 0.25 * h, hipY + 0.33 * h]]);
  } else if (pose === 'giro') {
    legs.push([[x - 0.04 * h, hipY + 0.02 * h], [x - 0.03 * h, hipY + lg * 0.5], [x - 0.02 * h, hipY + lg], [x + 0.03 * h, hipY + lg + 0.03 * h]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + 0.16 * h, hipY + 0.1 * h], [x + 0.06 * h, hipY + 0.2 * h], [x + 0.02 * h, hipY + 0.24 * h]]);
  } else if (anda) {
    const s = balanco;
    legs.push(perna(x - 0.035 * h, hipY + 0.02 * h, s * 0.42, s * 0.42 - Math.max(0, -s) * 0.7));
    legs.push(perna(x + 0.035 * h, hipY + 0.02 * h, -s * 0.42, -s * 0.42 - Math.max(0, s) * 0.7));
  } else if (salto) {
    /* o sauté corrido: a perna da frente dobrada para cima, a de trás esticada para trás */
    legs.push(perna(x - 0.035 * h, hipY + 0.02 * h, -0.75, -1.55));
    legs.push(perna(x + 0.035 * h, hipY + 0.02 * h, 1.15, 0.15));
  } else if (escorrega) {
    /* os pés fogem para a frente */
    legs.push(perna(x - 0.035 * h, hipY + 0.02 * h, 1.05, 1.35));
    legs.push(perna(x + 0.035 * h, hipY + 0.02 * h, 1.35, 1.6));
  } else if (plie) {
    /* o demi-plié em segunda posição: pés afastados, joelhos dobrados para fora */
    legs.push([[x - 0.04 * h, hipY + 0.02 * h], [x - 0.17 * h, hipY + lg * 0.42], [x - 0.13 * h, y - 0.02 * h], [x - 0.2 * h, y]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + 0.17 * h, hipY + lg * 0.42], [x + 0.13 * h, y - 0.02 * h], [x + 0.2 * h, y]]);
  } else if (releve) {
    /* o relevé: pernas juntas e esticadas, na ponta dos pés */
    legs.push([[x - 0.035 * h, hipY + 0.02 * h], [x - 0.03 * h, hipY + lg * 0.5], [x - 0.03 * h, y - 0.07 * h], [x - 0.03 * h + dir * 0.02 * h, y]]);
    legs.push([[x + 0.035 * h, hipY + 0.02 * h], [x + 0.03 * h, hipY + lg * 0.5], [x + 0.03 * h, y - 0.07 * h], [x + 0.03 * h + dir * 0.02 * h, y]]);
  } else if (agradece) {
    /* a perna da frente dobra; a de trás cruza por trás dela e aponta na ponta do pé */
    legs.push([[x + dir * 0.04 * h, hipY + 0.02 * h], [x + dir * 0.08 * h, hipY + lg * 0.5], [x + dir * 0.05 * h, y - 0.02 * h], [x + dir * 0.11 * h, y]]);
    legs.push([[x - dir * 0.04 * h, hipY + 0.02 * h], [x + dir * 0.0 * h, hipY + lg * 0.5], [x + dir * 0.15 * h, y - 0.04 * h], [x + dir * 0.21 * h, y - 0.01 * h]]);
  } else if (tendu) {
    /* a perna de apoio reta; a outra esticada para o lado, só a ponta do pé no chão */
    legs.push([[x + dir * 0.04 * h, hipY + 0.02 * h], [x + dir * 0.05 * h, hipY + lg * 0.52], [x + dir * 0.06 * h, y - 0.02 * h], [x + dir * 0.12 * h, y]]);
    legs.push([[x - dir * 0.04 * h, hipY + 0.02 * h], [x - dir * 0.15 * h, hipY + lg * 0.5], [x - dir * 0.26 * h, y - 0.04 * h], [x - dir * 0.32 * h, y - 0.01 * h]]);
  } else if (passe) {
    /* a perna de apoio reta; o outro pé encosta no joelho dela */
    legs.push([[x + dir * 0.04 * h, hipY + 0.02 * h], [x + dir * 0.05 * h, hipY + lg * 0.52], [x + dir * 0.06 * h, y - 0.02 * h], [x + dir * 0.12 * h, y]]);
    legs.push([[x - dir * 0.04 * h, hipY + 0.02 * h], [x - dir * 0.17 * h, hipY + lg * 0.32], [x - dir * 0.02 * h, hipY + lg * 0.5], [x + dir * 0.02 * h, hipY + lg * 0.56]]);
  } else if (attitude) {
    /* a perna de apoio reta; a outra levantada atrás, dobrada no joelho */
    legs.push([[x + dir * 0.02 * h, hipY + 0.02 * h], [x + dir * 0.02 * h, hipY + lg * 0.52], [x + dir * 0.02 * h, y - 0.02 * h], [x + dir * 0.08 * h, y]]);
    legs.push([[x - dir * 0.04 * h, hipY + 0.02 * h], [x - dir * 0.24 * h, hipY + 0.04 * h], [x - dir * 0.18 * h, hipY - 0.12 * h], [x - dir * 0.14 * h, hipY - 0.17 * h]]);
  } else if (arabesque) {
    /* o arabesque: uma perna de apoio esticada, a outra esticada para trás, quase na altura do quadril */
    legs.push([[x - dir * 0.04 * h, hipY + 0.02 * h], [x - dir * 0.2 * h, hipY], [x - dir * 0.36 * h, hipY - 0.04 * h], [x - dir * 0.43 * h, hipY - 0.06 * h]]);
    legs.push([[x + dir * 0.01 * h, hipY + 0.02 * h], [x + dir * 0.01 * h, hipY + lg * 0.5], [x + dir * 0.01 * h, y - 0.02 * h], [x + dir * 0.07 * h, y]]);
  } else if (deitado) {
    legs.push([[x - 0.02 * h, hipY], [x - 0.22 * h, hipY + 0.02 * h], [x - 0.4 * h, hipY + 0.03 * h], [x - 0.44 * h, hipY - 0.02 * h]]);
    legs.push([[x + 0.02 * h, hipY + 0.03 * h], [x - 0.2 * h, hipY + 0.05 * h], [x - 0.38 * h, hipY + 0.06 * h], [x - 0.42 * h, hipY + 0.01 * h]]);
  } else {
    legs.push([[x - 0.04 * h, hipY + 0.02 * h], [x - 0.05 * h, hipY + lg * 0.52], [x - 0.06 * h, y - 0.02 * h], [x - 0.06 * h + dir * 0.06 * h, y]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + 0.05 * h, hipY + lg * 0.52], [x + 0.06 * h, y - 0.02 * h], [x + 0.06 * h + dir * 0.06 * h, y]]);
  }
  const sapato = o.sapato ?? pele;
  let pernas = '';
  for (const [hq, k, a, t] of legs) {
    pernas += forma(membroDobrado(hq, k, a, L.coxa[0], L.coxa[1], L.perna[1]), pele, pl);
    if (o.calca) {
      /* a calça acompanha a perna: comprida até o tornozelo, ou o calção até o joelho */
      const fim: Ponto = o.calcaCurta ? [k[0] + (a[0] - k[0]) * 0.12, k[1] + (a[1] - k[1]) * 0.12] : [a[0] + (k[0] - a[0]) * 0.06, a[1] + (k[1] - a[1]) * 0.06];
      pernas += forma(membroDobrado(hq, k, fim, L.coxa[0] * (o.calcaCurta ? 1.45 : 1.25), L.coxa[1] * (o.calcaCurta ? 1.6 : 1.3), o.calcaCurta ? L.coxa[1] * 1.55 : L.perna[1] * 1.5), o.calca, pl);
    }
    pernas += forma(membro(a, t, L.perna[1], L.perna[1] * 0.6), sapato, pl);
  }

  /* roupa */
  /* o vestido pende de alças finas; a camiseta cobre os ombros */
  const camiseta = !o.vestido && !o.pano;
  const tl: Ponto = camiseta ? [sL[0] - 1.2 * esc, sL[1] - 2.5 * esc] : [sL[0] + 2 * esc, sL[1] + 3 * esc];
  const tr: Ponto = camiseta ? [sR[0] + 1.2 * esc, sR[1] - 2.5 * esc] : [sR[0] - 2 * esc, sR[1] + 3 * esc];
  let roupaPath = '';
  let mangas = '';
  if (o.vestido) {
    const baixo = sentado ? hipY + 0.06 * h : deitado ? hipY + 0.1 * h : hipY + 0.16 * h;
    const lv = crianca ? 0.2 * h : o.esbelta ? 0.115 * h : 0.14 * h;
    const cint = shY + (hipY - shY) * 0.6;
    const cw = (tr[0] - tl[0]) / 2;
    const d = `M${f(tl[0])} ${f(tl[1])}L${f(tr[0])} ${f(tr[1])}L${f(x + cw * 1.05)} ${f(cint)}C${f(x + lv * 0.85)} ${f(cint + (baixo - cint) * 0.35)} ${f(x + lv)} ${f(baixo - 3 * esc)} ${f(x + lv)} ${f(baixo)}Q${f(x)} ${f(baixo + 0.02 * h)} ${f(x - lv)} ${f(baixo)}C${f(x - lv)} ${f(baixo - 3 * esc)} ${f(x - lv * 0.85)} ${f(cint + (baixo - cint) * 0.35)} ${f(x - cw * 1.05)} ${f(cint)}z`;
    roupaPath = forma(d, roupa);
    if (o.estampa?.length && nivel !== 'mini') {
      const e = o.estampa;
      for (let i = 0; i < 5; i++) {
        const px = x - lv * 0.6 + ((i * 0.37) % 1) * lv * 1.2;
        const py = cint + 3 * esc + ((i * 0.61) % 1) * (baixo - cint - 5 * esc);
        roupaPath += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(2 * esc)}" fill="${e[i % e.length]}" opacity=".55"/>`;
      }
    }
    if (o.gola) roupaPath += forma(`M${f(x - 2.4 * esc)} ${f(shY - 1.5 * esc)}h${f(4.8 * esc)}v${f(5 * esc)}h${f(-4.8 * esc)}z`, roupa, { mudo: true, op: 0.95 });
    /* as manguinhas fofas do vestido */
    if (o.manguinhas) mangas = forma(elipse(sL[0] - 0.3 * esc, shY + 3 * esc, 2.6 * esc, 3.4 * esc), roupa, pl) + '|' + forma(elipse(sR[0] + 0.3 * esc, shY + 3 * esc, 2.6 * esc, 3.4 * esc), roupa, pl);
  } else {
    /* a camiseta: cai reta dos ombros, um pouco mais larga na bainha */
    const lw = Math.max(0.08 * h, (sw / 2 - 1.5 * esc) * 1.1);
    const d = `M${f(tl[0])} ${f(tl[1])}L${f(tr[0])} ${f(tr[1])}Q${f(x + lw * 0.92)} ${f(hipY - 0.1 * h)} ${f(x + lw)} ${f(hipY + 0.03 * h)}L${f(x - lw)} ${f(hipY + 0.03 * h)}Q${f(x - lw * 0.92)} ${f(hipY - 0.1 * h)} ${f(tl[0])} ${f(tl[1])}z`;
    roupaPath = forma(d, roupa);
    if (o.camisa) {
      /* a camisa aberta por cima: dois painéis, do ombro à bainha */
      const cam = o.camisa;
      const pL = `M${f(tl[0])} ${f(tl[1])}L${f(x - 3 * esc)} ${f(shY + 2 * esc)}L${f(x - 4.5 * esc)} ${f(hipY + 0.03 * h)}L${f(x - lw)} ${f(hipY + 0.03 * h)}Q${f(x - lw * 0.92)} ${f(hipY - 0.1 * h)} ${f(tl[0])} ${f(tl[1])}z`;
      const pR = `M${f(tr[0])} ${f(tr[1])}L${f(x + 3 * esc)} ${f(shY + 2 * esc)}L${f(x + 4.5 * esc)} ${f(hipY + 0.03 * h)}L${f(x + lw)} ${f(hipY + 0.03 * h)}Q${f(x + lw * 0.92)} ${f(hipY - 0.1 * h)} ${f(tr[0])} ${f(tr[1])}z`;
      roupaPath += forma(pL, cam) + forma(pR, cam);
      if (o.xadrez && nivel !== 'mini') {
        const y1 = shY + 8 * esc;
        const y2 = shY + 16 * esc;
        const xs = lw * 0.7;
        roupaPath += fios([`M${f(x - lw * 0.95)} ${f(y1)}H${f(x - 5 * esc)}`, `M${f(x + 5 * esc)} ${f(y1)}H${f(x + lw * 0.95)}`, `M${f(x - lw * 0.9)} ${f(y2)}H${f(x - 5 * esc)}`, `M${f(x + 5 * esc)} ${f(y2)}H${f(x + lw * 0.9)}`, `M${f(x - xs)} ${f(shY + 1 * esc)}V${f(hipY)}`, `M${f(x + xs)} ${f(shY + 1 * esc)}V${f(hipY)}`], o.xadrez, 1.2, 0.5);
      }
    }
    if (o.calca) roupaPath += forma(`M${f(x - lw * 0.98)} ${f(hipY - 0.02 * h)}L${f(x + lw * 0.98)} ${f(hipY - 0.02 * h)}L${f(x + lw * 0.92)} ${f(hipY + 0.08 * h)}Q${f(x)} ${f(hipY + 0.11 * h)} ${f(x - lw * 0.92)} ${f(hipY + 0.08 * h)}z`, o.calca);
  }
  const tutu = o.tutu ? forma(elipse(x, hipY + 0.02 * h, 0.2 * h, 0.06 * h), o.tutu, { op: 0.92, lapis: 0.3 }) : '';

  /* braços, com a mão na ponta */
  const braco = (s: Ponto, a1: number, a2: number, lado: 1 | -1) => {
    const la = 0.17 * h;
    const lb = 0.15 * h;
    const e: Ponto = [s[0] + Math.cos(a1) * la, s[1] + Math.sin(a1) * la];
    const wri: Ponto = [e[0] + Math.cos(a2) * lb, e[1] + Math.sin(a2) * lb];
    const mangaCor = o.camisa ?? roupa;
    /* a manga: um tubo reto em volta do braço, mais largo que ele, que começa um pouco acima
       da linha do ombro e acaba numa barra reta. A camiseta vem por cima e esconde o lado de dentro */
    let manga = '';
    if (!o.vestido && !o.pano) {
      const u: Ponto = [Math.cos(a1), Math.sin(a1)];
      const nn: Ponto = [-u[1], u[0]];
      const comp = la * 0.46;
      const wS = L.braco[0] * 1.35;
      const topo: Ponto = [s[0] - u[0] * 2.6 * esc, s[1] - u[1] * 2.6 * esc];
      const fim: Ponto = [s[0] + u[0] * comp, s[1] + u[1] * comp];
      const A: Ponto = [topo[0] + nn[0] * wS, topo[1] + nn[1] * wS];
      const B: Ponto = [topo[0] - nn[0] * wS, topo[1] - nn[1] * wS];
      const Cc: Ponto = [fim[0] - nn[0] * wS * 0.95, fim[1] - nn[1] * wS * 0.95];
      const D: Ponto = [fim[0] + nn[0] * wS * 0.95, fim[1] + nn[1] * wS * 0.95];
      manga = forma(`M${f(A[0])} ${f(A[1])}L${f(D[0])} ${f(D[1])}L${f(Cc[0])} ${f(Cc[1])}L${f(B[0])} ${f(B[1])}z`, mangaCor, pl);
    }
    const rm = L.ante[1] * 1.55;
    const mao: Ponto = [wri[0] + Math.cos(a2) * rm * 0.7, wri[1] + Math.sin(a2) * rm * 0.7];
    const polegar: Ponto = [mao[0] - Math.sin(a2) * lado * rm * 0.85, mao[1] + Math.cos(a2) * lado * rm * 0.85];
    const d = forma(membroDobrado(s, e, wri, L.braco[0], L.braco[1], L.ante[1]), pele, pl) + forma(circ(mao, rm), pele, pl) + forma(circ(polegar, rm * 0.4), pele, { mudo: true });
    return { d, manga, w: wri };
  };
  const PI = Math.PI;
  let bL: { d: string; manga: string; w: Ponto };
  let bR: { d: string; manga: string; w: Ponto };
  switch (pose) {
    case 'acena':
      bL = braco(sL, PI * 0.42, PI * 0.35, 1);
      bR = braco(sR, -PI * 0.62, -PI * 0.5, -1);
      break;
    case 'pulo':
      bL = braco(sL, -PI * 0.72, -PI * 0.6, 1);
      bR = braco(sR, -PI * 0.28, -PI * 0.4, -1);
      break;
    case 'giro':
      bL = braco(sL, -PI * 0.85, -PI * 0.7, 1);
      bR = braco(sR, -PI * 0.15, -PI * 0.3, -1);
      break;
    case 'sentado':
      bL = braco(sL, PI * 0.45, PI * 0.05 * dir, 1);
      bR = braco(sR, PI * 0.42, PI * 0.08 * dir, -1);
      break;
    case 'aponta':
      bL = braco(sL, PI * 0.45, PI * 0.45, 1);
      bR = braco(sR, dir > 0 ? -PI * 0.1 : PI * 1.1, dir > 0 ? -PI * 0.05 : PI * 1.05, -1);
      break;
    case 'balanco':
      bL = braco(sL, -PI * 0.5, -PI * 0.5, 1);
      bR = braco(sR, -PI * 0.5, -PI * 0.5, -1);
      break;
    case 'palma':
      bL = braco(sL, PI * 0.2, -PI * 0.35, 1);
      bR = braco(sR, PI * 0.8, -PI * 0.65, -1);
      break;
    case 'mao':
      /* dá a mão para alguém menor do lado esquerdo */
      bL = braco(sL, PI * 0.68, PI * 0.78, 1);
      bR = braco(sR, PI * 0.56, PI * 0.6, -1);
      break;
    case 'segura':
      bL = braco(sL, PI * 0.4, -PI * 0.15, 1);
      bR = braco(sR, PI * 0.4, PI * 1.15, -1);
      break;
    case 'abraca':
      bL = braco(sL, PI * 0.15, -PI * 0.1, 1);
      bR = braco(sR, PI * 0.85, PI * 1.1, -1);
      break;
    case 'reverencia':
      bL = braco(sL, PI * 0.35, PI * 0.5, 1);
      bR = braco(sR, PI * 0.5, PI * 0.5, -1);
      break;
    case 'anda':
      bL = braco(sL, PI * 0.5 + dir * balanco * 0.42, PI * 0.5 + dir * (balanco * 0.42 - 0.3), 1);
      bR = braco(sR, PI * 0.5 - dir * balanco * 0.42, PI * 0.5 - dir * (balanco * 0.42 + 0.3), -1);
      break;
    case 'salto':
      /* braços abertos para cima, um para a frente e outro para trás, como no balé */
      bL = braco(sL, -PI * 0.5 - dir * PI * 0.32, -PI * 0.5 - dir * PI * 0.22, 1);
      bR = braco(sR, -PI * 0.5 + dir * PI * 0.22, -PI * 0.5 + dir * PI * 0.12, -1);
      break;
    case 'escorrega':
      /* os braços voam, procurando equilíbrio */
      bL = braco(sL, -PI * 0.85, -PI * 0.6, 1);
      bR = braco(sR, -PI * 0.2, -PI * 0.45, -1);
      break;
    case 'deitado':
      bL = braco(sL, -PI * 0.55, -PI * 0.5, 1);
      bR = braco(sR, PI * 0.95, PI * 0.9, -1);
      break;
    case 'plie':
      /* os braços em coroa baixa, na frente do corpo */
      bL = braco(sL, PI * 0.6, PI * 0.22, 1);
      bR = braco(sR, PI * 0.4, PI * 0.78, -1);
      break;
    case 'releve':
      /* os braços em coroa alta, por cima da cabeça */
      bL = braco(sL, -PI * 0.62, -PI * 0.22, 1);
      bR = braco(sR, -PI * 0.38, -PI * 0.78, -1);
      break;
    case 'agradece': {
      /* o braço de trás abre para o lado; o da frente desce cruzando na frente da saia */
      const lado = (a: number) => (dir > 0 ? a : PI - a);
      const bTras = braco(dir > 0 ? sL : sR, lado(PI * 0.88), lado(PI * 0.92), dir > 0 ? 1 : -1);
      const bFrente = braco(dir > 0 ? sR : sL, lado(PI * 0.6), lado(PI * 0.82), dir > 0 ? -1 : 1);
      bL = dir > 0 ? bTras : bFrente;
      bR = dir > 0 ? bFrente : bTras;
      break;
    }
    case 'segunda':
    case 'tendu':
      /* os braços abertos para os lados, um pouco para baixo: a segunda posição */
      bL = braco(sL, PI * 0.9, PI * 0.93, 1);
      bR = braco(sR, PI * 0.1, PI * 0.07, -1);
      break;
    case 'passe':
      bL = braco(sL, -PI * 0.62, -PI * 0.22, 1);
      bR = braco(sR, -PI * 0.38, -PI * 0.78, -1);
      break;
    case 'attitude': {
      /* o braço do lado da perna levantada vai ao alto; o outro abre para o lado */
      const lado = (a: number) => (dir > 0 ? a : PI - a);
      const bTras = braco(dir > 0 ? sL : sR, lado(-PI * 0.7), lado(-PI * 0.45), dir > 0 ? 1 : -1);
      const bFrente = braco(dir > 0 ? sR : sL, lado(PI * 0.08), lado(PI * 0.04), dir > 0 ? -1 : 1);
      bL = dir > 0 ? bTras : bFrente;
      bR = dir > 0 ? bFrente : bTras;
      break;
    }
    case 'arabesque': {
      /* o braço da frente esticado para a frente e um pouco para cima; o de trás aberto para o lado */
      const frente = (a: number) => (dir > 0 ? a : PI - a);
      const trasS = dir > 0 ? sL : sR;
      const frenteS = dir > 0 ? sR : sL;
      const bTras = braco(trasS, frente(-PI * 0.92), frente(-PI * 0.88), dir > 0 ? 1 : -1);
      const bFrente = braco(frenteS, frente(-PI * 0.15), frente(-PI * 0.1), dir > 0 ? -1 : 1);
      bL = dir > 0 ? bTras : bFrente;
      bR = dir > 0 ? bFrente : bTras;
      break;
    }
    default:
      /* parado: os braços caem ao lado do corpo, as mãos um pouco afastadas */
      bL = braco(sL, PI * 0.58, PI * 0.54, 1);
      bR = braco(sR, PI * 0.42, PI * 0.46, -1);
  }
  const [mangaL = '', mangaR = ''] = mangas ? mangas.split('|') : ['', ''];
  const pescoco = forma(membro([x + inclina, shY], [cabeca[0], cabeca[1] + hr * 0.6], 1.5 * esc, 1.4 * esc), pele, { mudo: true });
  const ombros = forma(membro(sL, sR, 2.2 * esc, 2.2 * esc), pele, { mudo: true });

  /* a cabeça: cabelo, rosto, barba e óculos desenhados na cabeça de raio 30 e escalados */
  const [hx, hy] = cabeca;
  const k = hr / R;
  const local = (inner: string) => (inner ? `<g transform="translate(${f(hx)} ${f(hy)}) scale(${f(dir * k * 1000) / 1000} ${f(k * 1000) / 1000})">${inner}</g>` : '');
  const cab = cabeloLocal(o, nivel);
  const queixo = o.cara?.queixo === 'reto';
  const cabecaD = queixo ? 'M-30 0A30 30 0 0 1 30 0C31 15 24 30 8 32H-8C-24 30 -31 15 -30 0z' : o.crianca ? circ([0, 0], R) : elipse(0, 1, R, R * 1.07);
  const ro = o.orelha ?? 6.5;
  const orelhas = nivel === 'mini' ? '' : forma(circ([-R + 1 + (6.5 - ro) * 0.6, 4], ro), pele, pl) + forma(circ([R - 1 - (6.5 - ro) * 0.6, 4], ro), pele, pl);
  const brinco = o.cara?.brinco && nivel !== 'mini' ? `<circle cx="-30" cy="9" r="2.6" fill="none" stroke="${o.cara.brinco}" stroke-width="1.2" vector-effect="non-scaling-stroke"/><circle cx="30" cy="9" r="2.6" fill="none" stroke="${o.cara.brinco}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>` : '';
  const cabecaSvg = local(orelhas + brinco + forma(cabecaD, pele, pl) + barbaLocal(o, nivel) + rostoLocal(o, nivel) + oculosLocal(o, nivel) + cab.frente);

  const svg =
    `<g><g class="cabelo-atras">${local(cab.atras)}</g>` +
    ombros +
    pernas +
    tutu +
    bL.d +
    bL.manga +
    mangaL +
    roupaPath +
    pescoco +
    bR.d +
    bR.manga +
    mangaR +
    cabecaSvg +
    `</g>`;
  return { svg, maoL: bL.w, maoR: bR.w, cabeca, raioCabeca: hr };
}

/* ---------- a família ---------- */

type Extra = Partial<Figura>;

/** As quatro faces escolhidas em docs/referencia/familia.html. */
export const CARAS: Record<'menina' | 'irmao' | 'mae' | 'pai', Cara> = {
  menina: { olhos: 'sorriso', boca: 'dentes', sobrancelha: 'fina', bochecha: true },
  irmao: { olhos: 'abertos', boca: 'largo', sobrancelha: 'grossa', queixo: 'reto', bochecha: false },
  mae: { olhos: 'abertos', boca: 'dentes', sobrancelha: 'fina', bochecha: true, brinco: C.ouro },
  pai: { olhos: 'sorriso', boca: 'dentes', sobrancelha: 'fina', bochecha: true },
};

export const familia = {
  /** a menina em casa: vestido rosa de flores, cabelo mel repartido com lacinho. No palco, `tutu` e coque. */
  menina: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleMenina, cabelo: C.cabeloMenina, roupa: C.rosaDoce, cabeloTipo: 'repartido', laco: C.rosaDoce, vestido: true, manguinhas: true, estampa: [C.vinho, C.roxo], sapato: C.luz, cara: CARAS.menina, ...extra }),
  meninaPalco: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleMenina, cabelo: C.cabeloMenina, roupa: C.rosaDoce, cabeloTipo: 'coque', tutu: '#F7C3D8', sapato: '#EFB9CE', cara: CARAS.menina, ...extra }),
  /** o irmão, o baterista: a nuvem de cachos, camisa xadrez aberta sobre a camiseta escura */
  irmao: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleIrmao, cabelo: C.cabeloIrmao, cabeloLuz: C.luzIrmao, roupa: C.grafite, camisa: C.creme, xadrez: C.vinho, calca: '#3f4652', calcaCurta: true, cabeloTipo: 'rebelde', forte: 1.2, sapato: '#8b8078', cara: CARAS.irmao, ...extra }),
  /** a mãe: cabelo em camadas atrás da orelha, vestido salmão, magra */
  mae: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.peleMae, cabelo: C.cabeloMae, roupa: C.salmao, cabeloTipo: 'camadas', vestido: true, gola: true, forte: 0.8, esbelta: true, orelha: 4.6, sapato: C.ouro, cara: CARAS.mae, ...extra }),
  /** o pai: a faixa rala de cabelo, barba cheia grisalha, óculos redondos, camiseta preta e jeans */
  pai: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.pelePai, cabelo: C.cabeloPai, cabeloLuz: '#a39a90', roupa: C.preto, calca: C.jeans, cabeloTipo: 'ralo', oculos: 'redondo', barba: C.barbaPai, barbaEstilo: 'cheia', forte: 1.18, sapato: '#8b8078', cara: CARAS.pai, ...extra }),
  /** bonecas Waldorf de pano: rosto quase liso, cabelo de lã (src/puppet/bonecaPano.ts) */
  boneca: (x: number, y: number, h: number, i: number, extra: OpcoesBoneca = {}): Desenho => bonecaPano(x, y, h, i, extra),
};

/**
 * O figurino escolhido para uma boneca vira opções do desenho; sem figurino, nada muda.
 * O campo `gorro` guarda o enfeite da cabeça. Saves antigos guardavam ali uma cor
 * de gorro: vira o gorrinho de lã.
 */
export function figurinoDe(f: { roupa: string; cabelo: string; gorro: string } | undefined): OpcoesBoneca {
  if (!f) return {};
  const x: OpcoesBoneca = { roupa: f.roupa, cabelo: f.cabelo };
  if (f.gorro && f.gorro !== 'nenhum') x.enfeite = f.gorro.startsWith('#') ? 'gorro' : (f.gorro as Enfeite);
  return x;
}

/** Proporções decididas: a menina 1, o irmão 1,5, pais 2. */
export const ALTURAS = { menina: 1, irmao: 1.5, mae: 2, pai: 2.1 };
