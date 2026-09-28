import { convidarParaCasa, mover, pedrinhasSobem, telaSvg, type TelaSvg } from './comum';
import { guiar, type Ponto } from './guia';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { anunciar } from '@/core/narracao';
import { esperar, svgEl } from '@/core/util';
import { travar } from '@/core/toque';
import { familia, figurinoDe, type PassoDeBale, type Pose } from '@/puppet/boneco';
import { centelha, contornoLuz, veu } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { aplauso, lira } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import { falarEspanhol } from '@/audio/espanhol';
import { espanholAtivo } from '@/core/laco';
import type { Tela } from '@/core/roteador';

/** os números do recital, na ordem: cada um com a sua música (todas já moram em `src/data/musicas`) */
export const PLAYLIST_DO_PALCO = ['fada_acucarada', 'valsa_das_flores', 'cisnes', 'marcha'] as const;
/** quantos passos fecham um número: a plateia bate palma e a música seguinte começa */
export const PASSOS_POR_NUMERO = 8;

/** um passo de balé com botão na ribalta: a pose, a nota da lira e a voz da professora (a mãe) */
export interface PassoDoPalco {
  id: PassoDeBale;
  nota: number;
  voz: string;
}
/* as notas ficam uma oitava acima e bem baixinhas: um toque de caixinha de música, não um piano */
/** os conjuntos de passos da ribalta: o primeiro número tem um, o segundo traz outro, e alternam */
export const CONJUNTOS_DE_PASSOS: PassoDoPalco[][] = [
  [
    { id: 'plie', nota: 79, voz: 'passo_plie' },
    { id: 'releve', nota: 86, voz: 'passo_releve' },
    { id: 'arabesque', nota: 83, voz: 'passo_arabesque' },
    { id: 'giro', nota: 91, voz: 'passo_pirueta' },
  ],
  [
    { id: 'tendu', nota: 81, voz: 'passo_tendu' },
    { id: 'passe', nota: 84, voz: 'passo_passe' },
    { id: 'attitude', nota: 86, voz: 'passo_attitude' },
    { id: 'pulo', nota: 93, voz: 'passo_echappe' },
  ],
];
export const PASSOS_DO_PALCO: PassoDoPalco[] = CONJUNTOS_DE_PASSOS[0]!;
/** tocar no palco (fora dos botões) é o salto: sempre dá certo */
const SALTO: PassoDoPalco = { id: 'salto', nota: 88, voz: 'passo_salto' };
const TODOS_OS_PASSOS: PassoDoPalco[] = [...CONJUNTOS_DE_PASSOS.flat(), SALTO];
/** quantos passos, no total, fazem do show um show: fechar a cortina antes disso é desistir da dança */
export const PASSOS_PARA_VALER = PASSOS_POR_NUMERO;
const VOLUME_DO_PASSO = 0.1;

/** a coreografia do fecho da aventura, que ela faz sozinha */
const COREOGRAFIA_DO_FECHO: PassoDeBale[] = ['plie', 'releve', 'tendu', 'arabesque', 'passe', 'giro', 'attitude', 'salto', 'pulo'];

/* a ribalta: os botões dos passos, a nota da música seguinte e a cortina, numa linha só no chão do palco */
const Y_RIBALTA = 578;
const X_NOTA = 40;
const X_PASSOS = [104, 168, 232, 296];
const X_CORTINA = 352;
const R_BOTAO = 27;
const STELLA_X = 195;
const CHAO = 470;
const ALTURA = 170;
/* a barrinha da coreografia, no alto, entre a casinha e as opções */
const Y_BARRA = 104;

/**
 * O palco: cortina de veludo, luz de ribalta, plateia com a mãe, o pai, o
 * Theo e as bonecas. Vem em dois jeitos.
 *
 * A brincadeira (as sapatilhas na parede do quarto): ela é quem dança. Entre
 * um passo e outro a Stella nunca fica parada: gira devagar na ponta dos pés,
 * como a bailarina de uma caixinha de música. Na ribalta, um botão para cada
 * passo, com a Stella desenhada na pose (plié, relevé, arabesque, pirueta);
 * tocar no palco é o salto. Cada passo sai na hora, leve, com uma nota
 * baixinha e a voz da professora, e nunca sai errado. No alto, a barrinha da
 * coreografia: uma conta por passo; um passo diferente do anterior vira
 * estrela, um repetido vira só ouro. Com oito contas a família bate palma
 * (mais forte quanto mais estrelas) e o número seguinte começa, com outra
 * música da playlist; a nota na ponta da ribalta pula para o próximo. A
 * cortina na outra ponta acende no primeiro passo: é ela quem fecha o show,
 * com o agradecimento como no balé, o aplauso, o abraço e a cortina descendo.
 * O segundo número traz quatro passos novos na ribalta (tendu, passé,
 * attitude, échappé), e os conjuntos alternam. Fechar a cortina antes de
 * oito passos não é show: é desistir da dança por agora (uma palminha, a
 * cortina desce, sem "Brava!").
 *
 * O fecho (`fecho=1`, o fim de toda aventura): a cortina abre e ela dança
 * sozinha uma coreografia curta com os mesmos passos, a família assiste,
 * agradecimento, aplauso, a boneca nova na estante, abraço e a cortina fecha.
 * Uns vinte segundos, sem botões nem mãozinha: é a recompensa, não uma tarefa.
 */
export function telaPalco(params: Record<string, string> = {}): Tela {
  const e = estado();
  const fecho = params.fecho === '1';
  let s = `<rect width="390" height="780" fill="#10142a"/>` + veu(0, 0, 390, 780, '#232a55', 5, 0.4);
  /* chão do palco e poça de luz */
  s += `<rect x="0" y="${CHAO}" width="390" height="140" fill="#2a1d22"/><ellipse cx="${STELLA_X}" cy="${CHAO}" rx="150" ry="26" fill="#ebd9a8" opacity="0.28"/>`;
  s += `<g class="ribalta-luz"><path d="M${STELLA_X} 60L60 ${CHAO + 10}h270z" fill="#ebd9a8" opacity="0.1"/></g>`;
  /* a Stella de tutu e coque, em quatro grupos: o de fora passeia de um lado a outro do palco,
     o seguinte gira devagar (a caixinha de música), o do meio sobe e desce no compasso, o de
     dentro faz o passo */
  s += `<g class="passeio"><g class="caixinha"><g class="balanco"><g class="stella">${familia.stellaPalco(STELLA_X, CHAO, ALTURA, 'releve').svg}</g></g></g></g>`;
  /* a boneca companheira assiste da coxia, pertinho */
  if (e.companheira >= 0) s += familia.boneca(70, CHAO, 40, e.companheira, { contorno: '#ebd9a8', ...figurinoDe(e.figurinos[String(e.companheira)]) }).svg;
  /* o palco inteiro é o salto (na brincadeira) ou centelhas (no fecho); os botões ficam por cima */
  s += `<rect class="palco" x="0" y="60" width="390" height="${CHAO + 60}" fill="transparent"/>`;
  /* a ribalta: só na brincadeira */
  if (!fecho) {
    const botao = (x: number, dentro: string, attrs: string) =>
      `<g ${attrs}><circle cx="${x}" cy="${Y_RIBALTA}" r="${R_BOTAO}" fill="#fbf8f1" fill-opacity="0.92" stroke="#c6a15b" stroke-width="1.5"/>${dentro}</g>`;
    s += `<g class="ribalta">`;
    s += botao(X_NOTA, notaMusical(X_NOTA, Y_RIBALTA), 'data-alvo="nota"');
    PASSOS_DO_PALCO.forEach((p, i) => (s += botao(X_PASSOS[i]!, `<g class="figura">${iconeDoPasso(X_PASSOS[i]!, p.id)}</g>`, `data-passo="${p.id}"`)));
    s += `</g>`;
  }
  /* plateia: primeira fila */
  s += `<rect x="0" y="610" width="390" height="170" fill="#1b2140"/><g class="plateia"></g><g class="bonecas">`;
  for (let i = 0; i < Math.min(e.bonecas, 4); i++) s += familia.boneca(40 + i * 100 + 20, 690, 32, i, { contorno: '#ebd9a8', ...figurinoDe(e.figurinos[String(i)]) }).svg;
  s += `</g>`;
  /* cortinas */
  s += `<g class="cortina-e"><rect x="0" y="0" width="200" height="620" fill="#6e1a27"/><rect x="0" y="0" width="200" height="620" fill="url(#veludo)" opacity="0.5"/></g><g class="cortina-d"><rect x="190" y="0" width="200" height="620" fill="#6e1a27"/></g>`;
  s += `<defs><linearGradient id="veludo" x1="0" x2="1"><stop offset="0" stop-color="#4a0f19"/><stop offset="0.35" stop-color="#8a2534"/><stop offset="0.6" stop-color="#5a1420"/><stop offset="0.85" stop-color="#7d202e"/><stop offset="1" stop-color="#4a0f19"/></linearGradient></defs>`;
  s += `<g class="brilhos"></g>`;
  const tela = telaSvg(s, { fundo: '#10142a' });
  const svg = tela.svg;
  const stella = svg.querySelector('.stella') as SVGGElement;
  const passeio = svg.querySelector('.passeio') as SVGGElement;
  const caixinha = svg.querySelector('.caixinha') as SVGGElement;
  const balanco = svg.querySelector('.balanco') as SVGGElement;
  const brilhos = svg.querySelector('.brilhos') as SVGGElement;
  const plateia = svg.querySelector('.plateia') as SVGGElement;
  const cortinaE = svg.querySelector('.cortina-e') as SVGElement;
  const cortinaD = svg.querySelector('.cortina-d') as SVGElement;
  travar(1500);
  pararFundo();

  let vivo = true;
  let dancando = true;
  let seq: Sequenciador | null = null;
  let timerPose: number | null = null;
  tela.aoDestruir(() => {
    vivo = false;
    seq?.parar();
    if (timerPose !== null) window.clearTimeout(timerPose);
  });

  /* a família na primeira fila: olhando, ou batendo palma */
  const desenharPlateia = (palma: boolean) => {
    const p: Pose = palma ? 'palma' : 'parado';
    plateia.innerHTML =
      familia.mae(90, 720, 96, p, { contorno: '#ebd9a8' }).svg + familia.pai(300, 720, 104, p, { contorno: '#ebd9a8' }).svg + familia.theo(195, 722, 76, palma ? 'palma' : 'acena', { contorno: '#ebd9a8' }).svg;
  };
  desenharPlateia(false);

  const trocarPose = (p: Pose) => {
    stella.innerHTML = familia.stellaPalco(STELLA_X, CHAO, ALTURA, p).svg;
  };
  const centelhar = () => {
    brilhos.innerHTML = `<g class="sobe">${centelha(STELLA_X + (Math.random() - 0.5) * 80, 300, 14, '#c6a15b')}${centelha(STELLA_X + (Math.random() - 0.5) * 80, 320, 10, '#f2a9c4')}</g>`;
  };
  for (const g of [passeio, caixinha, balanco, stella]) {
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = 'center';
  }
  /* o passeio: ela atravessa o palco devagar, de um lado para o outro, sem parar de dançar */
  const passeando = passeio.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-52px)' }, { transform: 'translateX(52px)' }, { transform: 'translateX(0)' }], { duration: 16000, iterations: Infinity, easing: 'ease-in-out' });
  /* o passeio para e ela volta ao meio do palco, devagar (para o agradecimento e o abraço) */
  const voltarAoMeio = () => {
    const agora = new DOMMatrix(getComputedStyle(passeio).transform).m41;
    passeando.cancel();
    passeio.animate([{ transform: `translateX(${agora}px)` }, { transform: 'translateX(0)' }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' });
  };
  /* o balanço de quem dança: sobe e desce um tiquinho, no compasso */
  balanco.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 1500, iterations: Infinity, easing: 'ease-in-out' });
  /* a caixinha de música: na ponta dos pés, girando devagar, sem parar, enquanto espera o próximo passo */
  let giroLento: Animation | null = null;
  const bailar = () => {
    trocarPose('releve');
    giroLento?.cancel();
    giroLento = caixinha.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 6000, iterations: Infinity, easing: 'ease-in-out' });
  };
  const pararDeBailar = () => {
    giroLento?.cancel();
    giroLento = null;
  };
  bailar();

  /** um passo: ela vira de frente e faz a pose na hora (a pirueta gira, o salto sobe); depois volta a bailar */
  const dancar = (p: PassoDoPalco, volta = 1000) => {
    pararDeBailar();
    trocarPose(p.id);
    if (p.id === 'giro') stella.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 700, easing: 'ease-in-out' });
    if (p.id === 'salto') stella.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-46px)', offset: 0.5 }, { transform: 'translateY(0)' }], { duration: 700, easing: 'ease-out' });
    lira(p.nota, undefined, VOLUME_DO_PASSO);
    centelhar();
    if (temVoz(p.voz)) void falar(p.voz);
    if (timerPose !== null) window.clearTimeout(timerPose);
    timerPose = window.setTimeout(() => {
      if (vivo && dancando) bailar();
    }, volta);
  };

  const tocarNumero = (i: number) => {
    seq?.parar();
    seq = new Sequenciador(musica(PLAYLIST_DO_PALCO[i % PLAYLIST_DO_PALCO.length]!), { loop: true });
    seq.ganho = 0.4;
    seq.iniciar(audio.agora() + 0.2);
  };

  const abrirCortina = async () => {
    await audio.tentarDestravar();
    await esperar(600);
    mover(cortinaE, -200, 0, 1800);
    mover(cortinaD, 200, 0, 1800);
  };
  const fecharCortina = async () => {
    mover(cortinaE, 0, 0, 1800);
    mover(cortinaD, 0, 0, 1800);
    await esperar(1900);
  };
  /* às vezes a Estrellita conta a entrada em espanhol: sempre na brincadeira, nas aventuras ímpares no fecho */
  const contarEntrada = async () => {
    if (!espanholAtivo(e) || (fecho && e.aventuras % 2 === 0)) return;
    if (temVoz('es_contagem')) await falar('es_contagem');
    else for (const n of ['cinco', 'seis', 'sete', 'oito']) await falarEspanhol(n, 0.9);
  };

  /* o fim de todo show: o agradecimento como no balé (os braços abrem na segunda posição, um pé
     cruza atrás, os joelhos dobram, um braço abre e o outro desce, a cabeça agradece, e ela
     sobe de novo), o aplauso, o "Brava!", o abraço na coxia e a cortina descendo */
  const agradecimento = async () => {
    dancando = false;
    seq?.parar();
    if (timerPose !== null) window.clearTimeout(timerPose);
    pararDeBailar();
    voltarAoMeio();
    trocarPose('segunda');
    await esperar(800);
    trocarPose('agradece');
    stella.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(6px)', offset: 0.35 }, { transform: 'translateY(6px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 1800, easing: 'ease-in-out' });
    await esperar(600);
    desenharPlateia(true);
    aplauso(4);
    tela.comemorar(STELLA_X, 300);
    travar(6000);
    await esperar(1000);
    if (temVoz('brava')) await falar('brava');
    else await esperar(900);
    if (espanholAtivo(e)) await falarEspanhol('muy_bien');
    trocarPose('segunda');
    await esperar(500);
    trocarPose('acena');
  };
  /* fechou a cortina cedo demais: não é show, é desistir da dança por agora. Ela acena, a família
     bate uma palminha, a cortina desce e a casinha acende. Sem "Brava!", sem narração. */
  const desistencia = async () => {
    dancando = false;
    seq?.parar();
    if (timerPose !== null) window.clearTimeout(timerPose);
    pararDeBailar();
    voltarAoMeio();
    trocarPose('acena');
    aplauso(1);
    travar(3000);
    await esperar(1400);
    if (!vivo) return;
    await fecharCortina();
    if (vivo) convidarParaCasa(tela);
  };
  const abracoECortina = async () => {
    await esperar(1200);
    desenharPlateia(false);
    passeio.getAnimations().forEach((a) => a.cancel());
    stella.innerHTML = familia.stellaPalco(180, CHAO, ALTURA, 'parado').svg + familia.pai(230, CHAO, 200, 'abraca', { dir: -1, contorno: '#ebd9a8' }).svg;
    await esperar(1800);
    if (!vivo) return;
    await fecharCortina();
    if (vivo) convidarParaCasa(tela);
  };

  if (fecho) {
    /* tocar no palco enquanto ela dança: centelhas e uma nota, nunca errado */
    tela.alvo(
      '.palco',
      () => {
        if (!dancando) return;
        lira(SALTO.nota, undefined, VOLUME_DO_PASSO);
        centelhar();
      },
      true,
    );
    void (async () => {
      await abrirCortina();
      await contarEntrada();
      if (!vivo) return;
      tocarNumero(0);
      await esperar(1400);
      for (const p of COREOGRAFIA_DO_FECHO) {
        if (!vivo) return;
        dancar(TODOS_OS_PASSOS.find((x) => x.id === p) ?? SALTO, 900);
        await esperar(1300);
      }
      if (!vivo) return;
      await agradecimento();
      mudar((x) => {
        if (x.bonecas < 5) x.bonecas += 1;
        ganhar(x, PEDRINHAS.aventura, 'aventura');
      });
      pedrinhasSobem(tela, PEDRINHAS.aventura, STELLA_X, 440);
      await abracoECortina();
    })();
    return tela;
  }

  return brincadeira(tela, { dancar, tocarNumero, desenharPlateia, abrirCortina, contarEntrada, agradecimento, desistencia, abracoECortina, viva: () => vivo && dancando });
}

/** a brincadeira do palco: os botões, a barrinha, os números e a cortina */
function brincadeira(
  tela: TelaSvg,
  c: {
    dancar: (p: PassoDoPalco) => void;
    tocarNumero: (i: number) => void;
    desenharPlateia: (palma: boolean) => void;
    abrirCortina: () => Promise<void>;
    contarEntrada: () => Promise<void>;
    agradecimento: () => Promise<void>;
    desistencia: () => Promise<void>;
    abracoECortina: () => Promise<void>;
    viva: () => boolean;
  },
): Tela {
  const svg = tela.svg;
  let aberta = false;
  let numero = 0;
  let trocando = false;
  let acabou = false;
  let totalDePassos = 0;
  const feitos = new Set<PassoDeBale>();
  /* os passos da ribalta agora: o conjunto do número (alternam) */
  const conjunto = () => CONJUNTOS_DE_PASSOS[numero % CONJUNTOS_DE_PASSOS.length]!;
  const desenharRibalta = () => {
    svg.querySelectorAll('[data-passo]').forEach((g, i) => {
      const p = conjunto()[i]!;
      g.setAttribute('data-passo', p.id);
      (g.querySelector('.figura') as SVGGElement).innerHTML = iconeDoPasso(X_PASSOS[i]!, p.id);
    });
  };
  const barra = barraDaCoreografia(tela);
  const cortina = botaoCortina(tela, () => void fim());

  /* a mãozinha: o passo que ela ainda não fez; todos feitos, a nota da música seguinte; parada de novo, a cortina */
  const guia = guiar(tela, {
    soParada: true,
    proximo: () => {
      if (!aberta || !c.viva() || trocando) return null;
      if (cortina.acesa && totalDePassos >= PASSOS_PARA_VALER && (guia.ajuda.nivel >= 2 || numero >= PLAYLIST_DO_PALCO.length)) return { tipo: 'apontar', em: cortina.onde };
      const i = conjunto().findIndex((p) => !feitos.has(p.id));
      if (i >= 0) return { tipo: 'tocar', em: [X_PASSOS[i]!, Y_RIBALTA] as Ponto };
      return { tipo: 'tocar', em: [X_NOTA, Y_RIBALTA] as Ponto };
    },
  });

  /* o número acabou (oito passos, ou a nota): a família bate palma (mais, quanto mais estrelas),
     a luz pisca, a barrinha esvazia e a música seguinte começa */
  const proximoNumero = async () => {
    if (trocando || !c.viva()) return;
    trocando = true;
    guia.parar();
    c.desenharPlateia(true);
    const forca = barra.estrelas / barra.total;
    aplauso(1.2 + forca * 2);
    if (forca >= 0.75) tela.comemorar(STELLA_X, 300);
    const luz = svg.querySelector('.ribalta-luz') as SVGGElement;
    luz.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 1200 });
    await esperar(1500 + forca * 800);
    if (!c.viva()) return;
    numero += 1;
    barra.zerar();
    desenharRibalta();
    c.desenharPlateia(false);
    c.tocarNumero(numero);
    trocando = false;
    guia.passo();
  };

  const passo = (p: PassoDoPalco) => {
    if (!c.viva() || trocando) return;
    cortina.acender();
    feitos.add(p.id);
    totalDePassos += 1;
    guia.passo();
    c.dancar(p);
    barra.marcar(p.id);
    if (barra.cheias >= barra.total) void proximoNumero();
  };
  tela.alvo('.palco', () => passo(SALTO), true);
  tela.alvo('[data-passo]', (_ev, el) => {
    const p = TODOS_OS_PASSOS.find((x) => x.id === el.getAttribute('data-passo'));
    if (!p) return;
    mover(el, 0, -4, 150);
    void esperar(170).then(() => mover(el, 0, 0, 250));
    passo(p);
  });
  tela.alvo('[data-alvo="nota"]', (_ev, el) => {
    mover(el, 0, -4, 150);
    void esperar(170).then(() => mover(el, 0, 0, 250));
    void proximoNumero();
  });

  const fim = async () => {
    if (!c.viva() || acabou) return;
    acabou = true;
    guia.calar();
    cortina.apagar();
    if (totalDePassos < PASSOS_PARA_VALER) {
      await c.desistencia();
      return;
    }
    await c.agradecimento();
    anunciar('palco');
    await c.abracoECortina();
  };

  void (async () => {
    await c.abrirCortina();
    await c.contarEntrada();
    if (!c.viva()) return;
    c.tocarNumero(0);
    aberta = true;
    /* a primeira demonstração quando a cortina acaba de abrir, com a música já tocando */
    await esperar(1400);
    if (c.viva() && guia.ajuda.nivel === 0) guia.mostrar();
  })();

  return tela;
}

/**
 * A barrinha da coreografia, no alto: uma conta por passo do número. Um passo
 * diferente do anterior vira estrela; um repetido, só ouro. Sem número nenhum:
 * ela vê a fileira encher e as estrelas contam quanto a dança variou.
 */
function barraDaCoreografia(tela: TelaSvg): { marcar: (p: PassoDeBale) => void; zerar: () => void; readonly cheias: number; readonly estrelas: number; readonly total: number } {
  const total = PASSOS_POR_NUMERO;
  const g = svgEl('<g class="trilha" style="pointer-events:none"></g>') as SVGGElement;
  const mao = tela.svg.querySelector('.camada-mao');
  if (mao) mao.before(g);
  else tela.svg.appendChild(g);
  const passo = 26;
  const xDe = (k: number) => 195 + (k - (total - 1) / 2) * passo;
  let contas: ('vazia' | 'ouro' | 'estrela')[] = new Array(total).fill('vazia');
  let ultimo: PassoDeBale | null = null;
  const desenhar = () => {
    let s = '';
    contas.forEach((c, k) => {
      const x = xDe(k);
      if (c === 'estrela') s += `<g data-k="${k}">${centelha(x, Y_BARRA, 22, '#c6a15b')}</g>`;
      else s += `<circle data-k="${k}" cx="${x}" cy="${Y_BARRA}" r="7" fill="${c === 'ouro' ? '#c6a15b' : '#fbf8f1'}" stroke="#c6a15b" stroke-width="2" opacity="${c === 'ouro' ? 1 : 0.6}"/>`;
    });
    g.innerHTML = s;
  };
  desenhar();
  return {
    marcar: (p) => {
      const k = contas.indexOf('vazia');
      if (k < 0) return;
      contas[k] = ultimo !== null && p !== ultimo ? 'estrela' : 'ouro';
      ultimo = p;
      desenhar();
      const c = g.querySelector(`[data-k="${k}"]`) as SVGElement | null;
      if (c) {
        c.style.transformBox = 'fill-box';
        c.style.transformOrigin = 'center';
        c.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
      }
    },
    zerar: () => {
      contas = new Array(total).fill('vazia');
      ultimo = null;
      desenhar();
    },
    get cheias() {
      return contas.filter((c) => c !== 'vazia').length;
    },
    get estrelas() {
      return contas.filter((c) => c === 'estrela').length;
    },
    total,
  };
}

/**
 * O botão da cortina, na ponta da ribalta: "o show acabou". Uma cortininha de
 * veludo com o cordão de ouro, apagada até o primeiro passo; acesa, pulsa, e
 * um toque fecha o show com a révérence.
 */
function botaoCortina(tela: TelaSvg, aoTocar: () => void): { acender: () => void; apagar: () => void; readonly acesa: boolean; readonly onde: Ponto } {
  const x = X_CORTINA;
  const y = Y_RIBALTA;
  const r = R_BOTAO;
  const cortininha =
    `<path d="M${x - 17} ${y - 14}h34v4h-34z" fill="#c6a15b"/>` +
    `<path d="M${x - 15} ${y - 10}h13q-6 10 -4 26h-9z" fill="#6e1a27"/><path d="M${x + 2} ${y - 10}h13v26h-9q2 -16 -4 -26z" fill="#6e1a27"/>` +
    `<path d="M${x - 9} ${y - 10}q-2 10 0 26M${x + 9} ${y - 10}q2 10 0 26" fill="none" stroke="#8a2534" stroke-width="1.6"/>` +
    `<path d="M${x - 14} ${y + 4}q6 -3 10 0M${x + 4} ${y + 4}q4 -3 10 0" fill="none" stroke="#c6a15b" stroke-width="2" stroke-linecap="round"/>`;
  const g = svgEl(
    `<g class="pronto" data-pronto style="opacity:0;pointer-events:none;transition:opacity 500ms"><circle cx="${x}" cy="${y}" r="${r}" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/>${contornoLuz(x, y, r + 6, r + 6)}${cortininha}</g>`,
  ) as SVGGElement;
  const mao = tela.svg.querySelector('.camada-mao');
  if (mao) mao.before(g);
  else tela.svg.appendChild(g);
  let acesa = false;
  tela.alvo('.pronto', () => {
    if (acesa) aoTocar();
  });
  return {
    acender: () => {
      if (acesa) return;
      acesa = true;
      g.style.opacity = '1';
      g.style.pointerEvents = 'auto';
    },
    apagar: () => {
      acesa = false;
      g.style.opacity = '0';
      g.style.pointerEvents = 'none';
    },
    get acesa() {
      return acesa;
    },
    onde: [x, y],
  };
}

/** a Stella pequenina na pose, para o botão do passo */
function iconeDoPasso(x: number, p: PassoDeBale): string {
  return familia.stellaPalco(x, Y_RIBALTA + 22, 44, p, { contorno: '' }).svg;
}

/** uma nota musical, para o botão da música seguinte */
function notaMusical(x: number, y: number): string {
  return `<path d="M${x + 5} ${y + 6}V${y - 12}q9 1 9 9" fill="none" stroke="#c6a15b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${x}" cy="${y + 7}" rx="6.5" ry="4.8" fill="#c6a15b" transform="rotate(-20 ${x} ${y + 7})"/>`;
}
