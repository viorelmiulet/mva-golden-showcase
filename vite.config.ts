import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-mva.svg', 'favicon.png', 'mva-logo-complete.svg'],
      manifest: {
        name: 'MVA Imobiliare',
        short_name: 'MVA',
        description: 'Apartamente premium în Chiajna și vestul Bucureștiului',
        theme_color: '#DAA520',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        display_override: ['window-controls-overlay', 'standalone'],
        categories: ['business', 'lifestyle'],
        icons: [
          {
            src: '/favicon-mva.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon-mva.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/favicon-mva.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/favicon-mva.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'MVA Imobiliare Desktop'
          },
          {
            src: '/favicon-mva.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'MVA Imobiliare Mobile'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
