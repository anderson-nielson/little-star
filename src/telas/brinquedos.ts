import { arrastavel, mover, relogioDeAjuda, telaSvg, trilha } from './comum';
import { entrarNoCuidado, terminarCuidado, ursinho } from './cuidados';
import { guiar } from './guia';
import { estado } from '@/core/estado';
import { BRINQUEDOS, destinoDoBrinquedo, lugarPerto, type Brinquedo, type Lugar } from '@/core/cuidados';
import { travar } from '@/core/toque';
import { esperar, svgEl } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { contornoLuz, gato, veu } from '@/puppet/objetos';
import { pararFundo, tocarFundo } from '@/audio/musica';
import { lira, sininho, toc } from '@/audio/synth';
import { falar, temVoz } from '@/audio/vozes';
import type { Tela } from '@/core/roteador';

/** o meio de cada casa, para soltar e para a luz */
const CASA: Record<Lugar, [number, number]> = { estante: [86, 356], caixa: [195, 408], cesto: [312, 404] };
const ALCANCE = 84;
/** onde cada brinquedo começa, espalhado no tapete */
const NO_CHAO: Record<string, [number, number]> = {
  bloco_rosa: [78, 560],
  livro_verde: [300, 548],
  ursinho: [148, 660],
  bloco_azul: [252, 694],
  livro_rosa: [58, 690],
  bola: [318, 626],
  bloco_amarelo: [196, 580],
};
/** onde ele fica dentro da casa dele: os blocos lado a lado, os livros em pé, os macios espiando do cesto */
const DENTRO: Record<string, [number, number]> = {
  bloco_rosa: [170, 398],
  bloco_azul: [195, 394],
  bloco_amarelo: [220, 398],
  livro_verde: [60, 306],
  livro_rosa: [82, 306],
  ursinho: [296, 392],
  bola: [332, 390],
};
const COR: Record<string, string> = { bloco_rosa: '#f2a9c4', bloco_azul: '#7FA5B8', bloco_amarelo: '#ebd9a8', livro_verde: '#8fae6b', livro_rosa: '#d97f74' };

function desenho(id: string, x: number, y: number, s = 1): string {
  if (id.startsWith('bloco_')) {
    const l = 17 * s;
    return `<rect x="${x - l}" y="${y - l}" width="${2 * l}" height="${2 * l}" rx="${4 * s}" fill="${COR[id]}"/><rect x="${x - l}" y="${y - l}" width="${2 * l}" height="${7 * s}" rx="${4 * s}" fill="#fbf8f1" opacity="0.35"/>`;
  }
  if (id.startsWith('livro_')) {
    return `<rect x="${x - 15 * s}" y="${y - 20 * s}" width="${30 * s}" height="${40 * s}" rx="${3 * s}" fill="${COR[id]}"/><rect x="${x - 15 * s}" y="${y - 20 * s}" width="${6 * s}" height="${40 * s}" rx="${2 * s}" fill="#1a1c2b" opacity="0.15"/><rect x="${x + 11 * s}" y="${y - 18 * s}" width="${3 * s}" height="${36 * s}" fill="#fbf8f1"/>`;
  }
  if (id === 'ursinho') return ursinho(x, y + 22 * s, 50 * s);
  /* a bola de pano, em gomos */
  return `<circle cx="${x}" cy="${y}" r="${18 * s}" fill="#ebd9a8"/><path d="M${x} ${y - 18 * s}q${-12 * s} ${18 * s} 0 ${36 * s}" fill="#f2a9c4"/><path d="M${x} ${y - 18 * s}q${12 * s} ${18 * s} 0 ${36 * s}" fill="none" stroke="#7FA5B8" stroke-width="${4 * s}"/>`;
}

/**
 * Guardar os brinquedos na sala de brincar. Cada coisa tem a sua casa: os
 * blocos na caixa, os livros na estante, os bichinhos macios e a bola no cesto
 * (cada casa tem o desenho do que mora nela). Ela leva um de cada vez até a
 * casa. Soltou na casa certa, ele entra; soltou na casa de outro, ele pula
 * sozinho para a dele e a casa dele acende; soltou no chão, ele volta para
 * onde estava. Com o tapete limpo, a família vem sentar e o gatinho deita no
 * meio: arrumado, cabe todo mundo.
 */
export function telaBrinquedos(): Tela {
  const e = estado();
  entrarNoCuidado('brinquedos');
  let s = `<rect width="390" height="780" fill="#c9dbb2"/>` + veu(0, 0, 390, 480, '#8fae6b', 4, 0.2);
  s += `<rect x="-400" y="470" width="1190" height="700" fill="#ebcdc3"/><line x1="0" y1="470" x2="390" y2="470" stroke="#c6a15b" stroke-width="1" opacity="0.5"/>`;
  s += `<ellipse cx="195" cy="630" rx="176" ry="112" fill="#f2a9c4" opacity="0.32"/><ellipse cx="195" cy="630" rx="156" ry="96" fill="none" stroke="#c6a15b" stroke-width="1" opacity="0.4"/>`;
  s += `<g class="familia" opacity="0"></g>`;
  /* a estante: dois andares, e no alto a plaquinha com um livro */
  s += `<rect x="28" y="330" width="116" height="8" rx="2" fill="#c9a189"/><rect x="28" y="404" width="116" height="8" rx="2" fill="#c9a189"/><rect x="24" y="252" width="8" height="200" rx="3" fill="#c9a189"/><rect x="140" y="252" width="8" height="200" rx="3" fill="#c9a189"/><rect x="24" y="250" width="124" height="8" rx="3" fill="#c9a189"/>`;
  s += `<g data-dentro="estante"></g><g transform="translate(86 234)"><rect x="-16" y="-14" width="32" height="26" rx="6" fill="#fbf8f1" stroke="#c6a15b"/>${desenho('livro_verde', 0, -1, 0.45)}</g>`;
  /* a caixa de madeira: o que está dentro fica atrás da frente dela */
  s += `<rect x="152" y="370" width="86" height="12" rx="3" fill="#b08a70"/><g data-dentro="caixa"></g><rect x="150" y="394" width="90" height="56" rx="6" fill="#c9a189"/><g transform="translate(195 422)"><rect x="-15" y="-13" width="30" height="26" rx="6" fill="#fbf8f1" opacity="0.8"/>${desenho('bloco_rosa', 0, 0, 0.5)}</g>`;
  /* o cesto, com um ursinho desenhado na frente */
  s += `<g data-dentro="cesto"></g><path d="M262 392h100l-10 60h-80z" fill="#d9b88f"/><path d="M268 410h88M270 428h84" stroke="#b08a70" stroke-width="2" opacity="0.6"/><g transform="translate(312 424)"><circle r="14" fill="#fbf8f1" opacity="0.8"/>${ursinho(0, 13, 24)}</g>`;
  s += `<g class="luz"></g><g class="chao"></g>`;
  s += `<g class="stella" style="pointer-events:none">${familia.stella(352, 770, 112, 'parado').svg}</g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('serenata');
  tela.aoDestruir(() => pararFundo());
  const luz = svg.querySelector('.luz') as SVGGElement;
  const chao = svg.querySelector('.chao') as SVGGElement;
  const contas = trilha(tela, BRINQUEDOS.length);

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });
  let guardados = 0;
  let ocupado = false;
  const noChao = new Set(BRINQUEDOS.map((b) => b.id));

  const acenderCasa = (l: Lugar, ms = 1600) => {
    const [x, y] = CASA[l];
    const g = svgEl(`<g>${contornoLuz(x, y, 64, 56)}</g>`);
    luz.appendChild(g);
    void esperar(ms).then(() => g.remove());
  };

  /* o brinquedo entra na casa dele: some do chão e aparece lá dentro, menor */
  const entrar = async (b: Brinquedo, el: SVGGElement) => {
    const [x0, y0] = NO_CHAO[b.id]!;
    const [xd, yd] = DENTRO[b.id]!;
    mover(el, xd - x0, yd - y0, 520, 0.7);
    await esperar(540);
    el.remove();
    const dentro = svg.querySelector(`[data-dentro="${b.lugar}"]`) as SVGGElement;
    dentro.appendChild(svgEl(`<g class="surge">${desenho(b.id, xd, yd, 0.7)}</g>`));
    noChao.delete(b.id);
    contas.encher(guardados);
    guardados += 1;
    contas.agora(guardados < BRINQUEDOS.length ? guardados : -1);
    sininho(0.2);
    guia.passo();
    if (guardados >= BRINQUEDOS.length) void fim();
  };

  const soltar = (b: Brinquedo, el: SVGGElement, dx: number, dy: number): boolean => {
    if (ocupado) return false;
    const [x0, y0] = NO_CHAO[b.id]!;
    const onde = lugarPerto(x0 + dx, y0 + dy, CASA, ALCANCE);
    const { vai, certo } = destinoDoBrinquedo(b, onde);
    if (!vai) {
      /* no chão: volta para onde estava, e dá para levar de novo */
      toc(300, 0.08);
      guia.ajuda.tentativa();
      return false;
    }
    ocupado = true;
    travar(1400);
    void (async () => {
      if (!certo) {
        /* a casa de outro: ele pula sozinho para a dele, e a dele acende */
        toc(520, 0.16);
        acenderCasa(vai);
        mover(el, dx, dy - 24, 220);
        await esperar(240);
      } else toc(420, 0.18);
      await entrar(b, el);
      ocupado = false;
    })();
    return true;
  };

  BRINQUEDOS.forEach((b, i) => {
    const [x, y] = NO_CHAO[b.id]!;
    const g = svgEl(`<g data-brinq="${b.id}"><circle cx="${x}" cy="${y}" r="38" fill="transparent"/>${desenho(b.id, x, y)}</g>`) as SVGGElement;
    g.style.opacity = '0';
    chao.appendChild(g);
    void esperar(200 + i * 120).then(() => {
      g.style.transition = 'opacity 400ms';
      g.style.opacity = '1';
    });
    arrastavel(svg, g, (dx, dy) => soltar(b, g, dx, dy));
  });

  /* a ajuda: a mãozinha pega o próximo brinquedo e leva, com ele junto, até a
     casa dele (logo na entrada, depois da voz, e de novo parada); no A2, ele vai sozinho */
  const proximo = (): Brinquedo | null => BRINQUEDOS.find((b) => noChao.has(b.id)) ?? null;
  const fala = esperar(900).then(async () => {
    if (vivo && temVoz('brinquedos_comeca')) await falar('brinquedos_comeca');
  });
  const guia = guiar(tela, {
    /* os brinquedos ainda estão aparecendo no tapete */
    atraso: 1400,
    depoisDe: fala,
    proximo: () => {
      const b = ocupado ? null : proximo();
      const el = b && svg.querySelector(`[data-brinq="${b.id}"]`);
      if (!b || !el) return null;
      acenderCasa(b.lugar, 2600);
      return { tipo: 'arrastar', de: NO_CHAO[b.id]!, ate: CASA[b.lugar], levar: el };
    },
  });
  let vez = 0;
  relogioDeAjuda(tela, () => {
    if (guia.ajuda.nivel < 2 || ocupado || !vivo) return;
    vez += 1;
    if (vez % 3) return;
    const b = proximo();
    const el = b && (svg.querySelector(`[data-brinq="${b.id}"]`) as SVGGElement | null);
    if (b && el) {
      /* a mãozinha solta o brinquedo antes: ele vai sozinho do lugar dele */
      guia.parar();
      ocupado = true;
      void entrar(b, el).then(() => (ocupado = false));
    }
  });

  /* o tapete limpo: a família vem sentar, o gatinho deita no meio */
  const fim = async () => {
    guia.calar();
    travar(3000);
    lira(67, undefined, 0.3);
    const fam = svg.querySelector('.familia') as SVGGElement;
    /* a Stella senta no tapete com eles, no lugar que ela mesma abriu */
    fam.innerHTML = familia.mae(80, 680, 120, 'sentado').svg + familia.theo(244, 618, 92, 'sentado').svg + familia.pai(326, 700, 128, 'sentado', { dir: -1 }).svg + familia.stella(168, 708, 86, 'sentado').svg + (e.bichos.gato ? gato(236, 724, 18, '#c8b8a6', true) : '');
    fam.style.transition = 'opacity 1200ms';
    await esperar(300);
    fam.style.opacity = '1';
    const ela = svg.querySelector('.stella') as SVGElement | null;
    if (ela) {
      ela.style.transition = 'opacity 800ms';
      ela.style.opacity = '0';
    }
    await esperar(1000);
    if (!vivo) return;
    await terminarCuidado(tela, 'brinquedos', [195, 560], 'brinquedos_pronto', () => vivo);
  };

  contas.agora(0);
  return tela;
}
