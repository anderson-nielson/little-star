import { estado } from '@/core/estado';
import { RelogioDoChamado } from '@/core/chamado';
import { aoTrocarTela, telaAtual } from '@/core/roteador';
import { sessao } from '@/core/sessao';
import { esperar } from '@/core/util';
import { audio } from '@/audio/engine';
import { assovio } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra, temVozPt } from '@/audio/fala';
import { maozinha } from '@/puppet/objetos';

/** Telas onde ninguém chama: o cantinho dos pais, o styleguide e ela dormindo. */
const SEM_CHAMADO = new Set(['pais', 'styleguide', 'dormindo']);
/** quanto tempo a mãozinha do chamado fica na tela, se ela não tocar antes */
const MAO_FICA_MS = 6000;

export interface Chamado {
  /** chama agora, sem esperar: para o passeio automático e a depuração */
  chamar: () => void;
  readonly relogio: RelogioDoChamado;
}

/** O ponto (em px da janela) para onde a mãozinha aponta, ou null. */
type Ponto = [number, number];

function visivel(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return false;
  if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    if (n.getAttribute('opacity') === '0') return false;
  }
  return true;
}

function centro(el: Element): Ponto {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

/**
 * O próximo passo desta tela, na ordem em que o jogo já mostra as coisas:
 * 1. uma tela pode marcar o próprio próximo passo com `data-proximo`;
 * 2. o contorno de luz que pulsa (é assim que o jogo diz "pode tocar aqui");
 * 3. um alvo tocável que ela ainda não tocou nesta tela, um de cada vez;
 * 4. numa tela em que a cena inteira é o alvo (a chegada, o palco), o meio da cena;
 * 5. numa tela de desenho, o meio do papel;
 * 6. a casinha, o caminho de volta.
 */
function proximoPasso(cena: Element, tocados: WeakSet<Element>, vez: number): Ponto | null {
  const marcado = [...cena.querySelectorAll('[data-proximo]')].find(visivel);
  if (marcado) return centro(marcado);

  const luzes = [...cena.querySelectorAll('.pulsa, .luz-do-dia, .convite-casa')].filter(
    (el) => !el.closest('.maozinha') && !el.closest('.chamado') && visivel(el),
  );
  if (luzes.length) return centro(luzes[vez % luzes.length]!);

  const alvos = [...cena.querySelectorAll('.alvo')].filter((el) => el.tagName !== 'svg' && !el.closest('.topo') && visivel(el));
  const novos = alvos.filter((el) => !tocados.has(el));
  const lista = novos.length ? novos : alvos;
  if (lista.length) return centro(lista[vez % lista.length]!);

  const cenaToda = [...cena.querySelectorAll('svg.alvo')].find(visivel);
  if (cenaToda) return centro(cenaToda);

  const papel = [...cena.querySelectorAll('canvas')].find((c) => visivel(c) && c.getBoundingClientRect().width > innerWidth * 0.5);
  if (papel) return centro(papel);

  const casa = [...cena.querySelectorAll('.casinha')].find(visivel);
  return casa ? centro(casa) : null;
}

/**
 * A tela já tem a própria mãozinha mostrando o caminho (a ajuda de 6 s, o
 * gesto na fita da palavra, que some e volta): o chamado só faz o som, para
 * não aparecerem duas mãos apontando coisas diferentes.
 */
function maoDaTela(cena: Element): boolean {
  return cena.querySelector('.maozinha') !== null;
}

async function tocarSom(qual: 'assovio' | 'ei'): Promise<void> {
  if (audio.mudo) return;
  if (!audio.pronto) await audio.tentarDestravar();
  if (qual === 'ei') {
    /* a voz de alguém da família, se gravaram; senão a voz do aparelho; sem ela, o assovio */
    if (temVoz('chamado') && (await falar('chamado'))) return;
    if (temVozPt()) {
      await falarPalavra('Ei! Ei!', 1);
      return;
    }
  }
  assovio();
}

/**
 * O chamado de toda tela: conta o tempo parada e, passado o tempo escolhido
 * pelos pais, a mãozinha aparece tocando no próximo passo com um assovio ou
 * um "Ei!". Vive por cima de todas as telas, sem pegar nenhum toque.
 */
export function montarChamado(app: HTMLElement, painelAberto: () => boolean): Chamado {
  const camada = document.createElement('div');
  camada.className = 'chamado';
  camada.setAttribute('aria-hidden', 'true');
  app.appendChild(camada);

  const relogio = new RelogioDoChamado(() => estado().pais.chamadoSeg);
  let tocados = new WeakSet<Element>();
  let some = 0;

  const tirarMao = () => {
    window.clearTimeout(some);
    camada.classList.remove('visivel');
  };

  const mostrarMao = ([x, y]: Ponto) => {
    camada.innerHTML = `<svg viewBox="-20 -6 48 40" class="chamado-mao">${maozinha(0, 0, 1, -15, '')}</svg>`;
    /* a ponta do dedo (0,0 no desenho) cai no alvo */
    camada.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    /* reinicia a animação do toque */
    camada.classList.remove('visivel');
    void camada.offsetWidth;
    camada.classList.add('visivel');
    window.clearTimeout(some);
    some = window.setTimeout(tirarMao, MAO_FICA_MS);
  };

  const cenaAtual = (): Element | null => app.querySelector(':scope > .tela');

  const chamar = () => {
    const cena = cenaAtual();
    if (!cena) return;
    const e = estado();
    void tocarSom(relogio.som(e.pais.chamadoSom));
    if (maoDaTela(cena)) return;
    const p = proximoPasso(cena, tocados, relogio.total);
    if (p) mostrarMao(p);
  };

  /* qualquer toque, em qualquer lugar, zera a conta e tira a mãozinha */
  window.addEventListener(
    'pointerdown',
    (ev) => {
      relogio.tocou();
      tirarMao();
      const alvo = (ev.target as Element | null)?.closest?.('.alvo');
      if (alvo) tocados.add(alvo);
    },
    { capture: true, passive: true },
  );

  aoTrocarTela(() => {
    relogio.trocouTela();
    tocados = new WeakSet();
    tirarMao();
  });

  window.setInterval(() => {
    /* o relógio só anda com ela podendo brincar: aba escondida, painel aberto,
       porta fechada ou telas sem chamado não contam */
    if (document.hidden || painelAberto() || sessao.descansando || SEM_CHAMADO.has(telaAtual())) return;
    if (relogio.tick(1)) chamar();
  }, 1000);

  return {
    chamar: () => void esperar(0).then(chamar),
    relogio,
  };
}
