import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { corsHeaders, handleOgMeta } from "@/lib/ogMeta.server";

export const Route = createFileRoute("/api/public/og-meta")({
  server: {
    handlers: {
      GET: withApiLogging(
        "/api/public/og-meta",
        ({ request }) => handleOgMeta(request),
        { errorHeaders: corsHeaders as Record<string, string> },
      ),
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
    },
  },
});
