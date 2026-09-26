import { mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { espanholAtivo } from '@/core/laco';
import { familia, figurinoDe, CORES as C } from '@/puppet/boneco';
import { BONECAS, COR_ENFEITE, ENFEITES, type Enfeite } from '@/puppet/bonecaPano';
import { centelha, contornoLuz, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falarEspanhol } from '@/audio/espanhol';
import { lira, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/* os vestidos da cesta, e o nome de cada cor e de cada enfeite para a Estrellita dizer */
const ROUPAS = ['#f2a9c4', '#ebd9a8', '#7FA5B8', '#a58bc4'];
const COR_ES = ['rosa', 'amarelo', 'azul', 'lilas'];
const ENFEITE_ES: Record<string, string> = { laco: 'laco', gorro: 'gorro', flores: 'flores', chapeu: 'chapeu' };

const XS = [72, 154, 236, 318];
const Y_ROUPA = 646;
const Y_ENFEITE = 730;
const CHAO = 560;
const BONECA_X = 146;
const STELLA_X = 290;

/** um vestidinho (ou um tutu, para a Estrellita) na cesta */
function iconeRoupa(x: number, y: number, cor: string, tutu: boolean): string {
  if (tutu) {
    let tule = '';
    for (let k = 0; k <= 6; k++) tule += `<circle cx="${x - 21 + k * 7}" cy="${y + 6 + Math.abs(k - 3) * 0.8}" r="5.5" fill="${cor}"/>`;
    return (
      `<path d="M${x - 6} ${y - 22}v6M${x + 6} ${y - 22}v6" stroke="${cor}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M${x - 9} ${y - 17}Q${x} ${y - 13} ${x + 9} ${y - 17}L${x + 8} ${y + 2}H${x - 8}z" fill="${cor}"/>` +
      `<path d="M${x - 23} ${y + 5}Q${x} ${y - 6} ${x + 23} ${y + 5}z" fill="${cor}"/>${tule}` +
      `<path d="M${x - 16} ${y + 1}Q${x} ${y - 5} ${x + 16} ${y + 1}" fill="none" stroke="${C.papel}" stroke-width="1.3" stroke-dasharray="2.4 2" stroke-linecap="round" opacity="0.8"/>`
    );
  }
  return (
    `<path d="M${x - 7} ${y - 19}Q${x} ${y - 21} ${x + 7} ${y - 19}L${x + 17} ${y + 15}Q${x} ${y + 19} ${x - 17} ${y + 15}z" fill="${cor}"/>` +
    `<path d="${`M${x - 11} ${y - 16}a5 5 0 1 0 0 .1zM${x + 11} ${y - 16}a5 5 0 1 0 0 .1z`}" fill="${cor}"/>` +
    `<path d="M${x - 5} ${y - 19}Q${x - 5} ${y - 13} ${x} ${y - 15.5}Q${x + 5} ${y - 13} ${x + 5} ${y - 19}z" fill="${C.papel}"/>` +
    `<path d="M${x - 14} ${y + 11}Q${x} ${y + 14.5} ${x + 14} ${y + 11}" fill="none" stroke="${C.papel}" stroke-width="1.3" stroke-dasharray="2.4 2" stroke-linecap="round"/>`
  );
}

/** o enfeite na cesta, desenhado sozinho */
function iconeEnfeite(x: number, y: number, e: Exclude<Enfeite, 'nenhum'>): string {
  const cor = COR_ENFEITE[e];
  switch (e) {
    case 'laco':
      return `<path d="M${x} ${y}L${x - 17} ${y - 11}Q${x - 21} ${y} ${x - 17} ${y + 11}zM${x} ${y}L${x + 17} ${y - 11}Q${x + 21} ${y} ${x + 17} ${y + 11}z" fill="${cor}"/><circle cx="${x}" cy="${y}" r="5" fill="${cor}" stroke="${C.papel}" stroke-width="1.2" stroke-opacity="0.6"/>`;
    case 'gorro': {
      let riscas = '';
      for (let k = -7; k <= 7; k++) riscas += `M${x + k * 2.6} ${y + 5}v7`;
      return `<path d="M${x - 20} ${y + 8}Q${x - 19} ${y - 16} ${x} ${y - 16}Q${x + 19} ${y - 16} ${x + 20} ${y + 8}z" fill="${cor}"/><rect x="${x - 21}" y="${y + 4}" width="42" height="9" rx="4" fill="#b08d4c"/><path d="${riscas}" stroke="${C.papel}" stroke-opacity="0.35" stroke-width="1"/><circle cx="${x}" cy="${y - 19}" r="6.5" fill="${C.papel}"/>`;
    }
    case 'flores': {
      let s = `<path d="M${x - 20} ${y + 6}Q${x} ${y - 10} ${x + 20} ${y + 6}" fill="none" stroke="${cor}" stroke-width="2.4" stroke-linecap="round"/>`;
      const cores = [C.papel, C.rosaDoce, C.luz, C.rosaDoce, C.papel];
      for (let k = 0; k < 5; k++) {
        const fx = x - 20 + k * 10;
        const fy = y + 6 - Math.sin((k / 4) * Math.PI) * 11;
        for (let p = 0; p < 5; p++) s += `<circle cx="${(fx + Math.cos((p * 2 * Math.PI) / 5) * 3.2).toFixed(1)}" cy="${(fy + Math.sin((p * 2 * Math.PI) / 5) * 3.2).toFixed(1)}" r="2.8" fill="${cores[k]}"/>`;
        s += `<circle cx="${fx}" cy="${fy.toFixed(1)}" r="2" fill="${C.ouro}"/>`;
      }
      return s;
    }
    case 'chapeu':
      return `<ellipse cx="${x}" cy="${y + 7}" rx="24" ry="7" fill="${cor}" stroke="#d9c69a" stroke-width="1.2"/><path d="M${x - 12} ${y + 7}Q${x - 12} ${y - 15} ${x} ${y - 15}Q${x + 12} ${y - 15} ${x + 12} ${y + 7}z" fill="${cor}" stroke="#d9c69a" stroke-width="1.2"/><path d="M${x - 12} ${y}H${x + 12}V${y + 5}H${x - 12}z" fill="${C.rosaDoce}"/>`;
  }
}

/**
 * O cantinho das bonecas. A estante de madeira em cima com as bonecas que ela
 * ganhou; embaixo, a boneca escolhida em pé no tapete, do tamanho de uma
 * boneca de verdade ao lado da Stella. Na cesta, os vestidinhos e os enfeites
 * da cabeça (laço, gorrinho de lã, coroa de flores, chapéu de sol) desenhados
 * como são, não como bolinhas de cor. Vestir faz a boneca dar um pulinho e a
 * Stella bater palma; a Estrellita diz a cor em espanhol. Tocar na Stella dá a
 * mão para a boneca: é essa que vai junto nas aventuras (a centelha na estante
 * mostra qual).
 */
export function telaBonecas(): Tela {
  let escolhida = Math.max(0, estado().companheira);
  const n = Math.min(estado().bonecas, 5);
  const xEstante = (i: number) => 195 + (i - (n - 1) / 2) * 64;

  /* a parede, o rodapé e o chão de madeira clara */
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 560, '#ebcdc3', 4, 0.22);
  /* papel de parede: centelhas bem clarinhas */
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += centelha(39 + c * 78 + (r % 2) * 39, 300 + r * 58, 9, '#ebcdc3');
  s += `<rect x="0" y="${CHAO - 30}" width="390" height="${780 - CHAO + 30}" fill="#ecd3c6"/><rect x="0" y="${CHAO - 32}" width="390" height="5" fill="#dcbfae"/>`;
  s += `<ellipse cx="${(BONECA_X + STELLA_X) / 2 + 4}" cy="${CHAO - 2}" rx="158" ry="24" fill="${C.papel}" opacity="0.75"/><ellipse cx="${(BONECA_X + STELLA_X) / 2 + 4}" cy="${CHAO - 2}" rx="142" ry="18" fill="none" stroke="${C.rosaDoce}" stroke-width="1.6" stroke-dasharray="4 3.5" opacity="0.8"/>`;

  /* a estante: tábua com mãos-francesas */
  s += `<path d="M60 246l14 0l-14 16zM330 246l-14 0l14 16z" fill="#b8907a"/><rect x="34" y="236" width="322" height="11" rx="4" fill="${C.madeira}"/><rect x="34" y="236" width="322" height="3" rx="1.5" fill="#d9b7a1"/>`;
  s += `<g class="luz-estante"></g><g class="estante">`;
  for (let i = 0; i < n; i++) s += `<g data-boneca="${i}"><circle cx="${xEstante(i)}" cy="190" r="36" fill="transparent"/><g class="desenho"></g></g>`;
  s += `</g><g class="marca"></g>`;

  s += `<g class="cena"><g class="grande"></g><g class="stella"></g></g>`;
  s += `<g data-alvo="boneca"><ellipse cx="${BONECA_X}" cy="${CHAO - 105}" rx="62" ry="110" fill="transparent"/></g>`;
  s += `<g data-alvo="stella"><ellipse cx="${STELLA_X}" cy="${CHAO - 130}" rx="62" ry="135" fill="transparent"/></g>`;

  /* a cesta: vestidinhos em cima, enfeites embaixo */
  const bolinha = (x: number, y: number) => `<circle class="bolinha" cx="${x}" cy="${y}" r="34" fill="${C.papel}" fill-opacity="0.85" stroke="${C.ouro}" stroke-width="1.5"/>`;
  s += `<g class="cesta">`;
  ROUPAS.forEach((_, i) => (s += `<g data-roupa="${i}">${bolinha(XS[i]!, Y_ROUPA)}<g class="icone"></g></g>`));
  ENFEITES.forEach((e, i) => (s += `<g data-enfeite="${e}">${bolinha(XS[i]!, Y_ENFEITE)}${iconeEnfeite(XS[i]!, Y_ENFEITE, e)}</g>`));
  s += `</g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const estante = svg.querySelector('.estante') as SVGGElement;
  const luzEstante = svg.querySelector('.luz-estante') as SVGGElement;
  const marca = svg.querySelector('.marca') as SVGGElement;
  const grande = svg.querySelector('.grande') as SVGGElement;
  const stella = svg.querySelector('.stella') as SVGGElement;
  let palmas = false;

  const figurino = (i: number) => {
    const f = estado().figurinos[String(i)];
    const b = BONECAS[i % BONECAS.length]!;
    return { roupa: f?.roupa ?? b.roupa, cabelo: f?.cabelo ?? b.cabelo, gorro: f?.gorro ?? 'nenhum' };
  };

  const render = () => {
    const e = estado();
    estante.querySelectorAll('[data-boneca]').forEach((g, i) => {
      (g.querySelector('.desenho') as SVGGElement).innerHTML = familia.boneca(xEstante(i), 236, 86, i, figurinoDe(e.figurinos[String(i)])).svg;
    });
    luzEstante.innerHTML = contornoLuz(xEstante(escolhida), 192, 34, 50);
    /* a centelha em cima da boneca que vai junto nas aventuras */
    marca.innerHTML = e.companheira >= 0 && e.companheira < n ? centelha(xEstante(e.companheira), 128, 16, C.ouro) : '';
    const deMao = e.companheira === escolhida;
    const st = familia.stella(STELLA_X, CHAO, 250, palmas ? 'palma' : deMao ? 'mao' : 'parado', { dir: -1 });
    stella.innerHTML = st.svg;
    grande.innerHTML = familia.boneca(BONECA_X, CHAO, 205, escolhida, { ...figurinoDe(e.figurinos[String(escolhida)]), ...(deMao ? { maoR: st.maoL } : {}) }).svg;
    /* a cesta mostra o que a boneca está usando: aro grosso */
    const f = figurino(escolhida);
    const tutu = BONECAS[escolhida % BONECAS.length]!.penteado === 'coque';
    svg.querySelectorAll('[data-roupa]').forEach((g, i) => {
      (g.querySelector('.icone') as SVGGElement).innerHTML = iconeRoupa(XS[i]!, Y_ROUPA, ROUPAS[i]!, tutu);
      g.querySelector('.bolinha')!.setAttribute('stroke-width', ROUPAS[i] === f.roupa ? '4.5' : '1.5');
    });
    const enfeite = figurinoDe(f).enfeite ?? 'nenhum';
    svg.querySelectorAll('[data-enfeite]').forEach((g) => g.querySelector('.bolinha')!.setAttribute('stroke-width', g.getAttribute('data-enfeite') === enfeite ? '4.5' : '1.5'));
  };

  const pulinho = () => {
    mover(grande, 0, -14, 160);
    void esperar(170).then(() => mover(grande, 0, 0, 280));
  };
  const festa = async (palavraEs: string | null) => {
    pulinho();
    palmas = true;
    render();
    const fala = escolhida === 0 && palavraEs && espanholAtivo(estado()) ? falarEspanhol(palavraEs) : null;
    await esperar(750);
    palmas = false;
    render();
    await fala;
  };

  tela.alvo('[data-boneca]', (_ev, el) => {
    escolhida = Number(el.getAttribute('data-boneca'));
    lira(67 + escolhida * 2, undefined, 0.3);
    render();
    pulinho();
  });
  tela.alvo('[data-alvo="boneca"]', () => {
    lira(74, undefined, 0.3);
    pulinho();
    if (escolhida === 0 && espanholAtivo(estado())) void falarEspanhol('hola');
  });
  tela.alvo('[data-alvo="stella"]', () => {
    travar(600);
    sininho();
    const vai = estado().companheira !== escolhida;
    mudar((x) => void (x.companheira = vai ? escolhida : -1));
    if (vai) tela.comemorar((BONECA_X + STELLA_X) / 2 + 20, CHAO - 150);
    render();
  });
  const vestir = (mexe: (f: { roupa: string; cabelo: string; gorro: string }) => void) => {
    mudar((x) => {
      const f = figurino(escolhida);
      mexe(f);
      x.figurinos[String(escolhida)] = f;
    });
  };
  tela.alvo('[data-roupa]', (_ev, el) => {
    const i = Number(el.getAttribute('data-roupa'));
    vestir((f) => void (f.roupa = ROUPAS[i]!));
    lira(72 + i * 2, undefined, 0.3);
    mover(el, 0, -4, 150);
    void esperar(170).then(() => mover(el, 0, 0, 250));
    void festa(COR_ES[i]!);
  });
  tela.alvo('[data-enfeite]', (_ev, el) => {
    const e = el.getAttribute('data-enfeite') as Exclude<Enfeite, 'nenhum'>;
    /* tocar no enfeite que ela já está usando tira da cabeça */
    const tira = (figurinoDe(figurino(escolhida)).enfeite ?? 'nenhum') === e;
    vestir((f) => void (f.gorro = tira ? 'nenhum' : e));
    lira(tira ? 67 : 76 + ENFEITES.indexOf(e) * 2, undefined, 0.3);
    mover(el, 0, -4, 150);
    void esperar(170).then(() => mover(el, 0, 0, 250));
    void festa(tira ? null : ENFEITE_ES[e]!);
  });
  render();
  return tela;
}
