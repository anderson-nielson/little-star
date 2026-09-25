import { mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia, figurinoDe } from '@/puppet/boneco';
import { centelha, veu } from '@/puppet/objetos';
import { audio } from '@/audio/engine';
import { musica, pararFundo, Sequenciador } from '@/audio/musica';
import { aplauso, lira, sininho } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import { falarEspanhol } from '@/audio/espanhol';
import { espanholAtivo } from '@/core/laco';
import type { Tela } from '@/core/roteador';

const DURACAO = 40;

/**
 * O palco: cortina de veludo, luz de ribalta. A Stella dança sozinha com a
 * Dança da Fada Açucarada; tocar em cima faz um salto, embaixo um giro,
 * sempre dá certo. Plateia: mãe, pai, Theo e as bonecas. Reverência,
 * aplauso, abraço na coxia, uma boneca nova na estante.
 */
export function telaPalco(): Tela {
  const e = estado();
  let s = `<rect width="390" height="780" fill="#10142a"/>` + veu(0, 0, 390, 780, '#232a55', 5, 0.4);
  /* chão do palco e poça de luz */
  s += `<rect x="0" y="470" width="390" height="140" fill="#2a1d22"/><ellipse cx="195" cy="470" rx="150" ry="26" fill="#ebd9a8" opacity="0.28"/>`;
  s += `<path d="M195 60L60 480h270z" fill="#ebd9a8" opacity="0.1"/>`;
  /* a Stella de tutu e coque */
  s += `<g class="stella">${familia.stellaPalco(195, 470, 170, 'parado').svg}</g>`;
  /* plateia: primeira fila */
  s += `<rect x="0" y="610" width="390" height="170" fill="#1b2140"/>`;
  s += familia.mae(90, 720, 96, 'parado', { contorno: '#ebd9a8' }).svg + familia.pai(300, 720, 104, 'parado', { contorno: '#ebd9a8' }).svg + familia.theo(195, 722, 76, 'acena', { contorno: '#ebd9a8' }).svg;
  for (let i = 0; i < Math.min(e.bonecas, 4); i++) s += familia.boneca(40 + i * 100 + 20, 690, 32, i, { contorno: '#ebd9a8', ...figurinoDe(e.figurinos[String(i)]) }).svg;
  /* a boneca companheira assiste da coxia, pertinho */
  if (e.companheira >= 0) s += familia.boneca(70, 470, 40, e.companheira, { contorno: '#ebd9a8', ...figurinoDe(e.figurinos[String(e.companheira)]) }).svg;
  /* cortinas */
  s += `<g class="cortina-e"><rect x="0" y="0" width="200" height="620" fill="#6e1a27"/><rect x="0" y="0" width="200" height="620" fill="url(#veludo)" opacity="0.5"/></g><g class="cortina-d"><rect x="190" y="0" width="200" height="620" fill="#6e1a27"/></g>`;
  s += `<defs><linearGradient id="veludo" x1="0" x2="1"><stop offset="0" stop-color="#4a0f19"/><stop offset="0.35" stop-color="#8a2534"/><stop offset="0.6" stop-color="#5a1420"/><stop offset="0.85" stop-color="#7d202e"/><stop offset="1" stop-color="#4a0f19"/></linearGradient></defs>`;
  s += `<g class="brilhos"></g>`;
  const tela = telaSvg(s, { fundo: '#10142a' });
  const svg = tela.svg;
  const stella = svg.querySelector('.stella') as SVGGElement;
  const brilhos = svg.querySelector('.brilhos') as SVGGElement;
  travar(1500);
  pararFundo();

  let vivo = true;
  let dancando = true;
  tela.aoDestruir(() => {
    vivo = false;
    seq.parar();
  });
  const seq = new Sequenciador(musica('fada_acucarada'), { loop: true });
  seq.ganho = 0.4;

  const poses: ('parado' | 'acena' | 'giro' | 'pulo')[] = ['parado', 'acena', 'parado', 'giro'];
  let i = 0;
  const trocarPose = (p: 'parado' | 'acena' | 'giro' | 'pulo' | 'reverencia') => {
    stella.innerHTML = familia.stellaPalco(195, p === 'pulo' ? 440 : 470, 170, p).svg;
  };
  const batida = window.setInterval(() => {
    if (!dancando) return;
    i += 1;
    trocarPose(poses[i % poses.length]!);
  }, 750);
  tela.aoDestruir(() => window.clearInterval(batida));

  /* tocar em cima = salto, embaixo = giro: sempre dá certo */
  tela.alvo(
    'svg',
    (ev) => {
      if (!dancando) return;
      const [, y] = tela.ponto(ev);
      const p = y < 390 ? 'pulo' : 'giro';
      trocarPose(p);
      lira(p === 'pulo' ? 79 : 74, undefined, 0.3);
      brilhos.innerHTML = `<g class="sobe">${centelha(195 + (Math.random() - 0.5) * 80, 300, 14, '#c6a15b')}${centelha(195 + (Math.random() - 0.5) * 80, 320, 10, '#f2a9c4')}</g>`;
    },
    true,
  );

  void (async () => {
    await audio.tentarDestravar();
    await esperar(600);
    const ce = svg.querySelector('.cortina-e') as SVGElement;
    const cd = svg.querySelector('.cortina-d') as SVGElement;
    mover(ce, -200, 0, 1800);
    mover(cd, 200, 0, 1800);
    /* às vezes a Estrellita conta a entrada em espanhol */
    if (espanholAtivo(e) && e.aventuras % 2 === 1) {
      if (temVoz('es_contagem')) await falar('es_contagem');
      else for (const n of ['cinco', 'seis', 'sete', 'oito']) await falarEspanhol(n, 0.9);
    }
    seq.iniciar(audio.agora() + 1.6);
    await esperar(DURACAO * 1000);
    if (!vivo) return;
    dancando = false;
    seq.parar();
    trocarPose('reverencia');
    aplauso(4);
    tela.comemorar(195, 300);
    travar(6000);
    if (temVoz('brava')) await falar('brava');
    else await esperar(1200);
    if (espanholAtivo(e)) await falarEspanhol('muy_bien');
    sininho();
    mudar((x) => {
      if (x.bonecas < 5) x.bonecas += 1;
    });
    await esperar(1500);
    /* abraço na coxia */
    stella.innerHTML = familia.stellaPalco(180, 470, 170, 'parado').svg + familia.pai(230, 470, 200, 'abraca', { dir: -1, contorno: '#ebd9a8' }).svg;
    await esperar(2500);
    if (vivo) void ir('casa');
  })();

  return tela;
}
