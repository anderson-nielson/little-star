import { abrirDia, estado, mudar } from './estado';
import { LIVRE_MAXIMO, partesDaSessao, passouDoLimite, podeReabrir, proximaParte, type Parte } from './laco';
import { ir, telaAtual } from './roteador';

/**
 * A sessão viva: sabe em que parte do laço a Stella está e leva para a
 * próxima quando uma parte termina. Também conta o tempo de tela e, quando o
 * limite chega, transforma a próxima troca de tela em despedida.
 */
class Sessao {
  partes: Parte[] = [];
  atual: Parte = 'chegada';
  inicioLivre = 0;
  /** a porta fechou e o jogo descansa: o tempo de tela não conta */
  descansando = false;
  private relogio: number | null = null;
  agora: () => Date = () => new Date();

  comecar(telaForcada?: string): void {
    this.descansando = false;
    mudar((e) => abrirDia(e, this.agora()));
    this.partes = partesDaSessao(estado(), this.agora());
    this.atual = this.partes[0] ?? 'casa';
    this.contarTempo();
    if (telaForcada) {
      void ir(telaForcada);
      return;
    }
    void this.irPara(this.atual);
  }

  telaDe(p: Parte): string {
    return p;
  }

  /** A porta fechou. O jogo descansa até um toque; enquanto isso, nada conta como tempo de tela. */
  descansar(): void {
    this.descansando = true;
    this.inicioLivre = 0;
  }

  /**
   * Um toque na porta fechada. Reabre como segunda vez no dia quando ainda há
   * dia de tela, ou como rotina da noite quando é hora; devolve false quando
   * o dia de tela acabou e a porta fica fechada.
   */
  reabrir(): boolean {
    if (!podeReabrir(estado(), this.agora())) return false;
    this.comecar();
    return true;
  }

  async irPara(p: Parte): Promise<void> {
    this.descansando = false;
    this.atual = p;
    if (p === 'casa' && !this.inicioLivre) this.inicioLivre = Date.now();
    mudar((e) => {
      e.registro.partes[p] = (e.registro.partes[p] ?? 0) + 1;
    });
    await ir(this.telaDe(p));
  }

  /** A parte atual terminou. */
  async avancar(): Promise<void> {
    if (passouDoLimite(estado()) && this.atual !== 'despedida' && this.atual !== 'noite' && this.atual !== 'dormindo') {
      await this.irPara('despedida');
      return;
    }
    const prox = proximaParte(this.partes, this.atual);
    if (prox) await this.irPara(prox);
    else await this.irPara('despedida');
  }

  /**
   * Voltar para a casa, de qualquer tela: a casinha do canto e o "voltar" do
   * aparelho. Sempre leva para a casa, também dos bichos, da despedida e do
   * quarto à noite; antes, dali ela recomeçava a mesma tela e o quarto
   * dormindo não tinha saída. A parte pulada não volta.
   */
  async voltarParaCasa(): Promise<void> {
    await this.irPara('casa');
  }

  /** A casa livre já durou demais: a família chama para os bichos. */
  livreEsgotado(): boolean {
    return this.inicioLivre > 0 && (Date.now() - this.inicioLivre) / 1000 > LIVRE_MAXIMO;
  }

  private contarTempo(): void {
    if (this.relogio !== null) return;
    this.relogio = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (this.descansando) return;
      const t = telaAtual();
      if (t === 'dormindo' || t === 'pais' || t === 'styleguide') return;
      mudar((e) => {
        e.hoje.segundos += 1;
      });
    }, 1000);
  }
}

export const sessao = new Sessao();
