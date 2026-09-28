import { convidarParaCasa, mover, pedrinhasSobem, telaSvg, type TelaSvg } from './comum';
import { botaoPronto, guiar, type Ponto } from './guia';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { anunciar } from '@/core/narracao';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia, figurinoDe, type PassoDeBale, type Pose } from '@/puppet/boneco';
import { centelha, veu } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { aplauso, lira, sininho } from '@/audio/synth';
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
export const PASSOS_DO_PALCO: PassoDoPalco[] = [
  { id: 'plie', nota: 67, voz: 'passo_plie' },
  { id: 'releve', nota: 74, voz: 'passo_releve' },
  { id: 'arabesque', nota: 71, voz: 'passo_arabesque' },
  { id: 'giro', nota: 79, voz: 'passo_pirueta' },
];
/** tocar no palco (fora dos botões) é o salto: sempre dá certo, como antes */
const SALTO: PassoDoPalco = { id: 'salto', nota: 76, voz: 'passo_salto' };

/** a coreografia do fecho da aventura, que ela faz sozinha */
const COREOGRAFIA_DO_FECHO: PassoDeBale[] = ['plie', 'releve', 'arabesque', 'giro', 'salto', 'plie', 'releve', 'giro', 'salto'];

/* a ribalta: os botões dos passos, a nota da música seguinte e o visto, numa linha só no chão do palco */
const Y_RIBALTA = 578;
const X_NOTA = 40;
const X_PASSOS = [104, 168, 232, 296];
const X_VISTO = 352;
const R_BOTAO = 27;
const STELLA_X = 195;
const CHAO = 470;
const ALTURA = 170;

/**
 * O palco: cortina de veludo, luz de ribalta, plateia com a mãe, o pai, o
 * Theo e as bonecas. Vem em dois jeitos.
 *
 * A brincadeira (as sapatilhas na parede do quarto): ela é quem dança. Na
 * ribalta, um botão para cada passo, com a Stella desenhada na pose (plié,
 * relevé, arabesque, pirueta); tocar no palco é o salto. Cada passo sai na
 * hora, com a nota da lira e a voz da professora, e nunca sai errado. A cada
 * oito passos a família bate palma e o número seguinte começa, com outra
 * música da playlist (Fada Açucarada, Valsa das Flores, Cisnes, Marcha); a
 * nota na ponta da ribalta pula para o próximo. O visto verde acende no
 * primeiro passo, e é ela quem diz quando o show acaba: reverência, aplauso,
 * abraço na coxia.
 *
 * O fecho (`fecho=1`, o fim de toda aventura): a cortina abre e ela dança
 * sozinha uma coreografia curta com os mesmos passos, a família assiste,
 * reverência, aplauso, a boneca nova na estante e o abraço. Uns vinte
 * segundos, sem visto nem mãozinha: é a recompensa, não uma tarefa.
 */
export function telaPalco(params: Record<string, string> = {}): Tela {
  const e = estado();
  const fecho = params.fecho === '1';
  let s = `<rect width="390" height="780" fill="#10142a"/>` + veu(0, 0, 390, 780, '#232a55', 5, 0.4);
  /* chão do palco e poça de luz */
  s += `<rect x="0" y="${CHAO}" width="390" height="140" fill="#2a1d22"/><ellipse cx="${STELLA_X}" cy="${CHAO}" rx="150" ry="26" fill="#ebd9a8" opacity="0.28"/>`;
  s += `<g class="ribalta-luz"><path d="M${STELLA_X} 60L60 ${CHAO + 10}h270z" fill="#ebd9a8" opacity="0.1"/></g>`;
  /* a Stella de tutu e coque: o grupo de fora balança no compasso, o de dentro faz o passo */
  s += `<g class="balanco"><g class="stella">${familia.stellaPalco(STELLA_X, CHAO, ALTURA, 'parado').svg}</g></g>`;
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
    PASSOS_DO_PALCO.forEach((p, i) => (s += botao(X_PASSOS[i]!, familia.stellaPalco(X_PASSOS[i]!, Y_RIBALTA + 22, 44, p.id, { contorno: '' }).svg, `data-passo="${p.id}"`)));
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
  const balanco = svg.querySelector('.balanco') as SVGGElement;
  const brilhos = svg.querySelector('.brilhos') as SVGGElement;
  const plateia = svg.querySelector('.plateia') as SVGGElement;
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
  /* o balanço de quem espera a música: sobe e desce um tiquinho, no compasso */
  balanco.style.transformBox = 'fill-box';
  balanco.style.transformOrigin = 'center';
  balanco.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 1500, iterations: Infinity, easing: 'ease-in-out' });
  stella.style.transformBox = 'fill-box';
  stella.style.transformOrigin = 'center';

  /** um passo: a pose na hora, a pirueta gira e o salto sobe; depois de um segundo ela volta a esperar */
  const dancar = (p: PassoDoPalco) => {
    trocarPose(p.id);
    if (p.id === 'giro') stella.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 700, easing: 'ease-in-out' });
    if (p.id === 'salto') stella.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-46px)', offset: 0.5 }, { transform: 'translateY(0)' }], { duration: 700, easing: 'ease-out' });
    lira(p.nota, undefined, 0.3);
    centelhar();
    if (temVoz(p.voz)) void falar(p.voz);
    if (timerPose !== null) window.clearTimeout(timerPose);
    timerPose = window.setTimeout(() => {
      if (vivo && dancando) trocarPose('parado');
    }, 1000);
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
    const ce = svg.querySelector('.cortina-e') as SVGElement;
    const cd = svg.querySelector('.cortina-d') as SVGElement;
    mover(ce, -200, 0, 1800);
    mover(cd, 200, 0, 1800);
  };
  /* às vezes a Estrellita conta a entrada em espanhol: sempre na brincadeira, nas aventuras ímpares no fecho */
  const contarEntrada = async () => {
    if (!espanholAtivo(e) || (fecho && e.aventuras % 2 === 0)) return;
    if (temVoz('es_contagem')) await falar('es_contagem');
    else for (const n of ['cinco', 'seis', 'sete', 'oito']) await falarEspanhol(n, 0.9);
  };

  /* o fim de todo show: reverência, aplauso, o "Brava!", e o abraço na coxia */
  const reverencia = async () => {
    dancando = false;
    seq?.parar();
    if (timerPose !== null) window.clearTimeout(timerPose);
    trocarPose('reverencia');
    desenharPlateia(true);
    aplauso(4);
    tela.comemorar(STELLA_X, 300);
    travar(6000);
    if (temVoz('brava')) await falar('brava');
    else await esperar(1200);
    if (espanholAtivo(e)) await falarEspanhol('muy_bien');
    sininho();
  };
  const abraco = async () => {
    await esperar(1500);
    desenharPlateia(false);
    stella.innerHTML = familia.stellaPalco(180, CHAO, ALTURA, 'parado').svg + familia.pai(230, CHAO, 200, 'abraca', { dir: -1, contorno: '#ebd9a8' }).svg;
    await esperar(1500);
    if (vivo) convidarParaCasa(tela);
  };

  if (fecho) {
    /* tocar no palco enquanto ela dança: centelhas e uma nota, nunca errado */
    tela.alvo(
      '.palco',
      () => {
        if (!dancando) return;
        lira(SALTO.nota, undefined, 0.25);
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
        dancar(p === 'salto' ? SALTO : (PASSOS_DO_PALCO.find((x) => x.id === p) ?? SALTO));
        await esperar(1000);
      }
      if (!vivo) return;
      await reverencia();
      mudar((x) => {
        if (x.bonecas < 5) x.bonecas += 1;
        ganhar(x, PEDRINHAS.aventura, 'aventura');
      });
      pedrinhasSobem(tela, PEDRINHAS.aventura, STELLA_X, 440);
      await abraco();
    })();
    return tela;
  }

  return brincadeira(tela, { dancar, tocarNumero, desenharPlateia, abrirCortina, contarEntrada, reverencia, abraco, viva: () => vivo && dancando });
}

/** a brincadeira do palco: os botões, os números e o visto */
function brincadeira(
  tela: TelaSvg,
  c: {
    dancar: (p: PassoDoPalco) => void;
    tocarNumero: (i: number) => void;
    desenharPlateia: (palma: boolean) => void;
    abrirCortina: () => Promise<void>;
    contarEntrada: () => Promise<void>;
    reverencia: () => Promise<void>;
    abraco: () => Promise<void>;
    viva: () => boolean;
  },
): Tela {
  const svg = tela.svg;
  let aberta = false;
  let numero = 0;
  let passosNoNumero = 0;
  let trocando = false;
  let acabou = false;
  const feitos = new Set<PassoDeBale>();

  /* o visto, na ponta da ribalta, aceso no primeiro passo */
  const pronto = botaoPronto(tela, X_VISTO, Y_RIBALTA, () => void fim(), R_BOTAO);

  /* a mãozinha: o passo que ela ainda não fez; todos feitos, a nota da música seguinte; parada de novo, o visto */
  const guia = guiar(tela, {
    soParada: true,
    proximo: () => {
      if (!aberta || !c.viva() || trocando) return null;
      if (pronto.aceso && (guia.ajuda.nivel >= 2 || numero >= PLAYLIST_DO_PALCO.length)) return { tipo: 'apontar', em: pronto.onde };
      const i = PASSOS_DO_PALCO.findIndex((p) => !feitos.has(p.id));
      if (i >= 0) return { tipo: 'tocar', em: [X_PASSOS[i]!, Y_RIBALTA] as Ponto };
      return { tipo: 'tocar', em: [X_NOTA, Y_RIBALTA] as Ponto };
    },
  });

  /* o número acabou (oito passos, ou a nota): a família bate palma, a luz pisca, a música seguinte começa */
  const proximoNumero = async () => {
    if (trocando || !c.viva()) return;
    trocando = true;
    guia.parar();
    c.desenharPlateia(true);
    aplauso(1.6);
    const luz = svg.querySelector('.ribalta-luz') as SVGGElement;
    luz.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 1200 });
    await esperar(1500);
    if (!c.viva()) return;
    numero += 1;
    passosNoNumero = 0;
    c.desenharPlateia(false);
    c.tocarNumero(numero);
    trocando = false;
    guia.passo();
  };

  const passo = (p: PassoDoPalco) => {
    if (!c.viva() || trocando) return;
    pronto.acender();
    feitos.add(p.id);
    guia.passo();
    c.dancar(p);
    passosNoNumero += 1;
    if (passosNoNumero >= PASSOS_POR_NUMERO) void proximoNumero();
  };
  tela.alvo('.palco', () => passo(SALTO), true);
  tela.alvo('[data-passo]', (_ev, el) => {
    const p = PASSOS_DO_PALCO.find((x) => x.id === el.getAttribute('data-passo'));
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
    await c.reverencia();
    anunciar('palco');
    await c.abraco();
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

/** uma nota musical, para o botão da música seguinte */
function notaMusical(x: number, y: number): string {
  return `<path d="M${x + 5} ${y + 6}V${y - 12}q9 1 9 9" fill="none" stroke="#c6a15b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${x}" cy="${y + 7}" rx="6.5" ry="4.8" fill="#c6a15b" transform="rotate(-20 ${x} ${y + 7})"/>`;
}
