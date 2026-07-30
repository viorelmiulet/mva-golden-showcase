import { createFileRoute } from "@tanstack/react-router";
import { buildImmofluxSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-immoflux.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildImmofluxSitemap(), 3600, true);
        } catch (error) {
          console.error("/sitemap-immoflux.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
