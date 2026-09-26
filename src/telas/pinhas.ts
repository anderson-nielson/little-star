import { arrastavel, mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { estacao } from '@/core/relogio';
import { ir } from '@/core/roteador';
import { esperar, semente } from '@/core/util';
import { travar } from '@/core/toque';
import { coelho, gato, pinha, pinheiro, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { lira, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const COR_ESTACAO: Record<string, string> = { verao: '#ebd9a8', outono: '#e8a24a', inverno: '#7FA5B8', primavera: '#f2a9c4' };

/**
 * Pinhas e a mesa da estação. Embaixo do pinheiro, de 4 a 7 pinhas para
 * arrastar até a cestinha. Na mesa, ela arruma as pinhas da cesta onde
 * quiser, e elas ficam onde ela pôs.
 */
export function telaPinhas(params: Record<string, string>): Tela {
  return params.mesa === '1' ? mesaDaEstacao() : embaixoDoPinheiro();
}

function embaixoDoPinheiro(): Tela {
  const e = estado();
  const seed = semente(e.hoje.dia + 'pinhas');
  const n = 4 + Math.floor(seed * 4);
  let s = `<rect width="390" height="780" fill="#dbe7ee"/>` + veu(0, 0, 390, 300, '#ebcdc3', 4, 0.25);
  s += `<rect x="0" y="420" width="390" height="360" fill="#c9dbb2"/>` + veu(0, 420, 390, 360, '#8fae6b', 5, 0.3);
  s += pinheiro(250, 540, 430);
  /* a cestinha */
  s += `<g class="cesta"><path d="M40 660q60 -14 120 0l-12 50h-96z" fill="#c9a189"/><path d="M64 660q36 -44 72 0" fill="none" stroke="#c9a189" stroke-width="6"/><g class="na-cesta"></g></g>`;
  if (e.bichos.coelho) s += `<g class="coelho">${coelho(330, 700, 26)}</g>`;
  if (e.bichos.gato) s += `<g class="gato">${gato(60, 560, 14)}</g>`;
  s += `<g class="chao"></g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const chao = svg.querySelector('.chao') as SVGGElement;
  const naCesta = svg.querySelector('.na-cesta') as SVGGElement;
  let catadas = 0;
  /* umas pinhas novas caem com o vento */
  void (async () => {
    for (let i = 0; i < n; i++) {
      const x = 90 + ((seed * 7919 * (i + 1)) % 230);
      const y = 590 + ((seed * 104729 * (i + 3)) % 120);
      const tipo = Math.floor((seed * 31 * (i + 1)) % 4);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pinha');
      g.innerHTML = alcance(x, y, 20) + pinha(x, y, 20, tipo);
      g.style.transformBox = 'fill-box';
      g.style.transform = 'translateY(-300px)';
      chao.appendChild(g);
      lira(62 + (i % 5) * 2, undefined, 0.2);
      requestAnimationFrame(() => {
        g.style.transition = 'transform 900ms cubic-bezier(0.4, 0, 0.6, 1)';
        g.style.transform = 'translateY(0)';
      });
      arrastavel(svg, g, (dx, dy) => {
        const fx = x + dx;
        const fy = y + dy;
        const dist = Math.hypot(fx - 100, fy - 680);
        if (dist < 90 || (dy < 0 && fx < 190 && fy > 600)) {
          travar(500);
          toc(420, 0.2);
          sininho();
          g.remove();
          catadas += 1;
          naCesta.innerHTML += pinha(70 + catadas * 16, 664, 12, tipo);
          mudar((m) => {
            m.cesta += 1;
            m.pinhas.push({ tipo, x: Math.random(), y: 0 });
          });
          const co = svg.querySelector('.coelho');
          if (co) {
            mover(co, -20, 0, 400);
            void esperar(500).then(() => mover(co, 0, 0, 400));
          }
          if (catadas >= n) void esperar(1200).then(() => ir('pinhas', { mesa: '1' }));
          return true;
        }
        return false;
      });
      await esperar(500);
    }
  })();
  return tela;
}

function mesaDaEstacao(): Tela {
  const corEst = COR_ESTACAO[estacao(sessao.agora())]!;
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  /* a mesa com o pano da estação */
  s += `<rect x="30" y="300" width="330" height="200" rx="8" fill="${corEst}" opacity="0.85"/><rect x="30" y="500" width="330" height="14" fill="#c9a189"/><rect x="50" y="514" width="16" height="140" fill="#c9a189"/><rect x="324" y="514" width="16" height="140" fill="#c9a189"/>`;
  /* enfeites da estação */
  const est = estacao(sessao.agora());
  if (est === 'outono') s += `<path d="M300 320q14 -20 26 0q-12 22 -26 0z" fill="#d97f74"/><path d="M60 330q14 -20 26 0q-12 22 -26 0z" fill="#e8a24a"/>`;
  if (est === 'inverno') s += `<rect x="60" y="310" width="12" height="40" rx="3" fill="#7FA5B8"/><circle cx="66" cy="306" r="6" fill="#ebd9a8"/>`;
  if (est === 'primavera') s += `<circle cx="70" cy="330" r="8" fill="#f2a9c4"/><circle cx="320" cy="325" r="7" fill="#ebd9a8"/>`;
  if (est === 'verao') s += `<path d="M310 340q10 -14 20 0q-10 10 -20 0z" fill="#fbf8f1" stroke="#c6a15b"/>`;
  s += `<g class="na-mesa"></g>`;
  /* a cesta com as pinhas que ainda não foram para a mesa */
  s += `<g class="cesta"><path d="M110 690q85 -16 170 0l-14 54h-142z" fill="#c9a189"/><path d="M140 690q55 -50 110 0" fill="none" stroke="#c9a189" stroke-width="6"/><g class="na-cesta"></g></g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const naMesa = svg.querySelector('.na-mesa') as SVGGElement;
  const naCesta = svg.querySelector('.na-cesta') as SVGGElement;

  let acabou = false;
  const render = () => {
    naMesa.innerHTML = '';
    naCesta.innerHTML = '';
    const est2 = estado();
    const ultimaNaCesta = est2.pinhas.reduce((u, p, i) => (p.y > 0 ? u : i), -1);
    est2.pinhas.forEach((p, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const naMesaJa = p.y > 0;
      const x = naMesaJa ? 60 + p.x * 270 : 150 + (i % 6) * 16;
      const y = naMesaJa ? 320 + p.y * 160 : 700 - Math.floor(i / 6) * 8;
      /* a de cima da cesta se pega pela cesta inteira: o dedo não precisa acertar a pinha */
      const pega = i === ultimaNaCesta ? `<rect x="104" y="640" width="182" height="108" fill="transparent"/>` : alcance(x, y, 18);
      g.innerHTML = pega + pinha(x, y, 18, p.tipo);
      (naMesaJa ? naMesa : naCesta).appendChild(g);
      arrastavel(svg, g, (dx, dy) => {
        const fx = x + dx;
        const fy = y + dy;
        if (fx > 40 && fx < 350 && fy > 300 && fy < 500) {
          toc(420, 0.2);
          mudar((m) => {
            const q = m.pinhas[i];
            if (q) {
              q.x = (fx - 60) / 270;
              q.y = (fy - 320) / 160;
            }
          });
          render();
          /* a cesta ficou vazia: a mesa está pronta, e a casa chama */
          if (!acabou && estado().pinhas.every((q) => q.y > 0)) {
            acabou = true;
            tela.comemorar(195, 400);
            void esperar(2400).then(() => ir('casa'));
          }
          return true;
        }
        return false;
      });
    });
  };
  render();
  return tela;
}

/** Um círculo invisível em volta da pinha: o dedo de 5 anos acerta a pinha, não só as escamas. */
function alcance(x: number, y: number, s: number): string {
  return `<circle cx="${x}" cy="${y - s * 0.35}" r="${s * 1.3}" fill="transparent"/>`;
}
