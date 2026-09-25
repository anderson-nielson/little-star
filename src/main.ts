import './ui/tokens.css';
import './ui/base.css';
import { montar, registrar, definirVoltar, ir } from './core/roteador';
import { sessao } from './core/sessao';
import { estado, mudar, estadoNovo, substituir } from './core/estado';
import { audio } from './audio/engine';
import { prepararVozes } from './audio/vozes';
import { telaChegada } from './telas/chegada';
import { telaCasa } from './telas/casa';
import { telaRoda } from './telas/roda';
import { telaPrato } from './telas/prato';
import { telaSom } from './telas/som';
import { telaCaderno } from './telas/caderno';
import { telaPalavra } from './telas/palavra';
import { telaAreia } from './telas/areia';
import { telaPinhas } from './telas/pinhas';
import { telaPiano } from './telas/piano';
import { telaJardim } from './telas/jardim';
import { telaPalco } from './telas/palco';
import { telaBichos } from './telas/bichos';
import { telaDespedida } from './telas/despedida';
import { telaNoite, telaDormindo } from './telas/noite';
import { telaPais } from './telas/pais';
import { telaStyleguide } from './telas/styleguide';

declare const __VERSAO__: string;

registrar('chegada', telaChegada);
registrar('casa', telaCasa);
registrar('roda', telaRoda);
registrar('prato', telaPrato);
registrar('som', telaSom);
registrar('caderno', telaCaderno);
registrar('palavra', telaPalavra);
registrar('areia', telaAreia);
registrar('pinhas', telaPinhas);
registrar('piano', telaPiano);
registrar('jardim', telaJardim);
registrar('palco', telaPalco);
registrar('bichos', telaBichos);
registrar('despedida', telaDespedida);
registrar('noite', telaNoite);
registrar('dormindo', telaDormindo);
registrar('pais', telaPais);
registrar('styleguide', telaStyleguide);

const app = document.getElementById('app')!;
montar(app);
definirVoltar(() => void sessao.voltarParaCasa());

/* o áudio destrava no primeiro toque em qualquer lugar */
const destravar = () => {
  void audio.tentarDestravar();
};
window.addEventListener('pointerdown', destravar, { passive: true });

const q = new URLSearchParams(location.search);
const debug = q.get('debug') === '1';

if (q.get('styleguide')) {
  void ir('styleguide', { pai: q.get('styleguide') === 'pai' ? '1' : '' });
} else {
  if (debug) {
    /* atalhos de depuração: ?debug=1&sessoes=7&tela=jardim&hora=20:10&zerar=1 */
    if (q.get('zerar') === '1') substituir(estadoNovo());
    const s = Number(q.get('sessoes'));
    if (s > 0) mudar((e) => void (e.sessoes = s - 1));
    const hora = q.get('hora');
    if (hora) {
      const [hh, mm] = hora.split(':').map(Number);
      sessao.agora = () => {
        const d = new Date();
        d.setHours(hh ?? 12, mm ?? 0, 0, 0);
        return d;
      };
    }
  }
  void prepararVozes().then(() => sessao.comecar(debug ? (q.get('tela') ?? undefined) : undefined));
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}

/* para o passeio automático e para a depuração no console */
(window as unknown as { littleStar: unknown }).littleStar = { ir, estado, mudar, sessao, versao: __VERSAO__ };
