/**
 * Server-only logic for the Chrome extension API keys.
 *
 * The raw key is generated once, returned once, and never stored: only its
 * SHA-256 hash and a short prefix live in the database. Nothing here logs the
 * raw key.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const KEY_PREFIX = "mva_ext_";
const RATE_LIMIT_PER_MINUTE = 60;

export type ExtensionKeyInfo = {
  id: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  active: boolean;
};

function hashKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

function toInfo(row: any): ExtensionKeyInfo {
  const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
  return {
    id: row.id,
    key_prefix: row.key_prefix,
    created_at: row.created_at,
    last_used_at: row.last_used_at ?? null,
    revoked_at: row.revoked_at ?? null,
    expires_at: row.expires_at ?? null,
    active: !row.revoked_at && !expired,
  };
}

/** Currently active (non-revoked) key, if any. */
export async function getActiveKeyInfo(): Promise<ExtensionKeyInfo | null> {
  const db = await admin();
  const { data, error } = await db
    .from("extension_api_keys")
    .select("*")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data && data.length ? toInfo(data[0]) : null;
}

/** Revokes every active key. Returns how many were revoked. */
export async function revokeAllKeys(): Promise<number> {
  const db = await admin();
  const { data, error } = await db
    .from("extension_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** Revokes any existing key and issues a new one. The raw key is returned once. */
export async function generateKey(): Promise<{ apiKey: string; info: ExtensionKeyInfo }> {
  await revokeAllKeys();
  const secret = randomBytes(24).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
  const raw = `${KEY_PREFIX}${secret}`;
  const db = await admin();
  const { data, error } = await db
    .from("extension_api_keys")
    .insert({
      key_prefix: `${KEY_PREFIX}${secret.slice(0, 6)}`,
      key_hash: hashKey(raw),
      scope: "facebook-post",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { apiKey: raw, info: toInfo(data) };
}

export type AuthResult =
  | { ok: true; keyId: string }
  | { ok: false; status: 401 | 429; error: string };

/** Validates the Bearer token, enforces the rate limit and stamps last_used_at. */
export async function authenticateRequest(request: Request, endpoint: string): Promise<AuthResult> {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const raw = match?.[1]?.trim();
  if (!raw || !raw.startsWith(KEY_PREFIX)) return { ok: false, status: 401, error: "unauthorized" };

  const db = await admin();
  const { data, error } = await db
    .from("extension_api_keys")
    .select("id, key_hash, revoked_at, expires_at")
    .eq("key_hash", hashKey(raw))
    .limit(1);
  if (error) return { ok: false, status: 401, error: "unauthorized" };

  const row = data?.[0];
  if (!row) return { ok: false, status: 401, error: "unauthorized" };

  // Constant-time re-check of the digest.
  const a = Buffer.from(hashKey(raw), "hex");
  const b = Buffer.from(String(row.key_hash), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  if (row.revoked_at) return { ok: false, status: 401, error: "revoked" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 401, error: "expired" };
  }

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db
    .from("extension_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("key_id", row.id)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
    return { ok: false, status: 429, error: "rate_limited" };
  }

  await db.from("extension_api_usage").insert({ key_id: row.id, endpoint });
  await db.from("extension_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);

  return { ok: true, keyId: row.id };
}

const LISTING_FIELDS =
  "id, title, description, price_min, currency, rooms, surface_min, floor, floor_label, city, zone, location, images, property_type, transaction_type, availability_status, slug, immoflux_slug";

const SITE = "https://www.mvaimobiliare.ro";

function mapListing(row: any) {
  const slug = row.immoflux_slug || row.slug || row.id;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    price: row.price_min ?? null,
    currency: row.currency ?? "EUR",
    rooms: row.rooms ?? null,
    surface: row.surface_min ?? null,
    floor: row.floor_label ?? (row.floor !== null && row.floor !== undefined ? String(row.floor) : null),
    city: row.city ?? null,
    zone: row.zone ?? null,
    location: row.location ?? null,
    property_type: row.property_type ?? null,
    transaction_type: row.transaction_type ?? null,
    images: Array.isArray(row.images) ? row.images : [],
    status: row.availability_status ?? "available",
    url: `${SITE}/proprietati/${slug}`,
  };
}

/** Published, available listings the extension is allowed to post. */
export async function listListings(limit = 50, offset = 0) {
  const db = await admin();
  const { data, error } = await db
    .from("catalog_offers")
    .select(LISTING_FIELDS)
    .eq("is_published", true)
    .eq("availability_status", "available")
    .order("created_at", { ascending: false })
    .range(offset, offset + Math.min(limit, 100) - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapListing);
}

export async function getListing(id: string) {
  const db = await admin();
  const { data, error } = await db
    .from("catalog_offers")
    .select(LISTING_FIELDS)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapListing(data) : null;
}

export const PUBLICATION_STATUSES = ["published", "failed", "blocked", "rate_limited", "cancelled"] as const;

export async function recordPublication(keyId: string, body: any) {
  const status = String(body?.status ?? "");
  if (!(PUBLICATION_STATUSES as readonly string[]).includes(status)) {
    return { ok: false as const, error: "invalid status" };
  }
  const db = await admin();
  const { error } = await db.from("extension_publications").insert({
    key_id: keyId,
    listing_id: body?.listing_id ? String(body.listing_id) : null,
    platform: body?.platform ? String(body.platform) : "facebook",
    group_id: body?.group_id ? String(body.group_id) : null,
    group_name: body?.group_name ? String(body.group_name) : null,
    status,
    published_at: status === "published" ? (body?.published_at ?? new Date().toISOString()) : null,
    error: body?.error ? String(body.error) : null,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
