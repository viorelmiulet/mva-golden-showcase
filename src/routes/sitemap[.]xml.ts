import { createFileRoute } from "@tanstack/react-router";
import { buildStaticSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildStaticSitemap(), 86400, true);
        } catch (error) {
          console.error("/sitemap.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
