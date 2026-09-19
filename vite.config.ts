/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/*
  Brand loading video for the splash. Drop public/brand/loading.mp4 (plus
  optional loading.webm and loading-poster.jpg, the first frame) in and the
  next build uses it. No file, no <video> tag and no wasted request: the
  static logo splash stays. The poster shows at once, main.tsx decides when
  the clip plays.
*/
function splashVideo(): Plugin {
  const has = (ext: string, prefix = 'loading.') => existsSync(new URL(`./public/brand/${prefix}${ext}`, import.meta.url))
  return {
    name: 'kenneth-splash-video',
    transformIndexHtml(html) {
      const sources = [
        has('webm') && '<source src="/brand/loading.webm" type="video/webm" />',
        has('mp4') && '<source src="/brand/loading.mp4" type="video/mp4" />',
      ].filter(Boolean)
      if (sources.length === 0) return html
      const poster = has('poster.jpg', 'loading-') ? ' poster="/brand/loading-poster.jpg"' : ''
      const video = `<video id="splash-video" muted playsinline preload="auto"${poster}>${sources.join('')}</video>
        <script>
          if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.getElementById('splash').classList.add('has-video')
          }
        </script>`
      return html.replace('<!--splash-video-->', video)
    },
  }
}

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    tailwindcss(),
    splashVideo(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png', 'og.png'],
      manifest: {
        name: 'KENNETH',
        short_name: 'KENNETH',
        description: 'Cek kondisi parkir mall di Jakarta sebelum berangkat.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Black splash, the same field as the logo, so the icon sits on it without an edge.
        background_color: '#000000',
        theme_color: '#111512',
        categories: ['navigation', 'travel', 'utilities'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Firebase serves the Google sign-in handler under /__/auth. It must reach the network, not the app shell.
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            // Map styles, tiles, fonts and sprites: fast from cache, refreshed in the background.
            urlPattern: ({ url }) => url.origin === 'https://tiles.openfreemap.org',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  // MapLibre's worker is an ES module that imports a shared chunk.
  worker: { format: 'es' },
  build: {
    // maplibre and three are each ~1 MB unminified and already isolated in lazy chunks.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Big, rarely changing libraries get their own long-cached chunks.
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre'
          if (id.includes('/three/')) return 'three'
          if (/node_modules[\\/](firebase|@firebase)[\\/]/.test(id)) return 'firebase'
          if (/node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return 'react'
          if (/node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion'
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
