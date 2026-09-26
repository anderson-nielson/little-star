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
/**
 * Quem ficou com o dedo. Um alvo dentro de outro (o galho dentro da cena
 * inteira) recebe o pointerdown primeiro; o de fora, na borbulha, não pode
 * pegar o mesmo dedo de volta: a captura trocava de dono e nenhum dos dois
 * via o pointerup, e a tela parava de responder.
 */
let dono: Element | null = null;
let ocupadoAte = 0;

/*
 * Rede de segurança: no toque, cada dedo novo tem um pointerId novo. Se o
 * dedo soltasse fora do alvo onde desceu, o alvo nunca via o pointerup e o
 * "primeiro dedo" ficava preso para sempre: a tela inteira parava de responder.
 * A janela sempre vê o fim do toque, então é ela quem libera o dedo.
 */
const liberarDedo = (ev: Event) => {
  if ((ev as PointerEvent).pointerId === dedoAtivo) {
    dedoAtivo = null;
    dono = null;
  }
};
if (typeof window !== 'undefined') {
  /* na fase de borbulha: depois do alvo, que precisa ver o dedo ainda ativo */
  window.addEventListener('pointerup', liberarDedo);
  window.addEventListener('pointercancel', liberarDedo);
}

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
  /* o dedo deste alvo, guardado aqui: se outra parte da tela soltar o dedo
     global (`soltarDedo`) no meio do toque, o alvo ainda reconhece o seu */
  let meu: number | null = null;
  const baixo = (ev: Event) => {
    const e = ev as PointerEvent;
    if (dedoAtivo !== null && dedoAtivo !== e.pointerId) return;
    if (dono !== null && dono !== el) return;
    if (naBorda(e.clientX, e.clientY)) return;
    if (!o.semTrava && ocupado()) return;
    dedoAtivo = e.pointerId;
    dono = el;
    meu = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    valido = true;
    /* o alvo segura o dedo: o pointerup chega nele mesmo que o dedo escorregue para fora */
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* alguns elementos não capturam; a rede de segurança acima cobre */
    }
    el.classList.add('pressionado');
    o.aoPressionar?.();
  };
  const move = (ev: Event) => {
    const e = ev as PointerEvent;
    if (e.pointerId !== meu || !valido) return;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > ESCORREGA_MAX) {
      valido = false;
      el.classList.remove('pressionado');
    }
  };
  const cima = (ev: Event) => {
    const e = ev as PointerEvent;
    if (e.pointerId !== meu) return;
    meu = null;
    if (dedoAtivo === e.pointerId) dedoAtivo = null;
    if (dono === el) dono = null;
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

/**
 * A saída de uma tela (a casinha). Não passa pelas regras compartilhadas do
 * toque: não disputa o primeiro dedo, não respeita trava, não depende de
 * nenhum outro ouvinte da tela. O pointerdown dela para aqui e a tela nunca o
 * vê, então nenhuma brincadeira consegue pegar ou soltar esse dedo. Antes, na
 * tela da palavra, o ouvinte da fita pegava o dedo da casinha e o soltava na
 * mesma hora (longe da fita), e a casinha nunca via o próprio toque.
 */
export function saida(el: Element, ao: () => void): () => void {
  let meu: number | null = null;
  let x0 = 0;
  let y0 = 0;
  const baixo = (ev: Event) => {
    const e = ev as PointerEvent;
    e.stopPropagation();
    if (naBorda(e.clientX, e.clientY)) return;
    meu = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    /* se ela tinha um dedo preso em outro lugar, a saída libera */
    dedoAtivo = null;
    dono = null;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* sem captura, o pointerup ainda chega quando o dedo solta em cima */
    }
    el.classList.add('pressionado');
  };
  const cima = (ev: Event) => {
    const e = ev as PointerEvent;
    e.stopPropagation();
    if (e.pointerId !== meu) return;
    meu = null;
    el.classList.remove('pressionado');
    if (ev.type !== 'pointerup') return;
    /* a saída perdoa mais o escorregão que os outros alvos */
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > ESCORREGA_MAX * 2) return;
    ao();
  };
  const cancela = (ev: Event) => {
    if ((ev as PointerEvent).pointerId !== meu) return;
    meu = null;
    el.classList.remove('pressionado');
  };
  el.addEventListener('pointerdown', baixo);
  el.addEventListener('pointerup', cima);
  el.addEventListener('pointercancel', cancela);
  el.classList.add('alvo');
  return () => {
    el.removeEventListener('pointerdown', baixo);
    el.removeEventListener('pointerup', cima);
    el.removeEventListener('pointercancel', cancela);
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
  if (dedoAtivo === id) {
    dedoAtivo = null;
    dono = null;
  }
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
