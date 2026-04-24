import { defineConfig } from 'vite';

export default defineConfig({
  base: '/history-game/',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    open: true,
  },
});
