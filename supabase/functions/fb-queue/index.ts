import { createClient } from "npm:@supabase/supabase-js@2";

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth
  const apiKey = req.headers.get("x-api-key");
  const expected = Deno.env.get("FB_QUEUE_API_KEY");
  if (!expected) return json({ error: "server not configured" }, 500);
  if (!apiKey || apiKey !== expected) return json({ error: "unauthorized" }, 401);

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = new URL(req.url);
  // Path may be /fb-queue/next or /next depending on routing
  const seg = url.pathname.split("/").filter(Boolean).pop() ?? "";

  let body: any = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  try {
    if (seg === "next") return await handleNext(body);
    if (seg === "result") return await handleResult(body);
    return json({ error: "not found" }, 404);
  } catch (e) {
    console.error("fb-queue error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

async function handleNext(body: { groups?: string[] }): Promise<Response> {
  const groups = Array.isArray(body?.groups) ? body.groups.filter(Boolean) : [];
  if (groups.length === 0) return json(null);

  const { data: rows, error } = await supabase
    .from("fb_post_queue")
    .select("id, offer_id, message, groups_done, status, attempts")
    .in("status", ["pending", "posting"])
    .lt("attempts", 10)
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) throw error;
  if (!rows || rows.length === 0) return json(null);

  for (const row of rows) {
    const done: string[] = Array.isArray(row.groups_done) ? row.groups_done : [];
    const remaining = groups.find((g) => !done.includes(g));

    if (remaining) {
      if (row.status !== "posting") {
        const { error: upErr } = await supabase
          .from("fb_post_queue")
          .update({ status: "posting" })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      return json({
        id: row.id,
        offer_ref: row.offer_id,
        message: row.message,
        group_url: remaining,
      });
    } else {
      // All configured groups already done for this row -> mark done
      if (row.status !== "done") {
        await supabase.from("fb_post_queue").update({ status: "done" }).eq("id", row.id);
      }
      continue;
    }
  }

  return json(null);
}

async function handleResult(body: {
  id?: string;
  group_url?: string;
  ok?: boolean;
  error?: string | null;
}): Promise<Response> {
  const { id, group_url, ok, error: errMsg } = body ?? {};
  if (!id || !group_url || typeof ok !== "boolean") {
    return json({ error: "missing fields" }, 400);
  }

  const { data: row, error: selErr } = await supabase
    .from("fb_post_queue")
    .select("id, groups_done, errors, attempts")
    .eq("id", id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (!row) return json({ error: "not found" }, 404);

  const groups_done: string[] = Array.isArray(row.groups_done) ? [...row.groups_done] : [];
  const errors: string[] = Array.isArray(row.errors) ? [...row.errors] : [];

  if (ok) {
    if (!groups_done.includes(group_url)) groups_done.push(group_url);
  } else {
    errors.push(`${group_url}: ${errMsg ?? "unknown error"}`);
  }

  const { error: upErr } = await supabase
    .from("fb_post_queue")
    .update({
      attempts: (row.attempts ?? 0) + 1,
      status: "pending",
      groups_done,
      errors,
    })
    .eq("id", id);

  if (upErr) throw upErr;
  return json({ ok: true });
}
