/**
 * As regras do toque para 5 anos:
 * - vale ao soltar; o dedo pode escorregar até 24 px sem cancelar;
 * - só o primeiro dedo conta;
 * - a borda da tela (24 px) não faz nada: é onde a mão segura o aparelho;
 * - toque repetido não empilha: uma ação por vez, e a ação termina.
 */
export const ESCORREGA_MAX = 24;
export const BORDA_MORTA = 24;

let dedoAtivo: number | null = null;
let ocupadoAte = 0;

export function naBorda(x: number, y: number): boolean {
  return x < BORDA_MORTA || y < BORDA_MORTA || x > window.innerWidth - BORDA_MORTA || y > window.innerHeight - BORDA_MORTA;
}

/** Trava novas ações por `ms`: a cena atual termina antes da próxima. */
export function travar(ms: number): void {
  ocupadoAte = Math.max(ocupadoAte, performance.now() + ms);
}
export function ocupado(): boolean {
  return performance.now() < ocupadoAte;
}
export function destravar(): void {
  ocupadoAte = 0;
}

export interface OpcoesToque {
  /** aceita o toque mesmo com uma ação em andamento (o pulo da aventura) */
  semTrava?: boolean;
  /** chamado no pointerdown, para a resposta visual imediata */
  aoPressionar?: () => void;
  aoSoltar?: () => void;
}

/**
 * Faz um elemento responder ao toque com as regras acima. Devolve a função
 * que remove os ouvintes.
 */
export function tocavel(el: Element, aoTocar: (ev: PointerEvent) => void, o: OpcoesToque = {}): () => void {
  let x0 = 0;
  let y0 = 0;
  let valido = false;
  const baixo = (ev: Event) => {
    const e = ev as PointerEvent;
    if (dedoAtivo !== null && dedoAtivo !== e.pointerId) return;
    if (naBorda(e.clientX, e.clientY)) return;
    if (!o.semTrava && ocupado()) return;
    dedoAtivo = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    valido = true;
    el.classList.add('pressionado');
    o.aoPressionar?.();
  };
  const move = (ev: Event) => {
    const e = ev as PointerEvent;
    if (e.pointerId !== dedoAtivo || !valido) return;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > ESCORREGA_MAX) {
      valido = false;
      el.classList.remove('pressionado');
    }
  };
  const cima = (ev: Event) => {
    const e = ev as PointerEvent;
    if (e.pointerId !== dedoAtivo) return;
    dedoAtivo = null;
    el.classList.remove('pressionado');
    o.aoSoltar?.();
    if (valido && ev.type === 'pointerup') aoTocar(e);
    valido = false;
  };
  el.addEventListener('pointerdown', baixo);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', cima);
  el.addEventListener('pointercancel', cima);
  el.addEventListener('lostpointercapture', cima);
  el.classList.add('alvo');
  return () => {
    el.removeEventListener('pointerdown', baixo);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', cima);
    el.removeEventListener('pointercancel', cima);
    el.removeEventListener('lostpointercapture', cima);
  };
}

/** Só o primeiro dedo: para arrastos e traços em canvas. */
export function primeiroDedo(): number | null {
  return dedoAtivo;
}
export function reivindicarDedo(id: number): boolean {
  if (dedoAtivo !== null && dedoAtivo !== id) return false;
  dedoAtivo = id;
  return true;
}
export function soltarDedo(id: number): void {
  if (dedoAtivo === id) dedoAtivo = null;
}

/**
 * Segurar: para a lua do cantinho dos pais. Chama `ao` depois de `ms`
 * com o dedo parado no elemento.
 */
export function segurar(el: Element, ms: number, ao: () => void): () => void {
  let t: number | null = null;
  const cancela = () => {
    if (t !== null) window.clearTimeout(t);
    t = null;
  };
  const baixo = () => {
    cancela();
    t = window.setTimeout(() => {
      t = null;
      ao();
    }, ms);
  };
  el.addEventListener('pointerdown', baixo);
  el.addEventListener('pointerup', cancela);
  el.addEventListener('pointercancel', cancela);
  el.addEventListener('pointerleave', cancela);
  return () => {
    cancela();
    el.removeEventListener('pointerdown', baixo);
    el.removeEventListener('pointerup', cancela);
    el.removeEventListener('pointercancel', cancela);
    el.removeEventListener('pointerleave', cancela);
  };
}
