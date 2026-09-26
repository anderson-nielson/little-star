/**
 * O chamado: em toda tela o jogo conta quanto tempo passou sem nenhum toque.
 * Quando passa do tempo que os pais escolheram, a mãozinha aparece no
 * próximo passo com um assovio (ou um "Ei!"). Se ela continuar parada, o
 * chamado volta depois do mesmo tempo, no máximo `CHAMADOS_POR_TELA` vezes;
 * depois o jogo espera em silêncio, porque ficar parada também vale.
 * Qualquer toque ou troca de tela zera a conta.
 */
export type SomDoChamado = 'assovio' | 'ei' | 'alterna';

export const SEGUNDOS_DO_CHAMADO = [0, 10, 15, 20, 30, 45, 60] as const;
export const CHAMADOS_POR_TELA = 3;

export class RelogioDoChamado {
  /** segundos parada nesta tela desde o último toque ou chamado */
  parada = 0;
  /** chamados feitos nesta tela sem nenhum toque no meio */
  chamados = 0;
  /** chamados feitos desde que o jogo abriu: decide o som quando alterna */
  total = 0;

  constructor(private readonly segundos: () => number) {}

  /**
   * Passa `dt` segundos sem toque. Devolve true quando é hora de chamar.
   * Com o tempo em zero o chamado está desligado e nada conta.
   */
  tick(dt: number): boolean {
    const limite = this.segundos();
    if (limite <= 0 || this.chamados >= CHAMADOS_POR_TELA) return false;
    this.parada += dt;
    if (this.parada < limite) return false;
    this.parada = 0;
    this.chamados += 1;
    this.total += 1;
    return true;
  }

  /** Ela tocou em alguma coisa: tudo volta a zero. */
  tocou(): void {
    this.parada = 0;
    this.chamados = 0;
  }

  /** Tela nova: a conta começa de novo. */
  trocouTela(): void {
    this.tocou();
  }

  /** O som deste chamado. Alternando, o primeiro é o assovio. */
  som(escolha: SomDoChamado): 'assovio' | 'ei' {
    if (escolha !== 'alterna') return escolha;
    return this.total % 2 === 1 ? 'assovio' : 'ei';
  }
}
