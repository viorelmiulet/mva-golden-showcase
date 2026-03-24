import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
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
