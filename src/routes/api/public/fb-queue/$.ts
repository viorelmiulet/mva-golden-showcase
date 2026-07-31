import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key, authorization, apikey, x-request-id",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/fb-queue/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response("ok", { headers: corsHeaders }),
      POST: withApiLogging(
        "/api/public/fb-queue",
        async ({ request, params, logger }: any) => {
          // Auth
          const apiKey = request.headers.get("x-api-key");
          const expected = process.env.FB_QUEUE_API_KEY;
          if (!expected) {
            logger.error("fb-queue.misconfigured", { missingEnv: "FB_QUEUE_API_KEY" });
            return json({ error: "server not configured" }, 500);
          }
          if (!apiKey || apiKey !== expected) {
            logger.warn("fb-queue.unauthorized", {});
            return json({ error: "unauthorized" }, 401);
          }

          const seg = params._splat ?? "";
          logger.info("fb-queue.action", { action: seg });

          let body: any = {};
          try {
            const text = await request.text();
            body = text ? JSON.parse(text) : {};
          } catch {
            logger.warn("fb-queue.invalid_json", {});
            return json({ error: "invalid json" }, 400);
          }

          try {
            const { handleNext, handleResult } = await import("@/lib/fb-queue.server");
            if (seg === "next") return await handleNext(body);
            if (seg === "result") return await handleResult(body);
            logger.warn("fb-queue.unknown_action", { action: seg });
            return json({ error: "not found" }, 404);
          } catch (e) {
            logger.error("fb-queue.handler_error", {
              action: seg,
              error: String((e as Error).message ?? e),
            });
            return json({ error: String((e as Error).message ?? e) }, 500);
          }
        },
        { errorHeaders: corsHeaders },
      ),
    },
  },
});

