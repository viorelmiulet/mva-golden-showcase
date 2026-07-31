import { createFileRoute } from "@tanstack/react-router";
import { buildProprietatiSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-proprietati.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildProprietatiSitemap(), 3600, true);
        } catch (error) {
          console.error("/sitemap-proprietati.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
