import { immofluxInvoke, type IMMOFLUX_FUNCTION_NAMES } from "./immoflux.functions";

type ImmofluxFunctionName = (typeof IMMOFLUX_FUNCTION_NAMES)[number];

/**
 * Drop-in replacement for `supabase.functions.invoke(name, { body })` for the
 * Immoflux/import operations, now served by TanStack server functions.
 * Returns the same `{ data, error }` shape so call sites stay unchanged.
 */
export async function invokeImmofluxFn<T = any>(
  fn: ImmofluxFunctionName,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = (await immofluxInvoke({
      data: { fn, body: options?.body ?? {} },
    })) as T & { success?: boolean; error?: string };

    if (data && data.success === false) {
      return { data, error: { message: data.error || "Unknown error" } };
    }
    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[invokeImmofluxFn:${fn}]`, e);
    return { data: null, error: { message } };
  }
}
