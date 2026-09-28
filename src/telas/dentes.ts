import { quadroDePassos, relogioDeAjuda, telaSvg } from './comum';
import { entrarNoCuidado, terminarCuidado } from './cuidados';
import { demonstrar, type Ponto } from './guia';
import { ESCOVADAS_POR_PARTE, Escovacao, PASSOS, sujeirasQueFicam, type PassoDosDentes } from '@/core/cuidados';
import { Ajuda } from '@/core/ajuda';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { esperar, pontoNoSvg, svgEl } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { centelha, contornoLuz, veu } from '@/puppet/objetos';
import { musica, pararFundo } from '@/audio/musica';
import { escovada, lira, notaAgora, sininho, tiquinho, toc } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import type { Tela } from '@/core/roteador';

type Parte = 'cima' | 'lingua' | 'baixo';
const PARTES: Parte[] = ['cima', 'lingua', 'baixo'];
/** onde cada parte da boca mora no espelho: faixa de y e o meio */
const FAIXA: Record<Parte, { y0: number; y1: number; cy: number }> = {
  cima: { y0: 272, y1: 336, cy: 306 },
  lingua: { y0: 340, y1: 394, cy: 368 },
  baixo: { y0: 396, y1: 452, cy: 424 },
};
const X0 = 108;
const X1 = 282;
/**
 * As sujeirinhas de cada parte: uma manchinha em cada dente, cada uma num lugar
 * (perto da gengiva, no meio, na ponta), e umas poucas entre um dente e outro,
 * fininhas. Discretas: é um sorriso, não um susto. Somem aos poucos, fora de
 * ordem, como na escova de verdade. `entre` é a lasquinha no vão dos dentes.
 */
type Sujeira = [number, number, 'dente' | 'entre' | 'lingua'];
const SUJEIRAS: Record<Parte, Sujeira[]> = {
  cima: [[160, 293, 'dente'], [143, 314, 'entre'], [234, 316, 'dente'], [126, 309, 'dente'], [205, 298, 'dente'], [247, 312, 'entre'], [185, 316, 'dente'], [262, 296, 'dente']],
  lingua: [[168, 366, 'lingua'], [214, 374, 'lingua'], [190, 360, 'lingua'], [228, 364, 'lingua']],
  baixo: [[208, 426, 'dente'], [169, 416, 'entre'], [130, 412, 'dente'], [257, 428, 'dente'], [182, 430, 'dente'], [221, 411, 'entre'], [156, 424, 'dente'], [236, 414, 'dente']],
};
function sujeira([x, y, tipo]: Sujeira, id: string): string {
  if (tipo === 'entre') return `<ellipse data-suj="${id}" cx="${x}" cy="${y}" rx="1.5" ry="4" fill="#d8c48e" opacity="0.75"/>`;
  if (tipo === 'lingua') return `<ellipse data-suj="${id}" cx="${x}" cy="${y}" rx="4.5" ry="3" fill="#fbf3e6" opacity="0.8"/>`;
  return `<ellipse data-suj="${id}" cx="${x}" cy="${y}" rx="3.2" ry="2.4" fill="#e6d59f" opacity="0.8" transform="rotate(${(x * 7) % 40 - 20} ${x} ${y})"/>`;
}
/**
 * O reflexo de "ficou limpo": uma centelha branca com um fio azul da água em
 * volta, que nasce na beirada da fileira (não em cima do esmalte, onde a
 * sujeirinha estava), sobe e some. Ouro parado no dente parecia mancha.
 */
function reflexo(x: number, y: number, s: number, atraso = 0): string {
  return `<g class="sobe" style="animation-delay:${atraso}ms">${centelha(x, y, s, '#fffdf6', 'stroke="#7FA5B8" stroke-width="1.4" stroke-linejoin="round" paint-order="stroke"')}</g>`;
}
/** onde o reflexo de cada parte nasce: os cantos de fora da fileira */
const REFLEXOS: Record<Parte, [number, number][]> = {
  cima: [[X0 - 4, FAIXA.cima.y0 + 6], [X1 + 4, FAIXA.cima.y0 + 10]],
  lingua: [[X0 + 6, FAIXA.lingua.cy - 4], [X1 - 6, FAIXA.lingua.cy + 2]],
  baixo: [[X0 - 4, FAIXA.baixo.y1 - 8], [X1 + 4, FAIXA.baixo.y1 - 4]],
};
/** a pasta dela é de abacaxi: um amarelinho bem clarinho */
const PASTA = '#f6e7a8';
const PASTA_BORDA = '#e2c877';
/** a escova no copo, embaixo da torneira e descansando ao lado da boca */
const COPO: [number, number, number] = [322, 548, -78];
const TORNEIRA: [number, number, number] = [206, 574, -8];
const DESCANSO: [number, number, number] = [300, 470, -12];

const ICONES: Record<PassoDosDentes, (x: number, y: number) => string> = {
  molhar: (x, y) => `<path d="M${x - 8} ${y - 8}h10v4h-4" fill="none" stroke="#8f8270" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x - 2} ${y}q-3 4 0 6q3 -2 0 -6z" fill="#7FA5B8"/><path d="M${x + 3} ${y + 4}q-2 3 0 4q2 -1 0 -4z" fill="#7FA5B8"/>`,
  pasta: (x, y) => `<rect x="${x - 11}" y="${y - 3}" width="15" height="8" rx="2" fill="#fbf3d0" stroke="#c9a189" stroke-width="1"/><rect x="${x + 4}" y="${y - 1.5}" width="4" height="5" fill="#8fae6b"/><ellipse cx="${x + 11}" cy="${y + 1}" rx="3" ry="2.2" fill="${PASTA}" stroke="${PASTA_BORDA}" stroke-width="0.6"/>`,
  cima: (x, y) => boquinha(x, y, 'cima'),
  lingua: (x, y) => boquinha(x, y, 'lingua'),
  baixo: (x, y) => boquinha(x, y, 'baixo'),
  enxaguar: (x, y) => `<path d="M${x - 6} ${y - 7}h12l-2 14h-8z" fill="#dbe7ee" stroke="#7FA5B8" stroke-width="1.2"/><path d="M${x - 5} ${y - 1}h10" stroke="#7FA5B8" stroke-width="1.2"/>`,
  guardar: (x, y) => `<path d="M${x - 6} ${y - 2}h12l-1.5 10h-9z" fill="#f6e3dc" stroke="#c9a189" stroke-width="1"/><rect x="${x - 1.5}" y="${y - 12}" width="3" height="14" rx="1.5" fill="#f2a9c4"/><rect x="${x - 2.5}" y="${y - 15}" width="5" height="4" rx="1" fill="#fbf8f1" stroke="#c9a189" stroke-width="0.6"/>`,
};

/** uma boca pequena para o quadro de passos, com a parte da vez em ouro */
function boquinha(x: number, y: number, parte: Parte): string {
  const ouro = '#c6a15b';
  return `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#6e1a27"/><rect x="${x - 8}" y="${y - 7}" width="16" height="4" rx="1.5" fill="${parte === 'cima' ? ouro : '#fbf8f1'}"/><ellipse cx="${x}" cy="${y + 0.5}" rx="6" ry="2.4" fill="${parte === 'lingua' ? ouro : '#f2a9c4'}"/><rect x="${x - 8}" y="${y + 3}" width="16" height="4" rx="1.5" fill="${parte === 'baixo' ? ouro : '#fbf8f1'}"/>`;
}

/** um abacaxizinho no tubo da pasta: é o sabor que ela usa */
function abacaxi(x: number, y: number, k: number): string {
  return `<path d="M${x - 3 * k} ${y - 5 * k}l${3 * k} ${-5 * k}l${3 * k} ${5 * k}" fill="#8fae6b"/><ellipse cx="${x}" cy="${y + 1 * k}" rx="${5 * k}" ry="${6.5 * k}" fill="#ebc95a"/><path d="M${x - 3.5 * k} ${y - 2 * k}l${7 * k} ${6 * k}M${x + 3.5 * k} ${y - 2 * k}l${-7 * k} ${6 * k}" stroke="#c9a13e" stroke-width="${0.8 * k}"/>`;
}

/**
 * Escovar os dentes, na ordem de verdade: molhar a escova na torneira, pôr um
 * pouquinho de pasta (do tamanho de uma ervilha, e a ervilha aparece do lado
 * para ela ver), escovar os de cima, a língua e os de baixo, enxaguar a boca
 * e guardar a escova no copo. Escovar é esfregar o dedo devagar em cada parte:
 * cada escovada toca a próxima nota do Brilha, brilha, e as sujeirinhas somem
 * aos poucos. Esfregar com pressa não acaba antes; a música inteira dura o
 * tempo de escovar tudo.
 */
export function telaDentes(): Tela {
  entrarNoCuidado('dentes');
  let s = `<rect width="390" height="780" fill="#dbe7ee"/>` + veu(0, 0, 390, 780, '#9fc3cf', 4, 0.22);
  /* azulejos embaixo */
  for (let y = 520; y < 780; y += 34) s += `<path d="M0 ${y}H390" stroke="#fbf8f1" stroke-width="2" opacity="0.6"/>`;
  for (let x = 0; x < 390; x += 34) s += `<path d="M${x} 520V780" stroke="#fbf8f1" stroke-width="2" opacity="0.6"/>`;
  /* o espelho com a boca dela, bem de perto */
  s += `<rect x="52" y="186" width="286" height="330" rx="140" fill="#f6f0e4" stroke="#c6a15b" stroke-width="3"/>`;
  s += `<ellipse cx="195" cy="364" rx="128" ry="104" fill="#e58f9f"/><ellipse cx="195" cy="364" rx="110" ry="88" fill="#6e1a27"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${118 + i * 26}" y="${288 - (i === 2 || i === 3 ? 2 : 0)}" width="24" height="${34 + (i === 2 || i === 3 ? 4 : 0)}" rx="7" fill="#fbf8f1"/>`;
  s += `<ellipse cx="195" cy="370" rx="68" ry="26" fill="#f2a9c4"/><path d="M195 352v26" stroke="#e58fb0" stroke-width="2" opacity="0.6"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${118 + i * 26}" y="404" width="24" height="32" rx="7" fill="#fbf8f1"/>`;
  for (const p of PARTES) SUJEIRAS[p].forEach((q, i) => (s += sujeira(q, `${p}-${i}`)));
  s += `<g class="espuma"></g><g class="brilho"></g>`;
  s += `<rect class="pega-boca" x="84" y="252" width="222" height="220" fill="transparent"/>`;
  /* a pia: bancada, cuba, torneira, a pasta, o copinho de enxaguar e o copo da escova */
  s += `<rect x="16" y="560" width="358" height="40" rx="8" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.2"/><ellipse cx="195" cy="584" rx="92" ry="16" fill="#e8eef0" stroke="#c6a15b" stroke-width="1"/>`;
  s += `<g class="agua-cuba" opacity="0"><ellipse cx="195" cy="586" rx="60" ry="9" fill="#9fc3cf"/></g>`;
  s += `<g data-alvo="torneira"><circle cx="195" cy="536" r="36" fill="transparent"/><path d="M180 560v-26h30v12" fill="none" stroke="#8f8270" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><rect x="184" y="520" width="22" height="7" rx="3" fill="#8f8270"/><rect class="jato" x="207" y="552" width="6" height="30" rx="3" fill="#9fc3cf" opacity="0"/></g>`;
  s += `<g data-alvo="pasta"><circle cx="72" cy="586" r="38" fill="transparent"/><g class="tubo"><rect x="42" y="574" width="52" height="22" rx="6" fill="#fbf3d0" stroke="#c9a189" stroke-width="1.5"/>${abacaxi(64, 585, 1)}<rect x="94" y="579" width="10" height="12" rx="2" fill="#8fae6b"/></g><g class="ervilha" opacity="0"><circle cx="112" cy="556" r="6" fill="#8fae6b"/><circle cx="110" cy="554" r="2" fill="#c9dbb2"/></g></g>`;
  s += `<g data-alvo="copinho"><circle cx="276" cy="580" r="34" fill="transparent"/><g class="copinho"><path d="M262 562h28l-4 32h-20z" fill="#dbe7ee" stroke="#7FA5B8" stroke-width="1.5"/><path d="M264 574h24" stroke="#7FA5B8" stroke-width="1.2"/></g></g>`;
  s += `<g class="copo"><path d="M308 540h30l-3 52h-24z" fill="#f6e3dc" stroke="#c9a189" stroke-width="1.5"/></g>`;
  /* a escova: a cabeça fica no ponto (0, 0), o cabo vai para a direita */
  s += `<g data-alvo="escova" class="escova"><circle cx="30" cy="0" r="40" fill="transparent"/><rect x="8" y="-5" width="96" height="10" rx="5" fill="#f2a9c4"/><rect x="-24" y="-6" width="34" height="10" rx="3" fill="#f2a9c4"/><rect x="-22" y="-16" width="30" height="10" rx="2" fill="#fbf8f1" stroke="#c9a189" stroke-width="1"/><path d="M-18 -16v10M-12 -16v10M-6 -16v10M0 -16v10M4 -16v10" stroke="#e3dccd" stroke-width="1"/><g class="gotas" opacity="0"><circle cx="-14" cy="-19" r="2.4" fill="#9fc3cf"/><circle cx="-2" cy="-20" r="2" fill="#9fc3cf"/></g><g class="pasta-na-escova" opacity="0"><ellipse cx="-7" cy="-20" rx="7" ry="4.5" fill="${PASTA}" stroke="${PASTA_BORDA}" stroke-width="0.8"/><path d="M-12 -21q5 -3 10 0" stroke="#fbf8f1" stroke-width="1.4" fill="none" opacity="0.8"/></g></g>`;
  s += `<g class="luz"></g>`;
  /* a menina em cima do banquinho, olhando o espelho: só enfeite */
  s += `<g style="pointer-events:none"><rect x="20" y="730" width="92" height="16" rx="5" fill="#c9a189"/>${familia.menina(66, 734, 130, 'parado').svg}</g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  /* a música desta tela é ela quem toca, escovando */
  pararFundo();
  const notas = musica('brilha').notasMelodia.map((n) => n.midi);
  let nota = 0;
  const luz = svg.querySelector('.luz') as SVGGElement;
  const espuma = svg.querySelector('.espuma') as SVGGElement;
  const escova = svg.querySelector('.escova') as SVGGElement;
  escova.style.transformBox = 'view-box';
  escova.style.transformOrigin = '0 0';
  const escovaEm = (p: [number, number, number], ms = 600) => {
    escova.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
    escova.style.transform = `translate(${p[0]}px, ${p[1]}px) rotate(${p[2]}deg)`;
  };
  escovaEm(COPO, 0);
  const passos = quadroDePassos(tela, PASSOS.dentes.map((p) => ICONES[p]));

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  let k = 0;
  let ocupado = false;
  let pararGesto = () => {};
  let toques = 0;
  /* a mãozinha está levando a escova: o A2 escova junto sem tirar dela */
  let escovaNaMao = false;
  const escovadas: Record<Parte, number> = { cima: 0, lingua: 0, baixo: 0 };
  const conta = new Escovacao();
  const passo = (): PassoDosDentes | null => PASSOS.dentes[k] ?? null;
  const parteDaVez = (): Parte | null => {
    const p = passo();
    return p === 'cima' || p === 'lingua' || p === 'baixo' ? p : null;
  };

  const acender = () => {
    const p = passo();
    const pt = parteDaVez();
    if (p === 'molhar') luz.innerHTML = contornoLuz(195, 540, 38, 34);
    else if (p === 'pasta') luz.innerHTML = contornoLuz(72, 586, 44, 30);
    else if (pt) luz.innerHTML = contornoLuz(195, FAIXA[pt].cy, 96, (FAIXA[pt].y1 - FAIXA[pt].y0) / 2 + 4);
    else if (p === 'enxaguar') luz.innerHTML = contornoLuz(276, 578, 32, 30);
    else if (p === 'guardar') luz.innerHTML = contornoLuz(DESCANSO[0] + 20, DESCANSO[1] - 6, 52, 30);
    else luz.innerHTML = '';
  };
  /* escovando, a mãozinha leva a escova junto, indo e voltando na parte da vez;
     quando ela some, a escova volta a esperar do lado da boca */
  const escovandoJunto = (pt: Parte) => {
    const y = FAIXA[pt].cy + 8;
    const vale = () => parteDaVez() === pt && !ocupado && dedo < 0;
    return demonstrar(
      {
        ...tela,
        mao: (p, rot, firme) => {
          tela.mao(p, rot, firme);
          escovaNaMao = Boolean(p);
          if (!vale()) return;
          if (p) escovaEm([p[0] - 6, p[1] + 2, -8], 0);
          else escovaEm([X1 + 10, FAIXA[pt].cy + 10, -8], 400);
        },
      },
      { tipo: 'caminho', pontos: [[140, y], [230, y], [150, y], [240, y], [150, y]] },
    );
  };
  const mostrar = () => {
    pararGesto();
    const p = passo();
    const pt = parteDaVez();
    const tocar = (em: Ponto) => (pararGesto = demonstrar(tela, { tipo: 'tocar', em }));
    if (pt) pararGesto = escovandoJunto(pt);
    else if (p === 'molhar') tocar([200, 544]);
    else if (p === 'pasta') tocar([78, 590]);
    else if (p === 'enxaguar') tocar([282, 584]);
    else if (p === 'guardar') tocar([DESCANSO[0] + 24, DESCANSO[1]]);
  };
  const VOZ: Partial<Record<PassoDosDentes, string>> = { molhar: 'dentes_molhar', pasta: 'dentes_pasta', cima: 'dentes_escovar', enxaguar: 'dentes_enxaguar', guardar: 'dentes_guardar' };
  const comecarPasso = () => {
    passos.agora(k);
    acender();
    conta.zerar();
    const p = passo();
    const v = p ? VOZ[p] : undefined;
    /* a voz diz, e logo a mãozinha faz o gesto do passo (escova junto, toca a torneira), se ela ainda não começou */
    const este = k;
    const antes = toques;
    const fala = v && temVoz(v) ? falar(v) : null;
    void Promise.all([fala, esperar(parteDaVez() ? 1400 : 900)]).then(() => {
      if (vivo && k === este && toques === antes && !ocupado) mostrar();
    });
    /* a escova vai para perto da parte da boca da vez, esperando o dedo */
    const pt = parteDaVez();
    if (pt) escovaEm([X1 + 10, FAIXA[pt].cy + 10, -8], 600);
    /* escovou tudo: a escova descansa ao lado da boca, esperando para ser guardada */
    if (p === 'enxaguar') escovaEm(DESCANSO, 600);
    /* escovando, o dedo em cima da escova é o dedo na boca: a escova deixa o toque passar */
    escova.style.pointerEvents = pt ? 'none' : '';
  };
  const concluir = async (espera = 600) => {
    ocupado = true;
    pararGesto();
    tela.mao(null);
    luz.innerHTML = '';
    passos.encher(k);
    sininho(0.2);
    ajuda.reset();
    await esperar(espera);
    if (!vivo) return;
    k += 1;
    ocupado = false;
    if (k < PASSOS.dentes.length) comecarPasso();
    else void fim();
  };

  const ajuda = new Ajuda((n) => {
    if (n >= 1 && !ocupado) mostrar();
  });
  let vez = 0;
  relogioDeAjuda(tela, (dt) => {
    ajuda.tick(dt);
    /* A2: o jogo escova junto, uma escovada por segundo, e faz o toque que falta a cada dois */
    if (ajuda.nivel < 2 || ocupado || !vivo) return;
    const pt = parteDaVez();
    if (pt) {
      const y = FAIXA[pt].cy + 8;
      if (!escovaNaMao) escovaEm([vez % 2 ? 150 : 230, y, -8], 500);
      vez += 1;
      escovar(pt, 1);
      return;
    }
    vez += 1;
    if (vez % 2) return;
    const p = passo();
    if (p === 'molhar') void molhar();
    else if (p === 'pasta') void porPasta();
    else if (p === 'enxaguar') void enxaguar();
    else if (p === 'guardar') void guardar();
  });
  const tocou = () => {
    toques += 1;
    ajuda.tocou();
    pararGesto();
    tela.mao(null);
  };
  svg.addEventListener('pointerdown', tocou);
  tela.aoDestruir(() => svg.removeEventListener('pointerdown', tocou));

  const naoEAVez = () => tiquinho();

  const molhar = async () => {
    if (passo() !== 'molhar' || ocupado) return naoEAVez();
    ocupado = true;
    travar(1600);
    escovaEm(TORNEIRA, 600);
    await esperar(600);
    const jato = svg.querySelector('.jato') as SVGElement;
    jato.style.transition = 'opacity 200ms';
    jato.style.opacity = '0.9';
    toc(900, 0.06);
    await esperar(700);
    jato.style.opacity = '0';
    (svg.querySelector('.gotas') as SVGElement).setAttribute('opacity', '1');
    void concluir(300);
  };
  const porPasta = async () => {
    if (passo() !== 'pasta' || ocupado) return naoEAVez();
    ocupado = true;
    travar(2000);
    const tubo = svg.querySelector('.tubo') as SVGElement;
    tubo.style.transformBox = 'fill-box';
    tubo.style.transformOrigin = 'center';
    tubo.style.transition = 'transform 200ms';
    tubo.style.transform = 'scaleY(0.82)';
    escovaEm([118, 560, -6], 500);
    await esperar(520);
    tubo.style.transform = 'scaleY(1)';
    (svg.querySelector('.gotas') as SVGElement).setAttribute('opacity', '0');
    (svg.querySelector('.pasta-na-escova') as SVGElement).setAttribute('opacity', '1');
    toc(640, 0.14);
    /* a ervilha aparece do lado: é desse tamanho a pasta */
    const ervilha = svg.querySelector('.ervilha') as SVGElement;
    ervilha.style.transition = 'opacity 400ms';
    ervilha.style.opacity = '1';
    await esperar(1300);
    ervilha.style.opacity = '0';
    void concluir(300);
  };

  /* escovar: só a parte da vez conta; o dedo leva a escova, e cada escovada é uma nota */
  const escovar = (pt: Parte, n: number) => {
    /* a pasta saiu da escova e virou espuma */
    (svg.querySelector('.pasta-na-escova') as SVGElement).setAttribute('opacity', '0');
    for (let i = 0; i < n && escovadas[pt] < ESCOVADAS_POR_PARTE; i++) {
      escovadas[pt] += 1;
      /* o "chh" da escova, indo e voltando, e a próxima nota da música */
      escovada(escovadas[pt] % 2 === 0);
      notaAgora(notas[nota % notas.length]!, 0.5, 0.42);
      nota += 1;
      if (espuma.childElementCount < 30) {
        const bx = X0 + 20 + Math.random() * (X1 - X0 - 40);
        const by = FAIXA[pt].y0 + 8 + Math.random() * (FAIXA[pt].y1 - FAIXA[pt].y0 - 16);
        espuma.appendChild(svgEl(`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(3 + Math.random() * 4).toFixed(1)}" fill="#fffdf6" opacity="0.92"/>`));
      }
    }
    const ficam = sujeirasQueFicam(escovadas[pt], SUJEIRAS[pt].length);
    SUJEIRAS[pt].forEach((_p, i) => {
      const el = svg.querySelector(`[data-suj="${pt}-${i}"]`) as SVGElement;
      el.style.transition = 'opacity 400ms';
      el.style.opacity = i < ficam ? '0.9' : '0';
    });
    if (escovadas[pt] >= ESCOVADAS_POR_PARTE && !ocupado) {
      const brilho = svg.querySelector('.brilho') as SVGGElement;
      brilho.innerHTML = REFLEXOS[pt].map(([x, y], i) => reflexo(x, y, 14 - i * 2, i * 120)).join('');
      escovaEm([X1 + 10, FAIXA[pt].cy + 10, -8], 400);
      void concluir(700);
    }
  };
  const pega = svg.querySelector('.pega-boca') as SVGRectElement;
  let dedo = -1;
  let ultimo: [number, number, number] | null = null;
  pega.addEventListener('pointerdown', (ev) => {
    if (!parteDaVez() || ocupado) return naoEAVez();
    if (!reivindicarDedo(ev.pointerId)) return;
    dedo = ev.pointerId;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    ultimo = [x, y, performance.now()];
    escovaEm([x, y + 10, -8], 120);
    try {
      pega.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  });
  pega.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedo || !ultimo) return;
    const pt = parteDaVez();
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    const agora = performance.now();
    const d = Math.hypot(x - ultimo[0], y - ultimo[1]);
    const dt = (agora - ultimo[2]) / 1000;
    ultimo = [x, y, agora];
    /* a parte acabou: a escova para de seguir o dedo e vai para o próximo passo */
    if (!pt || ocupado) return;
    escovaEm([x, y + 10, -8], 0);
    /* fora da parte da vez, a escova anda mas não conta */
    const f = FAIXA[pt];
    if (y < f.y0 - 14 || y > f.y1 + 14 || x < X0 - 10 || x > X1 + 10) return;
    const n = conta.esfregar(d, dt);
    if (n) {
      /* escovando sem tirar o dedo também é estar tocando: a ajuda não aparece no meio */
      ajuda.tocou();
      escovar(pt, n);
    }
  });
  const solta = (ev: PointerEvent) => {
    if (ev.pointerId !== dedo) return;
    soltarDedo(dedo);
    dedo = -1;
    ultimo = null;
  };
  pega.addEventListener('pointerup', solta);
  pega.addEventListener('pointercancel', solta);
  pega.classList.add('alvo');

  const enxaguar = async () => {
    if (passo() !== 'enxaguar' || ocupado) return naoEAVez();
    ocupado = true;
    travar(1800);
    const copinho = svg.querySelector('.copinho') as SVGElement;
    copinho.style.transformBox = 'fill-box';
    copinho.style.transformOrigin = 'center';
    copinho.style.transition = 'transform 400ms';
    copinho.style.transform = 'rotate(-40deg)';
    lira(60, undefined, 0.3);
    await esperar(400);
    /* a espuma vai embora, e a água faz um redemoinho na pia */
    espuma.style.transition = 'opacity 700ms';
    espuma.style.opacity = '0';
    const agua = svg.querySelector('.agua-cuba') as SVGElement;
    agua.style.transition = 'opacity 400ms';
    agua.style.opacity = '0.9';
    toc(240, 0.12);
    await esperar(800);
    copinho.style.transform = 'rotate(0deg)';
    agua.style.opacity = '0';
    void concluir(300);
  };
  const guardar = async () => {
    if (passo() !== 'guardar' || ocupado) return naoEAVez();
    ocupado = true;
    travar(1200);
    escovaEm(COPO, 800);
    await esperar(850);
    toc(500, 0.16);
    void concluir(200);
  };

  tela.alvo('[data-alvo="torneira"]', () => void molhar(), true);
  tela.alvo('[data-alvo="pasta"]', () => void porPasta(), true);
  tela.alvo('[data-alvo="copinho"]', () => void enxaguar(), true);
  tela.alvo('[data-alvo="escova"]', () => {
    if (passo() === 'guardar') void guardar();
    else if (passo() === 'molhar') void molhar();
    else naoEAVez();
  }, true);

  /* pronto: o sorriso brilha inteiro */
  const fim = async () => {
    passos.agora(-1);
    travar(2500);
    const brilho = svg.querySelector('.brilho') as SVGGElement;
    brilho.innerHTML = [[X0 - 6, 282, 18], [X1 + 6, 286, 14], [X0 - 4, 446, 14], [X1 + 6, 442, 16]]
      .map(([x, y, k], i) => reflexo(x!, y!, k!, i * 140))
      .join('');
    await terminarCuidado(tela, 'dentes', [195, 330], 'dentes_pronto', () => vivo);
  };

  void esperar(700).then(() => vivo && comecarPasso());
  return tela;
}
