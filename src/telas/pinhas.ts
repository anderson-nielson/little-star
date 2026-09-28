import { arrastavel, convidarParaCasa, mover, telaSvg } from './comum';
import { guiar, type Gesto } from './guia';
import { estado, mudar, type Material } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { estacao } from '@/core/relogio';
import { ir } from '@/core/roteador';
import { doTopo, esperar, semente } from '@/core/util';
import { travar } from '@/core/toque';
import { balancinho, barbaDeVelho, coelho, gato, montinhoDeAreia, pedra, pinha, pinheiro, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { escovada, lira, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

const COR_ESTACAO: Record<string, string> = { verao: '#ebd9a8', outono: '#e8a24a', inverno: '#7FA5B8', primavera: '#f2a9c4' };

/**
 * Pinhas e a mesa da estação. Embaixo do pinheiro, de 4 a 7 pinhas para
 * arrastar até a cestinha. Na mesa, ela monta o que quiser com as pinhas da
 * cesta, pedrinhas, areia e barba de velho, e fica tudo onde ela pôs.
 * Sozinha, ela não sabia que a pinha se arrasta: agora, nas duas cenas, a
 * mãozinha leva uma pinha até onde ela vai (e de novo se ela ficar parada).
 */
export function telaPinhas(params: Record<string, string>): Tela {
  return params.mesa === '1' ? mesaDaEstacao() : embaixoDoPinheiro();
}

function embaixoDoPinheiro(): Tela {
  const e = estado();
  const seed = semente(e.hoje.dia + 'pinhas');
  const n = 4 + Math.floor(seed * 4);
  let s = `<rect width="390" height="780" fill="#dbe7ee"/>` + veu(0, 0, 390, 300, '#ebcdc3', 4, 0.25);
  s += `<rect x="0" y="420" width="390" height="360" fill="#c9dbb2"/>` + veu(0, 420, 390, 360, '#8fae6b', 5, 0.3);
  s += pinheiro(250, 540, 430);
  /* a cestinha */
  s += `<g class="cesta"><path d="M40 660q60 -14 120 0l-12 50h-96z" fill="#c9a189"/><path d="M64 660q36 -44 72 0" fill="none" stroke="#c9a189" stroke-width="6"/><g class="na-cesta"></g></g>`;
  if (e.bichos.coelho) s += `<g class="coelho">${coelho(330, 700, 26)}</g>`;
  if (e.bichos.gato) s += `<g class="gato">${gato(60, 560, 14)}</g>`;
  s += `<g class="chao"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const chao = svg.querySelector('.chao') as SVGGElement;
  const naCesta = svg.querySelector('.na-cesta') as SVGGElement;
  let catadas = 0;
  /* a mãozinha leva a primeira pinha do chão até a cestinha, depois que todas caíram */
  let caiu: () => void = () => {};
  const cairam = new Promise<void>((r) => (caiu = r));
  const guia = guiar(tela, {
    depoisDe: cairam,
    atraso: 600,
    proximo: () => {
      const p = chao.querySelector('.pinha');
      if (!p) return null;
      const de: [number, number] = [Number(p.getAttribute('data-x')), Number(p.getAttribute('data-y'))];
      return { tipo: 'arrastar', de, ate: [104, 668], levar: p };
    },
  });
  /* umas pinhas novas caem com o vento */
  void (async () => {
    for (let i = 0; i < n; i++) {
      const x = 90 + ((seed * 7919 * (i + 1)) % 230);
      const y = 590 + ((seed * 104729 * (i + 3)) % 120);
      const tipo = Math.floor((seed * 31 * (i + 1)) % 4);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pinha');
      g.setAttribute('data-x', String(x));
      g.setAttribute('data-y', String(y - 6));
      g.innerHTML = alcance(x, y, 20) + pinha(x, y, 20, tipo);
      g.style.transformBox = 'fill-box';
      g.style.transform = 'translateY(-300px)';
      chao.appendChild(g);
      lira(62 + (i % 5) * 2, undefined, 0.2);
      requestAnimationFrame(() => {
        g.style.transition = 'transform 900ms cubic-bezier(0.4, 0, 0.6, 1)';
        g.style.transform = 'translateY(0)';
      });
      arrastavel(svg, g, (dx, dy) => {
        const fx = x + dx;
        const fy = y + dy;
        const dist = Math.hypot(fx - 100, fy - 680);
        if (dist < 90 || (dy < 0 && fx < 190 && fy > 600)) {
          travar(500);
          toc(420, 0.2);
          sininho();
          g.remove();
          catadas += 1;
          guia.passo();
          naCesta.innerHTML += pinha(70 + catadas * 16, 664, 12, tipo);
          mudar((m) => {
            m.cesta += 1;
            m.pinhas.push({ tipo, x: Math.random(), y: 0 });
          });
          const co = svg.querySelector('.coelho');
          if (co) {
            mover(co, -20, 0, 400);
            void esperar(500).then(() => mover(co, 0, 0, 400));
          }
          if (catadas >= n) {
            guia.calar();
            void esperar(1200).then(() => {
              /* a casinha, tocada nesse instante, vale mais que a mesa */
              if (tela.el.isConnected) void ir('pinhas', { mesa: '1' });
            });
          }
          return true;
        }
        return false;
      });
      await esperar(500);
    }
    caiu();
  })();
  return tela;
}

/* o tampo da mesa: onde as coisas ficam (posições guardadas de 0 a 1 dentro dele) */
const TAMPO = { x: 44, y: 246, w: 302, h: 256 };
/* quantas pedras, areias e musgos cabem na mesa antes de a bandeja parar de dar */
const LUGARES_NA_MESA = 48;
/* onde cada material mora na bandeja: o centro de onde ela pega */
const BANDEJA: Record<Material, [number, number]> = { pedra: [158, 688], areia: [246, 690], musgo: [330, 672] };
const TIPOS_POR_MATERIAL: Record<Material, number> = { pedra: 4, areia: 3, musgo: 3 };

/**
 * A mesa da estação, vista de cima e um pouco de frente: o pano da cor da
 * estação, e embaixo uma bandeja de madeira com o que ela junta lá fora.
 * Pinhas da cesta (as que ela catou), pedrinhas, punhados de areia e tufos de
 * barba de velho. Ela arrasta o que quiser para o tampo e monta o que quiser:
 * um caminho de areia, uma roda de pedras, uma pinha com barba. Fica tudo
 * onde ela deixou, de uma sessão para a outra. O que ela arrasta de volta para
 * a bandeja sai da mesa (a pinha volta para a cesta). Não tem certo nem errado.
 */
function mesaDaEstacao(): Tela {
  const est = estacao(sessao.agora());
  const corEst = COR_ESTACAO[est]!;
  const corPano2 = { verao: '#f3e6c0', outono: '#f0b56a', inverno: '#9dbccb', primavera: '#f7c3d6' }[est]!;
  const corDobra = { verao: '#d8c48e', outono: '#c8853a', inverno: '#6a8ea1', primavera: '#dd8fac' }[est]!;
  /* o quarto: a parede clara em cima, o chão de madeira embaixo */
  let s = `<rect width="390" height="780" fill="#f6e3dc"/>` + veu(0, 0, 390, 560, '#ebcdc3', 5, 0.25);
  s += `<rect x="0" y="560" width="390" height="220" fill="#e3cdb6"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M0 ${596 + i * 32}h390" stroke="#d3b99c" stroke-width="1.2" opacity="0.7"/>`;
  /* a sombra da mesa no chão, as pernas, a saia do pano com as dobras, e o tampo */
  s += `<ellipse cx="195" cy="618" rx="180" ry="18" fill="#000" opacity="0.07"/>`;
  s += `<rect x="46" y="540" width="18" height="76" rx="4" fill="#b98f70"/><rect x="326" y="540" width="18" height="76" rx="4" fill="#b98f70"/>`;
  s += `<path d="M28 508h334v34q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0q-18 10 -36 0z" fill="${corDobra}"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${64 + i * 34} 510v28" stroke="${corEst}" stroke-width="5" stroke-linecap="round" opacity="0.5"/>`;
  s += `<rect x="28" y="228" width="334" height="284" rx="14" fill="${corEst}"/>`;
  s += veu(40, 240, 310, 260, corPano2, 4, 0.35, true);
  s += `<rect x="28" y="228" width="334" height="284" rx="14" fill="none" stroke="${corDobra}" stroke-width="2" opacity="0.5"/>`;
  /* a trama do pano, bem de leve */
  for (let i = 0; i < 7; i++) s += `<path d="M${52 + i * 44} 236v268" stroke="#fbf8f1" stroke-width="1" opacity="0.1"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M36 ${258 + i * 44}h318" stroke="#fbf8f1" stroke-width="1" opacity="0.1"/>`;
  /* o vasinho da estação, no canto de trás da mesa: folhas, velinha, flores, uma concha */
  s += `<g style="pointer-events:none"><path d="M318 262h26l-3 20h-20z" fill="#c9a189"/>`;
  if (est === 'outono') s += `<path d="M322 262q4 -22 16 -18q-2 20 -16 18z" fill="#d97f74"/><path d="M336 262q10 -18 18 -8q-8 14 -18 8z" fill="#e8a24a"/><path d="M60 262q14 -20 26 0q-12 22 -26 0z" fill="#e8a24a" opacity="0.9"/>`;
  if (est === 'inverno') s += `<rect x="325" y="228" width="12" height="36" rx="3" fill="#fbf8f1"/><path d="M331 226q-5 -6 0 -12q5 6 0 12z" fill="#e8a24a"/><circle cx="331" cy="221" r="2" fill="#ebd9a8"/>`;
  if (est === 'primavera') s += `<path d="M331 262v-22M325 262v-16M338 262v-14" stroke="#8fae6b" stroke-width="2"/><circle cx="331" cy="238" r="6" fill="#f2a9c4"/><circle cx="325" cy="245" r="5" fill="#ebd9a8"/><circle cx="338" cy="247" r="5" fill="#f2a9c4"/>`;
  if (est === 'verao') s += `<path d="M320 262q11 -18 22 0q-11 10 -22 0z" fill="#fbf8f1" stroke="#c6a15b"/><path d="M331 262v-14M325 260v-9M337 260v-9" stroke="#c6a15b" stroke-width="1" opacity="0.6"/>`;
  s += `</g>`;
  /* a lembrança do parquinho, no outro canto de trás */
  if (estado().lembrancas.some((l) => l.startsWith('parquinho:'))) s += `<g style="pointer-events:none">${balancinho(62, 272, 22)}</g>`;
  s += `<g class="na-mesa"></g>`;
  /* a bandeja de madeira, com a cesta das pinhas, o potinho de pedras, a tigela de areia e o tufo de barba de velho */
  s += `<rect x="18" y="630" width="354" height="124" rx="14" fill="#c9a189"/><rect x="26" y="638" width="338" height="108" rx="10" fill="#d8b596"/>`;
  s += `<g class="cesta"><path d="M40 692q40 -12 80 0l-9 46h-62z" fill="#b98f70"/><path d="M54 692q26 -40 52 0" fill="none" stroke="#b98f70" stroke-width="5"/><g class="na-cesta"></g></g>`;
  s += `<path d="M132 694q26 -8 52 0l-6 40h-40z" fill="#8f8a80"/><path d="M132 694q26 -8 52 0" fill="none" stroke="#6f6a62" stroke-width="3"/>`;
  s += `${pedra(150, 690, 6, 2)}${pedra(166, 691, 6, 1)}`;
  s += `<path d="M212 700q34 -10 68 0l-8 36h-52z" fill="#7FA5B8"/><ellipse cx="246" cy="700" rx="34" ry="8" fill="#EEDDB4"/>`;
  s += `<path d="M300 668q16 -12 40 -4q14 4 26 -4" fill="none" stroke="#8a6a4a" stroke-width="4" stroke-linecap="round"/>`;
  s += `<g class="fontes"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('gymnopedie');
  const naMesa = svg.querySelector('.na-mesa') as SVGGElement;
  const naCesta = svg.querySelector('.na-cesta') as SVGGElement;
  const fontes = svg.querySelector('.fontes') as SVGGElement;

  const noTampo = (fx: number, fy: number) => fx > TAMPO.x - 8 && fx < TAMPO.x + TAMPO.w + 8 && fy > TAMPO.y - 12 && fy < TAMPO.y + TAMPO.h + 8;
  const naBandeja = (fy: number) => fy > 600;
  const cestaVazia = () => estado().pinhas.every((q) => q.y > 0);
  const mesaVazia = () => estado().mesa.length === 0 && !estado().pinhas.some((q) => q.y > 0);

  let acabou = false;
  /* a primeira coisa arrumada (ou a cesta esvaziada): a casinha acende. Nada obriga a sair */
  const pronta = () => {
    acabou = true;
    tela.comemorar(195, 380);
    convidarParaCasa(tela);
  };
  /* a mãozinha leva a pinha da cesta até o meio da mesa; sem pinha, uma pedra do potinho */
  const guia = guiar(tela, {
    atraso: 1000,
    proximo: (): Gesto | null => {
      const p = naCesta.querySelector('[data-de-cima]');
      if (p) {
        const de: [number, number] = [Number(p.getAttribute('data-x')), Number(p.getAttribute('data-y'))];
        return { tipo: 'arrastar', de, ate: [195, 380], levar: p };
      }
      if (mesaVazia()) {
        const f = fontes.querySelector('[data-material="pedra"]');
        return f ? { tipo: 'arrastar', de: BANDEJA.pedra, ate: [195, 380], levar: f } : null;
      }
      if (acabou) {
        const [x, y] = doTopo(svg, 50, 62);
        return { tipo: 'apontar', em: [x, y] };
      }
      return null;
    },
  });
  const somDe = (m: Material) => {
    if (m === 'pedra') toc(300, 0.22);
    else if (m === 'areia') escovada(true, 0.09);
    else escovada(false, 0.07);
  };
  const desenho = (m: Material, x: number, y: number, tipo: number) => (m === 'pedra' ? pedra(x, y, 11, tipo) : m === 'areia' ? montinhoDeAreia(x, y, 16, tipo) : barbaDeVelho(x, y, 14, tipo));
  const arrumou = () => {
    guia.passo();
    if (!acabou && !mesaVazia()) pronta();
  };

  const render = () => {
    naMesa.innerHTML = '';
    naCesta.innerHTML = '';
    fontes.innerHTML = '';
    const e = estado();

    /* as pinhas: as da cesta empilhadas, as da mesa onde ela pôs */
    const ultimaNaCesta = e.pinhas.reduce((u, p, i) => (p.y > 0 ? u : i), -1);
    e.pinhas.forEach((p, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const naMesaJa = p.y > 0;
      const x = naMesaJa ? TAMPO.x + p.x * TAMPO.w : 62 + (i % 5) * 14;
      const y = naMesaJa ? TAMPO.y + p.y * TAMPO.h : 700 - Math.floor(i / 5) * 8;
      /* a de cima da cesta se pega pela cesta inteira: o dedo não precisa acertar a pinha */
      const pega = i === ultimaNaCesta ? `<rect x="34" y="644" width="92" height="100" fill="transparent"/>` : alcance(x, y, 18);
      g.innerHTML = pega + pinha(x, y, 18, p.tipo);
      if (i === ultimaNaCesta) {
        g.setAttribute('data-de-cima', '');
        g.setAttribute('data-x', String(x));
        g.setAttribute('data-y', String(y - 6));
      }
      (naMesaJa ? naMesa : naCesta).appendChild(g);
      arrastavel(svg, g, (dx, dy) => {
        const fx = x + dx;
        const fy = y + dy;
        if (noTampo(fx, fy)) {
          toc(420, 0.2);
          mudar((m) => {
            const q = m.pinhas[i];
            if (q) {
              q.x = Math.max(0, Math.min(1, (fx - TAMPO.x) / TAMPO.w));
              q.y = Math.max(0.02, Math.min(1, (fy - TAMPO.y) / TAMPO.h));
            }
          });
          render();
          arrumou();
          return true;
        }
        if (naMesaJa && naBandeja(fy)) {
          /* de volta para a cesta */
          toc(260, 0.12);
          mudar((m) => {
            const q = m.pinhas[i];
            if (q) q.y = 0;
          });
          render();
          guia.passo();
          return true;
        }
        return false;
      });
    });

    /* a areia por baixo, o musgo por cima dela, as pedras por cima de tudo */
    const ordem: Material[] = ['areia', 'musgo', 'pedra'];
    const itens = e.mesa.map((c, i) => ({ c, i })).sort((a, b) => ordem.indexOf(a.c.material) - ordem.indexOf(b.c.material));
    for (const { c, i } of itens) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const x = TAMPO.x + c.x * TAMPO.w;
      const y = TAMPO.y + c.y * TAMPO.h;
      g.innerHTML = alcance(x, y + 6, 14) + desenho(c.material, x, y, c.tipo);
      naMesa.appendChild(g);
      arrastavel(svg, g, (dx, dy) => {
        const fx = x + dx;
        const fy = y + dy;
        if (noTampo(fx, fy)) {
          somDe(c.material);
          mudar((m) => {
            const q = m.mesa[i];
            if (q) {
              q.x = Math.max(0, Math.min(1, (fx - TAMPO.x) / TAMPO.w));
              q.y = Math.max(0, Math.min(1, (fy - TAMPO.y) / TAMPO.h));
            }
          });
          render();
          arrumou();
          return true;
        }
        if (naBandeja(fy)) {
          toc(260, 0.12);
          mudar((m) => {
            m.mesa.splice(i, 1);
          });
          render();
          guia.passo();
          return true;
        }
        return false;
      });
    }

    /* na bandeja, uma de cada para pegar: solta na mesa, vira uma coisa nova e a bandeja dá outra */
    for (const material of ordem) {
      const [bx, by] = BANDEJA[material];
      const quantos = e.mesa.filter((c) => c.material === material).length;
      const tipo = quantos % TIPOS_POR_MATERIAL[material];
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-material', material);
      g.innerHTML = `<rect x="${bx - 44}" y="${by - 50}" width="88" height="96" fill="transparent"/>` + desenho(material, bx, by, tipo);
      fontes.appendChild(g);
      arrastavel(svg, g, (dx, dy) => {
        const fx = bx + dx;
        const fy = by + dy;
        if (!noTampo(fx, fy) || estado().mesa.length >= LUGARES_NA_MESA) return false;
        somDe(material);
        mudar((m) => {
          m.mesa.push({ material, tipo, x: Math.max(0, Math.min(1, (fx - TAMPO.x) / TAMPO.w)), y: Math.max(0, Math.min(1, (fy - TAMPO.y) / TAMPO.h)) });
        });
        render();
        arrumou();
        return true;
      });
    }
  };
  render();
  /* chegou com algo já na mesa (a cesta vazia, ou tudo arrumado): a mesa já está pronta, e
     a casinha acende; antes a tela ficava esperando para sempre. Com a mesa vazia, espera a
     primeira coisa arrumada */
  if (cestaVazia() && !mesaVazia()) pronta();
  return tela;
}

/** Um círculo invisível em volta da pinha: o dedo de 5 anos acerta a pinha, não só as escamas. */
function alcance(x: number, y: number, s: number): string {
  return `<circle cx="${x}" cy="${y - s * 0.35}" r="${s * 1.3}" fill="transparent"/>`;
}
