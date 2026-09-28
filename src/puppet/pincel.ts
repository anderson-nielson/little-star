/**
 * O pincel Aquarela e Lápis: toda forma do jogo passa por aqui e sai com a
 * mesma pele. A mancha de cor pousa quase opaca e por cima vai um lápis de cor
 * fino, num tom escuro da própria cor (nunca preto), que falha e retoma como
 * uma mão de verdade e pousa meio pixel fora da mancha, como num livro impresso
 * antigo. O lápis tem sempre a mesma espessura na tela, seja no retrato grande
 * ou na marionete pequena (`vector-effect: non-scaling-stroke`). Sem filtro,
 * sem blur, sem raster.
 *
 * Escolhido em docs/referencia/estilos.html; as faces em docs/referencia/familia.html.
 */
export interface OpcoesForma {
  /** quanto o lápis escurece a cor da mancha (0 a 1); 0 é lápis da própria cor */
  lapis?: number;
  /** espessura do lápis, em pixels de tela */
  w?: number;
  /** opacidade da mancha */
  op?: number;
  /** opacidade do lápis */
  opLapis?: number;
  /** sem lápis: só a mancha */
  mudo?: boolean;
  /** a borda molhada: uma segunda mancha deslocada um pixel, onde a tinta se acumula */
  molhado?: boolean;
  /** atributos extras na mancha (classe, data-*) */
  attrs?: string;
}

/** O lápis não muda de espessura com a escala do desenho. */
export const NSS = 'vector-effect="non-scaling-stroke"';
/** O traço que falha e retoma. */
const TRACO = '17 1.6 31 2.2 11 1.4';
/** Um marrom quente para escurecer: nunca preto. */
const SOMBRA = '#3a2a22';
const LUZ = '#fffaf0';

let escalaLapis = 1;

/** Desenha com o lápis mais fino (ou mais grosso) por um trecho. */
export function comLapis<T>(k: number, desenha: () => T): T {
  const antes = escalaLapis;
  escalaLapis = k;
  try {
    return desenha();
  } finally {
    escalaLapis = antes;
  }
}

function hexRgb(c: string): [number, number, number] {
  const h = c.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (x) => x + x) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Mistura duas cores: t = 0 é a primeira, t = 1 é a segunda. */
export function mistura(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return rgbHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
/** A cor escurecida para o lápis: um marrom quente por cima, nunca preto. */
export function escuro(c: string, t = 0.3): string {
  return mistura(c, SOMBRA, t);
}
export function claro(c: string, t = 0.4): string {
  return mistura(c, LUZ, t);
}

const f = (n: number) => Math.round(n * 100) / 100;

/** Só o lápis: o contorno de uma forma, sem a mancha. */
export function lapis(d: string, cor: string, o: OpcoesForma = {}): string {
  const w = f((o.w ?? 1.1) * escalaLapis);
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" ${NSS} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${TRACO}" opacity="${o.opLapis ?? 0.78}" transform="translate(-0.5 0.4)"/>`;
}

/** A mancha de aquarela com o lápis por cima. */
export function forma(d: string, cor: string, o: OpcoesForma = {}): string {
  let s = `<path d="${d}" fill="${cor}" opacity="${o.op ?? 0.9}"${o.attrs ? ' ' + o.attrs : ''}/>`;
  if (o.molhado) s += `<path d="${d}" fill="${cor}" opacity="0.3" transform="translate(0.9 0.7)"/>`;
  if (!o.mudo) s += lapis(d, escuro(cor, o.lapis ?? 0.42), o);
  return s;
}

/** Um fio a lápis: um fio de cabelo, um bigode, um caule, uma sobrancelha. */
export function fio(d: string, cor: string, w = 1.1, op = 0.75, attrs = ''): string {
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${f(w * escalaLapis)}" ${NSS} stroke-linecap="round" opacity="${op}"${attrs ? ' ' + attrs : ''}/>`;
}
export function fios(ds: string[], cor: string, w = 1.1, op = 0.7): string {
  return ds.map((d) => fio(d, cor, w, op)).join('');
}

/**
 * A lavagem: uma mancha transparente com a borda onde a tinta se acumula. É o
 * céu, a parede, a grama. Formas grandes pintadas uma vez.
 */
export function lavagem(d: string, cor: string, op = 0.5): string {
  return `<path d="${d}" fill="${cor}" opacity="${op}"/><path d="${d}" fill="none" stroke="${escuro(cor, 0.16)}" stroke-width="3" opacity="0.2"/>`;
}

/** O grão do papel: pontinhos ouro e vinho, quase invisíveis, sobre a tela inteira. */
export const GRAO_ID = 'grao-do-papel';
export function graoDefs(): string {
  return `<defs><pattern id="${GRAO_ID}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(23)"><circle cx="1.2" cy="1.4" r=".55" fill="#8f6f2c"/><circle cx="4.6" cy="4.2" r=".42" fill="#8a3a44"/></pattern></defs>`;
}
export function grao(x: number, y: number, w: number, h: number, op = 0.12): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${GRAO_ID})" opacity="${op}" style="pointer-events:none"/>`;
}

/**
 * Pontinhos a lápis: o sal e pimenta da barba, o cabelo curto do pai. Cada um
 * é um risquinho curto.
 */
export function pontinhos(lista: [number, number][], cor: string, op = 0.6, tam = 1.6): string {
  return lista.map(([x, y]) => `<path d="M${f(x)} ${f(y)}l${f(tam)} ${f(-tam * 0.75)}" stroke="${cor}" stroke-width="${f(1.1 * escalaLapis)}" ${NSS} stroke-linecap="round" opacity="${op}"/>`).join('');
}

/** Quanto detalhe cabe numa cabeça deste raio (em px de tela). */
export type Nivel = 'grande' | 'medio' | 'mini';
export function nivelPara(raio: number): Nivel {
  return raio >= 18 ? 'grande' : raio >= 9 ? 'medio' : 'mini';
}
