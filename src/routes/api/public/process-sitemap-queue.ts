import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { processSitemapQueueCorsHeaders } from "@/lib/process-sitemap-queue.server";

const run = withApiLogging("/api/public/process-sitemap-queue", async () => {
  const { handleProcessSitemapQueue } = await import("@/lib/process-sitemap-queue.server");
  return handleProcessSitemapQueue();
}, { errorHeaders: processSitemapQueueCorsHeaders as Record<string, string> });

export const Route = createFileRoute("/api/public/process-sitemap-queue")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: processSitemapQueueCorsHeaders }),
      POST: run,
      GET: run,
    },
  },
});
