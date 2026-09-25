import { chaveDoDia } from './relogio';

export const VERSAO_DO_SAVE = 1;
const CHAVE = 'little-star.save';

export type Tarefa = 'cama' | 'dentes' | 'brinquedos' | 'banho' | 'quarto' | 'gentil';
export type CorDeComida = 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'roxo' | 'marrom';
export const CORES_DE_COMIDA: CorDeComida[] = ['vermelho', 'laranja', 'amarelo', 'verde', 'roxo', 'marrom'];
/** todas as tarefas da roda; os pais ligam e desligam cada uma no cantinho */
export const TAREFAS: Tarefa[] = ['cama', 'dentes', 'brinquedos', 'banho', 'quarto', 'gentil'];
export type Semente = 'cenoura' | 'tomate' | 'milho' | 'alface';
export type Quem = 'mae' | 'pai' | 'theo';

/** um canteiro da horta: o que foi plantado, quando, e os dias em que foi regado */
export interface Canteiro {
  semente: Semente;
  plantado: string;
  regas: string[];
}
export interface Bilhete {
  para: Quem;
  letras: string;
  dia: string;
}
/** o figurino de uma boneca: as cores que ela escolheu */
export interface Figurino {
  roupa: string;
  cabelo: string;
  gorro: string;
}

export interface Hoje {
  dia: string;
  /** o que ela contou na roda */
  roda: Partial<Record<Tarefa, boolean>>;
  /** dormiu sozinha no quarto dela (resposta dela de manhã) */
  noite: boolean | null;
  /** dormiu a noite toda (resposta dela de manhã) */
  noiteToda: boolean | null;
  /** horas acertadas no relógio */
  relogio: number;
  rodaFeita: boolean;
  pratoFeito: boolean;
  somFeito: boolean;
  despedidaFeita: boolean;
  /** cores provadas hoje */
  prato: CorDeComida[];
  /** passos da rotina da noite tocados */
  rotinaNoite: string[];
  /** segundos jogados hoje */
  segundos: number;
  /** quantas vezes abriu o jogo hoje */
  aberturas: number;
}

export interface Flor {
  cor: CorDeComida;
  girassol: boolean;
  dia: string;
}

export interface PinhaNaMesa {
  tipo: number;
  x: number;
  y: number;
}

export interface Pais {
  horaDormir: string;
  limiteMin: number;
  pratoLigado: boolean;
  /** a comida que aparece em cada cor */
  comidas: Record<CorDeComida, string>;
  /** dia -> tarefas confirmadas por um adulto */
  confirmacoes: Record<string, Tarefa[]>;
  /** comidas novas marcadas, com o dia */
  comidasNovas: { comida: string; dia: string }[];
  /** semanal: uma letra por semana; livre: avança quando ela termina */
  ritmoLetras: 'semanal' | 'livre';
  instalacaoVista: boolean;
  /** quais tarefas a roda pergunta */
  tarefas: Record<Tarefa, boolean>;
  /** auto: entra sozinho quando os primeiros sons estão firmes (três letras traçadas) */
  espanhol: 'auto' | 'ligado' | 'desligado';
  /** as festas das estações mudam a casa */
  festas: boolean;
  /** o pote de pedrinhas existe */
  pedrinhas: boolean;
  /** um combinado não cumprido faz uma pedrinha rolar para fora */
  perdePedrinhas: boolean;
}

export interface Estado {
  versao: number;
  criadoEm: number;
  ultimaSessao: number;
  /** dias de jogo (dias diferentes em que abriu) */
  sessoes: number;
  hoje: Hoje;
  lembrancas: string[];
  flores: Flor[];
  estrelas: number;
  letras: string[];
  letraIndice: number;
  semanaDaLetra: string;
  pinhas: PinhaNaMesa[];
  cesta: number;
  bonecas: number;
  aventuras: number;
  bichos: { gato: string | null; coelho: string | null; carinho: number };
  /** atividade -> sessões seguidas que precisaram de A2 */
  ajudaA2: Record<string, number>;
  registro: { partes: Record<string, number>; a1: Record<string, number>; a2: Record<string, number>; semResposta: number };
  pais: Pais;
  /** a horta do quintal: quatro canteiros */
  horta: (Canteiro | null)[];
  /** o que ela colheu e ainda não virou comidinha */
  colheita: Semente[];
  /** comidinhas feitas com a mãe (pratinhos na mesa das bonecas) */
  comidinhas: number;
  bilhetes: Bilhete[];
  /** figurino por boneca (índice na estante) */
  figurinos: Record<string, Figurino>;
  /** a boneca que vai junto nas aventuras; -1 é nenhuma */
  companheira: number;
  /** partes do coreto do lago já acesas (até 6) */
  coreto: number;
  /** aventuras terminadas por tipo */
  aventurasPor: Record<string, number>;
  /** as pedrinhas no pote (até encher) e as medalhas na parede */
  pedrinhas: number;
  medalhas: number;
  pedrinhasHistorico: { dia: string; delta: number; motivo: string }[];
}

export function hojeVazio(dia: string): Hoje {
  return {
    dia,
    roda: {},
    noite: null,
    noiteToda: null,
    relogio: 0,
    rodaFeita: false,
    pratoFeito: false,
    somFeito: false,
    despedidaFeita: false,
    prato: [],
    rotinaNoite: [],
    segundos: 0,
    aberturas: 0,
  };
}

export function estadoNovo(agora = new Date()): Estado {
  return {
    versao: VERSAO_DO_SAVE,
    criadoEm: agora.getTime(),
    ultimaSessao: 0,
    sessoes: 0,
    hoje: hojeVazio(chaveDoDia(agora)),
    lembrancas: [],
    flores: [],
    estrelas: 0,
    letras: [],
    letraIndice: 0,
    semanaDaLetra: '',
    pinhas: [],
    cesta: 0,
    bonecas: 1,
    aventuras: 0,
    bichos: { gato: null, coelho: null, carinho: 0 },
    ajudaA2: {},
    registro: { partes: {}, a1: {}, a2: {}, semResposta: 0 },
    horta: [null, null, null, null],
    colheita: [],
    comidinhas: 0,
    bilhetes: [],
    figurinos: {},
    companheira: -1,
    coreto: 0,
    aventurasPor: {},
    pedrinhas: 0,
    medalhas: 0,
    pedrinhasHistorico: [],
    pais: {
      horaDormir: '20:00',
      limiteMin: 15,
      pratoLigado: true,
      comidas: { vermelho: 'tomate', laranja: 'cenoura', amarelo: 'banana', verde: 'brocolis', roxo: 'uva', marrom: 'pao' },
      confirmacoes: {},
      comidasNovas: [],
      ritmoLetras: 'semanal',
      instalacaoVista: false,
      tarefas: { cama: true, dentes: true, brinquedos: true, banho: true, quarto: false, gentil: false },
      espanhol: 'auto',
      festas: true,
      pedrinhas: true,
      perdePedrinhas: true,
    },
  };
}

/**
 * Abre o dia: se a data mudou desde a última sessão, o "hoje" zera e conta
 * mais um dia de jogo. Nada do que cresceu se perde: lembranças, flores,
 * letras e pinhas ficam. Puro; devolve um estado novo.
 */
export function abrirDia(e: Estado, agora: Date): Estado {
  const dia = chaveDoDia(agora);
  const novoDia = e.hoje.dia !== dia;
  const hoje = novoDia ? hojeVazio(dia) : { ...e.hoje };
  hoje.aberturas += 1;
  return {
    ...e,
    hoje,
    sessoes: novoDia || e.sessoes === 0 ? e.sessoes + 1 : e.sessoes,
    ultimaSessao: agora.getTime(),
  };
}

type Migracao = (d: Record<string, unknown>) => Record<string, unknown>;
export const migracoes: Record<number, Migracao> = {};

export function migrar(bruto: Record<string, unknown>): Estado {
  let atual = { ...bruto };
  let v = typeof atual.versao === 'number' ? atual.versao : 1;
  while (v < VERSAO_DO_SAVE) {
    const m = migracoes[v];
    if (!m) throw new Error(`sem migração da versão ${v}`);
    atual = m(atual);
    v = atual.versao as number;
  }
  /* campos novos com valor padrão, para um save antigo não quebrar a tela */
  const base = estadoNovo();
  const pais = (atual.pais as Partial<Pais> | undefined) ?? {};
  const hoje = (atual.hoje as Partial<Hoje> | undefined) ?? {};
  return { ...base, ...(atual as unknown as Estado), hoje: { ...base.hoje, ...hoje }, pais: { ...base.pais, ...pais, tarefas: { ...base.pais.tarefas, ...(pais.tarefas ?? {}) } } };
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function carregar(): Estado | null {
  const s = storage();
  if (!s) return null;
  try {
    const bruto = s.getItem(CHAVE);
    return bruto ? migrar(JSON.parse(bruto)) : null;
  } catch {
    return null;
  }
}

export function gravar(e: Estado): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(CHAVE, JSON.stringify(e));
    return true;
  } catch {
    return false;
  }
}

export function apagarTudo(): void {
  storage()?.removeItem(CHAVE);
}

/* ---------- o estado vivo do jogo, com gravação a cada mudança ---------- */

let vivo: Estado | null = null;
const ouvintes = new Set<(e: Estado) => void>();

export function estado(): Estado {
  if (!vivo) vivo = carregar() ?? estadoNovo();
  return vivo;
}

/** Aplica uma mudança e grava. Toda ação do jogo passa por aqui. */
export function mudar(f: (e: Estado) => Estado | void): Estado {
  const e = estado();
  const r = f(e);
  vivo = r ?? e;
  gravar(vivo);
  for (const o of ouvintes) o(vivo);
  return vivo;
}

export function aoMudar(o: (e: Estado) => void): () => void {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

export function substituir(e: Estado): void {
  vivo = e;
  gravar(e);
}
