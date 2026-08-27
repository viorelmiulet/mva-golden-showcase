import { createFileRoute } from "@tanstack/react-router";

/**
 * Admin-gated AI health endpoint.
 *
 * Confirms whether `getRuntimeConfig("LOVABLE_API_KEY")` resolves in the
 * CURRENT runtime (dev/preview or the published Cloudflare Worker) and reports
 * which AI sub-functions are operational or broken.
 *
 * Never returns any key value — only presence, source and a masked fingerprint.
 */

type SubFunction = {
  name: string;
  label: string;
  provider: "lovable" | "deepseek" | "perplexity";
  model: string;
  status: "ok" | "down";
  reason?: string;
};

export const Route = createFileRoute("/api/admin/ai-health")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  try {
    const url = new URL(request.url);
    let password =
      request.headers.get("x-admin-password") ?? url.searchParams.get("password") ?? undefined;
    if (!password && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { password?: string };
      password = body.password;
    }

    const { assertAdmin } = await import("@/lib/adminWrite.server");
    try {
      await assertAdmin(password);
    } catch {
      return json({ error: "Sesiunea admin a expirat. Autentifică-te din nou." }, 401);
    }

    const { getRuntimeConfig } = await import("@/lib/runtimeConfig.server");
    const key = await getRuntimeConfig("LOVABLE_API_KEY");
    const fromEnv = Boolean(process.env["LOVABLE_API_KEY"]);
    const source: "env" | "app_runtime_config" | "missing" = key
      ? fromEnv
        ? "env"
        : "app_runtime_config"
      : "missing";

    // Live probe of the Lovable AI Gateway (cheap, non-streaming).
    let gateway: { reachable: boolean; status?: number; error?: string } = { reachable: false };
    if (key) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        });
        gateway = { reachable: res.ok, status: res.status };
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          gateway.error =
            res.status === 401 || res.status === 403
              ? "Cheia AI este respinsă (401/403) — rotește cheia și rulează bootstrap-lovable-key."
              : res.status === 429
                ? "Limită de rată atinsă (429) — reîncearcă mai târziu."
                : text.slice(0, 200);
        }
      } catch (err) {
        gateway = { reachable: false, error: err instanceof Error ? err.message : "fetch failed" };
      }
    } else {
      gateway.error = "LOVABLE_API_KEY indisponibil în acest runtime.";
    }

    const lovableOk = Boolean(key) && gateway.reachable;
    const lovableReason = !key
      ? "getRuntimeConfig(\"LOVABLE_API_KEY\") a returnat null în acest runtime."
      : gateway.error;

    const deepseekOk = Boolean(process.env["DEEPSEEK_API_KEY"]);
    const perplexityOk = Boolean(process.env["PERPLEXITY_API_KEY"]);

    const lovableFns: Array<[string, string, string]> = [
      ["aiPropertyRecommendations", "Recomandări AI proprietăți", "google/gemini-2.5-flash"],
      ["extractIdData", "Extragere date CI", "google/gemini-2.5-flash"],
      ["extractCompanyData", "Extragere date firmă", "google/gemini-2.5-flash"],
      ["generateFacebookContent", "Generare conținut Facebook", "google/gemini-2.5-flash"],
      ["generateFurnishedImages", "Generare imagini mobilate", "google/gemini-2.5-flash-image-preview"],
      ["virtualStaging", "Virtual staging", "google/gemini-2.5-flash-image"],
      ["virtual-staging (endpoint)", "Virtual staging (POST /api/virtual-staging)", "openai/gpt-image-2"],
      ["transactionalEmail", "Emailuri tranzacționale", "gateway"],
    ];

    const subFunctions: SubFunction[] = [
      ...lovableFns.map(([name, label, model]) => ({
        name,
        label,
        provider: "lovable" as const,
        model,
        status: (lovableOk ? "ok" : "down") as "ok" | "down",
        ...(lovableOk ? {} : { reason: lovableReason }),
      })),
      {
        name: "chatAssistant",
        label: "Asistent chat",
        provider: "deepseek",
        model: "deepseek-chat",
        status: deepseekOk ? "ok" : "down",
        ...(deepseekOk ? {} : { reason: "DEEPSEEK_API_KEY lipsește în acest runtime." }),
      },
      {
        name: "scrapeProperty",
        label: "Scraping proprietăți",
        provider: "perplexity",
        model: "llama-3.1-sonar-large-128k-online",
        status: perplexityOk ? "ok" : "down",
        ...(perplexityOk ? {} : { reason: "PERPLEXITY_API_KEY lipsește în acest runtime." }),
      },
    ];

    const broken = subFunctions.filter((f) => f.status === "down");

    return json({
      ok: broken.length === 0,
      checkedAt: new Date().toISOString(),
      runtime: { isWorker: !fromEnv && Boolean(key) ? "probabil worker publicat" : "dev/preview sau env prezent" },
      lovableApiKey: {
        resolved: Boolean(key),
        source,
        length: key ? key.length : 0,
        fingerprint: key ? `${key.slice(0, 3)}…` : null,
      },
      gateway,
      summary: {
        total: subFunctions.length,
        active: subFunctions.length - broken.length,
        broken: broken.length,
        brokenNames: broken.map((f) => f.name),
      },
      subFunctions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check a eșuat.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
