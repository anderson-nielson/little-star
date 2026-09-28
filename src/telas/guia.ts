import { contornoLuz } from '@/puppet/objetos';
import { Ajuda, type Nivel } from '@/core/ajuda';
import { esperar, svgEl } from '@/core/util';
import { mover, relogioDeAjuda, type TelaSvg } from './comum';

/**
 * O guia: como toda tela mostra o que fazer e como acaba, sem nada para ler.
 *
 * Ela tem 5 anos e não lê. A voz ajuda, mas não basta: a mãe fala uma vez e,
 * se ela estava olhando para outro lado, a tela fica muda. Então toda tela segue
 * as mesmas três regras (GAMEPLAY 5.1):
 *
 *  1. Logo que a tela abre, a mãozinha faz o gesto de verdade no objeto de
 *     verdade: toca, arrasta levando a coisa junto, percorre um caminho.
 *  2. Parada 6 s, a mãozinha mostra de novo; 12 s, mostra mais uma vez e o
 *     alvo acende. Tocar em qualquer lugar tira a mãozinha na hora.
 *  3. Toda brincadeira tem um fim que ela vê: ou acaba sozinha (e a casinha
 *     acende), ou, se é aberta, o visto verde acende depois da primeira coisa
 *     feita. Nunca só um relógio escondido.
 */

export type Ponto = [number, number];

export type Gesto =
  /** a mãozinha toca duas vezes num ponto */
  | { tipo: 'tocar'; em: Ponto }
  /** a mãozinha leva a coisa de um ponto a outro; `levar` anda junto e volta */
  | { tipo: 'arrastar'; de: Ponto; ate: Ponto; levar?: Element | null }
  /** a mãozinha percorre um caminho (traçar, dedilhar, girar) */
  | { tipo: 'caminho'; pontos: Ponto[] }
  /** a mãozinha só aponta, pulsando (o botão do pronto, a casinha) */
  | { tipo: 'apontar'; em: Ponto };

/* a ponta do dedo do desenho fica uns (6, 8) acima e à esquerda da mão */
const DEDO: Ponto = [6, 8];
const suave = (u: number) => u * u * (3 - 2 * u);
const quadro = () => new Promise<number>((r) => requestAnimationFrame(r));

/**
 * A mãozinha faz um gesto, `vezes` seguidas, e some. Devolve como parar no
 * meio (ela tocou, veio outro gesto); parar devolve a coisa levada ao lugar.
 */
export function demonstrar(tela: TelaSvg, g: Gesto, vezes = 2): () => void {
  let vivo = true;
  const noDedo = (p: Ponto, firme = true) => tela.mao([p[0] + DEDO[0], p[1] + DEDO[1]], -15, firme);
  const levar = g.tipo === 'arrastar' ? (g.levar as SVGElement | null | undefined) : null;
  const andar = async (de: Ponto, ate: Ponto, ms: number, aoAndar?: (dx: number, dy: number) => void) => {
    const t0 = performance.now();
    for (;;) {
      await quadro();
      if (!vivo || !tela.el.isConnected) return false;
      const u = Math.min(1, (performance.now() - t0) / ms);
      const k = suave(u);
      const p: Ponto = [de[0] + (ate[0] - de[0]) * k, de[1] + (ate[1] - de[1]) * k];
      noDedo(p);
      aoAndar?.(p[0] - de[0], p[1] - de[1]);
      if (u >= 1) return true;
    }
  };
  const pausa = async (ms: number) => {
    await esperar(ms);
    return vivo && tela.el.isConnected;
  };
  void (async () => {
    if (g.tipo === 'apontar') {
      tela.mao([g.em[0] + DEDO[0], g.em[1] + DEDO[1]]);
      if (!(await pausa(4000))) return;
      if (vivo) tela.mao(null);
      return;
    }
    for (let v = 0; v < vezes; v++) {
      if (g.tipo === 'tocar') {
        for (let t = 0; t < 2; t++) {
          noDedo([g.em[0] + 4, g.em[1] + 14]);
          if (!(await pausa(260))) return;
          noDedo(g.em);
          if (!(await pausa(320))) return;
        }
      } else if (g.tipo === 'arrastar') {
        noDedo(g.de);
        if (!(await pausa(350))) return;
        if (levar) levar.style.transition = 'none';
        const ok = await andar(g.de, g.ate, 1400, (dx, dy) => {
          if (levar) levar.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        if (!ok) return;
        if (!(await pausa(350))) return;
        tela.mao(null);
        if (levar) mover(levar, 0, 0, 500);
      } else {
        const ps = g.pontos;
        if (ps.length === 0) return;
        noDedo(ps[0]!);
        if (!(await pausa(300))) return;
        const passo = Math.max(60, 1600 / Math.max(1, ps.length - 1));
        for (let i = 1; i < ps.length; i++) if (!(await andar(ps[i - 1]!, ps[i]!, passo))) return;
        if (!(await pausa(300))) return;
        tela.mao(null);
      }
      if (!(await pausa(700))) return;
    }
    vivo = false;
  })();
  return () => {
    if (!vivo) return;
    vivo = false;
    tela.mao(null);
    if (levar) {
      levar.style.transition = 'none';
      levar.style.transform = '';
    }
  };
}

export interface OpcoesGuia {
  /** o gesto de agora: o que ela deve fazer em seguida; `null` quando não tem */
  proximo: () => Gesto | null;
  /** quanto esperar para a primeira demonstração (a voz da pergunta vem antes) */
  atraso?: number;
  /** a primeira demonstração espera por isto (a pergunta falada), além do atraso */
  depoisDe?: Promise<unknown>;
  /** sem mostrar na entrada: só quando ela para (a tela já tem sua própria entrada) */
  soParada?: boolean;
}

export interface Guia {
  /** mostra o gesto de agora já (depois de um passo feito, para o próximo) */
  mostrar: () => void;
  /** tira a mãozinha e volta a contar a parada */
  parar: () => void;
  /** um passo feito: a ajuda volta a zero */
  passo: () => void;
  /** a tela acabou: o guia se cala */
  calar: () => void;
  readonly ajuda: Ajuda;
}

/**
 * Liga a mãozinha e a ajuda invisível numa tela. A demonstração vem na entrada
 * (depois da pergunta falada), volta aos 6 e aos 12 s parada, e some quando
 * ela toca. `proximo` diz, a cada vez, qual gesto mostrar.
 */
export function guiar(tela: TelaSvg, o: OpcoesGuia): Guia {
  let parar: (() => void) | null = null;
  let calado = false;
  const mostrar = () => {
    if (calado || !tela.el.isConnected) return;
    parar?.();
    const g = o.proximo();
    parar = g ? demonstrar(tela, g) : null;
  };
  const ajuda = new Ajuda((n: Nivel) => {
    if (n >= 1) mostrar();
  });
  relogioDeAjuda(tela, (dt) => {
    if (!calado) ajuda.tick(dt);
  });
  const aoTocar = () => {
    ajuda.tocou();
    parar?.();
    parar = null;
  };
  tela.svg.addEventListener('pointerdown', aoTocar);
  tela.aoDestruir(() => {
    calado = true;
    parar?.();
    tela.svg.removeEventListener('pointerdown', aoTocar);
  });
  if (!o.soParada) {
    void Promise.all([esperar(o.atraso ?? 900), o.depoisDe]).then(() => {
      if (ajuda.nivel === 0) mostrar();
    });
  }
  return {
    mostrar,
    parar: aoTocar,
    passo: () => ajuda.reset(),
    calar: () => {
      calado = true;
      parar?.();
      parar = null;
    },
    ajuda,
  };
}

export interface Pronto {
  /** acende o visto (depois da primeira coisa feita) */
  acender: () => void;
  readonly aceso: boolean;
  /** o centro do visto, para a mãozinha apontar */
  readonly onde: Ponto;
}

/**
 * O visto verde: "acabei". Para brincadeira aberta, que não acaba sozinha
 * (quantas comidas ela provou, quantas vezes balançou). Fica apagado até a
 * primeira coisa feita; aceso, pulsa e um toque chama `aoTocar`.
 */
export function botaoPronto(tela: TelaSvg, x: number, y: number, aoTocar: () => void, r = 34): Pronto {
  const g = svgEl(
    `<g class="pronto" data-pronto style="opacity:0;pointer-events:none;transition:opacity 500ms"><circle cx="${x}" cy="${y}" r="${r}" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/>${contornoLuz(x, y, r + 6, r + 6)}<path d="M${x - r * 0.44} ${y + 1}l${r * 0.3} ${r * 0.3} ${r * 0.58} ${-r * 0.64}" fill="none" stroke="#5f8a4a" stroke-width="${Math.max(5, r * 0.2)}" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  ) as SVGGElement;
  const mao = tela.svg.querySelector('.camada-mao');
  if (mao) mao.before(g);
  else tela.svg.appendChild(g);
  let aceso = false;
  tela.alvo('.pronto', () => {
    if (aceso) aoTocar();
  });
  return {
    acender: () => {
      if (aceso) return;
      aceso = true;
      g.style.opacity = '1';
      g.style.pointerEvents = 'auto';
    },
    get aceso() {
      return aceso;
    },
    onde: [x, y],
  };
}
