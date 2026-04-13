import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";
import vitePrerender from "vite-plugin-prerender";

async function fetchSlugs(): Promise<string[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY – skipping dynamic routes');
    return [];
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/catalog_offers?select=slug&is_published=eq.true&availability_status=eq.available&slug=not.is.null&limit=5000`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('[prerender] Failed to fetch slugs:', res.status);
      return [];
    }

    const rows = (await res.json()) as { slug: string }[];
    return rows.map((r) => r.slug).filter(Boolean);
  } catch (e) {
    console.warn('[prerender] Error fetching slugs:', e);
    return [];
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const slugs = mode === 'production' ? await fetchSlugs() : [];

  const staticRoutes = ['/', '/anunturi', '/despre-noi', '/contact'];
  const dynamicRoutes = slugs.map((s) => `/anunturi/${s}`);
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  if (mode === 'production') {
    console.log(`[prerender] ${allRoutes.length} routes (${staticRoutes.length} static + ${dynamicRoutes.length} dynamic)`);
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
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

            if (id.includes("@elevenlabs") || id.includes("livekit-client") || id.includes("hls.js") || id.includes("@mediapipe") || id.includes("stats-gl") || id.includes("@livekit")) {
              return "voice-agent";
            }

            if (id.includes("html2canvas")) {
              return "html2canvas";
            }

            if (id.includes("qrcode")) {
              return "qrcode";
            }

            if (id.includes("react-signature-canvas")) {
              return "signature";
            }

            if (id.includes("web-vitals")) {
              return "web-vitals";
            }

            return "vendor";
          },
        }
      },
      chunkSizeWarningLimit: 400,
      target: 'esnext',
      minify: 'terser' as const,
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
      mode === 'production' && vitePrerender({
        routes: allRoutes,
        renderAfterTime: 2000,
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
  };
});
