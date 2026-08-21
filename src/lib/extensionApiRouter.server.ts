/** Shared HTTP handler for the Chrome extension API (Facebook post). */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Max-Age": "86400",
};

export const extensionCorsHeaders = corsHeaders;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function handleExtensionRequest(request: Request, splat: string): Promise<Response> {
  const segments = (splat || "").split("/").filter(Boolean);
  const url = new URL(request.url);
  const endpoint = `/${segments.join("/")}`;

  const {
    authenticateRequest,
    listListings,
    getListing,
    recordPublication,
  } = await import("./extensionApi.server");

  const auth = await authenticateRequest(request, endpoint);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    if (request.method === "GET" && segments[0] === "status") {
      return json({ authenticated: true, extension: "facebook-post", status: "active" });
    }

    if (request.method === "GET" && segments[0] === "listings") {
      if (segments.length === 1) {
        const limit = Number(url.searchParams.get("limit") ?? 50) || 50;
        const offset = Number(url.searchParams.get("offset") ?? 0) || 0;
        return json({ listings: await listListings(limit, offset) });
      }
      const listing = await getListing(segments[1]!);
      if (!listing) return json({ error: "not found" }, 404);
      return json({ listing });
    }

    if (request.method === "POST" && segments[0] === "publications") {
      let body: unknown = {};
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        return json({ error: "invalid json" }, 400);
      }
      const result = await recordPublication(auth.keyId, body);
      if (!result.ok) return json({ error: result.error }, 400);
      return json({ success: true }, 201);
    }

    return json({ error: "not found" }, 404);
  } catch (e) {
    console.error("[extension-api] handler error", (e as Error).message);
    return json({ error: "server error" }, 500);
  }
}
