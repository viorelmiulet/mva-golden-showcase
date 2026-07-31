import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, handleOgImage } from "@/lib/ogImage.server";

export const Route = createFileRoute("/api/public/og-image")({
  server: {
    handlers: {
      GET: async ({ request }) => handleOgImage(request),
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
    },
  },
});
