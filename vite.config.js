import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const isPages = process.env.GITHUB_PAGES === '1' || process.env.CI === 'true'
const base = isPages ? '/Pirs-Web/' : '/'

export default defineConfig({
  // Local: `/`. GitHub Pages / CI / explicit deploy: `/Pirs-Web/`
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
      ],
      manifest: {
        id: base,
        name: 'پرس — یاریی پرسیار',
        short_name: 'پرس',
        description: 'پرس — یاریی پرسیار. کویز، کۆد، تایمەر و لیدەربۆرد.',
        lang: 'ckb',
        dir: 'rtl',
        theme_color: '#46178f',
        background_color: '#46178f',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        start_url: base,
        scope: base,
        categories: ['games', 'education', 'entertainment'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache shell + core UI; Firebase/fonts load on demand via runtime cache
        globPatterns: ['**/*.{html,ico,png,svg,webmanifest,css,js}'],
        globIgnores: [
          '**/firebase-*.js',
          '**/fonts-*.js',
          '**/fonts-*.css',
          '**/*vazirmatn*',
          '**/*bricolage*',
          '**/CreateQuizPage-*.js',
          '**/AuthPage-*.js',
          '**/LobbyPage-*.js',
          '**/HostPage-*.js',
          '**/PlayPage-*.js',
          '**/ResultsPage-*.js',
        ],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/firebase-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pirs-firebase',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'font' || /\.woff2?$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pirs-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: ({ url }) => /\/assets\/.+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pirs-assets',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('googleapis.com') ||
              url.hostname.includes('gstatic.com') ||
              url.hostname.includes('firestore.googleapis.com') ||
              url.hostname.includes('identitytoolkit.googleapis.com') ||
              url.hostname.includes('securetoken.googleapis.com'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react'
          }
          if (id.includes('@fontsource-variable')) return 'fonts'
        },
      },
    },
  },
})
