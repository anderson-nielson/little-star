// Detector dos "objetos voando": um elemento SVG com atributo transform que
// recebe transform por CSS (.alvo pressionado, .respira...) perde o atributo e
// escorrega para o canto. Abre cada tela e confere todo alvo.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const PORTA = 5198;
const BASE = `http://localhost:${PORTA}/little-star/`;
const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
await espera(2500);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true })).newPage();
const telas = ['casa', 'roda', 'prato', 'som', 'caderno', 'palavra', 'areia', 'pinhas', 'piano', 'jardim', 'palco', 'bichos', 'despedida', 'noite', 'horta', 'arvore', 'cozinha', 'arvoregrande', 'lago', 'ukulele', 'lira', 'bonecas', 'bilhete', 'relogio'];
const problemas = [];
for (const t of telas) {
  await page.goto(`${BASE}?debug=1&hora=15:00`, { waitUntil: 'load' });
  await espera(600);
  await page.evaluate((t) => globalThis.littleStar.ir(t), t);
  await espera(1500);
  const r = await page.evaluate(async () => {
    const out = [];
    const nome = (el) => `${el.tagName} ${[...el.attributes].filter((a) => a.name.startsWith('data-') || a.name === 'class').map((a) => `${a.name}="${a.value}"`).join(' ')}`;
    const alvos = [...document.querySelectorAll('svg .alvo, svg .respira, svg .sobe, svg .surge')].filter((el) => el instanceof SVGGraphicsElement);
    for (const el of alvos) {
      const attr = el.getAttribute('transform');
      if (attr && attr.trim()) out.push(`${nome(el)} tem transform="${attr}" no atributo`);
    }
    /* e o teste de verdade: apertar cada alvo e ver se ele sai do lugar */
    for (const el of alvos.filter((a) => a.classList.contains('alvo'))) {
      const antes = el.getBoundingClientRect();
      if (!antes.width) continue;
      el.style.transition = 'none';
      el.classList.add('pressionado');
      const depois = el.getBoundingClientRect();
      el.classList.remove('pressionado');
      el.style.transition = '';
      const dx = Math.abs(antes.x + antes.width / 2 - (depois.x + depois.width / 2));
      const dy = Math.abs(antes.y + antes.height / 2 - (depois.y + depois.height / 2));
      if (dx > 4 || dy > 4) out.push(`${nome(el)} pula ${Math.round(dx)},${Math.round(dy)} px ao ser apertado`);
    }
    return out;
  });
  for (const x of r) problemas.push(`${t}: ${x}`);
}
await browser.close();
servidor.kill();
console.log(problemas.length ? problemas.join('\n') : 'nenhum alvo com transform no atributo');
process.exit(problemas.length ? 1 : 0);
