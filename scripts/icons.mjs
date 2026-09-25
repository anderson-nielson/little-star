// Gera os PNGs do manifesto a partir de public/icons/icon.svg com o Chromium do Playwright.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage();

async function render(tamanho, maskable) {
  await page.setViewportSize({ width: tamanho, height: tamanho });
  const escala = maskable ? 0.8 : 1;
  await page.setContent(
    `<html><body style="margin:0;background:#8FAE6B;width:${tamanho}px;height:${tamanho}px;display:grid;place-items:center">` +
      `<div style="width:${tamanho * escala}px;height:${tamanho * escala}px">${svg.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ')}</div></body></html>`,
  );
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: tamanho, height: tamanho } });
}

writeFileSync(new URL('../public/icons/icon-192.png', import.meta.url), await render(192, false));
writeFileSync(new URL('../public/icons/icon-512.png', import.meta.url), await render(512, false));
writeFileSync(new URL('../public/icons/icon-maskable-512.png', import.meta.url), await render(512, true));
await browser.close();
console.log('ícones gerados em public/icons');
