import { createFileRoute } from "@tanstack/react-router";
import { buildNewsSitemap, xmlResponse } from "@/lib/sitemap.server";

export const Route = createFileRoute("/news-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return xmlResponse(await buildNewsSitemap(), 3600, false);
        } catch (error) {
          console.error("/news-sitemap.xml generation failed:", error);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
