import { SESSAO_COMPLETA } from '@/core/laco';
import { apagarTudo, CORES_DE_COMIDA, estado, estadoNovo, mudar, substituir, TAREFAS, type CorDeComida, type Tarefa } from '@/core/estado';
import { sessao } from '@/core/sessao';
import { h } from '@/core/util';
import { frases, Gravador, apagarGravacao, exportarGravacoes, falar, guardarGravacao, importarGravacoes, podeGravar, prepararVozes, temVoz, type Frase } from '@/audio/vozes';
import { audio } from '@/audio/engine';
import comidasJson from '@/data/comidas.json';
import letras from '@/data/letras.json';
import type { Tela } from '@/core/roteador';

declare const __VERSAO__: string;

const NUMEROS = ['dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DONO = { mae: 'Andrea', pai: 'Anderson', theo: 'Theo', qualquer: 'Qualquer um' };
const NOME_COR: Record<CorDeComida, string> = { vermelho: 'Vermelho', laranja: 'Laranja', amarelo: 'Amarelo', verde: 'Verde', roxo: 'Roxo', marrom: 'Branco ou marrom' };
const NOME_TAREFA: Record<Tarefa, string> = { cama: 'Arrumou a cama', dentes: 'Escovou os dentes', brinquedos: 'Guardou os brinquedos' };

/**
 * O cantinho dos pais: o único lugar com texto. Chega-se segurando a lua
 * por dois segundos e tocando no número certo, escrito por extenso.
 */
export function telaPais(): Tela {
  const el = document.createElement('div');
  el.className = 'tela';
  const painel = h('div', { class: 'pais' });
  el.appendChild(painel);

  const voltar = () => void sessao.irPara(sessao.atual === 'casa' || !sessao.partes.includes(sessao.atual) ? 'casa' : sessao.atual);

  /* a conta */
  const alvo = NUMEROS[Math.floor(Math.random() * NUMEROS.length)]!;
  const opcoes = [alvo, ...NUMEROS.filter((n) => n !== alvo).sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);
  painel.append(
    h('div', { class: 'fechar' }, h('button', { type: 'button', onClick: voltar }, 'Voltar para a casa')),
    h('h1', {}, 'Cantinho dos pais'),
    h('p', {}, `Para entrar, toque no número ${alvo}.`),
    h(
      'div',
      { class: 'conta' },
      ...opcoes.map((n) =>
        h('button', { type: 'button', onClick: () => (n === alvo ? abrir() : voltar()) }, n),
      ),
    ),
  );

  function abrir(): void {
    painel.innerHTML = '';
    const e = estado();
    painel.append(h('div', { class: 'fechar' }, h('button', { type: 'button', class: 'primario', onClick: voltar }, 'Voltar para a casa')), h('h1', {}, 'Cantinho dos pais'));

    /* hoje */
    painel.append(h('h2', {}, 'Hoje'));
    painel.append(
      h('p', {}, 'A Stella contou o que fez; confirmar aqui acende a lembrança com um brilho a mais e toca a voz de quem confirmou. Sem confirmação, a cena e o carinho acontecem igual.'),
    );
    const conf = e.pais.confirmacoes[e.hoje.dia] ?? [];
    for (const t of TAREFAS) {
      const ligado = conf.includes(t);
      const b = h('button', { type: 'button', class: ligado ? 'ligado' : '' }, ligado ? 'Confirmado' : 'Confirmar');
      b.addEventListener('click', () => {
        mudar((x) => {
          const lista = new Set(x.pais.confirmacoes[x.hoje.dia] ?? []);
          if (lista.has(t)) lista.delete(t);
          else lista.add(t);
          x.pais.confirmacoes[x.hoje.dia] = [...lista];
        });
        abrir();
      });
      painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, NOME_TAREFA[t], h('span', { class: 'sub' }, e.hoje.roda[t] ? 'Ela contou que fez' : 'Ela não contou hoje')), b));
    }
    const comidaNova = h('input', { type: 'text', placeholder: 'Comida nova que ela provou hoje', id: 'comida-nova' }) as HTMLInputElement;
    const bNova = h('button', { type: 'button' }, 'Virou girassol');
    bNova.addEventListener('click', () => {
      const nome = comidaNova.value.trim();
      if (!nome) return;
      mudar((x) => {
        x.pais.comidasNovas.push({ comida: nome, dia: x.hoje.dia });
        x.flores.push({ cor: 'amarelo', girassol: true, dia: x.hoje.dia });
      });
      comidaNova.value = '';
      abrir();
    });
    painel.append(h('div', { class: 'linha' }, comidaNova, bNova));
    if (e.pais.comidasNovas.length) painel.append(h('p', {}, 'Comidas novas: ' + e.pais.comidasNovas.map((c) => `${c.comida} (${c.dia})`).join(', ')));

    /* rotina */
    painel.append(h('h2', {}, 'Rotina'));
    const horas = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    const selHora = h('select', { id: 'hora-dormir' }, ...horas.map((x) => h('option', { value: x, selected: x === e.pais.horaDormir }, x))) as HTMLSelectElement;
    selHora.addEventListener('change', () => mudar((x) => void (x.pais.horaDormir = selHora.value)));
    painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, 'Hora de dormir', h('span', { class: 'sub' }, 'Meia hora antes a casa escurece e só resta a rotina da noite')), selHora));
    const limites = [10, 15, 20, 30];
    const selLim = h('select', { id: 'limite' }, ...limites.map((x) => h('option', { value: String(x), selected: x === e.pais.limiteMin }, `${x} minutos`))) as HTMLSelectElement;
    selLim.addEventListener('change', () => mudar((x) => void (x.pais.limiteMin = Number(selLim.value))));
    painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, 'Limite diário', h('span', { class: 'sub' }, 'Quando acaba, a família se despede. É uma despedida, não um bloqueio.')), selLim));

    /* prato */
    painel.append(h('h2', {}, 'O prato colorido'));
    painel.append(h('p', {}, 'Vale provar, não comer tudo. Nunca quantidade, nunca corpo, nunca "se comer, pode jogar". Se a mesa ficar tensa por causa do jogo, desligue o prato: o resto não depende dele.'));
    const bPrato = h('button', { type: 'button', class: e.pais.pratoLigado ? 'ligado' : '' }, e.pais.pratoLigado ? 'Ligado' : 'Desligado');
    bPrato.addEventListener('click', () => {
      mudar((x) => void (x.pais.pratoLigado = !x.pais.pratoLigado));
      abrir();
    });
    painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, 'Prato colorido'), bPrato));
    const comidas = comidasJson as Record<CorDeComida, { id: string; nome: string }[]>;
    for (const c of CORES_DE_COMIDA) {
      const sel = h('select', { id: 'comida-' + c }, ...comidas[c].map((o) => h('option', { value: o.id, selected: o.id === e.pais.comidas[c] }, o.nome))) as HTMLSelectElement;
      sel.addEventListener('change', () => mudar((x) => void (x.pais.comidas[c] = sel.value)));
      painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, NOME_COR[c]), sel));
    }

    /* a casa */
    painel.append(h('h2', {}, 'A casa'));
    const inteira = e.sessoes > SESSAO_COMPLETA;
    painel.append(
      h(
        'p',
        {},
        inteira
          ? `A casa está inteira aberta (sessão ${e.sessoes}). Cada dia uma brincadeira brilha, mas todas respondem.`
          : `Nas primeiras ${SESSAO_COMPLETA} sessões a casa abre aos poucos: só o que brilha responde. Esta é a sessão ${e.sessoes}. Se preferirem, abram tudo já.`,
      ),
    );
    if (!inteira) {
      const bCasa = h('button', { type: 'button' }, 'Abrir a casa inteira agora');
      bCasa.addEventListener('click', () => {
        mudar((x) => void (x.sessoes = SESSAO_COMPLETA + 1));
        abrir();
      });
      painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, 'Cômodos'), h('div', { class: 'acoes' }, bCasa)));
    }

    /* letras */
    painel.append(h('h2', {}, 'As letras'));
    const letraAtual = (letras as { id: string }[])[Math.min(e.letraIndice, letras.length - 1)]!.id;
    painel.append(h('p', {}, `Ordem: A, E, L, S, T (as do nome dela), depois O, M, U, I. Uma por semana por padrão. Letra da vez: ${letraAtual}. Já traçadas: ${e.letras.join(', ') || 'nenhuma'}.`));
    const bRitmo = h('button', { type: 'button', class: e.pais.ritmoLetras === 'semanal' ? 'ligado' : '' }, e.pais.ritmoLetras === 'semanal' ? 'Uma por semana' : 'Quando ela terminar');
    bRitmo.addEventListener('click', () => {
      mudar((x) => void (x.pais.ritmoLetras = x.pais.ritmoLetras === 'semanal' ? 'livre' : 'semanal'));
      abrir();
    });
    const bAdianta = h('button', { type: 'button' }, 'Adiantar');
    bAdianta.addEventListener('click', () => {
      mudar((x) => void (x.letraIndice = Math.min(x.letraIndice + 1, letras.length - 1)));
      abrir();
    });
    const bSegura = h('button', { type: 'button' }, 'Voltar uma');
    bSegura.addEventListener('click', () => {
      mudar((x) => void (x.letraIndice = Math.max(x.letraIndice - 1, 0)));
      abrir();
    });
    painel.append(h('div', { class: 'linha' }, h('span', { class: 'nome' }, 'Ritmo'), h('div', { class: 'acoes' }, bRitmo, bSegura, bAdianta)));

    /* vozes */
    painel.append(h('h2', {}, 'As vozes de vocês'));
    painel.append(
      h('p', {}, 'É o recurso mais forte do jogo. Cada frase tem um dono. As gravações ficam só neste aparelho. Enquanto não houver gravação, a cena acontece sem voz. Os sons das letras são os mais importantes para a leitura: diga o som, nunca o nome da letra.'),
    );
    if (!podeGravar()) painel.append(h('div', { class: 'aviso' }, 'Este navegador não deixa gravar aqui. Abra o jogo instalado no celular, ou importe um arquivo de gravações.'));
    const grade = h('div', { class: 'grade-vozes' });
    painel.append(grade);
    const grupos = [...new Set(frases.map((f) => f.grupo))];
    let gravador: Gravador | null = null;
    let gravandoId: string | null = null;
    const desenharVozes = () => {
      grade.innerHTML = '';
      for (const g of grupos) {
        grade.append(h('h2', {}, { chegada: 'Chegada', roda: 'Roda do dia', prato: 'Prato', sons: 'Sons das letras', letras: 'Caderno', bichos: 'Nomes dos bichos', despedida: 'Despedida', noite: 'Boa noite', palco: 'Palco' }[g] ?? g));
        for (const f of frases.filter((x) => x.grupo === g)) grade.append(linhaVoz(f));
      }
    };
    const linhaVoz = (f: Frase) => {
      const tem = temVoz(f.id);
      const bGravar = h('button', { type: 'button', class: gravandoId === f.id ? 'gravando' : '' }, gravandoId === f.id ? 'Parar' : tem ? 'Regravar' : 'Gravar');
      bGravar.addEventListener('click', async () => {
        if (gravandoId === f.id && gravador) {
          const blob = await gravador.parar();
          gravandoId = null;
          if (blob) await guardarGravacao(f.id, blob);
          desenharVozes();
          return;
        }
        if (gravandoId) return;
        gravador = new Gravador();
        if (await gravador.comecar()) {
          gravandoId = f.id;
          desenharVozes();
        }
      });
      const bOuvir = h('button', { type: 'button', disabled: !tem }, 'Ouvir');
      bOuvir.addEventListener('click', async () => {
        await audio.tentarDestravar();
        await falar(f.id);
      });
      const bApagar = h('button', { type: 'button', disabled: !tem }, 'Apagar');
      bApagar.addEventListener('click', async () => {
        await apagarGravacao(f.id);
        desenharVozes();
      });
      return h(
        'div',
        { class: 'voz' },
        h('div', {}, h('div', { class: 'frase' }, `“${f.texto}”`), h('div', { class: 'dono' }, `${DONO[f.dono]}${f.obrigatoria ? '' : ' · opcional'}${tem ? ' · gravada' : ''}`)),
        h('div', { class: 'acoes' }, bGravar, bOuvir),
        bApagar,
      );
    };
    void prepararVozes().then(desenharVozes);
    const bExportar = h('button', { type: 'button' }, 'Exportar gravações');
    bExportar.addEventListener('click', async () => {
      const blob = await exportarGravacoes();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'little-star-vozes.json';
      a.click();
    });
    const inputImportar = h('input', { type: 'file', accept: 'application/json', id: 'importar' }) as HTMLInputElement;
    inputImportar.addEventListener('change', async () => {
      const f = inputImportar.files?.[0];
      if (!f) return;
      const n = await importarGravacoes(f);
      alert(`${n} gravações importadas.`);
      desenharVozes();
    });
    painel.append(h('h2', {}, 'Guardar as vozes'), h('p', {}, 'O celular pode apagar as gravações se o jogo ficar semanas sem abrir. Exporte um arquivo de vez em quando e guarde; para trazer de volta, importe.'), h('div', { class: 'acoes' }, bExportar, inputImportar));

    /* resumo */
    painel.append(h('h2', {}, 'Como está indo'));
    const a1 = Object.values(e.registro.a1).reduce((a, b) => a + b, 0);
    const a2 = Object.values(e.registro.a2).reduce((a, b) => a + b, 0);
    const dificil = Object.entries(e.ajudaA2)
      .filter(([, n]) => n >= 3)
      .map(([k]) => k);
    painel.append(
      h(
        'div',
        { class: 'resumo' },
        h('div', {}, h('b', {}, String(e.sessoes)), 'dias de jogo'),
        h('div', {}, h('b', {}, `${Math.round(e.hoje.segundos / 60)} min`), 'de tela hoje'),
        h('div', {}, h('b', {}, String(e.letras.length)), 'letras traçadas'),
        h('div', {}, h('b', {}, String(e.flores.length)), 'flores no canteiro'),
        h('div', {}, h('b', {}, String(e.lembrancas.length)), 'lembranças no quarto'),
        h('div', {}, h('b', {}, String(e.estrelas)), 'noites na caminha'),
        h('div', {}, h('b', {}, String(e.pinhas.length)), 'pinhas'),
        h('div', {}, h('b', {}, String(e.aventuras)), 'aventuras'),
        h('div', {}, h('b', {}, String(a1)), 'vezes que a mãozinha ajudou'),
        h('div', {}, h('b', {}, String(a2)), 'vezes que o jogo fez junto'),
      ),
    );
    if (dificil.length) painel.append(h('div', { class: 'aviso' }, `Está difícil e o jogo tem feito junto: ${dificil.join(', ')}. É informação para vocês, não para ela.`));

    /* instalar */
    painel.append(h('h2', {}, 'Instalar e prender no jogo'));
    painel.append(
      h('p', {}, 'Passo 1: instale o jogo na tela inicial. No Samsung Galaxy, abra no Chrome, toque no menu (três pontos) e em Instalar aplicativo, ou Adicionar à tela inicial. No iPhone, Safari, Compartilhar e Adicionar à Tela de Início. Instalado, ele abre em tela cheia, em retrato, sem barra de endereço, e as gravações ficam mais seguras.'),
      h('p', {}, 'Passo 2: prenda a criança no app. No Samsung Galaxy, ligue Fixar janelas (Configurações, Segurança e privacidade, Outras configurações de segurança, Fixar janelas), abra o jogo, toque no botão de apps recentes e no ícone do app, e escolha Fixar este app. No iPhone, Acesso Guiado (Ajustes, Acessibilidade). O gesto de voltar do aparelho, dentro do jogo, volta para a casa.'),
      h('p', {}, 'Jogue junto, no colo, pelo menos nas primeiras semanas. Descreva, não avalie. Faça o som, não o nome da letra. Termine na despedida e faça o convite de verdade.'),
    );

    /* apagar */
    painel.append(h('h2', {}, 'Apagar tudo'));
    let confirmando = false;
    const bApagarTudo = h('button', { type: 'button', class: 'perigo' }, 'Apagar o progresso');
    bApagarTudo.addEventListener('click', () => {
      if (!confirmando) {
        confirmando = true;
        bApagarTudo.textContent = 'Tem certeza? Toque de novo para apagar';
        return;
      }
      apagarTudo();
      substituir(estadoNovo());
      sessao.comecar();
    });
    painel.append(h('p', {}, 'Apaga lembranças, flores, letras e pinhas. As gravações de voz ficam.'), bApagarTudo, h('p', { style: 'margin-top:24px' }, `Little Star ${__VERSAO__}. Piano: Salamander Grand Piano (Alexander Holm, CC BY 3.0).`));
  }

  return { el };
}
