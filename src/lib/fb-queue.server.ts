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

/** Hard cap on retries per queue row. */
export const MAX_ATTEMPTS = 3;
/** Exponential backoff between retries, in minutes (attempt 1 → 5m, 2 → 15m, 3 → 45m). */
export const BACKOFF_MINUTES = [5, 15, 45];
/** Consecutive failures on one group before that group is paused. */
export const GROUP_FAIL_LIMIT = 3;
/** Hours a group stays paused. */
export const GROUP_PAUSE_HOURS = 24;
/** Consecutive failures across all groups before the whole queue stops. */
export const GLOBAL_FAIL_LIMIT = 5;

export const backoffMinutes = (attempts: number): number =>
  BACKOFF_MINUTES[Math.min(Math.max(attempts, 1), BACKOFF_MINUTES.length) - 1]!;

type QueueState = {
  stopped: boolean;
  stop_reason: string | null;
  consecutive_failures: number;
};

async function getQueueState(): Promise<QueueState> {
  const { data } = await supabase
    .from("fb_queue_state")
    .select("stopped, stop_reason, consecutive_failures")
    .eq("id", 1)
    .maybeSingle();
  if (!data) {
    await supabase.from("fb_queue_state").upsert({ id: 1 });
    return { stopped: false, stop_reason: null, consecutive_failures: 0 };
  }
  return {
    stopped: !!data.stopped,
    stop_reason: data.stop_reason ?? null,
    consecutive_failures: data.consecutive_failures ?? 0,
  };
}

type QueueStatePatch = {
  stopped?: boolean;
  stop_reason?: string | null;
  stopped_at?: string | null;
  consecutive_failures?: number;
};

async function setQueueState(patch: QueueStatePatch) {
  await supabase
    .from("fb_queue_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
}

type GroupRow = {
  id: string;
  url: string;
  paused_until: string | null;
  consecutive_failures: number | null;
};

async function getActiveGroups(fallbackGroups: unknown): Promise<string[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("fb_groups")
    .select("id, url, paused_until, consecutive_failures")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as GroupRow[];

  // Auto-clear expired pauses so the group becomes eligible again.
  const expired = rows.filter((g) => g.paused_until && g.paused_until <= nowIso);
  if (expired.length > 0) {
    await supabase
      .from("fb_groups")
      .update({ paused_until: null, pause_reason: null, consecutive_failures: 0 })
      .in(
        "id",
        expired.map((g) => g.id),
      );
  }

  const savedGroups = rows
    .filter((g) => !(g.paused_until && g.paused_until > nowIso))
    .map((group) => String(group.url ?? "").trim())
    .filter(Boolean);

  if (savedGroups.length > 0) return savedGroups;
  if (rows.length > 0) return []; // all configured groups are paused
  return Array.isArray(fallbackGroups) ? fallbackGroups.map((g) => String(g).trim()).filter(Boolean) : [];
}

export async function handleNext(body: { groups?: string[] }): Promise<Response> {
  const state = await getQueueState();
  if (state.stopped) {
    return json({ stopped: true, reason: state.stop_reason });
  }

  const groups = await getActiveGroups(body?.groups);
  if (groups.length === 0) return json(null);

  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("fb_post_queue")
    .select("id, offer_id, message, groups_done, status, attempts, next_attempt_at")
    .in("status", ["pending", "posting"])
    .lt("attempts", MAX_ATTEMPTS)
    .lte("next_attempt_at", nowIso)
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

      // Fetch up to 7 property images so the extension can attach real photos.
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

export type PostDiagnostics = {
  step?: string;
  composerOpened?: boolean;
  dialogOpened?: boolean;
  textEntered?: boolean;
  submitFound?: boolean;
  submitClicked?: boolean;
  attached?: number;
  requested?: number;
  fetched?: number;
  attachError?: string | null;
};

export const describeDiagnostics = (d: PostDiagnostics | undefined | null): string => {
  if (!d) return "fără diagnostic";
  const yn = (v: unknown) => (v ? "da" : "nu");
  return [
    `pas: ${d.step ?? "necunoscut"}`,
    `composer deschis: ${yn(d.composerOpened ?? d.dialogOpened)}`,
    `text introdus: ${yn(d.textEntered)}`,
    `buton publicare găsit: ${yn(d.submitFound)}`,
    `buton apăsat: ${yn(d.submitClicked)}`,
    `imagini atașate: ${d.attached ?? 0}/${d.requested ?? 0}`,
    d.attachError ? `attach: ${d.attachError}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
};

async function registerGroupFailure(groupUrl: string, reason: string) {
  const { data: group } = await supabase
    .from("fb_groups")
    .select("id, consecutive_failures")
    .eq("url", groupUrl)
    .maybeSingle();
  if (!group) return;

  const failures = (group.consecutive_failures ?? 0) + 1;
  const paused = failures >= GROUP_FAIL_LIMIT;

  await supabase
    .from("fb_groups")
    .update({
      consecutive_failures: failures,
      paused_until: paused
        ? new Date(Date.now() + GROUP_PAUSE_HOURS * 3600 * 1000).toISOString()
        : null,
      pause_reason: paused
        ? `Pauză automată ${GROUP_PAUSE_HOURS}h după ${failures} eșecuri consecutive. Ultima eroare: ${reason}`
        : null,
    })
    .eq("id", group.id);
}

async function registerGroupSuccess(groupUrl: string) {
  await supabase
    .from("fb_groups")
    .update({ consecutive_failures: 0, paused_until: null, pause_reason: null })
    .eq("url", groupUrl);
}

export async function handleResult(body: {
  id?: string;
  group_url?: string;
  ok?: boolean;
  error?: string | null;
  diag?: PostDiagnostics | null;
}): Promise<Response> {
  const { id, group_url, ok, error: errMsg, diag } = body ?? {};
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
  const state = await getQueueState();

  if (ok) {
    if (!groups_done.includes(group_url)) groups_done.push(group_url);

    const { error: upErr } = await supabase
      .from("fb_post_queue")
      .update({
        attempts: row.attempts ?? 0,
        status: "pending",
        groups_done,
        errors,
        next_attempt_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (upErr) throw upErr;

    await registerGroupSuccess(group_url);
    if (state.consecutive_failures > 0) await setQueueState({ consecutive_failures: 0 });
    return json({ ok: true });
  }

  // Failure path — record the failing step, apply backoff, cap retries.
  const attempts = (row.attempts ?? 0) + 1;
  const reason = `${errMsg ?? "unknown error"} [${describeDiagnostics(diag)}]`;
  errors.push(`${group_url}: ${reason}`);

  const capped = attempts >= MAX_ATTEMPTS;
  const delayMin = backoffMinutes(attempts);

  const { error: upErr } = await supabase
    .from("fb_post_queue")
    .update({
      attempts,
      status: capped ? "failed" : "pending",
      groups_done,
      errors,
      last_error: reason,
      failed_at: capped ? new Date().toISOString() : null,
      next_attempt_at: new Date(Date.now() + delayMin * 60 * 1000).toISOString(),
    })
    .eq("id", id);

  if (upErr) throw upErr;

  await registerGroupFailure(group_url, reason);

  const globalFailures = state.consecutive_failures + 1;
  const shouldStop = globalFailures >= GLOBAL_FAIL_LIMIT;
  await setQueueState({
    consecutive_failures: globalFailures,
    ...(shouldStop
      ? {
          stopped: true,
          stopped_at: new Date().toISOString(),
          stop_reason: `Coada a fost oprită automat după ${globalFailures} eșecuri consecutive pe toate grupurile. Ultima eroare: ${reason}`,
        }
      : {}),
  });

  return json({
    ok: true,
    attempts,
    failed: capped,
    retry_in_minutes: capped ? null : delayMin,
    queue_stopped: shouldStop,
  });
}
