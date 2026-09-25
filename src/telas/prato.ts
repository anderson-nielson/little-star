import { mover, telaSvg } from './comum';
import { CORES_DE_COMIDA, estado, mudar, type CorDeComida } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { cor as tok, esperar } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { centelha, flor, pol, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { liraDesce, sininho } from '@/audio/synth';
import { travar } from '@/core/toque';
import { pontoNoSvg } from '@/core/util';
import { reivindicarDedo, soltarDedo } from '@/core/toque';
import type { Tela } from '@/core/roteador';

const COR_FLOR: Record<string, string> = { vermelho: '#d2463c', laranja: '#e8a24a', amarelo: '#ebd9a8', verde: '#8fae6b', roxo: '#8a5aa8', marrom: '#c48f5a' };

/**
 * O prato colorido: um prato vazio, seis cores em volta. Ela arrasta (ou
 * toca) a cor que provou. Cada cor faz nascer uma flor no canteiro. Vale
 * provar, não comer tudo; nada sobre quantidade; nada murcha.
 */
export function telaPrato(): Tela {
  const e = estado();
  const corDia = tok('--dia-' + ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][sessao.agora().getDay()]!) || '#7FA5B8';
  const CX = 195;
  const CY = 540;
  const R = 168;

  let s = `<rect width="390" height="780" fill="#fbf8f1"/>` + veu(0, 0, 390, 330, '#c9dbb2', 4, 0.35);
  s += `<line x1="0" y1="330" x2="390" y2="330" stroke="#c6a15b" stroke-width="1" opacity="0.5"/>`;
  s += `<rect x="0" y="330" width="390" height="450" fill="${corDia}" opacity="0.3"/>` + veu(0, 330, 390, 450, corDia, 4, 0.18);
  const m = familia.mae(60, 340, 240, 'segura');
  s += m.svg + figura('cenoura', m.maoL[0] + 12, m.maoL[1] - 10, 36, 'transform="rotate(-30)"');
  /* a janelinha do canteiro */
  s += `<g class="janelinha"><circle cx="310" cy="150" r="56" fill="#dbe7ee" stroke="#c6a15b" stroke-width="1.5"/><path d="M254 150a56 56 0 0 0 112 0z" fill="#c9dbb2"/><ellipse cx="310" cy="176" rx="40" ry="7" fill="#8a6a4a" opacity="0.5"/>`;
  e.flores.slice(-3).forEach((fl, i) => {
    s += flor(290 + i * 20, 176, COR_FLOR[fl.cor]!, 8, fl.girassol);
  });
  s += `<g class="flor-nova"></g></g>`;
  /* o prato */
  s += `<ellipse cx="${CX}" cy="${CY}" rx="118" ry="112" fill="#f6f0e4" stroke="#c6a15b" stroke-width="1.5"/><ellipse cx="${CX}" cy="${CY}" rx="84" ry="80" fill="none" stroke="#c6a15b" stroke-width="1" opacity="0.5"/>`;
  s += `<g class="no-prato"></g>`;
  /* as seis cores */
  CORES_DE_COMIDA.forEach((c, i) => {
    const [x, y] = pol(CX, CY, R, -Math.PI / 2 + (i * Math.PI) / 3);
    const id = e.pais.comidas[c];
    const jaProvou = e.hoje.prato.includes(c);
    s += `<g data-cor="${c}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" opacity="${jaProvou ? 0.3 : 1}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="40" fill="#fbf8f1" opacity="0.75"/>${figura(id, x, y, 56)}</g>`;
  });
  const tela = telaSvg(s, { casinha: () => void terminar(), lua: true });
  const svg = tela.svg;
  const noPrato = svg.querySelector('.no-prato') as SVGGElement;
  e.hoje.prato.forEach((c, i) => {
    noPrato.innerHTML += figura(e.pais.comidas[c], CX - 30 + (i % 3) * 30, CY - 20 + Math.floor(i / 3) * 34, 40);
  });

  let terminou = false;
  const terminar = async () => {
    if (terminou) return;
    terminou = true;
    liraDesce();
    mudar((x) => {
      x.hoje.pratoFeito = true;
    });
    await esperar(600);
    void sessao.avancar();
  };

  const provou = async (c: CorDeComida, g: SVGGElement) => {
    if (estado().hoje.prato.includes(c)) return;
    travar(2600);
    sininho();
    const id = estado().pais.comidas[c];
    const n = estado().hoje.prato.length;
    mudar((x) => {
      x.hoje.prato.push(c);
      x.flores.push({ cor: c, girassol: false, dia: x.hoje.dia });
    });
    /* a comida vai para o prato */
    const gx = Number(g.getAttribute('data-x'));
    const gy = Number(g.getAttribute('data-y'));
    mover(g, CX - 30 + (n % 3) * 30 - gx, CY - 20 + Math.floor(n / 3) * 34 - gy, 700, 0.7);
    void falarPalavra(nomeDaFigura(id));
    await esperar(800);
    /* a flor nasce devagar na janelinha */
    const fn = svg.querySelector('.flor-nova') as SVGGElement;
    const fl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fl.innerHTML = flor(310, 178, COR_FLOR[c]!, 11);
    fl.style.transformBox = 'fill-box';
    fl.style.transformOrigin = 'bottom center';
    fl.style.transform = 'scale(0.1)';
    fl.style.transition = 'transform 1400ms cubic-bezier(0.2, 0, 0, 1)';
    fn.appendChild(fl);
    requestAnimationFrame(() => (fl.style.transform = 'scale(1)'));
    tela.comemorar(310, 120);
    if (temVoz('provou_' + c)) await falar('provou_' + c);
    else await esperar(1200);
  };

  /* toque simples vale; arrastar curto também, e passando de 40% a comida vai sozinha */
  svg.querySelectorAll('[data-cor]').forEach((g) => {
    const c = g.getAttribute('data-cor') as CorDeComida;
    let arrastando = false;
    let id = -1;
    let x0 = 0;
    let y0 = 0;
    const gx = Number(g.getAttribute('data-x'));
    const gy = Number(g.getAttribute('data-y'));
    const distAoPrato = Math.hypot(gx - CX, gy - CY);
    g.addEventListener('pointerdown', (ev) => {
      const p = ev as PointerEvent;
      if (!reivindicarDedo(p.pointerId)) return;
      id = p.pointerId;
      arrastando = true;
      [x0, y0] = pontoNoSvg(svg, p.clientX, p.clientY);
      (g as SVGElement).style.transition = 'none';
    });
    const fim = (ev: Event) => {
      const p = ev as PointerEvent;
      if (p.pointerId !== id) return;
      soltarDedo(id);
      if (!arrastando) return;
      arrastando = false;
      const [x, y] = pontoNoSvg(svg, p.clientX, p.clientY);
      const d = Math.hypot(x - x0, y - y0);
      const restante = Math.hypot(gx + (x - x0) - CX, gy + (y - y0) - CY);
      if (d < 24 || restante < distAoPrato * 0.6) void provou(c, g as SVGGElement);
      else mover(g, 0, 0, 400);
    };
    g.addEventListener('pointermove', (ev) => {
      const p = ev as PointerEvent;
      if (!arrastando || p.pointerId !== id) return;
      const [x, y] = pontoNoSvg(svg, p.clientX, p.clientY);
      (g as SVGElement).style.transform = `translate(${x - x0}px, ${y - y0}px)`;
    });
    g.addEventListener('pointerup', fim);
    g.addEventListener('pointercancel', fim);
    g.classList.add('alvo');
  });

  /* a pergunta da mãe */
  void esperar(600).then(() => temVoz('pergunta_prato') && falar('pergunta_prato'));
  /* depois de 40 s sem nada, a roda segue: nada é cobrado */
  const fimAuto = window.setTimeout(() => void terminar(), 40000);
  tela.aoDestruir(() => window.clearTimeout(fimAuto));
  /* uma centelha discreta indica que a casinha segue em frente */
  svg.insertAdjacentHTML('beforeend', centelha(40, 96, 8, '#c6a15b'));
  return tela;
}
