import { mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { anunciar } from '@/core/narracao';
import { esperar } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, centelha, contornoLuz, gato, veu } from '@/puppet/objetos';
import { falar, temVoz } from '@/audio/vozes';
import { pararFundo, tocarFundo } from '@/audio/musica';
import { audio } from '@/audio/engine';
import { liraDesce, sininho } from '@/audio/synth';
import { travar } from '@/core/toque';
import { ir } from '@/core/roteador';
import type { Tela } from '@/core/roteador';

const PASSOS = ['banho', 'dentes', 'pijama', 'livro', 'abajur'] as const;

/**
 * O laço da noite: a casa escura, a canção de ninar, cinco toques da rotina
 * (banho, dentes, pijama, livro, abajur), boa noite, o gatinho sobe na cama,
 * a tela escurece. Um PWA não se fecha sozinho: o jogo dorme.
 */
export function telaNoite(): Tela {
  const e = estado();
  const feitos = new Set(e.hoje.rotinaNoite);
  let s = `<rect width="390" height="780" fill="#1b2140"/>` + veu(0, 0, 390, 780, '#232a55', 6, 0.35);
  /* o quarto à noite */
  s += `<rect x="20" y="120" width="350" height="560" rx="12" fill="#4a3a48" opacity="0.6"/>`;
  s += arco(150, 150, 90, 110, '#10142a') + centelha(180, 190, 8, '#ebd9a8') + centelha(210, 175, 6, '#ebd9a8') + centelha(225, 210, 5, '#ebd9a8');
  s += `<path d="M195 200a10 10 0 1 0 9 14a8 8 0 1 1-9-14z" fill="#ebd9a8"/>`;
  /* cama grande com a Stella sentada */
  s += `<rect x="70" y="480" width="250" height="90" rx="14" fill="#f6e3dc" opacity="0.85"/><rect x="70" y="510" width="250" height="60" rx="10" fill="#f2a9c4" opacity="0.75"/>`;
  s += `<g class="stella">${familia.stella(140, 520, 90, 'sentado').svg}</g>`;
  if (e.bichos.gato) s += `<g class="gato" opacity="0.6">${gato(300, 640, 18)}</g>`;
  /* os cinco objetos da rotina, num arco */
  const pos: [number, number][] = [
    [70, 340],
    [130, 290],
    [195, 270],
    [260, 290],
    [320, 340],
  ];
  const desenhos: Record<string, string> = {
    banho: `<ellipse cx="0" cy="8" rx="30" ry="14" fill="#fbf8f1"/><rect x="-30" y="-2" width="60" height="10" rx="4" fill="#fbf8f1"/><circle cx="-10" cy="-14" r="6" fill="#dbe7ee" opacity="0.8"/><circle cx="6" cy="-20" r="5" fill="#dbe7ee" opacity="0.8"/>`,
    dentes: `<rect x="-26" y="-4" width="52" height="10" rx="5" fill="#f2a9c4" transform="rotate(-20)"/><rect x="12" y="-14" width="18" height="12" rx="3" fill="#fbf8f1" transform="rotate(-20)"/>`,
    pijama: `<path d="M-22 -18h44l6 12l-8 4v28h-40v-28l-8 -4z" fill="#a58bc4"/><circle cx="-8" cy="4" r="3" fill="#ebd9a8"/><circle cx="8" cy="4" r="3" fill="#ebd9a8"/>`,
    livro: `<path d="M-26 -16h24v34h-24zM2 -16h24v34h-24z" fill="#fbf8f1" stroke="#c6a15b"/><path d="M-20 -6h12M-20 2h12M8 -6h12M8 2h12" stroke="#ebcdc3"/>`,
    abajur: `<path d="M-18 -18h36l8 22h-52z" fill="#ebd9a8"/><rect x="-3" y="4" width="6" height="18" fill="#c9a189"/><ellipse cx="0" cy="24" rx="14" ry="4" fill="#c9a189"/>`,
  };
  PASSOS.forEach((p, i) => {
    const [x, y] = pos[i]!;
    /* o translate fica num grupo de fora: o `mover` do toque troca o transform do de dentro.
       Um quadrado invisível de 72 px faz o alvo inteiro (o livro aberto tem um vão no meio). */
    s += `<g transform="translate(${x} ${y})"><g data-passo="${p}" opacity="${feitos.has(p) ? 0.35 : 1}"><rect x="-36" y="-36" width="72" height="72" fill="transparent"/>${desenhos[p]}</g></g>`;
  });
  s += `<g class="luz"></g>`;
  const tela = telaSvg(s, { lua: true, fundo: '#1b2140' });
  const svg = tela.svg;
  const camadaLuz = svg.querySelector('.luz') as SVGGElement;
  travar(500);
  tocarFundo('ninar_brahms', { bpm: 62 });
  audio.definirVolumes(0.6, 0.7);

  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
    audio.definirVolumes(0.8, 0.8);
  });

  const proximoPasso = (): (typeof PASSOS)[number] | null => PASSOS.find((p) => !feitos.has(p)) ?? null;
  const acender = () => {
    const p = proximoPasso();
    camadaLuz.innerHTML = '';
    tela.mao(null);
    if (!p) return void dormir();
    const i = PASSOS.indexOf(p);
    const [x, y] = pos[i]!;
    camadaLuz.innerHTML = contornoLuz(x, y + 4, 44, 40);
    /* depois de 6 s, a mãozinha */
    const t = window.setTimeout(() => {
      if (vivo && proximoPasso() === p) tela.mao([x + 16, y + 20]);
    }, 6000);
    tela.aoDestruir(() => window.clearTimeout(t));
  };

  tela.alvo('[data-passo]', (_ev, el) => {
    const p = el.getAttribute('data-passo') as (typeof PASSOS)[number];
    if (feitos.has(p)) return;
    if (p !== proximoPasso()) {
      /* fora de ordem também vale: um de cada vez, mas a ordem é convite */
    }
    feitos.add(p);
    mudar((x) => {
      if (!x.hoje.rotinaNoite.includes(p)) x.hoje.rotinaNoite.push(p);
    });
    sininho();
    travar(1500);
    mover(el, 0, -8, 300, 1.1);
    void esperar(400).then(() => {
      (el as SVGElement).style.transition = 'opacity 900ms, transform 400ms';
      (el as SVGElement).style.opacity = '0.35';
      mover(el, 0, 0, 400);
    });
    if (p === 'abajur') {
      const quarto = svg.querySelector('rect[x="20"]') as SVGElement | null;
      if (quarto) {
        quarto.style.transition = 'opacity 1500ms';
        quarto.style.opacity = '0.25';
      }
    }
    void esperar(1400).then(acender);
  });

  const dormir = async () => {
    travar(9000);
    const st = svg.querySelector('.stella') as SVGGElement;
    svg.querySelector('.gato')?.remove();
    st.style.transition = 'opacity 900ms';
    st.style.opacity = '0';
    await esperar(900);
    st.innerHTML = stellaNaCama(!!e.bichos.gato);
    st.style.opacity = '1';
    await esperar(800);
    /* o combinado: dormir no quarto dela, a noite toda; amanhã a gente conta */
    if (temVoz('noite_combinado')) await falar('noite_combinado');
    if (temVoz('boa_noite_mae')) await falar('boa_noite_mae');
    else await esperar(1200);
    if (temVoz('boa_noite_pai')) await falar('boa_noite_pai');
    else await esperar(1000);
    if (temVoz('boa_noite_theo')) await falar('boa_noite_theo');
    liraDesce();
    mudar((x) => {
      if (!x.hoje.despedidaFeita) x.sessoesCompletas += 1;
      x.hoje.despedidaFeita = true;
    });
    anunciar('boa_noite');
    await esperar(1500);
    if (vivo) void ir('dormindo');
  };

  void esperar(900).then(acender);
  return tela;
}

/**
 * A Stella deitada na cama: a cabeça no travesseiro, olhos fechados, a
 * coberta até o pescoço. A marionete de pé, deitada de lado (girada), e a
 * coberta por cima; só a cabeça aparece, e fica claro que ela dorme.
 */
export function stellaNaCama(gatinho: boolean): string {
  let s = `<ellipse cx="102" cy="498" rx="36" ry="16" fill="#fbf8f1" opacity="0.9"/>`;
  s += `<g transform="rotate(-90 212 506)">${familia.stella(212, 506, 110, 'parado').svg}</g>`;
  s += `<path d="M126 488q20-12 46-4q30 8 58-2q34-10 66 0q16 4 16 22v44h-186z" fill="#a58bc4"/>`;
  s += `<path d="M126 488q20-12 46-4q30 8 58-2q34-10 66 0" fill="none" stroke="#fbf8f1" stroke-width="5" opacity="0.5"/>`;
  if (gatinho) s += gato(282, 492, 16, '#c8b8a6', true);
  /* o sono: três "z" que sobem da cabeça, um de cada vez */
  const z = (x: number, y: number, t: number, atraso: number) =>
    `<path class="zzz" style="animation-delay:${atraso}ms" d="M${x} ${y}h${t}l-${t} ${t}h${t}" fill="none" stroke="#ebd9a8" stroke-width="${t / 5}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += z(120, 452, 12, 0) + z(136, 430, 15, 1600) + z(154, 404, 18, 3200);
  return s;
}

/**
 * Dormindo: até de manhã, abrir o jogo mostra o quarto dela no escuro, a
 * Stella dormindo com o gatinho e a canção baixinha por 20 segundos, e
 * depois silêncio. Nada responde ao toque, a não ser a lua dos pais. O
 * balão diz a quem está junto que o jogo também dorme e volta de manhã.
 */
export function telaDormindo(): Tela {
  let s = `<rect width="390" height="780" fill="#10142a"/>` + veu(0, 0, 390, 780, '#1b2140', 5, 0.4);
  /* o quarto com a luz apagada */
  s += `<rect x="20" y="120" width="350" height="560" rx="12" fill="#4a3a48" opacity="0.3"/>`;
  /* a janela: a lua e a estrela nova da noite */
  s += arco(150, 150, 90, 110, '#10142a');
  s += `<path d="M195 200a10 10 0 1 0 9 14a8 8 0 1 1-9-14z" fill="#ebd9a8"/>`;
  s += centelha(172, 180, 6, '#ebd9a8') + centelha(222, 214, 5, '#ebd9a8') + `<g class="respira">${centelha(210, 166, 10, '#fbf8f1')}</g>`;
  /* o abajur apagado ao lado da cama */
  s += `<g transform="translate(330 430)" opacity="0.45"><path d="M-18 -18h36l8 22h-52z" fill="#8a8078"/><rect x="-3" y="4" width="6" height="18" fill="#6e6258"/><ellipse cx="0" cy="24" rx="14" ry="4" fill="#6e6258"/></g>`;
  /* a cama */
  s += `<rect x="70" y="470" width="14" height="110" rx="6" fill="#6e3a5a" opacity="0.8"/>`;
  s += `<rect x="70" y="480" width="250" height="90" rx="14" fill="#4a3a48" opacity="0.8"/>`;
  s += stellaNaCama(!!estado().bichos.gato);
  const tela = telaSvg(s, { lua: true, fundo: '#10142a' });
  travar(60000);
  tocarFundo('ninar_brahms', { bpm: 56 });
  audio.definirVolumes(0.35, 0.4);
  anunciar('dormindo');
  const t = window.setTimeout(() => pararFundo(), 20000);
  tela.aoDestruir(() => {
    window.clearTimeout(t);
    audio.definirVolumes(0.8, 0.8);
  });
  /* se amanhecer com o jogo aberto, a casa volta */
  const vigia = window.setInterval(() => {
    const h = sessao.agora().getHours();
    if (h >= 6 && h < 12) {
      window.clearInterval(vigia);
      sessao.comecar();
    }
  }, 60000);
  tela.aoDestruir(() => window.clearInterval(vigia));
  return tela;
}
