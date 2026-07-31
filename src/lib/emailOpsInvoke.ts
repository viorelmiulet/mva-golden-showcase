import { emailOpsInvoke, type EMAIL_OPS_FUNCTION_NAMES } from "./emailOps.functions";

type EmailOpsFunctionName = (typeof EMAIL_OPS_FUNCTION_NAMES)[number];

/**
 * Drop-in replacement for `supabase.functions.invoke(name, { body })` for the
 * internal email/notification operations, now served by TanStack server
 * functions. Returns the same `{ data, error }` shape so call sites stay
 * unchanged.
 */
export async function invokeEmailOpsFn<T = any>(
  fn: EmailOpsFunctionName,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = (await emailOpsInvoke({
      data: { fn, body: options?.body ?? {} },
    })) as T & { success?: boolean; error?: string };

    if (data && (data as any).error) {
      return { data, error: { message: (data as any).error } };
    }
    if (data && data.success === false) {
      return { data, error: { message: data.error || "Unknown error" } };
    }
    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[invokeEmailOpsFn:${fn}]`, e);
    return { data: null, error: { message } };
  }
}
