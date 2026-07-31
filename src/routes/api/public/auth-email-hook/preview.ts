import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const handle = withApiLogging("/api/public/auth-email-hook/preview", async ({ request }) => {
  const { handleAuthEmailHookPreview } = await import("@/lib/auth-email-hook.server");
  return handleAuthEmailHookPreview(request);
});

export const Route = createFileRoute("/api/public/auth-email-hook/preview")({
  server: {
    handlers: {
      OPTIONS: handle,
      POST: handle,
    },
  },
});
