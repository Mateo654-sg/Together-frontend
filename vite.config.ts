import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const srcDir = new URL('./src', import.meta.url).pathname;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Together — Finanzas de Pareja',
        short_name: 'Together',
        description: 'La aplicación inteligente para administrar las finanzas de una pareja.',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['finance', 'lifestyle'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: {
      '@': srcDir,
      '@features': `${srcDir}/features`,
      '@shared': `${srcDir}/shared`,
      '@styles': `${srcDir}/styles`,
      '@config': `${srcDir}/config`,
      '@types': `${srcDir}/types`,
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
