import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

const run = withApiLogging("/api/public/process-email-queue", async () => {
  const { handleProcessEmailQueue } = await import("@/lib/process-email-queue.server");
  return handleProcessEmailQueue();
}, { errorHeaders: corsHeaders });

export const Route = createFileRoute("/api/public/process-email-queue")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: run,
      GET: run,
    },
  },
});
