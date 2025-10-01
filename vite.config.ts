import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  pwa: {
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },
  },
  server: {
    open: true,
    hot: true,
  },
});