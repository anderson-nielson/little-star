import { telaSvg } from './comum';
import { estado } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { ceuDaHora } from '@/core/relogio';
import { familia } from '@/puppet/boneco';
import { arbusto, coelho, gato, nuvem, palmeira, pinheiro, portaDeMadeira, fachada, veu } from '@/puppet/objetos';
import { falar, temVoz } from '@/audio/vozes';
import { anunciar } from '@/core/narracao';
import { tocarFundo } from '@/audio/musica';
import { liraSobe } from '@/audio/synth';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import type { Tela } from '@/core/roteador';

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };

/**
 * Chegada: a casa verde por fora, a porta abre, a família está ali e alguém
 * diz o nome dela. 15 a 20 segundos; um toque adianta.
 */
export function telaChegada(): Tela {
  const e = estado();
  const agora = sessao.agora();
  const ceu = ceuDaHora(agora);
  const noite = ceu === 'ceu-noite';
  const quem = (['nome_mae', 'nome_pai', 'nome_theo'] as const)[e.sessoes % 3]!;

  const W = 390;
  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, W, 300, noite ? '#1b2140' : '#ebcdc3', 5, 0.3);
  s += noite ? `<circle cx="200" cy="92" r="16" fill="#ebd9a8" opacity="0.9"/>` : `<circle cx="200" cy="92" r="22" fill="#ebd9a8" opacity="0.9"/>` + nuvem(280, 70, 14) + nuvem(150, 50, 10);
  s += `<rect x="0" y="560" width="390" height="220" fill="#c9dbb2"/>` + veu(0, 560, W, 220, '#8fae6b', 5, 0.32);
  /* a casa de verdade por fora: o pinheiro de um lado, a palmeira do outro */
  s += pinheiro(30, 600, 240);
  s += fachada(60, 300, 270, 560, { semPorta: true, vidro: noite ? '#f2a9c4' : '#ebd9a8' });
  s += palmeira(346, 600, 230, 9, -8);
  s += arbusto(310, 578, 30, 22, 1);
  /* a porta com a família: a porta de madeira some devagar e a família aparece no vão */
  s += `<g class="porta">${portaDeMadeira(154, 430, 82, 130, 6, true)}</g>`;
  s += `<g class="familia" opacity="0">${familia.mae(168, 560, 112, 'acena').svg}${familia.pai(228, 560, 118, 'parado', { dir: -1 }).svg}${familia.theo(200, 562, 84, 'acena').svg}</g>`;
  s += `<g class="gatinho" opacity="0">${gato(120, 566, 12)}</g>`;
  s += coelho(300, 600, 16);
  const tela = telaSvg(s);
  const svg = tela.svg;
  travar(600);

  let terminou = false;
  const terminar = async () => {
    if (terminou) return;
    terminou = true;
    await esperar(400);
    if (tela.el.isConnected) void sessao.avancar();
  };

  void (async () => {
    tocarFundo(noite ? 'ninar_brahms' : 'gymnopedie');
    await esperar(900);
    liraSobe();
    const porta = svg.querySelector('.porta') as SVGGElement;
    porta.style.transition = 'opacity 900ms';
    porta.style.opacity = '0.15';
    const fam = svg.querySelector('.familia') as SVGGElement;
    fam.style.transition = 'opacity 1200ms';
    fam.style.opacity = '1';
    await esperar(1400);
    if (e.bichos.gato) {
      const g = svg.querySelector('.gatinho') as SVGGElement;
      g.style.transition = 'opacity 800ms';
      g.style.opacity = '1';
    }
    tela.comemorar(200, 430);
    anunciar('chegada');
    if (temVoz(quem)) await falar(quem);
    else await esperar(1500);
    await esperar(1500);
    await terminar();
  })();

  /* um toque em qualquer lugar adianta */
  tela.alvo('svg', () => void terminar(), true);
  return tela;
}
