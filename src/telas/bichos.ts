import { mover, telaSvg } from './comum';
import { estado, mudar } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { anunciar } from '@/core/narracao';
import { esperar, pontoNoSvg } from '@/core/util';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { coelho, gato, veu } from '@/puppet/objetos';
import { figura } from '@/puppet/figuras';
import { liraDesce, ronronar, sininho, toc } from '@/audio/synth';
import { tocarFundo } from '@/audio/musica';
import type { Tela } from '@/core/roteador';

/**
 * Os bichos: no fim de toda sessão, o gatinho e o coelhinho no tapete.
 * Água (tocar), comida (arrastar), carinho (arrastar devagar no pelo).
 * Nenhum bicho fica triste se ela não vier: só fica contente quando ela vem.
 */
export function telaBichos(): Tela {
  const e = estado();
  const temCoelho = Boolean(e.bichos.coelho);
  let s = `<rect width="390" height="780" fill="#c9dbb2"/>` + veu(0, 0, 390, 780, '#8fae6b', 6, 0.22);
  s += `<rect x="0" y="300" width="390" height="480" fill="#fbf8f1" opacity="0.4"/>`;
  s += `<ellipse cx="195" cy="560" rx="175" ry="130" fill="#ebcdc3"/>`;
  s += `<g class="gato">${gato(130, 600, 34)}</g>`;
  if (temCoelho) s += `<g class="coelho">${coelho(270, 600, 40)}</g>`;
  /* potinho de água */
  s += `<g data-alvo="agua"><ellipse cx="80" cy="690" rx="30" ry="12" fill="#fbf8f1" stroke="#c6a15b" stroke-width="1.5"/><ellipse class="nivel" cx="80" cy="690" rx="22" ry="7" fill="#9fc3cf" opacity="0"/></g>`;
  /* pratinho do gato e cenoura do coelho, para arrastar */
  s += `<g data-arrasta="prato" data-para="gato"><ellipse cx="195" cy="700" rx="26" ry="10" fill="#f6f0e4" stroke="#c6a15b"/><ellipse cx="195" cy="696" rx="16" ry="6" fill="#c48f5a"/></g>`;
  if (temCoelho) s += `<g data-arrasta="cenoura" data-para="coelho">${figura('cenoura', 310, 690, 60)}</g>`;
  const tela = telaSvg(s, { casinha: () => void terminar(), lua: true });
  const svg = tela.svg;
  tocarFundo('gymnopedie');

  let feitos = 0;
  let terminou = false;
  const terminar = async () => {
    if (terminou) return;
    terminou = true;
    liraDesce();
    await esperar(500);
    void sessao.avancar();
  };
  const contente = (quem: 'gato' | 'coelho') => {
    const g = svg.querySelector('.' + quem);
    if (!g) return;
    mover(g, 0, -10, 250, 1.05);
    void esperar(280).then(() => mover(g, 0, 0, 350));
    tela.comemorar(quem === 'gato' ? 130 : 270, 520);
    feitos += 1;
    mudar((x) => {
      x.bichos.carinho += 1;
    });
    if (feitos >= (temCoelho ? 4 : 3)) {
      anunciar('bichos');
      void esperar(2500).then(terminar);
    }
  };

  /* água: tocar enche */
  tela.alvo('[data-alvo="agua"]', (_ev, el) => {
    const nivel = el.querySelector('.nivel') as SVGElement;
    if (nivel.style.opacity === '1') return;
    toc(600, 0.2);
    nivel.style.transition = 'opacity 800ms';
    nivel.style.opacity = '1';
    travar(900);
    void esperar(800).then(() => contente('gato'));
  });

  /* comida: arrastar até o bicho; soltou passando de 40% do caminho, vai sozinha */
  svg.querySelectorAll('[data-arrasta]').forEach((g) => {
    const para = g.getAttribute('data-para') as 'gato' | 'coelho';
    const destino = para === 'gato' ? [130, 600] : [270, 600];
    const el = g as SVGGElement;
    const caixa = el.getBBox();
    const origem = [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2];
    let id = -1;
    let x0 = 0;
    let y0 = 0;
    let feito = false;
    el.addEventListener('pointerdown', (ev) => {
      if (feito || !reivindicarDedo(ev.pointerId)) return;
      id = ev.pointerId;
      [x0, y0] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      el.style.transition = 'none';
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
      const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
      const dx = x - x0;
      const dy = y - y0;
      const total = Math.hypot(destino[0]! - origem[0]!, destino[1]! - origem[1]!);
      const resta = Math.hypot(origem[0]! + dx - destino[0]!, origem[1]! + dy - destino[1]!);
      if (resta < total * 0.6) {
        feito = true;
        mover(el, destino[0]! - origem[0]!, destino[1]! - origem[1]! + 20, 500, 0.8);
        toc(300, 0.2);
        void esperar(600).then(() => {
          sininho();
          contente(para);
        });
      } else mover(el, 0, 0, 400);
    };
    el.addEventListener('pointerup', fim);
    el.addEventListener('pointercancel', fim);
    el.classList.add('alvo');
  });

  /* carinho: arrastar devagar no pelo faz ronronar; rápido, o bicho olha e espera */
  for (const quem of ['gato', 'coelho'] as const) {
    const g = svg.querySelector('.' + quem) as SVGGElement | null;
    if (!g) continue;
    let id = -1;
    let ultimo: [number, number, number] | null = null;
    let lento = 0;
    let jaFez = false;
    g.addEventListener('pointerdown', (ev) => {
      if (!reivindicarDedo(ev.pointerId)) return;
      id = ev.pointerId;
      ultimo = [ev.clientX, ev.clientY, performance.now()];
      lento = 0;
    });
    g.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== id || !ultimo) return;
      const dt = (performance.now() - ultimo[2]) / 1000;
      const d = Math.hypot(ev.clientX - ultimo[0], ev.clientY - ultimo[1]);
      ultimo = [ev.clientX, ev.clientY, performance.now()];
      if (dt <= 0) return;
      const v = d / dt;
      if (v < 260) lento += dt;
      else {
        /* rápido: o bicho olha para ela, curioso, e espera */
        lento = 0;
        mover(g, 0, -3, 150);
        void esperar(160).then(() => mover(g, 0, 0, 200));
      }
      if (lento > 0.9 && !jaFez) {
        jaFez = true;
        if (quem === 'gato') ronronar(1.6);
        else toc(500, 0.15);
        contente(quem);
      }
    });
    const fim = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      soltarDedo(id);
      id = -1;
      ultimo = null;
    };
    g.addEventListener('pointerup', fim);
    g.addEventListener('pointercancel', fim);
    g.classList.add('alvo');
  }

  /* depois de um tempo, mesmo sem tudo, a despedida vem */
  const fimAuto = window.setTimeout(() => void terminar(), 75000);
  tela.aoDestruir(() => window.clearTimeout(fimAuto));
  return tela;
}
