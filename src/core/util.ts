export function esperar(t: number): Promise<void> {
  return new Promise((r) => setTimeout(r, t));
}

/** Lê uma duração dos tokens em ms. Fora do DOM devolve 0. */
export function ms(token: string): number {
  if (typeof getComputedStyle === 'undefined') return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s')) return parseFloat(v) * 1000;
  return 0;
}

export function cor(token: string): string {
  if (typeof getComputedStyle === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | ((ev: Event) => void) | undefined> = {},
  ...filhos: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const f of filhos) {
    if (f === null || f === undefined || f === false) continue;
    el.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
  }
  return el;
}

const NS = 'http://www.w3.org/2000/svg';

/** Um elemento SVG a partir de texto. */
export function svgEl(html: string): SVGElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as SVGElement;
}

/** Um SVG de cena inteira (viewBox 390 x 780 por padrão) com o conteúdo dado. */
export function cena(conteudo: string, viewBox = '0 0 390 780'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('class', 'cena');
  /* meet, nunca slice: em telas mais curtas que 1:2 o slice cortava o alto da cena e
     jogava a casinha e a lua para dentro da borda morta. Sobram faixas finas nos lados,
     que ficam da cor do fundo da tela. */
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.innerHTML = conteudo;
  return svg;
}

export function embaralhar<T>(xs: T[], seed = Math.random()): T[] {
  const a = xs.slice();
  let s = Math.floor(seed * 2147483647) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Sorteio determinístico a partir de uma chave de texto (o dia, por exemplo). */
export function semente(chave: string): number {
  let hsh = 2166136261;
  for (let i = 0; i < chave.length; i++) {
    hsh ^= chave.charCodeAt(i);
    hsh = Math.imul(hsh, 16777619);
  }
  return ((hsh >>> 0) % 1000003) / 1000003;
}

/** Observa a caixa de um elemento e avisa quando ela muda, inclusive quando deixa de ser zero. */
export function observarCaixa(el: Element, aoMudar: () => void): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', aoMudar);
    return null;
  }
  const obs = new ResizeObserver(() => aoMudar());
  obs.observe(el);
  return obs;
}

/** Converte um ponto da tela (clientX, clientY) para o espaço do viewBox de um svg. */
export function pontoNoSvg(svg: SVGSVGElement, x: number, y: number): [number, number] {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  const m = svg.getScreenCTM();
  if (!m) return [x, y];
  const p = pt.matrixTransform(m.inverse());
  return [p.x, p.y];
}
