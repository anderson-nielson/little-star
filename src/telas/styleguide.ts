import { h } from '@/core/util';
import { familia, type Pose } from '@/puppet/boneco';
import { casinha, coelho, gato, maozinha, pinha, pinheiro, caixaDeAreia, flor, centelha } from '@/puppet/objetos';
import { figura, TODAS_AS_FIGURAS } from '@/puppet/figuras';
import { grao, graoDefs } from '@/puppet/pincel';
import type { Tela } from '@/core/roteador';

/** O styleguide vivo: a família, os bichos, os objetos, as figuras e as cores. ?styleguide=1 */
export function telaStyleguide(): Tela {
  const el = document.createElement('div');
  el.className = 'tela';
  const p = h('div', { class: 'styleguide' });
  el.appendChild(p);
  const svg = (inner: string, w = 120, hh = 160) => `<svg viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" xmlns="http://www.w3.org/2000/svg">${graoDefs()}${inner}${grao(0, 0, w, hh)}</svg>`;

  p.append(h('h2', {}, 'De muito perto: os ombros, as mangas, as mãos'));
  p.append(h('div', { class: 'fila', html: svg(familia.irmao(170, 400, 380, 'acena').svg, 340, 420) + svg(familia.pai(170, 410, 400).svg, 340, 420) }));
  p.append(h('h2', {}, 'A família, de perto'));
  p.append(h('div', { class: 'fila', html: svg(familia.menina(80, 300, 210).svg, 160, 310) + svg(familia.irmao(80, 300, 240).svg, 160, 310) + svg(familia.mae(80, 300, 300).svg, 160, 310) + svg(familia.pai(80, 300, 300).svg, 160, 310) }));
  p.append(h('h2', {}, 'A família: a menina 1, o irmão 1,5, pais 2'));
  p.append(h('div', { class: 'fila', html: svg(familia.menina(60, 150, 70).svg) + svg(familia.irmao(60, 150, 105).svg) + svg(familia.mae(60, 150, 140).svg) + svg(familia.pai(60, 150, 148).svg) }));
  p.append(h('h2', {}, 'A menina em três tamanhos: o rosto simplifica sozinho'));
  p.append(h('div', { class: 'fila', html: svg(familia.menina(60, 150, 150).svg, 120, 160) + svg(familia.menina(60, 150, 100).svg) + svg(familia.menina(60, 150, 50).svg) + svg(familia.irmao(60, 150, 66, 'acena').svg) + svg(familia.pai(60, 150, 98).svg) }));
  p.append(h('h2', {}, 'Poses da menina'));
  const poses: Pose[] = ['parado', 'acena', 'sentado', 'pulo', 'giro', 'aponta', 'segura', 'abraca', 'reverencia', 'deitado', 'anda', 'salto', 'escorrega'];
  const passos: Pose[] = ['plie', 'releve', 'arabesque', 'giro', 'salto', 'tendu', 'passe', 'attitude', 'pulo', 'segunda', 'agradece'];
  p.append(h('div', { class: 'fila', html: poses.map((po) => svg(familia.menina(60, 150, 100, po).svg)).join('') }));
  p.append(h('h2', {}, 'Os passos do palco'));
  p.append(h('div', { class: 'fila', html: passos.map((po) => svg(familia.meninaPalco(60, 150, 100, po).svg)).join('') }));
  p.append(h('h2', {}, 'Poses da família'));
  p.append(h('div', { class: 'fila', html: svg(familia.irmao(60, 150, 105, 'acena').svg) + svg(familia.irmao(60, 150, 105, 'sentado').svg) + svg(familia.mae(60, 150, 140, 'abraca').svg) + svg(familia.mae(60, 150, 140, 'sentado').svg) + svg(familia.pai(60, 150, 148, 'palma').svg) + svg(familia.pai(60, 150, 148, 'mao').svg) }));
  p.append(h('h2', {}, 'Bonecas de pano, bichos e objetos'));
  p.append(
    h('div', {
      class: 'fila',
      html:
        [0, 1, 2, 3, 4].map((i) => svg(familia.boneca(60, 150, 80, i).svg)).join('') +
        svg(gato(60, 140, 30)) +
        svg(gato(60, 140, 24, '#c8b8a6', true)) +
        svg(coelho(50, 140, 34)) +
        svg(gato(60, 140, 12)) +
        svg(coelho(50, 140, 16)) +
        svg(casinha(60, 80)) +
        svg(maozinha(50, 60, 1.6)) +
        svg(pinha(60, 120, 20) + pinha(30, 140, 14, 1) + pinha(90, 140, 14, 3)) +
        svg(pinheiro(60, 155, 150)) +
        svg(caixaDeAreia(60, 100, 50)) +
        svg(flor(30, 150, '#d2463c', 14) + flor(60, 150, '#e8a24a', 14) + flor(90, 150, '#ebd9a8', 16, true)) +
        svg(centelha(60, 80, 60)),
    }),
  );
  p.append(h('h2', {}, 'As figuras das palavras e das comidas'));
  p.append(h('div', { class: 'fila', html: TODAS_AS_FIGURAS.map((id) => svg(figura(id, 50, 50, 90) + `<text x="50" y="118" text-anchor="middle" font-size="12" font-family="Jost">${id}</text>`, 100, 124)).join('') }));
  p.append(h('h2', {}, 'Cores'));
  const cores = ['musgo', 'musgo-claro', 'musgo-tinta', 'rosa', 'rosa-clara', 'rosa-doce', 'salmao', 'areia', 'estrela-vermelha', 'ouro', 'luz', 'marfim', 'papel', 'noite', 'veludo', 'mata', 'lago', 'ceu-dia', 'ceu-tarde', 'jeans', 'jaqueta-irmao', 'cabelo-menina', 'cabelo-irmao', 'cabelo-mae', 'cabelo-pai', 'dia-dom', 'dia-seg', 'dia-ter', 'dia-qua', 'dia-qui', 'dia-sex', 'dia-sab'];
  p.append(h('div', { class: 'fila' }, ...cores.map((c) => h('div', { class: 'cor', style: `background: var(--${c})` }, c))));
  return { el };
}
