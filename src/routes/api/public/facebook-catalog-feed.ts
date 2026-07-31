import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

export const Route = createFileRoute("/api/public/facebook-catalog-feed")({
  server: {
    handlers: {
      OPTIONS: async () => new Response('ok', { headers: corsHeaders }),
      GET: withApiLogging("/api/public/facebook-catalog-feed", async ({ request }) => {
        const { handleFacebookCatalogFeed } = await import("@/lib/facebook-catalog-feed.server");
        return handleFacebookCatalogFeed(request);
      }, { errorHeaders: corsHeaders }),
    },
  },
});
