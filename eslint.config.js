import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'dist-relativo/**', 'dev-dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', performance: 'readonly', requestAnimationFrame: 'readonly', localStorage: 'readonly', indexedDB: 'readonly', speechSynthesis: 'readonly', SpeechSynthesisUtterance: 'readonly', MediaRecorder: 'readonly', Blob: 'readonly', URL: 'readonly', Image: 'readonly', history: 'readonly', location: 'readonly', getComputedStyle: 'readonly', ResizeObserver: 'readonly', AudioContext: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', console: 'readonly', globalThis: 'readonly', alert: 'readonly', atob: 'readonly', btoa: 'readonly', matchMedia: 'readonly' } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
);
