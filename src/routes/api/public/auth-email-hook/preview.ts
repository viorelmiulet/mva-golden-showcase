import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth-email-hook/preview")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const { handleAuthEmailHookPreview } = await import("@/lib/auth-email-hook.server");
        return handleAuthEmailHookPreview(request);
      },
      POST: async ({ request }) => {
        const { handleAuthEmailHookPreview } = await import("@/lib/auth-email-hook.server");
        return handleAuthEmailHookPreview(request);
      },
    },
  },
});
