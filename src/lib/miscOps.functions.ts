import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const MISC_OPS_FUNCTION_NAMES = [
  "google-reviews",
  "monitor-redirects",
  "notify-google-sitemap",
  "lighthouse-report",
  "social-auto-post",
  "scheduled-social-post",
  "plausible-analytics",
  "mapbox-token",
  "elevenlabs-conversation-token",
  "process-sitemap-queue",
] as const;

const inputSchema = z.object({
  fn: z.enum(MISC_OPS_FUNCTION_NAMES),
  body: z.record(z.string(), z.unknown()).default({}),
});

export type MiscOpsInvokeInput = z.infer<typeof inputSchema>;

/**
 * Single RPC entry point for the misc operations that previously lived in
 * Supabase Edge Functions (google-reviews, monitor-redirects,
 * notify-google-sitemap, lighthouse-report, social-auto-post,
 * scheduled-social-post, plausible-analytics, mapbox-token,
 * elevenlabs-conversation-token, process-sitemap-queue). Action names and
 * response shapes are unchanged.
 */
export const miscOpsInvoke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { runMiscOpsFunction } = await import("./miscOps.server");
    return await runMiscOpsFunction(data.fn, data.body);
  });
