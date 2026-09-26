import { mover, pedrinhasSobem, telaSvg } from './comum';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { ir } from '@/core/roteador';
import { easeOut, esperar, pontoNoSvg } from '@/core/util';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { estado, mudar } from '@/core/estado';
import { espanholAtivo } from '@/core/laco';
import { palavras, proximaPalavra, sequenciaDePalavras } from '@/core/palavras';
import { falarEspanhol } from '@/audio/espanhol';
import { familia } from '@/puppet/boneco';
import { arco, centelha, contornoLuz, maozinha, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { lira, notaAgora, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** o som gravado de cada letra: sempre o som, nunca o nome. Á soa como A, Ó como O. */
const SOM_DA_LETRA: Record<string, string> = { A: 'som_a', Á: 'som_a', E: 'som_e', I: 'som_i', O: 'som_o', Ó: 'som_o', U: 'som_u', S: 'som_s', L: 'som_l', M: 'som_m', T: 'som_t', V: 'som_v' };

const MUSGO = '#4f6b3a';
const ROSA_DOCE = '#f2a9c4';
const OURO = '#c6a15b';
const LUZ = '#ebd9a8';

/**
 * As quatro etapas de uma palavra, na ordem do método fônico, sempre a mesma:
 * ouvir (a palavra inteira e a estrela guia mostrando som por som), sons (ela
 * traça a fita devagar e cada letra soa), juntar (ela traça de novo e os sons
 * viram a palavra; as sílabas batem como palmas) e pronta (a palavra ficou
 * dourada e a próxima palavra da fila acende para ela tocar).
 */
type Etapa = 'ouvir' | 'sons' | 'juntar' | 'pronta';

/**
 * Palavra em destaque e o escorregador de sons: a palavra grande em letra
 * bastão, uma fita reta embaixo. O que fazer é mostrado, nunca dito: a
 * estrela guia percorre a fita soando cada letra, depois a mãozinha faz o
 * gesto de traçar. O avanço se vê em dois lugares: as três estrelinhas
 * embaixo da fita (as etapas desta palavra) e o colar no alto (as palavras
 * desta fase, as já lidas cheias de ouro, a de agora com a estrela).
 */
export function telaPalavra(params: Record<string, string>): Tela {
  const e0 = estado();
  const pedida = params.palavra ?? 'LUA';
  const p = palavras.find((x) => x.palavra === pedida) ?? palavras[0]!;
  const volta = params.volta ?? 'casa';
  const fila = sequenciaDePalavras(e0, p.palavra);
  const proxima = proximaPalavra(e0, fila, p.palavra);
  const letras = [...p.palavra];
  const n = letras.length;
  const X0 = 60;
  const X1 = 330;
  const passo = (X1 - X0) / n;
  const YL = 312;
  const YF = 390;
  const YE = 442;
  const YC = 200;
  const FX = 225;
  const FY = 585;
  const PX = 330;
  const PY = 690;

  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<path d="M36 720V210a159 159 0 0 1 318 0v510z" fill="#fbf8f1"/><path d="M36 720V210a159 159 0 0 1 318 0v510" fill="none" stroke="${OURO}" stroke-width="1.5"/><line x1="36" y1="720" x2="354" y2="720" stroke="${OURO}" stroke-width="1.5"/>`;
  /* o colar das palavras desta fase: uma conta por palavra, cheia quando lida, a estrela na de agora */
  const passoConta = Math.min(18, 280 / Math.max(1, fila.length));
  fila.forEach((q, k) => {
    const x = 195 + (k - (fila.length - 1) / 2) * passoConta;
    const lida = e0.palavras.includes(q.palavra);
    if (q.palavra === p.palavra) s += `<g class="conta" data-palavra="${q.palavra}">${centelha(x, YC, 18, OURO)}</g>`;
    else s += `<circle class="conta" data-palavra="${q.palavra}" cx="${x}" cy="${YC}" r="5" fill="${lida ? OURO : 'none'}" stroke="${OURO}" stroke-width="1.5" opacity="${lida ? 1 : 0.55}"/>`;
  });
  /* as letras */
  const tam = Math.min(88, (passo * 0.9) / 0.62);
  letras.forEach((l, i) => {
    s += `<text class="letra" data-i="${i}" x="${X0 + passo * (i + 0.5)}" y="${YL}" text-anchor="middle" font-family="Jost, sans-serif" font-size="${tam}" font-weight="500" fill="${MUSGO}">${l}</text>`;
  });
  /* a fita reta com a estrela guia */
  s += `<line x1="${X0}" y1="${YF}" x2="${X1}" y2="${YF}" stroke="${ROSA_DOCE}" stroke-width="26" stroke-linecap="round" stroke-dasharray="1 30" opacity="0.55"/>`;
  s += `<line class="cheio" x1="${X0}" y1="${YF}" x2="${X0}" y2="${YF}" stroke="${ROSA_DOCE}" stroke-width="26" stroke-linecap="round"/>`;
  s += `<line class="cheio-luz" x1="${X0}" y1="${YF}" x2="${X0}" y2="${YF}" stroke="${LUZ}" stroke-width="6" stroke-linecap="round" opacity="0.7"/>`;
  s += `<g class="guia">${centelha(X0, YF, 34, OURO)}</g>`;
  /* as três etapas desta palavra: ouvir, os sons, juntar */
  for (let k = 0; k < 3; k++) s += `<g class="etapa" data-k="${k}" opacity="0.35">${centelha(195 + (k - 1) * 30, YE, 18, LUZ)}</g>`;
  /* a figura, grande, ainda adormecida até a palavra ser lida */
  s += `<g class="objeto" opacity="0.6">${arco(150, 478, 150, 190, '#f6f0e4', OURO)}${figura(p.figura, FX, FY, 116)}</g>`;
  /* o Theo, que mostra */
  s += `<g class="theo">${familia.theo(70, 712, 104, 'aponta').svg}</g>`;
  const espanhol = espanholAtivo(e0);
  if (espanhol) s += `<g class="estrellita">${familia.boneca(340, 600, 44, 0).svg}</g>`;
  /* a próxima palavra da fila, guardada até esta ficar pronta */
  if (proxima) s += `<g class="proxima" data-alvo="proxima" opacity="0" style="transition:opacity 600ms">${contornoLuz(PX, PY, 34, 34)}<circle cx="${PX}" cy="${PY}" r="30" fill="#f6f0e4"/>${figura(proxima.figura, PX, PY, 48)}</g>`;
  /* a mãozinha que faz o gesto na fita */
  s += `<g class="mao-fita" opacity="0">${maozinha(0, 0, 1.1, -15, '')}</g>`;

  const tela = telaSvg(s, { casinha: () => void ir(volta), lua: true });
  const svg = tela.svg;
  const guia = svg.querySelector('.guia') as SVGGElement;
  const cheio = svg.querySelector('.cheio') as SVGLineElement;
  const cheioLuz = svg.querySelector('.cheio-luz') as SVGLineElement;
  const letraEls = [...svg.querySelectorAll('.letra')] as SVGTextElement[];
  const etapaEls = [...svg.querySelectorAll('.etapa')] as SVGGElement[];
  const objeto = svg.querySelector('.objeto') as SVGGElement;
  const maoFita = svg.querySelector('.mao-fita') as SVGGElement;
  const proximaEl = svg.querySelector('.proxima') as SVGGElement | null;

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  const ajuda = new Ajuda();
  let etapa: Etapa = 'ouvir';
  let u = 0;
  let ultimaLetra = -1;
  let dedoId = -1;
  let guiaU = 0;
  let guiaAnda = false;
  let demo = 0;
  let ocupada = false;
  let pedrinhaDada = false;
  let maoDesde = 0;
  let paradaDesde = performance.now();
  const dx = letras.map(() => 0);

  const poseLetra = (i: number, escala: number) => {
    const t = letraEls[i] as SVGElement;
    t.style.transformBox = 'fill-box';
    t.style.transformOrigin = 'center';
    t.style.transition = 'transform 260ms';
    t.style.transform = `translate(${dx[i]}px, 0) scale(${escala})`;
  };
  const acende = (i: number) => {
    letraEls[i]?.setAttribute('fill', ROSA_DOCE);
    poseLetra(i, 1.15);
    void esperar(260).then(() => poseLetra(i, 1));
  };
  const apagaLetras = (cor = MUSGO) => letraEls.forEach((t) => t.setAttribute('fill', cor));

  const soar = async (i: number, rapido: boolean) => {
    const idSom = SOM_DA_LETRA[letras[i]!];
    /* devagar, o som isolado e esticado (gravado); rápido, uma nota do piano por letra */
    if (!rapido && idSom && temVoz(idSom)) {
      if (await falar(idSom)) return;
    }
    notaAgora(64 + (i % 5) * 2, 0.6, 0.3);
    if (!rapido) await esperar(520);
  };

  const encher = (uu: number) => {
    const x = X0 + (X1 - X0) * uu;
    cheio.setAttribute('x2', String(Math.max(X0, x)));
    cheioLuz.setAttribute('x2', String(Math.max(X0, x)));
  };
  const posicionar = (uu: number) => {
    encher(uu);
    const i = Math.min(n - 1, Math.floor(uu * n));
    if (i !== ultimaLetra && uu > 0.02) {
      ultimaLetra = i;
      acende(i);
      void soar(i, etapa !== 'sons');
    }
  };
  const limparFita = () => {
    u = 0;
    ultimaLetra = -1;
    apagaLetras(etapa === 'pronta' ? OURO : MUSGO);
    encher(0);
    guiaU = 0;
  };

  const acenderEtapa = (k: number) => {
    const g = etapaEls[k];
    if (!g) return;
    g.setAttribute('opacity', '1');
    g.querySelector('path')?.setAttribute('fill', OURO);
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = 'center';
    g.style.transition = 'transform 300ms';
    g.style.transform = 'scale(1.35)';
    void esperar(340).then(() => (g.style.transform = 'scale(1)'));
  };

  const proximoQuadro = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
  /** a estrela guia desliza de `de` a `ate` na fita; false se ela tocou no meio */
  const deslizar = async (de: number, ate: number, ms: number, meuDemo: number) => {
    const t0 = performance.now();
    for (;;) {
      if (!vivo || demo !== meuDemo) return false;
      const k = Math.min(1, (performance.now() - t0) / ms);
      guiaU = de + (ate - de) * k;
      if (k >= 1) return true;
      await proximoQuadro();
    }
  };
  /** ouvir: a estrela para embaixo de cada letra e a letra soa, esticada */
  const mostrarDevagar = async () => {
    const meu = ++demo;
    for (let i = 0; i < n; i++) {
      if (!(await deslizar(i / n, (i + 0.5) / n, 320, meu))) return false;
      acende(i);
      await soar(i, false);
      if (!vivo || demo !== meu) return false;
    }
    if (!(await deslizar((n - 0.5) / n, 1, 320, meu))) return false;
    await esperar(300);
    return vivo && demo === meu;
  };
  /** juntar: a estrela corre a fita inteira de uma vez e a voz diz a palavra */
  const mostrarRapido = async () => {
    const meu = ++demo;
    let ultima = -1;
    const t0 = performance.now();
    const dur = 260 * n;
    for (;;) {
      if (!vivo || demo !== meu) return false;
      const k = Math.min(1, (performance.now() - t0) / dur);
      guiaU = k;
      const i = Math.min(n - 1, Math.floor(k * n));
      if (i !== ultima) {
        ultima = i;
        acende(i);
        notaAgora(64 + (i % 5) * 2, 0.5, 0.25);
      }
      if (k >= 1) break;
      await proximoQuadro();
    }
    await falarPalavra(nomeDaFigura(p.figura));
    return vivo && demo === meu;
  };

  /** muda de etapa: a fita limpa, a ajuda zera, a mãozinha convida quando é a vez dela */
  const entrar = (nova: Etapa) => {
    etapa = nova;
    demo += 1;
    limparFita();
    ajuda.reset();
    guiaAnda = false;
    paradaDesde = performance.now();
    maoDesde = performance.now();
    tela.mao(null);
    if (nova === 'pronta' && proximaEl) proximaEl.setAttribute('opacity', '1');
  };

  /** as sílabas, batidas como palmas: as letras se juntam em grupos e cada grupo pula com uma nota */
  const silabas = async () => {
    if (p.silabas.length < 2) return;
    const grupos: number[][] = [];
    let i = 0;
    for (const sil of p.silabas) {
      grupos.push(letras.slice(i, i + sil.length).map((_, k) => i + k));
      i += sil.length;
    }
    grupos.forEach((g, k) => g.forEach((j) => (dx[j] = (k - (grupos.length - 1) / 2) * 16)));
    letras.forEach((_, j) => poseLetra(j, 1));
    await esperar(450);
    for (const [k, g] of grupos.entries()) {
      if (!vivo) return;
      lira(67 + k * 2);
      g.forEach((j) => poseLetra(j, 1.18));
      await esperar(220);
      g.forEach((j) => poseLetra(j, 1));
      await esperar(300);
    }
    await esperar(300);
    letras.forEach((_, j) => (dx[j] = 0));
    letras.forEach((_, j) => poseLetra(j, 1));
  };

  /** os sons se juntaram: a palavra inteira, a figura acorda, as sílabas, a pedrinha */
  const juntar = async (primeiraVez: boolean) => {
    objeto.setAttribute('opacity', '1');
    objeto.style.transformBox = 'fill-box';
    objeto.style.transformOrigin = 'center';
    objeto.style.transition = 'transform 500ms, opacity 500ms';
    objeto.style.transform = 'scale(1.08)';
    void esperar(600).then(() => (objeto.style.transform = 'scale(1)'));
    apagaLetras(OURO);
    tela.comemorar(FX, 478);
    await falarPalavra(nomeDaFigura(p.figura));
    if (!vivo) return;
    if (primeiraVez) acenderEtapa(1);
    await esperar(300);
    await silabas();
    if (!vivo) return;
    if (primeiraVez) acenderEtapa(2);
    /* a Estrellita diz o outro nome da coisa */
    if (espanhol) {
      const est = svg.querySelector('.estrellita');
      if (est) {
        mover(est, 0, -8, 200);
        void esperar(260).then(() => mover(est, 0, 0, 300));
      }
      await esperar(300);
      await falarEspanhol(p.figura);
    }
    if (!primeiraVez) return;
    mudar((x) => {
      x.registro.partes.palavra = (x.registro.partes.palavra ?? 0) + 1;
      if (!x.palavras.includes(p.palavra)) x.palavras.push(p.palavra);
      if (ajuda.nivel >= 1) x.registro.a1.palavra = (x.registro.a1.palavra ?? 0) + 1;
      if (ajuda.nivel >= 2) x.registro.a2.palavra = (x.registro.a2.palavra ?? 0) + 1;
      if (!pedrinhaDada) ganhar(x, PEDRINHAS.palavra, 'palavra');
    });
    if (!pedrinhaDada) pedrinhasSobem(tela, PEDRINHAS.palavra, FX, 470);
    pedrinhaDada = true;
  };

  const fimDaPassada = async () => {
    ocupada = true;
    travar(1200);
    sininho();
    if (etapa === 'sons') {
      acenderEtapa(0);
      await esperar(500);
      if (!vivo) return;
      /* o modelo do que vem agora: rápido, os sons se juntam */
      limparFita();
      const fim = await mostrarRapido();
      ocupada = false;
      if (fim) entrar('juntar');
      return;
    }
    await juntar(etapa === 'juntar');
    ocupada = false;
    if (vivo) entrar('pronta');
  };

  /* o dedo na fita */
  svg.addEventListener('pointerdown', (ev) => {
    if (ocupada) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (Math.abs(y - YF) > 60) {
      soltarDedo(ev.pointerId);
      return;
    }
    /* ela tocou no meio da mostra: a vez é dela */
    if (etapa === 'ouvir') entrar('sons');
    dedoId = ev.pointerId;
    ajuda.tocou();
    guiaAnda = false;
    paradaDesde = performance.now();
    u = Math.max(u, Math.min(1, (x - X0) / (X1 - X0)));
    posicionar(u);
  });
  svg.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedoId) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (Math.abs(y - YF) > 60 && ajuda.nivel < 2) return;
    const novo = Math.min(1, (x - X0) / (X1 - X0));
    if (novo > u) {
      u = novo;
      posicionar(u);
      if (u >= 0.98) {
        u = 1;
        soltarDedo(dedoId);
        dedoId = -1;
        void fimDaPassada();
      }
    }
  });
  const solta = (ev: PointerEvent) => {
    if (ev.pointerId !== dedoId) return;
    soltarDedo(dedoId);
    dedoId = -1;
    paradaDesde = performance.now();
    if (u > 0 && u < 1) ajuda.tentativa();
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);

  /* a próxima palavra da fila */
  if (proxima) {
    tela.alvo('[data-alvo="proxima"]', () => {
      if (etapa !== 'pronta') return;
      void ir('palavra', { palavra: proxima.palavra, volta });
    });
  }

  /* a cena: a estrela guia, a mãozinha na fita e o convite para a próxima */
  const anim = () => {
    if (!vivo) return;
    const agora = performance.now();
    if (guiaAnda && dedoId < 0) {
      if (guiaU < u) guiaU = u;
      guiaU += 0.004;
      if (guiaU > 1) guiaU = u;
    } else if (etapa !== 'ouvir' && !ocupada && !guiaAnda) guiaU = u;
    guia.style.transform = `translate(${(X1 - X0) * guiaU}px, 0)`;
    /* a mãozinha faz o gesto de traçar enquanto é a vez dela e o dedo está fora */
    const convida = (etapa === 'sons' || etapa === 'juntar') && !ocupada && dedoId < 0 && u === 0;
    if (convida) {
      const t = ((agora - maoDesde) % 1800) / 1800;
      const k = Math.min(1, t / 0.75);
      const x = X0 + 120 * easeOut(k);
      const op = t < 0.1 ? t / 0.1 : t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.2);
      maoFita.setAttribute('transform', `translate(${x} ${YF + 10})`);
      maoFita.setAttribute('opacity', String(op));
    } else maoFita.setAttribute('opacity', '0');
    requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);

  const tique = window.setInterval(() => {
    if (dedoId >= 0 || ocupada) return;
    if (etapa === 'sons' || etapa === 'juntar') {
      ajuda.tick(1);
      /* A1: a estrela guia percorre a fita no ritmo certo */
      if (ajuda.nivel >= 1) guiaAnda = true;
      /* A2: a fita enche sozinha até o fim */
      if (ajuda.nivel >= 2 && u < 1) {
        u = Math.min(1, u + 0.12);
        posicionar(u);
        if (u >= 1) void fimDaPassada();
      }
    } else if (etapa === 'pronta' && performance.now() - paradaDesde > 7000) {
      /* pronta e parada: a mãozinha mostra a próxima palavra, ou o caminho de casa */
      if (proxima) tela.mao([PX + 22, PY + 26]);
      else tela.mao([56, 66], 20);
    }
  }, 1000);
  tela.aoDestruir(() => window.clearInterval(tique));

  /* ouvir: a palavra inteira, devagar, e a estrela guia mostra som por som */
  void (async () => {
    await esperar(500);
    if (!vivo || etapa !== 'ouvir') return;
    await falarPalavra(nomeDaFigura(p.figura));
    if (!vivo || etapa !== 'ouvir') return;
    const fim = await mostrarDevagar();
    if (fim && etapa === 'ouvir') entrar('sons');
  })();
  return tela;
}
