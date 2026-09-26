import { convidarParaCasa, relogioDeAjuda, telaSvg, trilha, type Trilha } from './comum';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { embaralhar, esperar, observarCaixa, pontoNoSvg, svgEl } from '@/core/util';
import { reivindicarDedo, soltarDedo, tocavel, travar } from '@/core/toque';
import { Tracado, pontoEm, type Ponto, type TracoDado } from '@/core/fita';
import { Ajuda } from '@/core/ajuda';
import { caixaDaLetra, caminhoDaEstrela, ESTRELA, type CaixaDaLetra } from '@/core/areia';
import { anunciar } from '@/core/narracao';
import { centelha as centelhaSvg, contornoLuz, gato, pinha as pinhaSvg } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { tocarFundo } from '@/audio/musica';
import { sininho, tiquinho, toc } from '@/audio/synth';
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
/** onde os tesouros podem estar enterrados: lugares largos da estrela, longe da borda */
const LUGARES_DE_TESOURO: Ponto[] = [[195, 262], [122, 352], [268, 352], [150, 452], [240, 452], [195, 372]];
const TESOUROS = 3;
/** um toque a esta distância de um montinho cava o montinho */
const PERTO_DO_MONTINHO = 44;
/** baldes para um castelo inteiro: base, meio e a torre com a bandeirinha */
const BALDES = 3;

/**
 * A caixa de areia em estrela: dedo (traçar, o sulco fica; o rastelo alisa),
 * pá (cavar os montinhos e achar uma letra de madeira ou uma pinha), balde
 * (três baldes fazem um castelo, que o gatinho derruba). Sem erro.
 *
 * Cada jeito tem uma volta pequena que se vê: a trilha no alto tem uma conta
 * por rodada (as letras que ela sabe, os três tesouros, os três baldes) e
 * enche de ouro. Quando as letras enchem a trilha, a casinha acende: acabou
 * por hoje, e ela pode continuar se quiser.
 *
 * No dedo, uma letra que ela já sabe aparece pontilhada na areia e responde
 * ao traço: enche de ouro por onde o dedo passou, tilinta a cada traço e
 * comemora quando a letra fica inteira. A mãozinha percorre o caminho
 * deixando um rastro de luz ao entrar e sempre que ela fica parada. Desenhar
 * fora da letra também deixa sulco.
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
  /* o translate fica num <g> de fora: o alvo recebe transform por CSS ao ser tocado, e isso apagaria o atributo */
  const roda = (modo: string, x: number, miolo: string) =>
    modo === 'rastelo'
      ? `<g transform="translate(${x} ${Y_FERRAMENTAS})"><g data-modo="${modo}"><circle r="36" fill="transparent"/><circle class="fundo" r="30" fill="${COR.papel}" fill-opacity="0.6" stroke="${COR.ouro}" stroke-width="1.5" stroke-dasharray="4 5"/><g transform="scale(0.85)">${miolo}</g></g></g>`
      : `<g transform="translate(${x} ${Y_FERRAMENTAS})"><g data-modo="${modo}"><circle class="fundo" r="36" fill="${COR.papel}" stroke="${COR.ouro}" stroke-width="1.5"/>${miolo}</g></g>`;
  s += roda('dedo', FERRAMENTAS.dedo, `<path d="M-6 22V-2a3.2 3.2 0 0 1 6.4 0v10l2.6-1.4a3 3 0 0 1 4.4 2.2v1.4l2.2-.6a2.8 2.8 0 0 1 3.6 2.6V22z" fill="#f6e3dc" stroke="#4f6b3a" stroke-width="1.6"/>`);
  s += roda('pa', FERRAMENTAS.pa, `<rect x="-3" y="-24" width="6" height="26" fill="#c9a189"/><path d="M-12 2h24l-4 22h-16z" fill="#7FA5B8"/>`);
  s += roda('balde', FERRAMENTAS.balde, `<path d="M-16 -10h32l-5 34h-22z" fill="#f2a9c4"/><path d="M-14 -10q14 -20 28 0" fill="none" stroke="#f2a9c4" stroke-width="3"/>`);
  /* o rastelo não é um jeito de brincar, é um gesto: menor e de contorno tracejado */
  s += roda('rastelo', X_RASTELO, `<rect x="-2" y="-26" width="4" height="30" fill="#c9a189"/><path d="M-16 4h32M-16 4v12M-8 4v12M0 4v12M8 4v12M16 4v12" stroke="#c9a189" stroke-width="3"/>`);
  s += `<g class="luz-modo"></g><g class="luz-rastelo"></g>`;
  if (e.bichos.gato) s += `<g class="luz-gato"></g><g data-alvo="gato">${gato(GATO[0], GATO[1], 24)}</g>`;
  /* o que ela acha cavando fica fora do recorte da estrela: a figura pode passar da borda */
  s += `<g class="achados" style="pointer-events:none"></g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  const itens = svg.querySelector('.itens') as SVGGElement;
  const luzModo = svg.querySelector('.luz-modo') as SVGGElement;
  const luzRastelo = svg.querySelector('.luz-rastelo') as SVGGElement;
  const luzGato = svg.querySelector('.luz-gato') as SVGGElement | null;
  const achados = svg.querySelector('.achados') as SVGGElement;
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

  /* uma trilha para cada jeito de brincar; só a do jeito escolhido aparece */
  const trilhas: Record<Modo, Trilha> = { dedo: trilha(tela, banco.length), pa: trilha(tela, TESOUROS), balde: trilha(tela, BALDES) };
  trilhas.dedo.agora(0);

  /* o estado do dedo, da ajuda e dos castelos, antes de tudo que os usa */
  let dedoId = -1;
  let dedoNaAreia = false;
  let ultimo: [number, number] | null = null;
  let ultimoTraco = 0;
  let ociosa = 0;
  let convidou = false;
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
        `<path class="guia-demo" d="" fill="none" stroke="${COR.papel}" stroke-width="${(w * 0.55).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` +
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
    /* a estrelinha da trilha vai para a letra de agora, até a trilha encher */
    if (!convidou) trilhas.dedo.agora(guiaLetra % banco.length);
    else trilhas.dedo.agora(-1);
    desenharGuia();
    if (modo === 'dedo' && temVoz(letra.som)) void falar(letra.som);
  };

  /* ---------- a mãozinha mostra o caminho ---------- */
  let demo: { traco: number; u: number } | null = null;
  const iniciarDemo = () => {
    if (modo !== 'dedo' || tracado.completa || dedoId >= 0 || comemorando) return;
    demo = { traco: tracado.traco, u: tracado.cheio[tracado.traco]! };
  };
  /** o rastro de luz da mãozinha: do começo do traço até onde ela está */
  const rastroDemo = (traco: number, u: number) => {
    const el = svg.querySelector('.guia-demo');
    if (!el) return;
    const f = tracado.fitas[traco];
    if (!f || u <= 0) return void el.setAttribute('d', '');
    const n = Math.max(2, Math.round(u * 40));
    const ps: Ponto[] = [];
    for (let k = 0; k <= n; k++) ps.push(pontoEm(f, (u * k) / n));
    el.setAttribute('d', caminho(ps));
  };
  const pararDemo = () => {
    demo = null;
    rastroDemo(-1, 0);
    tela.mao(null);
  };
  const laco = () => {
    if (!vivo) return;
    if (demo) {
      const f = tracado.fitas[demo.traco];
      if (!f || modo !== 'dedo') pararDemo();
      else {
        demo.u += 0.007 / Math.max(0.3, f.comprimento);
        const u = Math.min(1, demo.u);
        const q = paraTela(pontoEm(f, u));
        tela.mao([q[0] + 5, q[1] + 7], -15, true);
        rastroDemo(demo.traco, u);
        if (demo.u >= 1.15) {
          demo.traco += 1;
          demo.u = 0;
          rastroDemo(-1, 0);
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
    for (const m of Object.keys(trilhas) as Modo[]) trilhas[m].mostrar(m === modo);
    /* os tesouros achados são da pá; no dedo e no balde eles saem da frente */
    achados.style.display = modo === 'pa' ? '' : 'none';
    desenharGuia();
    mostrarMontinhos();
  };

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
    /* pá: a mãozinha mostra um montinho; balde: onde o castelo começa, no meio da areia */
    const alvo = modo === 'pa' ? montinhos.find((mm) => !mm.achado) : undefined;
    tela.mao(alvo ? [alvo.p[0] + 6, alvo.p[1] + 8] : castelo ? [castelo.x + 6, castelo.y - 10] : [cx + 4, cy + 10]);
    void esperar(3500).then(() => {
      if (vivo && modo === m && !dedoNaAreia) tela.mao(null);
    });
  });

  /** O rastelo do Theo passa e a areia fica lisa; com ele, vem a próxima letra. */
  const alisar = async (comRastelo: boolean, comDemo = true) => {
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
    itens.querySelectorAll('.buraco, .castelo, .montinho').forEach((x) => (x as SVGElement).classList.add('some'));
    achados.querySelectorAll('g').forEach((x) => x.classList.add('some'));
    await esperar(600);
    if (!vivo) return;
    ctx.clearRect(0, 0, 390, 780);
    itens.querySelectorAll('.buraco, .castelo, .montinho').forEach((x) => x.remove());
    achados.innerHTML = '';
    canvas.style.transition = 'none';
    canvas.style.opacity = '1';
    /* a areia lisa começa outra volta na pá e no balde: tesouros novos, castelo novo */
    castelo = null;
    if (luzGato) luzGato.innerHTML = '';
    luzRastelo.innerHTML = '';
    montinhos = enterrar();
    trilhas.pa.zerar();
    trilhas.balde.zerar();
    novaLetra(true);
    mostrarMontinhos();
    if (modo === 'dedo' && comDemo) iniciarDemo();
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
    trilhas.dedo.encher(guiaLetra % banco.length);
    const acabou = !convidou && trilhas.dedo.cheias === trilhas.dedo.total;
    if (temVoz(letra.som)) await falar(letra.som);
    else await esperar(900);
    if (!vivo) return;
    await esperar(900);
    if (!vivo) return;
    if (acabou) {
      /* todas as letras dela na areia: a volta de hoje acabou, e a casinha acende */
      convidou = true;
      tela.comemorar(195, 104);
      sininho();
    }
    /* a areia se alisa sozinha, como uma onda, e a próxima letra chega */
    await alisar(false, !acabou);
    if (acabou && vivo) {
      convidarParaCasa(tela);
      ociosa = -6;
    }
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
      if (modo === 'pa') {
        const m = montinhos.find((mm) => !mm.achado && Math.hypot(mm.p[0] - x, mm.p[1] - y) < PERTO_DO_MONTINHO);
        return void (m ? cavar(m) : cavarAToa(x, y));
      }
      if (modo === 'balde') return void empilhar(x, y);
    }),
  );

  /* ---------- a pá: três montinhos, três tesouros ---------- */
  interface Montinho {
    p: Ponto;
    achado: boolean;
  }
  const enterrar = (): Montinho[] => embaralhar(LUGARES_DE_TESOURO).slice(0, TESOUROS).map((p) => ({ p, achado: false }));
  let montinhos = enterrar();

  /** os montinhos de areia só aparecem na pá: onde tem tesouro, com um brilho */
  const mostrarMontinhos = () => {
    itens.querySelectorAll('.montinho').forEach((m) => m.remove());
    if (modo !== 'pa') return;
    for (const m of montinhos) {
      if (m.achado) continue;
      const [x, y] = m.p;
      const g = svgEl(`<g class="montinho surge"><ellipse cx="${x}" cy="${y + 4}" rx="30" ry="12" fill="${COR.sulco}"/><path d="M${x - 26} ${y + 4}q26 -30 52 0z" fill="#e2cf9e"/><g class="pulsa">${centelhaSvg(x + 14, y - 16, 14, COR.ouro)}</g></g>`);
      itens.appendChild(g);
    }
  };

  /** um buraco onde não tinha montinho: a areia afunda, sem tesouro e sem erro */
  const cavarAToa = (x: number, y: number) => {
    toc(260, 0.12);
    tiquinho();
    const g = svgEl(`<g class="buraco"><ellipse cx="${x}" cy="${y}" rx="18" ry="9" fill="${COR.sulcoFundo}" opacity="0.7"/></g>`);
    itens.appendChild(g);
    /* ainda tem tesouro: a mãozinha lembra onde */
    const m = montinhos.find((mm) => !mm.achado);
    if (m) {
      tela.mao([m.p[0] + 6, m.p[1] + 8]);
      void esperar(2500).then(() => {
        if (vivo && modo === 'pa') tela.mao(null);
      });
    }
  };

  const cavar = async (m: Montinho) => {
    const [x, y] = m.p;
    m.achado = true;
    mostrarMontinhos();
    travar(1800);
    toc(260, 0.25);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'buraco');
    g.innerHTML = `<ellipse cx="${x}" cy="${y}" rx="34" ry="18" fill="${COR.sulcoFundo}"/>`;
    itens.appendChild(g);
    await esperar(400);
    if (!vivo) return;
    const k = TESOUROS - montinhos.filter((mm) => !mm.achado).length - 1;
    const achado = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    achados.appendChild(achado);
    /* o tesouro: uma letra de madeira que ela já viu, ou às vezes uma pinha */
    const pinha = Math.random() < 0.25;
    if (pinha) {
      achado.innerHTML = `<g class="surge">${pinhaSvg(x, y - 4, 11, Math.floor(Math.random() * 4))}</g>`;
      sininho();
      mudar((mm) => {
        mm.cesta += 1;
        mm.pinhas.push({ tipo: Math.floor(Math.random() * 4), x: Math.random(), y: 0 });
      });
    } else {
      const l = banco[Math.floor(Math.random() * banco.length)]!;
      const fig = l.figuras[Math.floor(Math.random() * l.figuras.length)]!;
      achado.innerHTML = `<g class="surge"><rect x="${x - 22}" y="${y - 30}" width="44" height="44" rx="6" fill="#c9a189"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Jost, sans-serif" font-size="34" font-weight="500" fill="${COR.papel}">${l.id}</text></g>`;
      sininho();
      if (temVoz(l.som)) await falar(l.som);
      if (!vivo) return;
      achado.innerHTML += `<g class="surge"><circle cx="${x}" cy="${y - 72}" r="32" fill="${COR.papel}" opacity="0.9"/>${figura(fig, x, y - 72, 52)}</g>`;
      await falarPalavra(nomeDaFigura(fig));
      if (!vivo) return;
    }
    trilhas.pa.encher(k);
    if (montinhos.every((mm) => mm.achado)) {
      /* os três tesouros: o rastelo acende, ele alisa a areia e enterra outros */
      await esperar(500);
      if (!vivo) return;
      tela.comemorar(195, 104);
      luzRastelo.innerHTML = contornoLuz(X_RASTELO, Y_FERRAMENTAS, 36, 36, 'pulsa');
      if (!convidou) {
        convidou = true;
        convidarParaCasa(tela);
      }
    }
  };

  /* ---------- o balde: três baldes fazem um castelo ---------- */
  let castelo: { x: number; y: number; nivel: number; g: SVGGElement } | null = null;
  const NIVEIS = [
    (x: number, y: number) => `<path d="M${x - 34} ${y}q34 -44 68 0z" fill="#e2cf9e"/>`,
    (x: number, y: number) => `<path d="M${x - 22} ${y - 20}h44l-5 -24h-34z" fill="#e8d6a8" stroke="${COR.sulco}" stroke-width="1.5"/>`,
    (x: number, y: number) =>
      `<rect x="${x - 10}" y="${y - 66}" width="20" height="22" fill="#eedcb0" stroke="${COR.sulco}" stroke-width="1.5"/><path d="M${x} ${y - 66}v-22" stroke="#c9a189" stroke-width="2"/><path d="M${x} ${y - 88}l18 6l-18 6z" fill="#f2a9c4"/>`,
  ];

  const empilhar = async (x: number, y: number) => {
    travar(400);
    toc(380 + (castelo?.nivel ?? 0) * 60, 0.2);
    if (!castelo || castelo.nivel >= BALDES) {
      /* castelo novo onde ela tocou; o de antes fica, até o gatinho ou o rastelo */
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'castelo');
      itens.appendChild(g);
      castelo = { x, y: y + 20, nivel: 0, g };
      trilhas.balde.zerar();
    }
    const c = castelo;
    const nivel = svgEl(`<g class="surge">${NIVEIS[c.nivel]!(c.x, c.y)}</g>`);
    c.g.appendChild(nivel);
    trilhas.balde.encher(c.nivel);
    c.nivel += 1;
    if (c.nivel < BALDES) {
      /* o próximo balde vai em cima: a mãozinha mostra o castelo */
      tela.mao([c.x + 6, c.y - 16]);
      void esperar(1600).then(() => {
        if (vivo && modo === 'balde') tela.mao(null);
      });
      return;
    }
    /* o castelo ficou inteiro, com a bandeirinha */
    sininho();
    tela.comemorar(c.x, c.y - 90);
    if (!e.bichos.gato || !luzGato) return;
    /* agora o gatinho pode derrubar: ele acende e a mãozinha aponta */
    luzGato.innerHTML = contornoLuz(GATO[0], GATO[1], 40, 34, 'pulsa');
    await esperar(900);
    if (!vivo || modo !== 'balde') return;
    tela.mao([GATO[0] + 10, GATO[1] + 8]);
    await esperar(3500);
    if (vivo) tela.mao(null);
  };

  /* o gatinho derruba os castelos quando ela quiser */
  tela.alvo('[data-alvo="gato"]', () => {
    tela.mao(null);
    const todos = [...itens.querySelectorAll('.castelo')];
    if (!todos.length) return toc(500, 0.1);
    castelo = null;
    trilhas.balde.zerar();
    if (luzGato) luzGato.innerHTML = '';
    todos.forEach((c, i) => {
      const el = c as SVGElement;
      el.style.transition = `transform 700ms cubic-bezier(0.6,0,0.2,1) ${i * 80}ms, opacity 900ms ${i * 80}ms`;
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'bottom center';
      el.style.transform = 'scaleY(0.15) translateY(10px)';
      el.style.opacity = '0';
    });
    toc(200, 0.3);
    tela.comemorar(GATO[0], GATO[1] - 40);
    void esperar(1200).then(() => todos.forEach((c) => c.remove()));
  });

  /* só agora: mostrar o jogo escolhido usa os montinhos e o castelo, declarados acima */
  mostrarModo();

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
