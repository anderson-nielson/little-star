import { mover, relogioDeAjuda, telaSvg } from './comum';
import { estado, mudar, type Semente } from '@/core/estado';
import { colher, estagio, plantar, regadoHoje, regar, type Estagio } from '@/core/horta';
import { espanholAtivo } from '@/core/laco';
import { chaveDoDia } from '@/core/relogio';
import { sessao } from '@/core/sessao';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { Ajuda } from '@/core/ajuda';
import { travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { coelho, contornoLuz, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { falarEspanhol } from '@/audio/espanhol';
import { lira, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const COVAS: [number, number][] = [
  [70, 520],
  [150, 520],
  [230, 520],
  [310, 520],
];

/** O que cresce em cada cova, por estágio e semente. */
function planta(x: number, y: number, semente: Semente, est: Estagio): string {
  if (est === 'semente') return `<ellipse cx="${x}" cy="${y - 4}" rx="10" ry="5" fill="#6b4a2a" opacity="0.8"/>`;
  const folha = (dx: number, rot: number, s: number) => `<ellipse cx="${x + dx}" cy="${y - 14 * s}" rx="${6 * s}" ry="${13 * s}" fill="#8fae6b" transform="rotate(${rot} ${x + dx} ${y - 14 * s})"/>`;
  if (est === 'broto') return folha(-4, -25, 0.8) + folha(4, 25, 0.8);
  if (est === 'planta') return folha(-8, -30, 1.3) + folha(0, 0, 1.4) + folha(8, 30, 1.3);
  /* pronta: a figura da comida aparece no pé */
  const topo: Record<Semente, string> = {
    cenoura: folha(-8, -30, 1.2) + folha(8, 30, 1.2) + figura('cenoura', x, y + 10, 44),
    tomate: folha(-10, -30, 1.5) + folha(10, 30, 1.5) + figura('tomate', x - 8, y - 26, 30) + figura('tomate', x + 10, y - 16, 26),
    milho: `<rect x="${x - 3}" y="${y - 70}" width="6" height="70" fill="#8fae6b"/>` + folha(-10, -40, 1.6) + folha(12, 40, 1.6) + figura('milho', x + 6, y - 40, 40),
    alface: figura('alface', x, y - 16, 60),
  };
  return topo[semente];
}

/**
 * A horta do quintal: quatro covas. Um toque faz a coisa certa: cova vazia,
 * planta; planta com sede, rega; planta pronta, colhe. O que ela colhe vai
 * para a comidinha com a mãe. Nada murcha se ela não vier.
 */
export function telaHorta(): Tela {
  const hoje = chaveDoDia(sessao.agora());
  let s = `<rect width="390" height="780" fill="#dbe7ee"/>` + veu(0, 0, 390, 300, '#ebcdc3', 4, 0.25);
  s += `<rect x="0" y="380" width="390" height="400" fill="#c9dbb2"/>` + veu(0, 380, 390, 400, '#8fae6b', 5, 0.3);
  /* a cerquinha e o canteiro */
  s += `<path d="M20 470h350M20 490h350" stroke="#c9a189" stroke-width="4"/><path d="M40 458v40M110 458v40M190 458v40M270 458v40M350 458v40" stroke="#c9a189" stroke-width="5" stroke-linecap="round"/>`;
  s += `<rect x="24" y="500" width="342" height="60" rx="14" fill="#8a6a4a" opacity="0.75"/>`;
  s += `<g class="covas">${COVAS.map(([x, y], i) => `<g data-cova="${i}"><circle cx="${x}" cy="${y}" r="38" fill="transparent"/><g class="desenho"></g></g>`).join('')}</g><g class="luz"></g>`;
  /* o pai com o regador, o coelhinho cheirando */
  s += `<g class="pai">${familia.pai(48, 775, 150, 'parado').svg}</g>`;
  s += `<g class="regador"><path d="M300 660h52v40h-52z" fill="#7FA5B8"/><path d="M352 672l26 -18" stroke="#7FA5B8" stroke-width="10" stroke-linecap="round"/><path d="M300 672q-22 4 -22 20q0 10 22 10" fill="none" stroke="#7FA5B8" stroke-width="7"/><path d="M372 648l6 -8M378 656l10 -4M376 664l10 2" stroke="#9fc3cf" stroke-width="3" stroke-linecap="round"/></g>`;
  if (estado().bichos.coelho) s += `<g class="coelho">${coelho(250, 640, 26)}</g>`;
  /* a cestinha da colheita */
  s += `<g class="cesta"><path d="M120 720q50 -12 100 0l-10 40h-80z" fill="#c9a189"/><path d="M140 720q30 -40 60 0" fill="none" stroke="#c9a189" stroke-width="5"/><g class="na-cesta"></g></g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const covas = svg.querySelector('.covas') as SVGGElement;
  const luz = svg.querySelector('.luz') as SVGGElement;
  const naCesta = svg.querySelector('.na-cesta') as SVGGElement;

  const render = () => {
    const e = estado();
    covas.querySelectorAll('[data-cova]').forEach((g, i) => {
      const [x, y] = COVAS[i]!;
      const c = e.horta[i];
      const est = c ? estagio(c, hoje) : null;
      const sede = c && !regadoHoje(c, hoje) && est !== 'pronta';
      (g as SVGGElement).style.transform = '';
      (g.querySelector('.desenho') as SVGGElement).innerHTML = `<ellipse cx="${x}" cy="${y + 4}" rx="30" ry="12" fill="#6b4a2a" opacity="0.7"/>${c && est ? planta(x, y, c.semente, est) : ''}${sede ? `<circle cx="${x + 26}" cy="${y - 34}" r="5" fill="#9fc3cf" opacity="0.8"/>` : ''}`;
    });
    naCesta.innerHTML = e.colheita.slice(-4).map((sem, i) => figura(sem, 140 + i * 20, 716, 26)).join('');
  };
  render();

  /* a melhor cova para a mãozinha: vazia, com sede ou pronta */
  const melhorCova = (): number => {
    const e = estado();
    const pronta = e.horta.findIndex((c) => c && estagio(c, hoje) === 'pronta');
    if (pronta >= 0) return pronta;
    const sede = e.horta.findIndex((c) => c && !regadoHoje(c, hoje));
    if (sede >= 0) return sede;
    const vazia = e.horta.findIndex((c) => !c);
    return vazia;
  };
  const ajuda = new Ajuda((n) => {
    const i = melhorCova();
    luz.innerHTML = '';
    if (n >= 1 && i >= 0) {
      const [x, y] = COVAS[i]!;
      luz.innerHTML = contornoLuz(x, y - 10, 40, 40);
      tela.mao([x + 12, y + 20]);
    }
  });
  relogioDeAjuda(tela, (dt) => ajuda.tick(dt));

  let ocupado = false;
  tela.alvo('[data-cova]', async (_ev, el) => {
    if (ocupado) return;
    const i = Number(el.getAttribute('data-cova'));
    const [x, y] = COVAS[i]!;
    const e = estado();
    const c = e.horta[i];
    ajuda.tocou();
    tela.mao(null);
    luz.innerHTML = '';
    ocupado = true;
    travar(900);
    if (!c) {
      /* planta: a semente cai do dedo na terra */
      toc(360, 0.2);
      mudar((x2) => plantar(x2, i, hoje));
      render();
      sininho(0.2);
      if (temVoz('horta_plantar')) void falar('horta_plantar');
    } else if (estagio(c, hoje) === 'pronta') {
      const sem = c.semente;
      mudar((x2) => void colher(x2, i, hoje));
      const g = el as SVGGElement;
      mover(g, 170 - x, 200, 800, 0.6);
      sininho();
      tela.comemorar(x, y - 40);
      await esperar(700);
      render();
      if (temVoz('horta_colher')) await falar('horta_colher');
      await falarPalavra(nomeDaFigura(sem));
      if (espanholAtivo(estado())) await falarEspanhol(sem);
    } else if (!regadoHoje(c, hoje)) {
      /* rega: o regador voa até a cova, chove, a planta cresce */
      const reg = svg.querySelector('.regador') as SVGGElement;
      mover(reg, x - 326, y - 60 - 680, 700);
      await esperar(750);
      for (let k = 0; k < 5; k++) {
        const gota = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        gota.setAttribute('cx', String(x + 20 - k * 8));
        gota.setAttribute('cy', String(y - 40));
        gota.setAttribute('r', '3.5');
        gota.setAttribute('fill', '#9fc3cf');
        svg.appendChild(gota);
        mover(gota, 0, 34, 500);
        toc(700 + k * 60, 0.08);
        void esperar(520).then(() => gota.remove());
        await esperar(90);
      }
      mudar((x2) => void regar(x2, i, hoje));
      lira(74, undefined, 0.25);
      render();
      mover(reg, 0, 0, 700);
      if (temVoz('horta_regar')) void falar('horta_regar');
      const co = svg.querySelector('.coelho');
      if (co) {
        mover(co, x - 250, 0, 600);
        void esperar(1400).then(() => mover(co, 0, 0, 600));
      }
    } else {
      /* já regada hoje: a planta balança, só isso */
      toc(500, 0.1);
      mover(el, 0, -3, 200);
      void esperar(220).then(() => mover(el, 0, 0, 300));
    }
    ajuda.reset();
    ocupado = false;
  });
  return tela;
}
