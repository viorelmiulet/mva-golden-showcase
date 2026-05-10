// Verifică status code-ul redirecturilor SEO și trimite alerte email dacă se rup.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALERT_COOLDOWN_HOURS = 6;
const DEFAULT_ALERT_EMAIL = "mvaimobiliare@gmail.com";

interface Target {
  id: string;
  url: string;
  expected_status: number;
  expected_location_pattern: string | null;
  is_active: boolean;
  note: string | null;
}

interface CheckResult {
  target_id: string;
  url_tested: string;
  expected_status: number;
  actual_status: number | null;
  actual_location: string | null;
  is_healthy: boolean;
  response_time_ms: number | null;
  error_message: string | null;
  alert_sent: boolean;
}

async function checkUrl(target: Target): Promise<CheckResult> {
  const start = Date.now();
  const result: CheckResult = {
    target_id: target.id,
    url_tested: target.url,
    expected_status: target.expected_status,
    actual_status: null,
    actual_location: null,
    is_healthy: false,
    response_time_ms: null,
    error_message: null,
    alert_sent: false,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(target.url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "MVAImobiliare-RedirectMonitor/1.0 (+https://mvaimobiliare.ro)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);
    result.response_time_ms = Date.now() - start;
    result.actual_status = res.status;
    result.actual_location = res.headers.get("location");
    // Consume body to avoid resource leak
    try { await res.text(); } catch (_) {}

    let healthy = res.status === target.expected_status;
    if (healthy && target.expected_location_pattern && result.actual_location) {
      try {
        const re = new RegExp(target.expected_location_pattern);
        healthy = re.test(result.actual_location);
        if (!healthy) {
          result.error_message = `Location nu se potrivește cu pattern-ul ${target.expected_location_pattern}`;
        }
      } catch (e) {
        result.error_message = `Pattern invalid: ${(e as Error).message}`;
      }
    }
    result.is_healthy = healthy;
    if (!healthy && !result.error_message) {
      result.error_message = `Status ${res.status} (așteptat ${target.expected_status})`;
    }
  } catch (err) {
    result.response_time_ms = Date.now() - start;
    result.error_message = (err as Error).message || "Network error";
    result.is_healthy = false;
  }

  return result;
}

async function sendAlertEmail(
  recipient: string,
  brokenChecks: CheckResult[]
): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[monitor-redirects] RESEND_API_KEY missing, cannot send alert");
    return false;
  }

  const rows = brokenChecks
    .map(
      (c) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:12px;">${c.url_tested}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${c.expected_status}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;color:#dc2626;font-weight:bold;">${c.actual_status ?? "ERR"}</td>
        <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:11px;color:#666;">${c.actual_location ?? "—"}</td>
        <td style="padding:8px;border:1px solid #ddd;font-size:11px;color:#dc2626;">${c.error_message ?? ""}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px;">
      <h2 style="color:#dc2626;">⚠️ ${brokenChecks.length} redirect(uri) SEO non-301 detectate</h2>
      <p>Edge function-ul de monitorizare a detectat că unele URL-uri vechi NU mai returnează status code-ul așteptat.</p>
      <p><strong>Impact SEO:</strong> Google va vedea aceste URL-uri ca duplicate sau pagini diferite, în loc să consolideze autoritatea spre slug-ul canonic.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">URL testat</th>
            <th style="padding:8px;border:1px solid #ddd;">Așteptat</th>
            <th style="padding:8px;border:1px solid #ddd;">Primit</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Location</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Eroare</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p>
        <a href="https://mvaimobiliare.ro/admin/redirect-monitor" style="display:inline-block;background:#DAA520;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Deschide pagina de monitorizare
        </a>
      </p>
      <p style="color:#666;font-size:11px;margin-top:20px;">MVA Imobiliare — Monitor Redirecturi SEO</p>
    </div>
  `;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MVA Monitor <onboarding@resend.dev>",
        to: [recipient],
        subject: `[ALERT] ${brokenChecks.length} redirecturi SEO non-301 detectate`,
        html,
      }),
    });
    const body = await r.text();
    if (!r.ok) {
      console.error("[monitor-redirects] Resend error:", r.status, body);
      return false;
    }
    console.log("[monitor-redirects] Alert email trimis către", recipient);
    return true;
  } catch (e) {
    console.error("[monitor-redirects] Send alert error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Load active targets
    const { data: targets, error: tErr } = await supabase
      .from("redirect_monitor_targets")
      .select("*")
      .eq("is_active", true);

    if (tErr) throw tErr;
    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summary: { total: 0, healthy: 0, broken: 0 } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Run checks in parallel
    const results = await Promise.all((targets as Target[]).map(checkUrl));

    // 3. Anti-spam: only alert on URLs that haven't had alerts in last N hours
    const cooldownIso = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 3600 * 1000).toISOString();
    const broken = results.filter((r) => !r.is_healthy);
    const toAlert: CheckResult[] = [];
    for (const b of broken) {
      const { data: recentAlert } = await supabase
        .from("redirect_monitor_checks")
        .select("id")
        .eq("url_tested", b.url_tested)
        .eq("alert_sent", true)
        .gte("checked_at", cooldownIso)
        .limit(1);
      if (!recentAlert || recentAlert.length === 0) toAlert.push(b);
    }

    // 4. Send email if needed
    let alertSent = false;
    if (toAlert.length > 0) {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "redirect_monitor_alert_email")
        .maybeSingle();
      const recipient = (settings?.value as string) || DEFAULT_ALERT_EMAIL;
      alertSent = await sendAlertEmail(recipient, toAlert);
      if (alertSent) toAlert.forEach((c) => (c.alert_sent = true));
    }

    // 5. Persist all results
    const { error: insErr } = await supabase
      .from("redirect_monitor_checks")
      .insert(results);
    if (insErr) console.error("[monitor-redirects] insert error:", insErr);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          healthy: results.filter((r) => r.is_healthy).length,
          broken: broken.length,
          alert_sent: alertSent,
          new_alerts: toAlert.length,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[monitor-redirects] fatal:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
