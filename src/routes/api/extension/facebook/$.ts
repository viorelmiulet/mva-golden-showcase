import { createFileRoute } from "@tanstack/react-router";

/** Alias of /api/public/extension/facebook/* for callers using the short path. */
export const Route = createFileRoute("/api/extension/facebook/$")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { extensionCorsHeaders } = await import("@/lib/extensionApiRouter.server");
        return new Response("ok", { headers: extensionCorsHeaders });
      },
      GET: async ({ request, params }: any) => {
        const { handleExtensionRequest } = await import("@/lib/extensionApiRouter.server");
        return handleExtensionRequest(request, params._splat ?? "");
      },
      POST: async ({ request, params }: any) => {
        const { handleExtensionRequest } = await import("@/lib/extensionApiRouter.server");
        return handleExtensionRequest(request, params._splat ?? "");
      },
    },
  },
});
