import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vite configuration file for the web playground application.
// Specifies web/index.html as the main entry point and dist as output directory.
export default defineConfig({
  root: resolve(__dirname, 'web'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
