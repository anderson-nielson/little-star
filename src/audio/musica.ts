import { audio } from './engine';
import { baixo, piano } from './synth';
import { pianoPronto } from './piano';

export interface Musica {
  id: string;
  titulo: string;
  compositor: string;
  tom: string;
  bpm: number;
  compasso: number;
  melodia: string;
  baixo: string;
  fonte?: string;
}

export interface Nota {
  beat: number;
  dur: number;
  midi: number;
}

export interface MusicaParseada extends Musica {
  notasMelodia: Nota[];
  notasBaixo: Nota[];
  compassos: number;
  beatsTotal: number;
}

const NOMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function midiDeNome(nome: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nome);
  if (!m) throw new Error(`nota inválida: ${nome}`);
  const base = NOMES[m[1]!]!;
  const acid = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + base + acid;
}

export function parseNotas(texto: string): Nota[] {
  const notas: Nota[] = [];
  let beat = 0;
  for (const tok of texto.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [nome, durTxt] = tok.split(':');
    const dur = Number(durTxt ?? 1);
    if (nome !== 'r') notas.push({ beat, dur, midi: midiDeNome(nome!) });
    beat += dur;
  }
  return notas;
}

export function parseMusica(m: Musica): MusicaParseada {
  const notasMelodia = parseNotas(m.melodia);
  const notasBaixo = parseNotas(m.baixo);
  const fim = Math.max(0, ...notasMelodia.map((n) => n.beat + n.dur), ...notasBaixo.map((n) => n.beat + n.dur));
  const compassos = Math.max(1, Math.round(fim / m.compasso));
  return { ...m, notasMelodia, notasBaixo, compassos, beatsTotal: compassos * m.compasso };
}

const ANTECIPACAO = 0.25;
const INTERVALO = 60;
const PASSOS_POR_BEAT = 4;

/**
 * Sequenciador: toca uma música a partir de um instante do relógio de áudio,
 * em loop até `parar()`. A matemática de tempo é função de (tInicio, bpm).
 */
export class Sequenciador {
  readonly segPorBeat: number;
  tInicio = 0;
  private proximoPasso = 0;
  private gravado = false;
  private timer: number | null = null;
  private tocando = false;
  /** volume da melodia (a voz vence a música) */
  ganho = 0.42;
  loop = true;
  /** quantos compassos tocar quando não é loop */
  compassosTotais: number;

  constructor(
    readonly musica: MusicaParseada,
    opcoes: { bpm?: number; compassos?: number; loop?: boolean } = {},
  ) {
    this.segPorBeat = 60 / (opcoes.bpm ?? musica.bpm);
    this.compassosTotais = opcoes.compassos ?? musica.compassos;
    this.loop = opcoes.loop ?? true;
  }

  get beatsTotais(): number {
    return this.compassosTotais * this.musica.compasso;
  }
  get duracao(): number {
    return this.beatsTotais * this.segPorBeat;
  }
  tempoDoBeat(beat: number): number {
    return this.tInicio + beat * this.segPorBeat;
  }
  beatNoInstante(t: number): number {
    return (t - this.tInicio) / this.segPorBeat;
  }

  iniciar(tInicio = audio.agora() + 0.1): void {
    this.tInicio = tInicio;
    this.proximoPasso = 0;
    this.gravado = pianoPronto();
    this.tocando = true;
    this.agendar();
    this.timer = window.setInterval(() => this.agendar(), INTERVALO);
  }

  parar(): void {
    this.tocando = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  get ativo(): boolean {
    return this.tocando;
  }

  private agendar(): void {
    if (!this.tocando) return;
    const limite = audio.agora() + ANTECIPACAO;
    const passosTotais = this.loop ? Infinity : this.beatsTotais * PASSOS_POR_BEAT;
    while (this.proximoPasso < passosTotais && this.tempoDoBeat(this.proximoPasso / PASSOS_POR_BEAT) < limite) {
      this.agendarPasso(this.proximoPasso);
      this.proximoPasso++;
    }
    if (!this.loop && this.proximoPasso >= passosTotais && audio.agora() > this.tempoDoBeat(this.beatsTotais)) this.parar();
  }

  private agendarPasso(passo: number): void {
    const m = this.musica;
    const beat = Math.floor(passo / PASSOS_POR_BEAT);
    const de = (passo % PASSOS_POR_BEAT) / PASSOS_POR_BEAT;
    const ate = de + 1 / PASSOS_POR_BEAT;
    const beatNaMusica = beat % m.beatsTotal;
    const t0 = audio.tempoDeContexto(this.tempoDoBeat(beat));
    const dentro = (b: number, base: number) => b - base >= de - 1e-9 && b - base < ate - 1e-9;
    for (const n of m.notasMelodia) {
      if (dentro(n.beat, beatNaMusica)) piano(n.midi, t0 + (n.beat - beatNaMusica) * this.segPorBeat, n.dur * this.segPorBeat, this.ganho, this.gravado);
    }
    for (const n of m.notasBaixo) {
      if (dentro(n.beat, beatNaMusica)) baixo(n.midi, t0 + (n.beat - beatNaMusica) * this.segPorBeat, n.dur * this.segPorBeat, n.beat % m.compasso === 0 ? 0.36 : 0.26, this.gravado);
    }
  }
}

/* ---------- a música da casa: uma de cada vez ---------- */

const modulos = import.meta.glob<Musica>('../data/musicas/*.json', { eager: true, import: 'default' });
export const musicas: Record<string, MusicaParseada> = Object.fromEntries(Object.values(modulos).map((m) => [m.id, parseMusica(m)]));

export function musica(id: string): MusicaParseada {
  const m = musicas[id];
  if (!m) throw new Error(`música desconhecida: ${id}`);
  return m;
}

let tocandoAgora: Sequenciador | null = null;
let idAtual = '';

/** Troca a música de fundo. A mesma música não recomeça. */
export function tocarFundo(id: string, opcoes: { bpm?: number } = {}): Sequenciador | null {
  if (idAtual === id && tocandoAgora?.ativo) return tocandoAgora;
  pararFundo();
  if (!audio.pronto) return null;
  const s = new Sequenciador(musica(id), { ...opcoes, loop: true });
  s.iniciar();
  tocandoAgora = s;
  idAtual = id;
  return s;
}

export function pararFundo(): void {
  tocandoAgora?.parar();
  tocandoAgora = null;
  idAtual = '';
}

export function fundoAtual(): string {
  return idAtual;
}
