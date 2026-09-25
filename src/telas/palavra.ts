import { mover, pedrinhasSobem, telaSvg } from './comum';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { ir } from '@/core/roteador';
import { esperar, pontoNoSvg } from '@/core/util';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { estado, mudar } from '@/core/estado';
import { espanholAtivo } from '@/core/laco';
import { falarEspanhol } from '@/audio/espanhol';
import { familia } from '@/puppet/boneco';
import { arco, centelha, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { lira, notaAgora, sininho } from '@/audio/synth';
import palavrasJson from '@/data/palavras.json';
import type { Tela } from '@/core/roteador';

interface Palavra {
  palavra: string;
  figura: string;
  silabas: string[];
}
const palavras = palavrasJson as Palavra[];

const SOM_DA_LETRA: Record<string, string> = { A: 'som_a', E: 'som_e', O: 'som_o', S: 'som_s', L: 'som_l', M: 'som_m', U: 'som_u', I: 'som_i', T: 'som_t', Á: 'som_a' };

/**
 * Palavra em destaque e o escorregador de sons: a palavra grande em letra
 * bastão, uma fita reta embaixo. Ela traça a fita; quando o dedo passa embaixo
 * de cada letra, a letra acende e soa. Passando de novo, mais rápido, os sons
 * se juntam e a palavra inteira é dita.
 */
export function telaPalavra(params: Record<string, string>): Tela {
  const p = palavras.find((x) => x.palavra === (params.palavra ?? 'LUA')) ?? palavras[0]!;
  const volta = params.volta ?? 'casa';
  const letras = [...p.palavra];
  const n = letras.length;
  const X0 = 60;
  const X1 = 330;
  const passo = (X1 - X0) / n;
  const YL = 330;
  const YF = 420;

  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<path d="M36 720V210a159 159 0 0 1 318 0v510z" fill="#fbf8f1"/><path d="M36 720V210a159 159 0 0 1 318 0v510" fill="none" stroke="#c6a15b" stroke-width="1.5"/><line x1="36" y1="720" x2="354" y2="720" stroke="#c6a15b" stroke-width="1.5"/>`;
  /* a figura, grande */
  s += `<g class="objeto">${arco(120, 470, 150, 200, '#f6f0e4', '#c6a15b')}${figura(p.figura, 195, 590, 120)}</g>`;
  /* as letras */
  const tam = Math.min(88, (passo * 0.9) / 0.62);
  letras.forEach((l, i) => {
    s += `<text class="letra" data-i="${i}" x="${X0 + passo * (i + 0.5)}" y="${YL}" text-anchor="middle" font-family="Jost, sans-serif" font-size="${tam}" font-weight="500" fill="#4f6b3a">${l}</text>`;
  });
  /* a fita reta com a estrela guia */
  s += `<line x1="${X0}" y1="${YF}" x2="${X1}" y2="${YF}" stroke="#f2a9c4" stroke-width="26" stroke-linecap="round" stroke-dasharray="1 30" opacity="0.55"/>`;
  s += `<line class="cheio" x1="${X0}" y1="${YF}" x2="${X0}" y2="${YF}" stroke="#f2a9c4" stroke-width="26" stroke-linecap="round"/>`;
  s += `<line class="cheio-luz" x1="${X0}" y1="${YF}" x2="${X0}" y2="${YF}" stroke="#ebd9a8" stroke-width="6" stroke-linecap="round" opacity="0.7"/>`;
  s += `<g class="guia">${centelha(X0, YF, 34, '#c6a15b')}</g>`;
  const espanhol = espanholAtivo(estado());
  if (espanhol) s += `<g class="estrellita">${familia.boneca(330, 700, 44, 0).svg}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir(volta), lua: true });
  const svg = tela.svg;
  const guia = svg.querySelector('.guia') as SVGGElement;
  const cheio = svg.querySelector('.cheio') as SVGLineElement;
  const cheioLuz = svg.querySelector('.cheio-luz') as SVGLineElement;
  const letraEls = [...svg.querySelectorAll('.letra')] as SVGTextElement[];

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  const ajuda = new Ajuda();
  let passadas = 0;
  let pedrinhaDada = false;
  let u = 0;
  let ultimaLetra = -1;
  let inicioPassada = 0;
  let dedoId = -1;
  let guiaU = 0;
  let guiaAnda = true;

  const acende = (i: number) => {
    letraEls.forEach((t, k) => t.setAttribute('fill', k === i ? '#f2a9c4' : k < i ? '#4f6b3a' : '#4f6b3a'));
    letraEls[i]?.setAttribute('fill', '#f2a9c4');
    (letraEls[i] as SVGElement).style.transformBox = 'fill-box';
    (letraEls[i] as SVGElement).style.transformOrigin = 'center';
    (letraEls[i] as SVGElement).style.transition = 'transform 200ms';
    (letraEls[i] as SVGElement).style.transform = 'scale(1.15)';
    void esperar(260).then(() => ((letraEls[i] as SVGElement).style.transform = 'scale(1)'));
  };

  const soar = async (i: number, rapido: boolean) => {
    const l = letras[i]!;
    const idSom = SOM_DA_LETRA[l];
    /* na primeira passada, o som isolado e esticado (gravado); na rápida, uma nota do piano por letra */
    if (!rapido && idSom && temVoz(idSom)) await falar(idSom);
    else notaAgora(64 + (i % 5) * 2, 0.6, 0.3);
  };

  const posicionar = (uu: number) => {
    const x = X0 + (X1 - X0) * uu;
    cheio.setAttribute('x2', String(Math.max(X0, x)));
    cheioLuz.setAttribute('x2', String(Math.max(X0, x)));
    const i = Math.min(n - 1, Math.floor(uu * n));
    if (i !== ultimaLetra && uu > 0.02) {
      ultimaLetra = i;
      acende(i);
      void soar(i, passadas >= 1);
    }
  };

  const fimDaPassada = async () => {
    passadas += 1;
    const dur = (performance.now() - inicioPassada) / 1000;
    travar(1200);
    sininho();
    if (passadas >= 2 || dur < 2.2) {
      /* os sons se juntaram: a palavra inteira, a figura reage */
      const obj = svg.querySelector('.objeto') as SVGElement;
      obj.style.transformBox = 'fill-box';
      obj.style.transformOrigin = 'center';
      obj.style.transition = 'transform 500ms';
      obj.style.transform = 'scale(1.08)';
      void esperar(600).then(() => (obj.style.transform = 'scale(1)'));
      tela.comemorar(195, 470);
      await falarPalavra(nomeDaFigura(p.figura));
      /* as sílabas, batidas como palmas, uma nota por sílaba */
      await esperar(300);
      for (const [k] of p.silabas.entries()) {
        lira(67 + k * 2);
        await esperar(450);
      }
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
      mudar((x) => {
        x.registro.partes.palavra = (x.registro.partes.palavra ?? 0) + 1;
        if (!pedrinhaDada) ganhar(x, PEDRINHAS.palavra, 'palavra');
      });
      if (!pedrinhaDada) pedrinhasSobem(tela, PEDRINHAS.palavra, 195, 420);
      pedrinhaDada = true;
    }
    await esperar(600);
    u = 0;
    ultimaLetra = -1;
    letraEls.forEach((t) => t.setAttribute('fill', '#4f6b3a'));
    posicionar(0);
    guiaAnda = true;
    guiaU = 0;
    ajuda.reset();
  };

  /* o dedo na fita */
  svg.addEventListener('pointerdown', (ev) => {
    if (!reivindicarDedo(ev.pointerId)) return;
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (Math.abs(y - YF) > 60) {
      soltarDedo(ev.pointerId);
      return;
    }
    dedoId = ev.pointerId;
    ajuda.tocou();
    guiaAnda = false;
    if (u === 0) inicioPassada = performance.now();
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
    if (u > 0 && u < 1) ajuda.tentativa();
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);

  /* a estrela guia percorre a fita no ritmo certo, e a ajuda a repete */
  const anim = () => {
    if (!vivo) return;
    if (guiaAnda || ajuda.nivel >= 1) {
      if (guiaU < u) guiaU = u;
      guiaU += 0.004;
      if (guiaU > 1) guiaU = u;
      guia.style.transform = `translate(${(X1 - X0) * guiaU}px, 0)`;
    } else guia.style.transform = `translate(${(X1 - X0) * u}px, 0)`;
    requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
  const tique = window.setInterval(() => {
    if (dedoId < 0) ajuda.tick(1);
    /* A2: a voz junta os sons sozinha no fim */
    if (ajuda.nivel >= 2 && dedoId < 0 && u < 1) {
      u = Math.min(1, u + 0.12);
      posicionar(u);
      if (u >= 1) void fimDaPassada();
    }
  }, 1000);
  tela.aoDestruir(() => window.clearInterval(tique));

  /* a palavra inteira primeiro, devagar */
  void esperar(500).then(() => falarPalavra(nomeDaFigura(p.figura)));
  return tela;
}
