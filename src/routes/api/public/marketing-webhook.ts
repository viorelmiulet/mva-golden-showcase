import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, handleMarketingWebhook } from "@/lib/marketing-webhook.server";

export const Route = createFileRoute("/api/public/marketing-webhook")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: ({ request }) => handleMarketingWebhook(request),
    },
  },
});
