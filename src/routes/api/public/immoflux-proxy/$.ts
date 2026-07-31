import { createFileRoute } from "@tanstack/react-router";
import { withApiLogging } from "@/lib/apiLogging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (data: unknown, status = 200, cacheControl?: string) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
    },
  });

const splitPath = (requestUrl: string) => {
  const { pathname } = new URL(requestUrl);
  const marker = "/api/public/immoflux-proxy";
  const rest = pathname.slice(pathname.indexOf(marker) + marker.length);
  return rest.split("/").filter(Boolean);
};

export const Route = createFileRoute("/api/public/immoflux-proxy/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),

      GET: withApiLogging(
        "/api/public/immoflux-proxy",
        async ({ request }) => {
          const { immofluxProxy } = await import("@/lib/immoflux.server");
          const parts = splitPath(request.url);
          const action = parts[0] ?? "";
          const url = new URL(request.url);

          if (action === "properties") {
            const propertyId = parts[1];
            const data = await immofluxProxy(
              propertyId
                ? { action: "properties", propertyId }
                : { action: "properties", page: url.searchParams.get("page") || "1" },
            );
            return json(
              data,
              200,
              propertyId
                ? "public, max-age=300, stale-while-revalidate=86400"
                : "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
            );
          }

          if (action === "agents") {
            const data = await immofluxProxy({ action: "agents" });
            return json(data, 200, "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
          }

          return json({ error: "Not found" }, 404);
        },
        { errorHeaders: corsHeaders },
      ),

      POST: withApiLogging(
        "/api/public/immoflux-proxy",
        async ({ request }) => {
          const { immofluxProxy } = await import("@/lib/immoflux.server");
          const parts = splitPath(request.url);
          const action = parts[0] ?? "";
          const payload = await request.json().catch(() => ({}));

          if (action === "webhook") {
            return json(await immofluxProxy({ action: "webhook", payload }));
          }
          if (action === "contact") {
            return json(await immofluxProxy({ action: "contact", payload }));
          }
          if (action === "visit") {
            return json(await immofluxProxy({ action: "visit", payload }));
          }

          return json({ error: "Not found" }, 404);
        },
        { errorHeaders: corsHeaders },
      ),
    },
  },
});
