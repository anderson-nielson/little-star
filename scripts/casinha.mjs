// A casinha volta para a casa em toda tela, com o dedo de verdade.
// Abre cada tela num celular, toca a casinha (toque e mouse) e confere que a
// casa chegou. Toca também de novo no meio da brincadeira, depois de um toque
// na cena, porque é aí que as telas costumavam roubar o dedo da casinha.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PORTA = 5198;
const BASE = `http://localhost:${PORTA}/little-star/`;
/* o Chromium do ambiente, ou o que o playwright-core instalou (no CI) */
const exe = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* toda tela com a casinha no canto (a casa é o destino; pais e styleguide não têm) */
const TELAS = [
  'chegada', 'roda', 'prato', 'som', 'caderno', 'palavra', 'areia', 'pinhas', 'piano', 'jardim', 'palco',
  'bichos', 'despedida', 'noite', 'dormindo', 'horta', 'arvore', 'cozinha', 'arvoregrande', 'lago', 'ukulele',
  'bonecas', 'bilhete', 'relogio', 'parquinho', 'escorregador', 'gangorra',
];

const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
await espera(2500);

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const contexto = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await contexto.newPage();
const erros = [];

const tela = () => page.evaluate(() => globalThis.littleStar.telaAtual());
const abrir = async (nome) => {
  await page.goto(`${BASE}?debug=1&sessoes=8&hora=15:00&tela=${nome}`, { waitUntil: 'load' });
  for (let i = 0; i < 40 && !(await tela()); i++) await espera(100);
  await espera(900);
};
const centro = async () => {
  const caixa = await page.locator('.casinha').last().boundingBox();
  if (!caixa) return null;
  return [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2];
};
const tocarComDedo = async ([x, y]) => page.touchscreen.tap(x, y);
const tocarComMouse = async ([x, y]) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await espera(60);
  await page.mouse.up();
};

for (const nome of TELAS) {
  for (const [jeito, tocar] of [['dedo', tocarComDedo], ['mouse', tocarComMouse]]) {
    for (const antes of ['logo', 'depois de brincar']) {
      await abrir(nome);
      const aberta = await tela();
      if (aberta === 'casa') {
        erros.push(`${nome}: não abriu (foi direto para a casa)`);
        continue;
      }
      if (antes !== 'logo') {
        /* um toque no meio da cena e um arrasto, como ela faria */
        await tocar([195, 400]);
        await page.mouse.move(80, 390);
        await page.mouse.down();
        await page.mouse.move(300, 390, { steps: 6 });
        await page.mouse.up();
        await espera(1500);
      }
      /* a brincadeira passou adiante sozinha (a chegada vira roda): outra tela, outra rodada */
      if ((await tela()) !== aberta) continue;
      const p = await centro();
      if (!p) {
        erros.push(`${nome}: sem casinha`);
        continue;
      }
      await tocar(p);
      await espera(1500);
      const agora = await tela();
      if (agora !== 'casa') erros.push(`${nome} (${jeito}, ${antes}): a casinha não voltou para a casa, ficou em "${agora}"`);
    }
  }
}

await browser.close();
servidor.kill();
if (erros.length) {
  console.error('A casinha falhou:\n' + erros.join('\n'));
  process.exit(1);
}
console.log(`casinha ok: ${TELAS.length} telas, com dedo e mouse, logo e depois de brincar`);
