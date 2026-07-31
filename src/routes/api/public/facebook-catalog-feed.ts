import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const Route = createFileRoute("/api/public/facebook-catalog-feed")({
  server: {
    handlers: {
      OPTIONS: async () => new Response('ok', { headers: corsHeaders }),
      GET: async ({ request }) => {
        const { handleFacebookCatalogFeed } = await import("@/lib/facebook-catalog-feed.server");
        return handleFacebookCatalogFeed(request);
      },
    },
  },
});
