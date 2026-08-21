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
          // Auth — the published worker has no env secrets, so fall back to the
          // runtime config table. Both values are accepted while they differ.
          const apiKey = request.headers.get("x-api-key");
          const { getRuntimeConfig } = await import("@/lib/runtimeConfig.server");
          const fromDb = await getRuntimeConfig("FB_QUEUE_API_KEY_DB");
          const accepted = [process.env.FB_QUEUE_API_KEY, fromDb].filter(Boolean) as string[];

          // Keys generated in Admin → Integrări (prefix mva_ext_) are also valid here.
          let authorized = !!apiKey && accepted.includes(apiKey);
          if (!authorized) {
            const { KEY_PREFIX, authenticateRequest } = await import("@/lib/extensionApi.server");
            const candidate = apiKey ?? (/^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") || "")?.[1] ?? "");
            if (candidate.trim().startsWith(KEY_PREFIX)) {
              const res = await authenticateRequest(request, `/fb-queue/${params._splat ?? ""}`);
              if (res.ok) authorized = true;
              else if (res.status === 429) return json({ error: "rate_limited" }, 429);
            }
          }
          if (!authorized && accepted.length === 0) {
            logger.error("fb-queue.misconfigured", { missingEnv: "FB_QUEUE_API_KEY" });
            return json({ error: "server not configured" }, 500);
          }
          if (!authorized) {
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

