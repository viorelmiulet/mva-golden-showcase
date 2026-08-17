# Facebook Posting Architecture — Reference Spec (report only)

## 1. Database schema

### public.fb_post_queue
| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| offer_id | uuid | NO | — |
| message | text | NO | — |
| offer_url | text | NO | — |
| status | text | NO | 'pending' (pending / posting / done / error) |
| groups_done | text[] | NO | '{}' |
| errors | text[] | NO | '{}' |
| attempts | integer | NO | 0 |
| created_at | timestamptz | NO | now() |
| next_attempt_at | timestamptz | NO | now() |
| last_error | text | YES | — |
| failed_at | timestamptz | YES | — |
| group_attempts | jsonb | NO | '{}' (map group_url -> tries) |

### public.fb_groups
| column | type | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| url | text | NO | — |
| active | boolean | NO | true |
| notes | text | YES | — |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| paused_until | timestamptz | YES | — |
| pause_reason | text | YES | — |
| consecutive_failures | integer | NO | 0 |

### public.fb_queue_state (singleton, id = 1)
| column | type | null | default |
|---|---|---|---|
| id | integer | NO | 1 |
| stopped | boolean | NO | false (no longer read by handleNext) |
| stop_reason | text | YES | — |
| stopped_at | timestamptz | YES | — |
| consecutive_failures | integer | NO | 0 |
| updated_at | timestamptz | NO | now() |

## 2. buildFacebookMessage() — verbatim (src/lib/facebookQueue.ts)

```ts
export const buildFacebookMessage = (o: OfferLike): string => {
  const blocks: string[] = [];

  const title = stripMarkdown(o.title || "").trim();
  if (title) blocks.push(`🏠 ${title}`);

  const priceLine: string[] = [];
  const price = o.price_min ?? o.price_max;
  if (price && Number(price) > 0) {
    priceLine.push(`💶 ${formatRoLocaleNumber(Number(price))} EUR`);
  }
  const zone = cleanLabel(o.zone);
  if (zone) priceLine.push(`📍 ${zone}`);
  if (priceLine.length) blocks.push(priceLine.join(" · "));

  const detailLine: string[] = [];
  const isStudio = String(o.property_type || "").toLowerCase() === "garsoniera";
  if (!isStudio && o.rooms && Number(o.rooms) > 0) {
    detailLine.push(`${o.rooms} camere`);
  }
  const surface = o.surface_min ?? o.surface_max;
  if (surface && Number(surface) > 0) {
    detailLine.push(`${surface} mp`);
  }
  const floorLabel = cleanLabel(o.floor_label);
  if (floorLabel) detailLine.push(floorLabel);
  if (detailLine.length) blocks.push(detailLine.join(" · "));

  const url = resolveOfferUrl(o);
  if (url) {
    blocks.push("👉 Detalii complete și galerie foto:");
    blocks.push(url);
  }

  return blocks.join("\n\n");
};
```

Helpers used: `stripMarkdown`, `cleanLabel` (drops empty and purely numeric labels), `formatRoLocaleNumber` (`toLocaleString("ro-RO")`, 0 decimals).

## 3. handleNext() — verbatim (src/lib/fb-queue.server.ts)

```ts
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
      .in("id", expired.map((g) => g.id));
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
  // No global stop: intermittent failures must never take the whole queue out of service.

  const groups = await getActiveGroups(body?.groups);
  if (groups.length === 0) return json(null);

  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("fb_post_queue")
    .select("id, offer_id, message, groups_done, status, attempts, next_attempt_at")
    .in("status", ["pending", "posting"])
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
```

Sequencing semantics as they stand now: oldest-created row first (max 10 candidates), first group in `fb_groups` creation order not yet in `groups_done`. One job = one (row, group) pair. A row is only marked `done` once every currently active group is in `groups_done`.

### handleResult() failure tail — verbatim

```ts
  const groupAttempts: Record<string, number> = {
    ...((row.group_attempts as Record<string, number> | null) ?? {}),
  };
  const groupTries = (groupAttempts[group_url] ?? 0) + 1;
  groupAttempts[group_url] = groupTries;

  const reason = `${errMsg ?? "unknown error"} [${describeDiagnostics(diag)}]`;
  errors.push(`${group_url}: ${reason}`);

  const capped = groupTries >= MAX_ATTEMPTS;
  if (capped && !groups_done.includes(group_url)) groups_done.push(group_url);
  const delayMin = capped ? SKIP_DELAY_MINUTES : backoffMinutes(groupTries);

  await supabase.from("fb_post_queue").update({
      attempts: (row.attempts ?? 0) + 1,
      group_attempts: groupAttempts,
      status: "pending",
      groups_done,
      errors,
      last_error: reason,
      next_attempt_at: new Date(Date.now() + delayMin * 60 * 1000).toISOString(),
    }).eq("id", id);

  await registerGroupFailure(group_url, reason);

  const globalFailures = state.consecutive_failures + 1;
  await setQueueState({ consecutive_failures: globalFailures, stopped: false, stopped_at: null, stop_reason: reason });

  return json({
    ok: true,
    attempts: groupTries,
    group_skipped: capped,
    retry_in_minutes: delayMin,
    queue_stopped: false,
    warning: globalFailures >= GLOBAL_WARN_LIMIT,
  });
```

On success: group appended to `groups_done`, row back to `pending`, `next_attempt_at = now()`, group `consecutive_failures` reset to 0, global counter reset to 0.

## 4. Current constants

```ts
export const MAX_ATTEMPTS = 3;                 // per (row, group) pair
export const BACKOFF_MINUTES = [5, 15, 45];    // attempt 1 → 5m, 2 → 15m, 3 → 45m
export const SKIP_DELAY_MINUTES = 1;           // after a group is exhausted/skipped
export const GROUP_FAIL_LIMIT = 8;             // consecutive failures before pausing a group
export const GROUP_PAUSE_HOURS = 0.5;          // 30 minutes
export const GLOBAL_WARN_LIMIT = 10;           // admin warning only; queue never stops
```

## 5. Chrome extension core (chrome-extension-fb-poster/background.js)

Config defaults:
```js
const CONFIG_DEFAULTS = {
  edgeUrl: 'https://mvaimobiliare.ro/api/public/fb-queue',
  apiKey: '',
  minDelay: 4,     // minutes
  maxDelay: 9,
  enabled: false,
  maxPerDay: 15,
};
const MAX_LOG = 50;
const BUSY_TIMEOUT_MS = 3 * 60 * 1000;
const ALARM_NAME = 'mva-tick';   // chrome.alarms.create(ALARM_NAME, { periodInMinutes: 2 })
```

Main loop (verbatim core of `tick`):
```js
const nextRes = await fetch(`${cfg.edgeUrl}/next`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': cfg.apiKey },
  body: JSON.stringify({}),
});
if (!nextRes.ok) { await log(`/next a răspuns HTTP ${nextRes.status}.`); return; }
const raw = await nextRes.text();
if (!raw || raw === 'null') return;
let job; try { job = JSON.parse(raw); } catch { await log('Răspuns invalid la /next.'); return; }
if (job && job.stopped) { await log(`⛔ Coada este oprită…`); return; }
if (!job || !job.id) return;

const tab = await chrome.tabs.create({ url: job.group_url, active: false });
openedTabId = tab.id;

await waitForReady(openedTabId, 60000);                       // waits for MVA_READY
chrome.tabs.sendMessage(openedTabId, { type: 'MVA_DO_POST', job });
const result = await waitForResult(openedTabId, job.id, 240000); // ← current post timeout
ok = result.ok; errorMsg = result.error; diag = result.diag || null;

await fetch(`${cfg.edgeUrl}/result`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': cfg.apiKey },
  body: JSON.stringify({ id: job.id, group_url: job.group_url, ok, error: errorMsg, diag }),
});

const delayMin = randInt(cfg.minDelay, cfg.maxDelay);
await setState({ nextAllowedAt: Date.now() + delayMin * 60 * 1000 });
```

Timeouts as they stand now: `waitForReady` 60000 ms; `waitForResult` called with **240000 ms** (its own default is 120000 ms but the call site overrides it); an internal `setTimeout` in `waitForResult` resolves `{ ok:false, error:'Timeout așteptând rezultatul postării (120s).' }` at the passed timeout. Storage-poll fallback every 3 s reads `lastPostResult` in case the MV3 worker restarted. Keepalive pings chrome APIs every 20 s. `busySince` older than 3 min is treated as a dead worker. Opened tab is closed 8 s after completion.

## 6. API contract

Route: `src/routes/api/public/fb-queue/$.ts` (splat). Base path `/api/public/fb-queue`.
Auth: header `X-Api-Key`, matched against `process.env.FB_QUEUE_API_KEY` or runtime config row `FB_QUEUE_API_KEY_DB`. 401 on mismatch, 500 if neither configured. CORS `*`, `POST, OPTIONS`, allowed headers `content-type, x-api-key, authorization, apikey, x-request-id`.

**POST /api/public/fb-queue/next**
Request body: `{}` (optionally `{ "groups": ["https://facebook.com/groups/..."] }` — used only as fallback when `fb_groups` has no rows).
Response 200, either `null` (nothing to do) or:
```json
{
  "id": "uuid of fb_post_queue row",
  "offer_ref": "uuid of catalog offer",
  "message": "post text",
  "group_url": "https://www.facebook.com/groups/...",
  "image_urls": ["https://...", "…up to 7"]
}
```

**POST /api/public/fb-queue/result**
Request body:
```json
{
  "id": "queue row uuid",
  "group_url": "https://www.facebook.com/groups/...",
  "ok": true,
  "error": "string | null",
  "diag": {
    "step": "…", "composerOpened": true, "dialogOpened": true,
    "textEntered": true, "submitFound": true, "submitClicked": true,
    "attached": 7, "requested": 7, "fetched": 7, "attachError": null
  }
}
```
Response on success: `{ "ok": true }`.
Response on failure: `{ "ok": true, "attempts": n, "group_skipped": bool, "retry_in_minutes": n, "queue_stopped": false, "warning": bool }`.
Errors: `400 {"error":"missing fields"}`, `404 {"error":"not found"}`, `404 {"error":"not found"}` for unknown action, `500 {"error":"…"}`.

## 7. resolveOfferUrl()

```ts
const SITE = "https://www.mvaimobiliare.ro";

export const resolveOfferUrl = (o: OfferLike): string => {
  const slug = o.slug && o.slug.trim()
    ? o.slug.trim()
    : generatePropertySlug({
        id: o.id,
        rooms: o.rooms ?? null,
        project_name: o.project_name ?? null,
        zone: o.zone ?? null,
        location: o.location ?? null,
        surface_min: o.surface_min ?? null,
        floor: o.floor ?? null,
        city: o.city ?? null,
      });
  return `${SITE}/proprietati/${slug}`;
};
```
Uses the stored DB slug when present, otherwise regenerates it. Output format: `https://www.mvaimobiliare.ro/proprietati/{slug}`, e.g. `https://www.mvaimobiliare.ro/proprietati/apartament-3-camere-militari-residence-72mp-a1b2c3d4` (slug ends in an 8-char id hash).

## Enqueue side (for completeness)
`enqueueOfferToFacebook()` checks for an existing row with the same `offer_id` in status pending/posting (returns `duplicate`), otherwise inserts `{ offer_id, message: buildFacebookMessage(o), offer_url: resolveOfferUrl(o), status: 'pending' }` through the admin (service-role) channel. `regenerateQueuedMessages(['pending','error'])` rebuilds `message`/`offer_url` for still-eligible rows after template changes.

No code changes were made.
