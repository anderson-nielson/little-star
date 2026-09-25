import { telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar, observarCaixa, pontoNoSvg } from '@/core/util';
import { reivindicarDedo, soltarDedo, tocavel, travar } from '@/core/toque';
import { pontosDoTraco, type TracoDado } from '@/core/fita';
import { contornoLuz, gato, pinha as pinhaSvg } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { tocarFundo } from '@/audio/musica';
import { sininho, toc } from '@/audio/synth';
import letrasJson from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

interface Letra {
  id: string;
  som: string;
  figuras: string[];
  tracos: TracoDado[];
}
const letras = letrasJson as unknown as Letra[];

type Modo = 'dedo' | 'pa' | 'balde';

/**
 * A caixa de areia em estrela: dedo (traçar, o sulco fica; a mão inteira ou
 * o rastelo alisa), pá (cavar e achar uma letra de madeira ou uma pinha),
 * balde (empilhar castelos que o gatinho derruba). Sem objetivo, sem erro.
 */
export function telaAreia(): Tela {
  const e = estado();
  let s = `<rect width="390" height="780" fill="#c9dbb2"/>`;
  /* a caixa vermelha em estrela, grande, vista de cima */
  const cx = 195;
  const cy = 380;
  const R = 230;
  const r = R * 0.45;
  const pt = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = (i % 2 ? r : R) * k;
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr * 0.92).toFixed(1)}`;
  };
  let borda = '';
  let dentro = '';
  for (let i = 0; i < 10; i++) {
    borda += (i ? 'L' : 'M') + pt(i, 1);
    dentro += (i ? 'L' : 'M') + pt(i, 0.86);
  }
  s += `<path d="${borda}z" fill="#D2463C"/><clipPath id="areia-clip"><path d="${dentro}z"/></clipPath><path d="${dentro}z" fill="#EEDDB4"/>`;
  s += `<g class="itens" clip-path="url(#areia-clip)"></g>`;
  /* os três modos: balde, pá, dedo; e o rastelo do Theo */
  s += `<g data-modo="dedo" transform="translate(70 700)"><circle r="36" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><path d="M-6 22V-2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V22z" fill="#f6e3dc" stroke="#4f6b3a" stroke-width="1.6"/></g>`;
  s += `<g data-modo="pa" transform="translate(160 700)"><circle r="36" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><rect x="-3" y="-24" width="6" height="26" fill="#c9a189"/><path d="M-12 2h24l-4 22h-16z" fill="#7FA5B8"/></g>`;
  s += `<g data-modo="balde" transform="translate(250 700)"><circle r="36" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><path d="M-16 -10h32l-5 34h-22z" fill="#f2a9c4"/><path d="M-14 -10q14 -20 28 0" fill="none" stroke="#f2a9c4" stroke-width="3"/></g>`;
  s += `<g data-modo="rastelo" transform="translate(335 700)"><circle r="36" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><rect x="-2" y="-26" width="4" height="30" fill="#c9a189"/><path d="M-16 4h32M-16 4v12M-8 4v12M0 4v12M8 4v12M16 4v12" stroke="#c9a189" stroke-width="3"/></g>`;
  s += `<g class="luz-modo"></g>`;
  if (e.bichos.gato) s += `<g data-alvo="gato">${gato(340, 130, 16)}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  const itens = svg.querySelector('.itens') as SVGGElement;
  const luzModo = svg.querySelector('.luz-modo') as SVGGElement;
  tocarFundo('gymnopedie');

  /* o sulco do dedo vive num canvas por cima da areia, recortado pela estrela */
  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');
  fo.setAttribute('width', '390');
  fo.setAttribute('height', '780');
  fo.setAttribute('clip-path', 'url(#areia-clip)');
  fo.style.pointerEvents = 'none';
  const canvas = document.createElement('canvas');
  canvas.width = 390 * 2;
  canvas.height = 780 * 2;
  canvas.style.width = '390px';
  canvas.style.height = '780px';
  fo.appendChild(canvas);
  itens.before(fo);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const obs = observarCaixa(svg, () => {});
  tela.aoDestruir(() => obs?.disconnect());

  let modo: Modo = 'dedo';
  let guiaLetra = 0;
  const conhecidas = letras.filter((l) => e.letras.includes(l.id));
  const alvoModo: Record<string, number> = { dedo: 70, pa: 160, balde: 250 };

  const desenharGuia = () => {
    /* uma letra que ela já sabe aparece como estrela guia bem fraquinha, uma de cada vez */
    svg.querySelectorAll('.guia-letra').forEach((g) => g.remove());
    if (modo !== 'dedo' || conhecidas.length === 0) return;
    const l = conhecidas[guiaLetra % conhecidas.length]!;
    let d = '';
    for (const t of l.tracos) {
      const ps = pontosDoTraco(t);
      ps.forEach((p, i) => {
        d += (i ? 'L' : 'M') + (cx - 110 + p[0] * 220).toFixed(1) + ' ' + (cy - 120 + p[1] * 220).toFixed(1);
      });
    }
    itens.insertAdjacentHTML('beforeend', `<path class="guia-letra" d="${d}" fill="none" stroke="#c6a15b" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 16" opacity="0.35"/>`);
  };
  const mostrarModo = () => {
    luzModo.innerHTML = contornoLuz(alvoModo[modo] ?? 70, 700, 40, 40, 'pulsa');
    desenharGuia();
  };
  mostrarModo();

  tela.alvo('[data-modo]', (_ev, el) => {
    const m = el.getAttribute('data-modo')!;
    toc(500, 0.15);
    if (m === 'rastelo') return alisar();
    modo = m as Modo;
    mostrarModo();
  });

  const alisar = () => {
    ctx.clearRect(0, 0, 390, 780);
    itens.querySelectorAll('.buraco, .castelo').forEach((x) => x.remove());
    toc(300, 0.2);
    guiaLetra += 1;
    desenharGuia();
  };

  /* dedo: o sulco */
  let dedoId = -1;
  let ultimo: [number, number] | null = null;
  svg.addEventListener('pointerdown', (ev) => {
    if (modo !== 'dedo') return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (y > 640 || y < 110) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    dedoId = ev.pointerId;
    ultimo = [x, y];
    svg.setPointerCapture(ev.pointerId);
  });
  svg.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedoId || !ultimo) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    ctx.strokeStyle = '#d9c69a';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(ultimo[0], ultimo[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = '#c9b389';
    ctx.lineWidth = 8;
    ctx.stroke();
    ultimo = [x, y];
  });
  const solta = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoId) return;
    soltarDedo(dedoId);
    dedoId = -1;
    ultimo = null;
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);

  /* pá e balde: um toque na areia */
  const areiaAlvo = svg.querySelector('path[fill="#EEDDB4"]')!;
  let castelos = 0;
  tela.aoDestruir(
    tocavel(areiaAlvo, (ev) => {
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      if (modo === 'pa') return void cavar(x, y);
      if (modo === 'balde') return void empilhar(x, y);
    }),
  );

  const cavar = async (x: number, y: number) => {
    travar(1800);
    toc(260, 0.25);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'buraco');
    g.innerHTML = `<ellipse cx="${x}" cy="${y}" rx="34" ry="18" fill="#c9b389"/>`;
    itens.appendChild(g);
    await esperar(400);
    /* o tesouro: uma letra de madeira que ela já viu, ou às vezes uma pinha */
    const pinha = Math.random() < 0.25;
    if (pinha) {
      g.innerHTML += `<g class="surge">${pinhaSvg(x, y + 6, 9, Math.floor(Math.random() * 4))}</g>`;
      sininho();
      mudar((m) => {
        m.cesta += 1;
        m.pinhas.push({ tipo: Math.floor(Math.random() * 4), x: Math.random(), y: 0 });
      });
      return;
    }
    const banco = conhecidas.length ? conhecidas : letras.slice(0, 1);
    const l = banco[Math.floor(Math.random() * banco.length)]!;
    const fig = l.figuras[Math.floor(Math.random() * l.figuras.length)]!;
    g.innerHTML += `<g class="surge"><rect x="${x - 22}" y="${y - 26}" width="44" height="44" rx="6" fill="#c9a189"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-family="Jost, sans-serif" font-size="34" font-weight="500" fill="#fbf8f1">${l.id}</text></g>`;
    sininho();
    if (temVoz(l.som)) await falar(l.som);
    g.innerHTML += `<g class="surge">${figura(fig, x + 50, y - 10, 56)}</g>`;
    await falarPalavra(nomeDaFigura(fig));
  };

  const empilhar = async (x: number, y: number) => {
    travar(400);
    toc(380, 0.2);
    castelos += 1;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'castelo surge');
    g.innerHTML = `<path d="M${x - 26} ${y}q26 -46 52 0z" fill="#e2cf9e"/><rect x="${x - 4}" y="${y - 40}" width="8" height="12" fill="#f2a9c4"/>`;
    itens.appendChild(g);
    await esperar(50);
  };

  /* o gatinho derruba os castelos quando ela quiser */
  tela.alvo('[data-alvo="gato"]', () => {
    if (!castelos) return toc(500, 0.1);
    castelos = 0;
    itens.querySelectorAll('.castelo').forEach((c, i) => {
      const el = c as SVGElement;
      el.style.transition = `transform 700ms cubic-bezier(0.6,0,0.2,1) ${i * 80}ms, opacity 900ms ${i * 80}ms`;
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'bottom center';
      el.style.transform = 'scaleY(0.15) translateY(10px)';
      el.style.opacity = '0';
    });
    toc(200, 0.3);
    tela.comemorar(340, 90);
    void esperar(1200).then(() => itens.querySelectorAll('.castelo').forEach((c) => c.remove()));
  });

  return tela;
}
