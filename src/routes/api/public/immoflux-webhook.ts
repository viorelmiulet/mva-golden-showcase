import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, handleImmofluxWebhook } from "@/lib/immoflux-webhook.server";

export const Route = createFileRoute("/api/public/immoflux-webhook")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: ({ request }) => handleImmofluxWebhook(request),
    },
  },
});
