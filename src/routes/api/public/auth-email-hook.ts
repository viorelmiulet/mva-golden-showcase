import { createFileRoute } from "@tanstack/react-router";
import { authEmailHookCorsHeaders } from "@/lib/auth-email-hook.server";

export const Route = createFileRoute("/api/public/auth-email-hook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: authEmailHookCorsHeaders }),
      POST: async ({ request }) => {
        const url = new URL(request.url);

        if (url.pathname.endsWith("/preview")) {
          const { handleAuthEmailHookPreview } = await import("@/lib/auth-email-hook.server");
          return handleAuthEmailHookPreview(request);
        }

        try {
          const { handleAuthEmailHookWebhook } = await import("@/lib/auth-email-hook.server");
          return await handleAuthEmailHookWebhook(request);
        } catch (error) {
          console.error("Webhook handler error:", error);
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...authEmailHookCorsHeaders, "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
