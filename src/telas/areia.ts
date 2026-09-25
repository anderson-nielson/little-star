import { relogioDeAjuda, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar, observarCaixa, pontoNoSvg, svgEl } from '@/core/util';
import { reivindicarDedo, soltarDedo, tocavel, travar } from '@/core/toque';
import { Tracado, pontoEm, type Ponto, type TracoDado } from '@/core/fita';
import { Ajuda } from '@/core/ajuda';
import { caixaDaLetra, caminhoDaEstrela, ESTRELA, type CaixaDaLetra } from '@/core/areia';
import { anunciar } from '@/core/narracao';
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

const COR = { areia: '#EEDDB4', sulco: '#d9c69a', sulcoFundo: '#c9b389', ouro: '#c6a15b', luz: '#ebd9a8', papel: '#fbf8f1' };
const FERRAMENTAS: Record<Modo, number> = { dedo: 70, pa: 160, balde: 250 };
const X_RASTELO = 335;
const Y_FERRAMENTAS = 700;
const GATO: Ponto = [340, 130];
/** o sulco do dedo pode ficar a esta distância da letra e ainda contar (px da cena) */
const FOLGA_DO_TRACO = 38;

/**
 * A caixa de areia em estrela: dedo (traçar, o sulco fica; o rastelo alisa),
 * pá (cavar e achar uma letra de madeira ou uma pinha), balde (empilhar
 * castelos que o gatinho derruba). Sem objetivo, sem erro.
 *
 * No dedo, uma letra que ela já sabe aparece pontilhada na areia e responde
 * ao traço: enche de ouro por onde o dedo passou, tilinta a cada traço e
 * comemora quando a letra fica inteira. A mãozinha mostra o caminho ao entrar
 * e sempre que ela fica parada. Desenhar fora da letra também deixa sulco.
 */
export function telaAreia(): Tela {
  const e = estado();
  const { cx, cy } = ESTRELA;
  let s = `<rect width="390" height="780" fill="#c9dbb2"/>`;
  /* a caixa vermelha em estrela, grande, vista de cima */
  const dentro = caminhoDaEstrela(ESTRELA.areia);
  s += `<path d="${caminhoDaEstrela(1)}" fill="#D2463C"/><clipPath id="areia-clip"><path d="${dentro}"/></clipPath><path class="areia" d="${dentro}" fill="${COR.areia}"/>`;
  s += `<g class="itens" clip-path="url(#areia-clip)" style="pointer-events:none"></g>`;
  /* as três ferramentas: dedo, pá, balde. E o rastelo do Theo, que alisa tudo */
  const roda = (modo: string, x: number, miolo: string) => `<g data-modo="${modo}" transform="translate(${x} ${Y_FERRAMENTAS})"><circle class="fundo" r="36" fill="${COR.papel}" stroke="${COR.ouro}" stroke-width="1.5"/>${miolo}</g>`;
  s += roda('dedo', FERRAMENTAS.dedo, `<path d="M-6 22V-2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V22z" fill="#f6e3dc" stroke="#4f6b3a" stroke-width="1.6"/>`);
  s += roda('pa', FERRAMENTAS.pa, `<rect x="-3" y="-24" width="6" height="26" fill="#c9a189"/><path d="M-12 2h24l-4 22h-16z" fill="#7FA5B8"/>`);
  s += roda('balde', FERRAMENTAS.balde, `<path d="M-16 -10h32l-5 34h-22z" fill="#f2a9c4"/><path d="M-14 -10q14 -20 28 0" fill="none" stroke="#f2a9c4" stroke-width="3"/>`);
  s += roda('rastelo', X_RASTELO, `<rect x="-2" y="-26" width="4" height="30" fill="#c9a189"/><path d="M-16 4h32M-16 4v12M-8 4v12M0 4v12M8 4v12M16 4v12" stroke="#c9a189" stroke-width="3"/>`);
  s += `<g class="luz-modo"></g>`;
  if (e.bichos.gato) s += `<g data-alvo="gato">${gato(GATO[0], GATO[1], 24)}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  const itens = svg.querySelector('.itens') as SVGGElement;
  const luzModo = svg.querySelector('.luz-modo') as SVGGElement;
  const areiaAlvo = svg.querySelector('.areia') as SVGPathElement;
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

  let vivo = true;
  let modo: Modo = 'dedo';
  let guiaLetra = 0;
  const conhecidas = letras.filter((l) => e.letras.includes(l.id));
  /* sem letra conhecida ainda, a primeira do caderno serve de guia */
  const banco = conhecidas.length ? conhecidas : letras.slice(0, 1);

  /* o estado do dedo, da ajuda e dos castelos, antes de tudo que os usa */
  let dedoId = -1;
  let dedoNaAreia = false;
  let ultimo: [number, number] | null = null;
  let ultimoTraco = 0;
  let castelos = 0;
  let ociosa = 0;
  const ajuda = new Ajuda((n) => {
    if (n >= 1) iniciarDemo();
  });

  /* ---------- a letra guia ---------- */
  let letra: Letra = banco[0]!;
  let caixa: CaixaDaLetra = caixaDaLetra(letra.tracos);
  let tracado = new Tracado(letra.tracos, FOLGA_DO_TRACO / caixa.lado);
  let comemorando = false;
  const paraTela = (p: Ponto): Ponto => [caixa.x + p[0] * caixa.lado, caixa.y + p[1] * caixa.lado];
  const paraCaixa = (x: number, y: number): Ponto => [(x - caixa.x) / caixa.lado, (y - caixa.y) / caixa.lado];
  const largura = () => Math.max(14, caixa.lado * 0.075);

  const caminho = (pontos: Ponto[]) => pontos.map((p, i) => (i ? 'L' : 'M') + paraTela(p).map((v) => v.toFixed(1)).join(' ')).join('');

  /** a parte cheia de cada traço e a bolinha de partida: redesenhadas a cada movimento do dedo */
  const desenharCheio = () => {
    const cheia = svg.querySelector('.guia-cheia') as SVGPathElement | null;
    const ponto = svg.querySelector('.guia-ponto') as SVGCircleElement | null;
    if (!cheia || !ponto) return;
    let d = '';
    tracado.fitas.forEach((f, i) => {
      const c = tracado.cheio[i]!;
      if (c <= 0) return;
      const n = Math.max(2, Math.round(c * 40));
      const ps: Ponto[] = [];
      for (let k = 0; k <= n; k++) ps.push(pontoEm(f, (c * k) / n));
      d += caminho(ps);
    });
    cheia.setAttribute('d', d);
    if (tracado.completa) {
      ponto.style.display = 'none';
      return;
    }
    const q = paraTela(pontoEm(tracado.fita, tracado.cheio[tracado.traco]!));
    ponto.style.display = '';
    ponto.setAttribute('cx', q[0].toFixed(1));
    ponto.setAttribute('cy', q[1].toFixed(1));
  };

  const desenharGuia = () => {
    svg.querySelectorAll('.guia').forEach((g) => g.remove());
    if (modo !== 'dedo') return;
    const w = largura();
    const pontilhada = tracado.fitas.map((f) => caminho(f.pontos)).join('');
    const g = svgEl(
      `<g class="guia surge"><path d="${pontilhada}" fill="none" stroke="${COR.ouro}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="1 ${(w * 1.15).toFixed(1)}" opacity="0.6"/>` +
        `<path class="guia-cheia" d="" fill="none" stroke="${COR.ouro}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>` +
        `<circle class="guia-ponto pulsa" r="${(w * 0.55).toFixed(1)}" fill="${COR.ouro}"/></g>`,
    );
    itens.appendChild(g);
    desenharCheio();
  };

  /** a próxima letra que ela sabe, do começo */
  const novaLetra = (avancar: boolean) => {
    if (avancar) guiaLetra += 1;
    letra = banco[guiaLetra % banco.length]!;
    caixa = caixaDaLetra(letra.tracos);
    tracado = new Tracado(letra.tracos, FOLGA_DO_TRACO / caixa.lado);
    ultimoTraco = 0;
    comemorando = false;
    ajuda.reset();
    desenharGuia();
    if (modo === 'dedo' && temVoz(letra.som)) void falar(letra.som);
  };

  /* ---------- a mãozinha mostra o caminho ---------- */
  let demo: { traco: number; u: number } | null = null;
  const iniciarDemo = () => {
    if (modo !== 'dedo' || tracado.completa || dedoId >= 0 || comemorando) return;
    demo = { traco: tracado.traco, u: tracado.cheio[tracado.traco]! };
  };
  const pararDemo = () => {
    demo = null;
    tela.mao(null);
  };
  const laco = () => {
    if (!vivo) return;
    if (demo) {
      const f = tracado.fitas[demo.traco];
      if (!f || modo !== 'dedo') pararDemo();
      else {
        demo.u += 0.007 / Math.max(0.3, f.comprimento);
        const q = paraTela(pontoEm(f, Math.min(1, demo.u)));
        tela.mao([q[0] + 4, q[1] + 6]);
        if (demo.u >= 1.15) {
          demo.traco += 1;
          demo.u = 0;
          if (demo.traco >= tracado.fitas.length) {
            pararDemo();
            ociosa = 0;
          }
        }
      }
    }
    requestAnimationFrame(laco);
  };
  requestAnimationFrame(laco);

  /* a ajuda invisível: A1 a mãozinha repete o traço; A2 o traço fica generoso */
  relogioDeAjuda(tela, (dt) => {
    if (dedoId >= 0 || comemorando) return;
    ajuda.tick(dt);
    ociosa += dt;
    /* parada de novo depois de já ter visto a mãozinha: ela volta */
    if (ociosa >= 8 && !demo && modo === 'dedo') iniciarDemo();
  });

  /* ---------- as ferramentas ---------- */
  const mostrarModo = () => {
    svg.querySelectorAll<SVGCircleElement>('[data-modo] .fundo').forEach((c) => {
      const m = c.parentElement?.getAttribute('data-modo');
      c.setAttribute('fill', m === modo ? COR.luz : COR.papel);
      c.setAttribute('stroke-width', m === modo ? '3' : '1.5');
    });
    luzModo.innerHTML = contornoLuz(FERRAMENTAS[modo], Y_FERRAMENTAS, 40, 40, 'pulsa');
    desenharGuia();
  };
  mostrarModo();

  tela.alvo('[data-modo]', (_ev, el) => {
    const m = el.getAttribute('data-modo')!;
    toc(500, 0.15);
    pararDemo();
    ociosa = 0;
    if (m === 'rastelo') return void alisar(true);
    if (m === modo) return;
    modo = m as Modo;
    mostrarModo();
    if (modo === 'dedo') {
      ajuda.reset();
      iniciarDemo();
      if (temVoz(letra.som)) void falar(letra.som);
      return;
    }
    /* pá e balde: a mãozinha mostra onde tocar, no meio da areia */
    tela.mao([cx + 4, cy + 10]);
    void esperar(3500).then(() => {
      if (vivo && modo === m && !dedoNaAreia) tela.mao(null);
    });
  });

  /** O rastelo do Theo passa e a areia fica lisa; com ele, vem a próxima letra. */
  const alisar = async (comRastelo: boolean) => {
    if (comRastelo) {
      travar(900);
      toc(300, 0.2);
      const r = svgEl(`<g class="rastelo-passa"><rect x="-3" y="-70" width="6" height="74" fill="#c9a189"/><path d="M-24 6h48M-24 6v18M-12 6v18M0 6v18M12 6v18M24 6v18" stroke="#c9a189" stroke-width="4" stroke-linecap="round"/></g>`) as SVGGElement;
      r.style.transform = `translate(${cx - 150}px, ${cy}px)`;
      r.style.transition = 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)';
      svg.appendChild(r);
      requestAnimationFrame(() => (r.style.transform = `translate(${cx + 150}px, ${cy}px)`));
      void esperar(900).then(() => r.remove());
    }
    canvas.style.transition = 'opacity 600ms';
    canvas.style.opacity = '0';
    itens.querySelectorAll('.buraco, .castelo').forEach((x) => (x as SVGElement).classList.add('some'));
    await esperar(600);
    if (!vivo) return;
    ctx.clearRect(0, 0, 390, 780);
    itens.querySelectorAll('.buraco, .castelo').forEach((x) => x.remove());
    canvas.style.transition = 'none';
    canvas.style.opacity = '1';
    castelos = 0;
    novaLetra(true);
    if (modo === 'dedo') iniciarDemo();
  };

  /* ---------- o dedo: o sulco, e a letra que responde ---------- */

  const conferirTraco = () => {
    desenharCheio();
    if (tracado.traco > ultimoTraco && !tracado.completa) {
      ultimoTraco = tracado.traco;
      sininho();
      ajuda.reset();
      ociosa = 0;
    }
    if (tracado.completa && !comemorando) void letraPronta();
  };

  const letraPronta = async () => {
    comemorando = true;
    pararDemo();
    travar(2200);
    sininho();
    const meio = paraTela([0.5, 0.5]);
    tela.comemorar(meio[0], meio[1] - 20);
    anunciar('areia');
    if (temVoz(letra.som)) await falar(letra.som);
    else await esperar(900);
    if (!vivo) return;
    await esperar(900);
    if (!vivo) return;
    /* a areia se alisa sozinha, como uma onda, e a próxima letra chega */
    await alisar(false);
  };

  svg.addEventListener('pointerdown', (ev) => {
    if (modo !== 'dedo' || ev.target !== areiaAlvo) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    dedoId = ev.pointerId;
    dedoNaAreia = true;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    ultimo = [x, y];
    pararDemo();
    ajuda.tocou();
    ociosa = 0;
    if (!comemorando) tracado.comecar(paraCaixa(x, y));
  });
  svg.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedoId || !ultimo) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    ctx.strokeStyle = COR.sulco;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(ultimo[0], ultimo[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = COR.sulcoFundo;
    ctx.lineWidth = 8;
    ctx.stroke();
    ultimo = [x, y];
    if (!comemorando) {
      tracado.mover(paraCaixa(x, y), ajuda.nivel >= 2);
      conferirTraco();
    }
  });
  const solta = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoId) return;
    soltarDedo(dedoId);
    dedoId = -1;
    dedoNaAreia = false;
    ultimo = null;
    tracado.soltar();
    if (!tracado.completa && !comemorando) ajuda.tentativa();
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);

  /* ---------- pá e balde: um toque na areia ---------- */
  tela.aoDestruir(
    tocavel(areiaAlvo, (ev) => {
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      tela.mao(null);
      if (modo === 'pa') return void cavar(x, y);
      if (modo === 'balde') return void empilhar(x, y);
    }),
  );

  const cavar = async (x: number, y: number) => {
    travar(1800);
    toc(260, 0.25);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'buraco');
    g.innerHTML = `<ellipse cx="${x}" cy="${y}" rx="34" ry="18" fill="${COR.sulcoFundo}"/>`;
    itens.appendChild(g);
    await esperar(400);
    if (!vivo) return;
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
    const l = banco[Math.floor(Math.random() * banco.length)]!;
    const fig = l.figuras[Math.floor(Math.random() * l.figuras.length)]!;
    g.innerHTML += `<g class="surge"><rect x="${x - 22}" y="${y - 26}" width="44" height="44" rx="6" fill="#c9a189"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-family="Jost, sans-serif" font-size="34" font-weight="500" fill="${COR.papel}">${l.id}</text></g>`;
    sininho();
    if (temVoz(l.som)) await falar(l.som);
    if (!vivo) return;
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
    /* o primeiro castelo da visita: a mãozinha aponta o gatinho, que derruba */
    if (castelos === 1 && e.bichos.gato) {
      await esperar(700);
      if (!vivo || modo !== 'balde') return;
      tela.mao([GATO[0] + 10, GATO[1] + 8]);
      await esperar(3500);
      if (vivo) tela.mao(null);
    }
  };

  /* o gatinho derruba os castelos quando ela quiser */
  tela.alvo('[data-alvo="gato"]', () => {
    tela.mao(null);
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
    tela.comemorar(GATO[0], GATO[1] - 40);
    void esperar(1200).then(() => itens.querySelectorAll('.castelo').forEach((c) => c.remove()));
  });

  /* ao chegar: a letra diz o som dela e a mãozinha mostra o caminho uma vez */
  void esperar(900).then(() => {
    if (!vivo) return;
    if (temVoz(letra.som)) void falar(letra.som);
    iniciarDemo();
  });

  tela.aoDestruir(() => {
    vivo = false;
  });
  return tela;
}
