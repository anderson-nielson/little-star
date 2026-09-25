// Passeio de fumaça: sobe o preview, abre cada tela num viewport de celular,
// toca onde a Stella tocaria, falha se houver erro de página. Capturas em docs/shots/.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORTA = 5199;
const BASE = `http://localhost:${PORTA}/little-star/`;
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
mkdirSync('docs/shots', { recursive: true });

const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
await espera(2500);

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const contexto = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await contexto.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|sw\.js|workbox/i.test(m.text())) erros.push(`console: ${m.text()}`);
});

const shot = (nome) => page.screenshot({ path: `docs/shots/${nome}.png` });
const abrir = async (q) => {
  await page.goto(`${BASE}?debug=1&${q}`, { waitUntil: 'load' });
  await espera(900);
};
const toque = async (x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await espera(60);
  await page.mouse.up();
};
const conta = async (nome, seletor, minimo = 1) => {
  const n = await page.locator(seletor).count();
  if (n < minimo) erros.push(`${nome}: esperava ${minimo} de "${seletor}", achou ${n}`);
};

/* 1. primeira sessão: chegada, casa, despedida com a cestinha */
await abrir('zerar=1&hora=15:00');
await shot('01-chegada');
await conta('chegada', 'svg.cena');
await toque(195, 400);
await espera(1500);
await shot('02-casa-sessao-1');
await conta('casa: piano', '[data-alvo="piano"]');
await conta('casa: sem caderno na sessão 1', '[data-alvo="caderno"]', 0);
/* o piano */
await toque(195, 300);
await espera(1200);
/* a posição do piano no svg: hx+172, y1+124 => 194, 272 no viewBox; a tela cobre a viewBox inteira */
await page.evaluate(() => globalThis.littleStar.ir('piano'));
await espera(900);
await shot('03-piano');
await conta('piano', '[data-tecla]', 8);
await toque(60, 600);
await toque(140, 600);
await espera(500);

/* 2. dia 8, 15h: o laço inteiro */
await abrir('zerar=1&sessoes=8&hora=15:00');
await espera(1200);
await toque(195, 400);
await espera(1800);
await shot('04-roda');
await conta('roda', '[data-obj]');
/* a pergunta leva uns 2 s sem voz; depois o toque vale */
await espera(2200);
await toque(195, 552);
await espera(5200);
await shot('05-roda-lembranca');
/* deixa a roda seguir sozinha até o prato (quatro tarefas, umas 9 s cada) */
await espera(30000);
await shot('06-prato');
await conta('prato', '[data-cor]', 6);
await toque(195, 372);
await espera(3200);
await shot('07-prato-flor');
await page.evaluate(() => globalThis.littleStar.ir('som'));
await espera(2500);
await shot('08-som-do-dia');
await conta('som', '[data-fig]', 3);

/* 3. as brincadeiras, direto */
for (const [nome, tela, q] of [
  ['09-caderno', 'caderno', ''],
  ['10-palavra', 'palavra', ''],
  ['11-areia', 'areia', ''],
  ['12-pinhas', 'pinhas', ''],
  ['13-mesa', 'pinhas', ''],
  ['14-bichos', 'bichos', ''],
  ['15-despedida', 'despedida', ''],
]) {
  await abrir(`sessoes=8&hora=15:00&tela=${tela}`);
  if (nome === '13-mesa') await page.evaluate(() => globalThis.littleStar.ir('pinhas', { mesa: '1' }));
  if (nome === '10-palavra') await page.evaluate(() => globalThis.littleStar.ir('palavra', { palavra: 'LUA', volta: 'casa' }));
  await espera(2600);
  await shot(nome);
  await conta(nome, 'svg.cena, canvas.cena');
  void q;
}
/* o caderno: traçar o A com o dedo */
await abrir('sessoes=8&hora=15:00&tela=caderno');
await espera(4500);
const caixa = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
const lado = Math.min(caixa.w * 0.62, caixa.h * 0.42);
const cx0 = (caixa.w - lado) / 2;
const cy0 = caixa.h * 0.16;
const P = (x, y) => [cx0 + x * lado, cy0 + y * lado];
async function traco(de, ate) {
  const a = P(...de);
  const b = P(...ate);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let k = 1; k <= 20; k++) {
    await page.mouse.move(a[0] + ((b[0] - a[0]) * k) / 20, a[1] + ((b[1] - a[1]) * k) / 20);
    await espera(16);
  }
  await page.mouse.up();
}
await espera(6000); /* a estrela guia percorre os três traços */
await traco([0.5, 0.06], [0.12, 0.94]);
await traco([0.5, 0.06], [0.88, 0.94]);
await traco([0.27, 0.62], [0.73, 0.62]);
await espera(800);
await shot('16-caderno-tracado');
const letrasDepois = await page.evaluate(() => globalThis.littleStar.estado().letras);
if (!letrasDepois.includes('A')) erros.push(`caderno: o A traçado não entrou nas letras (${JSON.stringify(letrasDepois)})`);

/* 4. o jardim e o palco */
await abrir('sessoes=8&hora=15:00&tela=jardim');
await espera(3000);
await shot('17-jardim');
for (let i = 0; i < 6; i++) {
  await toque(200, 450);
  await espera(700);
}
await shot('18-jardim-pulo');
await page.evaluate(() => globalThis.littleStar.ir('palco'));
await espera(3500);
await shot('19-palco');
await toque(195, 200);
await toque(195, 600);
await espera(600);

/* 5. a noite */
await abrir('sessoes=8&hora=19:45');
await espera(1500);
await shot('20-noite');
await conta('noite', '[data-passo]', 5);
await toque(70, 340);
await espera(2000);
await abrir('sessoes=8&hora=21:30');
await espera(1200);
await shot('21-dormindo');

/* 5b. a v2: a horta, a árvore, a cozinha, o quarto, as aventuras novas e as festas */
for (const [nome, tela, q] of [
  ['24-horta', 'horta', ''],
  ['25-arvore', 'arvore', ''],
  ['26-cozinha', 'cozinha', ''],
  ['27-ukulele', 'ukulele', ''],
  ['28-lira', 'lira', ''],
  ['29-bonecas', 'bonecas', ''],
  ['30-bilhete', 'bilhete', ''],
  ['31-arvore-grande', 'arvoregrande', ''],
  ['32-lago', 'lago', ''],
]) {
  await abrir(`sessoes=8&hora=15:00&tela=${tela}${q}`);
  if (nome === '30-bilhete') await page.evaluate(() => globalThis.littleStar.mudar((e) => void (e.letras = ['A', 'E', 'L'])));
  if (nome === '30-bilhete') await page.evaluate(() => globalThis.littleStar.ir('bilhete'));
  await espera(2600);
  if (tela === 'arvoregrande' || tela === 'lago') {
    for (let i = 0; i < 4; i++) {
      await toque(200, 480);
      await espera(800);
    }
  }
  await shot(nome);
  await conta(nome, 'svg.cena, canvas.cena');
}
/* a horta: plantar e regar num toque cada */
await abrir('sessoes=8&hora=15:00&tela=horta');
await espera(1200);
await toque(150, 520);
await espera(1400);
await toque(150, 520);
await espera(2600);
const horta = await page.evaluate(() => globalThis.littleStar.estado().horta);
if (!horta[1] || horta[1].regas.length !== 1) erros.push(`horta: esperava a cova 2 plantada e regada, achou ${JSON.stringify(horta)}`);
/* a porta escolhe entre as aventuras abertas */
await abrir('sessoes=8&hora=15:00&tela=casa');
await page.evaluate(() => globalThis.littleStar.mudar((e) => { e.aventuras = 2; e.aventurasPor = { jardim: 1, arvore: 1 }; }));
await page.evaluate(() => globalThis.littleStar.ir('casa'));
await espera(1500);
await toque(165, 564);
await espera(800);
await shot('33-porta-escolha');
await conta('porta: três aventuras', '[data-aventura]', 3);
/* a casa na festa junina e no Advento */
await abrir('sessoes=8&hora=15:00&dia=2026-06-20&tela=casa');
await espera(1200);
await shot('34-casa-junina');
await conta('junina: fogueira', '.fogueira');
await abrir('sessoes=8&hora=15:00&dia=2026-12-13&tela=casa');
await espera(1200);
await shot('35-casa-advento');

/* 5c. o relógio e a roda de manhã, com as duas perguntas da noite */
await abrir('sessoes=8&hora=15:00&tela=relogio');
await espera(1500);
await shot('36-relogio');
await conta('relógio: números', '.numero', 12);
await toque(90, 640);
await espera(1200);
await abrir('zerar=1&sessoes=8&hora=09:00');
await espera(1200);
await toque(195, 400);
await espera(1800);
await conta('roda de manhã: dormiu sozinha', '[data-obj="noite"]');
await shot('37-roda-manha');
await espera(2200);
await toque(195, 552);
await espera(4000);
const pedrinhas = await page.evaluate(() => globalThis.littleStar.estado().pedrinhas);
if (pedrinhas < 2) erros.push(`pedrinhas: dormir sozinha devia dar 2, o pote tem ${pedrinhas}`);

/* 6. o cantinho dos pais e o styleguide */
await abrir('sessoes=8&hora=15:00&tela=pais');
await espera(800);
const alvo = await page.locator('.pais p').first().innerText();
const numero = alvo.match(/número ([^.]+)\./)?.[1];
await page.getByRole('button', { name: numero, exact: true }).click();
await espera(600);
await shot('22-pais');
await conta('pais: vozes', '.voz', 40);
await page.goto(`${BASE}?styleguide=1`, { waitUntil: 'load' });
await espera(1200);
await shot('23-styleguide');

await browser.close();
servidor.kill();
if (erros.length) {
  console.error('Passeio com erros:\n' + erros.join('\n'));
  process.exit(1);
}
console.log('passeio ok: 37 capturas em docs/shots/');
