import { mover, relogioDeAjuda, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { aberto, brincadeiraDoDia, type Brincadeira } from '@/core/laco';
import { ceuDaHora, COR_DO_DIA, diaDaSemana, estacao } from '@/core/relogio';
import { ir } from '@/core/roteador';
import { cor as tok, esperar } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, caixaDeAreia, centelha, coelho, contornoLuz, flor, gato, nuvem, pinha, pinheiro, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { ronronar, tiquinho } from '@/audio/synth';
import { Ajuda } from '@/core/ajuda';
import { travar } from '@/core/toque';
import letras from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };
const COR_ESTACAO: Record<string, string> = { verao: '#ebd9a8', outono: '#e8a24a', inverno: '#7FA5B8', primavera: '#f2a9c4' };
const COR_FLOR: Record<string, string> = { vermelho: '#d2463c', laranja: '#e8a24a', amarelo: '#ebd9a8', verde: '#8fae6b', roxo: '#8a5aa8', marrom: '#c48f5a' };

/**
 * A casa verde inteira numa tela, sem rolagem. É o menu: tudo é um objeto
 * que se toca. A brincadeira do dia pulsa com contorno de luz.
 */
export function telaCasa(): Tela {
  const e = estado();
  const agora = sessao.agora();
  const ceu = ceuDaHora(agora);
  const noite = ceu === 'ceu-noite';
  const brinc = brincadeiraDoDia(e, agora);
  const corDia = tok('--' + COR_DO_DIA[diaDaSemana(agora)]!) || '#7FA5B8';
  const corEst = COR_ESTACAO[estacao(agora)]!;
  const s7 = e.sessoes;

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
  /* cama, com o gatinho dormindo */
  s += `<g data-alvo="cama"><rect x="${hx + 70}" y="${y1 + 118}" width="70" height="26" rx="6" fill="#fbf8f1"/><rect x="${hx + 70}" y="${y1 + 126}" width="70" height="18" rx="4" fill="#f2a9c4" opacity="0.8"/><rect x="${hx + 66}" y="${y1 + 104}" width="8" height="40" rx="2" fill="#c9a189"/><rect x="${hx + 136}" y="${y1 + 112}" width="8" height="32" rx="2" fill="#c9a189"/>`;
  s += `</g>`;
  /* lembranças: colcha, travesseiro, prateleira */
  const lembr = e.lembrancas.length;
  if (lembr > 0) s += `<ellipse cx="${hx + 84}" cy="${y1 + 122}" rx="10" ry="5" fill="#fbf8f1" stroke="#ebcdc3"/>`;
  /* estante de bonecas */
  s += `<g data-alvo="estante"><rect x="${hx + 200}" y="${y1 + 40}" width="76" height="60" fill="none" stroke="#c9a189" stroke-width="2"/><line x1="${hx + 200}" y1="${y1 + 70}" x2="${hx + 276}" y2="${y1 + 70}" stroke="#c9a189" stroke-width="2"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(hx + 214 + (i % 3) * 24, y1 + 68 + Math.floor(i / 3) * 30, 22, i).svg}</g>`;
  s += `</g>`;
  /* mesa da estação com as pinhas dela */
  s += `<g data-alvo="mesa"><rect x="${hx + 206}" y="${y1 + 128}" width="66" height="6" rx="2" fill="#c9a189"/><rect x="${hx + 206}" y="${y1 + 122}" width="66" height="8" fill="${corEst}" opacity="0.85"/><line x1="${hx + 212}" y1="${y1 + 134}" x2="${hx + 212}" y2="${y1 + 146}" stroke="#c9a189" stroke-width="3"/><line x1="${hx + 266}" y1="${y1 + 134}" x2="${hx + 266}" y2="${y1 + 146}" stroke="#c9a189" stroke-width="3"/>`;
  e.pinhas.slice(0, 8).forEach((p) => {
    s += pinha(hx + 210 + p.x * 58, y1 + 124, 4, p.tipo);
  });
  s += `</g>`;
  /* piano rosa */
  s += `<g data-alvo="piano"><rect x="${hx + 150}" y="${y1 + 104}" width="44" height="42" rx="4" fill="#f2a9c4"/><rect x="${hx + 150}" y="${y1 + 122}" width="44" height="10" fill="#fbf8f1"/><path d="M${hx + 156} ${y1 + 122}v10M${hx + 162} ${y1 + 122}v10M${hx + 168} ${y1 + 122}v10M${hx + 174} ${y1 + 122}v10M${hx + 180} ${y1 + 122}v10M${hx + 186} ${y1 + 122}v10" stroke="#ebcdc3" stroke-width="1"/></g>`;
  /* caderno na mesinha */
  if (aberto(s7, 'caderno')) s += `<g data-alvo="caderno"><rect x="${hx + 96}" y="${y1 + 150}" width="40" height="6" fill="#c9a189"/><rect x="${hx + 104}" y="${y1 + 138}" width="26" height="14" rx="2" fill="#fbf8f1" stroke="#c6a15b"/><text x="${hx + 117}" y="${y1 + 149}" text-anchor="middle" font-family="Jost, sans-serif" font-size="10" fill="#f2a9c4" font-weight="500">${(letras as { id: string }[])[Math.min(e.letraIndice, 8)]?.id ?? 'A'}</text></g>`;
  /* mala no chão (palavra) */
  if (aberto(s7, 'palavras')) s += `<g data-alvo="mala"><rect x="${hx + 22}" y="${y1 + 132}" width="30" height="20" rx="4" fill="#c48f5a"/><rect x="${hx + 31}" y="${y1 + 127}" width="12" height="6" rx="2" fill="none" stroke="#c48f5a" stroke-width="3"/></g>`;
  /* o gatinho, no pé do piano */
  if (e.bichos.gato) s += `<g data-alvo="gato">${gato(hx + 156, y1 + 156, 10, '#c8b8a6', true)}</g>`;
  /* a Stella no quarto */
  s += `<g class="stella">${familia.stella(hx + 118, y2 - 10, 56, 'acena').svg}</g>`;
  /* sala e cozinha */
  s += `<rect x="${hx + 10}" y="${y2}" width="${hw / 2 - 12}" height="${y3 - y2 - 8}" fill="#c9dbb2" opacity="0.7"/>`;
  s += `<rect x="${hx + hw / 2 + 2}" y="${y2}" width="${hw / 2 - 12}" height="${y3 - y2 - 8}" fill="#fbf8f1" opacity="0.6"/>`;
  s += `<line x1="${hx + hw / 2 - 3}" y1="${y2}" x2="${hx + hw / 2 - 3}" y2="${y3 - 8}" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  s += `<line x1="${hx + 10}" y1="${y3 - 8}" x2="${hx + hw - 10}" y2="${y3 - 8}" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  s += `<g data-alvo="tapete"><ellipse cx="${hx + 80}" cy="${y3 - 22}" rx="62" ry="14" fill="#ebcdc3" opacity="0.8"/>`;
  s += familia.mae(hx + 40, y3 - 20, 96).svg + familia.pai(hx + 120, y3 - 20, 104, 'parado', { dir: -1 }).svg + familia.theo(hx + 82, y3 - 22, 74, 'acena').svg + `</g>`;
  /* cozinha: fogão e mesa com a toalha do dia */
  s += `<rect x="${hx + hw / 2 + 14}" y="${y3 - 60}" width="40" height="46" rx="3" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/><circle cx="${hx + hw / 2 + 26}" cy="${y3 - 50}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/><circle cx="${hx + hw / 2 + 42}" cy="${y3 - 50}" r="5" fill="none" stroke="#1a1c2b" stroke-width="1.2" opacity="0.5"/>`;
  s += `<g data-alvo="mesa-cozinha"><rect x="${hx + hw / 2 + 70}" y="${y3 - 52}" width="60" height="10" rx="2" fill="${corDia}"/><rect x="${hx + hw / 2 + 70}" y="${y3 - 42}" width="60" height="4" fill="#c9a189"/><line x1="${hx + hw / 2 + 76}" y1="${y3 - 38}" x2="${hx + hw / 2 + 76}" y2="${y3 - 14}" stroke="#c9a189" stroke-width="3"/><line x1="${hx + hw / 2 + 124}" y1="${y3 - 38}" x2="${hx + hw / 2 + 124}" y2="${y3 - 14}" stroke="#c9a189" stroke-width="3"/><ellipse cx="${hx + hw / 2 + 100}" cy="${y3 - 54}" rx="12" ry="4" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1"/>`;
  s += `<g data-alvo="lata"><rect x="${hx + hw / 2 + 20}" y="${y3 - 76}" width="12" height="16" rx="2" fill="#b6a58c"/></g></g>`;
  /* térreo e porta */
  s += `<rect x="${hx + 10}" y="${y3}" width="${hw - 20}" height="${bottom - y3 - 2}" fill="#c9dbb2" opacity="0.5"/>`;
  const jardimAberto = aberto(s7, 'jardim');
  s += `<g data-alvo="porta"><path d="M${hx + hw / 2 - 34} ${bottom}v-66a34 34 0 0 1 68 0v66z" fill="#6e1a27"/><path d="M${hx + hw / 2 - 26} ${bottom}v-60a26 26 0 0 1 52 0v60z" fill="#ebcdc3" opacity="0.35"/><circle cx="${hx + hw / 2 + 16}" cy="${bottom - 30}" r="3" fill="#c6a15b"/>`;
  if (noite) s += `<path d="M${hx + hw / 2} ${bottom - 84}a8 8 0 1 0 7 12a6 6 0 1 1-7-12z" fill="#ebd9a8"/>`;
  s += `</g>`;
  const coelhoNovo = !e.bichos.coelho && aberto(s7, 'coelho');
  if (e.bichos.coelho || coelhoNovo) s += `<g data-alvo="coelho" class="${coelhoNovo ? 'respira' : ''}">${coelho(hx + hw / 2 + 50, bottom, coelhoNovo ? 20 : 16)}</g>`;
  /* quintal: canteiro com as flores dela, caixa de areia, pinheiro */
  s += `<g data-alvo="canteiro"><ellipse cx="120" cy="650" rx="70" ry="10" fill="#8a6a4a" opacity="0.55"/>`;
  e.flores.slice(-8).forEach((fl, i) => {
    s += flor(66 + i * 15, 648 + (i % 2) * 3, COR_FLOR[fl.cor] ?? '#f2a9c4', fl.girassol ? 11 : 9, fl.girassol);
  });
  s += `</g>`;
  if (aberto(s7, 'areia')) s += `<g data-alvo="areia">${caixaDeAreia(110, 720, 52)}<path d="M96 722q10 -8 20 0" fill="none" stroke="#d9c69a" stroke-width="2"/><rect x="128" y="710" width="10" height="12" rx="2" fill="#f2a9c4"/></g>`;
  s += `<g data-alvo="pinhas">${pinheiro(350, 745, 330)}`;
  if (aberto(s7, 'pinhas')) s += pinha(316, 752, 6) + pinha(368, 758, 6, 1) + pinha(340, 768, 5, 2);
  s += `</g>`;
  /* contorno de luz na brincadeira do dia */
  const alvoDaBrincadeira: Record<Brincadeira, [number, number, number, number] | null> = {
    piano: [hx + 172, y1 + 124, 28, 28],
    caderno: [hx + 117, y1 + 146, 26, 16],
    palavras: [hx + 37, y1 + 140, 24, 18],
    areia: [110, 720, 58, 36],
    pinhas: [326, 750, 40, 22],
    jardim: [hx + hw / 2, bottom - 36, 44, 44],
    familia: [hx + 80, y3 - 50, 70, 60],
  };
  const luz = alvoDaBrincadeira[brinc];
  if (luz) s += `<g class="luz-do-dia">${contornoLuz(...luz)}</g>`;

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

  const vai = (nome: string, params: Record<string, string> = {}) => {
    travar(500);
    void ir(nome, params);
  };
  tela.alvo('[data-alvo="piano"]', () => vai('piano'));
  tela.alvo('[data-alvo="caderno"]', () => vai('caderno'));
  tela.alvo('[data-alvo="mala"]', () => vai('palavra', { palavra: 'MALA', volta: 'casa' }));
  tela.alvo('[data-alvo="lata"]', () => (aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LATA', volta: 'casa' }) : tiquinho()));
  tela.alvo('[data-alvo="janela"]', () => (noite && aberto(s7, 'palavras') ? vai('palavra', { palavra: 'LUA', volta: 'casa' }) : tiquinho()));
  tela.alvo('[data-alvo="areia"]', () => vai('areia'));
  tela.alvo('[data-alvo="pinhas"]', () => (aberto(s7, 'pinhas') ? vai('pinhas') : tiquinho()));
  tela.alvo('[data-alvo="mesa"]', () => (aberto(s7, 'pinhas') ? vai('pinhas', { mesa: '1' }) : tiquinho()));
  tela.alvo('[data-alvo="porta"]', () => (jardimAberto ? vai('jardim') : tiquinho()));
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
    tiquinho();
    svg.querySelectorAll('.boneca').forEach((b, i) => {
      mover(b, 0, -5, 250 + i * 60);
      void esperar(300 + i * 60).then(() => mover(b, 0, 0, 300));
    });
  });
  tela.alvo('[data-alvo="cama"]', (_ev, el) => {
    tiquinho();
    mover(el, 0, -2, 200);
    void esperar(220).then(() => mover(el, 0, 0, 300));
  });
  tela.alvo('[data-alvo="canteiro"]', () => tiquinho());
  tela.alvo('[data-alvo="mesa-cozinha"]', () => tiquinho());
  tela.alvo('[data-alvo="tapete"]', () => {
    tiquinho();
    tela.comemorar(hx + 80, y3 - 90);
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
