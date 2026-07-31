import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key, authorization, apikey",
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
      POST: async ({ request, params }) => {
        // Auth
        const apiKey = request.headers.get("x-api-key");
        const expected = process.env.FB_QUEUE_API_KEY;
        if (!expected) return json({ error: "server not configured" }, 500);
        if (!apiKey || apiKey !== expected) return json({ error: "unauthorized" }, 401);

        const seg = params._splat ?? "";

        let body: any = {};
        try {
          const text = await request.text();
          body = text ? JSON.parse(text) : {};
        } catch {
          return json({ error: "invalid json" }, 400);
        }

        try {
          const { handleNext, handleResult } = await import("@/lib/fb-queue.server");
          if (seg === "next") return await handleNext(body);
          if (seg === "result") return await handleResult(body);
          return json({ error: "not found" }, 404);
        } catch (e) {
          console.error("fb-queue error", e);
          return json({ error: String((e as Error).message ?? e) }, 500);
        }
      },
    },
  },
});
