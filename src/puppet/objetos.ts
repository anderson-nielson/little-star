import { circ, CORES as C } from './boneco';
import { claro, escuro, fio, fios, forma } from './pincel';

/** A centelha de quatro pontas do Ponta: a estrela do jogo. Nunca ★. */
export const CENTELHA = 'M10 0c.7 6.2 3.8 9.3 10 10-6.2.7-9.3 3.8-10 10-.7-6.2-3.8-9.3-10-10 6.2-.7 9.3-3.8 10-10z';

export function centelha(x: number, y: number, s: number, cor = C.ouro, attrs = ''): string {
  return `<path d="${CENTELHA}" fill="${cor}" transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 20})" ${attrs}/>`;
}

export function pol(cx: number, cy: number, r: number, ang: number): [number, number] {
  return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
}

/** Centelhas rosa e ouro subindo: alguém da família está feliz com você. */
export function centelhas(cx: number, cy: number, n = 6, r = 30, cls = 'sobe'): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = pol(cx, cy, r * (0.6 + (i % 3) * 0.25), -Math.PI / 2 + (i - n / 2) * 0.5);
    s += `<g class="${cls}" style="animation-delay:${i * 90}ms">${centelha(x, y, 8 + (i % 2) * 4, i % 2 ? C.rosaDoce : C.ouro)}</g>`;
  }
  return s;
}

/**
 * Véu de aquarela: formas lisas e transparentes sobrepostas, sem blur. As elipses
 * passam da caixa; com `recorta`, ficam dentro dela (um svg aninhado corta a sobra),
 * para o véu de um cômodo não manchar o céu e o telhado.
 */
export function veu(x: number, y: number, w: number, h: number, cor: string, n = 4, op = 0.28, recorta = false): string {
  let s = recorta ? `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden">` : '';
  for (let i = 0; i < n; i++) {
    const cx = x + w * (0.2 + 0.6 * ((i * 0.37) % 1));
    const cy = y + h * (0.3 + 0.4 * ((i * 0.61) % 1));
    s += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(w * 0.45).toFixed(1)}" ry="${(h * 0.5).toFixed(1)}" fill="${cor}" opacity="${op}"/>`;
  }
  return recorta ? s + '</svg>' : s;
}

/** A nuvem: um contorno só, para o lápis passar em volta, e um pouco transparente. */
export function nuvem(x: number, y: number, s: number): string {
  const P = (a: number, b: number) => `${(x + a * s).toFixed(1)} ${(y + b * s).toFixed(1)}`;
  const d = `M${P(-1.5, 0.8)}Q${P(-2.0, 0.1)} ${P(-1.25, -0.1)}Q${P(-1.05, -0.95)} ${P(-0.25, -0.7)}Q${P(0.3, -1.35)} ${P(0.95, -0.6)}Q${P(1.75, -0.7)} ${P(1.65, 0.2)}Q${P(2.05, 0.8)} ${P(1.5, 0.8)}z`;
  return forma(d, C.papel, { op: 0.8, lapis: 0.3, opLapis: 0.55 });
}

/**
 * A casinha verde: voltar para casa. Sempre no canto de cima à esquerda, com a
 * mesma margem (16) de cima e do lado que os botões da direita. O disco
 * desenhado tem 56 de diâmetro, no mesmo papel e no mesmo contorno de ouro escuro
 * (1,5) dos botões do cabeçalho; o alvo do dedo continua com 72.
 */
export function casinha(x = 44, y = 44): string {
  const k = 0.8;
  const p = (dx: number, dy: number) => `${(x + dx * k).toFixed(1)} ${(y + dy * k).toFixed(1)}`;
  return `<g class="casinha" data-alvo="casa" aria-label="voltar para casa"><circle cx="${x}" cy="${y}" r="36" fill="transparent"/><circle cx="${x}" cy="${y}" r="28" fill="${C.papel}" stroke="#8f6f2c" stroke-width="1.5"/><path d="M${p(-17, 1)}L${p(0, -16)}L${p(17, 1)}V${(y + 15 * k).toFixed(1)}H${(x - 17 * k).toFixed(1)}z" fill="#8FAE6B" stroke="${C.musgoTinta}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${p(-4.5, 15)}V${(y + 5 * k).toFixed(1)}H${(x + 4.5 * k).toFixed(1)}V${(y + 15 * k).toFixed(1)}" fill="${C.rosaDoce}"/></g>`;
}

/** A mãozinha desenhada: faça este gesto. */
export function maozinha(x: number, y: number, s = 1, rot = 0, cls = 'pulsa'): string {
  return `<g class="maozinha ${cls}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z" fill="${C.rosaClara}" stroke="${C.musgoTinta}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
}

/** Contorno de luz pulsando: pode tocar aqui. */
export function contornoLuz(cx: number, cy: number, rx: number, ry: number, cls = 'pulsa'): string {
  return `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ouro}" stroke-width="2.5"/>`;
}

export function pinha(x: number, y: number, s: number, tipo = 0): string {
  let d = '';
  const linhas = tipo === 1 ? 5 : tipo === 2 ? 3 : 4;
  const cols = tipo === 3 ? 4 : 3;
  const cor = tipo === 3 ? '#8a5a3a' : '#a8714a';
  for (let i = 0; i < linhas; i++)
    for (let j = 0; j < cols; j++) {
      const yy = y - s * 0.9 + i * s * 0.28;
      const xx = x - s * 0.15 * (cols - 1) + j * s * 0.3 + (i % 2) * s * 0.15;
      d += `<ellipse cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" rx="${(s * 0.16).toFixed(1)}" ry="${(s * 0.2).toFixed(1)}" fill="${cor}" opacity="${0.75 + 0.06 * i}"/>`;
    }
  return `<g>${d}</g>`;
}

export function flor(x: number, y: number, cor: string, s = 10, girassol = false): string {
  let pet = '';
  const n = girassol ? 10 : 5;
  for (let i = 0; i < n; i++) {
    const [px, py] = pol(x, y - s * 1.6, s * (girassol ? 0.55 : 0.42), (i * Math.PI * 2) / n - Math.PI / 2);
    pet += circ([px, py], s * (girassol ? 0.28 : 0.34));
  }
  return `<g><path d="M${x} ${y}V${y - s * 1.4}" stroke="${C.musgoTinta}" stroke-width="${s * 0.12}" fill="none"/><path d="${pet}" fill="${girassol ? '#e8c24a' : cor}"/><circle cx="${x}" cy="${y - s * 1.6}" r="${s * (girassol ? 0.34 : 0.22)}" fill="${girassol ? '#6b4a2a' : C.luz}"/></g>`;
}

export function pinheiro(x: number, y: number, h: number, comPinhas = true): string {
  const w = h * 0.34;
  let g = forma(`M${(x - w * 0.08).toFixed(1)} ${(y - h * 0.22).toFixed(1)}h${(w * 0.16).toFixed(1)}v${(h * 0.22).toFixed(1)}h${(-w * 0.16).toFixed(1)}z`, C.madeira, { lapis: 0.4 });
  for (let i = 0; i < 4; i++) {
    const yy = y - h * 0.2 - i * h * 0.2;
    const ww = w * (1 - i * 0.2);
    const hh = h * 0.3;
    g += forma(`M${x} ${yy - hh}L${x + ww / 2} ${yy}Q${x} ${yy - hh * 0.12} ${x - ww / 2} ${yy}z`, i % 2 ? '#3d6154' : '#35564d', { op: 0.92, lapis: 0.35 });
  }
  if (comPinhas) g += pinha(x - w * 0.22, y - h * 0.42, 5) + pinha(x + w * 0.2, y - h * 0.6, 5) + pinha(x + w * 0.05, y - h * 0.28, 5);
  return `<g>${g}</g>`;
}

/**
 * O gatinho, a lápis e aquarela: corpo sentado, cabeça redonda, orelhas, o
 * rabo em curva, olhos em arco, bigodes. Deitado, enrolado com a cabeça de lado.
 * Tudo em função de `s` (mais ou menos o raio da cabeça).
 */
export function gato(x: number, y: number, s: number, cor = '#c4b4a0', deitado = false): string {
  const pl = { lapis: 0.4 };
  const detalhe = s >= 14;
  const olhos = (ox: number, oy: number) =>
    fios([`M${ox - s * 0.24} ${oy}q${s * 0.1} ${-s * 0.1} ${s * 0.2} 0`, `M${ox + s * 0.04} ${oy}q${s * 0.1} ${-s * 0.1} ${s * 0.2} 0`], C.lapisTinta, s >= 14 ? 1.3 : 1, 0.8);
  const bigodes = (ox: number, oy: number) => (detalhe ? fios([`M${ox - s * 0.42} ${oy + s * 0.06}l${-s * 0.3} ${-s * 0.04}`, `M${ox - s * 0.42} ${oy + s * 0.16}l${-s * 0.3} ${s * 0.08}`, `M${ox + s * 0.42} ${oy + s * 0.06}l${s * 0.3} ${-s * 0.04}`, `M${ox + s * 0.42} ${oy + s * 0.16}l${s * 0.3} ${s * 0.08}`], escuro(cor, 0.35), 1, 0.6) : '');
  const orelha = (ox: number, oy: number, lado: 1 | -1) => forma(`M${ox + lado * s * 0.3} ${oy - s * 0.2}l${lado * s * 0.08} ${-s * 0.42}l${-lado * s * 0.34} ${s * 0.2}z`, cor, pl) + (detalhe ? forma(`M${ox + lado * s * 0.28} ${oy - s * 0.26}l${lado * s * 0.04} ${-s * 0.24}l${-lado * s * 0.18} ${s * 0.1}z`, C.rosaClara, { mudo: true }) : '');
  if (deitado) {
    const cx = x;
    const cy = y - s * 0.35;
    const hx = x - s * 0.75;
    const hy = y - s * 0.55;
    return (
      `<g>` +
      fio(`M${x + s * 0.8} ${y - s * 0.4}q${s * 0.7} ${-s * 0.3} ${s * 0.5} ${s * 0.35}`, escuro(cor, 0.12), s * 0.16, 0.95) +
      forma(`M${cx - s * 0.9} ${cy}a${s * 0.9} ${s * 0.38} 0 1 0 ${s * 1.8} 0a${s * 0.9} ${s * 0.38} 0 1 0 ${-s * 1.8} 0z`, cor, pl) +
      orelha(hx, hy, -1) + orelha(hx, hy, 1) +
      forma(circ([hx, hy], s * 0.36), cor, pl) +
      olhos(hx, hy) +
      `</g>`
    );
  }
  const hx = x;
  const hy = y - s * 1.1;
  return (
    `<g>` +
    fio(`M${x + s * 0.4} ${y - s * 0.2}q${s * 0.8} 0 ${s * 0.6} ${-s * 0.7}`, escuro(cor, 0.12), s * 0.16, 0.95, 'class="rabo"') +
    forma(`M${x - s * 0.5} ${y}C${x - s * 0.66} ${y - s * 0.7} ${x - s * 0.3} ${y - s * 1.2} ${x + s * 0.15} ${y - s * 1.15}C${x + s * 0.6} ${y - s * 1.1} ${x + s * 0.62} ${y - s * 0.45} ${x + s * 0.5} ${y}z`, cor, pl) +
    forma(`M${x - s * 0.44} ${y}a${s * 0.2} ${s * 0.1} 0 1 0 ${s * 0.4} 0a${s * 0.2} ${s * 0.1} 0 1 0 ${-s * 0.4} 0z`, cor, pl) +
    forma(`M${x + s * 0.06} ${y}a${s * 0.2} ${s * 0.1} 0 1 0 ${s * 0.4} 0a${s * 0.2} ${s * 0.1} 0 1 0 ${-s * 0.4} 0z`, cor, pl) +
    orelha(hx, hy, -1) + orelha(hx, hy, 1) +
    forma(circ([hx, hy], s * 0.38), cor, pl) +
    olhos(hx, hy) +
    bigodes(hx, hy) +
    `</g>`
  );
}

/** O coelhinho: corpo agachado, cabeça erguida, orelhas compridas com o rosa por dentro, pompom de rabo. */
export function coelho(x: number, y: number, s: number, cor = '#f1ebe0', pulo = false): string {
  const dy = pulo ? -s * 0.5 : 0;
  const pl = { lapis: 0.4 };
  const detalhe = s >= 14;
  return (
    `<g transform="translate(0 ${dy})">` +
    forma(`M${x + s * 0.32} ${y - s * 1.1}q${-s * 0.1} ${-s * 0.7} ${s * 0.14} ${-s * 0.75}q${s * 0.16} ${0.05 * s} ${s * 0.02} ${s * 0.75}z`, cor, pl) +
    forma(`M${x + s * 0.56} ${y - s * 1.1}q${s * 0.05} ${-s * 0.7} ${s * 0.26} ${-s * 0.7}q${s * 0.1} ${0.1 * s} ${-s * 0.1} ${s * 0.7}z`, cor, pl) +
    (detalhe ? forma(`M${x + s * 0.4} ${y - s * 1.12}q${-s * 0.04} ${-s * 0.5} ${s * 0.08} ${-s * 0.55}q${s * 0.06} ${0.05 * s} ${s * 0.02} ${s * 0.55}z`, C.rosaClara, { mudo: true }) : '') +
    forma(`M${x - s * 0.55} ${y}C${x - s * 0.75} ${y - s * 0.55} ${x - s * 0.3} ${y - s * 0.9} ${x + s * 0.2} ${y - s * 0.82}C${x + s * 0.6} ${y - s * 0.75} ${x + s * 0.66} ${y - s * 0.25} ${x + s * 0.55} ${y}z`, cor, pl) +
    forma(circ([x - s * 0.55, y - s * 0.35], s * 0.16), claro(cor, 0.5), { mudo: true }) +
    forma(`M${x + s * 0.1} ${y}a${s * 0.22} ${s * 0.1} 0 1 0 ${s * 0.44} 0a${s * 0.22} ${s * 0.1} 0 1 0 ${-s * 0.44} 0z`, cor, { mudo: true }) +
    forma(circ([x + s * 0.45, y - s * 0.85], s * 0.3), cor, pl) +
    fio(`M${x + s * 0.5} ${y - s * 0.86}q${s * 0.07} ${-s * 0.07} ${s * 0.14} 0`, C.lapisTinta, s >= 14 ? 1.3 : 1, 0.8) +
    `<circle cx="${x + s * 0.72}" cy="${y - s * 0.76}" r="${s * 0.05}" fill="${C.rosaDoce}" opacity="0.8"/>` +
    `</g>`
  );
}

/** A caixa de areia em estrela de cinco pontas, vista de cima e achatada. A única estrela de cinco pontas do jogo. */
export function caixaDeAreia(cx: number, cy: number, R: number, achatamento = 0.6): string {
  const r = R * 0.42;
  const ponto = (i: number, k: number) => {
    const [px, py] = pol(cx, cy, (i % 2 ? r : R) * k, -Math.PI / 2 + (i * Math.PI) / 5);
    return `${px.toFixed(1)} ${(py * achatamento + cy * (1 - achatamento)).toFixed(1)}`;
  };
  let star = '';
  let dentro = '';
  for (let i = 0; i < 10; i++) {
    star += (i ? 'L' : 'M') + ponto(i, 1);
    dentro += (i ? 'L' : 'M') + ponto(i, 0.78);
  }
  return `<path d="${star}z" fill="#D2463C"/><path d="${dentro}z" fill="#EEDDB4"/>`;
}

/** O arco do proscênio, a moldura da casa. */
export function arco(x: number, y: number, w: number, h: number, fill: string, stroke = C.ouro): string {
  const r = w / 2;
  return `<path d="M${x} ${y + h}V${y + r}a${r} ${r} 0 0 1 ${w} 0V${y + h}z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** Um balanço pequeno, de madeira e corda: o parquinho do condomínio visto de longe, a lembrança na mesa. */
export function balancinho(x: number, y: number, s: number, ang = 0): string {
  const px = x;
  const py = y - s;
  return (
    `<g><path d="M${x - s * 0.5} ${y}L${x - s * 0.34} ${py}L${x - s * 0.18} ${y}M${x + s * 0.5} ${y}L${x + s * 0.34} ${py}L${x + s * 0.18} ${y}" fill="none" stroke="${C.madeira}" stroke-width="${s * 0.09}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M${x - s * 0.36} ${py}h${s * 0.72}" stroke="#8a6a4a" stroke-width="${s * 0.1}" stroke-linecap="round"/>` +
    `<g transform="rotate(${ang} ${px} ${py})"><path d="M${x - s * 0.08} ${py}v${s * 0.62}M${x + s * 0.08} ${py}v${s * 0.62}" stroke="#8f6f2c" stroke-width="${s * 0.04}"/><rect x="${x - s * 0.16}" y="${y - s * 0.4}" width="${s * 0.32}" height="${s * 0.07}" rx="${s * 0.03}" fill="${C.madeira}"/></g></g>`
  );
}
