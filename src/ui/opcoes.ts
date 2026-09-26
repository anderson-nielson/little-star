import { h } from '@/core/util';
import { estado, mudar } from '@/core/estado';
import { audio } from '@/audio/engine';
import { buscarNovaVersao, estaInstalado, instalar, novaVersaoAChegar, podeInstalar, telaCheia, temServiceWorker, textoDaBusca, versao } from '@/core/aparelho';
import ajudaJson from '@/data/ajuda-telas.json';

export interface AjudaDaTela {
  titulo: string;
  oque: string;
  fazer: string;
}

const AJUDA = ajudaJson as Record<string, AjudaDaTela>;

/** A chave da ajuda de uma tela: as pinhas têm duas cenas, embaixo do pinheiro e a mesa da estação. */
export function chaveDaAjuda(nome: string, params: Record<string, string> = {}): string {
  return nome === 'pinhas' && params.mesa === '1' ? 'pinhas.mesa' : nome;
}

export function ajudaDaTela(nome: string, params: Record<string, string> = {}): AjudaDaTela | null {
  return AJUDA[chaveDaAjuda(nome, params)] ?? null;
}

/** Telas que já são texto para os pais e têm o próprio jeito de sair: sem o botão do canto. */
const SEM_OPCOES = new Set(['pais', 'styleguide']);

export interface Opcoes {
  /** a tela mudou: fecha o painel e decide se o botão aparece */
  trocarTela: (nome: string, params: Record<string, string>) => void;
  aberto: () => boolean;
  fechar: () => void;
}

/** a estrelinha de quatro pontas do jogo, pequena, no botão */
const ESTRELINHA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 4.6 3.4 7.4 9 9c-5.6 1.6-8.4 4.4-9 9c-.6-4.6-3.4-7.4-9-9c5.6-1.6 8.4-4.4 9-9z" fill="currentColor"/></svg>`;
/** o alto-falante riscado: aparece no canto do botão quando o som está desligado */
const SEM_SOM = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

/**
 * O botão pequeno do canto de cima, à direita, em todas as telas do jogo. Ele
 * abre um painel que corre da direita para a esquerda, para quem joga junto:
 * o que é esta tela e o que fazer nela, o som, o balão de leitura, a tela
 * cheia, a versão e a busca por uma versão nova, e o caminho para o cantinho
 * dos pais (que continua pedindo a continha). Nada aqui muda o jogo dela.
 */
export function montarOpcoes(app: HTMLElement, irParaPais: () => void): Opcoes {
  const selo = h('span', { class: 'opcoes-selo', html: SEM_SOM });
  const botao = h('button', { type: 'button', class: 'opcoes-botao', 'aria-label': 'Opções e ajuda', 'aria-expanded': 'false', html: ESTRELINHA });
  botao.appendChild(selo);
  const veu = h('div', { class: 'opcoes-veu' });
  const painel = h('aside', { class: 'opcoes-painel', role: 'dialog', 'aria-label': 'Opções', 'aria-hidden': 'true' });
  const el = h('div', { class: 'opcoes' }, veu, painel, botao);
  app.appendChild(el);

  let tela = '';
  let params: Record<string, string> = {};
  let aberto = false;

  const marcarMudo = () => botao.classList.toggle('mudo', estado().pais.mudo);
  marcarMudo();

  /* nenhum toque aqui chega na cena de baixo */
  for (const alvo of [botao, veu, painel]) {
    alvo.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    alvo.addEventListener('pointerup', (ev) => ev.stopPropagation());
  }

  const abrir = () => {
    montarPainel();
    aberto = true;
    el.classList.add('aberto');
    botao.setAttribute('aria-expanded', 'true');
    painel.setAttribute('aria-hidden', 'false');
  };

  const fechar = () => {
    if (!aberto) return;
    aberto = false;
    el.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
    painel.setAttribute('aria-hidden', 'true');
  };

  botao.addEventListener('click', () => (aberto ? fechar() : abrir()));
  veu.addEventListener('click', fechar);

  /** um interruptor de duas posições, no mesmo jeito do cantinho dos pais */
  function interruptor(ligado: boolean, textos: [string, string], ao: () => boolean): HTMLButtonElement {
    const b = h('button', { type: 'button', class: ligado ? 'ligado' : '', 'aria-pressed': String(ligado) }, ligado ? textos[0] : textos[1]);
    b.addEventListener('click', () => {
      const agora = ao();
      b.className = agora ? 'ligado' : '';
      b.setAttribute('aria-pressed', String(agora));
      b.textContent = agora ? textos[0] : textos[1];
    });
    return b;
  }

  function linha(nome: string, sub: string, ...acoes: (Node | null)[]): HTMLElement {
    return h('div', { class: 'linha' }, h('span', { class: 'nome' }, nome, h('span', { class: 'sub' }, sub)), ...acoes);
  }

  function montarPainel(): void {
    painel.innerHTML = '';
    const e = estado();

    painel.append(h('div', { class: 'opcoes-topo' }, h('h1', {}, 'Opções'), h('button', { type: 'button', class: 'opcoes-fechar', 'aria-label': 'Fechar', onClick: fechar }, '×')));

    /* a ajuda desta tela: fechada, abre num toque */
    const ajuda = ajudaDaTela(tela, params);
    if (ajuda) {
      const detalhes = h(
        'details',
        { class: 'opcoes-ajuda' },
        h('summary', {}, h('span', { class: 'opcoes-interrogacao', 'aria-hidden': 'true' }, '?'), 'Ajuda: ', ajuda.titulo),
        h('p', {}, ajuda.oque),
        h('p', {}, h('b', {}, 'O que fazer. '), ajuda.fazer),
        h('p', { class: 'opcoes-nota' }, 'Nada no jogo é errado. Se ela ficar parada, a mãozinha aparece e mostra o gesto.'),
      );
      painel.append(detalhes);
    }

    /* o som */
    painel.append(
      linha(
        'Som',
        'Música, vozes e efeitos. O jogo funciona igual sem som.',
        interruptor(!e.pais.mudo, ['Ligado', 'Desligado'], () => {
          mudar((x) => void (x.pais.mudo = !x.pais.mudo));
          const mudo = estado().pais.mudo;
          audio.definirMudo(mudo);
          if (!mudo) void audio.tentarDestravar();
          marcarMudo();
          return !mudo;
        }),
      ),
    );

    /* o balão de leitura */
    painel.append(
      linha(
        'Balão de leitura',
        'A frase no alto da tela, para ler em voz alta para a Stella.',
        interruptor(e.pais.narracao, ['Ligado', 'Desligado'], () => {
          mudar((x) => void (x.pais.narracao = !x.pais.narracao));
          return estado().pais.narracao;
        }),
      ),
    );

    /* tela cheia, quando o navegador deixa e o jogo não está instalado (instalado já é tela cheia) */
    if (document.fullscreenEnabled && !document.fullscreenElement && !estaInstalado()) {
      const b = h('button', { type: 'button' }, 'Ativar');
      b.addEventListener('click', () => {
        void telaCheia().then((ok) => {
          if (ok) b.closest('.linha')?.remove();
        });
      });
      painel.append(linha('Tela cheia', 'Esconde a barra do navegador.', b));
    }

    /* a versão e a busca por uma nova */
    const onde = estaInstalado() ? 'Instalado na tela inicial.' : 'Aberto no navegador.';
    const aviso = h('div', { class: 'opcoes-estado', role: 'status' }, novaVersaoAChegar() ? textoDaBusca('nova') : '');
    let buscar: HTMLButtonElement | null = null;
    if (temServiceWorker()) {
      const b = h('button', { type: 'button' }, 'Procurar');
      b.addEventListener('click', () => {
        b.disabled = true;
        aviso.textContent = 'Procurando…';
        void buscarNovaVersao().then((r) => {
          aviso.textContent = textoDaBusca(r);
          b.disabled = false;
        });
      });
      buscar = b;
    }
    painel.append(linha('Atualização', `Little Star ${versao()}. ${onde}`, buscar), aviso);

    if (podeInstalar()) {
      const b = h('button', { type: 'button' }, 'Instalar');
      b.addEventListener('click', () => {
        void instalar().then((r) => {
          if (r === 'instalado') b.closest('.linha')?.remove();
        });
      });
      painel.append(linha('Instalar na tela inicial', 'Vira um ícone no celular e abre sem internet.', b));
    }

    /* o cantinho dos pais: a continha continua lá na porta */
    const pais = h('button', { type: 'button', class: 'primario' }, 'Abrir');
    pais.addEventListener('click', () => {
      fechar();
      irParaPais();
    });
    painel.append(linha('Cantinho dos pais', 'O dia dela, as vozes gravadas e todos os ajustes. Pede uma continha para entrar.', pais));
  }

  return {
    trocarTela: (nome, p) => {
      tela = nome;
      params = p;
      fechar();
      el.classList.toggle('escondido', SEM_OPCOES.has(nome));
    },
    aberto: () => aberto,
    fechar,
  };
}
