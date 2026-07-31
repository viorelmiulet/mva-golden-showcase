import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
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

      GET: async () => {
        try {
          const { syncImmoflux } = await import("@/lib/immoflux.server");
          const result = await syncImmoflux({ status: "1" });
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return json({ ok: false, error: message }, 500);
        }
      },

      POST: async () => {
        try {
          const { syncImmoflux } = await import("@/lib/immoflux.server");
          const result = await syncImmoflux({});
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("[immoflux-sync] failed", error);
          return json({ success: false, error: message }, 500);
        }
      },
    },
  },
});
