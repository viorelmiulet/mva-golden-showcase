import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { corsHeaders, handleOgImage } from "@/lib/ogImage.server";

export const Route = createFileRoute("/api/public/og-image")({
  server: {
    handlers: {
      GET: withApiLogging(
        "/api/public/og-image",
        ({ request }) => handleOgImage(request),
        { errorHeaders: corsHeaders as Record<string, string> },
      ),
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
    },
  },
});
