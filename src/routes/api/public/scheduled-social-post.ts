import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { scheduledSocialPostCorsHeaders } from "@/lib/scheduled-social-post.server";

const run = withApiLogging("/api/public/scheduled-social-post", async () => {
  const { handleScheduledSocialPost } = await import("@/lib/scheduled-social-post.server");
  return handleScheduledSocialPost();
}, { errorHeaders: scheduledSocialPostCorsHeaders as Record<string, string> });

export const Route = createFileRoute("/api/public/scheduled-social-post")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: scheduledSocialPostCorsHeaders }),
      POST: run,
      GET: run,
    },
  },
});
