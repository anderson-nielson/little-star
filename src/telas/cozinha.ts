import { mover, pedrinhasSobem, relogioDeAjuda, telaSvg } from './comum';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { estado, mudar, type Semente } from '@/core/estado';
import { espanholAtivo } from '@/core/laco';
import { ir } from '@/core/roteador';
import { esperar } from '@/core/util';
import { Ajuda } from '@/core/ajuda';
import { travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { contornoLuz, veu } from '@/puppet/objetos';
import { figura, nomeDaFigura } from '@/puppet/figuras';
import { pararFundo, tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { falarEspanhol } from '@/audio/espanhol';
import { lira, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

type Fase = 'lavar' | 'misturar' | 'servir' | 'fim';

/**
 * A comidinha com a mãe: os legumes da horta (e os do prato) na prateleira;
 * ela toca em cada um, que vai para a bacia, se lava e cai na tigela; depois
 * mexe com a colher; depois o Theo come rindo e a mãe prova. Cada comida diz
 * o nome em português e, quando o espanhol já entrou, a Estrellita diz o dela.
 */
export function telaCozinha(): Tela {
  const e = estado();
  const daHorta = e.colheita.slice(0, 4);
  const doPrato = Object.values(e.pais.comidas).filter((c) => !daHorta.includes(c as Semente));
  const ingredientes = [...daHorta, ...doPrato].slice(0, 4);
  const espanhol = espanholAtivo(e);

  let s = `<rect width="390" height="780" fill="#fbf8f1"/>` + veu(0, 0, 390, 780, '#f6e3dc', 5, 0.3);
  /* a janela, a prateleira, a bancada */
  s += `<rect x="130" y="60" width="130" height="90" rx="8" fill="#dbe7ee" stroke="#c6a15b" stroke-width="1.5"/><path d="M195 60v90M130 105h130" stroke="#c6a15b" stroke-width="1.5"/>`;
  s += `<rect x="30" y="250" width="330" height="8" rx="3" fill="#c9a189"/>`;
  s += `<rect x="0" y="560" width="390" height="220" fill="#ebcdc3" opacity="0.6"/><rect x="20" y="540" width="350" height="24" rx="6" fill="#c9a189"/>`;
  /* a mãe, o Theo sentado à mesa */
  s += `<g class="mae">${familia.mae(60, 540, 250, 'segura').svg}</g>`;
  s += `<g class="theo">${familia.theo(330, 700, 130, 'sentado', { dir: -1 }).svg}</g>`;
  /* bacia, tigela e colher */
  s += `<g class="bacia"><ellipse cx="150" cy="530" rx="46" ry="14" fill="#9fc3cf" stroke="#c6a15b" stroke-width="1.5"/><g class="bolhas"></g></g>`;
  s += `<g class="tigela"><path d="M200 520q50 60 100 0z" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><ellipse cx="250" cy="520" rx="50" ry="12" fill="#f6f0e4" stroke="#c6a15b" stroke-width="1.5"/><g class="na-tigela"></g></g>`;
  s += `<g data-alvo="colher"><circle cx="300" cy="470" r="36" fill="transparent"/><path d="M300 470l30 -60" stroke="#c9a189" stroke-width="7" stroke-linecap="round"/><ellipse cx="298" cy="474" rx="12" ry="16" fill="#c9a189" transform="rotate(30 298 474)"/></g>`;
  /* a Estrellita na janela, quando o espanhol já entrou */
  if (espanhol) s += `<g class="estrellita">${familia.boneca(240, 148, 40, 0).svg}</g>`;
  /* os ingredientes na prateleira */
  s += `<g class="prateleira">`;
  ingredientes.forEach((id, i) => {
    const x = 70 + i * 84;
    s += `<g data-ing="${id}" data-x="${x}"><circle cx="${x}" cy="215" r="38" fill="#fbf8f1" opacity="0.8"/>${figura(id, x, 215, 56)}</g>`;
  });
  s += `</g><g class="luz"></g><g class="prato-final"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  tocarFundo('preludio_bach');
  const luz = svg.querySelector('.luz') as SVGGElement;
  const naTigela = svg.querySelector('.na-tigela') as SVGGElement;
  const bolhas = svg.querySelector('.bolhas') as SVGGElement;

  let fase: Fase = 'lavar';
  let lavados = 0;
  let mexidas = 0;
  let ocupado = false;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const proximoAlvo = (): [number, number] | null => {
    if (fase === 'lavar') {
      const g = svg.querySelector('[data-ing]:not([data-feito])');
      return g ? [Number(g.getAttribute('data-x')), 215] : null;
    }
    if (fase === 'misturar') return [300, 470];
    return null;
  };
  const mostrarAjuda = (n: number) => {
    luz.innerHTML = '';
    tela.mao(null);
    const p = proximoAlvo();
    if (!p || n < 1) return;
    luz.innerHTML = contornoLuz(p[0], p[1], 42, 42);
    tela.mao([p[0] + 14, p[1] + 20]);
  };
  const ajuda = new Ajuda(mostrarAjuda);
  relogioDeAjuda(tela, (dt) => {
    ajuda.tick(dt);
    /* A2: a mãe faz junto */
    if (ajuda.nivel >= 2 && !ocupado && vivo) {
      if (fase === 'lavar') {
        const g = svg.querySelector('[data-ing]:not([data-feito])') as SVGGElement | null;
        if (g) void lavar(g);
      } else if (fase === 'misturar') void mexer();
    }
  });

  const dizer = async (id: string) => {
    await falarPalavra(nomeDaFigura(id));
    if (espanhol) {
      const est = svg.querySelector('.estrellita');
      if (est) {
        mover(est, 0, -6, 200);
        void esperar(240).then(() => mover(est, 0, 0, 300));
      }
      await falarEspanhol(id);
    }
  };

  const lavar = async (g: SVGGElement) => {
    if (ocupado || fase !== 'lavar' || g.hasAttribute('data-feito')) return;
    ocupado = true;
    g.setAttribute('data-feito', '1');
    ajuda.tocou();
    ajuda.reset();
    const id = g.getAttribute('data-ing')!;
    const x = Number(g.getAttribute('data-x'));
    travar(1500);
    /* vai para a bacia, bolhas, vai para a tigela */
    mover(g, 150 - x, 300, 600, 0.8);
    await esperar(650);
    toc(700, 0.15);
    bolhas.innerHTML = [0, 1, 2, 3].map((k) => `<circle class="sobe" cx="${130 + k * 14}" cy="${520 - (k % 2) * 8}" r="${4 + (k % 2) * 2}" fill="#fbf8f1" opacity="0.9" style="animation-delay:${k * 80}ms"/>`).join('');
    void dizer(id);
    await esperar(900);
    mover(g, 250 - x + (lavados - 1.5) * 16, 296, 600, 0.55);
    await esperar(650);
    g.remove();
    naTigela.innerHTML += figura(id, 232 + lavados * 14, 522 - (lavados % 2) * 6, 26);
    lavados += 1;
    sininho(0.2);
    if (lavados >= ingredientes.length) {
      fase = 'misturar';
      if (temVoz('cozinha_misturar')) void falar('cozinha_misturar');
    }
    ocupado = false;
  };

  const mexer = async () => {
    if (ocupado || fase !== 'misturar') return;
    ocupado = true;
    ajuda.tocou();
    mexidas += 1;
    const colher = svg.querySelector('[data-alvo="colher"]') as SVGGElement;
    mover(colher, -30, 30, 250);
    lira(62 + mexidas * 3, undefined, 0.3);
    naTigela.style.transformBox = 'fill-box';
    naTigela.style.transformOrigin = 'center';
    naTigela.style.transition = 'transform 500ms';
    naTigela.style.transform = `rotate(${mexidas * 120}deg)`;
    await esperar(300);
    mover(colher, 0, 0, 300);
    await esperar(350);
    if (mexidas >= 3) {
      fase = 'servir';
      await servir();
    }
    ocupado = false;
  };

  const servir = async () => {
    fase = 'fim';
    travar(5000);
    /* o prato vai para a mesa; o Theo come rindo; a mãe prova */
    const prato = svg.querySelector('.prato-final') as SVGGElement;
    prato.innerHTML = `<ellipse cx="250" cy="600" rx="44" ry="14" fill="#f6f0e4" stroke="#c6a15b" stroke-width="1.5"/>${ingredientes.map((id, i) => figura(id, 232 + i * 12, 596, 22)).join('')}`;
    prato.style.opacity = '0';
    prato.style.transition = 'opacity 600ms';
    requestAnimationFrame(() => (prato.style.opacity = '1'));
    naTigela.innerHTML = '';
    sininho();
    await esperar(800);
    const theo = svg.querySelector('.theo') as SVGGElement;
    for (let k = 0; k < 3; k++) {
      mover(theo, 0, -8, 200);
      toc(500 + k * 50, 0.12);
      await esperar(220);
      mover(theo, 0, 0, 260);
      await esperar(300);
    }
    tela.comemorar(300, 560);
    if (temVoz('cozinha_pronto')) await falar('cozinha_pronto');
    mudar((x) => {
      x.comidinhas += 1;
      x.lembrancas.push(`comidinha:${x.hoje.dia}`);
      x.colheita = x.colheita.filter((c) => !daHorta.includes(c));
      x.registro.partes.cozinha = (x.registro.partes.cozinha ?? 0) + 1;
      ganhar(x, PEDRINHAS.comidinha, 'comidinha');
    });
    pedrinhasSobem(tela, PEDRINHAS.comidinha, 250, 560);
    await esperar(2500);
    if (vivo) void ir('casa');
  };

  tela.alvo('[data-ing]', (_ev, el) => void lavar(el as SVGGElement));
  tela.alvo('[data-alvo="colher"]', () => void mexer());
  void esperar(600).then(() => temVoz('cozinha_lavar') && falar('cozinha_lavar'));
  tela.aoDestruir(() => pararFundo());
  return tela;
}
