/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    pool: 'threads'
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://165.22.103.4:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://165.22.103.4:3000',
        changeOrigin: true
      }
    }
  },
});
