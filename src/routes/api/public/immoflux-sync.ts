import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Background sync endpoint for Immoflux.
 *
 * GET  -> current sync status (cheap, safe for UI polling)
 * POST -> runs the full sync server-side. Callers (admin UI, pg_cron) do not
 *         need to wait for the response; progress/result is persisted in
 *         site_settings.immoflux_sync_status and can be read via GET.
 */
export const Route = createFileRoute("/api/public/immoflux-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: withApiLogging("/api/public/immoflux-sync", async ({ logger }) => {
        try {
          const { syncImmoflux } = await import("@/lib/immoflux.server");
          const result = await syncImmoflux({ status: "1" });
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          logger.error("immoflux.status_failed", { error: message });
          return json({ ok: false, error: message, requestId: logger.requestId }, 500);
        }
      }, { errorHeaders: corsHeaders }),

      POST: withApiLogging("/api/public/immoflux-sync", async ({ logger }) => {
        const started = Date.now();
        try {
          const { syncImmoflux } = await import("@/lib/immoflux.server");
          const result = await syncImmoflux({});
          logger.info("immoflux.sync_completed", { ms: Date.now() - started });
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          logger.error("immoflux.sync_failed", { error: message, ms: Date.now() - started });
          return json({ success: false, error: message, requestId: logger.requestId }, 500);
        }
      }, { errorHeaders: corsHeaders }),
    },
  },
});
