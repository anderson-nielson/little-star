import { mover, relogioDeAjuda, telaSvg } from './comum';
import { Ajuda } from '@/core/ajuda';
import { estado } from '@/core/estado';
import { aventurasAbertas } from '@/core/laco';
import { ceuDaHora } from '@/core/relogio';
import { sessao } from '@/core/sessao';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { centelha, gato, nuvem, pinha, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { lira, ronronar, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };
/** os galhos, de baixo para cima: [x da ponta, y]; o tronco fica em x = 195 */
const GALHOS: [number, number][] = [
  [110, 640],
  [280, 530],
  [110, 420],
  [280, 310],
  [195, 200],
];

/**
 * Subir na árvore grande, sem pressa e sem obstáculo: cada toque num galho
 * mais alto e ela sobe até ele. Lá de cima vê o céu da hora, a casa verde de
 * cima e o Theo acenando embaixo. À noite, do galho mais alto, a estrela nova.
 * Se o gatinho subiu ao topo, tocar nele começa a aventura da Árvore Grande.
 */
export function telaArvore(): Tela {
  const e = estado();
  const agora = sessao.agora();
  const ceu = ceuDaHora(agora);
  const noite = ceu === 'ceu-noite';
  const gatoNoTopo = Boolean(e.bichos.gato) && aventurasAbertas(e).includes('arvore');

  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, 390, 400, noite ? '#1b2140' : '#ebcdc3', 5, 0.3);
  s += noite ? `<circle cx="205" cy="76" r="14" fill="#ebd9a8"/>` + [90, 150, 230, 330, 300].map((x, i) => centelha(x, 40 + i * 22, 7, '#ebd9a8')).join('') : `<circle cx="205" cy="76" r="22" fill="#ebd9a8" opacity="0.9"/>` + nuvem(300, 60, 14) + nuvem(120, 120, 9);
  /* a casa verde vista de longe, pequena */
  s += `<g class="vista" opacity="0"><path d="M300 150l30 -26l30 26z" fill="#4f6b3a"/><rect x="304" y="150" width="52" height="40" fill="#8fae6b"/><rect x="322" y="172" width="14" height="18" rx="6" fill="#6e1a27"/></g>`;
  /* estrelas das noites bem dormidas, só visíveis do topo */
  if (noite) for (let i = 0; i < Math.min(e.estrelas, 8); i++) s += `<g class="vista" opacity="0">${centelha(250 + (i % 4) * 30, 100 + Math.floor(i / 4) * 24, 9, '#c6a15b')}</g>`;
  s += `<rect x="0" y="700" width="390" height="80" fill="#c9dbb2"/>` + veu(0, 700, 390, 80, '#8fae6b', 4, 0.3);
  /* o tronco e os galhos */
  s += `<rect x="177" y="180" width="36" height="540" rx="10" fill="#c9a189"/><rect x="185" y="180" width="8" height="540" fill="#b08a70" opacity="0.5"/>`;
  GALHOS.forEach(([gx, gy], i) => {
    const esq = gx < 195;
    const cor = i % 2 ? '#35564d' : '#2c4a42';
    s += `<g data-galho="${i}"><path d="M195 ${gy + 6}L${gx} ${gy + 12}" stroke="#b08a70" stroke-width="12" stroke-linecap="round"/>`;
    if (i === GALHOS.length - 1) s += `<path d="M195 120L260 220L130 220z" fill="${cor}"/>`;
    else s += `<ellipse cx="${esq ? gx + 20 : gx - 20}" cy="${gy - 14}" rx="78" ry="34" fill="${cor}" opacity="0.95"/>`;
    s += pinha(esq ? gx + 50 : gx - 50, gy - 6, 8, i % 4) + `<circle cx="${gx}" cy="${gy}" r="40" fill="transparent"/></g>`;
  });
  if (gatoNoTopo) s += `<g data-alvo="gato-topo" class="respira">${gato(230, 176, 16)}</g>`;
  /* a família embaixo, olhando */
  s += `<g class="mae">${familia.mae(60, 712, 110).svg}</g><g class="theo">${familia.theo(300, 714, 84, 'acena').svg}</g>`;
  s += `<g class="stella">${familia.stella(150, 712, 66, 'parado').svg}</g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const stella = svg.querySelector('.stella') as SVGGElement;
  const theo = svg.querySelector('.theo') as SVGGElement;

  let onde = -1; /* -1 é o chão */
  let subindo = false;
  /* a mãozinha mostra o próximo galho; no topo, o gatinho (se ele subiu) */
  const proximo = (): [number, number] | null => {
    if (onde < GALHOS.length - 1) {
      const [gx, gy] = GALHOS[onde + 1]!;
      return [gx, gy + 10];
    }
    return gatoNoTopo ? [236, 190] : null;
  };
  const ajuda = new Ajuda((n) => tela.mao(n >= 1 && !subindo ? proximo() : null));
  relogioDeAjuda(tela, (dt) => ajuda.tick(dt));
  /* na chegada ela ainda não sabe o que fazer: a mãozinha já mostra o primeiro galho */
  tela.mao(proximo());
  const posDe = (i: number): [number, number] => (i < 0 ? [150, 712] : [GALHOS[i]![0] + (GALHOS[i]![0] < 195 ? 10 : -10), GALHOS[i]![1] - 2]);

  const irPara = async (alvo: number) => {
    if (subindo || alvo === onde) return;
    subindo = true;
    ajuda.reset();
    tela.mao(null);
    travar(400);
    const passo = alvo > onde ? 1 : -1;
    while (onde !== alvo) {
      onde += passo;
      const [x, y] = posDe(onde);
      const pose = passo > 0 ? 'pulo' : 'parado';
      stella.innerHTML = familia.stella(x, y, 66, pose).svg;
      lira(62 + Math.max(0, onde + 1) * 2, undefined, 0.3);
      await esperar(420);
    }
    stella.innerHTML = familia.stella(...posDe(onde), 66, onde >= 0 ? 'acena' : 'parado').svg;
    /* o Theo sobe junto até o segundo galho */
    const theoAlvo = Math.min(onde, 1);
    theo.innerHTML = theoAlvo < 0 ? familia.theo(300, 714, 84, 'acena').svg : familia.theo(GALHOS[theoAlvo]![0] > 195 ? GALHOS[theoAlvo]![0] - 40 : GALHOS[theoAlvo]![0] + 40, GALHOS[theoAlvo]![1] - 2, 84, 'acena').svg;
    /* do topo se vê a casa e as estrelas */
    svg.querySelectorAll('.vista').forEach((v) => {
      (v as SVGElement).style.transition = 'opacity 900ms';
      (v as SVGElement).style.opacity = onde >= GALHOS.length - 2 ? '1' : '0';
    });
    if (onde === GALHOS.length - 1) {
      sininho();
      tela.comemorar(195, 150);
      if (gatoNoTopo) ronronar();
    }
    subindo = false;
  };

  tela.alvo('[data-galho]', (_ev, el) => void irPara(Number(el.getAttribute('data-galho'))));
  tela.alvo('svg', (ev) => {
    const [, y] = tela.ponto(ev);
    if (y > 700) void irPara(-1);
  });
  if (gatoNoTopo)
    tela.alvo('[data-alvo="gato-topo"]', async (_ev, el) => {
      ronronar();
      mover(el, 0, -6, 200);
      travar(1500);
      if (temVoz('gato_topo')) await falar('gato_topo');
      else await esperar(600);
      void ir('arvoregrande');
    });
  return tela;
}
