import { carregarPiano } from './piano';

/** Motor de áudio: um AudioContext, ganhos de música e efeitos, relógio mestre e compensação de latência. */
class MotorAudio {
  ctx: AudioContext | null = null;
  mestre: GainNode | null = null;
  musica: GainNode | null = null;
  efeitos: GainNode | null = null;
  private latenciaCalibradaMs = 0;
  private ultimoAudio = 0;
  private ultimoPerf = 0;
  /** soma que mantém o relógio contínuo quando o contexto acorda */
  private deslocamento = 0;
  private ancorado = false;
  /** o som todo desligado nas opções: o jogo segue igual, só que em silêncio */
  mudo = false;

  /** Destrava o contexto no primeiro toque. Idempotente. */
  async destravar(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC({ latencyHint: 'interactive' });
        this.mestre = this.ctx.createGain();
        this.musica = this.ctx.createGain();
        this.efeitos = this.ctx.createGain();
        this.mestre.gain.value = this.mudo ? 0 : 1;
        this.musica.connect(this.mestre);
        this.efeitos.connect(this.mestre);
        /* o piano gravado tem cauda: notas se sobrepõem e um acorde podia
           estourar no alto-falante do celular. Um compressor leve segura o pico. */
        const limite = this.ctx.createDynamicsCompressor();
        limite.threshold.value = -6;
        limite.knee.value = 6;
        limite.ratio.value = 6;
        limite.attack.value = 0.003;
        limite.release.value = 0.2;
        this.mestre.connect(limite);
        limite.connect(this.ctx.destination);
      }
      /* as amostras do piano chegam em segundo plano, e cada tela de dança
         completa as que faltarem; até lá toca o sintetizador */
      void carregarPiano(this.ctx);
      if (this.ctx.state !== 'running') await this.ctx.resume();
      /* um buffer mudo curto ajuda o iOS a soltar o áudio */
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b;
      s.connect(this.ctx.destination);
      s.start(0);
      return this.ctx.state === 'running';
    } catch {
      return false;
    }
  }

  get pronto(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  /**
   * Relógio mestre em segundos. Nunca setTimeout para sincronia.
   * Se o contexto não estiver rodando (sem gesto ainda, aba escondida), continua a contar
   * a partir do último instante conhecido, para a dança nunca congelar: o jogo é jogável no mudo.
   */
  agora(): number {
    const perf = performance.now() / 1000;
    if (this.ultimoPerf === 0) {
      this.ultimoPerf = perf;
      this.ultimoAudio = 0;
    }
    const semAudio = this.ultimoAudio + (perf - this.ultimoPerf);
    if (this.ctx && this.ctx.state === 'running') {
      /* O contexto pode acordar depois de a dança já ter começado, e o
         currentTime dele nasce perto de zero. Sem esta âncora o relógio
         mestre dava um salto de vários segundos no meio da música, e a linha
         do tempo inteira, que foi montada com o relógio de antes, passava a
         apontar para o passado: nenhum slot abria. */
      if (!this.ancorado) {
        this.deslocamento = semAudio - this.ctx.currentTime;
        this.ancorado = true;
      }
      const t = this.ctx.currentTime + this.deslocamento;
      this.ultimoAudio = t;
      this.ultimoPerf = perf;
      return t;
    }
    /* suspendeu: quando voltar, reancora, porque o currentTime parou e o
       tempo do mundo não */
    this.ancorado = false;
    return semAudio;
  }

  /**
   * O instante do relógio mestre no relógio do contexto, que é o único que os
   * osciladores entendem. O mestre soma um deslocamento ao currentTime para
   * não saltar quando o contexto acorda ou volta de uma suspensão; quem
   * agenda som com o tempo do mestre sem converter agenda tudo para o futuro,
   * e a cada volta do app do segundo plano o futuro fica mais longe. Foi
   * assim que a música sumiu: numa aula, depois de 6s suspenso, cada nota
   * saía 7,34s à frente do contexto.
   */
  tempoDeContexto(t: number): number {
    return t - this.deslocamento;
  }

  /** Tenta destravar, mas não espera mais que `ms`: sem áudio, o jogo segue com guias visuais. */
  async tentarDestravar(ms = 400): Promise<boolean> {
    return Promise.race([this.destravar(), new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);
  }

  /** Atraso entre o instante agendado e o que o ouvido recebe. */
  atrasoDeSaida(): number {
    const c = this.ctx as (AudioContext & { outputLatency?: number }) | null;
    const hw = c ? (c.outputLatency ?? c.baseLatency ?? 0) : 0;
    return hw + this.latenciaCalibradaMs / 1000;
  }

  definirLatencia(ms: number): void {
    this.latenciaCalibradaMs = ms;
  }

  definirVolumes(musica: number, efeitos: number): void {
    if (!this.ctx) return;
    this.musica?.gain.setTargetAtTime(musica, this.ctx.currentTime, 0.02);
    this.efeitos?.gain.setTargetAtTime(efeitos, this.ctx.currentTime, 0.02);
  }

  /** Liga e desliga o som inteiro (música, efeitos, vozes gravadas e a voz do aparelho). */
  definirMudo(sim: boolean): void {
    this.mudo = sim;
    if (sim && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (!this.ctx || !this.mestre) return;
    this.mestre.gain.setTargetAtTime(sim ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  private volumeMusica = 0.8;
  /** Pausa do jogo: silencia a música sem suspender o contexto, para o relógio seguir contínuo. */
  silenciar(sim: boolean): void {
    if (!this.ctx || !this.musica) return;
    if (sim) {
      this.volumeMusica = this.musica.gain.value;
      this.musica.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    } else this.musica.gain.setTargetAtTime(this.volumeMusica, this.ctx.currentTime, 0.02);
  }
}

export const audio = new MotorAudio();
