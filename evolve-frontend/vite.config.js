import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Evolve — The AI Companion That Grows With You',
        short_name: 'Evolve',
        description: 'An AI companion that remembers, grows, and becomes part of your life.',
        theme_color: '#0B0E14',
        background_color: '#0B0E14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + static assets cached for offline install.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
        // Without these two, a redeploy leaves any already-open tab still
        // controlled by the OLD service worker (clientsClaim) and its
        // stale precache manifest never gets purged (cleanupOutdatedCaches)
        // — that combo is what was showing the offline fallback on a real,
        // connected network: the old worker was misfiring against a build
        // that no longer matches what's deployed.
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Never cache API calls — chat/credits/memories must always be fresh.
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
