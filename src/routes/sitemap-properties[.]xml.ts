import { createFileRoute } from "@tanstack/react-router";
import { buildPropertiesSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-properties.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildPropertiesSitemap(), 3600, true);
        } catch (error) {
          console.error("/sitemap-properties.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
