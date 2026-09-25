import { circ, CORES as C } from './boneco';
import nomes from '@/data/figuras-nomes.json';

/**
 * As figuras das palavras e das comidas, numa caixa de 100 x 100, em poucas
 * formas sem contorno preto. Cada uma é uma função para caber no estilo do
 * jogo (véu, forma redonda, cores dos tokens).
 */
const V = '#D2463C';
const LAR = '#e8a24a';
const AMA = '#ebd9a8';
const VER = '#4f6b3a';
const VERC = '#8fae6b';
const ROX = '#8a5aa8';
const MAR = '#c48f5a';
const PELE = '#F2D5BC';
const CINZA = '#b6a58c';
const AZUL = '#7FA5B8';
const AGUA = '#9fc3cf';

const F: Record<string, string> = {
  asa: `<path d="M50 60Q20 20 8 40Q20 44 30 60Q45 55 50 60z" fill="${C.papel}" stroke="${C.ouro}"/><path d="M50 60Q80 20 92 40Q80 44 70 60Q55 55 50 60z" fill="${C.papel}" stroke="${C.ouro}"/><circle cx="50" cy="62" r="6" fill="${C.ouro}"/>`,
  abelha: `<ellipse cx="50" cy="58" rx="24" ry="16" fill="${AMA}"/><path d="M38 44v28M50 42v32M62 44v28" stroke="${C.tinta}" stroke-width="5" opacity="0.7"/><ellipse cx="40" cy="36" rx="14" ry="9" fill="${C.papel}" opacity="0.8"/><ellipse cx="62" cy="36" rx="14" ry="9" fill="${C.papel}" opacity="0.8"/><circle cx="76" cy="56" r="9" fill="${C.tinta}" opacity="0.7"/>`,
  arvore: `<rect x="44" y="60" width="12" height="30" fill="${C.madeira}"/><circle cx="50" cy="42" r="26" fill="${VERC}"/><circle cx="34" cy="52" r="16" fill="${VER}" opacity="0.6"/><circle cx="66" cy="50" r="16" fill="${VER}" opacity="0.6"/>`,
  ela: `<circle cx="50" cy="30" r="14" fill="${PELE}"/><path d="M36 26q14 -18 28 0v20h-28z" fill="#e2c27a"/><path d="M38 46h24l8 40H30z" fill="${C.rosaDoce}"/>`,
  elefante: `<ellipse cx="55" cy="55" rx="30" ry="24" fill="${CINZA}"/><circle cx="28" cy="46" r="16" fill="${CINZA}"/><path d="M18 52q-10 20 4 34" stroke="${CINZA}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="24" cy="44" r="2.5" fill="${C.tinta}" opacity="0.7"/><rect x="40" y="72" width="8" height="16" fill="${CINZA}"/><rect x="64" y="72" width="8" height="16" fill="${CINZA}"/>`,
  egua: `<ellipse cx="52" cy="56" rx="28" ry="16" fill="${MAR}"/><path d="M74 50l14 -22l8 4l-6 26z" fill="${MAR}"/><rect x="32" y="66" width="7" height="22" fill="${MAR}"/><rect x="62" y="66" width="7" height="22" fill="${MAR}"/><path d="M26 54q-10 6 -6 18" stroke="${C.tinta}" stroke-width="4" fill="none" opacity="0.6"/>`,
  ovo: `<path d="M50 14c18 0 30 24 30 44a30 30 0 0 1-60 0c0-20 12-44 30-44z" fill="${C.papel}" stroke="${C.ouro}"/>`,
  olho: `<path d="M8 50q42 -40 84 0q-42 40 -84 0z" fill="${C.papel}" stroke="${C.ouro}"/><circle cx="50" cy="50" r="16" fill="${AZUL}"/><circle cx="50" cy="50" r="7" fill="${C.tinta}"/>`,
  onda: `<path d="M4 60q12 -24 24 0t24 0t24 0t24 0v30H4z" fill="${AGUA}"/><path d="M4 60q12 -24 24 0t24 0t24 0t24 0" fill="none" stroke="${C.papel}" stroke-width="4"/>`,
  sapo: `<ellipse cx="50" cy="60" rx="30" ry="22" fill="${VERC}"/><circle cx="36" cy="38" r="10" fill="${VERC}"/><circle cx="64" cy="38" r="10" fill="${VERC}"/><circle cx="36" cy="38" r="4" fill="${C.tinta}" opacity="0.7"/><circle cx="64" cy="38" r="4" fill="${C.tinta}" opacity="0.7"/><path d="M36 66q14 10 28 0" stroke="${VER}" stroke-width="3" fill="none"/>`,
  sol: `<circle cx="50" cy="50" r="22" fill="${AMA}"/><g stroke="${LAR}" stroke-width="5" stroke-linecap="round"><path d="M50 10v12M50 78v12M10 50h12M78 50h12M22 22l8 8M70 70l8 8M22 78l8 -8M70 30l8 -8"/></g>`,
  sino: `<path d="M30 66q0 -30 20 -34q20 4 20 34q6 4 6 8H24q0 -4 6 -8z" fill="${C.ouro}"/><circle cx="50" cy="80" r="6" fill="#8f6f2c"/><circle cx="50" cy="30" r="4" fill="#8f6f2c"/>`,
  sapato: `<path d="M14 66q0 -14 20 -22q10 -4 20 6l30 10q6 2 6 8H14z" fill="${C.rosaDoce}"/><path d="M14 68h76v6H14z" fill="${C.veludo}"/>`,
  lua: `<path d="M56 12a38 38 0 1 0 30 60a30 30 0 1 1-30-60z" fill="${AMA}"/>`,
  lata: `<rect x="30" y="24" width="40" height="56" rx="6" fill="${CINZA}"/><ellipse cx="50" cy="24" rx="20" ry="6" fill="#d9d0c0"/><rect x="34" y="40" width="32" height="20" fill="${C.rosaDoce}"/>`,
  lobo: `<path d="M20 60l8 -30l14 12h16l14 -12l8 30q-4 20 -30 20t-30 -20z" fill="#7a7266"/><circle cx="40" cy="56" r="3" fill="${C.tinta}"/><circle cx="60" cy="56" r="3" fill="${C.tinta}"/><circle cx="50" cy="70" r="5" fill="${C.tinta}" opacity="0.8"/>`,
  leao: `<circle cx="50" cy="50" r="34" fill="${LAR}"/><circle cx="50" cy="52" r="22" fill="${AMA}"/><circle cx="42" cy="48" r="3" fill="${C.tinta}"/><circle cx="58" cy="48" r="3" fill="${C.tinta}"/><path d="M44 62q6 6 12 0" stroke="${C.tinta}" stroke-width="2.5" fill="none"/>`,
  mala: `<rect x="14" y="34" width="72" height="50" rx="8" fill="${MAR}"/><rect x="36" y="22" width="28" height="12" rx="4" fill="none" stroke="${MAR}" stroke-width="6"/><rect x="14" y="54" width="72" height="6" fill="${C.ouro}"/>`,
  mesa: `<rect x="10" y="40" width="80" height="10" rx="3" fill="${C.madeira}"/><rect x="18" y="50" width="8" height="34" fill="${C.madeira}"/><rect x="74" y="50" width="8" height="34" fill="${C.madeira}"/><rect x="10" y="34" width="80" height="8" fill="${AZUL}" opacity="0.8"/>`,
  mao: `<path d="M34 90V46a6 6 0 0 1 12 0v22l4 -34a6 6 0 0 1 12 0v34l6 -28a6 6 0 0 1 12 0l-2 32l6 -14a5 5 0 0 1 10 2l-8 30z" fill="${PELE}"/>`,
  macaco: `<circle cx="50" cy="50" r="30" fill="#8a5a3a"/><circle cx="50" cy="56" r="20" fill="${PELE}"/><circle cx="20" cy="48" r="10" fill="#8a5a3a"/><circle cx="80" cy="48" r="10" fill="#8a5a3a"/><circle cx="42" cy="50" r="3" fill="${C.tinta}"/><circle cx="58" cy="50" r="3" fill="${C.tinta}"/>`,
  uva: `<path d="${[[50, 30], [36, 42], [64, 42], [30, 56], [50, 54], [70, 56], [40, 68], [60, 68], [50, 80]].map(([x, y]) => circ([x!, y!], 9)).join('')}" fill="${ROX}"/><path d="M50 30v-16" stroke="${VER}" stroke-width="4"/>`,
  urso: `<circle cx="50" cy="56" r="30" fill="#8a6a4a"/><circle cx="26" cy="32" r="12" fill="#8a6a4a"/><circle cx="74" cy="32" r="12" fill="#8a6a4a"/><ellipse cx="50" cy="66" rx="14" ry="10" fill="${C.madeira}"/><circle cx="50" cy="62" r="5" fill="${C.tinta}"/><circle cx="40" cy="48" r="3" fill="${C.tinta}"/><circle cx="60" cy="48" r="3" fill="${C.tinta}"/>`,
  unha: `<path d="M30 90V40a20 20 0 0 1 40 0v50z" fill="${PELE}"/><path d="M36 40a14 14 0 0 1 28 0v12H36z" fill="${C.rosaDoce}"/>`,
  ilha: `<rect x="0" y="60" width="100" height="40" fill="${AGUA}"/><ellipse cx="50" cy="64" rx="30" ry="10" fill="${AMA}"/><rect x="48" y="30" width="5" height="34" fill="${C.madeira}"/><path d="M50 30q-20 -10 -26 4q14 -2 26 6q12 -8 26 -6q-6 -14 -26 -4z" fill="${VERC}"/>`,
  ima: `<path d="M30 20v40a20 20 0 0 0 40 0V20H56v40a6 6 0 0 1-12 0V20z" fill="${V}"/><rect x="30" y="20" width="14" height="14" fill="${CINZA}"/><rect x="56" y="20" width="14" height="14" fill="${CINZA}"/>`,
  ioio: `<circle cx="50" cy="60" r="26" fill="${V}"/><circle cx="50" cy="60" r="8" fill="${C.papel}"/><path d="M50 60V10" stroke="${C.tinta}" stroke-width="2" opacity="0.6"/>`,
  tatu: `<ellipse cx="52" cy="56" rx="32" ry="22" fill="${CINZA}"/><path d="M30 42q22 -8 44 0M28 56h48M30 70q22 8 44 0" stroke="${C.papel}" stroke-width="3" fill="none" opacity="0.7"/><circle cx="18" cy="60" r="10" fill="${CINZA}"/><circle cx="14" cy="58" r="2.5" fill="${C.tinta}"/>`,
  tela: `<rect x="14" y="20" width="72" height="56" rx="4" fill="${C.papel}" stroke="${C.madeira}" stroke-width="6"/><circle cx="60" cy="40" r="8" fill="${AMA}"/><path d="M20 70q20 -24 30 -10t30 -14v24H20z" fill="${VERC}"/>`,
  tomate: `<circle cx="50" cy="56" r="30" fill="${V}"/><path d="M36 30q14 -8 28 0" stroke="${VER}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 28v-10" stroke="${VER}" stroke-width="4"/>`,
  tartaruga: `<ellipse cx="50" cy="56" rx="30" ry="20" fill="${VER}"/><ellipse cx="50" cy="52" rx="22" ry="14" fill="${VERC}"/><circle cx="84" cy="60" r="9" fill="${VERC}"/><rect x="28" y="70" width="8" height="12" fill="${VERC}"/><rect x="62" y="70" width="8" height="12" fill="${VERC}"/>`,
  ola: `<path d="M34 90V46a6 6 0 0 1 12 0v22l4 -34a6 6 0 0 1 12 0v34l6 -28a6 6 0 0 1 12 0l-2 32l6 -14a5 5 0 0 1 10 2l-8 30z" fill="${PELE}"/><path d="M14 30q6 -6 6 -14M20 36q10 -6 12 -16" stroke="${C.ouro}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  sala: `<rect x="10" y="44" width="80" height="30" rx="10" fill="${C.rosa}"/><rect x="10" y="60" width="80" height="20" rx="6" fill="#d9b4a6"/><rect x="6" y="50" width="12" height="30" rx="5" fill="#d9b4a6"/><rect x="82" y="50" width="12" height="30" rx="5" fill="#d9b4a6"/>`,
  lama: `<ellipse cx="50" cy="66" rx="40" ry="16" fill="#8a6a4a"/><ellipse cx="42" cy="62" rx="16" ry="6" fill="#a8845f" opacity="0.7"/><circle cx="66" cy="58" r="5" fill="#a8845f" opacity="0.7"/>`,
  mola: `<path d="M30 20q40 6 0 12t0 12t0 12t0 12t0 12" fill="none" stroke="${CINZA}" stroke-width="6" stroke-linecap="round"/><path d="M30 20q40 6 0 12t0 12t0 12t0 12t0 12" fill="none" stroke="${C.papel}" stroke-width="2" opacity="0.7"/>`,
  tutu: `<path d="M50 20h0v30" stroke="${C.rosaDoce}" stroke-width="16"/><ellipse cx="50" cy="56" rx="40" ry="14" fill="#F7C3D8"/><ellipse cx="50" cy="52" rx="30" ry="9" fill="${C.rosaDoce}"/>`,
  mata: `<circle cx="30" cy="50" r="20" fill="${VER}"/><circle cx="60" cy="42" r="24" fill="${VERC}"/><circle cx="82" cy="56" r="16" fill="${VER}"/><rect x="27" y="66" width="6" height="22" fill="${C.madeira}"/><rect x="57" y="62" width="7" height="26" fill="${C.madeira}"/><rect x="79" y="70" width="6" height="18" fill="${C.madeira}"/>`,
  lima: `<circle cx="50" cy="52" r="30" fill="${VERC}"/><circle cx="50" cy="52" r="22" fill="#c9dbb2"/><path d="M50 30v44M28 52h44M34 36l32 32M66 36l-32 32" stroke="${VERC}" stroke-width="2"/>`,
  stella: `<circle cx="50" cy="30" r="14" fill="${PELE}"/><path d="M36 26q14 -18 28 0v24h-28z" fill="#e2c27a"/><path d="M38 46h24l8 40H30z" fill="${C.rosaDoce}"/><path d="M50 4c.7 4 2.6 6 6.5 6.5-3.9.5-5.8 2.5-6.5 6.5-.7-4-2.6-6-6.5-6.5 3.9-.5 5.8-2.5 6.5-6.5z" fill="${C.ouro}"/>`,
  morango: `<path d="M50 90q-30 -20 -30 -48q0 -14 30 -14t30 14q0 28 -30 48z" fill="${V}"/><path d="M36 30q14 -12 28 0" stroke="${VER}" stroke-width="6" fill="none"/><g fill="${AMA}"><circle cx="40" cy="50" r="2.5"/><circle cx="56" cy="46" r="2.5"/><circle cx="48" cy="64" r="2.5"/><circle cx="60" cy="62" r="2.5"/></g>`,
  cenoura: `<path d="M38 20h24l-12 70z" fill="${LAR}"/><path d="M40 20l-8 -12M50 20V6M60 20l8 -12" stroke="${VERC}" stroke-width="5" stroke-linecap="round"/>`,
  mamao: `<path d="M50 12c22 0 30 24 30 44s-8 32 -30 32s-30 -12 -30 -32s8 -44 30 -44z" fill="${LAR}"/><ellipse cx="50" cy="60" rx="10" ry="18" fill="${C.tinta}" opacity="0.5"/>`,
  banana: `<path d="M16 40q34 -30 68 0q-34 40 -68 0z" fill="${AMA}" stroke="#d9b24a" stroke-width="3"/>`,
  milho: `<path d="M50 8q22 20 16 70q-16 10 -32 0q-6 -50 16 -70z" fill="${AMA}"/><path d="M42 30v40M50 26v46M58 30v40" stroke="#d9b24a" stroke-width="2"/><path d="M34 60q-14 10 -10 30q14 -6 18 -20z" fill="${VERC}"/>`,
  brocolis: `<path d="${circ([50, 40], 18) + circ([32, 50], 14) + circ([68, 50], 14)}" fill="${VER}"/><rect x="45" y="56" width="10" height="30" rx="4" fill="#c9dbb2"/>`,
  alface: `<circle cx="50" cy="54" r="30" fill="#c9dbb2"/><path d="M22 50q10 -20 28 -18t28 18q-16 -6 -28 0t-28 0z" fill="${VERC}"/>`,
  beterraba: `<circle cx="50" cy="56" r="28" fill="#8a2a52"/><path d="M50 28v-12M42 28l-6 -10M58 28l6 -10" stroke="${VER}" stroke-width="4" stroke-linecap="round"/><path d="M50 84v8" stroke="#8a2a52" stroke-width="3"/>`,
  pao: `<ellipse cx="50" cy="56" rx="36" ry="22" fill="${MAR}"/><path d="M30 50q8 -6 16 0M50 46q8 -6 16 0" stroke="${AMA}" stroke-width="4" fill="none"/>`,
  arroz: `<ellipse cx="50" cy="60" rx="36" ry="18" fill="${C.papel}" stroke="${C.ouro}"/><ellipse cx="36" cy="54" rx="18" ry="10" fill="${C.papel}"/><path d="${circ([60, 56], 5) + circ([70, 60], 5) + circ([62, 64], 5)}" fill="#6b3a2a"/>`,
};

export function figura(id: string, x: number, y: number, s: number, extra = ''): string {
  const d = F[id] ?? `<circle cx="50" cy="50" r="30" fill="${C.rosa}"/>`;
  return `<g transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})" ${extra}>${d}</g>`;
}

export function nomeDaFigura(id: string): string {
  return (nomes as Record<string, string>)[id] ?? id;
}

export const TODAS_AS_FIGURAS = Object.keys(F);
