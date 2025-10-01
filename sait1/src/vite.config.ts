import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react({
      // Включаем Fast Refresh для лучшего опыта разработки
      fastRefresh: true,
      // Включаем поддержку JSX runtime
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    // Улучшенная обработка HMR
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Оптимизация для продакшена
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '@components': fileURLToPath(new URL('./components', import.meta.url)),
      '@styles': fileURLToPath(new URL('./styles', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
      '@lib': fileURLToPath(new URL('./lib', import.meta.url))
    }
  },
  // Современная конфигурация для ES модулей
  esbuild: {
    target: 'esnext',
    format: 'esm'
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
