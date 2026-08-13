/**
 * Server-only executor for admin writes.
 *
 * The admin panel authenticates with a shared password kept in the browser
 * session. That password is NEVER trusted on its own: every write is sent to
 * the server, verified against the server-held admin secret, and only then
 * executed with the service role. No anon RLS write policy is required.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type Filter = {
  type: "eq" | "neq" | "in" | "is" | "gte" | "lte" | "like" | "ilike";
  column: string;
  value: unknown;
};

export type WriteSpec = {
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  values?: unknown;
  onConflict?: string;
  filters?: Filter[];
  select?: string | null;
  single?: "single" | "maybeSingle" | null;
  /** Allow an update/delete that matches nothing (default: treated as error). */
  allowEmpty?: boolean;
};

const DEFAULT_ADMIN_PASSWORD = "123456";

function sha(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

async function expectedPassword(): Promise<string> {
  const { getRuntimeConfig } = await import("./runtimeConfig.server");
  const fromConfig = await getRuntimeConfig("ADMIN_PASSWORD");
  return fromConfig || DEFAULT_ADMIN_PASSWORD;
}

export async function assertAdmin(password: unknown): Promise<void> {
  const provided = typeof password === "string" ? password : "";
  const expected = await expectedPassword();
  if (!provided || !timingSafeEqual(sha(provided), sha(expected))) {
    throw new Error("Neautorizat: parolă de administrator invalidă");
  }
}

export async function changeAdminPassword(
  currentPassword: unknown,
  newPassword: unknown,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin(currentPassword);
  const next = typeof newPassword === "string" ? newPassword.trim() : "";
  if (next.length < 4) return { success: false, error: "Parola nouă este prea scurtă" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any)
    .from("app_runtime_config")
    .upsert({ key: "ADMIN_PASSWORD", value: next, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

function applyFilters(query: any, filters: Filter[] | undefined) {
  for (const f of filters ?? []) {
    switch (f.type) {
      case "in":
        query = query.in(f.column, f.value as unknown[]);
        break;
      case "is":
        query = query.is(f.column, f.value as any);
        break;
      default:
        query = query[f.type](f.column, f.value as any);
    }
  }
  return query;
}

export async function runAdminWrite(spec: WriteSpec): Promise<{ data: unknown; error: { message: string } | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const client = supabaseAdmin as any;

  let query = client.from(spec.table);

  switch (spec.op) {
    case "insert":
      query = query.insert(spec.values);
      break;
    case "upsert":
      query = query.upsert(spec.values, spec.onConflict ? { onConflict: spec.onConflict } : undefined);
      break;
    case "update":
      if (!spec.filters?.length) return { data: null, error: { message: "Update fără filtru este interzis" } };
      query = applyFilters(query.update(spec.values as any), spec.filters);
      break;
    case "delete":
      if (!spec.filters?.length) return { data: null, error: { message: "Delete fără filtru este interzis" } };
      query = applyFilters(query.delete(), spec.filters);
      break;
  }

  // Always project rows back so a zero-row write can be detected.
  query = query.select(spec.select && spec.select.trim() ? spec.select : "*");

  const { data, error } = await query;
  if (error) return { data: null, error: { message: error.message } };

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  if (!spec.allowEmpty && rows.length === 0 && (spec.op === "update" || spec.op === "delete")) {
    return {
      data: null,
      error: { message: `Nicio înregistrare nu a fost modificată în ${spec.table} (0 rânduri)` },
    };
  }

  if (spec.single === "single") {
    if (rows.length !== 1) return { data: null, error: { message: "Se aștepta exact un rând" } };
    return { data: rows[0], error: null };
  }
  if (spec.single === "maybeSingle") {
    return { data: rows[0] ?? null, error: null };
  }
  return { data: spec.select === null ? null : rows, error: null };
}
