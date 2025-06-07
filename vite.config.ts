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
    port: 3000
  }
});