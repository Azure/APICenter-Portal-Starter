import path from 'path';
import { defineConfig } from 'vite';

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
});
