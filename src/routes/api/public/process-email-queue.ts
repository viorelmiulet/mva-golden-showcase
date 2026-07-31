import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const Route = createFileRoute("/api/public/process-email-queue")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async () => {
        const { handleProcessEmailQueue } = await import("@/lib/process-email-queue.server");
        return handleProcessEmailQueue();
      },
      GET: async () => {
        const { handleProcessEmailQueue } = await import("@/lib/process-email-queue.server");
        return handleProcessEmailQueue();
      },
    },
  },
});
