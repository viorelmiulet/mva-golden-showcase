/**
 * Server-only runtime configuration reader.
 *
 * Some secrets are injected as environment variables in the dev/preview
 * runtime but are NOT present in the published production worker. To avoid
 * having to re-publish every time a secret changes, we fall back to a private
 * backend table (`app_runtime_config`) that only the service role can read.
 *
 * Never import this from client components — it uses admin credentials.
 */

const CACHE_TTL_MS = 60_000;

const cache = new Map<string, { value: string | null; expires: number }>();

/** Reads a config value: environment first, then the private backend table. */
export async function getRuntimeConfig(key: string): Promise<string | null> {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;

  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  let value: string | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_runtime_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    value = data?.value ?? null;
  } catch (err) {
    console.error(`[runtimeConfig] Failed to read ${key}:`, err);
  }

  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Convenience helper for the Mailgun credentials. */
export async function getMailgunConfig(): Promise<{
  apiKey: string | null;
  domain: string | null;
}> {
  const [apiKey, domain] = await Promise.all([
    getRuntimeConfig("MAILGUN_API_KEY"),
    getRuntimeConfig("MAILGUN_DOMAIN"),
  ]);
  return { apiKey, domain };
}
