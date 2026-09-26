import { relogioDeAjuda, telaSvg, trilha } from './comum';
import { mudar } from '@/core/estado';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { travar } from '@/core/toque';
import { Ajuda } from '@/core/ajuda';
import { familia } from '@/puppet/boneco';
import { gato, nuvem } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { lira, PENTATONICA, ronronar, sininho } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

/** Dados da Árvore Grande: poucos galhos, um toque para cada. */
export const ARVORE = {
  galhos: 7,
  /** distância entre um galho e o de cima, no espaço da cena */
  passo: 120,
  /** o pulo de um galho para o outro, em segundos */
  duracaoDoPulo: 0.5,
};

const CHAO = 700;
const TRONCO = 195;

/** Onde fica o galho `i` (0 é o mais baixo): a ponta e a altura. Alterna os lados; o último é a copa, no meio. */
export function galho(i: number): [number, number] {
  const y = CHAO - 100 - i * ARVORE.passo;
  if (i === ARVORE.galhos - 1) return [TRONCO, y];
  return [i % 2 === 0 ? 105 : 285, y];
}

/** onde ela fica de pé: no chão (-1) ou em cima do galho, entre o tronco e a ponta */
function pe(i: number): [number, number] {
  if (i < 0) return [140, CHAO + 12];
  const [gx, gy] = galho(i);
  if (i === ARVORE.galhos - 1) return [TRONCO - 30, gy];
  return [gx < TRONCO ? gx + 30 : gx - 30, gy];
}

/**
 * A Árvore Grande: o gatinho subiu até o topo e não sabe descer. Cada toque,
 * ela pula para o galho de cima, como os degraus da escada do escorregador.
 * Sem pressa e sem nada caindo. Lá em cima ela abraça o gatinho e vai para o
 * palco. A família fica embaixo, olhando.
 */
export function telaArvoreGrande(): Tela {
  const N = ARVORE.galhos;
  const topo = galho(N - 1)[1];

  let m = `<rect width="390" height="780" fill="#dbe7ee"/>`;
  m += `<g class="mundo">`;
  /* o céu que continua para cima, com nuvens pelo caminho */
  m += `<rect x="-200" y="${topo - 400}" width="790" height="${CHAO - topo + 400}" fill="#dbe7ee"/>`;
  for (let k = 0; k < 4; k++) m += nuvem(k % 2 ? 320 : 70, CHAO - 260 - k * 220, 12);
  /* o chão do quintal */
  m += `<rect x="-200" y="${CHAO}" width="790" height="400" fill="#c9dbb2"/><rect x="-200" y="${CHAO}" width="790" height="6" fill="#8fae6b"/>`;
  /* o tronco, do chão até a copa */
  m += `<rect x="${TRONCO - 20}" y="${topo - 20}" width="40" height="${CHAO - topo + 30}" rx="10" fill="#c9a189"/><rect x="${TRONCO - 10}" y="${topo - 20}" width="8" height="${CHAO - topo + 30}" fill="#b08a70" opacity="0.5"/>`;
  m += `<path d="M${TRONCO - 20} ${CHAO - 16}Q${TRONCO - 24} ${CHAO} ${TRONCO - 40} ${CHAO + 4}H${TRONCO + 40}Q${TRONCO + 24} ${CHAO} ${TRONCO + 20} ${CHAO - 16}z" fill="#c9a189"/>`;
  /* a copa lá em cima */
  m += `<path d="M${TRONCO} ${topo - 150}L${TRONCO + 110} ${topo + 4}H${TRONCO - 110}z" fill="#2c4a42"/>`;
  /* os galhos */
  for (let i = 0; i < N - 1; i++) {
    const [gx, gy] = galho(i);
    const esq = gx < TRONCO;
    m += `<path d="M${TRONCO} ${gy + 4}L${gx} ${gy + 10}" stroke="#b08a70" stroke-width="12" stroke-linecap="round"/>`;
    m += `<ellipse cx="${esq ? gx + 18 : gx - 18}" cy="${gy - 50}" rx="80" ry="34" fill="${i % 2 ? '#35564d' : '#2c4a42'}" opacity="0.9"/>`;
  }
  m += `<path d="M${TRONCO - 70} ${topo + 6}H${TRONCO + 70}" stroke="#b08a70" stroke-width="12" stroke-linecap="round"/>`;
  /* o gatinho esperando no topo */
  m += `<g class="gatinho respira">${gato(TRONCO + 40, topo + 2, 26)}</g>`;
  /* a família embaixo, olhando */
  m += familia.mae(40, CHAO + 12, 110).svg + familia.theo(320, CHAO + 14, 84, 'acena').svg;
  m += `<g class="stella"></g>`;
  m += `</g>`;

  const tela = telaSvg(m);
  const svg = tela.svg;
  const mundo = svg.querySelector('.mundo') as SVGGElement;
  const gst = svg.querySelector('.stella') as SVGGElement;
  tocarFundo('marcha');
  const contas = trilha(tela, N);
  contas.agora(0);

  let onde = -1;
  let pulo: { de: [number, number]; para: [number, number]; t: number } | null = null;
  let pos = pe(-1);
  let acabou = false;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  /* a câmera acompanha: ela fica sempre na metade de baixo da tela */
  const camDe = (y: number) => Math.max(0, 470 - y);
  let cam = camDe(pos[1]);

  const desenhar = () => {
    let pose: 'parado' | 'pulo' | 'acena' | 'abraca' = 'parado';
    let dir: 1 | -1 = 1;
    if (pulo) {
      pose = 'pulo';
      dir = pulo.para[0] >= pulo.de[0] ? 1 : -1;
    } else if (acabou) pose = 'abraca';
    else if (onde >= 0) pose = 'acena';
    gst.innerHTML = familia.stella(pos[0], pos[1], 86, pose, { dir }).svg;
    mundo.setAttribute('transform', `translate(0 ${cam.toFixed(1)})`);
  };
  desenhar();

  const proximo = (): [number, number] => {
    const [x, y] = pe(onde + 1);
    return [x, y + cam - 30];
  };
  const ajuda = new Ajuda((n) => tela.mao(n >= 1 && !pulo && !acabou ? proximo() : null));
  relogioDeAjuda(tela, (dt) => ajuda.tick(dt));
  /* na chegada, a mãozinha já mostra o primeiro galho */
  tela.mao(proximo());

  const chegouNoTopo = async () => {
    acabou = true;
    desenhar();
    contas.agora(-1);
    ronronar();
    sininho();
    tela.comemorar(TRONCO, pos[1] + cam - 80);
    mudar((x) => {
      x.aventuras += 1;
      x.aventurasPor.arvore = (x.aventurasPor.arvore ?? 0) + 1;
      if (ajuda.nivel >= 1) x.registro.a1.arvore = (x.registro.a1.arvore ?? 0) + 1;
      if (ajuda.nivel >= 2) x.registro.a2.arvore = (x.registro.a2.arvore ?? 0) + 1;
    });
    travar(2400);
    await esperar(2400);
    if (vivo) void ir('palco');
  };

  let ultimo = performance.now();
  const quadro = (agora: number) => {
    if (!vivo) return;
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    let mudou = false;
    if (pulo) {
      pulo.t = Math.min(1, pulo.t + dt / ARVORE.duracaoDoPulo);
      const k = pulo.t * pulo.t * (3 - 2 * pulo.t);
      pos = [pulo.de[0] + (pulo.para[0] - pulo.de[0]) * k, pulo.de[1] + (pulo.para[1] - pulo.de[1]) * k - Math.sin(Math.PI * pulo.t) * 30];
      if (pulo.t >= 1) {
        pos = pulo.para;
        pulo = null;
        contas.encher(onde, true);
        contas.agora(onde + 1 < N ? onde + 1 : -1);
        if (onde === N - 1) void chegouNoTopo();
      }
      mudou = true;
    }
    const alvo = camDe(pos[1]);
    if (Math.abs(alvo - cam) > 0.5) {
      cam += (alvo - cam) * Math.min(1, dt * 5);
      mudou = true;
    }
    if (mudou) desenhar();
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);

  const tocou = (ev: PointerEvent) => {
    const t = ev.target as Element;
    if (t.closest('.casinha') || t.closest('.lua-pais')) return;
    if (pulo || acabou) return;
    ajuda.tocou();
    ajuda.reset();
    tela.mao(null);
    onde += 1;
    pulo = { de: pos, para: pe(onde), t: 0 };
    lira(PENTATONICA[Math.min(PENTATONICA.length - 1, onde)]!, undefined, 0.32);
    travar(ARVORE.duracaoDoPulo * 1000);
  };
  tela.alvo('svg', tocou, true);
  return tela;
}
