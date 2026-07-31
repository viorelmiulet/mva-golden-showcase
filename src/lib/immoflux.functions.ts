import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const IMMOFLUX_FUNCTION_NAMES = [
  "immoflux-integration",
  "sync-immoflux",
  "immoflux-proxy",
  "import-complexes-excel",
  "import-complexes-pdf",
  "import-excel-apartments",
  "import-renew-apartments",
  "facebook-catalog-import",
] as const;

const inputSchema = z.object({
  fn: z.enum(IMMOFLUX_FUNCTION_NAMES),
  body: z.record(z.string(), z.unknown()).default({}),
});

export type ImmofluxInvokeInput = z.infer<typeof inputSchema>;

/**
 * Single RPC entry point for the Immoflux/import edge functions
 * (immoflux-integration, sync-immoflux, immoflux-proxy,
 * import-complexes-excel, import-complexes-pdf, import-excel-apartments,
 * import-renew-apartments, facebook-catalog-import). Action names and
 * response shapes are unchanged.
 */
export const immofluxInvoke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { runImmofluxFunction } = await import("./immoflux.server");
    return await runImmofluxFunction(data.fn, data.body);
  });
