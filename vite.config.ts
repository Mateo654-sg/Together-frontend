import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Together — Finanzas de Pareja',
        short_name: 'Together',
        description: 'La aplicación inteligente para administrar las finanzas de una pareja.',
        id: '/',
        lang: 'es',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
        shortcuts: [
          {
            name: 'Nuevo gasto',
            short_name: 'Nuevo gasto',
            description: 'Registrar un gasto rápidamente',
            url: '/expenses/new',
            icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Nuevo ingreso',
            short_name: 'Nuevo ingreso',
            description: 'Registrar un ingreso rápidamente',
            url: '/incomes/new',
            icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        categories: ['finance', 'lifestyle'],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
