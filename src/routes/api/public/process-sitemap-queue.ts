import { createFileRoute } from "@tanstack/react-router";
import { processSitemapQueueCorsHeaders } from "@/lib/process-sitemap-queue.server";

export const Route = createFileRoute("/api/public/process-sitemap-queue")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: processSitemapQueueCorsHeaders }),
      POST: async () => {
        const { handleProcessSitemapQueue } = await import("@/lib/process-sitemap-queue.server");
        return handleProcessSitemapQueue();
      },
      GET: async () => {
        const { handleProcessSitemapQueue } = await import("@/lib/process-sitemap-queue.server");
        return handleProcessSitemapQueue();
      },
    },
  },
});
