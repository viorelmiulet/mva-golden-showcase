import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, handleReceiveMailgunEmail } from "@/lib/receive-mailgun-email.server";

export const Route = createFileRoute("/api/public/receive-mailgun-email")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
      POST: ({ request }) => handleReceiveMailgunEmail(request),
    },
  },
});
