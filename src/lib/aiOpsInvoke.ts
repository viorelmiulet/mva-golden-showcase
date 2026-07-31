import { aiOpsInvoke, type AI_OPS_FUNCTION_NAMES } from "./aiOps.functions";

type AiOpsFunctionName = (typeof AI_OPS_FUNCTION_NAMES)[number];

/**
 * Drop-in replacement for `supabase.functions.invoke(name, { body })` for the
 * AI / scraping operations, now served by TanStack server functions.
 * Returns the same `{ data, error }` shape so call sites stay unchanged.
 */
export async function invokeAiOpsFn<T = any>(
  fn: AiOpsFunctionName,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = (await aiOpsInvoke({
      data: { fn, body: options?.body ?? {} },
    })) as T & { error?: string; success?: boolean };

    if (data && typeof data === "object" && "error" in data && (data as any).error) {
      return { data, error: { message: (data as any).error } };
    }
    if (data && typeof data === "object" && (data as any).success === false) {
      return { data, error: { message: (data as any).error || "Unknown error" } };
    }
    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[invokeAiOpsFn:${fn}]`, e);
    return { data: null, error: { message } };
  }
}
