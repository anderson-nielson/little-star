import { convidarParaCasa, mover, pedrinhasSobem, telaSvg, trilha } from './comum';
import { demonstrar, type Ponto } from './guia';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { esperar } from '@/core/util';
import { montarRodadas, RODADAS } from '@/core/somdodia';
import { familia } from '@/puppet/boneco';
import { arco, contornoLuz, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { dizerComSons, falarSom, somInicialDaFigura } from '@/audio/fonemas';
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
 * Som do dia: um som soa, curto e esticado; figuras grandes em arcos;
 * ela toca na que começa com o som. Três rodadas: a letra da semana, uma que
 * ela já traçou, a da semana de novo. A primeira tem três figuras, as outras
 * quatro. Qualquer toque é recebido: a certa ganha festa; as outras dizem o
 * próprio nome e o próprio som. Vem sozinha uma vez por dia, antes da casa, e
 * mora também no mural da cozinha para ela voltar quando quiser.
 */
export function telaSom(params: Record<string, string> = {}): Tela {
  const e = estado();
  const daCasa = params.volta === 'casa';
  const semana = letras[Math.min(e.letraIndice, letras.length - 1)]!;
  /* na volta do laço, as mesmas figuras o dia todo; pelo mural, outras a cada vez */
  const chave = `${e.hoje.dia}:${semana.id}${daCasa ? ':' + Date.now() : ''}`;
  const rodadas = montarRodadas(letras, semana.id, e.letras, chave);

  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 780, '#ebcdc3', 5, 0.25);
  s += `<path d="M36 720V210a159 159 0 0 1 318 0v510z" fill="#fbf8f1"/><path d="M36 720V210a159 159 0 0 1 318 0v510" fill="none" stroke="#c6a15b" stroke-width="1.5"/><line x1="36" y1="720" x2="354" y2="720" stroke="#c6a15b" stroke-width="1.5"/>`;
  s += `<g class="stella">${familia.stella(84, 712, 80, 'parado').svg}</g>`;
  s += `<text class="letra" x="270" y="690" text-anchor="middle" font-family="Jost, sans-serif" font-size="72" font-weight="500" fill="#f2a9c4">${semana.id}</text>`;
  s += `<g class="figuras"></g><g class="luz"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  const camada = svg.querySelector('.figuras') as SVGGElement;
  const camadaLuz = svg.querySelector('.luz') as SVGGElement;
  /* uma conta por rodada: ela vê que são três e quantas faltam */
  const contas = trilha(tela, RODADAS);
  const textoLetra = svg.querySelector('.letra') as SVGTextElement;

  let rodada = 0;
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
    if (!vivo) return;
    /* pelo mural, a casinha acende; na volta do dia, a sessão segue */
    if (daCasa) convidarParaCasa(tela);
    else void sessao.avancar();
  };

  const ajuda = new Ajuda();
  /* a mãozinha passeia por cima de todas as figuras, sem parar em nenhuma:
     mostra que figura se toca, sem dizer qual. A resposta é do ouvido dela;
     só a ajuda (6 s a certa respira, 12 s a mãozinha nela) aponta a certa */
  let pararMao: (() => void) | null = null;
  const tirarMao = () => {
    pararMao?.();
    pararMao = null;
    tela.mao(null);
  };
  const passear = (pos: number[][]) => {
    tirarMao();
    const meio: Ponto = [195, 415];
    pararMao = demonstrar(tela, { tipo: 'caminho', pontos: [meio, ...pos.map(([x, y]) => [x!, y! + 10] as Ponto), meio] }, 1);
  };
  tela.svg.addEventListener('pointerdown', tirarMao);

  const proximaRodada = async () => {
    if (!vivo) return;
    if (rodada >= RODADAS) return terminar();
    ajuda.reset();
    camada.innerHTML = '';
    camadaLuz.innerHTML = '';
    tirarMao();
    contas.agora(rodada);
    const { letra, som, alvo, figuras } = rodadas[rodada]!;
    textoLetra.textContent = letra;
    const posicoes = figuras.length === 3 ? [[110, 330], [280, 330], [195, 500]] : [[110, 320], [280, 320], [110, 500], [280, 500]];
    figuras.forEach((id, i) => {
      const [x, y] = posicoes[i]!;
      camada.innerHTML += `<g data-fig="${id}" data-x="${x}" data-y="${y}">${arco(x! - 64, y! - 80, 128, 160, '#f6f0e4', '#c6a15b')}${figura(id, x!, y!, 100)}</g>`;
    });
    /* o som da semana */
    await esperar(400);
    /* o som curto e o som esticado, como na sala: "sss... sssss" */
    if (!(await falarSom(som))) await esperar(900);
    else {
      await esperar(250);
      if (!vivo) return;
      await falarSom(som, 1.6);
    }
    if (!vivo) return;
    const meuTurno = rodada;
    let esperando = true;
    /* a primeira rodada: logo depois do som, a mãozinha passeia pelas figuras */
    if (rodada === 0) passear(posicoes);
    /* ajuda: depois de 6 s a figura certa respira e a mãozinha passeia de novo;
       depois de 12 a mãozinha aponta a certa e o som volta. Parada, repete a cada 6 s */
    let parada = 0;
    let nivelMostrado = 0;
    const timer = window.setInterval(() => {
      if (!vivo || !esperando || rodada !== meuTurno) return window.clearInterval(timer);
      ajuda.tick(1);
      parada += 1;
      const g = camada.querySelector(`[data-fig="${alvo}"]`) as SVGGElement | null;
      if (!g) return;
      if (ajuda.nivel >= 1) g.classList.add('respira');
      /* a ajuda subiu (o tempo ou as tentativas): mostra já; senão, a cada 6 s parada */
      const subiu = ajuda.nivel > nivelMostrado;
      nivelMostrado = ajuda.nivel;
      if (!subiu && parada % 6 !== 0) return;
      if (ajuda.nivel >= 2) {
        tirarMao();
        tela.mao([Number(g.getAttribute('data-x')) + 20, Number(g.getAttribute('data-y')) + 30]);
        void falarSom(som);
      } else if (ajuda.nivel >= 1) passear(posicoes);
    }, 1000);
    tela.aoDestruir(() => window.clearInterval(timer));

    tela.alvo('[data-fig]', (_ev, el) => {
      if (!esperando) return;
      const id = el.getAttribute('data-fig')!;
      const x = Number(el.getAttribute('data-x'));
      const y = Number(el.getAttribute('data-y'));
      ajuda.tocou();
      parada = 0;
      if (id === alvo) {
        esperando = false;
        window.clearInterval(timer);
        travar(2400);
        sininho();
        contas.encher(rodada);
        mudar((m) => {
          if (ajuda.nivel >= 1) m.registro.a1[`som`] = (m.registro.a1.som ?? 0) + 1;
          if (ajuda.nivel >= 2) m.registro.a2[`som`] = (m.registro.a2.som ?? 0) + 1;
          ganhar(m, PEDRINHAS.som, 'som');
        });
        pedrinhasSobem(tela, PEDRINHAS.som, x, y + 60);
        camadaLuz.innerHTML = contornoLuz(x, y, 70, 86, 'respira');
        tela.comemorar(x, y - 90);
        camada.innerHTML += `<text x="${x}" y="${y - 96}" text-anchor="middle" font-family="Jost, sans-serif" font-size="48" font-weight="500" fill="#f2a9c4" class="surge">${letra}</text>`;
        void (async () => {
          /* a certa: o som e a palavra ("sss... sapo") */
          await dizerComSons(`{${som}}... ${nomeDaFigura(id)}`);
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
        void falarPalavra(nomeDaFigura(id)).then(() => dona && falarSom(somInicialDaFigura(id, dona.som)));
      }
    }, true);
  };

  void esperar(600).then(proximaRodada);
  return tela;
}
