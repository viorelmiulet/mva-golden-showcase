import { createFileRoute } from "@tanstack/react-router";
import { buildComplexesSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-complexe.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildComplexesSitemap(), 3600, true);
        } catch (error) {
          console.error("/sitemap-complexe.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
