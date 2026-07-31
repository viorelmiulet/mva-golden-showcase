import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  event: z.string().optional(),
  recipient: z.string().optional(),
  limit: z.number().optional(),
});

/** Returns Mailgun delivery events (bounces, failures, complaints, deliveries). */
export const getMailgunEvents = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input ?? {}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { fetchMailgunEvents } = await import("./mailgunEvents.server");
    return await fetchMailgunEvents(data);
  });
