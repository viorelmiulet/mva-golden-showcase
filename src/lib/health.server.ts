/**
 * Health checks for the /api/public/* surface.
 *
 * Never returns secret values — only booleans for required configuration and
 * aggregate counters. Safe to expose to external monitors.
 */

export type CheckStatus = "ok" | "degraded" | "error";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  ms: number;
  detail?: Record<string, unknown>;
  error?: string;
}

/** Every externally-callable public endpoint, with the config it needs. */
export const PUBLIC_ENDPOINTS: Array<{
  path: string;
  methods: string[];
  caller: string;
  requiredEnv: string[];
}> = [
  { path: "/api/public/health", methods: ["GET"], caller: "monitoring", requiredEnv: [] },
  { path: "/api/public/fb-queue/*", methods: ["POST"], caller: "Chrome extension", requiredEnv: ["FB_QUEUE_API_KEY"] },
  { path: "/api/public/immoflux-sync", methods: ["GET", "POST"], caller: "admin UI, pg_cron", requiredEnv: [] },
  { path: "/api/public/immoflux-webhook", methods: ["POST"], caller: "Immoflux", requiredEnv: ["IMMOFLUX_WEBHOOK_SECRET"] },
  { path: "/api/public/marketing-webhook", methods: ["POST"], caller: "Make.com", requiredEnv: [] },
  { path: "/api/public/receive-mailgun-email", methods: ["POST"], caller: "Mailgun", requiredEnv: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"] },
  { path: "/api/public/process-email-queue", methods: ["GET", "POST"], caller: "pg_cron", requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] },
  { path: "/api/public/process-sitemap-queue", methods: ["GET", "POST"], caller: "pg_cron", requiredEnv: [] },
  { path: "/api/public/scheduled-social-post", methods: ["GET", "POST"], caller: "pg_cron", requiredEnv: [] },
  { path: "/api/public/facebook-catalog-feed", methods: ["GET"], caller: "Facebook catalog", requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] },
  { path: "/api/public/og-image", methods: ["GET"], caller: "social crawlers", requiredEnv: ["SUPABASE_URL"] },
  { path: "/api/public/og-meta", methods: ["GET"], caller: "social crawlers", requiredEnv: ["SUPABASE_URL"] },
  { path: "/api/public/track", methods: ["POST"], caller: "site analytics", requiredEnv: [] },
  { path: "/api/public/auth-email-hook", methods: ["POST"], caller: "auth email hook", requiredEnv: [] },
];

async function timed(name: string, fn: () => Promise<Omit<CheckResult, "name" | "ms">>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fn();
    return { name, ms: Date.now() - started, ...res };
  } catch (error) {
    return {
      name,
      ms: Date.now() - started,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function checkDatabase(): Promise<CheckResult> {
  return timed("database", async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("catalog_offers")
      .select("id", { count: "exact", head: true });
    if (error) return { status: "error" as const, error: error.message };
    return { status: "ok" as const, detail: { offers: count ?? 0 } };
  });
}

export async function checkEnv(): Promise<CheckResult> {
  return timed("configuration", async () => {
    const required = Array.from(new Set(PUBLIC_ENDPOINTS.flatMap((e) => e.requiredEnv)));
    const missing = required.filter((key) => !process.env[key]);
    return {
      status: missing.length ? ("degraded" as const) : ("ok" as const),
      detail: {
        // booleans only, never values
        present: Object.fromEntries(required.map((k) => [k, Boolean(process.env[k])])),
        missing,
      },
    };
  });
}

export async function checkQueues(): Promise<CheckResult> {
  return timed("queues", async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [fbPending, fbFailed, emailPending] = await Promise.all([
      supabaseAdmin.from("fb_post_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("fb_post_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabaseAdmin.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const detail = {
      fb_post_queue_pending: fbPending.count ?? null,
      fb_post_queue_failed: fbFailed.count ?? null,
      email_queue_pending: emailPending.count ?? null,
    };
    const failures = [fbPending.error, fbFailed.error, emailPending.error].filter(Boolean);
    return {
      status: failures.length ? ("degraded" as const) : ("ok" as const),
      detail,
      error: failures.length ? failures.map((e) => e!.message).join("; ") : undefined,
    };
  });
}

export async function checkImmoflux(): Promise<CheckResult> {
  return timed("immoflux_sync", async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value, updated_at")
      .eq("key", "immoflux_sync_status")
      .maybeSingle();
    if (error) return { status: "degraded" as const, error: error.message };
    if (!data) return { status: "degraded" as const, detail: { lastRun: null } };
    return { status: "ok" as const, detail: { lastRun: data.updated_at, status: data.value } };
  });
}

export const HEALTH_CHECKS: Record<string, () => Promise<CheckResult>> = {
  database: checkDatabase,
  configuration: checkEnv,
  queues: checkQueues,
  immoflux_sync: checkImmoflux,
};

export function rollup(checks: CheckResult[]): CheckStatus {
  if (checks.some((c) => c.status === "error")) return "error";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

export function statusCode(status: CheckStatus): number {
  return status === "error" ? 503 : 200;
}
