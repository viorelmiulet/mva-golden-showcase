import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { CORS_HEADERS, handleImmofluxWebhook } from "@/lib/immoflux-webhook.server";

export const Route = createFileRoute("/api/public/immoflux-webhook")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: withApiLogging(
        "/api/public/immoflux-webhook",
        ({ request }) => handleImmofluxWebhook(request),
        { errorHeaders: CORS_HEADERS as Record<string, string> },
      ),
    },
  },
});
