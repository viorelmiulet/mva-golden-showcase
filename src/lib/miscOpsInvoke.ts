import { miscOpsInvoke, type MISC_OPS_FUNCTION_NAMES } from "./miscOps.functions";

type MiscOpsFunctionName = (typeof MISC_OPS_FUNCTION_NAMES)[number];

/**
 * Drop-in replacement for `supabase.functions.invoke(name, { body })` for the
 * misc operations, now served by TanStack server functions. Returns the same
 * `{ data, error }` shape so call sites stay unchanged.
 */
export async function invokeMiscOpsFn<T = any>(
  fn: MiscOpsFunctionName,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = (await miscOpsInvoke({
      data: { fn, body: options?.body ?? {} },
    })) as T & { success?: boolean; error?: string };

    if (data && data.success === false) {
      return { data, error: { message: data.error || "Unknown error" } };
    }
    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[invokeMiscOpsFn:${fn}]`, e);
    return { data: null, error: { message } };
  }
}
