import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: withApiLogging("/api/public/track", async ({ request }) => {
        const { handleTrack } = await import("@/lib/track.server");
        return handleTrack(request);
      }, { errorHeaders: corsHeaders }),
    },
  },
});
