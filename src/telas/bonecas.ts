import { mover, telaSvg } from './comum';
import { estado, mudar, type Figurino } from '@/core/estado';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia, figurinoDe } from '@/puppet/boneco';
import { contornoLuz, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { lira, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const ROUPAS = ['#f2a9c4', '#ebd9a8', '#7FA5B8', '#a58bc4'];
const CABELOS = ['#e2c27a', '#5a3a2a', '#17110F', '#d97f74'];
const GORROS = ['nenhum', '#f2a9c4', '#c6a15b', '#7FA5B8'];

/**
 * Vestir as bonecas: a estante em cima, a boneca escolhida grande no meio,
 * as cores do figurino embaixo (roupa, cabelo, gorro). A Stella espera do
 * lado com o bolso do tutu: tocar nela leva a boneca junto nas aventuras.
 */
export function telaBonecas(): Tela {
  let escolhida = Math.max(0, estado().companheira);
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<rect x="30" y="160" width="330" height="6" fill="#c9a189"/><g class="estante">`;
  for (let i = 0; i < Math.min(estado().bonecas, 5); i++) s += `<g data-boneca="${i}"><circle cx="${60 + i * 68}" cy="125" r="36" fill="transparent"/><g class="desenho"></g></g>`;
  s += `</g><g class="luz-estante"></g>`;
  s += `<g class="grande"></g>`;
  s += `<g data-alvo="stella"><circle cx="300" cy="420" r="60" fill="transparent"/><g class="stella"></g></g>`;
  /* as cores, três fileiras de quatro, cada uma com o seu ícone: um vestidinho, um cacho, um gorro */
  const fileira = (y: number, cores: string[], tipo: string, icone: string) =>
    `<g class="fileira" data-fileira="${tipo}">${icone}` +
    cores
      .map((c, i) => `<g data-cor="${tipo}" data-i="${i}"><circle class="bolinha" cx="${75 + i * 80}" cy="${y}" r="34" fill="${c === 'nenhum' ? '#fbf8f1' : c}" stroke="#c6a15b" stroke-width="1.5"/>${c === 'nenhum' ? `<path d="M${63 + i * 80} ${y}h24" stroke="#c6a15b" stroke-width="3" stroke-linecap="round"/>` : ''}</g>`)
      .join('') +
    `</g>`;
  s += `<g class="cores">`;
  s += fileira(560, ROUPAS, 'roupa', `<path d="M20 548h14l4 24H16z" fill="#c9a189" opacity="0.6"/>`);
  s += fileira(650, CABELOS, 'cabelo', `<circle cx="27" cy="650" r="8" fill="#c9a189" opacity="0.6"/>`);
  s += fileira(740, GORROS, 'gorro', `<path d="M17 748a10 10 0 0 1 20 0z" fill="#c9a189" opacity="0.6"/>`);
  s += `</g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const estante = svg.querySelector('.estante') as SVGGElement;
  const luzEstante = svg.querySelector('.luz-estante') as SVGGElement;
  const grande = svg.querySelector('.grande') as SVGGElement;
  const stella = svg.querySelector('.stella') as SVGGElement;
  const fileiras = (tipo: string) => svg.querySelector(`[data-fileira="${tipo}"]`) as SVGGElement;

  const render = () => {
    const e = estado();
    estante.querySelectorAll('[data-boneca]').forEach((g, i) => {
      (g.querySelector('.desenho') as SVGGElement).innerHTML = familia.boneca(60 + i * 68, 158, 56, i, figurinoDe(e.figurinos[String(i)])).svg;
    });
    luzEstante.innerHTML = contornoLuz(60 + escolhida * 68, 125, 38, 40);
    grande.innerHTML = familia.boneca(150, 500, 260, escolhida, figurinoDe(e.figurinos[String(escolhida)])).svg;
    const companheira = e.companheira === escolhida;
    /* a Estrellita tem o figurino dela: só o gorro muda, então só a fileira dos gorros
       aparece, subida para o lugar da primeira. Botão que não faz nada confunde. */
    const soGorro = escolhida === 0;
    fileiras('roupa').style.display = soGorro ? 'none' : '';
    fileiras('cabelo').style.display = soGorro ? 'none' : '';
    fileiras('gorro').setAttribute('transform', soGorro ? 'translate(0 -180)' : '');
    /* a cor que a boneca está usando fica com o aro mais grosso */
    const f = e.figurinos[String(escolhida)];
    const vestindo: Record<string, string> = { roupa: f?.roupa ?? '', cabelo: f?.cabelo ?? '', gorro: f?.gorro ?? 'nenhum' };
    svg.querySelectorAll('[data-cor]').forEach((g) => {
      const tipo = g.getAttribute('data-cor')!;
      const cor = (tipo === 'roupa' ? ROUPAS : tipo === 'cabelo' ? CABELOS : GORROS)[Number(g.getAttribute('data-i'))];
      g.querySelector('.bolinha')!.setAttribute('stroke-width', cor === vestindo[tipo] ? '5' : '1.5');
    });
    stella.innerHTML = familia.stella(300, 500, 150, companheira ? 'segura' : 'acena').svg + (e.companheira >= 0 ? familia.boneca(324, 470, 44, e.companheira, figurinoDe(e.figurinos[String(e.companheira)])).svg : '');
  };
  tela.alvo('[data-boneca]', (_ev, el) => {
    escolhida = Number(el.getAttribute('data-boneca'));
    lira(67 + escolhida * 2, undefined, 0.3);
    render();
  });
  tela.alvo('[data-alvo="stella"]', () => {
    travar(600);
    sininho();
    mudar((x) => void (x.companheira = x.companheira === escolhida ? -1 : escolhida));
    tela.comemorar(300, 380);
    render();
  });
  render();
  tela.alvo('[data-cor]', (_ev, el) => {
    const tipo = el.getAttribute('data-cor') as keyof Figurino;
    const i = Number(el.getAttribute('data-i'));
    const valor = (tipo === 'roupa' ? ROUPAS : tipo === 'cabelo' ? CABELOS : GORROS)[i]!;
    if (escolhida === 0 && tipo !== 'gorro') return;
    mudar((x) => {
      const atual = x.figurinos[String(escolhida)] ?? { roupa: ROUPAS[escolhida % 4]!, cabelo: CABELOS[escolhida % 4]!, gorro: 'nenhum' };
      x.figurinos[String(escolhida)] = { ...atual, [tipo]: valor };
    });
    lira(72 + i * 2, undefined, 0.3);
    mover(el, 0, -4, 150);
    void esperar(170).then(() => mover(el, 0, 0, 250));
    render();
  });
  return tela;
}
