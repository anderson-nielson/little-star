// A varredura da casinha: joga cada tela de verdade, etapa por etapa, e confere
// que a casinha do canto esquerdo sempre leva de volta para a casa.
//
// Para cada tela, várias rodadas com sementes diferentes: ela joga um tanto de
// passos (o próximo passo que o chamado mostraria, um alvo qualquer, um
// arrasto, um tempo parada) e então toca a casinha com o dedo. Depois de cada
// passo, confere que nada cobre a casinha (o dedo que tocasse ali acertaria a
// casinha mesmo). Por fim, os casos de borda: a casinha tocada no meio de uma
// troca de tela, com o chamado ou o balão na tela, com as opções abertas, a
// noite, telas pequenas e grandes, e a volta inteira da sessão começando pela
// chegada, entrando em cada coisa da casa e voltando.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const PORTA = Number(process.env.PORTA ?? 5197);
const BASE = `http://localhost:${PORTA}/little-star/`;
const exe = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const PASTA = 'docs/shots/varredura';
mkdirSync(PASTA, { recursive: true });

const TELAS = [
  'chegada', 'roda', 'prato', 'som', 'caderno', 'palavra', 'areia', 'pinhas', 'piano', 'jardim', 'palco',
  'bichos', 'despedida', 'noite', 'dormindo', 'horta', 'arvore', 'cozinha', 'arvoregrande', 'lago', 'ukulele',
  'bonecas', 'bilhete', 'relogio', 'parquinho', 'escorregador', 'gangorra',
];
/* quantos passos ela joga antes de tocar a casinha, uma rodada para cada */
const PASSOS = (process.env.PASSOS ?? '0,3,8,16,30').split(',').map(Number);
const PARALELO = Number(process.env.PARALELO ?? 4);
const SO = process.env.TELAS ? process.env.TELAS.split(',') : null;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], { stdio: 'ignore' });
await espera(2500);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

const erros = [];
const visitadas = new Map();
let rodadas = 0;
let conferencias = 0;

function semente(n) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function novaPagina(viewport = { width: 390, height: 780 }, reducedMotion = 'no-preference') {
  const contexto = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true, reducedMotion });
  const page = await contexto.newPage();
  page.problemas = [];
  page.on('pageerror', (e) => page.problemas.push(`erro de página: ${e.message}`));
  return page;
}

const telaDe = (page) => page.evaluate(() => globalThis.littleStar?.telaAtual() ?? '');

async function abrir(page, nome, q = 'hora=15:00') {
  await page.goto(`${BASE}?debug=1&sessoes=8&${q}${nome ? `&tela=${nome}` : ''}`, { waitUntil: 'load' });
  for (let i = 0; i < 50 && !(await telaDe(page)); i++) await espera(100);
  await espera(900);
}

/* em que pé a tela está: a casinha, quem está por cima dela, e os lugares para tocar */
function olhar() {
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    }
    return true;
  };
  const centro = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const cortina = document.querySelector('.cortina.fechada') !== null;
  const tela = [...document.querySelectorAll('#app > .tela, #app > div')].filter((d) => !d.classList.contains('cortina') && !d.classList.contains('opcoes') && !d.classList.contains('chamado')).pop();
  const casas = [...document.querySelectorAll('#app .casinha')].filter(visivel);
  const casa = casas.pop();
  let cobre = null;
  let ponto = null;
  if (casa) {
    ponto = centro(casa);
    /* o meio e quatro pontos do disco: qualquer coisa invadindo a casinha rouba o dedo */
    const raio = casa.getBoundingClientRect().width / 2;
    for (const [dx, dy] of [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) {
      const x = ponto[0] + dx * raio;
      const y = ponto[1] + dy * raio;
      if (x < 4 || y < 4) continue;
      const quem = document.elementFromPoint(x, y);
      if (!quem || !quem.closest('.casinha')) {
        cobre = quem ? `${quem.tagName.toLowerCase()}.${String(quem.getAttribute('class') ?? '').replace(/\s+/g, '.')}` : 'nada';
        break;
      }
    }
  }
  const alvos = [...document.querySelectorAll('#app .alvo')]
    .filter((el) => el.tagName.toLowerCase() !== 'svg' && !el.closest('.topo') && !el.closest('.opcoes') && visivel(el))
    .map(centro)
    .filter(([x, y]) => x > 26 && x < innerWidth - 26 && y > 100 && y < innerHeight - 26);
  const marcados = [...document.querySelectorAll('#app [data-proximo], #app .pulsa, #app .luz-do-dia')]
    .filter((el) => !el.closest('.maozinha') && !el.closest('.chamado') && !el.closest('.topo') && visivel(el))
    .map(centro)
    .filter(([x, y]) => x > 26 && x < innerWidth - 26 && y > 100 && y < innerHeight - 26);
  const papel = [...document.querySelectorAll('#app canvas')].filter((c) => visivel(c) && c.getBoundingClientRect().width > innerWidth * 0.5).map((c) => {
    const r = c.getBoundingClientRect();
    return [r.left, Math.max(r.top, 110), r.right, r.bottom];
  })[0] ?? null;
  return { tela: globalThis.littleStar?.telaAtual() ?? '', cortina, casa: ponto, cobre, alvos, marcados, papel, temTela: !!tela };
}

async function toque(page, [x, y]) {
  await page.touchscreen.tap(x, y);
}
async function arrasto(page, [x0, y0], [x1, y1]) {
  const cdp = await page.context().newCDPSession(page);
  const passo = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await passo('touchStart', x0, y0);
  for (let i = 1; i <= 8; i++) {
    await passo('touchMove', x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8);
    await espera(25);
  }
  await passo('touchEnd');
  await cdp.detach();
}

/* um passo de brincadeira, como ela faria */
async function brincar(page, rnd, soDica = false) {
  const o = await page.evaluate(olhar);
  const vp = page.viewportSize();
  const r = soDica ? 0 : rnd();
  const escolhe = (l) => l[Math.floor(rnd() * l.length)];
  if (process.env.LOG) console.log('brincar', o.tela, r.toFixed(2), JSON.stringify({ m: o.marcados, a: o.alvos, p: o.papel }));
  /* o próximo passo que o próprio jogo mostraria: a mãozinha do chamado aponta, ela toca */
  if (r < 0.35) {
    const dica = await page.evaluate(async () => {
      globalThis.littleStar.chamado.chamar();
      await new Promise((ok) => setTimeout(ok, 60));
      const c = document.querySelector('.chamado.visivel');
      const m = c && /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(c.style.transform);
      return m ? [Number(m[1]), Number(m[2])] : null;
    });
    /* a dica final de toda tela é a casinha: essa fica para o fim da rodada */
    if (dica && !(o.casa && Math.hypot(dica[0] - o.casa[0], dica[1] - o.casa[1]) < 50)) return toque(page, dica);
    if (soDica) {
      if (o.alvos.length) return toque(page, o.alvos[Math.floor(rnd() * o.alvos.length)]);
      return toque(page, [vp.width / 2, vp.height * 0.55]);
    }
  }
  if (r < 0.6 && o.marcados.length) return toque(page, escolhe(o.marcados));
  if (r < 0.8 && o.alvos.length) return toque(page, escolhe(o.alvos));
  if (r < 0.9) {
    const [x0, y0, x1, y1] = o.papel ?? [30, 120, vp.width - 30, vp.height - 30];
    const p = () => [x0 + 10 + rnd() * (x1 - x0 - 20), y0 + 10 + rnd() * (y1 - y0 - 20)];
    return arrasto(page, p(), p());
  }
  if (r < 0.96) return toque(page, [30 + rnd() * (vp.width - 60), 120 + rnd() * (vp.height - 150)]);
  await espera(3000);
}

/* a casinha está livre para o dedo? espera a troca de tela terminar antes de julgar */
async function conferirCasinha(page, rotulo) {
  for (let i = 0; i < 30; i++) {
    const o = await page.evaluate(olhar);
    if (o.cortina) {
      await espera(150);
      continue;
    }
    if (o.tela === 'pais' || o.tela === 'styleguide') return o;
    conferencias++;
    if (!o.casa) {
      /* no meio de uma animação a casinha pode sumir por um instante; persiste? */
      if (i < 10) {
        await espera(200);
        continue;
      }
      erros.push(`${rotulo}: sem casinha na tela "${o.tela}"`);
      await page.screenshot({ path: `${PASTA}/sem-casinha-${o.tela}-${Date.now()}.png` });
      return o;
    }
    if (o.cobre) {
      if (i < 10) {
        await espera(200);
        continue;
      }
      erros.push(`${rotulo}: casinha coberta por ${o.cobre} na tela "${o.tela}"`);
      await page.screenshot({ path: `${PASTA}/coberta-${o.tela}-${Date.now()}.png` });
    }
    return o;
  }
  erros.push(`${rotulo}: a troca de tela não terminou`);
  return null;
}

/* toca a casinha e espera a casa */
async function voltar(page, rotulo, jeito = 'dedo') {
  const o = await conferirCasinha(page, rotulo);
  if (!o || !o.casa) return false;
  if (o.tela === 'casa') return true;
  if (process.env.LOG) console.log('voltar', JSON.stringify(o.casa), o.cobre);
  if (jeito === 'dedo') await toque(page, o.casa);
  else {
    await page.mouse.move(...o.casa);
    await page.mouse.down();
    await espera(60);
    await page.mouse.up();
  }
  for (let i = 0; i < 40; i++) {
    await espera(100);
    if ((await telaDe(page)) === 'casa') {
      /* e fica na casa: nenhuma brincadeira antiga puxa ela de volta depois */
      await espera(2000);
      const depois = await telaDe(page);
      if (depois === 'casa') return true;
      erros.push(`${rotulo}: chegou na casa, mas foi puxada para "${depois}"`);
      return false;
    }
  }
  const agora = await telaDe(page);
  erros.push(`${rotulo}: a casinha não voltou para a casa, ficou em "${agora}"`);
  await page.screenshot({ path: `${PASTA}/nao-voltou-${agora}-${Date.now()}.png` });
  return false;
}

/* uma rodada: abre a tela, joga `n` passos conferindo a casinha a cada um, toca a casinha */
async function rodada(page, nome, n, seed, q, params) {
  rodadas++;
  const rnd = semente(seed);
  if (params) {
    /* uma etapa que só se abre com parâmetros: da casa, como o jogo abre */
    await abrir(page, 'casa', q);
    await page.evaluate(([t, p]) => void globalThis.littleStar.ir(t, p), [nome, params]);
    for (let i = 0; i < 30 && (await telaDe(page)) !== nome; i++) await espera(100);
    await espera(900);
  } else await abrir(page, nome, q);
  const inicio = await telaDe(page);
  if (inicio !== nome) {
    erros.push(`${nome}: não abriu, foi para "${inicio}"`);
    return;
  }
  const vistas = visitadas.get(nome) ?? new Set([nome]);
  visitadas.set(nome, vistas);
  for (let k = 0; k < n; k++) {
    await brincar(page, rnd);
    await espera(350);
    const o = await conferirCasinha(page, `${nome} (passo ${k + 1}/${n}, semente ${seed})`);
    if (!o) return;
    vistas.add(o.tela);
    /* a brincadeira terminou sozinha e voltou para a casa: também é chegar */
    if (o.tela === 'casa') return;
    /* o cantinho dos pais (a lua segurada): não é dela; volta de lá pelo roteador */
    if (o.tela === 'pais') return;
  }
  const antes = await telaDe(page);
  await voltar(page, `${nome} → ${antes} (depois de ${n} passos, semente ${seed})`);
}

async function emParalelo(tarefas, { viewport, reducedMotion } = {}) {
  const fila = [...tarefas];
  await Promise.all(
    Array.from({ length: Math.min(PARALELO, fila.length) }, async () => {
      const page = await novaPagina(viewport, reducedMotion);
      while (fila.length) {
        const t = fila.shift();
        try {
          await t(page);
        } catch (e) {
          erros.push(`falha no teste: ${e.message}`);
        }
      }
      for (const p of page.problemas) erros.push(p);
      await page.context().close();
    }),
  );
}

/* 1. cada tela, jogada até várias profundidades */
const tarefas = [];
for (const nome of SO ?? TELAS) {
  const q = nome === 'noite' || nome === 'dormindo' ? 'hora=20:40' : 'hora=15:00';
  PASSOS.forEach((n, i) => tarefas.push((page) => rodada(page, nome, n, 1000 * (i + 1) + nome.length, q)));
}
/* as etapas que a tela abre com parâmetros: a mesa das pinhas, o som do dia pelo mural, outras palavras */
const ETAPAS = [
  ['pinhas', { mesa: '1' }],
  ['som', { volta: 'casa' }],
  ['palavra', { palavra: 'AVÓ', volta: 'casa' }],
  ['palavra', { palavra: 'ELA', volta: 'caderno' }],
];
for (const [nome, params] of ETAPAS) {
  if (SO && !SO.includes(nome)) continue;
  PASSOS.forEach((n, i) => tarefas.push((page) => rodada(page, nome, n, 3000 * (i + 1) + nome.length, 'hora=15:00', params)));
}
console.log(`jogando ${tarefas.length} rodadas...`);
await emParalelo(tarefas);

/* 1b. a casinha tocada logo depois de um passo, sem esperar a cena terminar, e com
   as animações reduzidas (a troca de tela é instantânea): é aí que uma brincadeira
   que termina com atraso puxava ela de volta da casa */
const rapidas = [];
for (const nome of SO ?? TELAS) {
  const q = nome === 'noite' || nome === 'dormindo' ? 'hora=20:40' : 'hora=15:00';
  /* seguindo a dica do jogo, passo a passo: em algum `n` a etapa termina, e a casinha vem junto */
  for (const n of [1, 2, 3, 4, 5, 6, 8, 11]) {
    rapidas.push(async (page) => {
      rodadas++;
      const rnd = semente(7000 + n * 31 + nome.length);
      await abrir(page, nome, q);
      for (let k = 0; k < n; k++) {
        await brincar(page, rnd, true);
        await espera(k === n - 1 ? 60 + (n % 3) * 90 : 450);
        const agora = await telaDe(page);
        if (agora === 'casa' || agora === 'pais') return;
      }
      await voltar(page, `${nome} (casinha logo depois do passo ${n}, animações reduzidas)`);
    });
  }
}
console.log(`casinha às pressas: ${rapidas.length} rodadas...`);
await emParalelo(rapidas, { reducedMotion: 'reduce' });

{
  /* 2. os casos de borda, em cada tela */
  const borda = [];
  for (const nome of SO ?? TELAS) {
    const q = nome === 'noite' || nome === 'dormindo' ? 'hora=20:40' : 'hora=15:00';
    /* a casinha tocada logo que a tela nova aparece, com a cortina ainda abrindo */
    borda.push(async (page) => {
      await abrir(page, 'casa', q);
      await page.evaluate((n) => void globalThis.littleStar.ir(n), nome);
      await espera(520);
      const o = await page.evaluate(olhar);
      if (o.casa) await toque(page, o.casa);
      for (let i = 0; i < 40 && (await telaDe(page)) !== nome && (await telaDe(page)) !== 'casa'; i++) await espera(100);
      await espera(400);
      const agora = await telaDe(page);
      if (agora !== 'casa') await voltar(page, `${nome}: casinha logo na entrada`);
    });
    /* com o chamado (a mãozinha) na tela */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      await page.evaluate(() => globalThis.littleStar.chamado.chamar());
      await espera(600);
      await voltar(page, `${nome}: com o chamado na tela`);
    });
    /* com o balão da narração aberto */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      await page.evaluate(() => globalThis.littleStar.balao.mostrar('Um balão para ler junto, comprido o bastante para ocupar duas ou três linhas do alto.'));
      await espera(900);
      await voltar(page, `${nome}: com o balão aberto`);
    });
    /* com o mouse, para o tablet com caneta e o computador */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      await voltar(page, `${nome}: com o mouse`, 'mouse');
    });
    /* com o dedo segurando outra coisa: um arrasto que não termina, e a casinha com outro dedo */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      const o = await page.evaluate(olhar);
      const cdp = await page.context().newCDPSession(page);
      const vp = page.viewportSize();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vp.width / 2, y: vp.height * 0.6, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vp.width / 2 + 30, y: vp.height * 0.6 + 20, id: 1 }] });
      if (o.casa) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vp.width / 2 + 30, y: vp.height * 0.6 + 20, id: 1 }, { x: o.casa[0], y: o.casa[1], id: 2 }] });
        await espera(80);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: vp.width / 2 + 30, y: vp.height * 0.6 + 20, id: 1 }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      for (let i = 0; i < 30 && (await telaDe(page)) !== 'casa'; i++) await espera(100);
      if ((await telaDe(page)) !== 'casa') await voltar(page, `${nome}: casinha com outro dedo na cena`);
    });
    /* o "voltar" do aparelho no meio de uma troca de tela */
    borda.push(async (page) => {
      await abrir(page, 'casa', q);
      await page.evaluate((n) => void globalThis.littleStar.ir(n), nome);
      await espera(200);
      await page.goBack();
      for (let i = 0; i < 40 && (await telaDe(page)) !== 'casa'; i++) await espera(100);
      await espera(1500);
      const agora = await telaDe(page);
      if (agora !== 'casa') erros.push(`${nome}: o voltar do aparelho no meio da troca não levou para a casa, ficou em "${agora}"`);
    });
    /* o "voltar" do aparelho */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      await page.goBack();
      for (let i = 0; i < 30 && (await telaDe(page)) !== 'casa'; i++) await espera(100);
      if ((await telaDe(page)) !== 'casa') erros.push(`${nome}: o voltar do aparelho não levou para a casa, ficou em "${await telaDe(page)}"`);
    });
    /* as opções abertas: um toque fora fecha, o seguinte volta para a casa */
    borda.push(async (page) => {
      await abrir(page, nome, q);
      await page.locator('.opcoes-botao').tap();
      await espera(500);
      const o = await page.evaluate(olhar);
      if (o.casa) await toque(page, o.casa);
      await espera(500);
      if (await page.evaluate(() => globalThis.littleStar.opcoes.aberto())) erros.push(`${nome}: tocar fora não fechou as opções`);
      await voltar(page, `${nome}: depois de fechar as opções`);
    });
  }
  console.log(`casos de borda: ${borda.length}...`);
  await emParalelo(borda);

  /* 3. tamanhos de tela: celular pequeno, grande, tablet e deitado */
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 412, height: 915 },
    { width: 768, height: 1024 },
    { width: 780, height: 390 },
  ]) {
    const tamanhos = (SO ?? TELAS).map((nome) => async (page) => {
      await abrir(page, nome, nome === 'noite' || nome === 'dormindo' ? 'hora=20:40' : 'hora=15:00');
      const rnd = semente(viewport.width + nome.length);
      for (let k = 0; k < 4; k++) {
        await brincar(page, rnd);
        await espera(300);
      }
      if ((await telaDe(page)) !== 'casa') await voltar(page, `${nome} em ${viewport.width}x${viewport.height}`);
    });
    console.log(`em ${viewport.width}x${viewport.height}...`);
    await emParalelo(tamanhos, { viewport });
  }

  /* 4. a volta inteira: a sessão começa na chegada; em cada parte, a casinha; da casa, cada coisa aberta e a volta */
  if (!SO) {
    const page = await novaPagina();
    await abrir(page, null, 'zerar=1&hora=15:00');
    const partes = await page.evaluate(() => globalThis.littleStar.sessao.partes);
    for (const parte of partes) {
      await page.evaluate((p) => globalThis.littleStar.sessao.irPara(p), parte);
      await espera(1200);
      if ((await telaDe(page)) !== 'casa') await voltar(page, `sessão nova, parte "${parte}"`);
    }
    await abrir(page, null, 'hora=15:00');
    for (let i = 0; i < 60 && (await telaDe(page)) !== 'casa'; i++) {
      await voltar(page, 'sessão do dia, direto para a casa');
    }
    await page.evaluate(() => globalThis.littleStar.mudar((e) => void (e.pais.narracao = false)));
    const coisas = await page.evaluate(() => [...document.querySelectorAll('#app [data-alvo]')].map((el) => el.getAttribute('data-alvo')).filter((a) => a && a !== 'casa'));
    for (const coisa of [...new Set(coisas)]) {
      if ((await telaDe(page)) !== 'casa') await voltar(page, 'antes de entrar');
      const el = page.locator(`#app [data-alvo="${coisa}"]`).first();
      const caixa = await el.boundingBox();
      if (!caixa) continue;
      await toque(page, [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2]);
      await espera(2200);
      const dentro = await telaDe(page);
      if (dentro === 'casa') continue;
      const vistas = visitadas.get(`casa→${coisa}`) ?? new Set();
      vistas.add(dentro);
      visitadas.set(`casa→${coisa}`, vistas);
      await voltar(page, `da casa, pela coisa "${coisa}" (tela "${dentro}")`);
    }
    for (const p of page.problemas) erros.push(p);
    await page.context().close();
  }
}

await browser.close();
servidor.kill();

console.log('\ntelas por onde a brincadeira passou:');
for (const [nome, v] of visitadas) console.log(`  ${nome}: ${[...v].join(', ')}`);
if (erros.length) {
  console.error(`\nA casinha falhou (${erros.length}):\n` + [...new Set(erros)].join('\n'));
  process.exit(1);
}
console.log(`\nvarredura ok: ${rodadas} rodadas jogadas, ${conferencias} conferências da casinha, e os casos de borda`);
