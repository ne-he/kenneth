/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/**
 * Link previews name the site they are served from. index.html carries the team site's address; a build for
 * another site swaps in its own, picked by build mode (vite build --mode park) or by SITE_URL.
 */
const TEAM_SITE = 'https://kenneth-9339d.web.app'
const SITES: Record<string, string> = { park: 'https://park-kenneth.web.app' }

function siteUrl(): Plugin {
  let site: string | undefined
  return {
    name: 'kenneth-site-url',
    configResolved(config) {
      site = (process.env.SITE_URL ?? SITES[config.mode])?.replace(/\/$/, '')
    },
    transformIndexHtml: (html) => (site ? html.replaceAll(TEAM_SITE, site) : html),
  }
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    tailwindcss(),
    siteUrl(),
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
        // Ink splash, the same field as the icons, so the icon sits on it without an edge.
        background_color: '#121216',
        theme_color: '#121216',
        categories: ['navigation', 'travel', 'utilities'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The mascot is 164 KB of WebP and appears on offline screens too, so it is part of the install.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'mascot/*.webp'],
        // Kept out of the install, fetched on first use instead:
        // - Inter ships seven unicode-range subsets; the app renders Latin only. The others load if a glyph needs them.
        // - three (the 3D floor) and firebase (sign-in, shared reports) are lazy chunks most sessions never reach.
        //   The shell, map, list and booking stay fully precached; only those features need a connection the first time.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2', '**/three-*.js', '**/firebase-*.js'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Firebase serves the Google sign-in handler under /__/auth. It must reach the network, not the app shell.
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            // Vehicle icons: only the ones in use are fetched, then kept, so your own car shows offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/vehicles/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vehicle-icons',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 3600 },
            },
          },
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
          // Sign-in and shared data load apart: a place sheet fetching reports does not pull in the auth SDK.
          if (/node_modules[\\/](@firebase[\\/](firestore|webchannel-wrapper)|firebase[\\/]firestore)[\\/]/.test(id)) return 'firebase-firestore'
          if (/node_modules[\\/](@firebase[\\/]auth|firebase[\\/]auth)[\\/]/.test(id)) return 'firebase-auth'
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
