import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const base = process.env.VITE_BASE ?? '/little-star/';
const versao = (process.env.GITHUB_SHA ?? '').slice(0, 7) || 'dev';

export default defineConfig({
  base,
  define: { __VERSAO__: JSON.stringify(versao) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: false },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'icons/*.png', 'icons/*.svg', 'piano/*.mp3'],
      manifest: {
        name: 'Little Star',
        short_name: 'Little Star',
        description: 'A casa verde da Stella.',
        lang: 'pt-BR',
        display: 'fullscreen',
        orientation: 'portrait',
        theme_color: '#8FAE6B',
        background_color: '#C9DBB2',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,json,webmanifest,mp3}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
