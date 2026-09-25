/**
 * A marionete vetorial do Ponta, em SVG: membros afilados (trapézio com
 * círculo nas pontas), rosto econômico (olhos em arco fino, boca em fio),
 * cabelo em poucos paths. Proporções por idade: a criança tem cabeça maior e
 * pernas curtas. Tudo por dados de cor: trocar roupa é trocar variável.
 */
export type Ponto = [number, number];
export type Pose = 'parado' | 'acena' | 'sentado' | 'pulo' | 'aponta' | 'segura' | 'giro' | 'reverencia' | 'deitado' | 'abraca';
export type Cabelo = 'liso' | 'cacheado' | 'coque' | 'curto' | 'rabo' | 'entradas';

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
  /** óculos ovais */
  oculos?: boolean;
  /** barba baixa, na cor dada */
  barba?: string;
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
  cabeloTheo: '#d8bf8a',
  cabeloMae: '#4a3222',
  cabeloPai: '#a67c52',
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
  const sw = h * (crianca ? 0.17 : 0.16);
  const w = crianca ? 1.15 : 1;
  const esc = h / 100;
  const L = {
    coxa: [3.6 * w * esc, 2.6 * w * esc],
    perna: [2.5 * w * esc, 1.6 * w * esc],
    braco: [2.1 * w * esc, 1.6 * w * esc],
    ante: [1.6 * w * esc, 1.2 * w * esc],
  };
  const sentado = pose === 'sentado';
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
  if (sentado) {
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
  const tl: Ponto = [sL[0] + 2 * esc, sL[1] + 3 * esc];
  const tr: Ponto = [sR[0] - 2 * esc, sR[1] + 3 * esc];
  let roupaPath = '';
  if (o.vestido) {
    const baixo = sentado ? hipY + 0.06 * h : deitado ? hipY + 0.1 * h : hipY + 0.16 * h;
    const lv = crianca ? 0.2 * h : 0.14 * h;
    roupaPath = `<path d="M${tl}L${tr}L${x + lv} ${baixo}Q${x} ${baixo + 0.02 * h} ${x - lv} ${baixo}z" fill="${roupa}"/>`;
  } else {
    roupaPath = `<path d="M${tl}L${tr}Q${x + 0.06 * h} ${hipY - 0.1 * h} ${x + 0.08 * h} ${hipY + 0.03 * h}L${x - 0.08 * h} ${hipY + 0.03 * h}Q${x - 0.06 * h} ${hipY - 0.1 * h} ${tl}z" fill="${roupa}"/>`;
    if (o.calca && !sentado && !pulo)
      roupaPath += `<path d="M${x - 0.085 * h} ${hipY}L${x + 0.085 * h} ${hipY}L${x + 0.075 * h} ${hipY + lg * 0.55}L${x + 0.01 * h} ${hipY + lg * 0.55}L${x} ${hipY + 0.1 * h}L${x - 0.01 * h} ${hipY + lg * 0.55}L${x - 0.075 * h} ${hipY + lg * 0.55}z" fill="${o.calca}"/>`;
  }
  const tutu = o.tutu ? `<ellipse cx="${x}" cy="${hipY + 0.02 * h}" rx="${0.2 * h}" ry="${0.06 * h}" fill="${o.tutu}" opacity="0.92"/>` : '';

  /* braços */
  const braco = (s: Ponto, a1: number, a2: number) => {
    const la = 0.17 * h;
    const lb = 0.15 * h;
    const e: Ponto = [s[0] + Math.cos(a1) * la, s[1] + Math.sin(a1) * la];
    const wri: Ponto = [e[0] + Math.cos(a2) * lb, e[1] + Math.sin(a2) * lb];
    return { d: limb(s, e, L.braco[0]!, L.braco[1]!) + limb(e, wri, L.ante[0]!, L.ante[1]!), w: wri };
  };
  const PI = Math.PI;
  let bL: { d: string; w: Ponto };
  let bR: { d: string; w: Ponto };
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
  } else if (o.cabeloTipo === 'coque') {
    cabeloFrente = franja + `<path d="${circ([hx + dir * hr * 0.5, hy - hr * 1.05], hr * 0.42)}" fill="${cabelo}"/>`;
  } else if (o.cabeloTipo === 'rabo') {
    cabeloAtras = `<path d="${circ([hx - dir * hr * 0.9, hy + hr * 0.9], hr * 0.5)}" fill="${cabelo}"/>`;
    cabeloFrente = franja;
  } else if (o.cabeloTipo === 'entradas') {
    /* cabelo curto com entradas na testa: o gorro de cabelo e duas curvas de pele nas têmporas */
    cabeloFrente =
      `<path d="M${hx - hr * 1.02} ${hy - hr * 0.05}A${hr * 1.02} ${hr * 1.02} 0 0 1 ${hx + hr * 1.02} ${hy - hr * 0.05}Q${hx} ${hy - hr * 0.5} ${hx - hr * 1.02} ${hy - hr * 0.05}z" fill="${cabelo}"/>` +
      `<ellipse cx="${hx - hr * 0.48}" cy="${hy - hr * 0.6}" rx="${hr * 0.27}" ry="${hr * 0.2}" fill="${pele}"/><ellipse cx="${hx + hr * 0.48}" cy="${hy - hr * 0.6}" rx="${hr * 0.27}" ry="${hr * 0.2}" fill="${pele}"/>`;
  } else {
    cabeloFrente = franja;
  }
  /* barba baixa: uma faixa que segue o queixo, abaixo da boca */
  let barba = '';
  if (o.barba) {
    const pts: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (0.08 + (0.84 * i) / 16);
      pts.push(`${f(hx + Math.cos(a) * hr * 1.03)} ${f(hy + Math.sin(a) * hr * 1.03)}`);
    }
    for (let i = 16; i >= 0; i--) {
      const a = Math.PI * (0.08 + (0.84 * i) / 16);
      pts.push(`${f(hx + Math.cos(a) * hr * 1.03)} ${f(Math.max(hy + hr * 0.6, hy + Math.sin(a) * hr * 0.6))}`);
    }
    barba = `<path d="M${pts.join('L')}z" fill="${o.barba}" opacity="0.9"/>`;
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
  const oculos = o.oculos
    ? `<g fill="none" stroke="${CORES.tinta}" stroke-width="${Math.max(0.9, hr * 0.08)}" opacity="0.7"><ellipse cx="${hx - ox}" cy="${olhoY - hr * 0.02}" rx="${hr * 0.3}" ry="${hr * 0.24}"/><ellipse cx="${hx + ox}" cy="${olhoY - hr * 0.02}" rx="${hr * 0.3}" ry="${hr * 0.24}"/><path d="M${hx - ox + hr * 0.3} ${olhoY - hr * 0.04}h${(ox - hr * 0.3) * 2}"/></g>`
    : '';
  const contorno = o.contorno ? `stroke="${o.contorno}" stroke-width="1" stroke-linejoin="round"` : '';
  const sapato = o.sapato ?? pele;
  const svg =
    `<g>${cabeloAtras}` +
    `<path d="${pernas}" fill="${pele}" ${contorno}/>` +
    `<path d="${pes}" fill="${sapato}"/>` +
    tutu +
    `<path d="${bL.d}" fill="${pele}" ${contorno}/>` +
    roupaPath +
    `<path d="${ombros}${pescoco}" fill="${pele}"/>` +
    `<path d="${bR.d}" fill="${pele}" ${contorno}/>` +
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
    boneco({ x, y, h, pose, crianca: true, pele: C.peleStella, cabelo: C.cabeloTheo, roupa: C.azul, calca: C.musgoTinta, cabeloTipo: 'cacheado', sapato: C.musgoTinta, ...extra }),
  mae: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.peleMae, cabelo: C.cabeloMae, roupa: '#D9B4A6', cabeloTipo: 'liso', vestido: true, sapato: C.madeira, ...extra }),
  pai: (x: number, y: number, h: number, pose: Pose = 'parado', extra: Extra = {}): Desenho =>
    boneco({ x, y, h, pose, pele: C.pelePai, cabelo: C.cabeloPai, roupa: C.mata2, calca: '#3f3a4a', cabeloTipo: 'entradas', oculos: true, barba: C.cabeloPai, sapato: '#3f3a4a', ...extra }),
  /** bonecas Waldorf de pano: rosto quase liso */
  boneca: (x: number, y: number, h: number, i: number, extra: Extra = {}): Desenho => {
    const roupas = [C.rosaDoce, C.luz, C.azul, '#D9B4A6', '#a58bc4'];
    const cabelos = ['#e2c27a', '#5a3a2a', '#17110F', '#c9a05f', '#d97f74'];
    const tipos: Cabelo[] = ['coque', 'liso', 'cacheado', 'rabo', 'curto'];
    return boneco({ x, y, h, pose: 'parado', crianca: true, pano: true, pele: '#F3DCC8', cabelo: cabelos[i % 5]!, roupa: roupas[i % 5]!, cabeloTipo: tipos[i % 5]!, vestido: true, ...extra });
  },
};

/** Proporções decididas: Stella 1, Theo 1,5, pais 2. */
export const ALTURAS = { stella: 1, theo: 1.5, mae: 2, pai: 2.1 };
