import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { CORS_HEADERS, handleMarketingWebhook } from "@/lib/marketing-webhook.server";

export const Route = createFileRoute("/api/public/marketing-webhook")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: withApiLogging(
        "/api/public/marketing-webhook",
        ({ request }) => handleMarketingWebhook(request),
        { errorHeaders: CORS_HEADERS as Record<string, string> },
      ),
    },
  },
});
