/**
 * A ajuda invisível. A0 sempre no começo; A1 depois de 6 s parada ou duas
 * tentativas sem completar; A2 depois de mais 6 s ou quatro tentativas.
 * Zera a cada atividade. Nunca aparece como nível para a criança.
 */
export type Nivel = 0 | 1 | 2;

export const SEGUNDOS_PARA_A1 = 6;
export const SEGUNDOS_PARA_A2 = 12;
export const TENTATIVAS_PARA_A1 = 2;
export const TENTATIVAS_PARA_A2 = 4;

export class Ajuda {
  nivel: Nivel = 0;
  private ocioso = 0;
  private tentativas = 0;
  /** conta quantas vezes cada nível foi alcançado, para o cantinho dos pais */
  alcancado: [number, number, number] = [0, 0, 0];

  constructor(private readonly aoMudar: (n: Nivel) => void = () => {}) {}

  /** Passa `dt` segundos sem toque. */
  tick(dt: number): void {
    this.ocioso += dt;
    if (this.ocioso >= SEGUNDOS_PARA_A2) this.subir(2);
    else if (this.ocioso >= SEGUNDOS_PARA_A1) this.subir(1);
  }

  /** Ela tocou: o relógio de ociosidade volta a zero. O nível não desce. */
  tocou(): void {
    this.ocioso = 0;
  }

  /** Uma tentativa que não completou. */
  tentativa(): void {
    this.tentativas += 1;
    this.ocioso = 0;
    if (this.tentativas >= TENTATIVAS_PARA_A2) this.subir(2);
    else if (this.tentativas >= TENTATIVAS_PARA_A1) this.subir(1);
  }

  /** Nova etapa dentro da mesma atividade (outra letra, outro obstáculo): tudo volta a A0. */
  reset(): void {
    this.ocioso = 0;
    this.tentativas = 0;
    if (this.nivel !== 0) {
      this.nivel = 0;
      this.aoMudar(0);
    }
  }

  private subir(n: Nivel): void {
    if (n <= this.nivel) return;
    this.nivel = n;
    this.alcancado[n] += 1;
    this.aoMudar(n);
  }
}
