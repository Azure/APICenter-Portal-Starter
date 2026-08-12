import path from 'path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  publicDir: './src/public',
  define: {
    'process.env': {},
  },
  css: {
    preprocessorMaxWorkers: true,
  },
  build: {
    // Suppress empty rule "{}" warnings from third-party CSS (api-docs-ui)
    cssMinify: 'esbuild',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        entraidRedirect: fileURLToPath(new URL('./entraid-redirect.html', import.meta.url)),
      },
    },
  },
  esbuild: {
    logOverride: {
      'css-syntax-error': 'silent',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      querystring: 'qs',
    },
  },
  test: {
    environment: 'jsdom',
  },
});
