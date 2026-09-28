// Olhar telas do jogo: sobe o servidor de desenvolvimento, abre cada tela pelo nome
// (com os atalhos de depuração) e guarda uma captura em docs/shots/olhar/.
//   TELAS=casa,chegada node scripts/olhar.mjs
//   TELAS=styleguide ALTURA=4000 node scripts/olhar.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const PORTA = Number(process.env.PORTA ?? 5231);
const TELAS = (process.env.TELAS ?? 'casa').split(',');
const PASTA = process.env.PASTA ?? 'docs/shots/olhar';
const ALTURA = Number(process.env.ALTURA ?? 780);
const ESPERA = Number(process.env.ESPERA ?? 2500);
const exe = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
mkdirSync(PASTA, { recursive: true });

const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: exe });
try {
  const p = await b.newPage({ viewport: { width: 390, height: ALTURA }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => console.log('erro na página:', e.message));
  for (const t of TELAS) {
    const url = t === 'styleguide' ? `http://localhost:${PORTA}/little-star/?styleguide=1` : `http://localhost:${PORTA}/little-star/?debug=1&zerar=1&sessoes=8&hora=${process.env.HORA ?? '15:00'}&tela=${t}`;
    await p.goto(url);
    await p.waitForTimeout(ESPERA);
    await p.screenshot({ path: `${PASTA}/${t}.png` });
    console.log('olhou', t);
  }
} finally {
  await b.close();
  vite.kill();
}
