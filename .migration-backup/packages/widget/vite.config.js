import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'NorskBot',
      formats: ['iife'],
      fileName: () => 'widget.min.js',
    },
    outDir: 'build',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        inlineIndex: true,
      },
    },
  },
  server: {
    port: 5173,
    cors: true,
  },
});
