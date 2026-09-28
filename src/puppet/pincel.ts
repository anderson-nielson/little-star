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
  /** no passe de cena: contorna também o que tem opacidade (as figuras pequenas, não os véus) */
  comOpacidade?: boolean;
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

/* ---------- o passe de lápis numa cena inteira ---------- */

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const FORMA = /<(path|rect|circle|ellipse|polygon)\b([^>]*?)\/>/g;

/**
 * Passa o lápis numa cena inteira: toda forma preenchida ganha por cima o seu
 * contorno a lápis, num tom escuro da própria cor. Pula o que já tem traço, o que
 * é transparente ou tem opacidade (os véus e as sombras), e os fundos grandes
 * (céu, grama, parede inteira). É o que faz as telas antigas, desenhadas com
 * formas lisas, entrarem no estilo sem reescrever cada uma.
 */
export function aLapis(svg: string, o: OpcoesForma = {}): string {
  return svg.replace(FORMA, (todo, tag: string, attrs: string) => {
    const fill = /\sfill="([^"]*)"/.exec(attrs)?.[1];
    if (!fill || !HEX.test(fill)) return todo;
    if (/\sstroke=|data-sem-lapis/.test(attrs)) return todo;
    if (!o.comOpacidade && /\sopacity=|\sfill-opacity=/.test(attrs)) return todo;
    if (tag === 'rect') {
      const w = Number(/\swidth="([^"]*)"/.exec(attrs)?.[1] ?? 0);
      const h = Number(/\sheight="([^"]*)"/.exec(attrs)?.[1] ?? 0);
      if (w >= 300 || h >= 300) return todo;
    }
    const limpo = attrs.replace(/\s(fill|class|id|aria-label|style|data-[\w-]+)="[^"]*"/g, '');
    const w = f((o.w ?? 1.1) * escalaLapis);
    return `${todo}<${tag}${limpo} fill="none" stroke="${escuro(fill, o.lapis ?? 0.42)}" stroke-width="${w}" ${NSS} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${TRACO}" opacity="${o.opLapis ?? 0.7}" pointer-events="none"/>`;
  });
}

/* ---------- o lápis no canvas (o caderno, a areia, o jardim, o lago) ---------- */

/**
 * Passa o lápis no caminho que acabou de ser preenchido no canvas: chama depois
 * do `fill()`, com o mesmo caminho ainda aberto. A mesma regra do SVG: um tom
 * escuro da própria cor, traço que falha e retoma, sempre da mesma espessura.
 */
export function lapisNoCanvas(ctx: CanvasRenderingContext2D, cor: string, o: OpcoesForma = {}): void {
  ctx.save();
  ctx.strokeStyle = escuro(cor, o.lapis ?? 0.42);
  ctx.lineWidth = (o.w ?? 1.1) * escalaLapis;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([17, 1.6, 31, 2.2, 11, 1.4]);
  ctx.globalAlpha = (o.opLapis ?? 0.75) * ctx.globalAlpha;
  ctx.stroke();
  ctx.restore();
}

/** Preenche e passa o lápis de uma vez. */
export function formaNoCanvas(ctx: CanvasRenderingContext2D, cor: string, o: OpcoesForma = {}): void {
  ctx.fillStyle = cor;
  ctx.fill();
  if (!o.mudo) lapisNoCanvas(ctx, cor, o);
}

/** Uma copa de árvore, um arbusto, uma moita: um contorno ondulado em volta de uma elipse. */
export function copaPath(cx: number, cy: number, rx: number, ry: number, n = 9, semente = 0): string {
  const pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = (k * Math.PI * 2) / n;
    const w = 0.9 + 0.12 * ((Math.sin(a * 2.7 + semente) + 1) / 2);
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = pts[k]!;
    const b = pts[(k + 1) % n]!;
    const c = pts[(k + 2) % n]!;
    if (k === 0) d += `M${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`;
    /* o ponto de controle empurrado para fora: cada gomo boja como uma nuvem */
    const mx = (b[0] + c[0]) / 2;
    const my = (b[1] + c[1]) / 2;
    const px = b[0] + (b[0] - cx) * 0.18;
    const py = b[1] + (b[1] - cy) * 0.18;
    d += `Q${f(px)} ${f(py)} ${f(mx)} ${f(my)}`;
  }
  return d + 'z';
}
