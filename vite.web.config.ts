import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Vite configuration for CLEO web application target.
// Bundles index.html (Playground), marketplace.html, and blog.html to dist output.
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'web'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
        marketplace: resolve(__dirname, 'web/marketplace.html'),
        blog: resolve(__dirname, 'web/blog.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

