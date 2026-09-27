import { mover, relogioDeAjuda, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { anunciar } from '@/core/narracao';
import { esperar, pontoNoSvg, svgEl } from '@/core/util';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { centelha, coelho, contornoLuz, gato, maozinha, veu } from '@/puppet/objetos';
import { figura } from '@/puppet/figuras';
import { liraDesce, ronronar, sininho, toc } from '@/audio/synth';
import { tocarFundo } from '@/audio/musica';
import type { Tela } from '@/core/roteador';

const OURO = '#c6a15b';
const ROSA = '#f2a9c4';
const MARFIM = '#fbf8f1';

type Quem = 'gato' | 'coelho';
type Cuidado = 'agua' | 'prato' | 'cenoura' | 'carinho-gato' | 'carinho-coelho';

/** Um coração: o sinal do carinho que o bicho sente. */
function coracao(x: number, y: number, s: number, cor = ROSA, attrs = ''): string {
  return `<path d="M${x} ${y + s * 0.9}C${x - s * 1.5} ${y - s * 0.1} ${x - s * 0.6} ${y - s * 1.1} ${x} ${y - s * 0.35}C${x + s * 0.6} ${y - s * 1.1} ${x + s * 1.5} ${y - s * 0.1} ${x} ${y + s * 0.9}z" fill="${cor}" ${attrs}/>`;
}

/* onde mora cada bicho e cada coisa da cena */
const BICHO: Record<Quem, { x: number; y: number; s: number; cx: number; cy: number; rx: number; ry: number; medidor: [number, number] }> = {
  gato: { x: 130, y: 615, s: 46, cx: 134, cy: 572, rx: 62, ry: 66, medidor: [130, 500] },
  coelho: { x: 262, y: 615, s: 52, cx: 268, cy: 572, rx: 62, ry: 70, medidor: [282, 480] },
};

/** o desenho de cada cuidado no quadro do alto */
function icone(c: Cuidado, x: number, y: number): string {
  switch (c) {
    case 'agua':
      return `<path d="M${x} ${y - 14}C${x + 9} ${y - 2} ${x + 10} ${y + 3} ${x + 10} ${y + 5}a10 10 0 0 1 -20 0c0 -2 1 -7 10 -19z" fill="#9fc3cf"/>`;
    case 'prato':
      return `<ellipse cx="${x}" cy="${y + 4}" rx="15" ry="6" fill="#f6f0e4" stroke="${OURO}" stroke-width="1.5"/><ellipse cx="${x}" cy="${y + 1}" rx="9" ry="4" fill="#c48f5a"/>`;
    case 'cenoura':
      return figura('cenoura', x, y, 34);
    case 'carinho-gato':
      return `${gato(x - 2, y + 15, 17)}${coracao(x + 12, y - 12, 5.5)}`;
    case 'carinho-coelho':
      return `${coelho(x - 5, y + 14, 18)}${coracao(x + 12, y - 12, 5.5)}`;
  }
}

/**
 * Os bichos: no fim de toda sessão, o gatinho e o coelhinho no tapete.
 * Água (tocar), comida (arrastar), carinho (passar o dedo devagar no pelo).
 * Nenhum bicho fica triste se ela não vier: só fica contente quando ela vem.
 *
 * O quadro no alto mostra um desenho para cada cuidado: o que falta, o de
 * agora (com um anel que respira) e o que já foi (cheio de ouro). Tocar num
 * desenho do quadro faz a mãozinha mostrar como se faz. Parada, a mãozinha
 * mostra sozinha o próximo cuidado, com o gesto inteiro: tocar, arrastar até
 * o bicho ou passar devagar no pelo.
 */
export function telaBichos(): Tela {
  const e = estado();
  const temCoelho = Boolean(e.bichos.coelho);
  const ordem: Cuidado[] = temCoelho ? ['agua', 'prato', 'cenoura', 'carinho-gato', 'carinho-coelho'] : ['agua', 'prato', 'carinho-gato'];

  const bicho = (q: Quem) => {
    const b = BICHO[q];
    const desenho = q === 'gato' ? gato(b.x, b.y, b.s) : coelho(b.x, b.y, b.s);
    /* o pelo inteiro é alvo, com folga: o dedinho não precisa acertar o contorno */
    return `<g class="${q}"><ellipse class="pelo" cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="#000" opacity="0"/><g class="corpo" style="pointer-events:none">${desenho}</g></g>`;
  };

  let s = `<rect width="390" height="780" fill="#c9dbb2"/>` + veu(0, 0, 390, 780, '#8fae6b', 6, 0.22);
  s += `<rect x="0" y="300" width="390" height="480" fill="${MARFIM}" opacity="0.4"/>`;
  s += `<ellipse cx="195" cy="560" rx="175" ry="130" fill="#ebcdc3"/>`;
  s += `<g class="luzes" style="pointer-events:none"></g>`;
  s += bicho('gato');
  if (temCoelho) s += bicho('coelho');
  /* potinho de água */
  s += `<g data-alvo="agua"><ellipse cx="80" cy="690" rx="44" ry="30" fill="#000" opacity="0"/><ellipse cx="80" cy="690" rx="30" ry="12" fill="${MARFIM}" stroke="${OURO}" stroke-width="1.5"/><ellipse class="nivel" cx="80" cy="690" rx="22" ry="7" fill="#9fc3cf" opacity="0"/></g>`;
  /* pratinho do gato e cenoura do coelho, para arrastar */
  s += `<g data-arrasta="prato" data-para="gato"><ellipse cx="195" cy="698" rx="40" ry="28" fill="#000" opacity="0"/><ellipse cx="195" cy="700" rx="26" ry="10" fill="#f6f0e4" stroke="${OURO}"/><ellipse cx="195" cy="696" rx="16" ry="6" fill="#c48f5a"/></g>`;
  if (temCoelho) s += `<g data-arrasta="cenoura" data-para="coelho"><ellipse cx="310" cy="690" rx="36" ry="40" fill="#000" opacity="0"/>${figura('cenoura', 310, 690, 60)}</g>`;
  /* os medidores de carinho: um coração vazio que vai enchendo */
  for (const q of temCoelho ? (['gato', 'coelho'] as const) : (['gato'] as const)) {
    const [mx, my] = BICHO[q].medidor;
    s += `<g class="medidor medidor-${q}" style="pointer-events:none;opacity:0;transition:opacity 300ms">${coracao(mx, my, 16, MARFIM, `stroke="${ROSA}" stroke-width="3"`)}<g class="enche" style="transform-box:fill-box;transform-origin:center;transform:scale(0);transition:transform 150ms">${coracao(mx, my, 16)}</g></g>`;
  }
  /* o quadro dos cuidados */
  const passo = 58;
  const xDe = (k: number) => 195 + (k - (ordem.length - 1) / 2) * passo;
  const YQ = 176;
  s += `<rect x="${xDe(0) - 36}" y="${YQ - 34}" width="${(ordem.length - 1) * passo + 72}" height="68" rx="34" fill="${MARFIM}" opacity="0.55" style="pointer-events:none"/>`;
  ordem.forEach((c, k) => {
    const x = xDe(k);
    s += `<g class="cuidado" data-cuidado="${c}"><circle class="fundo-c" cx="${x}" cy="${YQ}" r="25" fill="${MARFIM}" stroke="${OURO}" stroke-width="2" opacity="0.9"/><circle class="anel" cx="${x}" cy="${YQ}" r="29" fill="none" stroke="${OURO}" stroke-width="3" opacity="0"/><g class="desenho" opacity="0.45">${icone(c, x, YQ)}</g><g class="feito" opacity="0">${centelha(x + 18, YQ - 18, 16, OURO)}</g></g>`;
  });
  s += `<g class="coracoes" style="pointer-events:none"></g><g class="demo" style="pointer-events:none"></g>`;

  const tela = telaSvg(s);
  const svg = tela.svg;
  const luzes = svg.querySelector('.luzes') as SVGGElement;
  const coracoes = svg.querySelector('.coracoes') as SVGGElement;
  const demo = svg.querySelector('.demo') as SVGGElement;
  tocarFundo('gymnopedie');

  const pendentes = new Set<Cuidado>(ordem);
  let terminou = false;
  let parada = 0;
  let vivo = 0;

  const proximo = (): Cuidado | undefined => ordem.find((c) => pendentes.has(c));

  /* ---------- o quadro e a luz no próximo cuidado ---------- */

  /** onde está cada cuidado na cena: a luz que pulsa e o gesto da mãozinha */
  const lugar: Record<Cuidado, { luz: [number, number, number, number] }> = {
    agua: { luz: [80, 690, 40, 20] },
    prato: { luz: [195, 698, 36, 20] },
    cenoura: { luz: [310, 690, 28, 40] },
    'carinho-gato': { luz: [BICHO.gato.cx, BICHO.gato.cy, BICHO.gato.rx - 4, BICHO.gato.ry - 4] },
    'carinho-coelho': { luz: [BICHO.coelho.cx, BICHO.coelho.cy, BICHO.coelho.rx - 4, BICHO.coelho.ry - 4] },
  };

  const pintarQuadro = () => {
    const agora = proximo();
    for (const c of ordem) {
      const g = svg.querySelector(`[data-cuidado="${c}"]`)!;
      const feito = !pendentes.has(c);
      g.querySelector('.fundo-c')!.setAttribute('fill', feito ? '#f3e3b8' : MARFIM);
      g.querySelector('.desenho')!.setAttribute('opacity', feito || c === agora ? '1' : '0.45');
      g.querySelector('.feito')!.setAttribute('opacity', feito ? '1' : '0');
      const anel = g.querySelector('.anel') as SVGElement;
      anel.setAttribute('opacity', c === agora ? '1' : '0');
      anel.classList.toggle('respira', c === agora);
    }
    /* a luz que pulsa: "pode tocar aqui", no próximo cuidado da cena (é o que o chamado procura) */
    const l = agora ? lugar[agora].luz : null;
    luzes.innerHTML = l && !terminou ? contornoLuz(l[0], l[1], l[2], l[3]) : '';
  };

  const marcar = (c: Cuidado) => {
    if (!pendentes.delete(c)) return;
    const g = svg.querySelector(`[data-cuidado="${c}"]`) as SVGGElement;
    pintarQuadro();
    mover(g, 0, -6, 250, 1.25);
    void esperar(300).then(() => mover(g, 0, 0, 350));
    toc(660 + ordem.indexOf(c) * 30, 0.14);
  };

  /* ---------- a mãozinha que mostra o gesto inteiro ---------- */

  let demoAte = 0;
  const pararDemo = () => {
    demo.innerHTML = '';
    tela.mao(null);
  };
  const demonstrar = (c: Cuidado | undefined, ms = 5000) => {
    pararDemo();
    if (!c || terminou) return;
    const mao = maozinha(0, 0, 1.3, -15, '');
    if (c === 'agua') {
      tela.mao([88, 700]);
    } else if (c === 'prato' || c === 'cenoura') {
      const [ox, oy] = c === 'prato' ? [195, 700] : [310, 690];
      const b = BICHO[c === 'prato' ? 'gato' : 'coelho'];
      const coisa = c === 'prato' ? `<ellipse cx="0" cy="0" rx="26" ry="10" fill="#f6f0e4" stroke="${OURO}"/><ellipse cx="0" cy="-4" rx="16" ry="6" fill="#c48f5a"/>` : figura('cenoura', 0, 0, 60);
      demo.innerHTML = `<g><animateMotion path="M${ox} ${oy}L${b.x} ${b.y - 10}" dur="2.4s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.2;0.8;1" calcMode="linear"/><g opacity="0.55">${coisa}</g>${mao}</g>`;
    } else {
      const b = BICHO[c === 'carinho-gato' ? 'gato' : 'coelho'];
      const y = b.cy + 10;
      demo.innerHTML = `<g><animateMotion path="M${b.cx - 34} ${y}L${b.cx + 34} ${y}L${b.cx - 34} ${y}" dur="3s" repeatCount="indefinite"/>${mao}</g>`;
    }
    const ate = ++demoAte;
    void esperar(ms).then(() => {
      if (demoAte === ate) pararDemo();
    });
  };

  /* qualquer toque tira a mãozinha e zera a espera */
  const tocou = () => {
    parada = 0;
    pararDemo();
  };
  svg.addEventListener('pointerdown', tocou);
  tela.aoDestruir(() => svg.removeEventListener('pointerdown', tocou));

  /* tocar num desenho do quadro: a mãozinha mostra como é aquele cuidado */
  tela.alvo('[data-cuidado]', (_ev, el) => {
    const c = el.getAttribute('data-cuidado') as Cuidado;
    toc(520, 0.12);
    demonstrar(pendentes.has(c) ? c : proximo(), 4500);
  });

  /* ---------- o bicho contente ---------- */

  const coracaoSobe = (x: number, y: number, s = 9) => {
    const g = svgEl(`<g class="sobe">${coracao(x, y, s)}</g>`);
    coracoes.appendChild(g);
    void esperar(1300).then(() => g.remove());
  };

  const pula = (q: Quem) => {
    const g = svg.querySelector('.' + q);
    if (!g) return;
    mover(g, 0, -14, 250, 1.06);
    void esperar(280).then(() => mover(g, 0, 0, 350));
  };

  const contente = (q: Quem, c: Cuidado) => {
    if (terminou) return;
    pula(q);
    const b = BICHO[q];
    tela.comemorar(b.x, b.y - b.s * 1.6);
    for (let i = 0; i < 3; i++) void esperar(i * 140).then(() => coracaoSobe(b.cx - 20 + i * 20, b.cy - b.ry + 10));
    marcar(c);
    mudar((x) => {
      x.bichos.carinho += 1;
    });
    if (pendentes.size === 0) {
      terminou = true;
      luzes.innerHTML = '';
      pararDemo();
      anunciar('bichos');
      /* os dois pulam juntos, com muitos corações, antes da despedida */
      void esperar(700).then(() => {
        for (const q2 of ['gato', 'coelho'] as const) {
          pula(q2);
          const b2 = BICHO[q2];
          if (svg.querySelector('.' + q2)) for (let i = 0; i < 4; i++) void esperar(i * 180).then(() => coracaoSobe(b2.cx - 24 + i * 16, b2.cy - b2.ry, 11));
        }
        sininho();
      });
      void esperar(3200).then(despedir);
    }
  };

  let despediu = false;
  const despedir = async () => {
    if (despediu) return;
    despediu = true;
    terminou = true;
    liraDesce();
    await esperar(500);
    /* ela já foi para a casa pela casinha: a sessão não a puxa de volta */
    if (tela.el.isConnected) void sessao.avancar();
  };

  /* ---------- água: tocar enche ---------- */
  tela.alvo('[data-alvo="agua"]', (_ev, el) => {
    const nivel = el.querySelector('.nivel') as SVGElement;
    if (nivel.style.opacity === '1') {
      toc(700, 0.1);
      return;
    }
    toc(600, 0.2);
    nivel.style.transition = 'opacity 800ms';
    nivel.style.opacity = '1';
    travar(900);
    void esperar(800).then(() => contente('gato', 'agua'));
  });

  /* ---------- comida: arrastar até o bicho; soltou passando de 40% do caminho, vai sozinha ---------- */
  svg.querySelectorAll('[data-arrasta]').forEach((g) => {
    const c = g.getAttribute('data-arrasta') as Cuidado;
    const para = g.getAttribute('data-para') as Quem;
    const b = BICHO[para];
    const destino = [b.x, b.y];
    const el = g as SVGGElement;
    /* a origem vem da cena, não do getBBox: a cena ainda não está na página
       aqui, o getBBox dava (0, 0) e a comida nunca chegava no bicho */
    const origem = c === 'prato' ? [195, 700] : [310, 690];
    let id = -1;
    let x0 = 0;
    let y0 = 0;
    let feito = false;
    el.addEventListener('pointerdown', (ev) => {
      if (feito || !reivindicarDedo(ev.pointerId)) return;
      id = ev.pointerId;
      [x0, y0] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      el.style.transition = 'none';
      try {
        el.setPointerCapture(ev.pointerId);
      } catch {
        /* sem captura, a janela libera o dedo */
      }
      /* o bicho que espera a comida acende: é para lá que ela vai */
      luzes.innerHTML = contornoLuz(b.cx, b.cy, b.rx - 4, b.ry - 4);
      mover(svg.querySelector('.' + para)!, 0, -6, 200);
    });
    el.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== id) return;
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      el.style.transform = `translate(${x - x0}px, ${y - y0}px)`;
    });
    const fim = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      soltarDedo(id);
      id = -1;
      mover(svg.querySelector('.' + para)!, 0, 0, 250);
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      const dx = x - x0;
      const dy = y - y0;
      const total = Math.hypot(destino[0]! - origem[0]!, destino[1]! - origem[1]!);
      const resta = Math.hypot(origem[0]! + dx - destino[0]!, origem[1]! + dy - destino[1]!);
      if (resta < total * 0.6) {
        feito = true;
        el.classList.remove('alvo');
        mover(el, destino[0]! - origem[0]!, destino[1]! - origem[1]! + 20, 500, 0.8);
        toc(300, 0.2);
        void esperar(600).then(() => {
          sininho();
          contente(para, c);
        });
      } else {
        mover(el, 0, 0, 400);
        pintarQuadro();
        /* não chegou: sem erro, a mãozinha mostra o caminho até o bicho */
        if (Math.hypot(dx, dy) > 8) void esperar(450).then(() => demonstrar(c, 4000));
      }
    };
    el.addEventListener('pointerup', fim);
    el.addEventListener('pointercancel', fim);
    el.classList.add('alvo');
  });

  /* ---------- carinho: passar o dedo devagar no pelo ---------- */
  /*
   * Devagar enche o coração do medidor, faz ronronar e solta coraçõezinhos
   * enquanto ela passa o dedo. Rápido não tira nada do que já encheu: o bicho
   * só inclina a cabeça, curioso, e espera. O dedo pode sair um pouco do
   * contorno sem perder o carinho.
   */
  const VELOCIDADE_DEVAGAR = 450; // unidades da cena por segundo
  const CAMINHO_DO_CARINHO = 130; // unidades da cena passadas devagar
  for (const q of ['gato', 'coelho'] as const) {
    const g = svg.querySelector('.' + q) as SVGGElement | null;
    if (!g) continue;
    const b = BICHO[q];
    const corpo = g.querySelector('.corpo') as SVGGElement;
    corpo.style.transformBox = 'fill-box';
    corpo.style.transformOrigin = '50% 100%';
    corpo.style.transition = 'transform 220ms';
    const medidor = svg.querySelector(`.medidor-${q}`) as SVGGElement;
    const enche = medidor.querySelector('.enche') as SVGGElement;
    const c: Cuidado = q === 'gato' ? 'carinho-gato' : 'carinho-coelho';
    let id = -1;
    let ultimo: [number, number, number] | null = null;
    let vel = 0;
    let progresso = 0;
    let proxCoracao = 0;
    let proxSom = 0;
    let proxOlhar = 0;
    let jaFez = false;

    g.addEventListener('pointerdown', (ev) => {
      if (!reivindicarDedo(ev.pointerId)) return;
      id = ev.pointerId;
      try {
        g.setPointerCapture(ev.pointerId);
      } catch {
        /* a janela libera o dedo */
      }
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      ultimo = [x, y, performance.now()];
      vel = 0;
      if (!jaFez) medidor.style.opacity = '1';
      corpo.style.transform = 'scale(1.03, 0.97)';
      toc(q === 'gato' ? 420 : 520, 0.08);
    });
    g.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== id || !ultimo) return;
      const agora = performance.now();
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      const dt = (agora - ultimo[2]) / 1000;
      const d = Math.hypot(x - ultimo[0], y - ultimo[1]);
      ultimo = [x, y, agora];
      if (dt <= 0) return;
      vel = vel * 0.6 + (d / dt) * 0.4;
      /* longe demais do bicho não conta, mas também não tira */
      const dentro = ((x - b.cx) / (b.rx * 1.4)) ** 2 + ((y - b.cy) / (b.ry * 1.4)) ** 2 <= 1;
      if (!dentro || d < 0.5) return;
      if (vel < VELOCIDADE_DEVAGAR) {
        progresso = Math.min(1, progresso + d / CAMINHO_DO_CARINHO);
        if (!jaFez) enche.style.transform = `scale(${progresso.toFixed(2)})`;
        if (agora > proxCoracao) {
          proxCoracao = agora + 320;
          coracaoSobe(x + (Math.random() - 0.5) * 20, y - 24, 7);
        }
        if (agora > proxSom) {
          proxSom = agora + 700;
          if (q === 'gato') ronronar(0.9);
          else toc(480 + Math.random() * 80, 0.1);
        }
        corpo.style.transform = `scale(1.04, 0.96) rotate(${x < b.cx ? -2 : 2}deg)`;
      } else if (agora > proxOlhar) {
        /* rápido: o bicho inclina a cabeça, curioso, e espera */
        proxOlhar = agora + 600;
        corpo.style.transform = 'rotate(-7deg)';
        void esperar(260).then(() => {
          if (id !== -1) corpo.style.transform = 'scale(1.03, 0.97)';
        });
      }
      if (progresso >= 1 && !jaFez) {
        jaFez = true;
        mover(medidor, 0, -8, 250, 1.3);
        void esperar(600).then(() => (medidor.style.opacity = '0'));
        if (q === 'gato') ronronar(1.6);
        contente(q, c);
      }
    });
    const fim = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      soltarDedo(id);
      id = -1;
      ultimo = null;
      corpo.style.transform = '';
      /* o que encheu fica: ela pode voltar e continuar */
      if (!jaFez)
        void esperar(1500).then(() => {
          if (id === -1 && !jaFez) medidor.style.opacity = progresso > 0 ? '0.6' : '0';
        });
    };
    g.addEventListener('pointerup', fim);
    g.addEventListener('pointercancel', fim);
    g.classList.add('alvo');
  }

  /* ---------- o tempo da tela ---------- */
  pintarQuadro();
  /* logo ao chegar, a mãozinha mostra o primeiro cuidado */
  let mexeu = false;
  svg.addEventListener('pointerdown', () => (mexeu = true), { once: true });
  void esperar(1200).then(() => {
    if (!mexeu) demonstrar(proximo(), 4500);
  });
  relogioDeAjuda(tela, (dt) => {
    vivo += dt;
    parada += dt;
    /* parada, a mãozinha mostra de novo o próximo cuidado */
    if (parada === 5 || parada === 14) demonstrar(proximo(), 5000);
    /* depois de um bom tempo parada, a despedida vem mesmo sem tudo */
    if (!terminou && vivo >= 75 && parada >= 20) void despedir();
  });
  return tela;
}
