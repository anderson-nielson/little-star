import { mover, pedrinhasSobem, telaSvg, trilha } from './comum';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { embaralhar, esperar, semente } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, contornoLuz, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { liraDesce, sininho, tiquinho } from '@/audio/synth';
import { Ajuda } from '@/core/ajuda';
import { travar } from '@/core/toque';
import letrasJson from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

interface Letra {
  id: string;
  som: string;
  figuras: string[];
}
const letras = letrasJson as Letra[];

/**
 * Som do dia: o Theo diz o som da semana, esticado; três figuras grandes;
 * ela toca na que começa com o som. Qualquer toque é recebido: a certa ganha
 * festa; as outras dizem o próprio nome e o próprio som.
 */
export function telaSom(): Tela {
  const e = estado();
  const letra = letras[Math.min(e.letraIndice, letras.length - 1)]!;
  const outras = letras.filter((l) => l.id !== letra.id);
  const semana = e.hoje.dia;

  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<path d="M36 720V210a159 159 0 0 1 318 0v510z" fill="#fbf8f1"/><path d="M36 720V210a159 159 0 0 1 318 0v510" fill="none" stroke="#c6a15b" stroke-width="1.5"/><line x1="36" y1="720" x2="354" y2="720" stroke="#c6a15b" stroke-width="1.5"/>`;
  s += `<g class="theo">${familia.theo(84, 712, 118, 'aponta').svg}</g>`;
  s += `<text x="270" y="690" text-anchor="middle" font-family="Jost, sans-serif" font-size="72" font-weight="500" fill="#f2a9c4">${letra.id}</text>`;
  s += `<g class="figuras"></g><g class="luz"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  const camada = svg.querySelector('.figuras') as SVGGElement;
  const camadaLuz = svg.querySelector('.luz') as SVGGElement;
  /* uma conta por rodada: ela vê que são três e quantas faltam */
  const contas = trilha(tela, 3);

  let rodada = 0;
  let acertos = 0;
  let terminou = false;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const terminar = async () => {
    if (terminou) return;
    terminou = true;
    liraDesce();
    mudar((x) => {
      x.hoje.somFeito = true;
    });
    await esperar(800);
    if (vivo) void sessao.avancar();
  };

  const ajuda = new Ajuda();

  const proximaRodada = async () => {
    if (!vivo) return;
    if (rodada >= 3) return terminar();
    ajuda.reset();
    camada.innerHTML = '';
    camadaLuz.innerHTML = '';
    tela.mao(null);
    contas.agora(rodada);
    const seed = semente(semana + letra.id + rodada);
    const alvo = letra.figuras[rodada % letra.figuras.length]!;
    const n = rodada === 2 && acertos === 2 ? 4 : 3;
    const distratores = embaralhar(
      outras.flatMap((l) => l.figuras),
      seed,
    ).slice(0, n - 1);
    const conjunto = embaralhar([alvo, ...distratores], seed + 0.1);
    const posicoes = n === 3 ? [[110, 330], [280, 330], [195, 500]] : [[110, 320], [280, 320], [110, 500], [280, 500]];
    conjunto.forEach((id, i) => {
      const [x, y] = posicoes[i]!;
      camada.innerHTML += `<g data-fig="${id}" data-x="${x}" data-y="${y}">${arco(x! - 64, y! - 80, 128, 160, '#f6f0e4', '#c6a15b')}${figura(id, x!, y!, 100)}</g>`;
    });
    /* o Theo diz o som */
    await esperar(400);
    if (temVoz(letra.som)) await falar(letra.som);
    else await esperar(900);
    if (!vivo) return;
    const meuTurno = rodada;
    let esperando = true;
    /* ajuda: depois de 6 s a figura certa respira mais; depois de 12 o Theo aponta com a mãozinha */
    const timer = window.setInterval(() => {
      if (!vivo || !esperando || rodada !== meuTurno) return window.clearInterval(timer);
      ajuda.tick(1);
      const g = camada.querySelector(`[data-fig="${alvo}"]`) as SVGGElement | null;
      if (!g) return;
      if (ajuda.nivel >= 1) g.classList.add('respira');
      if (ajuda.nivel >= 2) {
        tela.mao([Number(g.getAttribute('data-x')) + 20, Number(g.getAttribute('data-y')) + 30]);
        if (temVoz(letra.som) && ajuda.nivel === 2) void falar(letra.som);
      }
    }, 1000);
    tela.aoDestruir(() => window.clearInterval(timer));

    tela.alvo('[data-fig]', (_ev, el) => {
      if (!esperando) return;
      const id = el.getAttribute('data-fig')!;
      const x = Number(el.getAttribute('data-x'));
      const y = Number(el.getAttribute('data-y'));
      ajuda.tocou();
      if (id === alvo) {
        esperando = false;
        window.clearInterval(timer);
        travar(2400);
        sininho();
        acertos += 1;
        contas.encher(rodada);
        mudar((m) => {
          if (ajuda.nivel >= 1) m.registro.a1[`som`] = (m.registro.a1.som ?? 0) + 1;
          if (ajuda.nivel >= 2) m.registro.a2[`som`] = (m.registro.a2.som ?? 0) + 1;
          ganhar(m, PEDRINHAS.som, 'som');
        });
        pedrinhasSobem(tela, PEDRINHAS.som, x, y + 60);
        camadaLuz.innerHTML = contornoLuz(x, y, 70, 86, 'respira');
        tela.comemorar(x, y - 90);
        camada.innerHTML += `<text x="${x}" y="${y - 96}" text-anchor="middle" font-family="Jost, sans-serif" font-size="48" font-weight="500" fill="#f2a9c4" class="surge">${letra.id}</text>`;
        void (async () => {
          await falarPalavra(nomeDaFigura(id));
          await esperar(600);
          rodada += 1;
          await proximaRodada();
        })();
      } else {
        /* a outra diz o próprio nome e o próprio som, sem "errado" */
        tiquinho();
        mover(el, 0, -6, 200);
        void esperar(220).then(() => mover(el, 0, 0, 300));
        ajuda.tentativa();
        const dona = letras.find((l) => l.figuras.includes(id));
        void falarPalavra(nomeDaFigura(id)).then(() => dona && temVoz(dona.som) && falar(dona.som));
      }
    }, true);
  };

  void esperar(600).then(proximaRodada);
  return tela;
}
