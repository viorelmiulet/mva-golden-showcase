import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-request-id",
  "Cache-Control": "no-store",
};

/**
 * GET /api/public/health          -> full report (all checks)
 * GET /api/public/health?check=db -> single check (database|configuration|queues|immoflux_sync)
 * HEAD /api/public/health         -> liveness only, no backend calls
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      HEAD: async () => new Response(null, { status: 200, headers: corsHeaders }),

      GET: withApiLogging("/api/public/health", async ({ request, logger }) => {
        const { HEALTH_CHECKS, PUBLIC_ENDPOINTS, rollup, statusCode } = await import(
          "@/lib/health.server"
        );
        const url = new URL(request.url);
        const requested = url.searchParams.get("check");
        const names = requested
          ? Object.keys(HEALTH_CHECKS).filter((n) => n === requested || n.startsWith(requested))
          : Object.keys(HEALTH_CHECKS);

        if (!names.length) {
          return new Response(
            JSON.stringify({ ok: false, error: `Unknown check "${requested}"`, available: Object.keys(HEALTH_CHECKS) }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const checks = await Promise.all(names.map((n) => HEALTH_CHECKS[n]()));
        const status = rollup(checks);
        checks
          .filter((c) => c.status !== "ok")
          .forEach((c) => logger.warn("health.check_failed", { check: c.name, status: c.status, error: c.error }));

        return new Response(
          JSON.stringify(
            {
              status,
              requestId: logger.requestId,
              timestamp: new Date().toISOString(),
              checks,
              endpoints: requested ? undefined : PUBLIC_ENDPOINTS,
            },
            null,
            2,
          ),
          {
            status: statusCode(status),
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }, { errorHeaders: corsHeaders }),
    },
  },
});
