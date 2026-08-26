import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BUCKET = "virtual-staging";

const uploadSchema = z.object({
  action: z.literal("upload"),
  password: z.string().min(1),
  fileName: z.string().min(1).max(200),
  contentType: z.string().default("image/png"),
  dataBase64: z.string().min(1),
  upsert: z.boolean().optional(),
});

const deleteSchema = z.object({
  action: z.literal("delete"),
  password: z.string().min(1),
  fileNames: z.array(z.string().min(1)).min(1).max(50),
});

const bodySchema = z.discriminatedUnion("action", [uploadSchema, deleteSchema]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-180);
}

export const Route = createFileRoute("/api/admin/staging-storage")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = bodySchema.safeParse(await request.json());
          if (!parsed.success) return json({ error: "Cerere invalidă." }, 400);
          const body = parsed.data;

          const { assertAdmin } = await import("@/lib/adminWrite.server");
          try {
            await assertAdmin(body.password);
          } catch {
            return json({ error: "Neautorizat" }, 401);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (body.action === "delete") {
            const { error } = await supabaseAdmin.storage
              .from(BUCKET)
              .remove(body.fileNames.map(safeName));
            if (error) return json({ error: error.message }, 400);
            return json({ ok: true });
          }

          const bytes = Buffer.from(body.dataBase64, "base64");
          const fileName = safeName(body.fileName);
          const { error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(fileName, bytes, {
              contentType: body.contentType,
              upsert: body.upsert ?? false,
            });
          if (error) return json({ error: error.message }, 400);

          const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
          return json({ ok: true, fileName, publicUrl });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Operațiune eșuată.";
          return json({ error: message }, 500);
        }
      },
    },
  },
});
