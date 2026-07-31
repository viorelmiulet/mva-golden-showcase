import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const ADMIN_FUNCTION_NAMES = [
  "admin-offers",
  "admin-complexes",
  "api-keys-manager",
  "update-floor-plan",
  "update-project-image",
  "fix-property-zones",
] as const;

const inputSchema = z.object({
  fn: z.enum(ADMIN_FUNCTION_NAMES),
  body: z.record(z.string(), z.unknown()).default({}),
});

export type AdminInvokeInput = z.infer<typeof inputSchema>;

/**
 * Single RPC entry point for the internal admin operations that previously
 * lived in Supabase Edge Functions (admin-offers, admin-complexes,
 * api-keys-manager, update-floor-plan, update-project-image,
 * fix-property-zones). Action names and response shapes are unchanged.
 */
export const adminInvoke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { runAdminFunction } = await import("./admin.server");
    return await runAdminFunction(data.fn, data.body);
  });

