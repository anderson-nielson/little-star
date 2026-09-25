/**
 * O aparelho: a versão instalada, a busca por uma versão nova, reiniciar,
 * limpar, instalar na tela inicial e proteger as gravações. Tudo que o
 * cantinho dos pais oferece em "Opções". Sem DOM aqui; só o navegador.
 */

declare const __VERSAO__: string;

export type ResultadoDaBusca = 'nova' | 'atualizada' | 'offline' | 'sem-suporte' | 'erro';

/** O evento que o Chrome dispara quando o site pode virar app. Não está no lib.dom. */
interface EventoDeInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let registro: ServiceWorkerRegistration | null = null;
let novaVersaoInstalando = false;
let eventoDeInstalacao: EventoDeInstalacao | null = null;
let checagens = 0;

export function versao(): string {
  return typeof __VERSAO__ === 'string' ? __VERSAO__ : 'dev';
}

/** Chamado uma vez pelo main: registra o service worker (só na build) e guarda o convite de instalação. */
export function iniciarAparelho(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (ev) => {
    ev.preventDefault();
    eventoDeInstalacao = ev as EventoDeInstalacao;
  });
  window.addEventListener('appinstalled', () => {
    eventoDeInstalacao = null;
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    import('virtual:pwa-register')
      .then(({ registerSW }) =>
        registerSW({
          immediate: true,
          onRegisteredSW: (_url, r) => {
            registro = r ?? null;
            r?.addEventListener('updatefound', () => {
              /* a primeira instalação também dispara updatefound: só é versão nova se já havia uma no comando */
              if (jaTinhaVersao()) novaVersaoInstalando = true;
            });
          },
        }),
      )
      .catch(() => {});
  }
}

/** Já há uma versão do jogo guardada e no comando desta página? */
function jaTinhaVersao(): boolean {
  return temServiceWorker() && navigator.serviceWorker.controller !== null;
}

export function temServiceWorker(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function estaOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** Aberto pelo ícone da tela inicial (tela cheia, sem barra de endereço)? */
export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  const ios = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios || window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches === true;
}

export function podeInstalar(): boolean {
  return eventoDeInstalacao !== null;
}

/** Mostra o convite do próprio navegador para instalar. Só no Android/Chrome. */
export async function instalar(): Promise<'instalado' | 'recusado' | 'indisponivel'> {
  const ev = eventoDeInstalacao;
  if (!ev) return 'indisponivel';
  try {
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') {
      eventoDeInstalacao = null;
      return 'instalado';
    }
    return 'recusado';
  } catch {
    return 'indisponivel';
  }
}

/** Já achou uma versão nova e ela está sendo instalada (o jogo vai reabrir sozinho). */
export function novaVersaoAChegar(): boolean {
  return novaVersaoInstalando;
}

/**
 * Pergunta ao servidor se há uma versão nova. O service worker é o carteiro:
 * cada build muda o arquivo dele, então "arquivo diferente" é "versão nova".
 * Com autoUpdate, a versão nova instala, assume e o jogo reabre sozinho.
 */
export async function buscarNovaVersao(): Promise<ResultadoDaBusca> {
  if (!temServiceWorker()) return 'sem-suporte';
  if (!estaOnline()) return 'offline';
  checagens += 1;
  try {
    const r = registro ?? (await navigator.serviceWorker.getRegistration());
    if (!r) return 'sem-suporte';
    registro = r;
    const jaTinha = jaTinhaVersao();
    await r.update();
    if (jaTinha && (r.installing || r.waiting || novaVersaoInstalando)) {
      novaVersaoInstalando = true;
      return 'nova';
    }
    return 'atualizada';
  } catch {
    return estaOnline() ? 'erro' : 'offline';
  }
}

export function quantasChecagens(): number {
  return checagens;
}

/** Fecha e abre o jogo. Progresso e gravações ficam. */
export function reiniciar(): void {
  location.reload();
}

/**
 * Tira o service worker e os arquivos guardados, e reabre: o jogo baixa tudo de
 * novo. Para quando ficar preso numa versão antiga. Save e gravações ficam:
 * moram no localStorage e no IndexedDB, não no cache.
 */
export async function limparEReiniciar(): Promise<void> {
  try {
    if (temServiceWorker()) {
      const rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const nomes = await caches.keys();
      await Promise.all(nomes.map((n) => caches.delete(n)));
    }
  } catch {
    /* o que não deu para limpar, o reload resolve na próxima */
  }
  reiniciar();
}

/** O celular já prometeu não apagar as gravações? `null` quando não dá para saber. */
export async function armazenamentoProtegido(): Promise<boolean | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

/** Pede ao celular para não apagar as gravações quando faltar espaço. */
export async function protegerArmazenamento(): Promise<boolean | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** Quanto o jogo ocupa no aparelho, em bytes. `null` quando não dá para saber. */
export async function espacoUsado(): Promise<number | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
    const { usage } = await navigator.storage.estimate();
    return typeof usage === 'number' ? usage : null;
  } catch {
    return null;
  }
}

export async function telaCheia(): Promise<boolean> {
  try {
    if (document.fullscreenElement) return true;
    await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    return !!document.fullscreenElement;
  } catch {
    return false;
  }
}

/* ---------- puro, para texto e teste ---------- */

/** O nome do aparelho a partir do user agent: o que os pais reconhecem. */
export function nomeDoAparelho(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) return 'iPad';
  if (/Android/i.test(ua)) return /Samsung|SM-/i.test(ua) ? 'Samsung Galaxy' : 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'este aparelho';
}

export function textoDaBusca(r: ResultadoDaBusca, v = versao()): string {
  switch (r) {
    case 'nova':
      return 'Tem versão nova. Ela está sendo baixada e o jogo vai reabrir sozinho em instantes. Se não reabrir, toque em Reiniciar o jogo.';
    case 'atualizada':
      return `Esta é a versão mais nova (${v}).`;
    case 'offline':
      return 'Sem internet agora. O jogo funciona igual; a busca fica para quando voltar.';
    case 'sem-suporte':
      return 'Aqui não há o que buscar: este navegador não guarda o jogo. Abra o jogo instalado, ou no Chrome ou Safari.';
    case 'erro':
      return 'Não deu para perguntar ao servidor agora. Tente de novo daqui a pouco.';
  }
}

export function textoDeEspaco(bytes: number | null): string {
  if (bytes === null) return 'espaço usado desconhecido';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB no aparelho`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB no aparelho`;
}
