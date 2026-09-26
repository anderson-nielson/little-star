/**
 * Mede os sons das letras do sintetizador (src/audio/sintese-fonemas.ts):
 * renderiza cada um num OfflineAudioContext do Chromium e mostra duração,
 * pico e volume (rms). Serve para recalibrar a tabela VOLUME depois de mexer
 * numa receita. Uso: npm run fonemas (CHROMIUM=/caminho/do/chrome se preciso).
 */
import { chromium } from 'playwright-core';
import { build } from 'esbuild';

const saida = await build({ entryPoints: ['src/audio/sintese-fonemas.ts'], bundle: true, format: 'iife', globalName: 'Fonemas', write: false });
const js = saida.outputFiles[0].text;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage();
await p.setContent('<html></html>');
await p.addScriptTag({ content: js });
const r = await p.evaluate(async () => {
  const out = {};
  for (const id of Object.keys(Fonemas.RECEITAS)) {
    const sr = 44100;
    const ctx = new OfflineAudioContext(1, sr * 2, sr);
    const d = Fonemas.sintetizarSom(ctx, ctx.destination, id, 0.01, 1);
    const buf = await ctx.startRendering();
    const x = buf.getChannelData(0);
    let pk = 0, e = 0, nan = false, zc = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i]; if (Number.isNaN(v)) nan = true; pk = Math.max(pk, Math.abs(v)); e += v * v; if (i && (x[i-1] < 0) !== (v < 0)) zc++; }
    const n = Math.floor((d) * sr);
    out[id] = { dur: +d.toFixed(2), pico: +pk.toFixed(2), rms: +Math.sqrt(e / n).toFixed(3), zcr_hz: Math.round(zc / 2 / d), nan };
  }
  return out;
});
console.table(r);
await b.close();
