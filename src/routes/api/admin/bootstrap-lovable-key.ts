import { createFileRoute } from "@tanstack/react-router";

/**
 * One-time admin-gated bootstrap: copies LOVABLE_API_KEY from the server
 * process env into the private `app_runtime_config` table.
 *
 * The production Cloudflare Worker does not receive env-var secrets, so the
 * project reads them via `getRuntimeConfig` (env first, then this table).
 * LOVABLE_API_KEY is managed and its value is never exposed to anyone, so it
 * cannot be entered manually. This route runs in the dev/preview server (which
 * DOES have the key in its env) and stores it where the production Worker can
 * read it. Re-invoke after a key rotation to refresh the stored value.
 *
 * Never returns the key value.
 */
export const Route = createFileRoute("/api/admin/bootstrap-lovable-key")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          });

        try {
          const body = (await request.json().catch(() => ({}))) as { password?: string };
          const { assertAdmin } = await import("@/lib/adminWrite.server");
          try {
            await assertAdmin(body.password);
          } catch {
            return json({ error: "Sesiunea admin a expirat. Autentifică-te din nou." }, 401);
          }

          const key = process.env["LOVABLE_API_KEY"];
          if (!key) {
            return json({ stored: false, hadKey: false, error: "LOVABLE_API_KEY nu este în env-ul serverului." }, 500);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("app_runtime_config")
            .upsert(
              { key: "LOVABLE_API_KEY", value: key, updated_at: new Date().toISOString() },
              { onConflict: "key" },
            );
          if (error) return json({ stored: false, hadKey: true, error: error.message }, 500);

          return json({ stored: true, hadKey: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Bootstrap a eșuat.";
          return json({ stored: false, error: message }, 500);
        }
      },
    },
  },
});
