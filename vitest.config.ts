/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      globals: true,
      css: true,
      watch: false,
      coverage: {
        provider: 'istanbul',
        reporter: ['text'],
        include: ['src/**/*.{js,ts,jsx,tsx}'],
        exclude: ['src/**/*.{test,spec}.{js,ts}'],
      },
    },
  })
);
