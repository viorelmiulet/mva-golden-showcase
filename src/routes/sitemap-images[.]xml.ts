import { createFileRoute } from "@tanstack/react-router";
import { buildImagesSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-images.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildImagesSitemap(), 3600, true);
        } catch (error) {
          console.error("/sitemap-images.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
