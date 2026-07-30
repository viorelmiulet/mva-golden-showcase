// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        // jspdf@4 exports only "node"/"browser" conditions (no "default"), so the
        // workerd SSR build cannot resolve ".". Point straight at the ES build.
        // Exact-match regex + absolute path so the alias doesn't re-apply to its
        // own replacement ("jspdf/dist/..." also starts with "jspdf").
        {
          find: /^jspdf$/,
          replacement: fileURLToPath(new URL("./node_modules/jspdf/dist/jspdf.es.min.js", import.meta.url)),
        },
      ],
    },
  },
});
