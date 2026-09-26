import { mover, pedrinhaRola, pedrinhasSobem, telaSvg, trilha } from './comum';
import { estado, mudar, type Tarefa } from '@/core/estado';
import { etapa, tarefasAtivas } from '@/core/laco';
import { ganhar, PEDRINHAS, perder } from '@/core/pedrinhas';
import { sessao } from '@/core/sessao';
import { esperar } from '@/core/util';
import { familia } from '@/puppet/boneco';
import { arco, balancinho, contornoLuz, gato, nuvem, veu } from '@/puppet/objetos';
import { falar, temVoz } from '@/audio/vozes';
import { liraDesce, sininho } from '@/audio/synth';
import { travar } from '@/core/toque';
import type { Tela } from '@/core/roteador';

interface Objeto {
  id: Tarefa | 'noite' | 'noite_toda';
  pergunta: string;
  comemora: string;
  desenho: string;
  cena: (svg: SVGSVGElement) => void;
}

const SEGUNDOS_DE_ESPERA = 6;

/**
 * A roda do dia: a família no tapete, os objetos das tarefas no meio. Um de
 * cada vez acende, alguém pergunta, ela toca se fez. O objeto só aceita o
 * toque depois que a pergunta acabou de ser falada.
 */
export function telaRoda(): Tela {
  const e = estado();
  const manha = sessao.agora().getHours() < 12;

  const objetos: Objeto[] = [];
  if (manha && e.hoje.noite === null && etapa(e) > 1) {
    /* dormiu sozinha no quarto dela: a caminha com a lua */
    objetos.push({
      id: 'noite',
      pergunta: 'pergunta_noite',
      comemora: 'comemora_noite',
      desenho: `<g data-obj="noite"><rect x="150" y="548" width="90" height="30" rx="8" fill="#fbf8f1"/><rect x="150" y="558" width="90" height="20" rx="6" fill="#a58bc4" opacity="0.7"/><rect x="146" y="530" width="10" height="48" rx="3" fill="#c9a189"/><path d="M215 520a14 14 0 1 0 13 21a11 11 0 1 1-13-21z" fill="#ebd9a8"/></g>`,
      cena: () => {},
    });
  }
  if (manha && e.hoje.noiteToda === null && etapa(e) > 1) {
    /* dormiu a noite toda: da lua ao sol */
    objetos.push({
      id: 'noite_toda',
      pergunta: 'pergunta_noite_toda',
      comemora: 'comemora_noite_toda',
      desenho: `<g data-obj="noite_toda"><path d="M150 580q45 -60 90 0" fill="none" stroke="#c6a15b" stroke-width="2" stroke-dasharray="3 6"/><path d="M158 560a14 14 0 1 0 13 21a11 11 0 1 1-13-21z" fill="#ebd9a8"/><circle cx="232" cy="566" r="13" fill="#e8a24a" opacity="0.9"/><path d="M232 544v-8M232 596v-2M210 566h-8M254 566h8" stroke="#e8a24a" stroke-width="3" stroke-linecap="round"/></g>`,
      cena: () => {},
    });
  }
  const todas: Objeto[] = [
    {
      id: 'cama',
      pergunta: 'pergunta_cama',
      comemora: 'comemora_cama',
      desenho: `<g data-obj="cama"><rect x="150" y="540" width="90" height="34" rx="8" fill="#fbf8f1"/><rect class="lencol" x="150" y="552" width="90" height="22" rx="6" fill="#f2a9c4" opacity="0.85"/><rect x="146" y="520" width="10" height="54" rx="3" fill="#c9a189"/><rect x="234" y="532" width="10" height="42" rx="3" fill="#c9a189"/><ellipse cx="172" cy="546" rx="12" ry="6" fill="#fbf8f1" stroke="#ebcdc3"/></g>`,
      cena: (svg) => {
        const l = svg.querySelector('[data-obj="cama"] .lencol') as SVGElement | null;
        if (l) mover(l, 0, -4, 900, 1.06);
      },
    },
    {
      id: 'dentes',
      pergunta: 'pergunta_dentes',
      comemora: 'comemora_dentes',
      desenho: `<g data-obj="dentes"><rect x="150" y="548" width="90" height="16" rx="8" fill="#f2a9c4" transform="rotate(-18 195 556)"/><rect x="214" y="536" width="30" height="18" rx="4" fill="#fbf8f1" stroke="#c6a15b" transform="rotate(-18 229 545)"/><g class="espuma" opacity="0"><circle cx="232" cy="522" r="6" fill="#f6e3dc"/><circle cx="244" cy="516" r="5" fill="#f6e3dc"/><circle cx="222" cy="514" r="4" fill="#f6e3dc"/></g></g>`,
      cena: (svg) => {
        const l = svg.querySelector('[data-obj="dentes"] .espuma') as SVGElement | null;
        if (l) {
          l.style.transition = 'opacity 600ms';
          l.style.opacity = '1';
        }
      },
    },
    {
      id: 'brinquedos',
      pergunta: 'pergunta_brinquedos',
      comemora: 'comemora_brinquedos',
      desenho: `<g data-obj="brinquedos"><rect x="156" y="548" width="78" height="44" rx="6" fill="#c9a189"/><rect x="152" y="542" width="86" height="12" rx="4" fill="#b08a70"/><g class="brinquedo"><circle cx="150" cy="520" r="8" fill="#f2a9c4"/></g><g class="brinquedo"><rect x="236" y="510" width="14" height="14" fill="#7FA5B8"/></g><g class="brinquedo"><circle cx="200" cy="508" r="7" fill="#ebd9a8"/></g></g>`,
      cena: (svg) => {
        svg.querySelectorAll('[data-obj="brinquedos"] .brinquedo').forEach((b, i) => mover(b, (195 - [150, 243, 200][i]!) * 0.8, 40, 700, 0.8));
      },
    },
    {
      id: 'banho',
      pergunta: 'pergunta_banho',
      comemora: 'comemora_banho',
      desenho: `<g data-obj="banho"><ellipse cx="195" cy="566" rx="52" ry="20" fill="#fbf8f1" stroke="#c6a15b"/><rect x="143" y="548" width="104" height="18" rx="6" fill="#fbf8f1"/><path d="M150 548q0 -16 10 -16h6" fill="none" stroke="#c9a189" stroke-width="4"/><g class="bolhas" opacity="0"><circle cx="180" cy="530" r="7" fill="#dbe7ee" opacity="0.85"/><circle cx="200" cy="518" r="9" fill="#dbe7ee" opacity="0.85"/><circle cx="220" cy="532" r="6" fill="#dbe7ee" opacity="0.85"/></g><circle cx="230" cy="540" r="7" fill="#ebd9a8"/></g>`,
      cena: (svg) => {
        const b = svg.querySelector('[data-obj="banho"] .bolhas') as SVGElement | null;
        if (b) {
          b.style.transition = 'opacity 500ms';
          b.style.opacity = '1';
          mover(b, 0, -30, 1600);
        }
      },
    },
    {
      id: 'quarto',
      pergunta: 'pergunta_quarto',
      comemora: 'comemora_quarto',
      desenho: `<g data-obj="quarto"><rect x="140" y="566" width="110" height="10" rx="3" fill="#ebcdc3"/><rect x="160" y="530" width="26" height="8" rx="2" fill="#c9a189"/><g class="coisa"><rect x="146" y="546" width="20" height="14" rx="3" fill="#fbf8f1" stroke="#c6a15b"/></g><g class="coisa"><ellipse cx="228" cy="556" rx="14" ry="8" fill="#a58bc4"/></g><g class="coisa"><path d="M190 560l6 -10l6 10z" fill="#7FA5B8"/></g></g>`,
      cena: (svg) => {
        svg.querySelectorAll('[data-obj="quarto"] .coisa').forEach((c, i) => mover(c, [17, -55, -22][i]!, [-18, -26, -30][i]!, 700, 0.85));
      },
    },
    {
      id: 'gentil',
      pergunta: 'pergunta_gentil',
      comemora: 'comemora_gentil',
      desenho: `<g data-obj="gentil"><g class="ela">${familia.stella(178, 586, 56).svg}</g><g class="ele">${familia.theo(216, 586, 78, 'parado', { dir: -1 }).svg}</g></g>`,
      cena: (svg) => {
        const ela = svg.querySelector('[data-obj="gentil"] .ela');
        const ele = svg.querySelector('[data-obj="gentil"] .ele');
        if (ela) mover(ela, 10, 0, 700);
        if (ele) mover(ele, -8, 0, 700);
      },
    },
    {
      id: 'parquinho',
      pergunta: 'pergunta_parquinho',
      comemora: 'comemora_parquinho',
      desenho: `<g data-obj="parquinho">${balancinho(195, 590, 70, -6)}<g class="ela">${familia.stella(195, 566, 34, 'balanco').svg}</g></g>`,
      cena: (svg) => {
        const ela = svg.querySelector('[data-obj="parquinho"] .ela');
        if (ela) {
          mover(ela, -14, -6, 700);
          void esperar(720).then(() => ela && mover(ela, 12, -6, 700));
          void esperar(1440).then(() => ela && mover(ela, 0, 0, 700));
        }
      },
    },
  ];
  const ativas = tarefasAtivas(e);
  objetos.push(...todas.filter((o) => ativas.includes(o.id as Tarefa)));

  let s = `<rect width="390" height="780" fill="#c9dbb2"/>` + veu(0, 0, 390, 780, '#8fae6b', 6, 0.22);
  s += arco(120, 130, 150, 160, '#f3d9cf') + veu(120, 130, 150, 160, '#ebcdc3', 3, 0.3) + nuvem(200, 180, 12);
  s += `<line x1="0" y1="330" x2="390" y2="330" stroke="#c6a15b" stroke-width="1" opacity="0.5"/><rect x="0" y="330" width="390" height="450" fill="#fbf8f1" opacity="0.45"/>`;
  s += `<ellipse cx="195" cy="560" rx="170" ry="120" fill="#ebcdc3"/><ellipse cx="195" cy="560" rx="150" ry="104" fill="none" stroke="#c6a15b" stroke-width="1" opacity="0.5"/>`;
  s += `<g class="quem" data-quem="theo">${familia.theo(70, 505, 88, 'sentado').svg}</g>`;
  s += `<g class="quem" data-quem="mae">${familia.mae(300, 505, 110, 'sentado', { dir: -1 }).svg}</g>`;
  s += `<g class="quem" data-quem="pai">${familia.pai(322, 640, 116, 'sentado', { dir: -1 }).svg}</g>`;
  s += familia.stella(80, 660, 78, 'sentado').svg;
  if (e.bichos.gato) s += gato(150, 690, 12);
  s += `<g class="objetos"></g><g class="luz"></g>`;
  const tela = telaSvg(s);
  const svg = tela.svg;
  const camada = svg.querySelector('.objetos') as SVGGElement;
  const camadaLuz = svg.querySelector('.luz') as SVGGElement;
  /* uma conta por objeto da roda: o que ela fez enche de ouro; o que não aconteceu fica
     vazio, sem aviso, e a estrelinha passa para o próximo */
  const contas = trilha(tela, objetos.length);

  let indice = -1;
  let aceitando = false;
  let vivo = true;
  tela.aoDestruir(() => {
    vivo = false;
  });

  const proximo = async () => {
    indice += 1;
    camada.innerHTML = '';
    camadaLuz.innerHTML = '';
    tela.mao(null);
    aceitando = false;
    if (!vivo) return;
    if (indice >= objetos.length) {
      liraDesce();
      mudar((x) => {
        x.hoje.rodaFeita = true;
      });
      await esperar(900);
      if (vivo) void sessao.avancar();
      return;
    }
    const obj = objetos[indice]!;
    contas.agora(indice);
    camada.innerHTML = obj.desenho;
    const g = camada.firstElementChild as SVGGElement;
    g.classList.add('respira');
    camadaLuz.innerHTML = contornoLuz(195, 552, 66, 50);
    const dono = { cama: 'mae', dentes: 'pai', brinquedos: 'theo', noite: 'mae', noite_toda: 'pai', banho: 'pai', quarto: 'mae', gentil: 'theo', parquinho: 'theo' }[obj.id];
    svg.querySelectorAll('.quem').forEach((q) => ((q as SVGElement).style.opacity = q.getAttribute('data-quem') === dono ? '1' : '0.75'));
    /* a pergunta: só depois dela o objeto aceita o toque */
    if (temVoz(obj.pergunta)) await falar(obj.pergunta);
    else await esperar(1800);
    if (!vivo || indice !== objetos.indexOf(obj)) return;
    aceitando = true;
    const meuIndice = indice;
    let esperou = 0;
    const timer = window.setInterval(() => {
      if (!vivo || indice !== meuIndice) return window.clearInterval(timer);
      esperou += 1;
      if (esperou === 3) tela.mao([214, 574]);
      if (esperou >= SEGUNDOS_DE_ESPERA) {
        window.clearInterval(timer);
        if (aceitando && indice === meuIndice) {
          aceitando = false;
          (g as SVGElement).style.transition = 'opacity 900ms';
          (g as SVGElement).style.opacity = '0.2';
          /* não aconteceu: um combinado não cumprido faz uma pedrinha rolar, sem ninguém dizer nada */
          let rolou = 0;
          mudar((x) => {
            if (obj.id === 'noite') {
              x.hoje.noite = false;
              rolou = perder(x, PEDRINHAS.naoDormiuSozinha, 'nao_dormiu_sozinha');
            } else if (obj.id === 'noite_toda') x.hoje.noiteToda = false;
            else if (obj.id !== 'parquinho') rolou = perder(x, PEDRINHAS.tarefaNaoFeita, `nao_${obj.id}`);
            /* o parquinho não é combinado: não ir não tira nada */
          });
          if (rolou) pedrinhaRola(tela, 195, 560);
          void esperar(900).then(proximo);
        }
      }
    }, 1000);
    tela.aoDestruir(() => window.clearInterval(timer));

    tela.alvo(`[data-obj="${obj.id}"]`, () => {
      if (!aceitando) {
        (g as SVGElement).style.filter = 'brightness(1.08)';
        return;
      }
      aceitando = false;
      window.clearInterval(timer);
      travar(4200);
      tela.mao(null);
      sininho();
      contas.encher(indice);
      obj.cena(svg);
      let ganhas = 0;
      let medalha = 0;
      mudar((x) => {
        if (obj.id === 'noite') {
          x.hoje.noite = true;
          x.estrelas += 1;
          ganhas = PEDRINHAS.dormiuSozinha;
          medalha = ganhar(x, ganhas, 'dormiu_sozinha');
        } else if (obj.id === 'noite_toda') {
          x.hoje.noiteToda = true;
          ganhas = PEDRINHAS.noiteToda;
          medalha = ganhar(x, ganhas, 'noite_toda');
        } else {
          x.hoje.roda[obj.id] = true;
          x.lembrancas.push(`${obj.id}:${x.hoje.dia}`);
          ganhas = PEDRINHAS.tarefa;
          medalha = ganhar(x, ganhas, obj.id);
        }
      });
      void (async () => {
        await esperar(1200);
        tela.comemorar(195, 500);
        if (ganhas) pedrinhasSobem(tela, ganhas, 195, 520);
        if (medalha) sininho();
        if (temVoz(obj.comemora)) await falar(obj.comemora);
        else await esperar(1500);
        /* a lembrança voa para o quarto (para cima e para fora) */
        mover(g, 0, -420, 1100, 0.3);
        await esperar(1200);
        await proximo();
      })();
    }, true);
  };

  void esperar(800).then(proximo);
  return tela;
}
