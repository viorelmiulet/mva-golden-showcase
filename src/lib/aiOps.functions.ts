import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const AI_OPS_FUNCTION_NAMES = [
  "ai-property-recommendations",
  "extract-id-data",
  "extract-company-data",
  "generate-facebook-content",
  "generate-furnished-images",
  "virtual-staging",
  "scrape-property",
  "chat-assistant",
] as const;

const inputSchema = z.object({
  fn: z.enum(AI_OPS_FUNCTION_NAMES),
  body: z.record(z.string(), z.unknown()).default({}),
});

export type AiOpsInvokeInput = z.infer<typeof inputSchema>;

/**
 * Single RPC entry point for the AI / scraping operations that previously
 * lived in Supabase Edge Functions (ai-property-recommendations,
 * extract-id-data, extract-company-data, generate-facebook-content,
 * generate-furnished-images, virtual-staging, scrape-property,
 * chat-assistant). Payloads and response shapes are unchanged.
 */
export const aiOpsInvoke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { runAiOpsFunction } = await import("./aiOps.server");
    return await runAiOpsFunction(data.fn, data.body);
  });
