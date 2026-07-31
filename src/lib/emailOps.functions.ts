import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const EMAIL_OPS_FUNCTION_NAMES = [
  "send-signature-link",
  "notify-contract-signed",
  "auto-generate-signed-contract",
  "reply-email",
  "send-transactional-email",
  "send-collaboration-email",
  "send-viewing-notification",
  "send-conversations",
] as const;

const inputSchema = z.object({
  fn: z.enum(EMAIL_OPS_FUNCTION_NAMES),
  body: z.record(z.string(), z.unknown()).default({}),
});

export type EmailOpsInvokeInput = z.infer<typeof inputSchema>;

/**
 * Single RPC entry point for the internal email/notification operations that
 * previously lived in Supabase Edge Functions (send-signature-link,
 * notify-contract-signed, auto-generate-signed-contract, reply-email,
 * send-transactional-email, send-collaboration-email,
 * send-viewing-notification, send-conversations). Action names and response
 * shapes are unchanged.
 */
export const emailOpsInvoke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { runEmailOpsFunction } = await import("./emailOps.server");
    return await runEmailOpsFunction(data.fn, data.body);
  });
