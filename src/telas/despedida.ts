import { mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { brincadeiraDoDia } from '@/core/laco';
import { ceuDaHora } from '@/core/relogio';
import { esperar } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, gato, nuvem, pinha, pinheiro, veu } from '@/puppet/objetos';
import { falar, temVoz } from '@/audio/vozes';
import { tocarFundo, pararFundo } from '@/audio/musica';
import { liraDesce, sininho } from '@/audio/synth';
import { travar } from '@/core/toque';
import type { Tela } from '@/core/roteador';

const CEU: Record<string, string> = { 'ceu-dia': '#dbe7ee', 'ceu-tarde': '#f3d9cf', 'ceu-noite': '#232a55' };

/**
 * Despedida: a família na porta, um convite concreto para o mundo, a porta
 * fecha com um laço rosa. Na primeira sessão, a cestinha com o gatinho e a
 * escolha do nome. Depois disso o jogo descansa: um toque mais tarde reabre.
 */
export function telaDespedida(): Tela {
  const e = estado();
  const ceu = ceuDaHora(sessao.agora());
  const noite = ceu === 'ceu-noite';
  const brinc = brincadeiraDoDia(e, sessao.agora());
  const convite = ({ piano: 'convite_piano', caderno: 'convite_letra', palavras: 'convite_letra', areia: 'convite_areia', pinhas: 'convite_pinha', jardim: 'convite_brincar', familia: 'convite_regar', cozinha: 'convite_cozinha' } as const)[brinc];
  const pictograma = ({ piano: 'piano', caderno: 'letra', palavras: 'letra', areia: 'areia', pinhas: 'pinha', jardim: 'fora', familia: 'regador', cozinha: 'panela' } as const)[brinc];
  const primeiraVez = !e.bichos.gato;

  let s = `<rect width="390" height="780" fill="${CEU[ceu]}"/>` + veu(0, 0, 390, 300, noite ? '#1b2140' : '#ebcdc3', 5, 0.3);
  if (!noite) s += nuvem(280, 70, 14) + nuvem(150, 50, 10);
  s += `<rect x="0" y="560" width="390" height="220" fill="#c9dbb2"/>` + veu(0, 560, 390, 220, '#8fae6b', 5, 0.32);
  s += `<path d="M40 300L195 160L350 300z" fill="#4f6b3a"/><rect x="60" y="300" width="270" height="260" fill="#8fae6b"/>` + veu(60, 300, 270, 260, '#c9dbb2', 4, 0.22);
  s += arco(120, 330, 56, 70, '#ebd9a8') + arco(214, 330, 56, 70, '#ebd9a8');
  s += `<g class="familia">${familia.mae(168, 560, 112, 'acena').svg}${familia.pai(228, 560, 118, 'acena', { dir: -1 }).svg}${familia.theo(200, 562, 84, 'acena').svg}</g>`;
  s += `<g class="porta" opacity="0"><path d="M150 560v-110a45 45 0 0 1 90 0v110z" fill="#6e1a27"/><g class="laco" opacity="0"><path d="M195 470q-24 -18 -20 4q4 12 20 -4q24 -18 20 4q-4 12 -20 -4z" fill="#f2a9c4"/><path d="M195 470l-10 26M195 470l10 26" stroke="#f2a9c4" stroke-width="5" stroke-linecap="round"/></g></g>`;
  /* o balão do convite: um pictograma, sem texto */
  s += `<g class="convite" opacity="0">${arco(250, 380, 100, 110, '#fbf8f1')}<g class="picto"></g></g>`;
  s += pinheiro(355, 640, 300) + pinha(300, 600, 5);
  /* a cestinha do primeiro dia */
  if (primeiraVez) s += `<g class="cesta" opacity="0"><path d="M60 600q40 -10 80 0l-8 34h-64z" fill="#c9a189"/><path d="M76 600q24 -30 48 0" fill="none" stroke="#c9a189" stroke-width="5"/><g class="gato-cesta">${gato(100, 604, 12)}</g></g>`;
  const tela = telaSvg(s, { lua: true });
  const svg = tela.svg;
  travar(800);
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const picto = svg.querySelector('.picto') as SVGGElement;
  const desenhoPicto: Record<string, string> = {
    piano: `<rect x="270" y="410" width="60" height="44" rx="4" fill="#f2a9c4"/><rect x="270" y="430" width="60" height="12" fill="#fbf8f1"/>`,
    letra: `<text x="300" y="450" text-anchor="middle" font-family="Jost, sans-serif" font-size="56" font-weight="500" fill="#f2a9c4">${e.letras[e.letras.length - 1] ?? 'A'}</text>`,
    areia: `<path d="M300 400l10 22h24l-19 14 7 23-22-14-22 14 7-23-19-14h24z" fill="#D2463C"/>`,
    pinha: pinha(300, 460, 12),
    fora: `<circle cx="300" cy="420" r="16" fill="#ebd9a8"/><path d="M270 470q30 -30 60 0" fill="#8fae6b"/>`,
    panela: `<rect x="272" y="426" width="56" height="30" rx="8" fill="#b6a58c"/><rect x="266" y="420" width="68" height="8" rx="3" fill="#8f8270"/><path d="M290 412q4 -10 0 -18M304 412q4 -10 0 -18" fill="none" stroke="#dbe7ee" stroke-width="3" stroke-linecap="round"/>`,
    regador: `<rect x="278" y="420" width="40" height="34" rx="6" fill="#7FA5B8"/><path d="M318 430l20 -14" stroke="#7FA5B8" stroke-width="8" stroke-linecap="round"/><path d="M336 412l4 -8M340 416l8 -4" stroke="#9fc3cf" stroke-width="3"/>`,
  };
  picto.innerHTML = desenhoPicto[pictograma] ?? '';

  const escolherNome = async () => {
    /* três centelhas: cada uma diz um nome; ela toca na que quiser */
    const cesta = svg.querySelector('.cesta') as SVGElement;
    cesta.style.transition = 'opacity 900ms';
    cesta.style.opacity = '1';
    await esperar(1200);
    const nomes = ['nome_gato_1', 'nome_gato_2', 'nome_gato_3'];
    const textos = ['Mimi', 'Luna', 'Bolota'];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = nomes
      .map((id, i) => `<g data-nome="${i}" class="respira" style="animation-delay:${i * 300}ms"><circle cx="${90 + i * 105}" cy="700" r="36" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><path d="M${90 + i * 105 - 12} 688c.8 7.4 4.6 11.2 12 12-7.4.8-11.2 4.6-12 12-.8-7.4-4.6-11.2-12-12 7.4-.8 11.2-4.6 12-12z" fill="${['#f2a9c4', '#c6a15b', '#8fae6b'][i]}"/></g>`)
      .join('');
    svg.appendChild(g);
    let escolhido = false;
    for (let i = 0; i < 3; i++) {
      if (temVoz(nomes[i]!)) {
        const el = g.querySelector(`[data-nome="${i}"]`) as SVGElement;
        el.style.opacity = '1';
        await falar(nomes[i]!);
        await esperar(300);
      }
    }
    tela.alvo('[data-nome]', (_ev, el) => {
      if (escolhido) return;
      escolhido = true;
      const i = Number(el.getAttribute('data-nome'));
      sininho();
      mudar((x) => {
        x.bichos.gato = textos[i]!;
      });
      const gc = svg.querySelector('.gato-cesta');
      if (gc) mover(gc, 100, -80, 900, 1.3);
      tela.comemorar(200, 560);
      void (async () => {
        if (temVoz(nomes[i]!)) await falar(nomes[i]!);
        g.remove();
        await esperar(800);
        await fechar();
      })();
    });
    /* sem toque em 20 s, o primeiro nome fica */
    await esperar(20000);
    if (!escolhido && vivo) {
      escolhido = true;
      mudar((x) => {
        x.bichos.gato = textos[0]!;
      });
      g.remove();
      await fechar();
    }
  };

  const fechar = async () => {
    if (!vivo) return;
    const porta = svg.querySelector('.porta') as SVGElement;
    const fam = svg.querySelector('.familia') as SVGElement;
    fam.style.transition = 'opacity 1200ms';
    fam.style.opacity = '0';
    porta.style.transition = 'opacity 1200ms';
    porta.style.opacity = '1';
    await esperar(1300);
    const laco = svg.querySelector('.laco') as SVGElement;
    laco.style.transition = 'opacity 800ms';
    laco.style.opacity = '1';
    liraDesce();
    mudar((x) => {
      x.hoje.despedidaFeita = true;
    });
    await esperar(2500);
    pararFundo();
    /* o jogo descansa. Um toque depois de um tempo reabre, como segunda vez no dia */
    await esperar(4000);
    if (!vivo) return;
    sessao.inicioLivre = 0;
    tela.alvo('svg', () => {
      travar(800);
      sessao.comecar();
    }, true);
  };

  void (async () => {
    tocarFundo(noite ? 'ninar_brahms' : 'gymnopedie');
    await esperar(1000);
    tela.comemorar(200, 430);
    const bal = svg.querySelector('.convite') as SVGElement;
    bal.style.transition = 'opacity 800ms';
    bal.style.opacity = '1';
    if (temVoz(convite)) await falar(convite);
    else await esperar(2500);
    if (temVoz('tchau')) await falar('tchau');
    else await esperar(1200);
    bal.style.opacity = '0';
    if (primeiraVez) await escolherNome();
    else await fechar();
  })();

  return tela;
}
