import { convidarParaCasa, pedrinhasSobem, relogioDeAjuda, telaSvg, trilha } from './comum';
import { estado, mudar } from '@/core/estado';
import { ganhar, PEDRINHAS } from '@/core/pedrinhas';
import { horaParaMinutos } from '@/core/relogio';
import { sessao } from '@/core/sessao';
import { ir } from '@/core/roteador';
import { esperar, pontoNoSvg } from '@/core/util';
import { Ajuda } from '@/core/ajuda';
import { reivindicarDedo, soltarDedo, travar } from '@/core/toque';
import { familia } from '@/puppet/boneco';
import { arco, centelha, veu } from '@/puppet/objetos';
import { tocarFundo } from '@/audio/musica';
import { falar, temVoz } from '@/audio/vozes';
import { falarPalavra } from '@/audio/fala';
import { lira, sininho, toc } from '@/audio/synth';
import type { Tela } from '@/core/roteador';

export const HORAS = ['uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'];
const CX = 195;
const CY = 330;
const R = 140;

/** A hora (1 a 12, com fração) a partir de um ângulo em graus medido a partir das doze, no sentido do relógio. */
export function horaDoAngulo(graus: number): number {
  const h = (((graus % 360) + 360) % 360) / 30;
  return h === 0 ? 12 : h;
}

/** O ângulo (graus a partir das doze) de uma hora. */
export function anguloDaHora(hora: number): number {
  return (hora % 12) * 30;
}

/** A hora do ponteiro está perto o bastante da pedida? Meia hora de tolerância, em volta do relógio. */
export function acertou(ponteiro: number, alvo: number, tolerancia = 0.5): boolean {
  const d = Math.abs(((ponteiro - alvo) % 12) + 12) % 12;
  return Math.min(d, 12 - d) <= tolerancia;
}

/** "são três horas", "é uma hora". */
export function fraseDaHora(hora: number): string {
  const h = ((Math.round(hora) - 1 + 12) % 12) + 1;
  return h === 1 ? 'é uma hora' : `são ${HORAS[h - 1]} horas`;
}

/**
 * A hora de verdade, dita como a gente diz para uma criança: "são seis horas",
 * "passou das seis", "são seis e meia", "são quase sete horas". Nunca arredonda
 * a hora para cima como se fosse cheia.
 */
export function fraseDaHoraReal(hora: number, minutos: number): string {
  const h = ((Math.floor(hora) - 1 + 12) % 12) + 1;
  if (minutos < 5) return fraseDaHora(h);
  if (minutos < 25) return h === 1 ? 'passou da uma' : `passou das ${HORAS[h - 1]}`;
  if (minutos <= 35) return h === 1 ? 'é uma e meia' : `são ${HORAS[h - 1]} e meia`;
  const prox = (h % 12) + 1;
  return prox === 1 ? 'é quase uma hora' : `são quase ${HORAS[prox - 1]} horas`;
}

/**
 * O relógio da sala, grande: ela gira o ponteiro das horas (o curto) e o
 * relógio diz a hora; o dos minutos (o comprido) fica nas doze. Ao chegar, o
 * relógio mostra a hora de verdade com os dois ponteiros e diz como está
 * ("passou das seis"). O céu da janelinha muda com a hora. Tocar no Theo:
 * ele pede uma hora ("mostra as sete horas"); ela gira até lá e ganha uma
 * pedrinha. Ajuda: o número pedido acende; depois, o ponteiro anda sozinho.
 */
export function telaRelogio(): Tela {
  const e = estado();
  const agora = sessao.agora();
  const minutosReais = agora.getMinutes();
  const horaCheiaReal = ((agora.getHours() + 11) % 12) + 1;
  const horaReal = horaCheiaReal + minutosReais / 60;
  const dormir = Math.round(horaParaMinutos(e.pais.horaDormir) / 60) % 12 || 12;

  let s = `<rect width="390" height="780" fill="#fbf8f1"/>` + veu(0, 0, 390, 780, '#f6e3dc', 5, 0.3);
  /* a janelinha com o céu da hora */
  s += `<g class="janela">${arco(150, 30, 90, 90, '#dbe7ee')}<g class="ceu"></g></g>`;
  /* o relógio */
  s += `<circle cx="${CX}" cy="${CY}" r="${R + 14}" fill="#c9a189"/><circle cx="${CX}" cy="${CY}" r="${R}" fill="#fbf8f1" stroke="#c6a15b" stroke-width="2"/>`;
  for (let h = 1; h <= 12; h++) {
    const a = ((h * 30 - 90) * Math.PI) / 180;
    const x = CX + Math.cos(a) * R * 0.8;
    const y = CY + Math.sin(a) * R * 0.8;
    s += `<text class="numero" data-hora="${h}" x="${x.toFixed(1)}" y="${(y + 10).toFixed(1)}" text-anchor="middle" font-family="Jost, sans-serif" font-size="30" font-weight="500" fill="#4f6b3a">${h}</text>`;
    const ax = CX + Math.cos(a) * R * 0.94;
    const ay = CY + Math.sin(a) * R * 0.94;
    s += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="3" fill="#c6a15b"/>`;
  }
  /* a hora de dormir tem uma lua; as sete da manhã, um sol */
  const lua = ((dormir * 30 - 90) * Math.PI) / 180;
  s += `<path d="M${CX + Math.cos(lua) * R * 0.6} ${CY + Math.sin(lua) * R * 0.6 - 8}a8 8 0 1 0 7 12a6 6 0 1 1-7-12z" fill="#ebd9a8"/>`;
  const sol = ((7 * 30 - 90) * Math.PI) / 180;
  s += `<circle cx="${CX + Math.cos(sol) * R * 0.6}" cy="${CY + Math.sin(sol) * R * 0.6}" r="8" fill="#ebd9a8"/>`;
  /*
   * Como num relógio de verdade: o ponteiro das horas é o curto e grosso (é
   * ele que ela gira); o dos minutos é o comprido e fino, bem visível, e fica
   * nas doze durante a brincadeira das horas cheias.
   */
  s += `<g class="ponteiro"><line x1="${CX}" y1="${CY + 12}" x2="${CX}" y2="${CY - R * 0.42}" stroke="#6e1a27" stroke-width="13" stroke-linecap="round"/><circle cx="${CX}" cy="${CY - R * 0.42}" r="11" fill="#f2a9c4"/></g>`;
  s += `<g class="minutos"><line x1="${CX}" y1="${CY + 12}" x2="${CX}" y2="${CY - R * 0.68}" stroke="#c6a15b" stroke-width="6" stroke-linecap="round"/></g>`;
  s += `<circle cx="${CX}" cy="${CY}" r="10" fill="#6e1a27"/>`;
  s += `<g class="luz"></g>`;
  /* o Theo, que pergunta as horas */
  s += `<g data-alvo="theo"><circle cx="90" cy="640" r="60" fill="transparent"/>${familia.theo(90, 740, 150, 'aponta').svg}</g>`;
  s += `<g class="balao" opacity="0">${arco(160, 540, 70, 76, '#fbf8f1')}<text class="pedida" x="195" y="595" text-anchor="middle" font-family="Jost, sans-serif" font-size="40" font-weight="500" fill="#f2a9c4"></text></g>`;
  s += `<g class="stella">${familia.stella(310, 740, 100, 'acena').svg}</g>`;
  const tela = telaSvg(s, { casinha: () => void ir('casa'), lua: true });
  const svg = tela.svg;
  tocarFundo('preludio_bach');
  const ponteiro = svg.querySelector('.ponteiro') as SVGGElement;
  const ponteiroMinutos = svg.querySelector('.minutos') as SVGGElement;
  const ceu = svg.querySelector('.ceu') as SVGGElement;
  const luz = svg.querySelector('.luz') as SVGGElement;
  const balao = svg.querySelector('.balao') as SVGGElement;
  const pedidaEl = svg.querySelector('.pedida') as SVGTextElement;
  /* três pedidas do Theo por visita, em contas entre a janelinha e o relógio; depois, a casinha convida */
  const PEDIDAS = 3;
  const contas = trilha(tela, PEDIDAS, 148);
  contas.agora(0);
  let convidou = false;

  let hora = horaReal;
  /* o ponteiro dos minutos só marca minutos de verdade na chegada; na brincadeira fica nas doze */
  let minutos = minutosReais;
  let pedida: number | null = null;
  let dedo = -1;
  let ocupado = false;
  const ajuda = new Ajuda((n) => {
    luz.innerHTML = '';
    /* sem pedida, a mãozinha mostra o Theo (até a casinha convidar para ir embora) */
    if (pedida === null) return tela.mao(n >= 1 && !convidou ? [120, 660] : null);
    const num = svg.querySelector(`[data-hora="${pedida}"]`) as SVGTextElement | null;
    if (n >= 1 && num) {
      num.setAttribute('fill', '#f2a9c4');
      num.classList.add('respira');
      luz.innerHTML = `<g class="respira">${centelha(Number(num.getAttribute('x')), Number(num.getAttribute('y')) - 40, 18, '#c6a15b')}</g>`;
    }
  });
  relogioDeAjuda(tela, (dt) => {
    if (dedo >= 0) return;
    ajuda.tick(dt);
    /* A2: o ponteiro anda sozinho, uma hora por segundo, até a pedida */
    if (ajuda.nivel >= 2 && pedida !== null && !ocupado && !acertou(hora, pedida, 0.2)) {
      hora = Math.round(hora) + 1;
      if (hora > 12) hora -= 12;
      desenhar();
      toc(500, 0.1);
      if (acertou(hora, pedida, 0.2)) void conferir();
    }
  });

  const desenhar = () => {
    ponteiro.style.transformBox = 'view-box';
    ponteiro.style.transformOrigin = `${CX}px ${CY}px`;
    ponteiro.style.transform = `rotate(${anguloDaHora(hora)}deg)`;
    ponteiroMinutos.style.transformBox = 'view-box';
    ponteiroMinutos.style.transformOrigin = `${CX}px ${CY}px`;
    ponteiroMinutos.style.transform = `rotate(${minutos * 6}deg)`;
    /* o céu: manhã clara, tarde rosa, noite azul, pela hora do ponteiro (de tarde/noite se for depois do meio-dia real) */
    const h = Math.round(hora) % 12;
    const tarde = agora.getHours() >= 12;
    const noite = tarde ? h >= 7 && h < 12 : h < 6 && h !== 0;
    const fim = tarde && h >= 4 && h < 7;
    const cor = noite ? '#232a55' : fim ? '#f3d9cf' : '#dbe7ee';
    ceu.innerHTML = `<path d="M150 120V75a45 45 0 0 1 90 0v45z" fill="${cor}"/>${noite ? centelha(180, 80, 8, '#ebd9a8') + centelha(210, 95, 6, '#ebd9a8') : `<circle cx="215" cy="70" r="12" fill="#ebd9a8" opacity="0.9"/>`}`;
  };
  desenhar();

  const dizer = async (h: number) => {
    const hh = ((Math.round(h) - 1 + 12) % 12) + 1;
    if (temVoz(`hora_${hh}`)) await falar(`hora_${hh}`);
    else await falarPalavra(fraseDaHora(hh), 0.8);
  };

  const conferir = async () => {
    if (pedida === null || ocupado) return;
    ocupado = true;
    if (acertou(hora, pedida)) {
      hora = pedida;
      desenhar();
      sininho();
      tela.comemorar(CX, CY - R - 20);
      travar(2000);
      const meta = pedida;
      pedida = null;
      luz.innerHTML = '';
      svg.querySelectorAll('.numero').forEach((n) => {
        n.setAttribute('fill', '#4f6b3a');
        n.classList.remove('respira');
      });
      balao.style.opacity = '0';
      let medalha = 0;
      mudar((x) => {
        x.hoje.relogio += 1;
        medalha = ganhar(x, PEDRINHAS.relogio, 'relogio');
      });
      pedrinhasSobem(tela, PEDRINHAS.relogio, CX, CY + R + 30);
      if (medalha) sininho();
      const feitas = contas.cheias;
      contas.encher(feitas);
      if (feitas + 1 < PEDIDAS) contas.agora(feitas + 1);
      await dizer(meta);
      ajuda.reset();
      if (contas.cheias >= PEDIDAS && !convidou) {
        convidou = true;
        convidarParaCasa(tela);
      }
    } else {
      /* ainda não: o Theo repete a hora, sem "errado" */
      ajuda.tentativa();
      toc(400, 0.12);
      await dizer(pedida);
    }
    ocupado = false;
  };

  /* girar o ponteiro com o dedo, em qualquer lugar do mostrador */
  const angulo = (ev: PointerEvent) => {
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    return (Math.atan2(y - CY, x - CX) * 180) / Math.PI + 90;
  };
  svg.addEventListener('pointerdown', (ev) => {
    const [x, y] = pontoNoSvg(svg, ev.clientX, ev.clientY);
    if (Math.hypot(x - CX, y - CY) > R + 20) return;
    if (!reivindicarDedo(ev.pointerId)) return;
    dedo = ev.pointerId;
    ajuda.tocou();
    if (pedida === null) tela.mao(null);
    minutos = 0;
    hora = horaDoAngulo(angulo(ev));
    desenhar();
    try {
      svg.setPointerCapture(ev.pointerId);
    } catch {
      /* a janela libera o dedo */
    }
  });
  svg.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== dedo) return;
    const nova = horaDoAngulo(angulo(ev));
    if (Math.round(nova) !== Math.round(hora)) toc(480 + Math.round(nova) * 20, 0.06);
    hora = nova;
    desenhar();
  });
  const solta = (ev: PointerEvent) => {
    if (ev.pointerId !== dedo) return;
    soltarDedo(dedo);
    dedo = -1;
    /* o ponteiro encaixa na hora cheia mais perto e o relógio diz a hora */
    hora = ((Math.round(hora) - 1 + 12) % 12) + 1;
    desenhar();
    lira(62 + (Math.round(hora) % 7) * 2, undefined, 0.25);
    if (pedida !== null) void conferir();
    else void dizer(hora);
  };
  svg.addEventListener('pointerup', solta);
  svg.addEventListener('pointercancel', solta);

  /* o Theo pede uma hora */
  tela.alvo('[data-alvo="theo"]', async () => {
    if (ocupado) return;
    ocupado = true;
    travar(800);
    tela.mao(null);
    const opcoes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => h !== Math.round(hora));
    pedida = opcoes[Math.floor(Math.random() * opcoes.length)]!;
    pedidaEl.textContent = String(pedida);
    minutos = 0;
    desenhar();
    balao.style.transition = 'opacity 400ms';
    balao.style.opacity = '1';
    ajuda.reset();
    if (temVoz('relogio_pergunta')) await falar('relogio_pergunta');
    else await falarPalavra(`mostra ${pedida === 1 ? 'uma hora' : HORAS[pedida - 1] + ' horas'}`, 0.8);
    ocupado = false;
  });

  /* ao entrar, o relógio mostra a hora de verdade, com os dois ponteiros, e diz como está */
  void esperar(900).then(async () => {
    if (temVoz('relogio_agora')) await falar('relogio_agora');
    if (minutosReais < 5 && temVoz(`hora_${horaCheiaReal}`)) await falar(`hora_${horaCheiaReal}`);
    else await falarPalavra(fraseDaHoraReal(horaCheiaReal, minutosReais), 0.8);
  });
  return tela;
}
