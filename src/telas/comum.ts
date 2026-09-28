import { cena, doTopo, encaixar, esperar, pontoNoSvg, svgEl } from '@/core/util';
import { ocupado, reivindicarDedo, saida, soltarDedo, tocavel, travar } from '@/core/toque';
import { sessao } from '@/core/sessao';
import { casinha, centelha, centelhas, contornoLuz, maozinha } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { centelhasSom, tiquinho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

export interface TelaSvg extends Tela {
  svg: SVGSVGElement;
  /** liga um alvo do svg a uma ação, com as regras do toque */
  alvo: (seletor: string, ao: (ev: PointerEvent, el: Element) => void, semTrava?: boolean) => void;
  /** centelhas rosa e ouro subindo num ponto da cena */
  comemorar: (x: number, y: number) => void;
  /** a mãozinha aparece num ponto; `null` tira. `firme` não pulsa: para quando ela anda mostrando um caminho */
  mao: (p: [number, number] | null, rot?: number, firme?: boolean) => void;
  /** ponto de um evento no espaço da cena */
  ponto: (ev: PointerEvent) => [number, number];
  aoDestruir: (f: () => void) => void;
}

export interface OpcoesTela {
  /** a casinha verde no canto: volta para a casa (ou o que se passar). Toda tela tem; `false` só no styleguide */
  casinha?: boolean | (() => void);
  fundo?: string;
  /** o que mais mora no cabeçalho, em unidades do cabeçalho (o varal da casa) */
  topo?: string;
  /** quanto a cena reserva em cima para esse cabeçalho, em unidades da cena */
  folga?: number;
}

/**
 * Uma tela feita de um SVG de cena inteira (390 x 780), com a casinha
 * opcional e os utilitários que todas as telas usam.
 */
export function telaSvg(conteudo: string, o: OpcoesTela = {}): TelaSvg {
  const el = document.createElement('div');
  el.className = 'tela';
  /* o fundo da tela segue a cor da cena, para as faixas dos lados não aparecerem */
  const corDeFundo = o.fundo ?? /^<rect width="390" height="780" fill="(#[0-9a-fA-F]{3,8})"/.exec(conteudo)?.[1];
  if (corDeFundo) el.style.background = corDeFundo;
  const comCasinha = o.casinha ?? true;
  /* o cabeçalho num grupo só: colado no alto da tela, do mesmo tamanho em toda tela */
  const svg = cena(conteudo + `<g class="topo">${comCasinha ? casinha() : ''}${o.topo ?? ''}</g>`);
  svg.dataset.encaixe = '1';
  if (o.folga) svg.dataset.topo = String(o.folga);
  encaixar(svg);
  el.appendChild(svg);
  /* a mãozinha só mostra: nunca fica na frente do que ela vai tocar */
  const camadaMao = svgEl('<g class="camada-mao" style="pointer-events:none"></g>');
  svg.appendChild(camadaMao);
  const limpezas: (() => void)[] = [];

  const alvo: TelaSvg['alvo'] = (seletor, ao, semTrava = false) => {
    /* 'svg' é a cena inteira: toque em qualquer lugar */
    const nos = seletor === 'svg' ? [svg] : [...svg.querySelectorAll(seletor)];
    nos.forEach((n) => {
      limpezas.push(tocavel(n, (ev) => ao(ev, n), { semTrava }));
    });
  };

  /* a casinha vale sempre, mesmo com a cena no meio de uma animação: é a saída de
     qualquer tela. Presa à trava, ela não respondia no quarto dormindo (trava de 60 s)
     nem durante as falas do fim de uma brincadeira, e o jogo parecia travado. */
  if (comCasinha) {
    const casa = svg.querySelector('.casinha');
    if (casa)
      limpezas.push(
        saida(casa, () => {
          travar(400);
          if (typeof comCasinha === 'function') comCasinha();
          else void sessao.voltarParaCasa();
        }),
      );
  }

  /* toque em algo que não faz nada: um sininho baixinho. Nada parece quebrado.
     Vale também para um alvo tocado enquanto a cena anterior ainda termina
     (`travar`): sem som nenhum, ela achava que o jogo tinha travado. */
  const fundo = (ev: Event) => {
    const t = ev.target as Element;
    if (t.closest('.casinha')) return;
    if (t.closest('.alvo') && !ocupado()) return;
    if (!audio.pronto) void audio.tentarDestravar();
    tiquinho();
  };
  svg.addEventListener('pointerdown', fundo);
  limpezas.push(() => svg.removeEventListener('pointerdown', fundo));

  const comemorar = (x: number, y: number) => {
    const g = svgEl(`<g>${centelhas(x, y)}</g>`);
    svg.appendChild(g);
    centelhasSom();
    void esperar(1400).then(() => g.remove());
  };

  const mao: TelaSvg['mao'] = (p, rot = -15, firme = false) => {
    camadaMao.innerHTML = p ? maozinha(p[0], p[1], firme ? 1.3 : 1.1, rot, firme ? '' : 'pulsa') : '';
  };

  return {
    el,
    svg,
    alvo,
    comemorar,
    mao,
    ponto: (ev) => pontoNoSvg(svg, ev.clientX, ev.clientY),
    aoDestruir: (f) => limpezas.push(f),
    destruir: () => {
      for (const l of limpezas) l();
    },
  };
}

/**
 * A casinha por cima de uma tela que não é um `telaSvg` (canvas, cena que
 * rola). O mesmo desenho, no mesmo lugar e com o mesmo `meet` das outras
 * telas: com `slice` ela mudava de posição e, em tela curta, caía na borda
 * morta. Devolve como tirar os ouvintes.
 */
export function cantos(el: HTMLElement, aoCasa: () => void): () => void {
  const hud = cena(`<g class="topo">${casinha()}</g>`);
  hud.dataset.encaixe = '1';
  encaixar(hud);
  hud.style.pointerEvents = 'none';
  el.appendChild(hud);
  const casa = hud.querySelector('.casinha') as SVGGElement;
  casa.style.pointerEvents = 'auto';
  return saida(casa, () => {
    travar(400);
    aoCasa();
  });
}

/* ---------- o avanço e o fim, iguais em toda brincadeira ---------- */

const OURO = '#c6a15b';

export interface Trilha {
  /** a conta `k` fica cheia de ouro, com um tique (`mudo`: sem tique, para o que já vem feito) */
  encher: (k: number, mudo?: boolean) => void;
  /** a estrelinha passa para a conta `k` (a rodada de agora); -1 tira */
  agora: (k: number) => void;
  /** esvazia tudo: outra volta da mesma brincadeira */
  zerar: () => void;
  /** mostra ou esconde a trilha (uma tela com mais de um jeito de brincar tem uma para cada) */
  mostrar: (sim: boolean) => void;
  readonly cheias: number;
  readonly total: number;
}

/**
 * A trilha do avanço: uma conta por rodada, no alto da cena, entre a casinha
 * e a lua. As feitas ficam cheias de ouro e a de agora é uma estrelinha. É o
 * mesmo colar da tela da palavra, para ela reconhecer em toda brincadeira o
 * quanto já foi e o quanto falta, sem nada para ler.
 */
export function trilha(tela: Pick<TelaSvg, 'svg'>, total: number, y = 104): Trilha {
  const g = svgEl('<g class="trilha" style="pointer-events:none"></g>') as SVGGElement;
  /* por baixo da mãozinha, quando a tela tem uma; senão, por cima de tudo */
  const mao = tela.svg.querySelector('.camada-mao');
  if (mao) mao.before(g);
  else tela.svg.appendChild(g);
  const passo = Math.min(26, 230 / Math.max(1, total));
  const xDe = (k: number) => 195 + (k - (total - 1) / 2) * passo;
  const cheia = new Array<boolean>(total).fill(false);
  let atual = -1;
  const desenhar = () => {
    let s = '';
    for (let k = 0; k < total; k++) {
      const x = xDe(k);
      if (k === atual && !cheia[k]) s += `<g data-k="${k}"><circle cx="${x}" cy="${y}" r="11" fill="#fbf8f1" opacity="0.8"/>${centelha(x, y, 20, OURO)}</g>`;
      else s += `<circle data-k="${k}" cx="${x}" cy="${y}" r="7" fill="${cheia[k] ? OURO : '#fbf8f1'}" stroke="${OURO}" stroke-width="2" opacity="${cheia[k] ? 1 : 0.8}"/>`;
    }
    g.innerHTML = s;
  };
  desenhar();
  return {
    encher: (k, mudo = false) => {
      if (k < 0 || k >= total || cheia[k]) return;
      cheia[k] = true;
      desenhar();
      if (mudo) return;
      const c = g.querySelector(`[data-k="${k}"]`) as SVGElement | null;
      if (c) {
        c.style.transformBox = 'fill-box';
        c.style.transformOrigin = 'center';
        c.style.transition = 'transform 300ms';
        c.style.transform = 'scale(1.6)';
        void esperar(320).then(() => (c.style.transform = 'scale(1)'));
      }
      toc(660 + k * 30, 0.14);
    },
    agora: (k) => {
      atual = k;
      desenhar();
    },
    zerar: () => {
      cheia.fill(false);
      atual = -1;
      desenhar();
    },
    mostrar: (sim) => {
      g.style.display = sim ? '' : 'none';
    },
    get cheias() {
      return cheia.filter(Boolean).length;
    },
    get total() {
      return total;
    },
  };
}

/**
 * O quadro de passos: a trilha dos cuidados, com um desenho em cada conta. É o
 * quadro de rotina da parede de um jardim de infância: ela vê a ordem das coisas
 * (primeiro isto, depois aquilo) sem ler nada. O passo feito fica dourado, o
 * de agora tem a estrelinha em cima, os que faltam esperam clarinhos.
 * `icones` desenha cada passo num quadradinho de lado 24, centrado em (x, y).
 */
export function quadroDePassos(tela: Pick<TelaSvg, 'svg'>, icones: ((x: number, y: number) => string)[], y = 110): Trilha {
  const g = svgEl('<g class="trilha quadro-de-passos" style="pointer-events:none"></g>') as SVGGElement;
  const mao = tela.svg.querySelector('.camada-mao');
  if (mao) mao.before(g);
  else tela.svg.appendChild(g);
  const total = icones.length;
  const passo = Math.min(46, 300 / Math.max(1, total));
  const lado = Math.min(36, passo - 6);
  const xDe = (k: number) => 195 + (k - (total - 1) / 2) * passo;
  const cheia = new Array<boolean>(total).fill(false);
  let atual = -1;
  const desenhar = () => {
    let s = `<path d="M${xDe(0)} ${y}H${xDe(total - 1)}" stroke="${OURO}" stroke-width="1" opacity="0.5"/>`;
    for (let k = 0; k < total; k++) {
      const x = xDe(k);
      const feito = cheia[k];
      const agora = k === atual && !feito;
      s += `<g data-k="${k}"><rect x="${x - lado / 2}" y="${y - lado / 2}" width="${lado}" height="${lado}" rx="8" fill="${feito ? '#ebd9a8' : '#fbf8f1'}" stroke="${OURO}" stroke-width="${agora ? 2.4 : 1.2}" opacity="${feito || agora ? 1 : 0.75}"/>`;
      s += `<g opacity="${feito || agora ? 1 : 0.45}" transform="translate(${x} ${y}) scale(${(lado / 30).toFixed(3)}) translate(${-x} ${-y})">${icones[k]!(x, y)}</g>`;
      if (agora) s += centelha(x, y - lado / 2 - 7, 12, OURO);
      if (feito) s += centelha(x + lado / 2 - 3, y - lado / 2 + 3, 9, OURO);
      s += `</g>`;
    }
    g.innerHTML = s;
  };
  desenhar();
  return {
    encher: (k, mudo = false) => {
      if (k < 0 || k >= total || cheia[k]) return;
      cheia[k] = true;
      desenhar();
      if (mudo) return;
      const c = g.querySelector(`[data-k="${k}"]`) as SVGElement | null;
      if (c) {
        c.style.transformBox = 'fill-box';
        c.style.transformOrigin = 'center';
        c.style.transition = 'transform 300ms';
        c.style.transform = 'scale(1.25)';
        void esperar(320).then(() => (c.style.transform = 'scale(1)'));
      }
      toc(660 + k * 30, 0.14);
    },
    agora: (k) => {
      atual = k;
      desenhar();
    },
    zerar: () => {
      cheia.fill(false);
      atual = -1;
      desenhar();
    },
    mostrar: (sim) => {
      g.style.display = sim ? '' : 'none';
    },
    get cheias() {
      return cheia.filter(Boolean).length;
    },
    get total() {
      return total;
    },
  };
}

/**
 * Um puxão: o dedo leva `el` ao longo de um caminho reto, de `origem` a
 * `destino` (unidades da cena), e ele só anda nessa direção. `aoMover` recebe
 * a fração do caminho enquanto o dedo anda; `aoSoltar`, a fração ao soltar.
 * Quem decide se volta ou se vai sozinho o resto é quem chama.
 */
export function puxavel(
  svg: SVGSVGElement,
  el: Element,
  origem: [number, number],
  destino: [number, number],
  aoMover: (fracao: number) => void,
  aoSoltar: (fracao: number) => void,
  ativo: () => boolean = () => true,
): () => void {
  let id = -1;
  let p0: [number, number] = [0, 0];
  const dx = destino[0] - origem[0];
  const dy = destino[1] - origem[1];
  const total2 = dx * dx + dy * dy || 1;
  const fracao = (ev: PointerEvent) => {
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    return Math.max(0, Math.min(1, ((x - p0[0]) * dx + (y - p0[1]) * dy) / total2));
  };
  const baixo = (ev: Event) => {
    const pe = ev as PointerEvent;
    if (!ativo() || !reivindicarDedo(pe.pointerId)) return;
    id = pe.pointerId;
    p0 = pontoNoSvg(svg, pe.clientX, pe.clientY);
    try {
      (el as SVGElement).setPointerCapture(pe.pointerId);
    } catch {
      /* sem captura, a janela libera o dedo */
    }
  };
  const move = (ev: Event) => {
    const pe = ev as PointerEvent;
    if (pe.pointerId !== id) return;
    aoMover(fracao(pe));
  };
  const cima = (ev: Event) => {
    const pe = ev as PointerEvent;
    if (pe.pointerId !== id) return;
    soltarDedo(id);
    id = -1;
    aoSoltar(fracao(pe));
  };
  el.addEventListener('pointerdown', baixo);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', cima);
  el.addEventListener('pointercancel', cima);
  el.classList.add('alvo');
  return () => {
    el.removeEventListener('pointerdown', baixo);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', cima);
    el.removeEventListener('pointercancel', cima);
  };
}

/**
 * A brincadeira chegou ao fim desta vez: a casinha acende e a mãozinha aponta
 * para ela. Nada obriga a sair; ela pode continuar brincando. Mas fica claro
 * que acabou e para onde ir. Devolve como apagar o convite.
 */
export function convidarParaCasa(tela: TelaSvg, x = 40, y = 44): () => void {
  const luz = svgEl(`<g class="convite-casa" style="pointer-events:none">${contornoLuz(x, y, 42, 42)}</g>`);
  tela.svg.querySelector('.casinha')?.after(luz);
  let vivo = true;
  void esperar(1200).then(() => {
    if (vivo) tela.mao(doTopo(tela.svg, x + 16, y + 26), -30);
  });
  void esperar(5200).then(() => {
    if (vivo) tela.mao(null);
  });
  const apagar = () => {
    vivo = false;
    luz.remove();
  };
  tela.aoDestruir(apagar);
  return apagar;
}

/** Move um elemento do svg com transição suave (transform em CSS). */
export function mover(el: Element, x: number, y: number, ms = 600, escala = 1): void {
  const e = el as SVGElement;
  e.style.transformBox = 'fill-box';
  e.style.transformOrigin = 'center';
  e.style.transition = `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1), opacity ${ms}ms`;
  e.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
}

export function sumir(el: Element, ms = 600): void {
  const e = el as SVGElement;
  e.style.transition = `opacity ${ms}ms`;
  e.style.opacity = '0';
}

/** Um relógio de ociosidade para a ajuda: chama `tick(dt)` a cada segundo enquanto a tela vive. */
export function relogioDeAjuda(tela: TelaSvg, tick: (dt: number) => void): void {
  const id = window.setInterval(() => tick(1), 1000);
  tela.aoDestruir(() => window.clearInterval(id));
}

/**
 * Um elemento do svg que se arrasta com o primeiro dedo. `aoSoltar` recebe o
 * deslocamento e devolve true se o elemento fica onde soltou; senão volta.
 */
export function arrastavel(svg: SVGSVGElement, el: SVGGElement, aoSoltar: (dx: number, dy: number) => boolean | void): void {
  let id = -1;
  let x0 = 0;
  let y0 = 0;
  el.addEventListener('pointerdown', (ev) => {
    if (!reivindicarDedo(ev.pointerId)) return;
    id = ev.pointerId;
    [x0, y0] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    el.style.transition = 'none';
    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      /* sem captura, a janela libera o dedo */
    }
  });
  el.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== id) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    el.style.transform = `translate(${x - x0}px, ${y - y0}px)`;
  });
  const fim = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    soltarDedo(id);
    id = -1;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const ficou = aoSoltar(x - x0, y - y0);
    if (!ficou) mover(el, 0, 0, 400);
  };
  el.addEventListener('pointerup', fim);
  el.addEventListener('pointercancel', fim);
  el.classList.add('alvo');
}

/**
 * Cordas para dedilhar: o dedo desce em qualquer lugar e, ao passar por cima
 * de cada corda (posições x no espaço da cena), ela soa. Um toque parado numa
 * corda também soa. `aoTocar` recebe o índice da corda.
 */
export function dedilhar(svg: SVGSVGElement, xs: number[], faixaY: [number, number], aoTocar: (i: number) => void): () => void {
  let id = -1;
  let ultimoX: number | null = null;
  const cordaEm = (x: number) => {
    let melhor = -1;
    let d = Infinity;
    xs.forEach((cx, i) => {
      const dd = Math.abs(cx - x);
      if (dd < d) {
        d = dd;
        melhor = i;
      }
    });
    return d < 26 ? melhor : -1;
  };
  const baixo = (ev: PointerEvent) => {
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (y < faixaY[0] || y > faixaY[1]) return;
    /* um botão dentro da faixa (os acordes do ukulele) é do botão, não das cordas */
    if ((ev.target as Element).closest?.('.alvo')) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    id = ev.pointerId;
    ultimoX = x;
    const i = cordaEm(x);
    if (i >= 0) aoTocar(i);
    try {
      svg.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  };
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== id || ultimoX === null) return;
    const [x] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const a = Math.min(ultimoX, x);
    const b = Math.max(ultimoX, x);
    xs.forEach((cx, i) => {
      if (cx > a && cx <= b && Math.abs(x - ultimoX!) > 1) aoTocar(i);
    });
    ultimoX = x;
  };
  const cima = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    soltarDedo(id);
    id = -1;
    ultimoX = null;
  };
  svg.addEventListener('pointerdown', baixo);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', cima);
  svg.addEventListener('pointercancel', cima);
  return () => {
    svg.removeEventListener('pointerdown', baixo);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', cima);
    svg.removeEventListener('pointercancel', cima);
  };
}

/* ---------- as pedrinhas ---------- */

const COR_PEDRINHA = ['#f2a9c4', '#c6a15b', '#9fc3cf', '#ebd9a8', '#a58bc4'];

/** Uma pedrinha desenhada: uma pedra lisa de rio, um brilho. */
export function pedrinha(x: number, y: number, s: number, i = 0): string {
  return `<g><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.78}" fill="${COR_PEDRINHA[i % COR_PEDRINHA.length]}"/><ellipse cx="${x - s * 0.3}" cy="${y - s * 0.3}" rx="${s * 0.3}" ry="${s * 0.18}" fill="#fbf8f1" opacity="0.6"/></g>`;
}

/** `n` pedrinhas sobem de um ponto da cena, com um tique cada: ela ganhou. */
export function pedrinhasSobem(tela: TelaSvg, n: number, x: number, y: number): void {
  let s = '';
  for (let i = 0; i < n; i++) s += `<g class="sobe" style="animation-delay:${i * 120}ms">${pedrinha(x + (i - (n - 1) / 2) * 22, y, 9, i)}</g>`;
  const g = svgEl(`<g>${s}</g>`);
  tela.svg.appendChild(g);
  for (let i = 0; i < n; i++) void esperar(i * 120).then(() => toc(520 + i * 40, 0.14));
  void esperar(1600).then(() => g.remove());
}

/** Uma pedrinha rola para fora, devagar, sem som de erro: um combinado não aconteceu. */
export function pedrinhaRola(tela: TelaSvg, x: number, y: number): void {
  const g = svgEl(`<g>${pedrinha(x, y, 9, 1)}</g>`);
  tela.svg.appendChild(g);
  toc(260, 0.1);
  requestAnimationFrame(() => mover(g, 120, 300, 1400, 0.8));
  void esperar(1500).then(() => g.remove());
}
