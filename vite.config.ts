import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core — încărcat întotdeauna
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'query': ['@tanstack/react-query'],
          // UI — split separat față de vendor
          'ui-radix': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'forms': ['react-hook-form', 'zod'],
          // Lazy chunks — încărcate doar când sunt folosite
          'charts': ['recharts'],
          'pdf': ['jspdf', 'jspdf-autotable'],
          'excel': ['xlsx'],
          // Three.js e cel mai mare chunk (~500KB) — chunk separat pentru lazy import
          'three-core': ['three'],
          'three-fiber': ['@react-three/fiber', '@react-three/drei'],
        }
      }
    },
    chunkSizeWarningLimit: 400,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2, // A doua trecere reduce și mai mult dimensiunea
      },
      mangle: {
        safari10: true,
      },
    },
    // Activează CSS code splitting
    cssCodeSplit: true,
    // Raport detaliat pentru analiza bundle-ului
    reportCompressedSize: false, // Dezactivat pentru build mai rapid
    sourcemap: false, // Nu genera sourcemaps în producție
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}'],
        globIgnores: ['**/node_modules/**/*'],
        // Crește limita pentru chunks mari (three.js etc.)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/(?!storage).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude librăriile mari din pre-bundling — vor fi lazy loaded
    exclude: ['three', '@react-three/fiber', '@react-three/drei'],
  },
}));
