import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  roomType: z.string().optional(),
  style: z.string().optional(),
  additionalPrompt: z.string().optional(),
  numberOfImages: z.number().int().min(1).max(5).default(1),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const Route = createFileRoute("/api/virtual-staging")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = requestSchema.safeParse(await request.json());
          if (!parsed.success) {
            return json({ error: "Datele imaginii sunt invalide." }, 400);
          }

          const { virtualStaging } = await import("@/lib/aiOps.server");
          const result = await virtualStaging(parsed.data);
          if (result.error) {
            return json(result, 422);
          }

          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Generarea imaginii a eșuat.";
          return json({ error: message }, 500);
        }
      },
    },
  },
});