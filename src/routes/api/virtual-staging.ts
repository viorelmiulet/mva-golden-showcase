import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  password: z.string().min(1),
  roomType: z.enum(["living", "bedroom", "kitchen", "bathroom", "office", "dining"]),
  style: z.enum(["modern", "classic", "scandinavian", "industrial", "bohemian", "luxury"]),
  additionalPrompt: z.string().max(800).default(""),
  stream: z.enum(["true", "false"]).default("true"),
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
          const form = await request.formData();
          const parsed = requestSchema.safeParse({
            password: form.get("password"),
            roomType: form.get("roomType"),
            style: form.get("style"),
            additionalPrompt: form.get("additionalPrompt") ?? "",
            stream: form.get("stream") ?? "true",
          });
          if (!parsed.success) {
            return json({ error: "Setările de generare sunt invalide." }, 400);
          }

          const image = form.get("image");
          if (!(image instanceof File) || !image.type.startsWith("image/") || image.size === 0) {
            return json({ error: "Selectează o imagine validă." }, 400);
          }
          if (image.size > 12 * 1024 * 1024) {
            return json({ error: "Imaginea depășește limita de 12 MB." }, 413);
          }

          const { assertAdmin } = await import("@/lib/adminWrite.server");
          try {
            await assertAdmin(parsed.data.password);
          } catch {
            return json({ error: "Sesiunea admin a expirat. Autentifică-te din nou." }, 401);
          }

          const key = process.env['LOVABLE_API_KEY'];
          if (!key) {
            return json({ error: "Serviciul AI nu este configurat în această versiune publicată. Republică aplicația." }, 503);
          }

          const { buildVirtualStagingPrompt, gatewayErrorMessage, VIRTUAL_STAGING_MODEL } =
            await import("@/lib/virtualStaging.server");
          const streaming = parsed.data.stream === "true";
          const gatewayForm = new FormData();
          gatewayForm.set("model", VIRTUAL_STAGING_MODEL);
          gatewayForm.set("image", image, image.name || "camera.jpg");
          gatewayForm.set("prompt", buildVirtualStagingPrompt(parsed.data));
          gatewayForm.set("quality", "low");
          if (streaming) {
            gatewayForm.set("stream", "true");
            gatewayForm.set("partial_images", "1");
          }

          let upstream: Response | null = null;
          for (let attempt = 0; attempt < 2; attempt += 1) {
            if (attempt > 0) {
              const retryAfter = Number(upstream?.headers.get("Retry-After") ?? "2");
              await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000));
            }
            try {
              upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/edits", {
                method: "POST",
                headers: { Authorization: `Bearer ${key}` },
                body: gatewayForm,
                signal: request.signal,
              });
            } catch (error) {
              if (request.signal.aborted) return new Response(null, { status: 499 });
              throw error;
            }
            if (upstream.ok || (upstream.status !== 429 && upstream.status < 500)) break;
          }

          if (!upstream) return json({ error: "Serviciul AI nu a putut fi contactat." }, 502);
          if (!upstream.ok || !upstream.body) {
            const raw = await upstream.text();
            return json({ error: gatewayErrorMessage(upstream.status, raw) }, upstream.status);
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": streaming ? "text/event-stream" : "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Generarea imaginii a eșuat.";
          return json({ error: message }, 500);
        }
      },
    },
  },
});