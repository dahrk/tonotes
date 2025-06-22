import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: false,
    minify: 'terser',
    rollupOptions: {
      external: ['electron'],
      input: {
        main: path.resolve(__dirname, 'index.html'),
        search: path.resolve(__dirname, 'search.html'),
        settings: path.resolve(__dirname, 'settings.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-task-list', '@tiptap/extension-task-item']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
});