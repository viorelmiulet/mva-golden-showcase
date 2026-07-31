import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { CORS_HEADERS, handleReceiveMailgunEmail } from "@/lib/receive-mailgun-email.server";

export const Route = createFileRoute("/api/public/receive-mailgun-email")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: withApiLogging(
        "/api/public/receive-mailgun-email",
        ({ request }) => handleReceiveMailgunEmail(request),
        { errorHeaders: CORS_HEADERS as Record<string, string> },
      ),
    },
  },
});
