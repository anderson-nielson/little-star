import { abrirDia, estado, mudar } from './estado';
import { LIVRE_MAXIMO, partesDaSessao, passouDoLimite, proximaParte, type Parte } from './laco';
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
  private relogio: number | null = null;
  agora: () => Date = () => new Date();

  comecar(telaForcada?: string): void {
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

  async irPara(p: Parte): Promise<void> {
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

  /** Voltar para a casa, de qualquer brincadeira. */
  async voltarParaCasa(): Promise<void> {
    if (this.partes.includes('casa') && this.partes.indexOf(this.atual) < this.partes.indexOf('casa')) {
      /* saiu de uma parte antes da casa: a casa vem, e a parte pulada não volta */
      await this.irPara('casa');
      return;
    }
    if (this.atual === 'bichos' || this.atual === 'despedida') {
      await this.irPara(this.atual);
      return;
    }
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
      const t = telaAtual();
      if (t === 'dormindo' || t === 'pais' || t === 'styleguide') return;
      mudar((e) => {
        e.hoje.segundos += 1;
      });
    }, 1000);
  }
}

export const sessao = new Sessao();
