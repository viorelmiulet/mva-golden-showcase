import { createFileRoute, notFound } from "@tanstack/react-router";

/** Catch-all for unknown multi-segment paths — always a real 404, never a 200 with empty main. */
export const Route = createFileRoute("/$")({
  loader: async () => {
    if (typeof window === "undefined") {
      const { setSsrStatus } = await import("@/lib/responseStatus.server");
      setSsrStatus(404);
    }
    throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Pagina nu a fost găsită — MVA Imobiliare" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
});
