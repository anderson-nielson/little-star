import { mover, pedrinha, relogioDeAjuda, telaSvg } from './comum';
import { PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { aberto, aventuraDoDia, aventurasAbertas, brincouHoje, COISAS, etapa, luzDaCasa, marcarBrincada, novidade, type Aventura, type Coisa } from '@/core/laco';
import { ceuDaHora, chaveDoDia, COR_DO_DIA, diaDaSemana, estacao } from '@/core/relogio';
import { climaDoDia } from '@/core/festas';
import { estagio, regadoHoje } from '@/core/horta';
import { ir } from '@/core/roteador';
import { cor as tok, esperar, svgEl } from '@/core/util';
import { familia, figurinoDe } from '@/puppet/boneco';
import { arco, caixaDeAreia, centelha, coelho, contornoLuz, flor, gato, nuvem, pinha, pinheiro, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { ronronar, sininho, tiquinho } from '@/audio/synth';
import { Ajuda } from '@/core/ajuda';
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
  /* coisa aberta que ela nunca tocou balança devagar, como o coelhinho novo */
  const novo = (c: Coisa) => (novidade(e, c) ? ' class="respira"' : '');
  const corDia = tok('--' + COR_DO_DIA[diaDaSemana(agora)]!) || '#7FA5B8';
  const corEst = COR_ESTACAO[estacao(agora)]!;
  const clima = climaDoDia(agora, e.pais.festas);
  const hoje = chaveDoDia(agora);
  const s7 = etapa(e);

  const W = 390;
  const hx = 22;
  const hw = 286;
  const top = 140;
  const bottom = 600;
  const y1 = top + 8;
  const y2 = 310;
  const y3 = 470;

  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, W, 200, noite ? '#1b2140' : '#ebcdc3', 5, 0.35);
  s += noite
    ? `<circle cx="70" cy="70" r="14" fill="#ebd9a8" opacity="0.9"/>${centelha(150, 50, 8, '#ebd9a8')}${centelha(230, 40, 6, '#ebd9a8')}`
    : `<circle cx="70" cy="70" r="20" fill="#ebd9a8" opacity="0.9"/>` + nuvem(280, 60, 14) + nuvem(150, 40, 10);
  /* quintal */
  s += `<rect x="0" y="600" width="390" height="180" fill="#c9dbb2"/>` + veu(0, 600, W, 180, '#8fae6b', 5, 0.32);
  /* a estação e as festas mudam o quintal devagar */
  if (clima.folhas) for (let i = 0; i < 7; i++) s += `<path d="M${30 + i * 52} ${612 + (i % 3) * 8}q8 -12 16 0q-8 12 -16 0z" fill="${i % 2 ? '#d97f74' : '#e8a24a'}" opacity="0.85"/>`;
  if (clima.festa === 'junina') {
    s += `<path d="M${hx + hw} ${top + 30}Q300 260 350 420" fill="none" stroke="#c9a189" stroke-width="1.5"/>`;
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const bx = hx + hw + (350 - hx - hw) * t;
      const by = top + 30 + (420 - top - 30) * t * t;
      s += `<path d="M${bx - 6} ${by}h12l-6 12z" fill="${['#d2463c', '#ebd9a8', '#7FA5B8', '#f2a9c4', '#8fae6b', '#e8a24a'][i]}"/>`;
    }
    s += `<g class="fogueira"><path d="M230 700l30 -10l30 10z" fill="#8a6a4a"/><path d="M245 700q0 -30 15 -44q15 14 15 44z" fill="#e8a24a" opacity="0.9"/><path d="M252 700q0 -18 8 -28q8 10 8 28z" fill="#ebd9a8" opacity="0.9"/></g>`;
  }
  if (clima.festa === 'lanterna') for (let i = 0; i < 4; i++) s += `<g class="respira" style="animation-delay:${i * 400}ms"><path d="M${hx + 40 + i * 70} ${top + 8}v10" stroke="#c9a189" stroke-width="1.5"/><rect x="${hx + 32 + i * 70}" y="${top + 18}" width="16" height="20" rx="6" fill="#e8a24a" opacity="0.9"/><rect x="${hx + 36 + i * 70}" y="${top + 24}" width="8" height="8" rx="3" fill="#ebd9a8"/></g>`;
  if (clima.velas > 0) {
    s += `<path d="M60 700m0 0c-20 -6 -24 -30 -4 -36c22 -6 36 12 24 28c-10 14 -30 8 -28 -6c2 -10 14 -8 14 -2" fill="none" stroke="#35564d" stroke-width="5" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) {
      const vx = 42 + i * 14;
      s += `<rect x="${vx - 3}" y="${672 - (i % 2) * 8}" width="6" height="16" fill="#ebd9a8"/>`;
      if (i < clima.velas) s += `<ellipse cx="${vx}" cy="${668 - (i % 2) * 8}" rx="3" ry="5" fill="#e8a24a" opacity="0.9"/>`;
    }
  }
  /* casa */
  s += `<path d="M${hx - 14} ${top + 10}L${hx + hw / 2} ${top - 60}L${hx + hw + 14} ${top + 10}z" fill="#4f6b3a"/>`;
  s += `<rect x="${hx}" y="${top}" width="${hw}" height="${bottom - top}" fill="#8fae6b"/>` + veu(hx, top, hw, bottom - top, '#c9dbb2', 4, 0.22);
  /* quarto rosa */
  s += `<rect x="${hx + 10}" y="${y1}" width="${hw - 20}" height="${y2 - y1 - 8}" fill="#f6e3dc"/>` + veu(hx + 10, y1, hw - 20, y2 - y1, '#ebcdc3', 3, 0.3);
  s += `<line x1="${hx + 10}" y1="${y2 - 8}" x2="${hx + hw - 10}" y2="${y2 - 8}" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  /* janela do quarto: céu da hora, lua e estrelas das noites bem dormidas */
  s += `<g data-alvo="janela">${arco(hx + 130, y1 + 42, 56, 74, CEU[ceu]!)}`;
  for (let i = 0; i < Math.min(e.estrelas, 6); i++) s += centelha(hx + 140 + (i % 3) * 18, y1 + 58 + Math.floor(i / 3) * 14, 7, '#c6a15b');
  if (noite) s += `<path d="M${hx + 170} ${y1 + 62}a6 6 0 1 0 5 9a5 5 0 1 1-5-9z" fill="#ebd9a8"/>`;
  s += `</g>`;
  /* a porta do quarto com o nome dela, e as letras do nome que ela já traçou */
  s += `<rect x="${hx + 16}" y="${y1 + 40}" width="46" height="${y2 - 8 - (y1 + 40)}" rx="6" fill="#f2a9c4"/>`;
  const nome = 'STELLA';
  const temNome = [...nome].every((l) => e.letras.includes(l));
  if (temNome) s += `<text x="${hx + 39}" y="${y1 + 64}" text-anchor="middle" font-family="Jost, sans-serif" font-size="10" font-weight="500" letter-spacing="1.5" fill="#6e1a27">${nome}</text>`;
  /* as letras na parede */
  e.letras.slice(0, 9).forEach((l, i) => {
    s += `<text x="${hx + 78 + (i % 5) * 20}" y="${y1 + 34 + Math.floor(i / 5) * 22}" font-family="Jost, sans-serif" font-size="20" font-weight="500" fill="#f2a9c4">${l}</text>`;
  });
  /* o ukulele e a lira na parede, o envelope do bilhetinho na porta do quarto */
  if (aberto(s7, 'ukulele')) s += `<g data-alvo="ukulele"${novo('ukulele')}><rect x="${hx + 62}" y="${y1 + 54}" width="38" height="48" fill="transparent"/><rect x="${hx + 79}" y="${y1 + 58}" width="6" height="22" rx="2" fill="#c9a189"/><rect x="${hx + 78}" y="${y1 + 56}" width="8" height="6" rx="2" fill="#a97e63"/><circle cx="${hx + 82}" cy="${y1 + 82}" r="6.5" fill="#f2a9c4"/><circle cx="${hx + 82}" cy="${y1 + 91}" r="8.5" fill="#f2a9c4"/><circle cx="${hx + 82}" cy="${y1 + 86}" r="2.5" fill="#6e1a27" opacity="0.6"/></g>`;
  if (aberto(s7, 'lira')) s += `<g data-alvo="lira"${novo('lira')}><rect x="${hx + 100}" y="${y1 + 54}" width="40" height="48" fill="transparent"/><path d="M${hx + 108} ${y1 + 96}V${y1 + 74}a10 10 0 0 1 20 0v22" fill="none" stroke="#c9a189" stroke-width="3"/><path d="M${hx + 112} ${y1 + 70}v24M${hx + 118} ${y1 + 68}v28M${hx + 124} ${y1 + 70}v24" stroke="#c6a15b" stroke-width="1"/></g>`;
  if (aberto(s7, 'bilhete') && e.letras.length > 0) s += `<g data-alvo="bilhete"${novo('bilhete')}><circle cx="${hx + 39}" cy="${y1 + 110}" r="26" fill="transparent"/><rect x="${hx + 27}" y="${y1 + 102}" width="24" height="16" rx="2" fill="#fbf8f1" stroke="#c6a15b"/><path d="M${hx + 27} ${y1 + 102}l12 9l12 -9" fill="none" stroke="#c6a15b"/></g>`;
  /* o pote de pedrinhas no chão do quarto, e as medalhas de feltro na parede da sala */
  if (e.pais.pedrinhas) {
    /* na prateleira de baixo da estante, no lugar que sobra ao lado das bonecas */
    s += `<g data-alvo="pote"><circle cx="${hx + 262}" cy="${y1 + 88}" r="26" fill="transparent"/><path d="M${hx + 252} ${y1 + 80}h20v12a10 10 0 0 1 -20 0z" fill="#dbe7ee" opacity="0.55" stroke="#c6a15b" stroke-width="1"/><rect x="${hx + 254}" y="${y1 + 76}" width="16" height="4" rx="2" fill="#c9a189"/>`;
    const n = Math.min(e.pedrinhas, PEDRINHAS.pote);
    for (let i = 0; i < n; i++) s += pedrinha(hx + 256 + (i % 4) * 4, y1 + 98 - Math.floor(i / 4) * 4.5, 2.2, i);
    s += `</g>`;
  }
  /* cama, com o gatinho dormindo */
  s += `<g data-alvo="cama"><rect x="${hx + 70}" y="${y1 + 118}" width="70" height="26" rx="6" fill="#fbf8f1"/><rect x="${hx + 70}" y="${y1 + 126}" width="70" height="18" rx="4" fill="#f2a9c4" opacity="0.8"/><rect x="${hx + 66}" y="${y1 + 104}" width="8" height="40" rx="2" fill="#c9a189"/><rect x="${hx + 136}" y="${y1 + 112}" width="8" height="32" rx="2" fill="#c9a189"/>`;
  s += `</g>`;
  /* lembranças: colcha, travesseiro, prateleira */
  const lembr = e.lembrancas.length;
  if (lembr > 0) s += `<ellipse cx="${hx + 84}" cy="${y1 + 122}" rx="10" ry="5" fill="#fbf8f1" stroke="#ebcdc3"/>`;
  /* estante de bonecas */
  s += `<g data-alvo="estante"${novo('bonecas')}><rect x="${hx + 200}" y="${y1 + 40}" width="76" height="60" fill="none" stroke="#c9a189" stroke-width="2"/><line x1="${hx + 200}" y1="${y1 + 70}" x2="${hx + 276}" y2="${y1 + 70}" stroke="#c9a189" stroke-width="2"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(hx + 214 + (i % 3) * 24, y1 + 68 + Math.floor(i / 3) * 30, 22, i, figurinoDe(e.figurinos[String(i)])).svg}</g>`;
  s += `</g>`;
  /* mesa da estação com as pinhas dela */
  s += `<g data-alvo="mesa"><rect x="${hx + 206}" y="${y1 + 128}" width="66" height="6" rx="2" fill="#c9a189"/><rect x="${hx + 206}" y="${y1 + 122}" width="66" height="8" fill="${corEst}" opacity="0.85"/><line x1="${hx + 212}" y1="${y1 + 134}" x2="${hx + 212}" y2="${y1 + 146}" stroke="#c9a189" stroke-width="3"/><line x1="${hx + 266}" y1="${y1 + 134}" x2="${hx + 266}" y2="${y1 + 146}" stroke="#c9a189" stroke-width="3"/>`;
  e.pinhas.slice(0, 8).forEach((p) => {
    s += pinha(hx + 210 + p.x * 58, y1 + 124, 4, p.tipo);
  });
  s += `</g>`;
  /* piano rosa */
  s += `<g data-alvo="piano"${novo('piano')}><rect x="${hx + 150}" y="${y1 + 104}" width="44" height="42" rx="4" fill="#f2a9c4"/><rect x="${hx + 150}" y="${y1 + 122}" width="44" height="10" fill="#fbf8f1"/><path d="M${hx + 156} ${y1 + 122}v10M${hx + 162} ${y1 + 122}v10M${hx + 168} ${y1 + 122}v10M${hx + 174} ${y1 + 122}v10M${hx + 180} ${y1 + 122}v10M${hx + 186} ${y1 + 122}v10" stroke="#ebcdc3" stroke-width="1"/></g>`;
  /* caderno na mesinha */
  if (aberto(s7, 'caderno')) s += `<g data-alvo="caderno"${novo('caderno')}><rect x="${hx + 96}" y="${y1 + 150}" width="40" height="6" fill="#c9a189"/><rect x="${hx + 104}" y="${y1 + 138}" width="26" height="14" rx="2" fill="#fbf8f1" stroke="#c6a15b"/><text x="${hx + 117}" y="${y1 + 149}" text-anchor="middle" font-family="Jost, sans-serif" font-size="10" fill="#f2a9c4" font-weight="500">${(letras as { id: string }[])[Math.min(e.letraIndice, 8)]?.id ?? 'A'}</text></g>`;
  /* mala no chão (palavra) */
  if (aberto(s7, 'palavras')) s += `<g data-alvo="mala"${novo('palavras')}><rect x="${hx + 22}" y="${y1 + 132}" width="30" height="20" rx="4" fill="#c48f5a"/><rect x="${hx + 31}" y="${y1 + 127}" width="12" height="6" rx="2" fill="none" stroke="#c48f5a" stroke-width="3"/></g>`;
  /* o gatinho, no pé do piano */
  if (e.bichos.gato) s += `<g data-alvo="gato">${gato(hx + 156, y1 + 156, 10, '#c8b8a6', true)}</g>`;
  /* a Stella no quarto */
  s += `<g class="stella">${familia.stella(hx + 118, y2 - 10, 56, 'acena').svg}</g>`;
  /* sala e cozinha */
  s += `<rect x="${hx + 10}" y="${y2}" width="${hw / 2 - 12}" height="${y3 - y2 - 8}" fill="#c9dbb2" opacity="0.7"/>`;
  s += `<rect x="${hx + hw / 2 + 2}" y="${y2}" width="${hw / 2 - 12}" height="${y3 - y2 - 8}" fill="#fbf8f1" opacity="0.6"/>`;
  s += `<line x1="${hx + hw / 2 - 3}" y1="${y2}" x2="${hx + hw / 2 - 3}" y2="${y3 - 8}" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  s += `<line x1="${hx + 10}" y1="${y3 - 8}" x2="${hx + hw - 10}" y2="${y3 - 8}" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  for (let i = 0; i < Math.min(e.medalhas, 7); i++) s += `<g class="medalha"><path d="M${hx + 62 + i * 16} ${y2 + 8}l-4 12h8z" fill="#f2a9c4"/><circle cx="${hx + 62 + i * 16}" cy="${y2 + 24}" r="6" fill="#c6a15b"/><circle cx="${hx + 62 + i * 16}" cy="${y2 + 24}" r="3" fill="#ebd9a8"/></g>`;
  /* o relógio da sala: ela está aprendendo a ver as horas */
  if (aberto(s7, 'relogio')) {
    const hh = agora.getHours() % 12;
    const ang = ((hh + agora.getMinutes() / 60) * 30 - 90) * (Math.PI / 180);
    s += `<g data-alvo="relogio"${novo('relogio')}><circle cx="${hx + 34}" cy="${y2 + 30}" r="28" fill="transparent"/><circle cx="${hx + 34}" cy="${y2 + 30}" r="15" fill="#fbf8f1" stroke="#c9a189" stroke-width="2.5"/><path d="M${hx + 34} ${y2 + 30}V${y2 + 19}" stroke="#c6a15b" stroke-width="1.5"/><path d="M${hx + 34} ${y2 + 30}L${(hx + 34 + Math.cos(ang) * 8).toFixed(1)} ${(y2 + 30 + Math.sin(ang) * 8).toFixed(1)}" stroke="#6e1a27" stroke-width="2.5" stroke-linecap="round"/></g>`;
  }
  s += `<g data-alvo="tapete"><ellipse cx="${hx + 80}" cy="${y3 - 22}" rx="62" ry="14" fill="#ebcdc3" opacity="0.8"/>`;
  s += familia.mae(hx + 40, y3 - 20, 96).svg + familia.pai(hx + 120, y3 - 20, 104, 'parado', { dir: -1 }).svg + familia.theo(hx + 82, y3 - 22, 74, 'acena').svg + `</g>`;
  /* cozinha: fogão e mesa com a toalha do dia */
  s += `<g data-alvo="fogao"${novo('cozinha')}><circle cx="${hx + hw / 2 + 34}" cy="${y3 - 37}" r="34" fill="transparent"/><rect x="${hx + hw / 2 + 14}" y="${y3 - 60}" width="40" height="46" rx="3" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/><circle cx="${hx + hw / 2 + 26}" cy="${y3 - 50}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/><circle cx="${hx + hw / 2 + 42}" cy="${y3 - 50}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/>`;
  if (e.colheita.length) s += `<path d="M${hx + hw / 2 + 58} ${y3 - 24}q10 -4 20 0l-2 10h-16z" fill="#c9a189"/>` + e.colheita.slice(0, 3).map((c, i) => `<circle cx="${hx + hw / 2 + 62 + i * 6}" cy="${y3 - 26}" r="3" fill="${{ cenoura: '#e8a24a', tomate: '#d2463c', milho: '#ebd9a8', alface: '#8fae6b' }[c]}"/>`).join('');
  s += `</g>`;
  s += `<g data-alvo="mesa-cozinha"><rect x="${hx + hw / 2 + 70}" y="${y3 - 52}" width="60" height="10" rx="2" fill="${corDia}"/><rect x="${hx + hw / 2 + 70}" y="${y3 - 42}" width="60" height="4" fill="#c9a189"/><line x1="${hx + hw / 2 + 76}" y1="${y3 - 38}" x2="${hx + hw / 2 + 76}" y2="${y3 - 14}" stroke="#c9a189" stroke-width="3"/><line x1="${hx + hw / 2 + 124}" y1="${y3 - 38}" x2="${hx + hw / 2 + 124}" y2="${y3 - 14}" stroke="#c9a189" stroke-width="3"/><ellipse cx="${hx + hw / 2 + 100}" cy="${y3 - 54}" rx="12" ry="4" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/>`;
  s += `<g data-alvo="lata"><rect x="${hx + hw / 2 + 20}" y="${y3 - 76}" width="12" height="16" rx="2" fill="#b6a58c"/></g></g>`;
  /* térreo e porta */
  s += `<rect x="${hx + 10}" y="${y3}" width="${hw - 20}" height="${bottom - y3 - 2}" fill="#c9dbb2" opacity="0.5"/>`;
  const jardimAberto = aberto(s7, 'jardim');
  s += `<g data-alvo="porta"${novo('jardim')}><path d="M${hx + hw / 2 - 34} ${bottom}v-66a34 34 0 0 1 68 0v66z" fill="#6e1a27"/><path d="M${hx + hw / 2 - 26} ${bottom}v-60a26 26 0 0 1 52 0v60z" fill="#ebcdc3" opacity="0.35"/><circle cx="${hx + hw / 2 + 16}" cy="${bottom - 30}" r="3" fill="#c6a15b"/>`;
  if (noite) s += `<path d="M${hx + hw / 2} ${bottom - 84}a8 8 0 1 0 7 12a6 6 0 1 1-7-12z" fill="#ebd9a8"/>`;
  if (clima.festa === 'primavera') for (let i = 0; i < 5; i++) s += flor(hx + hw / 2 - 40 + i * 20, bottom - 70 + Math.abs(i - 2) * 6, ['#f2a9c4', '#ebd9a8', '#d97f74', '#ebd9a8', '#f2a9c4'][i]!, 6);
  s += `</g>`;
  const coelhoNovo = !e.bichos.coelho && aberto(s7, 'coelho');
  if (e.bichos.coelho || coelhoNovo) s += `<g data-alvo="coelho" class="${coelhoNovo ? 'respira' : ''}">${coelho(hx + hw / 2 + 50, bottom, coelhoNovo ? 20 : 16)}</g>`;
  /* quintal: canteiro com as flores dela, caixa de areia, pinheiro */
  s += `<g data-alvo="canteiro"><ellipse cx="120" cy="650" rx="70" ry="10" fill="#8a6a4a" opacity="0.55"/>`;
  e.flores.slice(-8).forEach((fl, i) => {
    s += flor(66 + i * 15, 648 + (i % 2) * 3, COR_FLOR[fl.cor] ?? '#f2a9c4', fl.girassol ? 11 : 9, fl.girassol);
  });
  s += `</g>`;
  if (aberto(s7, 'areia')) s += `<g data-alvo="areia"${novo('areia')}>${caixaDeAreia(110, 720, 52)}<path d="M96 722q10 -8 20 0" fill="none" stroke="#d9c69a" stroke-width="2"/><rect x="128" y="710" width="10" height="12" rx="2" fill="#f2a9c4"/>${clima.conchas ? `<path d="M104 730q4 -6 8 0q-4 4 -8 0zM118 734q4 -6 8 0q-4 4 -8 0z" fill="#fbf8f1" stroke="#c6a15b" stroke-width="0.8"/>` : ''}</g>`;
  /* a horta: quatro covinhas que mostram o que está crescendo */
  if (aberto(s7, 'horta')) {
    s += `<g data-alvo="horta"${novo('horta')}><circle cx="236" cy="670" r="38" fill="transparent"/><path d="M192 648h88M192 660h88" stroke="#c9a189" stroke-width="2.5"/><path d="M198 642v22M236 642v22M274 642v22" stroke="#c9a189" stroke-width="3" stroke-linecap="round"/><rect x="192" y="664" width="88" height="16" rx="6" fill="#8a6a4a" opacity="0.75"/>`;
    e.horta.forEach((c, i) => {
      const cx = 202 + i * 23;
      if (!c) return;
      const est = estagio(c, hoje);
      const cor = { cenoura: '#e8a24a', tomate: '#d2463c', milho: '#ebd9a8', alface: '#8fae6b' }[c.semente];
      s += est === 'semente' ? `<circle cx="${cx}" cy="666" r="2" fill="#6b4a2a"/>` : `<path d="M${cx} 668v-${est === 'broto' ? 6 : 10}" stroke="#8fae6b" stroke-width="2"/>`;
      if (est === 'pronta') s += `<circle cx="${cx}" cy="656" r="4" fill="${cor}"/>`;
      if (!regadoHoje(c, hoje) && est !== 'pronta') s += `<circle cx="${cx + 5}" cy="652" r="2" fill="#9fc3cf"/>`;
    });
    s += `</g>`;
  }
  s += `<g data-alvo="arvore">${pinheiro(350, 745, 330)}`;
  if (clima.flores) s += flor(322, 640, '#f2a9c4', 5) + flor(372, 600, '#ebd9a8', 5) + flor(340, 560, '#f2a9c4', 4);
  if (clima.fitinha) s += `<path d="M330 700q20 -10 40 0" fill="none" stroke="#7FA5B8" stroke-width="3"/>`;
  s += `</g><g data-alvo="pinhas"${novo('pinhas')}><circle cx="340" cy="758" r="36" fill="transparent"/>`;
  if (aberto(s7, 'pinhas')) s += pinha(316, 752, 6) + pinha(368, 758, 6, 1) + pinha(340, 768, 5, 2);
  s += `</g>`;
  /* onde cada coisa mora, para a luz e para a centelha do que já foi hoje */
  const alvoDaCoisa: Record<Coisa, [number, number, number, number]> = {
    piano: [hx + 172, y1 + 124, 28, 28],
    caderno: [hx + 117, y1 + 146, 26, 16],
    palavras: [hx + 37, y1 + 140, 24, 18],
    areia: [110, 720, 58, 36],
    pinhas: [326, 750, 40, 22],
    jardim: [hx + hw / 2, bottom - 36, 44, 44],
    familia: [hx + 80, y3 - 50, 70, 60],
    cozinha: [hx + hw / 2 + 34, y3 - 40, 32, 34],
    ukulele: [hx + 82, y1 + 78, 22, 26],
    lira: [hx + 120, y1 + 80, 22, 26],
    bonecas: [hx + 238, y1 + 70, 42, 34],
    bilhete: [hx + 39, y1 + 110, 18, 14],
    relogio: [hx + 34, y2 + 30, 20, 20],
    horta: [236, 662, 48, 22],
    arvore: [350, 600, 36, 60],
  };
  /* contorno de luz onde ela ainda pode ir; centelha parada no que já brincou hoje */
  const luz = luzEm ? alvoDaCoisa[luzEm] : null;
  if (luz) s += `<g class="luz-do-dia">${contornoLuz(...luz)}</g>`;
  for (const c of COISAS) {
    if (!brincouHoje(e, c) || c === luzEm) continue;
    const [cx, cy, rx, ry] = alvoDaCoisa[c];
    s += `<g class="feito-hoje">${centelha(cx + rx - 4, cy - ry + 4, 12, '#c6a15b')}</g>`;
  }

  const tela = telaSvg(s, { lua: true });
  const svg = tela.svg;
  tocarFundo(noite ? 'ninar_brahms' : e.sessoes % 2 ? 'gymnopedie' : 'preludio_bach', { bpm: noite ? 60 : undefined });

  /* ajuda: a mãozinha aponta a brincadeira do dia depois de 6 s parada */
  const ajuda = new Ajuda((n) => {
    if (n >= 1 && luz) tela.mao([luz[0] + 10, luz[1] + 10]);
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
  const COISA_DA_TELA: Record<string, Coisa> = { piano: 'piano', caderno: 'caderno', palavra: 'palavras', areia: 'areia', pinhas: 'pinhas', horta: 'horta', ukulele: 'ukulele', lira: 'lira', bilhete: 'bilhete', relogio: 'relogio', cozinha: 'cozinha', bonecas: 'bonecas', arvore: 'arvore', jardim: 'jardim', arvoregrande: 'jardim', lago: 'jardim' };
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
  tela.alvo('[data-alvo="caderno"]', () => vai('caderno'));
  tela.alvo('[data-alvo="mala"]', () => vai('palavra', { palavra: 'MALA', volta: 'casa' }));
  tela.alvo('[data-alvo="lata"]', (_ev, el) => (aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LATA', volta: 'casa' }) : fechado(el)));
  tela.alvo('[data-alvo="janela"]', (_ev, el) => (noite && aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LUA', volta: 'casa' }) : aberto(s7, 'palavras') ? enfeite(el) : fechado(el)));
  tela.alvo('[data-alvo="areia"]', () => vai('areia'));
  tela.alvo('[data-alvo="pinhas"]', (_ev, el) => (aberto(s7, 'pinhas') ? vai('pinhas') : fechado(el)));
  tela.alvo('[data-alvo="arvore"]', (_ev, el) => (aberto(s7, 'arvore') ? vai('arvore') : fechado(el)));
  tela.alvo('[data-alvo="horta"]', () => vai('horta'));
  tela.alvo('[data-alvo="mesa"]', (_ev, el) => (aberto(s7, 'pinhas') ? vai('pinhas', { mesa: '1' }) : fechado(el)));
  tela.alvo('[data-alvo="fogao"]', (_ev, el) => (aberto(s7, 'cozinha') ? vai('cozinha') : fechado(el)));
  tela.alvo('[data-alvo="ukulele"]', () => vai('ukulele'));
  tela.alvo('[data-alvo="lira"]', () => vai('lira'));
  tela.alvo('[data-alvo="bilhete"]', () => vai('bilhete'));
  tela.alvo('[data-alvo="relogio"]', () => vai('relogio'));
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
      lago: (x) => `<path d="M${x - 16} ${cy + 8}q16 12 32 0q-2 -10 -16 -10q-14 0 -16 10z" fill="#fbf8f1"/><path d="M${x + 8} ${cy + 4}q10 -10 4 -22" stroke="#fbf8f1" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${x + 12} ${cy - 20}l8 3l-8 3z" fill="#e8a24a"/>`,
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
      void esperar(500).then(() => sessao.irPara('bichos'));
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
      tela.comemorar(hx + hw / 2 + 50, bottom - 60);
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
    tiquinho();
    mover(el, 0, -2, 200);
    void esperar(220).then(() => mover(el, 0, 0, 300));
  });
  tela.alvo('[data-alvo="canteiro"]', (_ev, el) => enfeite(el));
  tela.alvo('[data-alvo="mesa-cozinha"]', (_ev, el) => enfeite(el));
  /* tocar na família: eles acenam e chamam para o fim da sessão (os bichos, ou a despedida) */
  tela.alvo('[data-alvo="tapete"]', () => {
    sininho();
    mudar((x) => marcarBrincada(x, 'familia'));
    tela.comemorar(hx + 80, y3 - 90);
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
