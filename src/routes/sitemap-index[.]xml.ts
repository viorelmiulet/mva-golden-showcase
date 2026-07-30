import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapIndex, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-index.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(buildSitemapIndex(), 3600, false);
        } catch (error) {
          console.error("/sitemap-index.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
