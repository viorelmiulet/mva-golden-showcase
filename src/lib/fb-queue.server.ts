import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getActiveGroups(fallbackGroups: unknown): Promise<string[]> {
  const { data, error } = await supabase
    .from("fb_groups")
    .select("url")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const savedGroups = (data ?? [])
    .map((group) => String(group.url ?? "").trim())
    .filter(Boolean);

  if (savedGroups.length > 0) return savedGroups;
  return Array.isArray(fallbackGroups) ? fallbackGroups.map((g) => String(g).trim()).filter(Boolean) : [];
}

export async function handleNext(body: { groups?: string[] }): Promise<Response> {
  const groups = await getActiveGroups(body?.groups);
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

      // Fetch up to 5 property images so the extension can attach real photos.
      let image_urls: string[] = [];
      if (row.offer_id) {
        const { data: offer } = await supabase
          .from("catalog_offers")
          .select("images")
          .eq("id", row.offer_id)
          .maybeSingle();
        if (offer && Array.isArray(offer.images)) {
          image_urls = offer.images
            .map((u: unknown) => String(u || "").trim())
            .filter((u) => u.startsWith("http"))
            .slice(0, 7);
        }
      }

      return json({
        id: row.id,
        offer_ref: row.offer_id,
        message: row.message,
        group_url: remaining,
        image_urls,
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

export async function handleResult(body: {
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
      attempts: ok ? (row.attempts ?? 0) : (row.attempts ?? 0) + 1,
      status: "pending",
      groups_done,
      errors,
    })
    .eq("id", id);

  if (upErr) throw upErr;
  return json({ ok: true });
}
