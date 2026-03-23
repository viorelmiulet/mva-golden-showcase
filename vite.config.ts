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
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-dom") || id.includes("scheduler") || id.includes("react/jsx-runtime") || /node_modules\/react\//.test(id)) {
            return "react-core";
          }

          if (id.includes("react-router") || id.includes("@remix-run")) {
            return "router";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (id.includes("@supabase/supabase-js") || id.includes("@supabase/auth-js") || id.includes("@supabase/postgrest-js") || id.includes("@supabase/realtime-js") || id.includes("@supabase/functions-js") || id.includes("@supabase/storage-js")) {
            return "backend";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }

          if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
            return "forms";
          }

          if (id.includes("@tiptap")) {
            return "editor";
          }

          if (id.includes("jspdf") || id.includes("jspdf-autotable") || id.includes("docx") || id.includes("jszip") || id.includes("pdf-parse")) {
            return "documents";
          }

          if (id.includes("xlsx")) {
            return "spreadsheet";
          }

          if (id.includes("three") || id.includes("@react-three")) {
            return "three";
          }

          if (id.includes("date-fns")) {
            return "date-utils";
          }

          if (id.includes("react-helmet-async") || id.includes("sonner") || id.includes("next-themes")) {
            return "app-shell";
          }

          return "vendor";
        },
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
      }
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
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
        // Skip caching for large chunks that change frequently
        globIgnores: [
          '**/node_modules/**/*',
          '**/assets/charts-*.js',
          '**/assets/charts-*.js.gz',
          '**/assets/charts-*.js.br',
          '**/assets/documents-*.js',
          '**/assets/documents-*.js.gz',
          '**/assets/documents-*.js.br',
          '**/assets/spreadsheet-*.js',
          '**/assets/spreadsheet-*.js.gz',
          '**/assets/spreadsheet-*.js.br',
          '**/assets/three-*.js',
          '**/assets/three-*.js.gz',
          '**/assets/three-*.js.br',
        ],
        runtimeCaching: [
          // Cache-first for static assets (images, fonts, etc.)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache-first for Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache-first for Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache-first for JS/CSS chunks (versioned by build)
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Stale-while-revalidate for Supabase API calls
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Stale-while-revalidate for Supabase storage (images)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    // Gzip compression for assets
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),
    // Brotli compression for assets (better compression ratio)
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
  },
}));
