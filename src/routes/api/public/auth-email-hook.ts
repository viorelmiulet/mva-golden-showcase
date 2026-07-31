import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";
import { authEmailHookCorsHeaders } from "@/lib/auth-email-hook.server";

export const Route = createFileRoute("/api/public/auth-email-hook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: authEmailHookCorsHeaders }),
      POST: withApiLogging("/api/public/auth-email-hook", async ({ request }) => {
        const { handleAuthEmailHookWebhook } = await import("@/lib/auth-email-hook.server");
        return await handleAuthEmailHookWebhook(request);
      }, { errorHeaders: authEmailHookCorsHeaders as Record<string, string> }),
    },
  },
});
