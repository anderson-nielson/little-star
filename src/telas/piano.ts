import { mover, telaSvg } from './comum';
import { estado } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { Ajuda } from '@/core/ajuda';
import { familia } from '@/puppet/boneco';
import { arco, centelha, contornoLuz, gato, veu } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica } from '@/audio/musica';
import { pararFundo } from '@/audio/musica';
import { notaAgora, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** dó a dó: 8 teclas grandes */
const TECLAS = [60, 62, 64, 65, 67, 69, 71, 72];

/**
 * O piano rosa: livre (cada tecla toca o piano de verdade, as bonecas dançam)
 * e seguir a estrelinha (uma centelha pula para a próxima tecla e espera).
 * Tecla "errada" também soa bonita.
 */
export function telaPiano(): Tela {
  const e = estado();
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  /* a estante com as bonecas, que dançam */
  s += `<rect x="60" y="150" width="270" height="6" fill="#c9a189"/>`;
  for (let i = 0; i < Math.min(e.bonecas, 5); i++) s += `<g class="boneca">${familia.boneca(90 + i * 54, 150, 44, i).svg}</g>`;
  /* a partitura: tocar aqui liga o seguir a estrelinha */
  s += `<g data-alvo="partitura">${arco(150, 200, 90, 90, '#fbf8f1')}<path d="M165 250h60M165 262h60M165 274h60" stroke="#ebcdc3" stroke-width="2"/>${centelha(195, 236, 22, '#c6a15b')}</g>`;
  /* o piano: corpo rosa e teclas grandes */
  s += `<rect x="20" y="330" width="350" height="400" rx="16" fill="#f2a9c4"/>`;
  const tw = 330 / 8;
  TECLAS.forEach((m, i) => {
    const x = 30 + i * tw;
    s += `<g data-tecla="${i}"><rect x="${x + 2}" y="${420}" width="${tw - 4}" height="290" rx="8" fill="#fbf8f1" stroke="#ebcdc3"/><circle cx="${x + tw / 2}" cy="690" r="6" fill="${['#d2463c', '#e8a24a', '#ebd9a8', '#8fae6b', '#7FA5B8', '#8a5aa8', '#f2a9c4', '#d2463c'][i]}" opacity="0.7"/></g>`;
  });
  s += `<g class="luz"></g>`;
  if (e.bichos.gato) s += gato(340, 335, 12, '#c8b8a6', true);
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  pararFundo();
  const luz = svg.querySelector('.luz') as SVGGElement;

  /* seguir a estrelinha: a melodia de Brilha, brilha */
  const brilha = musica('brilha');
  const sequencia = brilha.notasMelodia.map((n) => TECLAS.indexOf(n.midi)).filter((i) => i >= 0);
  let seguindo = false;
  let passo = 0;
  const ajuda = new Ajuda();

  const mostrarProxima = () => {
    luz.innerHTML = '';
    tela.mao(null);
    if (!seguindo) return;
    if (passo >= sequencia.length) {
      seguindo = false;
      tela.comemorar(195, 300);
      svg.querySelectorAll('.boneca').forEach((b, i) => {
        mover(b, 0, -14, 300 + i * 80);
        void esperar(400 + i * 80).then(() => mover(b, 0, 0, 400));
      });
      return;
    }
    const i = sequencia[passo]!;
    const x = 30 + i * tw + tw / 2;
    luz.innerHTML = `<g class="respira">${centelha(x, 460, 34, '#c6a15b')}</g>${ajuda.nivel >= 1 ? contornoLuz(x, 565, tw / 2 - 4, 146) : ''}`;
  };

  tela.alvo('[data-alvo="partitura"]', () => {
    if (!audio.pronto) void audio.tentarDestravar();
    seguindo = !seguindo;
    passo = 0;
    ajuda.reset();
    sininho();
    mostrarProxima();
  });

  tela.alvo(
    '[data-tecla]',
    (_ev, el) => {
      const i = Number(el.getAttribute('data-tecla'));
      notaAgora(TECLAS[i]!, 1.4, 0.5);
      const r = el.querySelector('rect') as SVGRectElement;
      r.setAttribute('fill', '#f6e3dc');
      void esperar(180).then(() => r.setAttribute('fill', '#fbf8f1'));
      /* as bonecas balançam */
      svg.querySelectorAll('.boneca').forEach((b, k) => {
        mover(b, 0, -4, 120 + k * 30);
        void esperar(160 + k * 30).then(() => mover(b, 0, 0, 260));
      });
      ajuda.tocou();
      if (seguindo) {
        if (i === sequencia[passo]) {
          passo += 1;
          ajuda.reset();
          mostrarProxima();
        } else ajuda.tentativa();
      }
    },
    true,
  );

  /* ajuda: A1 a tecla certa pulsa mais forte; A2 depois de 6 s a melodia anda sozinha */
  const tique = window.setInterval(() => {
    if (!seguindo) return;
    ajuda.tick(1);
    if (ajuda.nivel >= 1) mostrarProxima();
    if (ajuda.nivel >= 2 && passo < sequencia.length) {
      const i = sequencia[passo]!;
      notaAgora(TECLAS[i]!, 1.2, 0.4);
      passo += 1;
      ajuda.reset();
      ajuda.tick(3);
      mostrarProxima();
    }
  }, 1000);
  tela.aoDestruir(() => window.clearInterval(tique));
  return tela;
}
