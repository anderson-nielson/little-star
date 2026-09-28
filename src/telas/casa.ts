import { mover, pedrinha, relogioDeAjuda, telaSvg } from './comum';
import { PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { aberto, aventuraDoDia, aventurasAbertas, disponivel, etapa, luzDaCasa, marcarBrincada, passoDeAgora, rotinaDoDia, type Aventura, type Coisa, type PassoDoDia } from '@/core/laco';
import { ceuDaHora, chaveDoDia, COR_DO_DIA, diaDaSemana, estacao } from '@/core/relogio';
import { climaDoDia } from '@/core/festas';
import { estagio, regadoHoje } from '@/core/horta';
import { ir } from '@/core/roteador';
import { cor as tok, doTopo, esperar, svgEl } from '@/core/util';
import { familia, figurinoDe } from '@/puppet/boneco';
import { CASA, arco, balancinho, barbaDeVelho, caixaDeAreia, centelha, coelho, contornoLuz, flor, gato, nuvem, pedra, pinha, pinheiro, portaDeMadeira, telhadoDuasAguas, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { ronronar, sininho, tiquinho } from '@/audio/synth';
import { Ajuda } from '@/core/ajuda';
import { CUIDADOS, cuidouHoje, type Cuidado } from '@/core/cuidados';
import { travar } from '@/core/toque';
import letras from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };
const COR_ESTACAO: Record<string, string> = { verao: '#ebd9a8', outono: '#e8a24a', inverno: '#7FA5B8', primavera: '#f2a9c4' };
const COR_FLOR: Record<string, string> = { vermelho: '#d2463c', laranja: '#e8a24a', amarelo: '#ebd9a8', verde: '#8fae6b', roxo: '#8a5aa8', marrom: '#c48f5a' };

/**
 * A casa verde inteira numa tela, sem rolagem. É o menu: tudo é um objeto
 * que se toca. A brincadeira do dia pulsa com contorno de luz; feita, a luz
 * passa para o que ela ainda não explorou. O que ela já brincou hoje ganha
 * uma centelha parada; o que abriu e ela nunca tocou balança devagar.
 */
export function telaCasa(): Tela {
  const e = estado();
  const agora = sessao.agora();
  const ceu = ceuDaHora(agora);
  const noite = ceu === 'ceu-noite';
  /* onde a luz fica hoje: a brincadeira do dia, depois o que ela ainda não tocou */
  const luzEm = luzDaCasa(e, agora);
  /* o que ainda não abriu fica na casa em silhueta: ela vê que existe e que ainda não é a hora */
  const novo = (c: Coisa) => (disponivel(e, c) ? '' : ' class="fechado"');
  const corDia = tok('--' + COR_DO_DIA[diaDaSemana(agora)]!) || '#7FA5B8';
  const corEst = COR_ESTACAO[estacao(agora)]!;
  const clima = climaDoDia(agora, e.pais.festas);
  const hoje = chaveDoDia(agora);
  const s7 = etapa(e);

  /* a casa larga, em dois andares altos: em cima o quarto rosa e o banheiro, embaixo
     a sala com a lareira e a cozinha. Cada andar tem uma fileira de coisas na parede
     e outra no chão, e cada coisa que leva a uma brincadeira fica longe da vizinha
     (os alvos de 72 px não se encostam). */
  const W = 390;
  const hx = 6;
  const hw = 378;
  const L = hx + 10;
  const R = hx + hw - 10;
  const top = 140;
  const bottom = 600;
  /** o chão do andar de cima */
  const f1 = 372;
  /** a parede entre o quarto e o banheiro */
  const bw = 268;
  /** a parede entre a sala e a cozinha */
  const sw = 224;
  /* a área de toque de cada coisa: um círculo transparente em volta do desenho */
  const toque = (x: number, y: number, r = 32) => `<circle cx="${x}" cy="${y}" r="${r}" fill="transparent"/>`;

  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, W, 200, noite ? '#1b2140' : '#ebcdc3', 5, 0.35);
  /* o sol (ou a lua) mora no cantinho de céu à direita do telhado. O alto da tela é
     do cabeçalho: a casinha, o varal e as opções. */
  s += noite
    ? `<circle cx="372" cy="116" r="11" fill="#ebd9a8" opacity="0.9"/>${centelha(24, 112, 7, '#ebd9a8')}${centelha(352, 98, 6, '#ebd9a8')}`
    : `<circle cx="372" cy="116" r="12" fill="#ebd9a8" opacity="0.9"/>` + nuvem(34, 118, 7);
  /* quintal */
  /* a grama vai além da cena: em tela mais larga ou mais alta, as sobras são quintal, não faixa lisa */
  s += `<rect x="-400" y="600" width="1190" height="800" fill="#c9dbb2"/>` + veu(-80, 600, W + 160, 180, '#8fae6b', 5, 0.32, true);
  /* a estação e as festas mudam o quintal devagar */
  if (clima.folhas) for (let i = 0; i < 7; i++) s += `<path d="M${30 + i * 52} ${612 + (i % 3) * 8}q8 -12 16 0q-8 12 -16 0z" fill="${i % 2 ? '#d97f74' : '#e8a24a'}" opacity="0.85"/>`;
  if (clima.festa === 'junina') s += `<g class="fogueira"><path d="M214 700l24 -8l24 8z" fill="#8a6a4a"/><path d="M226 700q0 -26 12 -38q12 12 12 38z" fill="#e8a24a" opacity="0.9"/><path d="M232 700q0 -16 6 -24q6 8 6 24z" fill="#ebd9a8" opacity="0.9"/></g>`;
  if (clima.velas > 0) {
    s += `<path d="M130 694m0 0c-20 -6 -24 -30 -4 -36c22 -6 36 12 24 28c-10 14 -30 8 -28 -6c2 -10 14 -8 14 -2" fill="none" stroke="#35564d" stroke-width="5" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) {
      const vx = 112 + i * 14;
      s += `<rect x="${vx - 3}" y="${666 - (i % 2) * 8}" width="6" height="16" fill="#ebd9a8"/>`;
      if (i < clima.velas) s += `<ellipse cx="${vx}" cy="${662 - (i % 2) * 8}" rx="3" ry="5" fill="#e8a24a" opacity="0.9"/>`;
    }
  }
  /* casa */
  /* o telhado para abaixo do varal: a segunda corda não encosta na cumeeira */
  s += telhadoDuasAguas(hx - 6, top - 50, hw + 12, 60);
  s += `<circle cx="${hx + hw / 2}" cy="${top - 14}" r="11" fill="#f6e3dc" stroke="#c6a15b" stroke-width="1.5"/>`;
  s += `<rect x="${hx}" y="${top}" width="${hw}" height="${bottom - top}" fill="${CASA.salvia}"/>` + veu(hx, top, hw, bottom - top, '#c9dbb2', 4, 0.22, true);
  if (clima.festa === 'junina')
    for (let i = 0; i < 14; i++) {
      const t = (i + 0.5) / 14;
      const bx = hx + hw * t;
      const by = top + 12 + Math.sin(t * Math.PI * 2) ** 2 * 6;
      s += `<path d="M${bx - 6} ${by}h12l-6 12z" fill="${['#d2463c', '#ebd9a8', '#7FA5B8', '#f2a9c4', '#8fae6b', '#e8a24a'][i % 6]}"/>`;
    }
  if (clima.festa === 'lanterna') for (let i = 0; i < 4; i++) s += `<g class="respira" style="animation-delay:${i * 400}ms"><path d="M${hx + 46 + i * 95} ${top + 8}v10" stroke="#c9a189" stroke-width="1.5"/><rect x="${hx + 38 + i * 95}" y="${top + 18}" width="16" height="20" rx="6" fill="#e8a24a" opacity="0.9"/><rect x="${hx + 42 + i * 95}" y="${top + 24}" width="8" height="8" rx="3" fill="#ebd9a8"/></g>`;

  /* ---------- andar de cima: o quarto rosa e o banheiro ---------- */
  s += `<rect x="${L}" y="${top + 8}" width="${bw - L}" height="${f1 - top - 8}" fill="#f6e3dc"/>` + veu(L, top + 8, bw - L, f1 - top - 8, '#ebcdc3', 3, 0.3, true);
  s += `<rect x="${bw + 6}" y="${top + 8}" width="${R - bw - 6}" height="${f1 - top - 8}" fill="#e6eff2"/>`;
  for (let y = f1 - 80; y < f1; y += 10) s += `<line x1="${bw + 6}" y1="${y}" x2="${R}" y2="${y}" stroke="#c9d9df" stroke-width="1"/>`;
  s += `<rect x="${L}" y="${f1}" width="${R - L}" height="6" fill="${CASA.beiral}"/>`;
  /* as letras que ela já traçou, numa fileira no alto da parede */
  e.letras.slice(0, 9).forEach((l, i) => {
    s += `<text x="${30 + i * 22}" y="${top + 38}" font-family="Jost, sans-serif" font-size="18" font-weight="500" fill="#f2a9c4">${l}</text>`;
  });
  /* janela do quarto: céu da hora, lua e estrelas das noites bem dormidas */
  s += `<g data-alvo="janela">${toque(114, 218, 30)}${arco(88, 182, 52, 70, CEU[ceu]!)}`;
  for (let i = 0; i < Math.min(e.estrelas, 6); i++) s += centelha(100 + (i % 3) * 14, 214 + Math.floor(i / 3) * 14, 7, '#c6a15b');
  if (noite) s += `<path d="M124 196a6 6 0 1 0 5 9a5 5 0 1 1-5-9z" fill="#ebd9a8"/>`;
  s += `</g>`;
  /* o ukulele na parede */
  s += `<g data-alvo="ukulele"${novo('ukulele')}>${toque(40, 232, 30)}<rect x="37" y="212" width="6" height="22" rx="2" fill="#c9a189"/><rect x="36" y="210" width="8" height="6" rx="2" fill="#a97e63"/><circle cx="40" cy="236" r="6.5" fill="#f2a9c4"/><circle cx="40" cy="245" r="8.5" fill="#f2a9c4"/><circle cx="40" cy="240" r="2.5" fill="#6e1a27" opacity="0.6"/></g>`;
  /* estante de bonecas: três em cima, duas embaixo */
  s += `<g data-alvo="estante"${novo('bonecas')}>${toque(185, 224, 34)}<rect x="150" y="194" width="70" height="60" fill="none" stroke="#c9a189" stroke-width="2"/><line x1="150" y1="224" x2="220" y2="224" stroke="#c9a189" stroke-width="2"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(162 + (i % 3) * 23, 222 + Math.floor(i / 3) * 30, 22, i, figurinoDe(e.figurinos[String(i)])).svg}</g>`;
  s += `</g>`;
  /* a porta do quarto, rosa, com o nome dela em cima e o envelope do bilhetinho */
  s += `<rect x="226" y="236" width="38" height="${f1 - 236}" rx="6" fill="#f2a9c4"/><circle cx="256" cy="310" r="2.5" fill="#c6a15b"/>`;
  const nome = 'STELLA';
  const temNome = [...nome].every((l) => e.letras.includes(l));
  if (temNome) s += `<text x="245" y="228" text-anchor="middle" font-family="Jost, sans-serif" font-size="10" font-weight="500" letter-spacing="1.5" fill="#6e1a27">${nome}</text>`;
  s += `<g data-alvo="bilhete"${novo('bilhete')}>${toque(245, 272, 28)}<rect x="233" y="264" width="24" height="16" rx="2" fill="#fbf8f1" stroke="#c6a15b"/><path d="M233 264l12 9l12 -9" fill="none" stroke="#c6a15b"/></g>`;
  /* mala no chão (palavra) */
  s += `<g data-alvo="mala"${novo('palavras')}>${toque(35, 358, 28)}<rect x="20" y="${f1 - 20}" width="30" height="20" rx="4" fill="#c48f5a"/><rect x="29" y="${f1 - 25}" width="12" height="6" rx="2" fill="none" stroke="#c48f5a" stroke-width="3"/></g>`;
  /* cama */
  s += `<g data-alvo="cama"${novo('cuidados')}>${toque(100, 350, 34)}<rect x="66" y="${f1 - 26}" width="70" height="26" rx="6" fill="#fbf8f1"/><rect x="66" y="${f1 - 18}" width="70" height="18" rx="4" fill="#f2a9c4" opacity="0.8"/><rect x="62" y="${f1 - 40}" width="8" height="40" rx="2" fill="#c9a189"/><rect x="132" y="${f1 - 32}" width="8" height="32" rx="2" fill="#c9a189"/>`;
  /* lembranças: o travesseiro */
  if (e.lembrancas.length > 0) s += `<ellipse cx="80" cy="${f1 - 22}" rx="10" ry="5" fill="#fbf8f1" stroke="#ebcdc3"/>`;
  s += `</g>`;
  /* a Stella sentada na cama. É só enfeite, então o toque passa por ela e chega no que estiver atrás. */
  s += `<g class="stella" style="pointer-events:none">${familia.stella(92, f1 - 20, 50, 'sentado').svg}</g>`;
  /* caderno na escrivaninha de parede, entre a cama e o piano: é onde ela mais gosta de ir */
  s += `<g data-alvo="caderno"${novo('caderno')}>${toque(153, 290, 30)}<rect x="130" y="300" width="46" height="6" rx="2" fill="#c9a189"/><path d="M134 306l6 10M172 306l-6 10" stroke="#c9a189" stroke-width="2.5"/><rect x="136" y="277" width="34" height="23" rx="2" fill="#fbf8f1" stroke="#c6a15b"/><line x1="153" y1="278" x2="153" y2="299" stroke="#ebcdc3" stroke-width="1"/><text x="161" y="295" text-anchor="middle" font-family="Jost, sans-serif" font-size="16" fill="#f2a9c4" font-weight="500">${(letras as { id: string }[])[Math.min(e.letraIndice, 8)]?.id ?? 'A'}</text></g>`;
  /* as sapatilhas de ponta penduradas pelas fitas num ganchinho, entre o caderno e a porta: o palco */
  s += `<g data-alvo="sapatilhas"${novo('palco')}>${toque(201, 290, 26)}<circle cx="201" cy="270" r="2.2" fill="#c6a15b"/>`;
  s += `<path d="M201 271q-8 8 -8 20M201 271q8 8 8 20M193 291q-5 4 -8 -1M209 291q5 4 8 -1" fill="none" stroke="#f2a9c4" stroke-width="2" stroke-linecap="round"/>`;
  s += `<path d="M186 296q0 -8 7 -8q7 0 7 8v8q0 5 -7 5q-7 0 -7 -5zM202 296q0 -8 7 -8q7 0 7 8v8q0 5 -7 5q-7 0 -7 -5z" fill="#f2a9c4"/>`;
  s += `<path d="M188 297q5 -3 10 0M204 297q5 -3 10 0" fill="none" stroke="#fbf8f1" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/><path d="M190 307q3 3 6 0M206 307q3 3 6 0" fill="none" stroke="#d98fa8" stroke-width="1.6" stroke-linecap="round"/></g>`;
  /* a lembrança do lago: a flor rosa que ela trouxe, num copinho d'água em cima do piano */
  const florDoLago = e.lembrancas.some((l) => l.startsWith('lago:'))
    ? `<rect x="204" y="${f1 - 48}" width="8" height="10" rx="1.5" fill="#dbe7ee" stroke="#9fc3cf"/><circle cx="208" cy="${f1 - 51}" r="4.5" fill="#f2a9c4"/><circle cx="208" cy="${f1 - 51}" r="1.6" fill="#ebd9a8"/>`
    : '';
  /* piano rosa */
  s += `<g data-alvo="piano"${novo('piano')}>${toque(196, 352, 30)}<rect x="176" y="${f1 - 38}" width="40" height="38" rx="4" fill="#f2a9c4"/><rect x="176" y="${f1 - 22}" width="40" height="9" fill="#fbf8f1"/><path d="M182 ${f1 - 22}v9M188 ${f1 - 22}v9M194 ${f1 - 22}v9M200 ${f1 - 22}v9M206 ${f1 - 22}v9M211 ${f1 - 22}v9" stroke="#ebcdc3" stroke-width="1"/>${florDoLago}</g>`;
  /* o banheiro: a toalha, a pia com o espelho e a escova no copo, a banheira */
  s += `<line x1="304" y1="172" x2="325" y2="172" stroke="#c9a189" stroke-width="3" stroke-linecap="round"/><rect x="307" y="172" width="15" height="21" rx="2" fill="#f2a9c4" opacity="0.85"/><path d="M307 188h15" stroke="#fbf8f1" stroke-width="2"/>`;
  s += `<g data-alvo="pia"${novo('cuidados')}>${toque(312, 272, 34)}<ellipse cx="312" cy="248" rx="15" ry="19" fill="#dbe7ee" stroke="#c6a15b" stroke-width="1.5"/><rect x="292" y="278" width="40" height="9" rx="4" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/><rect x="307" y="287" width="10" height="12" rx="3" fill="#fbf8f1" opacity="0.9"/><path d="M309 278v-8h7" fill="none" stroke="#8f8270" stroke-width="2.5" stroke-linecap="round"/><path d="M336 266h10l-1.5 12h-7z" fill="#f6e3dc" stroke="#c9a189"/><rect x="339" y="252" width="3" height="18" rx="1.5" fill="#f2a9c4"/><rect x="338" y="249" width="5" height="5" rx="1" fill="#fbf8f1" stroke="#c9a189" stroke-width="0.6"/></g>`;
  s += `<path d="M284 ${f1 - 30}h80v10a14 14 0 0 1 -14 14h-52a14 14 0 0 1 -14 -14z" fill="#fbf8f1" stroke="#c6a15b"/><path d="M292 ${f1 - 6}v6M356 ${f1 - 6}v6" stroke="#c9a189" stroke-width="3"/><path d="M358 ${f1 - 30}v-24h-8" fill="none" stroke="#8f8270" stroke-width="2.5" stroke-linecap="round"/>`;
  [296, 308, 320, 334].forEach((x, i) => (s += `<circle cx="${x}" cy="${f1 - 32 - (i % 2) * 4}" r="${4 + (i % 2)}" fill="#fbf8f1" stroke="#dbe7ee"/>`));
  s += `<ellipse cx="320" cy="${f1 - 2}" rx="28" ry="4" fill="#7FA5B8" opacity="0.5"/>`;
  /* o gatinho dorme no tapetinho do banheiro */
  if (e.bichos.gato) s += `<g data-alvo="gato">${toque(322, 358, 26)}${gato(326, f1 - 3, 11, '#c8b8a6', true)}</g>`;

  /* ---------- andar de baixo: a sala com a lareira e a cozinha ---------- */
  s += `<rect x="${L}" y="${f1 + 6}" width="${sw - L}" height="${bottom - f1 - 8}" fill="#c9dbb2" opacity="0.8"/>`;
  s += `<rect x="${sw + 6}" y="${f1 + 6}" width="${R - sw - 6}" height="${bottom - f1 - 8}" fill="#fbf8f1" opacity="0.65"/>`;
  /* as medalhas de feltro na parede da sala, em duas fileiras */
  for (let i = 0; i < Math.min(e.medalhas, 8); i++) {
    const mx = 26 + (i % 4) * 16;
    const my = 384 + Math.floor(i / 4) * 26;
    s += `<g class="medalha"><path d="M${mx} ${my}l-3.5 10h7z" fill="#f2a9c4"/><circle cx="${mx}" cy="${my + 14}" r="5" fill="#c6a15b"/><circle cx="${mx}" cy="${my + 14}" r="2.5" fill="#ebd9a8"/></g>`;
  }
  /* o pote de pedrinhas na prateleira da sala */
  if (e.pais.pedrinhas) {
    s += `<rect x="22" y="454" width="48" height="4" rx="2" fill="#c9a189"/>`;
    s += `<g data-alvo="pote">${toque(46, 440, 28)}<path d="M36 432h20v12a10 10 0 0 1 -20 0z" fill="#dbe7ee" opacity="0.55" stroke="#c6a15b" stroke-width="1"/><rect x="38" y="428" width="16" height="4" rx="2" fill="#c9a189"/>`;
    const n = Math.min(e.pedrinhas, PEDRINHAS.pote);
    for (let i = 0; i < n; i++) s += pedrinha(40 + (i % 4) * 4, 450 - Math.floor(i / 4) * 4.5, 2.2, i);
    s += `</g>`;
  }
  /* a lareira branca no fundo da sala, com a chaminé até o teto */
  const lx = 87;
  const lb = bottom - 8;
  s += `<rect x="96" y="${f1 + 6}" width="56" height="${lb - 80 - (f1 + 6)}" fill="#fbf8f1" stroke="#d8cbb5" stroke-width="1"/>`;
  s += `<rect x="${lx}" y="${lb - 80}" width="74" height="80" rx="3" fill="#fbf8f1" stroke="#d8cbb5" stroke-width="1.2"/><rect x="${lx - 6}" y="${lb - 86}" width="86" height="8" rx="2" fill="#fbf8f1" stroke="#d8cbb5" stroke-width="1.2"/>`;
  s += `<path d="M${lx + 16} ${lb}v-34a21 21 0 0 1 42 0v34z" fill="#3b3330"/><path d="M${lx + 25} ${lb - 4}h24" stroke="#8a6a4a" stroke-width="5" stroke-linecap="round"/>`;
  s += `<g class="respira"><path d="M${lx + 27} ${lb - 6}q0 -18 10 -28q10 12 10 28z" fill="#e8a24a"/><path d="M${lx + 32} ${lb - 6}q0 -10 5 -16q5 6 5 16z" fill="#ebd9a8"/></g>`;
  s += `<rect x="${lx + 58}" y="${lb - 102}" width="5" height="16" rx="1" fill="#ebd9a8"/><ellipse cx="${lx + 60.5}" cy="${lb - 105}" rx="2.4" ry="4" fill="#e8a24a"/><path d="M${lx + 8} ${lb - 86}q6 -14 16 -12M${lx + 12} ${lb - 86}q2 -10 -4 -14" fill="none" stroke="#8fae6b" stroke-width="2.4" stroke-linecap="round"/>`;
  /* o relógio da sala, pendurado na chaminé: ela está aprendendo a ver as horas */
  {
    const hh = agora.getHours() % 12;
    const ang = ((hh + agora.getMinutes() / 60) * 30 - 90) * (Math.PI / 180);
    s += `<g data-alvo="relogio"${novo('relogio')}>${toque(124, 420, 28)}<circle cx="124" cy="420" r="15" fill="#fbf8f1" stroke="#c9a189" stroke-width="2.5"/><path d="M124 420V409" stroke="#c6a15b" stroke-width="1.5"/><path d="M124 420L${(124 + Math.cos(ang) * 8).toFixed(1)} ${(420 + Math.sin(ang) * 8).toFixed(1)}" stroke="#6e1a27" stroke-width="2.5" stroke-linecap="round"/></g>`;
  }
  /* a mesa da estação com as pinhas dela, na parede da sala */
  s += `<g data-alvo="mesa">${toque(194, 426, 28)}<rect x="170" y="432" width="48" height="5" rx="2" fill="#c9a189"/><rect x="170" y="426" width="48" height="7" fill="${corEst}" opacity="0.85"/><path d="M174 437l5 10M214 437l-5 10" stroke="#c9a189" stroke-width="2.5"/>`;
  e.pinhas.slice(0, 8).forEach((p) => {
    s += pinha(174 + p.x * 36, 425, 4, p.tipo);
  });
  /* e o que mais ela arrumou lá: umas pedrinhas e um tufinho de barba de velho */
  e.mesa.slice(0, 6).forEach((c) => {
    const x = 174 + c.x * 40;
    if (c.material === 'pedra') s += pedra(x, 424, 2, c.tipo);
    else if (c.material === 'musgo') s += barbaDeVelho(x, 422, 3, c.tipo);
  });
  /* a lembrança do parquinho: um balancinho de madeira ao lado das pinhas */
  if (e.lembrancas.some((l) => l.startsWith('parquinho:'))) s += balancinho(212, 426, 12);
  s += `</g>`;
  /* a porta da rua, na sala: de onde saem as aventuras e onde a família recebe na volta */
  const jardimAberto = aberto(s7, 'jardim');
  s += `<g data-alvo="porta"${novo('jardim')}>${portaDeMadeira(20, bottom - 78, 46, 78, 5, true)}`;
  if (noite) s += `<path d="M43 ${bottom - 82}a7 7 0 1 0 6 10a5 5 0 1 1-6-10z" fill="#ebd9a8"/>`;
  if (clima.festa === 'primavera') for (let i = 0; i < 5; i++) s += flor(21 + i * 11, bottom - 92 + Math.abs(i - 2) * 6, ['#f2a9c4', '#ebd9a8', '#d97f74', '#ebd9a8', '#f2a9c4'][i]!, 6);
  s += `</g>`;
  /* a família no tapete, em volta da lareira */
  s += `<g data-alvo="tapete"><ellipse cx="124" cy="${bottom - 4}" rx="80" ry="12" fill="#ebcdc3" opacity="0.85"/>`;
  s += familia.mae(70, bottom - 2, 92).svg + familia.theo(96, bottom + 2, 66, 'acena').svg + familia.pai(170, bottom - 2, 98, 'parado', { dir: -1 }).svg + `</g>`;
  /* a caixa de brinquedos no canto da sala */
  s += `<g data-alvo="caixa-brinquedos"${novo('cuidados')}>${toque(206, 578, 28)}<circle cx="196" cy="${bottom - 29}" r="6" fill="#f2a9c4"/><rect x="204" y="${bottom - 36}" width="10" height="10" rx="2" fill="#7FA5B8"/><rect x="188" y="${bottom - 23}" width="34" height="21" rx="4" fill="#c9a189"/><rect x="186" y="${bottom - 25}" width="38" height="5" rx="2" fill="#b08a70"/></g>`;
  /* cozinha: o mural das figuras, a prateleira da lata, o fogão e a mesa com a toalha do dia */
  s += `<g data-alvo="mural"${novo('som')}>${mural(268, 424)}</g>`;
  s += `<g data-alvo="lata">${toque(342, 428, 28)}<rect x="320" y="440" width="46" height="4" rx="2" fill="#c9a189"/><rect x="334" y="422" width="14" height="18" rx="2" fill="#b6a58c"/><rect x="350" y="428" width="10" height="12" rx="2" fill="#ebd9a8"/></g>`;
  s += `<g data-alvo="fogao"${novo('cozinha')}>${toque(270, 566, 32)}<rect x="250" y="${bottom - 46}" width="40" height="46" rx="3" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/><circle cx="262" cy="${bottom - 36}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/><circle cx="278" cy="${bottom - 36}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/><rect x="256" y="${bottom - 26}" width="28" height="18" rx="2" fill="none" stroke="#c6a15b" opacity="0.6"/>`;
  if (e.colheita.length) s += `<path d="M${sw + 10} ${bottom - 2}q10 -4 20 0l-2 -10h-16z" fill="#c9a189"/>` + e.colheita.slice(0, 3).map((c, i) => `<circle cx="${sw + 14 + i * 6}" cy="${bottom - 14}" r="3" fill="${{ cenoura: '#e8a24a', tomate: '#d2463c', milho: '#ebd9a8', alface: '#8fae6b' }[c]}"/>`).join('');
  s += `</g>`;
  s += `<g data-alvo="mesa-cozinha">${toque(338, 566, 30)}<rect x="308" y="${bottom - 38}" width="60" height="10" rx="2" fill="${corDia}"/><rect x="308" y="${bottom - 28}" width="60" height="4" fill="#c9a189"/><line x1="314" y1="${bottom - 24}" x2="314" y2="${bottom}" stroke="#c9a189" stroke-width="3"/><line x1="362" y1="${bottom - 24}" x2="362" y2="${bottom}" stroke="#c9a189" stroke-width="3"/><ellipse cx="338" cy="${bottom - 40}" rx="12" ry="4" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/></g>`;

  /* ---------- quintal: canteiro, coelhinho, horta, caixa de areia, parquinho, pinheiro ---------- */
  s += `<g data-alvo="canteiro"><ellipse cx="64" cy="648" rx="52" ry="9" fill="#8a6a4a" opacity="0.55"/>`;
  e.flores.slice(-8).forEach((fl, i) => {
    s += flor(22 + i * 12, 646 + (i % 2) * 3, COR_FLOR[fl.cor] ?? '#f2a9c4', fl.girassol ? 10 : 8, fl.girassol);
  });
  s += `</g>`;
  const coelhoNovo = !e.bichos.coelho && aberto(s7, 'coelho');
  if (e.bichos.coelho || coelhoNovo) s += `<g data-alvo="coelho" class="${coelhoNovo ? 'respira' : ''}">${toque(172, 628, 26)}${coelho(170, 642, coelhoNovo ? 22 : 18)}</g>`;
  /* a horta: quatro covinhas que mostram o que está crescendo */
  {
    s += `<g data-alvo="horta"${novo('horta')}>${toque(270, 652, 36)}<path d="M232 640h76M232 652h76" stroke="#c9a189" stroke-width="2.5"/><path d="M238 634v22M270 634v22M302 634v22" stroke="#c9a189" stroke-width="3" stroke-linecap="round"/><rect x="232" y="656" width="76" height="14" rx="6" fill="#8a6a4a" opacity="0.75"/>`;
    e.horta.forEach((c, i) => {
      const cx = 242 + i * 19;
      if (!c) return;
      const est = estagio(c, hoje);
      const cor = { cenoura: '#e8a24a', tomate: '#d2463c', milho: '#ebd9a8', alface: '#8fae6b' }[c.semente];
      s += est === 'semente' ? `<circle cx="${cx}" cy="660" r="2" fill="#6b4a2a"/>` : `<path d="M${cx} 662v-${est === 'broto' ? 6 : 10}" stroke="#8fae6b" stroke-width="2"/>`;
      if (est === 'pronta') s += `<circle cx="${cx}" cy="650" r="4" fill="${cor}"/>`;
      if (!regadoHoje(c, hoje) && est !== 'pronta') s += `<circle cx="${cx + 5}" cy="646" r="2" fill="#9fc3cf"/>`;
    });
    s += `</g>`;
  }
  s += `<g data-alvo="areia"${novo('areia')}>${caixaDeAreia(76, 720, 48)}<path d="M62 722q10 -8 20 0" fill="none" stroke="#d9c69a" stroke-width="2"/><rect x="92" y="710" width="10" height="12" rx="2" fill="#f2a9c4"/>${clima.conchas ? `<path d="M70 730q4 -6 8 0q-4 4 -8 0zM84 734q4 -6 8 0q-4 4 -8 0z" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.8"/>` : ''}</g>`;
  /* o parquinho do condomínio, logo ali fora: o balancinho na beirada do quintal */
  s += `<g data-alvo="parquinho"${novo('parquinho')}>${toque(186, 728, 32)}${balancinho(186, 752, 44, 8)}</g>`;
  s += `<g data-alvo="arvore">${pinheiro(352, 760, 150)}`;
  if (clima.flores) s += flor(336, 660, '#f2a9c4', 5) + flor(366, 640, '#ebd9a8', 5) + flor(348, 700, '#f2a9c4', 4);
  if (clima.fitinha) s += `<path d="M334 712q18 -10 36 0" fill="none" stroke="#7FA5B8" stroke-width="3"/>`;
  s += `</g><g data-alvo="pinhas"${novo('pinhas')}>${toque(276, 734, 30)}`;
  s += pinha(266, 728, 6) + pinha(286, 732, 6, 1) + pinha(276, 742, 5, 2);
  s += `</g>`;
  /* onde cada coisa mora, para a luz e para a centelha do que já foi hoje */
  const alvoDaCoisa: Record<Coisa, [number, number, number, number]> = {
    piano: [196, 352, 26, 24],
    caderno: [153, 290, 26, 20],
    som: [268, 424, 28, 24],
    palavras: [35, 360, 20, 16],
    areia: [76, 720, 54, 32],
    pinhas: [276, 734, 28, 18],
    jardim: [43, 552, 30, 50],
    familia: [124, 540, 66, 58],
    cozinha: [270, 568, 28, 34],
    ukulele: [40, 234, 18, 26],
    bonecas: [185, 224, 40, 34],
    palco: [201, 292, 20, 24],
    bilhete: [245, 272, 16, 12],
    relogio: [124, 420, 20, 20],
    horta: [270, 652, 44, 22],
    arvore: [352, 660, 30, 56],
    parquinho: [186, 730, 30, 28],
    cuidados: [312, 272, 28, 30],
  };
  /* os cuidados moram em três lugares; a luz e a centelha vão em cada um */
  const alvoDoCuidado: Record<Cuidado, [number, number, number, number]> = {
    cama: [100, 352, 42, 22],
    dentes: [312, 272, 28, 30],
    brinquedos: [206, 580, 24, 20],
  };
  /* contorno de luz onde ela ainda pode ir; centelha parada no que já brincou hoje */
  const luz = luzEm ? alvoDaCoisa[luzEm] : null;
  if (luzEm === 'cuidados') {
    /* a luz dos cuidados acende em cada um que ela ainda não fez hoje */
    const faltam = CUIDADOS.filter((c) => !cuidouHoje(e, c));
    for (const c of faltam.length ? faltam : CUIDADOS) s += `<g class="luz-do-dia">${contornoLuz(...alvoDoCuidado[c])}</g>`;
  } else if (luz) s += `<g class="luz-do-dia">${contornoLuz(...luz)}</g>`;
  /* os três cuidados são um lugar só na rotina: a centelha mostra quais ela já fez hoje */
  for (const c of CUIDADOS) {
    if (!cuidouHoje(e, c)) continue;
    const [cx, cy, rx, ry] = alvoDoCuidado[c];
    s += `<g class="feito-hoje">${centelha(cx + rx - 4, cy - ry + 4, 12, '#c6a15b')}</g>`;
  }

  /* o varal mora no cabeçalho, logo abaixo da linha da casinha: uma bandeirinha para
     cada coisa aberta da casa. Dourada e com centelha, ela já brincou hoje; clarinha,
     ainda espera; balançando, nunca tocou. O que ainda está fechado não pendura
     bandeirinha: o varal cresce com a casa. A cena guarda FOLGA_DO_VARAL em cima
     para o varal não cobrir o telhado. */
  const tela = telaSvg(s, {
    casinha: () => {
      tiquinho();
      tela.comemorar(...doTopo(tela.svg, 40, 44));
    },
    topo: rotina(rotinaDoDia(e, agora)),
    folga: FOLGA_DA_ROTINA,
  });
  const svg = tela.svg;
  tocarFundo(noite ? 'ninar_brahms' : e.sessoes % 2 ? 'gymnopedie' : 'preludio_bach', { bpm: noite ? 60 : undefined });

  /* tocar numa bandeirinha: a coisa acende na casa e a mãozinha aponta para ela.
     Fica tempo bastante para o olho sair do céu e achar o lugar; outro toque troca. */
  let destaque: Element | null = null;
  let vezDoDestaque = 0;
  const apagarDestaque = () => {
    destaque?.remove();
    destaque = null;
  };
  tela.aoDestruir(apagarDestaque);
  tela.alvo('[data-varal]', (_ev, el) => {
    tiquinho();
    mover(el, 0, -3, 160);
    void esperar(180).then(() => mover(el, 0, 0, 300));
    const qual = el.getAttribute('data-varal') as Coisa;
    const [cx, cy] = alvoDaCoisa[qual];
    const lugares = qual === 'cuidados' ? CUIDADOS.map((c) => alvoDoCuidado[c]) : [alvoDaCoisa[qual]];
    apagarDestaque();
    destaque = svgEl(`<g class="surge" style="pointer-events:none">${lugares.map(([lx, ly, lrx, lry]) => contornoLuz(lx, ly, lrx + 8, lry + 8)).join('')}</g>`);
    svg.querySelector('.camada-mao')?.before(destaque);
    tela.mao([cx + 10, cy + 10]);
    const vez = ++vezDoDestaque;
    void esperar(6000).then(() => {
      if (vez !== vezDoDestaque) return;
      apagarDestaque();
      tela.mao(null);
    });
  });

  /* roda, prato e som que ficaram para trás: um toque na cartinha do quadro leva até eles */
  const pendentes = [...svg.querySelectorAll('[data-pendente]')];
  const ondePendente = (): [number, number] | null => {
    const el = pendentes[0];
    if (!el) return null;
    const [x, y] = doTopo(svg, Number(el.getAttribute('data-cx')), Number(el.getAttribute('data-cy')));
    return [x + 10, y + 10];
  };
  tela.alvo('[data-pendente]', (_ev, el) => {
    tiquinho();
    mover(el, 0, -3, 160);
    travar(500);
    const parte = el.getAttribute('data-pendente') as 'roda' | 'prato' | 'som';
    void esperar(180).then(() => sessao.desviar(parte));
  });

  /* ajuda: depois de 6 s parada, a mãozinha aponta o que vem agora. Com roda, prato
     ou som pendente é a cartinha do primeiro deles no quadro; senão, a brincadeira do dia */
  const ajuda = new Ajuda((n) => {
    const r = ondePendente();
    if (n >= 1 && r) tela.mao(r);
    else if (n >= 1 && luz) tela.mao([luz[0] + 10, luz[1] + 10]);
    if (n >= 1 && temVoz('toca_aqui') && n === 1) void falar('toca_aqui');
  });
  relogioDeAjuda(tela, (dt) => ajuda.tick(dt));
  const tocou = () => {
    ajuda.tocou();
    tela.mao(null);
  };
  svg.addEventListener('pointerdown', tocou);
  tela.aoDestruir(() => svg.removeEventListener('pointerdown', tocou));

  /* cada tela da casa é uma coisa explorada: a luz passa adiante e a centelha fica */
  const COISA_DA_TELA: Record<string, Coisa> = { piano: 'piano', caderno: 'caderno', som: 'som', palavra: 'palavras', areia: 'areia', pinhas: 'pinhas', horta: 'horta', ukulele: 'ukulele', bilhete: 'bilhete', relogio: 'relogio', cozinha: 'cozinha', bonecas: 'bonecas', palco: 'palco', arvore: 'arvore', jardim: 'jardim', arvoregrande: 'jardim', lago: 'jardim', parquinho: 'parquinho', escorregador: 'parquinho', gangorra: 'parquinho', cama: 'cuidados', dentes: 'cuidados', brinquedos: 'cuidados' };
  const vai = (nome: string, params: Record<string, string> = {}) => {
    travar(500);
    const coisa = COISA_DA_TELA[nome];
    if (coisa) mudar((x) => marcarBrincada(x, coisa));
    void ir(nome, params);
  };
  /* coisa ainda fechada: um lacinho rosa aparece nela por um instante e a mãozinha
     vai até a brincadeira de hoje. Nada parece quebrado, e ela sabe para onde ir. */
  const fechado = (el: Element) => {
    tiquinho();
    const caixa = (el as SVGGraphicsElement).getBBox();
    const cx = caixa.x + caixa.width / 2;
    const cy = caixa.y + Math.min(caixa.height / 2, 30);
    const laco = svgEl(`<g class="surge"><path d="M${cx} ${cy}q-14 -11 -12 2q2 8 12 -2q14 -11 12 2q-2 8 -12 -2z" fill="#f2a9c4"/><path d="M${cx} ${cy}l-6 14M${cx} ${cy}l6 14" stroke="#f2a9c4" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3" fill="#ebd9a8"/></g>`);
    svg.appendChild(laco);
    void esperar(1400).then(() => laco.remove());
    if (luz) {
      tela.mao([luz[0] + 10, luz[1] + 10]);
      void esperar(3000).then(() => tela.mao(null));
    }
  };
  /* coisa que é só enfeite: balança um pouco, além do sininho */
  const enfeite = (el: Element) => {
    tiquinho();
    mover(el, 0, -3, 160);
    void esperar(180).then(() => mover(el, 0, 0, 300));
  };
  tela.alvo('[data-alvo="piano"]', () => vai('piano'));
  tela.alvo('[data-alvo="caderno"]', (_ev, el) => (aberto(s7, 'caderno') ? vai('caderno') : fechado(el)));
  tela.alvo('[data-alvo="mural"]', (_ev, el) => (aberto(s7, 'som') ? vai('som', { volta: 'casa' }) : fechado(el)));
  tela.alvo('[data-alvo="mala"]', (_ev, el) => (aberto(s7, 'palavras') ? vai('palavra', { palavra: 'MALA', volta: 'casa' }) : fechado(el)));
  tela.alvo('[data-alvo="lata"]', (_ev, el) => (aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LATA', volta: 'casa' }) : fechado(el)));
  tela.alvo('[data-alvo="janela"]', (_ev, el) => (noite && aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LUA', volta: 'casa' }) : aberto(s7, 'palavras') ? enfeite(el) : fechado(el)));
  tela.alvo('[data-alvo="areia"]', (_ev, el) => (aberto(s7, 'areia') ? vai('areia') : fechado(el)));
  tela.alvo('[data-alvo="pinhas"]', (_ev, el) => (aberto(s7, 'pinhas') ? vai('pinhas') : fechado(el)));
  tela.alvo('[data-alvo="arvore"]', (_ev, el) => (aberto(s7, 'arvore') ? vai('arvore') : fechado(el)));
  tela.alvo('[data-alvo="horta"]', (_ev, el) => (aberto(s7, 'horta') ? vai('horta') : fechado(el)));
  tela.alvo('[data-alvo="mesa"]', (_ev, el) => (aberto(s7, 'pinhas') ? vai('pinhas', { mesa: '1' }) : fechado(el)));
  tela.alvo('[data-alvo="fogao"]', (_ev, el) => (aberto(s7, 'cozinha') ? vai('cozinha') : fechado(el)));
  tela.alvo('[data-alvo="ukulele"]', (_ev, el) => (aberto(s7, 'ukulele') ? vai('ukulele') : fechado(el)));
  tela.alvo('[data-alvo="bilhete"]', (_ev, el) => (aberto(s7, 'bilhete') ? vai('bilhete') : fechado(el)));
  tela.alvo('[data-alvo="relogio"]', (_ev, el) => (aberto(s7, 'relogio') ? vai('relogio') : fechado(el)));
  tela.alvo('[data-alvo="sapatilhas"]', (_ev, el) => (aberto(s7, 'palco') ? vai('palco') : fechado(el)));
  tela.alvo('[data-alvo="parquinho"]', (_ev, el) => (aberto(s7, 'parquinho') ? vai('parquinho') : fechado(el)));
  tela.alvo('[data-alvo="pote"]', (_ev, el) => {
    /* as pedrinhas tilintam: uma nota por pedrinha */
    const n = Math.min(estado().pedrinhas, PEDRINHAS.pote);
    if (!n) return tiquinho();
    for (let i = 0; i < n; i++) void esperar(i * 70).then(() => tiquinho());
    mover(el, 0, -3, 150);
    void esperar(170).then(() => mover(el, 0, 0, 260));
  });
  /* a porta: uma aventura só vai direto; mais de uma, ela escolhe entre figuras */
  const TELA_DA_AVENTURA: Record<Aventura, string> = { jardim: 'jardim', arvore: 'arvoregrande', lago: 'lago' };
  const abrirPorta = (el: Element) => {
    const abertas = aventurasAbertas(e);
    if (!jardimAberto || abertas.length === 0) return fechado(el);
    if (abertas.length === 1) return vai('jardim');
    if (svg.querySelector('.escolha')) return;
    const doDia = aventuraDoDia(e);
    const cy = bottom - 150;
    const icone: Record<Aventura, (x: number) => string> = {
      jardim: (x) => coelho(x - 6, cy + 22, 22),
      arvore: (x) => pinha(x, cy + 6, 18, 1) + gato(x + 22, cy + 22, 8, '#c8b8a6', true),
      lago: (x) => `<circle cx="${x}" cy="${cy}" r="38" fill="#9fc3cf"/><ellipse cx="${x}" cy="${cy + 14}" rx="30" ry="7" fill="#dbe7ee" opacity="0.6"/><path d="M${x - 30} ${cy - 16}a12 5 0 1 1 20 3l-10 -2z" fill="#8fae6b"/><path d="M${x - 16} ${cy + 8}q16 12 32 0q-2 -10 -16 -10q-14 0 -16 10z" fill="#fbf8f1"/><path d="M${x + 8} ${cy + 4}q10 -10 4 -22" stroke="#fbf8f1" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${x + 12} ${cy - 20}l8 3l-8 3z" fill="#e8a24a"/>`,
    };
    const g = svgEl(
      `<g class="escolha">${abertas
        .map((a, i) => {
          const x = hx + hw / 2 + (i - (abertas.length - 1) / 2) * 104;
          return `<g data-aventura="${a}"><circle cx="${x}" cy="${cy}" r="44" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/>${icone[a](x)}${a === doDia ? contornoLuz(x, cy, 48, 48) : ''}</g>`;
        })
        .join('')}</g>`,
    );
    svg.appendChild(g);
    tela.alvo('[data-aventura]', (_ev, el2) => vai(TELA_DA_AVENTURA[el2.getAttribute('data-aventura') as Aventura]));
    /* sem escolha em 14 s, vai a do dia */
    void esperar(14000).then(() => {
      if (g.isConnected && tela.el.isConnected) vai(TELA_DA_AVENTURA[doDia]);
    });
  };
  tela.alvo('[data-alvo="porta"]', (_ev, el) => abrirPorta(el));
  tela.alvo('[data-alvo="gato"]', (_ev, el) => {
    ronronar();
    mover(el, 0, -4, 300);
    void esperar(300).then(() => mover(el, 0, 0, 300));
    if (sessao.partes.includes('bichos')) {
      travar(600);
      void esperar(500).then(() => {
        if (tela.el.isConnected) void sessao.irPara('bichos');
      });
    }
  });
  tela.alvo('[data-alvo="coelho"]', (_ev, el) => {
    tiquinho();
    mover(el, 0, -10, 250);
    void esperar(260).then(() => mover(el, 0, 0, 300));
    if (coelhoNovo && !svg.querySelector('[data-nome]')) void darNomeAoCoelho();
  });

  /* o coelhinho aparece na grama e ela dá o nome: três centelhas, cada uma diz um nome */
  const darNomeAoCoelho = async () => {
    travar(600);
    const nomes = ['nome_coelho_1', 'nome_coelho_2', 'nome_coelho_3'];
    const textos = ['Pipoca', 'Nino', 'Flor'];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = nomes
      .map((_id, i) => `<g data-nome="${i}" class="respira" style="animation-delay:${i * 300}ms"><circle cx="${90 + i * 105}" cy="690" r="34" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/>${centelha(90 + i * 105, 690, 24, ['#f2a9c4', '#c6a15b', '#8fae6b'][i]!)}</g>`)
      .join('');
    svg.appendChild(g);
    let escolhido = false;
    for (let i = 0; i < 3; i++) if (temVoz(nomes[i]!)) await falar(nomes[i]!);
    tela.alvo('[data-nome]', (_ev, el) => {
      if (escolhido) return;
      escolhido = true;
      const i = Number(el.getAttribute('data-nome'));
      mudar((x) => {
        x.bichos.coelho = textos[i]!;
      });
      tela.comemorar(172, 590);
      void (async () => {
        if (temVoz(nomes[i]!)) await falar(nomes[i]!);
        g.remove();
        svg.querySelector('[data-alvo="coelho"]')?.classList.remove('respira');
      })();
    });
    await esperar(20000);
    if (!escolhido && tela.el.isConnected) {
      escolhido = true;
      mudar((x) => {
        x.bichos.coelho = textos[0]!;
      });
      g.remove();
    }
  };
  tela.alvo('[data-alvo="estante"]', () => {
    svg.querySelectorAll('.boneca').forEach((b, i) => {
      mover(b, 0, -5, 250 + i * 60);
      void esperar(300 + i * 60).then(() => mover(b, 0, 0, 300));
    });
    if (aberto(s7, 'bonecas')) vai('bonecas');
    else fechado(svg.querySelector('[data-alvo="estante"]')!);
  });
  tela.alvo('[data-alvo="cama"]', (_ev, el) => {
    if (aberto(s7, 'cuidados')) return vai('cama');
    tiquinho();
    mover(el, 0, -2, 200);
    void esperar(220).then(() => mover(el, 0, 0, 300));
  });
  tela.alvo('[data-alvo="pia"]', (_ev, el) => (aberto(s7, 'cuidados') ? vai('dentes') : fechado(el)));
  tela.alvo('[data-alvo="caixa-brinquedos"]', (_ev, el) => (aberto(s7, 'cuidados') ? vai('brinquedos') : fechado(el)));
  tela.alvo('[data-alvo="canteiro"]', (_ev, el) => enfeite(el));
  tela.alvo('[data-alvo="mesa-cozinha"]', (_ev, el) => enfeite(el));
  /* tocar na família: eles acenam e chamam para o fim da sessão (os bichos, ou a despedida) */
  tela.alvo('[data-alvo="tapete"]', () => {
    sininho();
    mudar((x) => marcarBrincada(x, 'familia'));
    tela.comemorar(124, 470);
    const fam = svg.querySelector('[data-alvo="tapete"]');
    if (fam) {
      mover(fam, 0, -4, 250);
      void esperar(280).then(() => mover(fam, 0, 0, 350));
    }
    travar(1500);
    void esperar(1200).then(() => {
      if (tela.el.isConnected) void sessao.avancar();
    });
  });

  /* a casa livre já durou demais: a família chama para os bichos, com o gatinho vindo até ela */
  const chamar = () => {
    if (!sessao.partes.includes('bichos')) return;
    const g = svg.querySelector('[data-alvo="gato"]');
    if (g) mover(g, 0, 0, 400, 1.3);
    void esperar(15000).then(() => {
      if (tela.el.isConnected) void sessao.irPara('bichos');
    });
  };
  const vigia = window.setInterval(() => {
    if (sessao.livreEsgotado()) {
      window.clearInterval(vigia);
      chamar();
    }
  }, 5000);
  tela.aoDestruir(() => window.clearInterval(vigia));
  if (sessao.atual !== 'casa') sessao.atual = 'casa';
  mudar((x) => void x);
  return tela;
}

/**
 * O mural das figuras: um quadro de cortiça com quatro cartinhas presas, como as
 * quatro figuras do som do dia. Um sol, uma uva, um sapo e uma lua, bem simples.
 */
function mural(x: number, y: number): string {
  let s = `<rect x="${x - 28}" y="${y - 24}" width="56" height="48" fill="transparent"/>`;
  s += `<rect x="${x - 22}" y="${y - 17}" width="44" height="34" rx="3" fill="#d9b88f" stroke="#a97e63" stroke-width="2"/>`;
  const cartas: [number, number, string][] = [
    [-10, -8, `<circle r="3.2" fill="#ebd9a8"/>`],
    [10, -8, `<circle cx="-1.6" cy="-1" r="1.6" fill="#8a5aa8"/><circle cx="1.6" cy="-1" r="1.6" fill="#8a5aa8"/><circle cy="1.8" r="1.6" fill="#8a5aa8"/>`],
    [-10, 8, `<ellipse cy="1" rx="3.6" ry="2.4" fill="#8fae6b"/><circle cx="-1.6" cy="-1.4" r="1" fill="#8fae6b"/><circle cx="1.6" cy="-1.4" r="1" fill="#8fae6b"/>`],
    [10, 8, `<path d="M1 -3.4a3.4 3.4 0 1 0 2.4 5.8a2.8 2.8 0 1 1 -2.4 -5.8z" fill="#c6a15b"/>`],
  ];
  for (const [dx, dy, desenho] of cartas) {
    s += `<g transform="translate(${x + dx} ${y + dy})"><rect x="-7" y="-6" width="14" height="12" rx="1.5" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.6"/>${desenho}<circle cy="-6" r="1" fill="#f2a9c4"/></g>`;
  }
  return s;
}

/* ---------- a rotina ilustrada do dia ---------- */

/** Quanto a casa reserva em cima para a rotina (unidades da cena). */
const FOLGA_DA_ROTINA = 90;

/** Um desenho pequeno de cada coisa, feito para raio 10 e ampliado na bandeirinha. */
const MINI: Record<Coisa, (x: number, y: number) => string> = {
  piano: (x, y) => `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="2" fill="#f2a9c4"/><rect x="${x - 6}" y="${y}" width="12" height="3.5" fill="#fbf8f1"/>`,
  caderno: (x, y) => `<rect x="${x - 5}" y="${y - 5.5}" width="10" height="11" rx="1.5" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.8"/><text x="${x}" y="${y + 3}" text-anchor="middle" font-family="Jost, sans-serif" font-size="8" font-weight="500" fill="#f2a9c4">A</text>`,
  som: (x, y) => `<rect x="${x - 7}" y="${y - 6}" width="14" height="12" rx="1.5" fill="#c9a189"/><rect x="${x - 5.5}" y="${y - 4.5}" width="5" height="4" fill="#fbf8f1"/><rect x="${x + 0.5}" y="${y - 4.5}" width="5" height="4" fill="#fbf8f1"/><rect x="${x - 5.5}" y="${y + 0.5}" width="5" height="4" fill="#fbf8f1"/><rect x="${x + 0.5}" y="${y + 0.5}" width="5" height="4" fill="#fbf8f1"/><circle cx="${x - 3}" cy="${y - 2.5}" r="1.3" fill="#ebd9a8"/><circle cx="${x + 3}" cy="${y + 2.5}" r="1.3" fill="#d2463c"/>`,
  palavras: (x, y) => `<rect x="${x - 6}" y="${y - 3}" width="12" height="8" rx="2" fill="#c48f5a"/><rect x="${x - 2.5}" y="${y - 6}" width="5" height="3.5" rx="1" fill="none" stroke="#c48f5a" stroke-width="1.5"/>`,
  areia: (x, y) => `<path d="M${x} ${y - 7}l2 4.6l5 .4l-3.8 3.2l1.2 5l-4.4 -2.7l-4.4 2.7l1.2 -5l-3.8 -3.2l5 -.4z" fill="#ebd9a8" stroke="#c9a189" stroke-width="0.8"/>`,
  pinhas: (x, y) => `<ellipse cx="${x}" cy="${y + 1}" rx="4" ry="6" fill="#a97e63"/><path d="M${x - 3.5} ${y - 1}h7M${x - 3.5} ${y + 2.5}h7" stroke="#6b4a2a" stroke-width="0.8"/>`,
  jardim: (x, y) => `<rect x="${x - 4.5}" y="${y - 6}" width="9" height="12" fill="#6b4126"/><path d="M${x - 1.5} ${y - 5}v10M${x + 1.5} ${y - 5}v10" stroke="#4a2c18" stroke-width="0.6" opacity="0.7"/><rect x="${x - 6}" y="${y - 8}" width="12" height="2" fill="#f6f0e4"/><circle cx="${x + 2.8}" cy="${y + 0.5}" r="0.9" fill="#c6a15b"/>`,
  familia: (x, y) => `<circle cx="${x - 3.5}" cy="${y - 2}" r="2.6" fill="#e2b9a0"/><circle cx="${x + 3.5}" cy="${y - 2}" r="2.6" fill="#e2b9a0"/><path d="M${x - 7} ${y + 6}a3.5 4 0 0 1 7 0zM${x} ${y + 6}a3.5 4 0 0 1 7 0z" fill="#8fae6b"/>`,
  cozinha: (x, y) => `<path d="M${x - 6} ${y - 2}h12v4a4 4 0 0 1 -4 4h-4a4 4 0 0 1 -4 -4z" fill="#d97f74"/><path d="M${x - 8} ${y - 1}h2M${x + 6} ${y - 1}h2" stroke="#d97f74" stroke-width="1.5"/><path d="M${x - 2} ${y - 5}q1 -2 0 -3M${x + 2} ${y - 5}q1 -2 0 -3" stroke="#c9a189" stroke-width="0.8" fill="none"/>`,
  ukulele: (x, y) => `<rect x="${x - 1}" y="${y - 7}" width="2" height="7" fill="#c9a189"/><circle cx="${x}" cy="${y + 1}" r="3" fill="#f2a9c4"/><circle cx="${x}" cy="${y + 4.5}" r="3.8" fill="#f2a9c4"/><circle cx="${x}" cy="${y + 2.5}" r="1" fill="#6e1a27" opacity="0.6"/>`,
  bonecas: (x, y) => `<circle cx="${x}" cy="${y - 3}" r="3" fill="#e2b9a0"/><path d="M${x - 3.4} ${y - 4}a3.5 3.5 0 0 1 6.8 0" fill="#c48f5a"/><path d="M${x - 4.5} ${y + 6}l2 -6h5l2 6z" fill="#f2a9c4"/>`,
  palco: (x, y) => `<path d="M${x - 6} ${y - 1}q0 -5 3.5 -5q3.5 0 3.5 5v4q0 3 -3.5 3q-3.5 0 -3.5 -3zM${x - 1} ${y - 1}q0 -5 3.5 -5q3.5 0 3.5 5v4q0 3 -3.5 3q-3.5 0 -3.5 -3z" fill="#f2a9c4"/><path d="M${x - 2.5} ${y - 6}q-3 -3 -3 -1M${x + 2.5} ${y - 6}q3 -3 3 -1" fill="none" stroke="#f2a9c4" stroke-width="1" stroke-linecap="round"/>`,
  bilhete: (x, y) => `<rect x="${x - 6}" y="${y - 4}" width="12" height="8.5" rx="1" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.8"/><path d="M${x - 6} ${y - 4}l6 4.5l6 -4.5" fill="none" stroke="#c6a15b" stroke-width="0.8"/>`,
  relogio: (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#fbf8f1" stroke="#c9a189" stroke-width="1.4"/><path d="M${x} ${y}V${y - 4}M${x} ${y}h3" stroke="#6e1a27" stroke-width="1.2" stroke-linecap="round"/>`,
  horta: (x, y) => `<path d="M${x - 6} ${y + 4}h12v2.5h-12z" fill="#8a6a4a"/><path d="M${x} ${y + 4}v-6" stroke="#8fae6b" stroke-width="1.4"/><path d="M${x} ${y - 1}q-5 -1 -5 -5q5 0 5 5zM${x} ${y - 1}q5 -1 5 -5q-5 0 -5 5z" fill="#8fae6b"/>`,
  arvore: (x, y) => `<path d="M${x} ${y - 7}l5 7h-2.5l3.5 5h-12l3.5 -5h-2.5z" fill="#4f6b3a"/><rect x="${x - 1}" y="${y + 5}" width="2" height="2.5" fill="#8a6a4a"/>`,
  cuidados: (x, y) => `<rect x="${x - 7}" y="${y + 1}" width="14" height="5" rx="2" fill="#f2a9c4"/><rect x="${x - 7}" y="${y - 2}" width="5" height="3.5" rx="1.5" fill="#fbf8f1" stroke="#c9a189" stroke-width="0.6"/><rect x="${x + 1}" y="${y - 8}" width="2" height="9" rx="1" fill="#7FA5B8"/><rect x="${x}" y="${y - 10}" width="4" height="3" rx="1" fill="#fbf8f1" stroke="#c9a189" stroke-width="0.5"/>`,
  parquinho: (x, y) => `<path d="M${x - 6} ${y + 6}l3 -12l3 12M${x + 6} ${y + 6}l-3 -12l3 12" fill="none" stroke="#c9a189" stroke-width="1.4" stroke-linejoin="round"/><path d="M${x - 4} ${y - 6}h8" stroke="#8a6a4a" stroke-width="1.6" stroke-linecap="round"/><path d="M${x - 1.2} ${y - 6}v6M${x + 1.2} ${y - 6}v6" stroke="#8f6f2c" stroke-width="0.7"/><rect x="${x - 2.6}" y="${y - 0.5}" width="5.2" height="1.4" rx="0.6" fill="#c9a189"/>`,
};

/** Os passos do dia que não são coisa da casa: desenhos pequenos, raio 10. */
const MINI_PASSO: Record<string, (x: number, y: number) => string> = {
  som: (x, y) => MINI.som(x, y),
  roda: (x, y) => `<circle cx="${x}" cy="${y - 3}" r="2.6" fill="#e2b9a0"/><circle cx="${x - 5.5}" cy="${y + 1}" r="2.6" fill="#e2b9a0"/><circle cx="${x + 5.5}" cy="${y + 1}" r="2.6" fill="#e2b9a0"/><path d="M${x - 3} ${y + 7}a3 3 0 0 1 6 0z" fill="#7FA5B8"/><path d="M${x - 8.5} ${y + 7}a3 3 0 0 1 6 0z" fill="#f2a9c4"/><path d="M${x + 2.5} ${y + 7}a3 3 0 0 1 6 0z" fill="#8fae6b"/>`,
  prato: (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.9"/><circle cx="${x - 2.5}" cy="${y - 1.5}" r="1.8" fill="#d2463c"/><circle cx="${x + 2.5}" cy="${y - 1}" r="1.8" fill="#e8a24a"/><circle cx="${x}" cy="${y + 2.5}" r="1.8" fill="#8fae6b"/>`,
  bichos: (x, y) => `<path d="M${x - 6} ${y - 6}l2 6h-3zM${x + 6} ${y - 6}l-2 6h3z" fill="#c8b8a6"/><circle cx="${x}" cy="${y + 1}" r="6" fill="#c8b8a6"/><circle cx="${x - 2.2}" cy="${y}" r="0.9" fill="#1a1c2b"/><circle cx="${x + 2.2}" cy="${y}" r="0.9" fill="#1a1c2b"/><path d="M${x - 1.2} ${y + 2.5}h2.4l-1.2 1.4z" fill="#f2a9c4"/>`,
  despedida: (x, y) => `<path d="M${x - 6} ${y - 1}L${x} ${y - 7}L${x + 6} ${y - 1}V${y + 7}H${x - 6}z" fill="#9fb88c"/><path d="M${x - 7.5} ${y - 0.5}L${x} ${y - 8}L${x + 7.5} ${y - 0.5}z" fill="#cf7f5c"/><rect x="${x - 2}" y="${y + 2}" width="4" height="5" fill="#6b4126"/><path d="M${x + 2} ${y - 7}l1.2 2.2l2.4 .3l-1.8 1.7l.5 2.4l-2.3 -1.2l-2.3 1.2l.5 -2.4l-1.8 -1.7l2.4 -.3z" fill="#c6a15b"/>`,
};

/**
 * A rotina ilustrada do dia, no alto da casa: um quadro como o da parede do
 * jardim, com os passos de hoje em fila. Cheio e dourado, já foi; com o anel
 * de luz, é agora; vazio, ainda vem. A brincadeira do dia é a única cartinha
 * que se toca: a mãozinha mostra onde ela mora na casa.
 */
const PASSOS_QUE_VOLTAM: string[] = ['roda', 'prato', 'som'];

function rotina(passos: PassoDoDia[]): string {
  if (!passos.length) return '';
  const agora = passoDeAgora(passos);
  /* medidas: o desenho (raio 10) cabe folgado no círculo, e o visto fica num selinho na borda */
  const raio = 20;
  const escala = 1.45;
  const y = 112;
  const passo = passos.length > 1 ? Math.min(56, 300 / (passos.length - 1)) : 0;
  const largura = passo * (passos.length - 1);
  const inicio = 195 - largura / 2;
  const feitos = passos.filter((p) => p.feito).length;
  let s = '';
  /* o quadro: uma tábua de papel atrás da fila, para a rotina ler como uma coisa só.
     Opaca: meio transparente, no céu da noite, ela virava um cinza sujo. */
  const folga = raio + 14;
  s += `<rect x="${inicio - folga}" y="${y - raio - 10}" width="${largura + 2 * folga}" height="${2 * raio + 20}" rx="${raio + 10}" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/>`;
  /* o fio que liga os passos: dourado até a última cartinha feita */
  if (passos.length > 1) {
    s += `<path d="M${inicio} ${y}H${inicio + largura}" stroke="#c9a189" stroke-width="1.5" opacity="0.8"/>`;
    if (feitos > 1) s += `<path d="M${inicio} ${y}H${inicio + passo * (feitos - 1)}" stroke="#c6a15b" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  passos.forEach((p, i) => {
    const x = inicio + i * passo;
    const deAgora = p.passo === agora;
    const fundo = p.feito ? '#ebd9a8' : '#fbf8f1';
    const fio = p.feito ? '#c6a15b' : deAgora ? '#f2a9c4' : '#c9a189';
    const desenho = p.coisa ? MINI[p.coisa] : MINI_PASSO[p.passo]!;
    /* roda, prato e som que ainda não foram também se tocam: levam até lá e depois de volta para a casa */
    const pendente = PASSOS_QUE_VOLTAM.includes(p.passo) && !p.feito ? ` data-pendente="${p.passo}" data-cx="${x}" data-cy="${y}"` : '';
    s += `<g${p.coisa ? ` data-varal="${p.coisa}"` : ''}${pendente}>`;
    s += `<circle cx="${x}" cy="${y}" r="${raio}" fill="${fundo}" stroke="${fio}" stroke-width="${deAgora ? 2 : 1.4}"/>`;
    s += `<g opacity="${p.feito || deAgora ? 1 : 0.4}" transform="translate(${x} ${y}) scale(${escala}) translate(${-x} ${-y})">${desenho(x, y)}</g>`;
    /* o visto num selinho na borda de baixo, à direita, sempre no mesmo lugar */
    if (p.feito) {
      const sx = x + raio * 0.7;
      const sy = y + raio * 0.7;
      s += `<circle cx="${sx}" cy="${sy}" r="6.5" fill="#6e1a27" stroke="#fbf8f1" stroke-width="1.5"/><path d="M${sx - 3} ${sy}l2 2.2l4 -4.4" fill="none" stroke="#fbf8f1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (deAgora) s += contornoLuz(x, y, raio + 4, raio + 4);
    s += `</g>`;
  });
  return s;
}
