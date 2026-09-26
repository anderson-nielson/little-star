/**
 * A marionete vetorial do Ponta, em SVG: membros afilados (trapézio com
 * círculo nas pontas), rosto econômico (olhos em arco fino, boca em fio),
 * cabelo em poucos paths. Proporções por idade: a criança tem cabeça maior e
 * pernas curtas. Tudo por dados de cor: trocar roupa é trocar variável.
 */
export type Ponto = [number, number];
export type Pose = 'parado' | 'acena' | 'sentado' | 'pulo' | 'aponta' | 'segura' | 'giro' | 'reverencia' | 'deitado' | 'abraca' | 'balanco' | 'palma';
export type Cabelo = 'liso' | 'cacheado' | 'cachinhos' | 'coque' | 'curto' | 'rabo' | 'entradas' | 'testa-alta';
export type Barba = 'baixa' | 'leve' | 'cheia';
export type Oculos = 'oval' | 'redondo' | 'fino';
/* os óculos não têm hastes: de frente, a haste saindo da cabeça parecia um brinco */

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
  cabeloTipo: Cabelo;
  roupa: string;
  vestido?: boolean;
  calca?: string;
  tutu?: string;
  sapato?: string;
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
}

export interface Desenho {
  svg: string;
  maoL: Ponto;
  maoR: Ponto;
  cabeca: Ponto;
  raioCabeca: number;
}

export const CORES = {
  peleStella: '#F2D5BC',
  peleMae: '#F0D2B6',
  pelePai: '#EACBB0',
  cabeloStella: '#e2c27a',
  cabeloTheo: '#c9a86a',
  cabeloMae: '#4a3222',
  cabeloPai: '#b08a5e',
  barbaPai: '#9a7548',
  rosaDoce: '#f2a9c4',
  rosaClara: '#f6e3dc',
  rosa: '#ebcdc3',
  veludo: '#6e1a27',
  tinta: '#1a1c2b',
  luz: '#ebd9a8',
  ouro: '#c6a15b',
  musgoTinta: '#4f6b3a',
  mata2: '#35564d',
  azul: '#7FA5B8',
  madeira: '#c9a189',
  papel: '#fbf8f1',
  marfim: '#f6f0e4',
};

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

export function boneco(o: Figura): Desenho {
  const { x, y, h, pele, cabelo, roupa } = o;
  const dir = o.dir ?? 1;
  const pose = o.pose ?? 'parado';
  const crianca = !!o.crianca;
  const hr = h * (crianca ? 0.115 : 0.085);
  const lg = h * (crianca ? 0.34 : 0.42);
  const forte = o.forte ?? 1;
  const sw = h * (crianca ? 0.17 : 0.16) * forte;
  const w = (crianca ? 1.15 : 1) * forte;
  const esc = h / 100;
  const L = {
    coxa: [3.6 * w * esc, 2.6 * w * esc],
    perna: [2.5 * w * esc, 1.6 * w * esc],
    braco: [2.1 * w * esc, 1.6 * w * esc],
    ante: [1.6 * w * esc, 1.2 * w * esc],
  };
  /* no balanço: sentada, segurando as cordas para cima, pernas para a frente */
  const balanco = pose === 'balanco';
  const sentado = pose === 'sentado' || balanco;
  const pulo = pose === 'pulo' || pose === 'giro';
  const reverencia = pose === 'reverencia';
  const deitado = pose === 'deitado';
  const tor = h - lg - 2 * hr - 0.03 * h;
  let hipY: number;
  if (sentado) hipY = y - lg * 0.45;
  else if (pulo) hipY = y - lg - h * 0.12;
  else if (deitado) hipY = y - h * 0.12;
  else hipY = y - lg;
  const shY = reverencia ? hipY - tor * 0.55 : hipY - tor;
  const cabeca: Ponto = reverencia ? [x + dir * tor * 0.55, shY - hr * 0.6] : [x + dir * 0.01 * h, shY - 0.025 * h - hr];
  const sL: Ponto = [x - sw / 2, shY];
  const sR: Ponto = [x + sw / 2, shY];

  /* pernas */
  const legs: [Ponto, Ponto, Ponto, Ponto][] = [];
  if (balanco) {
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
  } else if (deitado) {
    legs.push([[x - 0.02 * h, hipY], [x - 0.22 * h, hipY + 0.02 * h], [x - 0.4 * h, hipY + 0.03 * h], [x - 0.44 * h, hipY - 0.02 * h]]);
    legs.push([[x + 0.02 * h, hipY + 0.03 * h], [x - 0.2 * h, hipY + 0.05 * h], [x - 0.38 * h, hipY + 0.06 * h], [x - 0.42 * h, hipY + 0.01 * h]]);
  } else {
    legs.push([[x - 0.04 * h, hipY + 0.02 * h], [x - 0.05 * h, hipY + lg * 0.52], [x - 0.06 * h, y - 0.02 * h], [x - 0.06 * h + dir * 0.06 * h, y]]);
    legs.push([[x + 0.04 * h, hipY + 0.02 * h], [x + 0.05 * h, hipY + lg * 0.52], [x + 0.06 * h, y - 0.02 * h], [x + 0.06 * h + dir * 0.06 * h, y]]);
  }
  let pernas = '';
  let pes = '';
  for (const [hq, k, a, t] of legs) {
    pernas += limb(hq, k, L.coxa[0]!, L.coxa[1]!) + limb(k, a, L.perna[0]!, L.perna[1]!);
    pes += limb(a, t, L.perna[1]!, L.perna[1]! * 0.6);
  }

  /* roupa */
  /* o vestido pende de alças finas; a camiseta cobre os ombros */
  const camiseta = !o.vestido && !o.pano;
  const tl: Ponto = camiseta ? [sL[0] - 0.5 * esc, sL[1] - 2 * esc] : [sL[0] + 2 * esc, sL[1] + 3 * esc];
  const tr: Ponto = camiseta ? [sR[0] + 0.5 * esc, sR[1] - 2 * esc] : [sR[0] - 2 * esc, sR[1] + 3 * esc];
  let roupaPath = '';
  if (o.vestido) {
    const baixo = sentado ? hipY + 0.06 * h : deitado ? hipY + 0.1 * h : hipY + 0.16 * h;
    const lv = crianca ? 0.2 * h : 0.14 * h;
    roupaPath = `<path d="M${tl}L${tr}L${x + lv} ${baixo}Q${x} ${baixo + 0.02 * h} ${x - lv} ${baixo}z" fill="${roupa}"/>`;
  } else {
    /* a camiseta: cai reta dos ombros, um pouco mais larga na bainha */
    const lw = Math.max(0.08 * h, (sw / 2 - 1.5 * esc) * 1.1);
    roupaPath = `<path d="M${tl}L${tr}Q${x + lw * 0.92} ${hipY - 0.1 * h} ${x + lw} ${hipY + 0.03 * h}L${x - lw} ${hipY + 0.03 * h}Q${x - lw * 0.92} ${hipY - 0.1 * h} ${tl}z" fill="${roupa}"/>`;
    if (o.calca && !sentado && !pulo)
      roupaPath += `<path d="M${x - lw * 0.98} ${hipY}L${x + lw * 0.98} ${hipY}L${x + lw * 0.88} ${hipY + lg * 0.55}L${x + 0.01 * h} ${hipY + lg * 0.55}L${x} ${hipY + 0.1 * h}L${x - 0.01 * h} ${hipY + lg * 0.55}L${x - lw * 0.88} ${hipY + lg * 0.55}z" fill="${o.calca}"/>`;
  }
  const tutu = o.tutu ? `<ellipse cx="${x}" cy="${hipY + 0.02 * h}" rx="${0.2 * h}" ry="${0.06 * h}" fill="${o.tutu}" opacity="0.92"/>` : '';

  /* braços */
  const braco = (s: Ponto, a1: number, a2: number) => {
    const la = 0.17 * h;
    const lb = 0.15 * h;
    const e: Ponto = [s[0] + Math.cos(a1) * la, s[1] + Math.sin(a1) * la];
    const wri: Ponto = [e[0] + Math.cos(a2) * lb, e[1] + Math.sin(a2) * lb];
    const m: Ponto = [s[0] + Math.cos(a1) * la * 0.36, s[1] + Math.sin(a1) * la * 0.36];
    const manga = o.vestido || o.pano ? '' : limb(s, m, L.braco[0]! * 1.3, L.braco[0]! * 1.15);
    return { d: limb(s, e, L.braco[0]!, L.braco[1]!) + limb(e, wri, L.ante[0]!, L.ante[1]!), manga, w: wri };
  };
  const PI = Math.PI;
  let bL: { d: string; manga: string; w: Ponto };
  let bR: { d: string; manga: string; w: Ponto };
  switch (pose) {
    case 'acena':
      bL = braco(sL, PI * 0.42, PI * 0.35);
      bR = braco(sR, -PI * 0.62, -PI * 0.5);
      break;
    case 'pulo':
      bL = braco(sL, -PI * 0.72, -PI * 0.6);
      bR = braco(sR, -PI * 0.28, -PI * 0.4);
      break;
    case 'giro':
      bL = braco(sL, -PI * 0.85, -PI * 0.7);
      bR = braco(sR, -PI * 0.15, -PI * 0.3);
      break;
    case 'sentado':
      bL = braco(sL, PI * 0.45, PI * 0.05 * dir);
      bR = braco(sR, PI * 0.42, PI * 0.08 * dir);
      break;
    case 'aponta':
      bL = braco(sL, PI * 0.45, PI * 0.45);
      bR = braco(sR, dir > 0 ? -PI * 0.1 : PI * 1.1, dir > 0 ? -PI * 0.05 : PI * 1.05);
      break;
    case 'balanco':
      bL = braco(sL, -PI * 0.5, -PI * 0.5);
      bR = braco(sR, -PI * 0.5, -PI * 0.5);
      break;
    case 'palma':
      bL = braco(sL, PI * 0.2, -PI * 0.35);
      bR = braco(sR, PI * 0.8, -PI * 0.65);
      break;
    case 'segura':
      bL = braco(sL, PI * 0.4, -PI * 0.15);
      bR = braco(sR, PI * 0.4, PI * 1.15);
      break;
    case 'abraca':
      bL = braco(sL, PI * 0.15, -PI * 0.1);
      bR = braco(sR, PI * 0.85, PI * 1.1);
      break;
    case 'reverencia':
      bL = braco(sL, PI * 0.35, PI * 0.5);
      bR = braco(sR, PI * 0.5, PI * 0.5);
      break;
    case 'deitado':
      bL = braco(sL, -PI * 0.55, -PI * 0.5);
      bR = braco(sR, PI * 0.95, PI * 0.9);
      break;
    default:
      bL = braco(sL, PI * 0.44, PI * 0.4);
      bR = braco(sR, PI * 0.56, PI * 0.6);
  }
  const pescoco = limb([x, shY], [cabeca[0], cabeca[1] + hr * 0.6], 1.5 * esc, 1.4 * esc);
  const ombros = limb(sL, sR, 2.2 * esc, 2.2 * esc);

  /* cabelo */
  const [hx, hy] = cabeca;
  let cabeloAtras = '';
  let cabeloFrente = '';
  const franja = `<path d="M${hx - hr * 1.02} ${hy - hr * 0.05}A${hr * 1.02} ${hr * 1.02} 0 0 1 ${hx + hr * 1.02} ${hy - hr * 0.05}Q${hx} ${hy - hr * 0.6} ${hx - hr * 1.02} ${hy - hr * 0.05}z" fill="${cabelo}"/>`;
  if (o.gorro) {
    cabeloFrente = `<path d="M${hx - hr * 1.05} ${hy}A${hr * 1.05} ${hr * 1.05} 0 0 1 ${hx + hr * 1.05} ${hy}z" fill="${o.gorro}"/>`;
  } else if (o.cabeloTipo === 'liso') {
    cabeloAtras = `<path d="M${hx - hr * 1.05} ${hy - hr * 0.2}Q${hx - hr * 1.15} ${hy + hr * 2.1} ${hx - hr * 0.7} ${hy + hr * 2.2}L${hx + hr * 0.7} ${hy + hr * 2.2}Q${hx + hr * 1.15} ${hy + hr * 2.1} ${hx + hr * 1.05} ${hy - hr * 0.2}z" fill="${cabelo}"/>`;
    cabeloFrente = `<path d="M${hx - hr * 1.05} ${hy - hr * 0.1}A${hr * 1.05} ${hr * 1.05} 0 0 1 ${hx + hr * 1.05} ${hy - hr * 0.1}Q${hx + hr * 0.6} ${hy - hr * 0.55} ${hx} ${hy - hr * 0.2}Q${hx - hr * 0.7} ${hy - hr * 0.6} ${hx - hr * 1.05} ${hy - hr * 0.1}z" fill="${cabelo}"/>`;
  } else if (o.cabeloTipo === 'cacheado') {
    let c = '';
    for (let i = 0; i < 11; i++) {
      const an = PI * (1 + i / 10);
      c += circ([hx + Math.cos(an) * hr * 0.95, hy + Math.sin(an) * hr * 0.95], hr * 0.42);
    }
    c += circ([hx - hr * 1.15, hy + hr * 0.35], hr * 0.36) + circ([hx + hr * 1.15, hy + hr * 0.35], hr * 0.36);
    cabeloFrente = `<path d="${c}" fill="${cabelo}"/>`;
  } else if (o.cabeloTipo === 'cachinhos') {
    /* cabelo curto e cacheado de menino: cachos só na metade de cima, sem cair nas laterais */
    let c = '';
    for (let i = 0; i <= 8; i++) {
      const an = PI * (1.06 + (0.88 * i) / 8);
      c += circ([hx + Math.cos(an) * hr * 0.86, hy + Math.sin(an) * hr * 0.86], hr * 0.33);
    }
    for (let i = 0; i <= 5; i++) {
      const an = PI * (1.15 + (0.7 * i) / 5);
      c += circ([hx + Math.cos(an) * hr * 0.5, hy + Math.sin(an) * hr * 0.5], hr * 0.34);
    }
    cabeloFrente = `<path d="${c}" fill="${cabelo}"/>`;
  } else if (o.cabeloTipo === 'coque') {
    cabeloFrente = franja + `<path d="${circ([hx + dir * hr * 0.5, hy - hr * 1.05], hr * 0.42)}" fill="${cabelo}"/>`;
  } else if (o.cabeloTipo === 'rabo') {
    cabeloAtras = `<path d="${circ([hx - dir * hr * 0.9, hy + hr * 0.9], hr * 0.5)}" fill="${cabelo}"/>`;
    cabeloFrente = franja;
  } else if (o.cabeloTipo === 'entradas' || o.cabeloTipo === 'testa-alta') {
    /* cabelo curto de homem: cobre os lados até a altura da orelha e a linha da testa fecha por cima */
    const P = (x: number, y: number) => `${f(hx + x * hr)} ${f(hy + y * hr)}`;
    const R = 1.07;
    const a0 = PI - Math.asin(0.18 / R);
    let d = '';
    for (let i = 0; i <= 24; i++) {
      const an = a0 + ((3 * PI - 2 * a0) * i) / 24;
      d += (i ? 'L' : 'M') + P(Math.cos(an) * R, Math.sin(an) * R);
    }
    d +=
      o.cabeloTipo === 'entradas'
        ? /* as entradas: sobe nas têmporas, desce no meio da testa */
          `Q${P(0.98, -0.3)} ${P(0.7, -0.58)}Q${P(0.5, -0.76)} ${P(0.34, -0.6)}Q${P(0.18, -0.42)} ${P(0, -0.42)}Q${P(-0.18, -0.42)} ${P(-0.34, -0.6)}Q${P(-0.5, -0.76)} ${P(-0.7, -0.58)}Q${P(-0.98, -0.3)} ${P(-R, 0.18)}z`
        : /* a testa alta: a linha do cabelo é uma curva só, bem em cima */
          `Q${P(0.98, -0.35)} ${P(0.62, -0.68)}Q${P(0, -0.86)} ${P(-0.62, -0.68)}Q${P(-0.98, -0.35)} ${P(-R, 0.18)}z`;
    cabeloFrente = `<path d="${d}" fill="${cabelo}"/>`;
  } else {
    cabeloFrente = franja;
  }
  /* barba baixa: uma faixa que segue o queixo, abaixo da boca */
  let barba = '';
  if (o.barba) {
    const estilo = o.barbaEstilo ?? 'baixa';
    /* de onde a barba começa nas laterais (fração de pi) e até onde sobe por dentro */
    const inicio = estilo === 'cheia' ? 0.0 : 0.08;
    const interna = estilo === 'cheia' ? 0.42 : 0.6;
    const pts: string[] = [];
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (inicio + ((1 - 2 * inicio) * i) / n);
      pts.push(`${f(hx + Math.cos(a) * hr * 1.04)} ${f(hy + Math.sin(a) * hr * 1.04)}`);
    }
    for (let i = n; i >= 0; i--) {
      const a = Math.PI * (inicio + ((1 - 2 * inicio) * i) / n);
      pts.push(`${f(hx + Math.cos(a) * hr * 1.04)} ${f(Math.max(hy + hr * interna, hy + Math.sin(a) * hr * interna))}`);
    }
    barba = `<path d="M${pts.join('L')}z" fill="${o.barba}" opacity="${estilo === 'leve' ? 0.45 : 0.95}"/>`;
  }

  /* rosto */
  const olhoY = hy + hr * 0.1;
  const ox = hr * 0.35;
  const rosto = o.pano
    ? `<circle cx="${hx - ox}" cy="${olhoY}" r="${hr * 0.08}" fill="${CORES.tinta}" opacity="0.7"/><circle cx="${hx + ox}" cy="${olhoY}" r="${hr * 0.08}" fill="${CORES.tinta}" opacity="0.7"/><path d="M${hx - hr * 0.18} ${hy + hr * 0.5}h${hr * 0.36}" stroke="${CORES.veludo}" stroke-width="${Math.max(0.8, hr * 0.07)}" stroke-linecap="round" opacity="0.6"/>`
    : `<path d="M${hx - ox - hr * 0.14} ${olhoY}q${hr * 0.14} ${-hr * 0.16} ${hr * 0.28} 0M${hx + ox - hr * 0.14} ${olhoY}q${hr * 0.14} ${-hr * 0.16} ${hr * 0.28} 0" fill="none" stroke="${CORES.tinta}" stroke-width="${Math.max(0.9, hr * 0.09)}" stroke-linecap="round" opacity="0.75"/>` +
      `<path d="M${hx - hr * 0.22} ${hy + hr * 0.5}q${hr * 0.22} ${hr * 0.18} ${hr * 0.44} 0" fill="none" stroke="${CORES.veludo}" stroke-width="${Math.max(0.8, hr * 0.07)}" stroke-linecap="round" opacity="0.7"/>` +
      (crianca
        ? `<circle cx="${hx - hr * 0.55}" cy="${hy + hr * 0.42}" r="${hr * 0.14}" fill="${CORES.rosaDoce}" opacity="0.5"/><circle cx="${hx + hr * 0.55}" cy="${hy + hr * 0.42}" r="${hr * 0.14}" fill="${CORES.rosaDoce}" opacity="0.5"/>`
        : '');

  /* óculos ovais, por cima dos olhos */
  let oculos = '';
  if (o.oculos) {
    const estilo: Oculos = o.oculos === true ? 'oval' : o.oculos;
    const rx = estilo === 'redondo' ? hr * 0.27 : hr * 0.3;
    const ry = estilo === 'redondo' ? hr * 0.27 : hr * 0.22;
    const w = Math.max(0.8, hr * (estilo === 'fino' ? 0.05 : 0.075));
    const cy = olhoY - hr * 0.02;
    oculos = `<g fill="none" stroke="${CORES.tinta}" stroke-width="${w}" opacity="0.7"><ellipse cx="${hx - ox}" cy="${cy}" rx="${rx}" ry="${ry}"/><ellipse cx="${hx + ox}" cy="${cy}" rx="${rx}" ry="${ry}"/><path d="M${hx - ox + rx} ${cy - hr * 0.03}h${(ox - rx) * 2}"/></g>`;
  }
  const contorno = o.contorno ? `stroke="${o.contorno}" stroke-width="1" stroke-linejoin="round"` : '';
  const sapato = o.sapato ?? pele;
  const svg =
    `<g><g class="cabelo-atras">${cabeloAtras}</g>` +
    `<path d="${pernas}" fill="${pele}" ${contorno}/>` +
    `<path d="${pes}" fill="${sapato}"/>` +
    tutu +
    `<path d="${bL.d}" fill="${pele}" ${contorno}/>` +
    (bL.manga ? `<path d="${bL.manga}" fill="${roupa}"/>` : '') +
    `<path d="${ombros}" fill="${pele}"/>` +
    roupaPath +
    `<path d="${pescoco}" fill="${pele}"/>` +
    `<path d="${bR.d}" fill="${pele}" ${contorno}/>` +
    (bR.manga ? `<path d="${bR.manga}" fill="${roupa}"/>` : '') +
    `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(hr)}" fill="${pele}" ${contorno}/>` +
    barba +
    cabeloFrente +
    rosto +
    oculos +
    `</g>`;
  return { svg, maoL: bL.w, maoR: bR.w, cabeca, raioCabeca: hr };
}

/* ---------- a família ---------- */

type Extra = Partial<Figura>;
const C = CORES;

export const familia = {
  /** Stella em casa: vestido rosa. No palco, `tutu` e coque. */
  stella: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleStella, cabelo: C.cabeloStella, roupa: C.rosaDoce, cabeloTipo: 'liso', vestido: true, sapato: '#EFB9CE', ...extra }),
  stellaPalco: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleStella, cabelo: C.cabeloStella, roupa: C.rosaDoce, cabeloTipo: 'coque', tutu: '#F7C3D8', sapato: '#EFB9CE', contorno: C.luz, ...extra }),
  theo: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, crianca: true, pele: C.peleStella, cabelo: C.cabeloTheo, roupa: C.azul, calca: C.musgoTinta, cabeloTipo: 'cachinhos', forte: 1.35, sapato: C.musgoTinta, ...extra }),
  mae: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.peleMae, cabelo: C.cabeloMae, roupa: '#D9B4A6', cabeloTipo: 'liso', vestido: true, sapato: C.madeira, ...extra }),
  pai: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.pelePai, cabelo: C.cabeloPai, roupa: C.mata2, calca: '#3f3a4a', cabeloTipo: 'testa-alta', oculos: 'fino', barba: C.barbaPai, barbaEstilo: 'cheia', forte: 1.18, sapato: '#3f3a4a', ...extra }),
  /** bonecas Waldorf de pano: rosto quase liso */
  boneca: (x: number, y: number, h: number, i: number, extra: Extra = {}): Desenho => {
    const roupas = [C.rosaDoce, C.luz, C.azul, '#D9B4A6', '#a58bc4'];
    const cabelos = ['#e2c27a', '#5a3a2a', '#17110F', '#c9a05f', '#d97f74'];
    const tipos: Cabelo[] = ['coque', 'liso', 'cacheado', 'rabo', 'curto'];
    return boneco({ x, y, h, pose: 'parado', crianca: true, pano: true, pele: '#F3DCC8', cabelo: cabelos[i % 5]!, roupa: roupas[i % 5]!, cabeloTipo: tipos[i % 5]!, vestido: true, ...extra });
  },
};

/** O figurino escolhido para uma boneca vira cores da marionete; sem figurino, nada muda. */
export function figurinoDe(f: { roupa: string; cabelo: string; gorro: string } | undefined): Extra {
  if (!f) return {};
  const x: Extra = { roupa: f.roupa, cabelo: f.cabelo };
  if (f.gorro && f.gorro !== 'nenhum') x.gorro = f.gorro;
  return x;
}

/** As opções de pai para a família escolher (?styleguide=pai). */
export const OPCOES_DE_PAI: Record<string, { rotulo: string; extra: Extra }> = {
  A: { rotulo: 'A. Entradas, barba baixa, óculos ovais', extra: { cabeloTipo: 'entradas', cabelo: '#a67c52', barba: '#a67c52', barbaEstilo: 'baixa', oculos: 'oval' } },
  B: { rotulo: 'B. Entradas, barba por fazer, óculos redondos', extra: { cabeloTipo: 'entradas', cabelo: '#8f6a45', barba: '#8f6a45', barbaEstilo: 'leve', oculos: 'redondo' } },
  C: { rotulo: 'C. Testa alta, barba cheia, óculos finos (o escolhido)', extra: { cabeloTipo: 'testa-alta', cabelo: '#b08a5e', barba: '#9a7548', barbaEstilo: 'cheia', oculos: 'fino' } },
};

/** Proporções decididas: Stella 1, Theo 1,5, pais 2. */
export const ALTURAS = { stella: 1, theo: 1.5, mae: 2, pai: 2.1 };
