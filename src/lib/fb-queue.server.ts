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

/** Hard cap on retries per (queue row, group) pair. */
export const MAX_ATTEMPTS = 3;
/** Exponential backoff between retries, in minutes (attempt 1 → 5m, 2 → 15m, 3 → 45m). */
export const BACKOFF_MINUTES = [5, 15, 45];
/** Short pause before moving on to the next group after a failure. */
export const SKIP_DELAY_MINUTES = 1;
/** Consecutive failures on one group before that group is paused. */
export const GROUP_FAIL_LIMIT = 3;
/** Hours a group stays paused. */
export const GROUP_PAUSE_HOURS = 2;
/** Consecutive failures across all groups before the whole queue stops. */
export const GLOBAL_FAIL_LIMIT = 15;


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

  // Strict grouping: finish one property across ALL groups before starting the
  // next one. We therefore do NOT filter by next_attempt_at in SQL — a property
  // that is mid-flight but still in backoff must hold the queue rather than let
  // another property jump ahead.
  const { data: rows, error } = await supabase
    .from("fb_post_queue")
    .select("id, offer_id, message, groups_done, errors, attempts, status, next_attempt_at, created_at")
    .in("status", ["pending", "posting"])
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  if (!rows || rows.length === 0) return json(null);

  const remainingFor = (row: (typeof rows)[number]) => {
    const done: string[] = Array.isArray(row.groups_done) ? row.groups_done : [];
    // `groups` keeps a stable order (fb_groups.created_at asc), so the sequence
    // inside one property is predictable and repeatable.
    return groups.find((g) => !done.includes(g)) ?? null;
  };

  const candidates: typeof rows = [];
  for (const row of rows) {
    if (remainingFor(row)) {
      candidates.push(row);
    } else if (row.status !== "done") {
      // All configured groups already handled (posted or exhausted) -> done.
      await supabase.from("fb_post_queue").update({ status: "done" }).eq("id", row.id);
    }
  }

  if (candidates.length === 0) return json(null);

  // A property is "mid-flight" once at least one group has been posted or errored.
  const isMidFlight = (row: (typeof rows)[number]) =>
    (Array.isArray(row.groups_done) && row.groups_done.length > 0) ||
    (Array.isArray(row.errors) && row.errors.length > 0) ||
    (row.attempts ?? 0) > 0;

  const target = candidates.find(isMidFlight) ?? candidates[0]!;

  // Respect the existing backoff / rate limiting: if the current property is not
  // ready yet, wait instead of serving a different property.
  if (target.next_attempt_at && target.next_attempt_at > nowIso) return json(null);

  const remaining = remainingFor(target)!;

  if (target.status !== "posting") {
    const { error: upErr } = await supabase
      .from("fb_post_queue")
      .update({ status: "posting" })
      .eq("id", target.id);
    if (upErr) throw upErr;
  }

  // Fetch up to 7 property images so the extension can attach real photos.
  let image_urls: string[] = [];
  if (target.offer_id) {
    const { data: offer } = await supabase
      .from("catalog_offers")
      .select("images")
      .eq("id", target.offer_id)
      .maybeSingle();
    if (offer && Array.isArray(offer.images)) {
      image_urls = offer.images
        .map((u: unknown) => String(u || "").trim())
        .filter((u) => u.startsWith("http"))
        .slice(0, 7);
    }
  }

  return json({
    id: target.id,
    offer_ref: target.offer_id,
    message: target.message,
    group_url: remaining,
    image_urls,
  });
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
    .select("id, groups_done, errors, attempts, group_attempts")
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

  // Failure path — retries are counted PER GROUP, not for the whole row, so one
  // problematic group can never block the remaining groups of the same offer.
  const groupAttempts: Record<string, number> = {
    ...((row.group_attempts as Record<string, number> | null) ?? {}),
  };
  const groupTries = (groupAttempts[group_url] ?? 0) + 1;
  groupAttempts[group_url] = groupTries;

  const reason = `${errMsg ?? "unknown error"} [${describeDiagnostics(diag)}]`;
  errors.push(`${group_url}: ${reason}`);

  const capped = groupTries >= MAX_ATTEMPTS;
  // When a group is exhausted we skip it (mark as done) and continue quickly.
  if (capped && !groups_done.includes(group_url)) groups_done.push(group_url);
  const delayMin = capped ? SKIP_DELAY_MINUTES : backoffMinutes(groupTries);

  const { error: upErr } = await supabase
    .from("fb_post_queue")
    .update({
      attempts: (row.attempts ?? 0) + 1,
      group_attempts: groupAttempts,
      status: "pending",
      groups_done,
      errors,
      last_error: reason,
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
    attempts: groupTries,
    group_skipped: capped,
    retry_in_minutes: delayMin,
    queue_stopped: shouldStop,
  });

}
