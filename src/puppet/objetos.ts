import { circ, CORES as C } from './boneco';
import { claro, copaPath, escuro, fio, fios, forma } from './pincel';

/* a casa de verdade: espelho dos tokens --salvia, --telha, --beiral, --madeira-escura, --terracota, --palma */
export const CASA = {
  salvia: '#9fb88c',
  salviaEscura: '#8aa578',
  salviaClara: '#b9cca9',
  branco: '#f6f0e4',
  telha: '#cf7f5c',
  beiral: '#7a5236',
  madeira: '#8a5634',
  madeiraEscura: '#6b4126',
  madeiraClara: '#a86d44',
  terracota: '#d98a5a',
  degrau: '#8fae6b',
  palma: '#4f7a4a',
  palmaClara: '#7ea36f',
  tronco: '#b8a48a',
  folha: '#6f9a63',
  flor: '#e9b6c2',
  florEscura: '#d98fa2',
};

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
  /* a casa de verdade em miniatura: o telhado de telhas, a parede verde-sálvia, a porta de madeira */
  return (
    `<g class="casinha" data-alvo="casa" aria-label="voltar para casa"><circle cx="${x}" cy="${y}" r="36" fill="transparent"/><circle cx="${x}" cy="${y}" r="28" fill="${C.papel}" stroke="#8f6f2c" stroke-width="1.5"/>` +
    `<path d="M${p(-14, 1)}L${p(0, -12)}L${p(14, 1)}V${(y + 15 * k).toFixed(1)}H${(x - 14 * k).toFixed(1)}z" fill="${CASA.salvia}" stroke="${escuro(CASA.salvia, 0.4)}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M${p(-17, 2)}L${p(0, -14)}L${p(17, 2)}z" fill="${CASA.telha}" stroke="${escuro(CASA.telha, 0.35)}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M${p(-4, 15)}V${(y + 5 * k).toFixed(1)}H${(x + 4 * k).toFixed(1)}V${(y + 15 * k).toFixed(1)}" fill="${CASA.madeiraEscura}"/></g>`
  );
}

/* ---------- a casa de verdade, em peças ---------- */

const r1 = (n: number) => Math.round(n * 10) / 10;
function rect(x: number, y: number, w: number, h: number): string {
  return `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}z`;
}

/** A parede de reboco verde-sálvia. */
export function parede(x: number, y: number, w: number, h: number, cor = CASA.salvia): string {
  return forma(rect(x, y, w, h), cor, { lapis: 0.35 });
}
/** A faixa branca em relevo. */
export function faixa(x: number, y: number, w: number, h = 7): string {
  return forma(rect(x, y, w, h), CASA.branco, { lapis: 0.25, opLapis: 0.6 });
}
/**
 * O telhado de telhas de duas águas com o beiral de madeira: o triângulo de telha,
 * a fileira de meias-luas na borda e a viga do beiral embaixo.
 */
export function telhadoDuasAguas(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  let s = forma(`M${r1(x)} ${r1(y + h)}L${r1(cx)} ${r1(y)}L${r1(x + w)} ${r1(y + h)}z`, CASA.telha, { lapis: 0.35 });
  let ondas = '';
  const n = Math.floor(w / 9);
  for (let i = 0; i < n; i++) ondas += `M${r1(x + (w - n * 9) / 2 + i * 9)} ${r1(y + h)}a4.5 4 0 0 1 9 0`;
  s += fio(ondas, escuro(CASA.telha, 0.35), 1, 0.65);
  s += fio(`M${r1(x + w * 0.07)} ${r1(y + h - h * 0.08)}Q${r1(cx)} ${r1(y - h * 0.08)} ${r1(x + w - w * 0.07)} ${r1(y + h - h * 0.08)}`, escuro(CASA.telha, 0.3), 1, 0.4);
  s += forma(rect(x, y + h, w, 6), CASA.beiral, { lapis: 0.3 });
  return s;
}
/** Um telhado de uma água só (a beirada de telhas com o beiral), para os anexos. */
export function telhadoReto(x: number, y: number, w: number): string {
  let s = forma(rect(x, y, w, 10), CASA.telha, { lapis: 0.35 });
  let ondas = '';
  for (let i = 0; i < Math.floor(w / 9); i++) ondas += `M${r1(x + 2 + i * 9)} ${r1(y + 10)}a4.5 4 0 0 1 9 0`;
  s += fio(ondas, escuro(CASA.telha, 0.35), 1, 0.7);
  s += forma(rect(x, y + 12, w, 6), CASA.beiral, { lapis: 0.3 });
  return s;
}
/** A porta (ou o portão) de madeira ripada, com a moldura branca em cima. */
export function portaDeMadeira(x: number, y: number, w: number, h: number, ripas = 6, comMoldura = true, cls = ''): string {
  let s = comMoldura ? forma(rect(x - 4, y - 8, w + 8, 8), CASA.branco, { lapis: 0.25 }) : '';
  s += forma(rect(x, y, w, h), CASA.madeiraEscura, { lapis: 0.35, attrs: cls ? `class="${cls}"` : '' });
  let d = '';
  for (let i = 1; i < ripas; i++) d += `M${r1(x + (i * w) / ripas)} ${r1(y + 2)}V${r1(y + h - 2)}`;
  s += fio(d, escuro(CASA.madeiraEscura, 0.3), 1, 0.6);
  s += `<circle cx="${r1(x + w * 0.82)}" cy="${r1(y + h * 0.52)}" r="${r1(Math.max(1.6, w * 0.03))}" fill="${C.ouro}"/>`;
  return s;
}
/** A janela de madeira com a moldura branca e o vidro. */
export function janelaDeMadeira(x: number, y: number, w: number, h: number, vidro = '#dbe7ee'): string {
  return forma(rect(x - 3, y - 3, w + 6, h + 6), CASA.branco, { lapis: 0.25 }) + forma(rect(x, y, w, h), CASA.madeiraClara, { lapis: 0.35 }) + forma(rect(x + 3, y + 3, w - 6, h - 6), vidro, { lapis: 0.2, op: 0.85 });
}
/** A escada verde com a borda terracota, subindo até a porta. */
export function escadinha(x: number, chao: number, n: number, larg: number, alt = 9, prof = 10): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const yy = chao - (i + 1) * alt;
    s += forma(rect(x + i * prof, yy, larg - 2 * i * prof, alt), CASA.degrau, { lapis: 0.35 });
    s += forma(rect(x + i * prof, yy - 2, larg - 2 * i * prof, 3), CASA.terracota, { lapis: 0.3 });
  }
  return s;
}
/** A palmeira alta de folhas em pena. */
export function palmeira(x: number, chao: number, h: number, folhas = 9, inclina = 0): string {
  const topoY = chao - h;
  let s = forma(`M${r1(x - 4)} ${r1(chao)}C${r1(x - 5)} ${r1(chao - h * 0.5)} ${r1(x - 3 + inclina)} ${r1(chao - h * 0.8)} ${r1(x - 3 + inclina)} ${r1(topoY)}h6C${r1(x + 3 + inclina)} ${r1(chao - h * 0.8)} ${r1(x + 5)} ${r1(chao - h * 0.5)} ${r1(x + 4)} ${r1(chao)}z`, CASA.tronco, { lapis: 0.35 });
  let anel = '';
  for (let i = 1; i < 7; i++) anel += `M${r1(x - 4 + i * 0.3)} ${r1(chao - (i * h) / 7)}q4 -2 8 0`;
  s += fio(anel, escuro(CASA.tronco, 0.3), 1, 0.5);
  const cx = x + inclina;
  const cy = topoY;
  for (let i = 0; i < folhas; i++) {
    const a = -Math.PI + (i * Math.PI) / (folhas - 1) + 0.15;
    const L = h * 0.42;
    const ex = cx + Math.cos(a) * L;
    const ey = cy + Math.sin(a) * L * 0.55 + L * 0.35;
    const mx = cx + Math.cos(a) * L * 0.55;
    const my = cy + Math.sin(a) * L * 0.55 * 0.55 - L * 0.12;
    const nx = -(ey - cy);
    const ny = ex - cx;
    const nl = Math.hypot(nx, ny) || 1;
    const w = Math.max(3, h * 0.035);
    const d = `M${r1(cx)} ${r1(cy)}Q${r1(mx + (nx / nl) * w)} ${r1(my + (ny / nl) * w)} ${r1(ex)} ${r1(ey)}Q${r1(mx - (nx / nl) * w)} ${r1(my - (ny / nl) * w)} ${r1(cx)} ${r1(cy)}z`;
    s += forma(d, i % 2 ? CASA.palma : CASA.palmaClara, { lapis: 0.3, op: 0.92 });
    s += fio(`M${r1(cx)} ${r1(cy)}Q${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`, escuro(CASA.palma, 0.3), 1, 0.6);
  }
  return s;
}
/** O arbusto florido do jardim: uma copa ondulada com pontinhos de flor rosada. */
export function arbusto(cx: number, cy: number, rx: number, ry: number, semente = 0): string {
  let s = forma(copaPath(cx, cy, rx, ry, 9, semente), CASA.folha, { lapis: 0.3 });
  for (let i = 0; i < 9; i++) s += `<circle cx="${r1(cx + Math.cos(i * 2.4) * rx * 0.7)}" cy="${r1(cy + Math.sin(i * 2.4) * ry * 0.7)}" r="${2.2 + (i % 2)}" fill="${i % 3 ? CASA.flor : CASA.florEscura}" opacity="0.9"/>`;
  return s;
}
/**
 * A casa de verdade por fora, na essência (docs/referencia/casa.html, proposta C): o bloco
 * largo com o telhado de telhas de duas águas e o beiral, o reboco verde-sálvia com a faixa
 * branca, duas janelas de madeira, a porta de madeira ripada com a moldura branca no alto da
 * escadinha. `x` e `w` são a parede; `chao` é onde ela pisa; `topo` é onde a parede começa.
 * Sem a porta (`semPorta`), para a tela desenhar a porta que abre por cima.
 */
export function fachada(x: number, topo: number, w: number, chao: number, o: { semPorta?: boolean; vidro?: string } = {}): string {
  const cx = x + w / 2;
  const h = chao - topo;
  let s = parede(x, topo, w, h);
  s += telhadoDuasAguas(x - 30, topo - h * 0.47, w + 60, h * 0.47);
  s += faixa(x - 4, topo + h * 0.42, w + 8, 8);
  const jw = w * 0.16;
  const jh = h * 0.22;
  s += janelaDeMadeira(x + w * 0.13, topo + h * 0.12, jw, jh, o.vidro);
  s += janelaDeMadeira(x + w - w * 0.13 - jw, topo + h * 0.12, jw, jh, o.vidro);
  if (!o.semPorta) s += portaDeMadeira(cx - w * 0.15, topo + h * 0.5, w * 0.3, h * 0.5 - 10, 6);
  s += escadinha(cx - w * 0.2, chao, 2, w * 0.4, 6, 8);
  return s;
}

/** A mãozinha desenhada: faça este gesto. */
export function maozinha(x: number, y: number, s = 1, rot = 0, cls = 'pulsa'): string {
  return `<g class="maozinha ${cls}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-6 26V2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V26z" fill="${C.rosaClara}" stroke="${C.musgoTinta}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
}

/** Contorno de luz pulsando: pode tocar aqui. */
export function contornoLuz(cx: number, cy: number, rx: number, ry: number, cls = 'pulsa'): string {
  return `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ouro}" stroke-width="2.5"/>`;
}

/**
 * A pinha: um corpo oval com as escamas em arcos a lápis, e o miolo mais claro. Quatro
 * jeitos (mais comprida, mais gorda, mais escura), como as pinhas de verdade.
 */
export function pinha(x: number, y: number, s: number, tipo = 0): string {
  const rx = s * (tipo === 3 ? 0.62 : 0.5);
  const ry = s * (tipo === 1 ? 1.05 : tipo === 2 ? 0.75 : 0.9);
  const cor = tipo === 3 ? '#8a5a3a' : '#a8714a';
  const cy = y - ry * 0.55;
  const corpo = `M${(x - rx).toFixed(1)} ${cy.toFixed(1)}C${(x - rx).toFixed(1)} ${(cy - ry * 1.2).toFixed(1)} ${(x + rx).toFixed(1)} ${(cy - ry * 1.2).toFixed(1)} ${(x + rx).toFixed(1)} ${cy.toFixed(1)}C${(x + rx).toFixed(1)} ${(cy + ry * 0.9).toFixed(1)} ${(x + rx * 0.3).toFixed(1)} ${(cy + ry * 1.05).toFixed(1)} ${x.toFixed(1)} ${(cy + ry * 1.05).toFixed(1)}C${(x - rx * 0.3).toFixed(1)} ${(cy + ry * 1.05).toFixed(1)} ${(x - rx).toFixed(1)} ${(cy + ry * 0.9).toFixed(1)} ${(x - rx).toFixed(1)} ${cy.toFixed(1)}z`;
  let g = forma(corpo, cor, { lapis: 0.4 });
  /* as escamas: fileiras de arcos, deslocadas uma da outra */
  const linhas = s >= 6 ? 4 : 2;
  let escamas = '';
  for (let i = 0; i < linhas; i++) {
    const yy = cy - ry * 0.55 + (i * ry * 1.35) / linhas;
    const larg = rx * (1 - Math.abs((yy - cy) / ry) * 0.5);
    const n = s >= 6 ? 3 : 2;
    for (let j = 0; j < n; j++) {
      const xx = x - larg + ((j + 0.5 + (i % 2) * 0.5) * 2 * larg) / n;
      const w = larg / n;
      escamas += `M${(xx - w * 0.7).toFixed(1)} ${yy.toFixed(1)}q${(w * 0.7).toFixed(1)} ${(w * 0.9).toFixed(1)} ${(w * 1.4).toFixed(1)} 0`;
    }
  }
  g += fio(escamas, escuro(cor, 0.35), 1, 0.7);
  g += `<path d="${corpo}" fill="${claro(cor, 0.35)}" opacity="0.25" transform="translate(${(-rx * 0.15).toFixed(1)} ${(-ry * 0.15).toFixed(1)}) scale(0.6)" transform-origin="${x} ${cy}"/>`;
  return `<g>${g}</g>`;
}

/** Uma flor: caule a lápis, cinco pétalas num contorno só, miolo. O girassol tem dez pétalas e o miolo escuro. */
export function flor(x: number, y: number, cor: string, s = 10, girassol = false): string {
  const n = girassol ? 10 : 5;
  const cy = y - s * 1.6;
  const r = s * (girassol ? 0.55 : 0.42);
  const pr = s * (girassol ? 0.28 : 0.34);
  /* as pétalas como um contorno só: um arco para fora em cada pétala, um vinco entre elas */
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i * Math.PI * 2) / n - Math.PI / 2;
    const a1 = ((i + 1) * Math.PI * 2) / n - Math.PI / 2;
    const [px, py] = pol(x, cy, r - pr * 0.2, a0);
    const [qx, qy] = pol(x, cy, r - pr * 0.2, a1);
    const [mx, my] = pol(x, cy, r + pr, (a0 + a1) / 2);
    d += (i ? '' : `M${px.toFixed(1)} ${py.toFixed(1)}`) + `Q${mx.toFixed(1)} ${my.toFixed(1)} ${qx.toFixed(1)} ${qy.toFixed(1)}`;
  }
  d += 'z';
  return `<g>${fio(`M${x} ${y}V${(y - s * 1.4).toFixed(1)}`, C.musgoTinta, Math.max(1, s * 0.12), 0.85)}${forma(d, girassol ? '#e8c24a' : cor, { lapis: 0.32 })}${forma(circ([x, cy], s * (girassol ? 0.34 : 0.22)), girassol ? '#6b4a2a' : C.luz, { mudo: true })}</g>`;
}

/** A copa de uma árvore de folhas: um contorno ondulado, como uma nuvem verde. */
export function copa(cx: number, cy: number, rx: number, ry: number, cor: string, semente = 0): string {
  return forma(copaPath(cx, cy, rx, ry, 9, semente), cor, { op: 0.95, lapis: 0.3 });
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

/* ---------- os materiais da mesa da estação ---------- */

const COR_PEDRA = ['#b9b1a4', '#8f8a80', '#c9bfae', '#a89a86'];

/**
 * Uma pedra de rio, lisa, de tom natural (nada das pedrinhas coloridas do pote,
 * que são prêmio): quatro formatos, para a fileira dela não ficar toda igual.
 */
export function pedra(x: number, y: number, s: number, tipo = 0): string {
  const cor = COR_PEDRA[tipo % COR_PEDRA.length]!;
  const rx = s * (tipo === 1 ? 1.25 : tipo === 3 ? 0.8 : 1);
  const ry = s * (tipo === 1 ? 0.6 : tipo === 2 ? 0.95 : 0.75);
  const rot = tipo === 1 ? -14 : tipo === 3 ? 18 : 0;
  return (
    `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y + s * 0.12}" rx="${rx}" ry="${ry * 0.5}" fill="#000" opacity="0.08"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${cor}"/>` +
    `<ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.35}" rx="${rx * 0.36}" ry="${ry * 0.22}" fill="#fbf8f1" opacity="0.45"/></g>`
  );
}

/**
 * Um punhado de areia despejado na mesa: uma mancha macia, com uns grãos em volta.
 * Três formatos (redondo, alongado, um risquinho), para ela fazer caminho e chão.
 */
export function montinhoDeAreia(x: number, y: number, s: number, tipo = 0): string {
  const rx = s * (tipo === 1 ? 1.7 : tipo === 2 ? 2.2 : 1.1);
  const ry = s * (tipo === 2 ? 0.35 : 0.75);
  let graos = '';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + tipo;
    const gx = x + Math.cos(a) * rx * (1.05 + (i % 3) * 0.08);
    const gy = y + Math.sin(a) * ry * (1.1 + (i % 2) * 0.15);
    graos += `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${(s * 0.09).toFixed(1)}" fill="#d9c69a" opacity="0.8"/>`;
  }
  return (
    `<g><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#EEDDB4"/>` +
    `<ellipse cx="${x - rx * 0.15}" cy="${y - ry * 0.15}" rx="${rx * 0.55}" ry="${ry * 0.5}" fill="#f5e8c6" opacity="0.7"/>${graos}</g>`
  );
}

/**
 * Um tufo de barba de velho: fios cinza-esverdeados, finos e ondulados, que
 * caem de um emaranhado pequeno, como os que ficam pendurados nas árvores.
 * Três tufos diferentes, um mais cheio, um comprido, um mirradinho.
 */
export function barbaDeVelho(x: number, y: number, s: number, tipo = 0): string {
  const n = tipo === 0 ? 9 : tipo === 1 ? 7 : 5;
  const comp = s * (tipo === 1 ? 2.4 : tipo === 2 ? 1.3 : 1.7);
  let fios = '';
  for (let i = 0; i < n; i++) {
    const k = (i - (n - 1) / 2) / Math.max(1, n - 1);
    const x0 = x + k * s * 0.9;
    const onda = s * (0.25 + (i % 3) * 0.12);
    const y1 = y + comp * (0.3 + ((i * 0.37) % 0.2));
    const y2 = y + comp * (0.65 + ((i * 0.53) % 0.2));
    const fim = x0 + k * s * 0.6 + Math.sin(i * 3.3 + tipo) * s * 0.25;
    const yFim = y + comp * (0.8 + ((i * 0.71) % 0.25));
    const d = `M${x0.toFixed(1)} ${y.toFixed(1)}C${(x0 + onda).toFixed(1)} ${y1.toFixed(1)} ${(x0 - onda).toFixed(1)} ${y2.toFixed(1)} ${fim.toFixed(1)} ${yFim.toFixed(1)}`;
    fios += `<path d="${d}" fill="none" stroke="${i % 3 === 0 ? '#93a894' : i % 3 === 1 ? '#b3c2ae' : '#c7d2c2'}" stroke-width="${(s * (0.06 + (i % 2) * 0.03)).toFixed(2)}" stroke-linecap="round" opacity="0.9"/>`;
  }
  /* o emaranhado de cima: uns fios curtos cruzados, sem parecer uma cabeça */
  let no = '';
  for (let i = 0; i < 4; i++) {
    const a = x - s * 0.5 + i * s * 0.25;
    no += `<path d="M${a.toFixed(1)} ${(y + (i % 2) * s * 0.12).toFixed(1)}q${(s * 0.3).toFixed(1)} ${(-s * 0.2).toFixed(1)} ${(s * 0.6).toFixed(1)} 0" fill="none" stroke="${i % 2 ? '#a9baa5' : '#8fa590'}" stroke-width="${(s * 0.09).toFixed(2)}" stroke-linecap="round"/>`;
  }
  return `<g>${fios}${no}</g>`;
}
