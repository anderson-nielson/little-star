import { circ, CORES as C } from './boneco';

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

export function nuvem(x: number, y: number, s: number): string {
  return `<path d="${circ([x, y], s) + circ([x + s * 0.9, y + s * 0.2], s * 0.75) + circ([x - s * 0.9, y + s * 0.25], s * 0.7)}" fill="${C.papel}" opacity="0.7"/>`;
}

/** A casinha verde: voltar para casa. Sempre no canto de cima, grande (72 px). */
export function casinha(x = 40, y = 44): string {
  return `<g class="casinha" data-alvo="casa" aria-label="voltar para casa"><circle cx="${x}" cy="${y}" r="36" fill="${C.marfim}" opacity="0.85"/><path d="M${x - 17} ${y + 2}L${x} ${y - 15}L${x + 17} ${y + 2}V${y + 16}H${x - 17}z" fill="#8FAE6B" stroke="${C.musgoTinta}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x - 4.5} ${y + 16}V${y + 6}H${x + 4.5}V${y + 16}" fill="${C.rosaDoce}"/></g>`;
}

/** A lua do cantinho dos pais: quase invisível, na linha da casinha, logo à esquerda do botão das opções. */
export function lua(x = 294, y = 44): string {
  return `<g class="lua-pais" data-alvo="pais"><circle cx="${x}" cy="${y}" r="30" fill="transparent"/><path d="M${x} ${y - 9}a9 9 0 1 0 8 13a7 7 0 1 1-8-13z" fill="${C.luz}" opacity="0.5"/></g>`;
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
  let g = `<rect x="${x - w * 0.08}" y="${y - h * 0.22}" width="${w * 0.16}" height="${h * 0.22}" fill="${C.madeira}"/>`;
  for (let i = 0; i < 4; i++) {
    const yy = y - h * 0.2 - i * h * 0.2;
    const ww = w * (1 - i * 0.2);
    const hh = h * 0.3;
    g += `<path d="M${x} ${yy - hh}L${x + ww / 2} ${yy}Q${x} ${yy - hh * 0.12} ${x - ww / 2} ${yy}z" fill="${i % 2 ? '#35564d' : '#2c4a42'}" opacity="0.92"/>`;
  }
  if (comPinhas) g += pinha(x - w * 0.22, y - h * 0.42, 5) + pinha(x + w * 0.2, y - h * 0.6, 5) + pinha(x + w * 0.05, y - h * 0.28, 5);
  return `<g>${g}</g>`;
}

export function gato(x: number, y: number, s: number, cor = '#c8b8a6', deitado = false): string {
  const olhos = (ox: number, oy: number) =>
    `<path d="M${ox - s * 0.2} ${oy}q${s * 0.08} ${-s * 0.08} ${s * 0.16} 0M${ox + s * 0.04} ${oy}q${s * 0.08} ${-s * 0.08} ${s * 0.16} 0" fill="none" stroke="${C.tinta}" stroke-width="${s * 0.06}" stroke-linecap="round" opacity="0.7"/>`;
  if (deitado)
    return `<g><ellipse cx="${x}" cy="${y - s * 0.35}" rx="${s * 0.9}" ry="${s * 0.38}" fill="${cor}"/><path d="M${x + s * 0.8} ${y - s * 0.4}q${s * 0.7} ${-s * 0.3} ${s * 0.5} ${s * 0.35}" fill="none" stroke="${cor}" stroke-width="${s * 0.16}" stroke-linecap="round"/><circle cx="${x - s * 0.75}" cy="${y - s * 0.55}" r="${s * 0.36}" fill="${cor}"/><path d="M${x - s * 1.0} ${y - s * 0.82}l${-s * 0.06} ${-s * 0.3} ${s * 0.25} ${s * 0.16}zM${x - s * 0.6} ${y - s * 0.86}l${s * 0.06} ${-s * 0.3} ${-s * 0.25} ${s * 0.16}z" fill="${cor}"/>${olhos(x - s * 0.7, y - s * 0.55)}</g>`;
  return `<g><ellipse cx="${x}" cy="${y - s * 0.5}" rx="${s * 0.5}" ry="${s * 0.55}" fill="${cor}"/><path class="rabo" d="M${x + s * 0.4} ${y - s * 0.2}q${s * 0.8} 0 ${s * 0.6} ${-s * 0.7}" fill="none" stroke="${cor}" stroke-width="${s * 0.16}" stroke-linecap="round"/><circle cx="${x}" cy="${y - s * 1.1}" r="${s * 0.38}" fill="${cor}"/><path d="M${x - s * 0.32} ${y - s * 1.35}l${-s * 0.08} ${-s * 0.32} ${s * 0.28} ${s * 0.14}zM${x + s * 0.32} ${y - s * 1.35}l${s * 0.08} ${-s * 0.32} ${-s * 0.28} ${s * 0.14}z" fill="${cor}"/>${olhos(x, y - s * 1.1)}</g>`;
}

export function coelho(x: number, y: number, s: number, cor = '#e9e2d6', pulo = false): string {
  const dy = pulo ? -s * 0.5 : 0;
  return `<g transform="translate(0 ${dy})"><ellipse cx="${x}" cy="${y - s * 0.45}" rx="${s * 0.55}" ry="${s * 0.42}" fill="${cor}"/><circle cx="${x - s * 0.55}" cy="${y - s * 0.35}" r="${s * 0.16}" fill="${C.rosaClara}"/><circle cx="${x + s * 0.45}" cy="${y - s * 0.85}" r="${s * 0.3}" fill="${cor}"/><path d="M${x + s * 0.32} ${y - s * 1.1}q${-s * 0.1} ${-s * 0.7} ${s * 0.14} ${-s * 0.75}q${s * 0.16} ${0.05 * s} ${s * 0.02} ${s * 0.75}zM${x + s * 0.56} ${y - s * 1.1}q${s * 0.05} ${-s * 0.7} ${s * 0.26} ${-s * 0.7}q${s * 0.1} ${0.1 * s} ${-s * 0.1} ${s * 0.7}z" fill="${cor}"/><path d="M${x + s * 0.42} ${y - s * 1.08}q${-s * 0.06} ${-s * 0.55} ${s * 0.06} ${-s * 0.6}M${x + s * 0.64} ${y - s * 1.08}q${s * 0.05} ${-s * 0.55} ${s * 0.14} ${-s * 0.55}" fill="none" stroke="${C.rosaDoce}" stroke-width="${s * 0.06}" opacity="0.6"/><path d="M${x + s * 0.5} ${y - s * 0.86}q${s * 0.07} ${-s * 0.07} ${s * 0.14} 0" fill="none" stroke="${C.tinta}" stroke-width="${s * 0.05}" stroke-linecap="round" opacity="0.7"/></g>`;
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
