import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, handleOgMeta } from "@/lib/ogMeta.server";

export const Route = createFileRoute("/api/public/og-meta")({
  server: {
    handlers: {
      GET: async ({ request }) => handleOgMeta(request),
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
    },
  },
});
