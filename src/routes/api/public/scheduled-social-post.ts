import { createFileRoute } from "@tanstack/react-router";
import { scheduledSocialPostCorsHeaders } from "@/lib/scheduled-social-post.server";

export const Route = createFileRoute("/api/public/scheduled-social-post")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: scheduledSocialPostCorsHeaders }),
      POST: async () => {
        const { handleScheduledSocialPost } = await import("@/lib/scheduled-social-post.server");
        return handleScheduledSocialPost();
      },
      GET: async () => {
        const { handleScheduledSocialPost } = await import("@/lib/scheduled-social-post.server");
        return handleScheduledSocialPost();
      },
    },
  },
});
