/**
 * Server-only implementations of misc edge functions (wave 3).
 * Ports: google-reviews, monitor-redirects, notify-google-sitemap,
 *        lighthouse-report, social-auto-post, scheduled-social-post,
 *        plausible-analytics, mapbox-token, elevenlabs-conversation-token,
 *        process-sitemap-queue.
 */

type AnyRecord = Record<string, unknown>;
type Result = AnyRecord;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
    rpc: (name: string, args?: AnyRecord) => any;
    storage: { from: (bucket: string) => any };
  };
}

const fail = (error: string): Result => ({ success: false, error });
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* google-reviews                                                       */
/* ------------------------------------------------------------------ */

export async function googleReviews(_body: AnyRecord): Promise<Result> {
  const supabase = await db();

  const { data: cached } = await supabase
    .from("site_settings")
    .select("value, updated_at")
    .eq("key", "google_reviews_cache")
    .single();

  if (cached?.value) {
    const updatedAt = new Date(cached.updated_at).getTime();
    const hoursSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 23) {
      try {
        return JSON.parse(cached.value);
      } catch {
        // fall through to refresh
      }
    }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return fail("GOOGLE_MAPS_API_KEY not configured");

  const placeId = "ChIJ0z61LKEBskARIoiIxFyR1rY";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&language=ro&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places API error:", data.status, data.error_message);
      if (cached?.value) {
        try {
          return JSON.parse(cached.value);
        } catch {
          // ignore
        }
      }
      return fail(data.error_message || data.status);
    }

    const result = {
      reviews: data.result?.reviews || [],
      rating: data.result?.rating || 0,
      totalReviews: data.result?.user_ratings_total || 0,
      name: data.result?.name || "MVA Imobiliare",
    };

    const resultJson = JSON.stringify(result);

    const { error: upsertError } = await supabase
      .from("site_settings")
      .upsert(
        { key: "google_reviews_cache", value: resultJson, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (upsertError) console.error("Error caching reviews:", upsertError);

    return result;
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return fail("Failed to fetch reviews");
  }
}

/* ------------------------------------------------------------------ */
/* monitor-redirects                                                    */
/* ------------------------------------------------------------------ */

const ALERT_COOLDOWN_HOURS = 6;
const DEFAULT_ALERT_EMAIL = "mvaimobiliare@gmail.com";

interface RedirectTarget {
  id: string;
  url: string;
  expected_status: number;
  expected_location_pattern: string | null;
  is_active: boolean;
  note: string | null;
}

interface RedirectCheckResult {
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

async function checkRedirectUrl(target: RedirectTarget): Promise<RedirectCheckResult> {
  const start = Date.now();
  const result: RedirectCheckResult = {
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
        "User-Agent": "MVAImobiliare-RedirectMonitor/1.0 (+https://www.mvaimobiliare.ro)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);
    result.response_time_ms = Date.now() - start;
    result.actual_status = res.status;
    result.actual_location = res.headers.get("location");
    try {
      await res.text();
    } catch {
      // ignore
    }

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

async function sendRedirectAlertEmail(
  recipient: string,
  brokenChecks: RedirectCheckResult[],
): Promise<boolean> {
  const mgKey = process.env.MAILGUN_API_KEY;
  const mgDomain = process.env.MAILGUN_DOMAIN;
  if (!mgKey || !mgDomain) {
    console.error("[monitor-redirects] MAILGUN credentials missing, cannot send alert");
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
      </tr>`,
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
        <a href="https://www.mvaimobiliare.ro/admin/redirect-monitor" style="display:inline-block;background:#DAA520;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Deschide pagina de monitorizare
        </a>
      </p>
      <p style="color:#666;font-size:11px;margin-top:20px;">MVA Imobiliare — Monitor Redirecturi SEO</p>
    </div>
  `;

  try {
    const form = new FormData();
    form.append("from", `MVA Monitor SEO <noreply@${mgDomain}>`);
    form.append("to", recipient);
    form.append("subject", `[ALERT] ${brokenChecks.length} redirecturi SEO non-301 detectate`);
    form.append("html", html);

    const r = await fetch(`https://api.eu.mailgun.net/v3/${mgDomain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`api:${mgKey}`)}` },
      body: form,
    });
    const body = await r.text();
    if (!r.ok) {
      console.error("[monitor-redirects] Mailgun error:", r.status, body);
      return false;
    }
    console.log("[monitor-redirects] Alert email trimis către", recipient);
    return true;
  } catch (e) {
    console.error("[monitor-redirects] Send alert error:", e);
    return false;
  }
}

export async function monitorRedirects(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  try {
    const targetId = typeof body?.target_id === "string" ? (body.target_id as string) : null;

    let query = supabase.from("redirect_monitor_targets").select("*");
    query = targetId ? query.eq("id", targetId) : query.eq("is_active", true);
    const { data: targets, error: tErr } = await query;
    if (tErr) throw tErr;

    if (!targets || targets.length === 0) {
      return { success: true, summary: { total: 0, healthy: 0, broken: 0 } };
    }

    const results = await Promise.all((targets as RedirectTarget[]).map(checkRedirectUrl));

    const cooldownIso = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 3600 * 1000).toISOString();
    const broken = results.filter((r) => !r.is_healthy);
    const toAlert: RedirectCheckResult[] = [];
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

    let alertSent = false;
    if (toAlert.length > 0) {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "redirect_monitor_alert_email")
        .maybeSingle();
      const recipient = (settings?.value as string) || DEFAULT_ALERT_EMAIL;
      alertSent = await sendRedirectAlertEmail(recipient, toAlert);
      if (alertSent) toAlert.forEach((c) => (c.alert_sent = true));
    }

    const { error: insErr } = await supabase.from("redirect_monitor_checks").insert(results);
    if (insErr) console.error("[monitor-redirects] insert error:", insErr);

    return {
      success: true,
      summary: {
        total: results.length,
        healthy: results.filter((r) => r.is_healthy).length,
        broken: broken.length,
        alert_sent: alertSent,
        new_alerts: toAlert.length,
      },
      results,
    };
  } catch (e) {
    console.error("[monitor-redirects] fatal:", e);
    return fail(e instanceof Error ? e.message : "Unknown error");
  }
}

/* ------------------------------------------------------------------ */
/* notify-google-sitemap                                                */
/* ------------------------------------------------------------------ */

const INDEXNOW_KEY = "eigr05fz1t3k1y20luvs3bh4yqd7u73d";
const SITE_URL = "https://www.mvaimobiliare.ro";
const DEFAULT_SITEMAP_URLS = [
  SITE_URL,
  `${SITE_URL}/proprietati`,
  `${SITE_URL}/complexe`,
  `${SITE_URL}/despre-noi`,
  `${SITE_URL}/servicii`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/calculator-credit`,
  `${SITE_URL}/intrebari-frecvente`,
];

function normalizeSitemapUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return DEFAULT_SITEMAP_URLS;
  const validUrls = input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.startsWith(SITE_URL));
  return validUrls.length > 0 ? [...new Set(validUrls)] : DEFAULT_SITEMAP_URLS;
}

export async function notifyGoogleSitemap(body: AnyRecord): Promise<Result> {
  try {
    const targetUrls = normalizeSitemapUrls(body?.targetUrls);

    console.log("Notifying Google and Bing about sitemap update");
    console.log("Target URLs:", targetUrls.length);

    const staticSitemapUrl = `${SITE_URL}/sitemap.xml`;

    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(staticSitemapUrl)}`;
    const googleResponse = await fetch(googlePingUrl, { method: "GET" });
    console.log("Google:", googleResponse.status);

    const bingApiKey = process.env.BING_WEBMASTER_API_KEY;
    let bingResult: { success: boolean; message: string } = { success: false, message: "No API key" };

    if (bingApiKey) {
      try {
        const bingSubmitUrl = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${encodeURIComponent(bingApiKey)}`;
        const bingResponse = await fetch(bingSubmitUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ siteUrl: SITE_URL, urlList: targetUrls }),
        });
        const bingBody = await bingResponse.text();
        console.log("Bing SubmitUrlbatch:", bingResponse.status, bingBody);
        bingResult = { success: bingResponse.ok, message: `Status: ${bingResponse.status}` };
      } catch (bingError) {
        console.error("Bing error:", bingError);
        bingResult = { success: false, message: (bingError as Error).message };
      }
    }

    let indexNowResult: { success: boolean; message: string } = { success: false, message: "not_sent" };
    try {
      const indexNowResponse = await fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "mvaimobiliare.ro",
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: targetUrls,
        }),
      });
      const indexNowBody = await indexNowResponse.text();
      console.log("IndexNow:", indexNowResponse.status, indexNowBody);
      indexNowResult = {
        success: indexNowResponse.ok || indexNowResponse.status === 202,
        message: `Status: ${indexNowResponse.status}`,
      };
    } catch (inError) {
      console.error("IndexNow error:", inError);
      indexNowResult = { success: false, message: (inError as Error).message };
    }

    return {
      success: true,
      google: { success: googleResponse.ok, status: googleResponse.status },
      bing: bingResult,
      indexNow: indexNowResult,
      urls: targetUrls,
      sitemap: staticSitemapUrl,
    };
  } catch (error) {
    console.error("Error notifying search engines:", error);
    return fail((error as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* lighthouse-report                                                    */
/* ------------------------------------------------------------------ */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface LighthouseAuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  scoreDisplayMode?: string;
}

interface LighthouseStrategyReport {
  strategy: "mobile" | "desktop";
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  metrics: {
    lcp?: string;
    fcp?: string;
    cls?: string;
    tbt?: string;
    si?: string;
    ttfb?: string;
    inp?: string;
  };
  opportunities: LighthouseAuditItem[];
  diagnostics: LighthouseAuditItem[];
  fetchTime: string;
  finalUrl: string;
}

async function runPSI(url: string, strategy: "mobile" | "desktop"): Promise<LighthouseStrategyReport> {
  const params = new URLSearchParams({ url, strategy, locale: "ro" });
  ["performance", "seo", "accessibility", "best-practices"].forEach((c) => params.append("category", c));
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PSI ${strategy} failed: ${res.status} - ${txt.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const lr = data.lighthouseResult ?? {};
  const audits = lr.audits ?? {};
  const cats = lr.categories ?? {};

  const pickAudits = (groupPrefix: string): LighthouseAuditItem[] => {
    return Object.values(audits)
      .filter((a: any) => {
        if (!a) return false;
        if (a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "manual") return false;
        return true;
      })
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        score: a.score,
        displayValue: a.displayValue,
        scoreDisplayMode: a.scoreDisplayMode,
      }))
      .filter((a) => {
        const orig: any = audits[a.id];
        if (groupPrefix === "opportunity") {
          return orig?.details?.type === "opportunity" && (orig?.details?.overallSavingsMs ?? 0) > 0;
        }
        if (groupPrefix === "diagnostic") {
          return (
            orig?.details?.type !== "opportunity" &&
            a.score !== null &&
            a.score < 0.9 &&
            a.scoreDisplayMode !== "informative"
          );
        }
        return false;
      });
  };

  return {
    strategy,
    performance: cats.performance?.score ?? null,
    seo: cats.seo?.score ?? null,
    accessibility: cats.accessibility?.score ?? null,
    bestPractices: cats["best-practices"]?.score ?? null,
    metrics: {
      lcp: audits["largest-contentful-paint"]?.displayValue,
      fcp: audits["first-contentful-paint"]?.displayValue,
      cls: audits["cumulative-layout-shift"]?.displayValue,
      tbt: audits["total-blocking-time"]?.displayValue,
      si: audits["speed-index"]?.displayValue,
      ttfb: audits["server-response-time"]?.displayValue,
      inp: audits["interaction-to-next-paint"]?.displayValue,
    },
    opportunities: pickAudits("opportunity").sort((a, b) => (a.score ?? 1) - (b.score ?? 1)),
    diagnostics: pickAudits("diagnostic").sort((a, b) => (a.score ?? 1) - (b.score ?? 1)),
    fetchTime: lr.fetchTime,
    finalUrl: lr.finalUrl,
  };
}

export async function lighthouseReport(body: AnyRecord): Promise<Result> {
  try {
    const url = (body?.url as string) || "https://www.mvaimobiliare.ro/";
    const [mobile, desktop] = await Promise.all([runPSI(url, "mobile"), runPSI(url, "desktop")]);
    return { url, timestamp: new Date().toISOString(), mobile, desktop };
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* social-auto-post                                                     */
/* ------------------------------------------------------------------ */

function buildPropertyDetails(prop: any): string {
  const lines: string[] = [];
  const pricePerSqm =
    prop.price_min && prop.surface_min
      ? `(${(prop.price_min / prop.surface_min).toFixed(2).replace(".", ",")} EUR/mp)`
      : "";
  const price = prop.price_min
    ? `${prop.price_min.toLocaleString("ro-RO")} ${prop.currency || "EUR"} ${pricePerSqm}`
    : "Preț la cerere";
  lines.push(`💰 ${price}`);

  if (prop.rooms) lines.push(`🛏 Camere: ${prop.rooms}`);
  if (prop.bathrooms) lines.push(`🚿 Băi: ${prop.bathrooms}`);
  if (prop.surface_min) lines.push(`📐 Suprafață utilă: ${prop.surface_min} mp`);
  if (prop.surface_max && prop.surface_max !== prop.surface_min)
    lines.push(`📏 Suprafață construită: ${prop.surface_max} mp`);

  if (prop.floor !== null && prop.floor !== undefined) lines.push(`🏢 Etaj: ${prop.floor}`);
  if (prop.total_floors) lines.push(`🔢 Nr. nivele: ${prop.total_floors}`);
  if (prop.balconies) lines.push(`🌅 Balcoane: ${prop.balconies}`);
  if (prop.year_built) lines.push(`📅 An construcție: ${prop.year_built}`);

  if (prop.compartment) lines.push(`🏠 Compartimentare: ${prop.compartment}`);
  if (prop.comfort) lines.push(`⭐ Confort: ${prop.comfort}`);
  if (prop.build_materials) lines.push(`🧱 Structură: ${prop.build_materials}`);
  if (prop.building_type) lines.push(`🏗 Tip locuință: ${prop.building_type}`);
  if (prop.property_subtype) lines.push(`🏘 Tip imobil: ${prop.property_subtype}`);

  if (prop.heating) lines.push(`🔥 Încălzire: ${prop.heating}`);
  if (prop.furnished) lines.push(`🪑 Mobilat: ${prop.furnished}`);
  if (prop.parking) lines.push(`🅿️ Parcare: ${prop.parking}`);

  if (prop.zone) lines.push(`📍 Zonă: ${prop.zone}`);
  if (prop.city) lines.push(`🏙 Oraș: ${prop.city}`);
  if (prop.location) lines.push(`📌 Locație: ${prop.location}`);

  if (prop.availability_status) lines.push(`✅ Disponibilitate: ${prop.availability_status}`);
  if (prop.transaction_type)
    lines.push(
      `📋 Tip tranzacție: ${prop.transaction_type === "sale" ? "Vânzare" : prop.transaction_type === "rent" ? "Închiriere" : prop.transaction_type}`,
    );

  const amenities: string[] = [];
  if (prop.has_ac) amenities.push("Aer condiționat");
  if (prop.has_electricity) amenities.push("Curent");
  if (prop.has_water) amenities.push("Apă");
  if (prop.has_gas) amenities.push("Gaz");
  if (prop.has_internet) amenities.push("Internet");
  if (prop.has_tv) amenities.push("CATV");
  if (prop.has_security) amenities.push("Pază");
  if (amenities.length > 0) lines.push(`⚡ Utilități: ${amenities.join(" • ")}`);

  if (prop.features?.length) lines.push(`✨ Finisaje: ${prop.features.join(" • ")}`);

  return lines.join("\n");
}

export async function socialAutoPost(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  try {
    const { propertyId, projectId, blogPostId, action, platform, type } = body as {
      propertyId?: string;
      projectId?: string;
      blogPostId?: string;
      action?: string;
      platform?: string;
      type?: string;
    };
    console.log(
      "social-auto-post: Action:",
      action,
      "PropertyId:",
      propertyId,
      "ProjectId:",
      projectId,
      "BlogPostId:",
      blogPostId,
      "Platform:",
      platform,
      "Type:",
      type,
    );

    if (action === "test") {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "social_webhooks")
        .single();

      if (!settings?.value) {
        console.log("social-auto-post: No webhooks configured");
        return { success: false, error: "No webhooks configured" };
      }

      const webhooks = JSON.parse(settings.value);
      console.log("social-auto-post: Webhooks config:", JSON.stringify(webhooks));

      if (!webhooks.enabled) {
        return { success: false, error: "Auto-posting is disabled" };
      }

      const testResults: Record<string, { success: boolean; status?: number; error?: string }> = {};
      const nonUrlKeys = ["enabled", "scheduled", "scheduleInterval", "lastScheduledRun", "hashtags"];
      for (const [pf, webhookUrl] of Object.entries(webhooks)) {
        if (nonUrlKeys.includes(pf) || !webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("http"))
          continue;

        console.log(`social-auto-post: Testing ${pf} webhook: ${webhookUrl}`);

        try {
          const testPayload = {
            test: true,
            platform: pf,
            message: "Test de conexiune de la MVA Imobiliare",
            timestamp: new Date().toISOString(),
            source: "mva-imobiliare-test",
          };

          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testPayload),
          });

          testResults[pf] = { success: response.ok, status: response.status };
          console.log(`social-auto-post: ${pf} test result: ${response.status}`);
        } catch (error) {
          console.error(`social-auto-post: ${pf} test error:`, error);
          testResults[pf] = { success: false, error: (error as Error).message };
        }
      }

      const allSuccess = Object.values(testResults).every((r) => r.success);
      const configuredPlatforms = Object.keys(testResults);

      return {
        success: allSuccess || configuredPlatforms.length === 0,
        message:
          configuredPlatforms.length > 0
            ? `Testat: ${configuredPlatforms.join(", ")}`
            : "Niciun webhook configurat",
        results: testResults,
      };
    }

    const isBlogPost = type === "blog" || Boolean(blogPostId);
    const isProject = !isBlogPost && (type === "project" || Boolean(projectId));

    let property: any = null;
    let project: any = null;
    let blogPost: any = null;

    if (isBlogPost) {
      const { data: blogData, error: blogError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", blogPostId)
        .single();
      if (blogError || !blogData) {
        console.error("Blog post not found:", blogError);
        return { success: false, error: "Blog post not found" };
      }
      blogPost = blogData;
    } else if (isProject) {
      const { data: projectData, error: projectError } = await supabase
        .from("real_estate_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (projectError || !projectData) {
        console.error("Project not found:", projectError);
        return { success: false, error: "Project not found" };
      }
      project = projectData;
    } else {
      const { data: propertyData, error: propertyError } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("id", propertyId)
        .single();
      if (propertyError || !propertyData) {
        console.error("Property not found:", propertyError);
        return { success: false, error: "Property not found" };
      }
      property = propertyData;
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_webhooks")
      .single();

    if (!settings?.value) {
      console.log("No webhooks configured, skipping auto-post");
      return { success: false, error: "No webhooks configured" };
    }

    const webhooks = JSON.parse(settings.value);
    const results: Record<string, boolean> = {};
    const siteUrl = process.env.SITE_URL || "https://www.mvaimobiliare.ro";

    const customHashtags =
      webhooks.hashtags ||
      "#imobiliare #apartament #bucuresti #MVAImobiliare #militariresidence #apartamentdevanzare #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #apartamentnoi";

    const generatePropertyContent = (_platform: string, prop: any): string => {
      const propertyUrl = `${siteUrl}/proprietati/${prop.slug || prop.id}`;
      const details = buildPropertyDetails(prop);
      return `🏠 ${prop.title}\n\n${details}\n\n📞 0767.941.512\n🌐 mvaimobiliare.ro\n\n👉 Detalii: ${propertyUrl}\n\n${customHashtags}`;
    };

    const generateProjectContent = (_platform: string, proj: any): string => {
      const location = proj.location || "București";
      const projectUrl = `${siteUrl}/complexe/${proj.slug || proj.id}`;
      const priceRange = proj.price_range || "Preț la cerere";
      const surfaceRange = proj.surface_range || "";
      const roomsRange = proj.rooms_range || "";

      const projectName = proj.name?.toLowerCase().replace(/\s+/g, "") || "";
      const projectHashtags = `#imobiliare #ansamblrezidential #bucuresti #MVAImobiliare #${projectName} #apartamentnoi #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #dezvoltatorimobiliar`;

      return `🏗️ ${proj.name}\n\n📍 ${location}\n💰 ${priceRange}\n${surfaceRange ? `📐 ${surfaceRange}` : ""}\n${roomsRange ? `🛏 ${roomsRange}` : ""}\n\n${proj.description ? proj.description.substring(0, 200) + (proj.description.length > 200 ? "..." : "") : ""}\n\n📞 0767.941.512\n🌐 mvaimobiliare.ro\n\n👉 Detalii: ${projectUrl}\n\n${projectHashtags}`;
    };

    const generateBlogContent = (_platform: string, post: any): string => {
      const blogUrl = `${siteUrl}/blog/${post.slug}`;
      const category = post.category || "Imobiliare";
      const excerpt = post.excerpt?.substring(0, 300) || "";
      const blogHashtags = `#imobiliare #blog #MVAImobiliare #${category.toLowerCase().replace(/\s+/g, "")} #sfaturiimobiliare #bucuresti #ghidimobiliar`;

      return `📝 ${post.title}\n\n📂 Categorie: ${category}\n${post.read_time ? `⏱ Timp de citire: ${post.read_time}` : ""}\n\n${excerpt}${excerpt.length >= 300 ? "..." : ""}\n\n📞 0767.941.512\n🌐 mvaimobiliare.ro\n\n👉 Citește articolul: ${blogUrl}\n\n${blogHashtags}`;
    };

    console.log("social-auto-post: Sending to webhooks...");

    const platformsToSend: [string, unknown][] =
      platform && platform !== "all" ? [[platform, webhooks[platform]]] : Object.entries(webhooks);

    for (const [platformName, webhookUrl] of platformsToSend) {
      if (
        platformName === "enabled" ||
        platformName === "scheduled" ||
        platformName === "scheduleInterval" ||
        platformName === "lastScheduledRun" ||
        platformName === "hashtags" ||
        !webhookUrl ||
        typeof webhookUrl !== "string"
      )
        continue;

      console.log(`social-auto-post: Sending to ${platformName}: ${webhookUrl}`);

      let payload: AnyRecord;

      if (isBlogPost && blogPost) {
        const content = generateBlogContent(platformName, blogPost);
        const blogUrl = `${siteUrl}/blog/${blogPost.slug}`;
        const category = blogPost.category || "Imobiliare";
        const blogHashtags = `#imobiliare #blog #MVAImobiliare #${category.toLowerCase().replace(/\s+/g, "")} #sfaturiimobiliare #bucuresti #ghidimobiliar`;

        let coverImage = blogPost.cover_image || "";
        if (coverImage && !coverImage.startsWith("http")) {
          coverImage = `${siteUrl}${coverImage.startsWith("/") ? "" : "/"}${coverImage}`;
        }

        payload = {
          type: "blog",
          blogPost: {
            id: blogPost.id,
            title: blogPost.title,
            slug: blogPost.slug,
            excerpt: blogPost.excerpt,
            cover_image: coverImage,
            category: blogPost.category,
            author: blogPost.author,
            read_time: blogPost.read_time,
          },
          platform: platformName,
          content,
          propertyUrl: blogUrl,
          imageUrl: coverImage,
          timestamp: new Date().toISOString(),
          title: blogPost.title,
          description: blogPost.excerpt || "",
          location: "București",
          price: "",
          rooms: "",
          surface: "",
          hashtags: blogHashtags,
          website: "mvaimobiliare.ro",
          phone: "0767.941.512",
          message: content,
          instagram_caption: content,
          tiktok_caption: content,
          google_caption: content.replace(blogHashtags, "").trim(),
          google_title: (blogPost.title || "").slice(0, 55),
          media: coverImage,
          media_url: coverImage,
          image_url: coverImage,
          photo_url: coverImage,
          photo: coverImage,
          url: blogUrl,
          sourceUrl: blogUrl,
          couponCode: blogPost.slug || blogPost.id,
          sourceType: "blog",
          category,
          slug: blogPost.slug,
          all_images: coverImage ? [coverImage] : [],
          images_count: coverImage ? 1 : 0,
          image_1: coverImage || undefined,
          instagram_carousel: {
            enabled: false,
            images: coverImage ? [coverImage] : [],
            images_count: coverImage ? 1 : 0,
            caption: content,
          },
          carousel_images_csv: coverImage || "",
          carousel_images_json: JSON.stringify(coverImage ? [coverImage] : []),
        };
      } else if (isProject && project) {
        const content = generateProjectContent(platformName, project);
        const projectSlug = project.slug || project.id;
        const projectUrl = `${siteUrl}/complexe/${projectSlug}`;

        let projectImage = project.main_image || "";
        if (projectImage && !projectImage.startsWith("http")) {
          projectImage = `${siteUrl}${projectImage.startsWith("/") ? "" : "/"}${projectImage}`;
        }
        console.log(`social-auto-post: Project image URL: ${projectImage}`);

        const projectName = project.name?.toLowerCase().replace(/\s+/g, "") || "";
        const projectHashtags = `#imobiliare #ansamblrezidential #bucuresti #MVAImobiliare #${projectName} #apartamentnoi #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #dezvoltatorimobiliar`;

        const projectCaption = content;
        const facebookLocation = "Militari Residence";

        payload = {
          type: "project",
          project: {
            id: project.id,
            name: project.name,
            location: facebookLocation,
            description: project.description?.substring(0, 500) || "",
            main_image: projectImage,
            price_range: project.price_range,
            surface_range: project.surface_range,
            rooms_range: project.rooms_range,
            developer: project.developer,
            status: project.status,
          },
          platform: platformName,
          content: content.replace(project.location || "București", facebookLocation),
          propertyUrl: projectUrl,
          imageUrl: projectImage,
          timestamp: new Date().toISOString(),
          title: project.name,
          description: project.description?.substring(0, 500) || "",
          location: facebookLocation,
          price: project.price_range || "Preț la cerere",
          rooms: project.rooms_range || "",
          surface: project.surface_range || "",
          hashtags: projectHashtags,
          website: "mvaimobiliare.ro",
          phone: "0767.941.512",
          message: content.replace(project.location || "București", facebookLocation),
          instagram_caption: projectCaption.replace(project.location || "București", facebookLocation),
          tiktok_caption: projectCaption.replace(project.location || "București", facebookLocation),
          google_caption: content
            .replace(projectHashtags, "")
            .replace(project.location || "București", facebookLocation)
            .trim(),
          google_title: (project.name || "").slice(0, 55),
          media: projectImage,
          media_url: projectImage,
          image_url: projectImage,
          photo_url: projectImage,
          photo: projectImage,
          url: projectUrl,
          all_images: projectImage ? [projectImage] : [],
          images_count: projectImage ? 1 : 0,
          image_1: projectImage || undefined,
          instagram_carousel: {
            enabled: false,
            images: projectImage ? [projectImage] : [],
            images_count: projectImage ? 1 : 0,
            caption: projectCaption.replace(project.location || "București", facebookLocation),
          },
          carousel_images_csv: projectImage || "",
          carousel_images_json: JSON.stringify(projectImage ? [projectImage] : []),
        };
      } else {
        const content = generatePropertyContent(platformName, property);
        const richDetails = buildPropertyDetails(property);

        const priceFormatted = property.price_min
          ? `${property.price_min.toLocaleString("ro-RO")} ${property.currency || "EUR"}`
          : "Preț la cerere";

        const roomsFormatted = property.rooms
          ? `${property.rooms} ${property.rooms === 1 ? "cameră" : "camere"}`
          : "";
        const surfaceFormatted = property.surface_min ? `${property.surface_min} mp` : "";
        const locationFormatted = property.location || "Militari Residence";
        const propertyUrl = `${siteUrl}/proprietati/${property.slug || property.id}`;

        const hashtags = customHashtags;
        const richDescription = richDetails;

        const instagramCaption = `🏠 ${property.title}\n\n${richDetails}\n\n📞 0767.941.512\n🌐 mvaimobiliare.ro\n\n👉 Detalii: ${propertyUrl}\n\n${hashtags}`;
        const tiktokCaption = instagramCaption;
        const googleCaption = `🏠 ${property.title}\n\n${richDetails}\n\n📞 0767.941.512\n🌐 mvaimobiliare.ro\n\n👉 Detalii: ${propertyUrl}`;

        const allImages: string[] = property.images || [];
        const firstImageUrl = allImages[0] || "";

        const imageFields: Record<string, string> = {};
        allImages.forEach((img: string, i: number) => {
          imageFields[`image_${i + 1}`] = img;
        });

        payload = {
          type: "property",
          property: {
            id: property.id,
            title: property.title,
            location: locationFormatted,
            price_min: property.price_min,
            price_max: property.price_max,
            rooms: property.rooms,
            surface_min: property.surface_min,
            surface_max: property.surface_max,
            images: allImages,
            description: richDescription,
            currency: property.currency,
          },
          platform: platformName,
          content,
          propertyUrl,
          imageUrl: firstImageUrl,
          timestamp: new Date().toISOString(),
          title: property.title,
          description: richDescription,
          location: locationFormatted,
          price: priceFormatted,
          rooms: roomsFormatted,
          surface: surfaceFormatted,
          hashtags,
          website: "mvaimobiliare.ro",
          phone: "0767.941.512",
          message: content.replace(property.location || "Militari Residence", locationFormatted),
          instagram_caption: instagramCaption,
          tiktok_caption: tiktokCaption,
          google_caption: googleCaption,
          google_title: (property.title || "").slice(0, 55),
          media: firstImageUrl,
          media_url: firstImageUrl,
          image_url: firstImageUrl,
          photo_url: firstImageUrl,
          photo: firstImageUrl,
          url: propertyUrl,
          all_images: allImages,
          images_count: allImages.length,
          ...imageFields,
          instagram_carousel: {
            enabled: allImages.length > 1,
            images: allImages,
            images_count: allImages.length,
            caption: instagramCaption,
          },
          carousel_images_csv: allImages.join(","),
          carousel_images_json: JSON.stringify(allImages),
        };
      }

      let finalPayload: AnyRecord = payload;
      if (platformName === "facebook") {
        finalPayload = {
          message: payload.message,
          url: payload.url,
          sourceUrl: payload.sourceUrl || payload.url,
          couponCode: payload.couponCode,
          sourceType: payload.sourceType || payload.type,
          category: payload.category,
          slug: payload.slug,
          title: payload.title,
          description: payload.description,
          location: payload.location,
          price: payload.price,
          rooms: payload.rooms || undefined,
          surface: payload.surface || undefined,
          hashtags: payload.hashtags,
          website: payload.website,
          phone: payload.phone,
          timestamp: payload.timestamp,
          platform: "facebook",
          type: payload.type,
        };
        if (typeof payload.photo === "string" && payload.photo.startsWith("http")) {
          finalPayload.photo = payload.photo;
          finalPayload.image_url = payload.photo;
        }
        const validImages = ((payload.all_images as string[]) || []).filter(
          (img: string) => img && img.startsWith("http"),
        );
        if (validImages.length > 0) {
          finalPayload.images_count = validImages.length;
          validImages.forEach((img: string, i: number) => {
            finalPayload[`image_${i + 1}`] = img;
          });
        }
      } else if (platformName === "google") {
        finalPayload = {
          platform: "google",
          type: payload.type,
          title: ((payload.google_title as string) || (payload.title as string) || "").slice(0, 55),
          google_title: ((payload.google_title as string) || (payload.title as string) || "").slice(0, 55),
          description: payload.google_caption || payload.description,
          google_caption: payload.google_caption || payload.description,
          message: payload.google_caption || payload.message,
          url: payload.url,
          sourceUrl: payload.sourceUrl || payload.url,
          couponCode: payload.couponCode,
          sourceType: payload.sourceType || payload.type,
          category: payload.category,
          slug: payload.slug,
          media: payload.media,
          media_url: payload.media_url,
          image_url: payload.image_url,
          photo_url: payload.photo_url,
          photo: payload.photo,
          website: payload.website,
          phone: payload.phone,
          timestamp: payload.timestamp,
        };
      }

      Object.keys(finalPayload).forEach((key) => {
        if (finalPayload[key] === undefined || finalPayload[key] === "" || finalPayload[key] === null) {
          delete finalPayload[key];
        }
      });

      console.log(
        `social-auto-post: Payload for ${platformName}:`,
        JSON.stringify(finalPayload).substring(0, 500),
      );

      try {
        const response = await fetch(webhookUrl as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload),
        });

        const responseText = await response.text();
        results[platformName] = response.ok;
        console.log(
          `social-auto-post: ${platformName} response: ${response.status} - ${responseText.substring(0, 200)}`,
        );
      } catch (error) {
        console.error(`social-auto-post: ${platformName} error:`, error);
        results[platformName] = false;
      }
    }

    if (isBlogPost && blogPost) {
      const googleBlogWebhookUrl = "https://hook.eu1.make.com/ahz56ke5274z2lwjrygr723455erceff";
      const blogUrl = `${siteUrl}/blog/${blogPost.slug}`;
      let coverImage = blogPost.cover_image || "";
      if (coverImage && !coverImage.startsWith("http")) {
        coverImage = `${siteUrl}${coverImage.startsWith("/") ? "" : "/"}${coverImage}`;
      }
      const category = blogPost.category || "Imobiliare";

      const googleBlogPayload = {
        platform: "google",
        type: "blog",
        title: (blogPost.title || "").slice(0, 55),
        google_title: (blogPost.title || "").slice(0, 55),
        description: blogPost.excerpt || "",
        message: `📝 ${blogPost.title}\n\n📂 ${category}\n\n${(blogPost.excerpt || "").substring(0, 300)}\n\n👉 ${blogUrl}`,
        url: blogUrl,
        sourceUrl: blogUrl,
        category,
        slug: blogPost.slug,
        media: coverImage,
        photo: coverImage,
        image_url: coverImage,
        website: "mvaimobiliare.ro",
        phone: "0767.941.512",
        timestamp: new Date().toISOString(),
      };

      console.log(`social-auto-post: Sending blog to Google Blog webhook: ${googleBlogWebhookUrl}`);
      try {
        const response = await fetch(googleBlogWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(googleBlogPayload),
        });
        const responseText = await response.text();
        results["google_blog"] = response.ok;
        console.log(`social-auto-post: google_blog response: ${response.status} - ${responseText.substring(0, 200)}`);
      } catch (error) {
        console.error("social-auto-post: google_blog error:", error);
        results["google_blog"] = false;
      }
    }

    const recordId = isBlogPost ? blogPostId : isProject ? projectId : propertyId;
    const recordTitle = isBlogPost ? blogPost?.title : isProject ? project?.name : property?.title;
    const recordType = isBlogPost ? "blog" : isProject ? "project" : "property";
    await supabase.from("audit_logs").insert({
      action_type: "social_auto_post",
      record_id: recordId,
      record_title: recordTitle,
      metadata: { type: recordType, results, webhooks: Object.keys(webhooks) },
    });

    return { success: true, results };
  } catch (error) {
    console.error("Error in social-auto-post:", error);
    return fail((error as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* scheduled-social-post                                                */
/* ------------------------------------------------------------------ */

export async function scheduledSocialPost(_body: AnyRecord): Promise<Result> {
  const supabase = await db();
  try {
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_webhooks")
      .single();

    if (!settingsData?.value) {
      console.log("scheduled-social-post: No webhooks configured");
      return { success: false, error: "No webhooks configured" };
    }

    const settings = JSON.parse(settingsData.value);

    if (!settings.enabled || !settings.scheduled) {
      console.log("scheduled-social-post: Scheduled posting is disabled");
      return { success: false, error: "Scheduled posting is disabled" };
    }

    const lastRun = settings.lastScheduledRun
      ? new Date(settings.lastScheduledRun)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log("scheduled-social-post: Last run:", lastRun.toISOString());

    const { data: properties, error: propertiesError } = await supabase
      .from("catalog_offers")
      .select("*")
      .gt("created_at", lastRun.toISOString())
      .is("project_id", null)
      .order("created_at", { ascending: true });

    if (propertiesError) {
      console.error("scheduled-social-post: Error fetching properties:", propertiesError);
      throw propertiesError;
    }

    if (!properties || properties.length === 0) {
      console.log("scheduled-social-post: No new properties to post");

      settings.lastScheduledRun = new Date().toISOString();
      await supabase
        .from("site_settings")
        .update({ value: JSON.stringify(settings), updated_at: new Date().toISOString() })
        .eq("key", "social_webhooks");

      return { success: true, message: "No new properties to post", count: 0 };
    }

    console.log(`scheduled-social-post: Found ${properties.length} new properties`);

    const siteUrl = process.env.SITE_URL || "https://www.mvaimobiliare.ro";
    let totalPosted = 0;
    const allResults: AnyRecord[] = [];

    const generateContent = (platform: string, prop: any): string => {
      const price = prop.price_min
        ? `${prop.price_min.toLocaleString("ro-RO")} ${prop.currency || "EUR"}`
        : "Preț la cerere";

      const surface = prop.surface_min ? `${prop.surface_min} mp` : "";
      const rooms = prop.rooms ? `${prop.rooms} camere` : "";
      const details = [rooms, surface].filter(Boolean).join(" • ");

      switch (platform) {
        case "facebook":
          return `${prop.title}\n📍 ${prop.location || "București"}\n💰 ${price}\n${details ? `📐 ${details}\n` : ""}\n${prop.description?.substring(0, 200) || ""}\n\n👉 Detalii: ${siteUrl}/proprietati/${prop.slug || prop.id}\n\n#imobiliare #apartament #bucuresti #MVAImobiliare`;
        case "instagram":
          return `${prop.title}\n\n📍 ${prop.location || "București"}\n💰 ${price}\n${details ? `📐 ${details}\n` : ""}\n\n${prop.description?.substring(0, 300) || ""}\n\n👉 Link in bio!\n\n#imobiliare #apartament #bucuresti #proprietate #investitie #acasa #realestate #MVAImobiliare #apartamentdevaznare #locuinta`;
        case "linkedin":
          return `${prop.title}\n\n📍 Locație: ${prop.location || "București"}\n💼 Preț: ${price}\n${details ? `📊 ${details}\n` : ""}\n\nContactați-ne pentru detalii și programarea unei vizionări.\n\n${siteUrl}/proprietati/${prop.slug || prop.id}\n\n#RealEstate #Investment #Property`;
        default:
          return `${prop.title} - ${price} - ${prop.location || "București"}`;
      }
    };

    for (const property of properties) {
      const results: Record<string, boolean> = {};

      for (const [platform, webhookUrl] of Object.entries(settings)) {
        if (
          platform === "enabled" ||
          platform === "scheduled" ||
          platform === "scheduleInterval" ||
          platform === "lastScheduledRun" ||
          !webhookUrl ||
          typeof webhookUrl !== "string"
        )
          continue;

        console.log(`scheduled-social-post: Sending ${property.title} to ${platform}`);

        const content = generateContent(platform, property);
        const payload = {
          property: {
            id: property.id,
            title: property.title,
            location: property.location,
            price_min: property.price_min,
            price_max: property.price_max,
            rooms: property.rooms,
            surface_min: property.surface_min,
            surface_max: property.surface_max,
            images: property.images,
            description: property.description,
            currency: property.currency,
            created_at: property.created_at,
          },
          platform,
          content,
          propertyUrl: `${siteUrl}/proprietati/${property.slug || property.id}`,
          imageUrl: property.images?.[0] || undefined,
          timestamp: new Date().toISOString(),
        };

        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          results[platform] = response.ok;
          console.log(`scheduled-social-post: ${platform} response: ${response.status}`);
        } catch (error) {
          console.error(`scheduled-social-post: ${platform} error:`, error);
          results[platform] = false;
        }
      }

      await supabase.from("audit_logs").insert({
        action_type: "social_auto_post",
        record_id: property.id,
        record_title: property.title,
        metadata: { results, source: "scheduled", webhooks: Object.keys(results) },
      });

      allResults.push({ propertyId: property.id, title: property.title, results });
      totalPosted++;

      await delay(1000);
    }

    settings.lastScheduledRun = new Date().toISOString();
    await supabase
      .from("site_settings")
      .update({ value: JSON.stringify(settings), updated_at: new Date().toISOString() })
      .eq("key", "social_webhooks");

    console.log(`scheduled-social-post: Completed. Posted ${totalPosted} properties`);

    return {
      success: true,
      message: `Posted ${totalPosted} properties`,
      count: totalPosted,
      results: allResults,
    };
  } catch (error) {
    console.error("Error in scheduled-social-post:", error);
    return fail((error as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* plausible-analytics                                                  */
/* ------------------------------------------------------------------ */

const PLAUSIBLE_SITE_ID = "mvaimobiliare.ro";
const PLAUSIBLE_API_URL = "https://plausible.io/api/v1/stats";

export async function plausibleAnalytics(body: AnyRecord): Promise<Result> {
  const plausibleApiKey = process.env.PLAUSIBLE_API_KEY;
  try {
    const days = Number(body?.days) || 7;

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));

    const period = `${startDate.toISOString().split("T")[0]},${endDate.toISOString().split("T")[0]}`;

    console.log(`Fetching Plausible data for ${PLAUSIBLE_SITE_ID}, period: ${period}`);

    const authHeaders = { Authorization: `Bearer ${plausibleApiKey}` };

    const aggregateResponse = await fetch(
      `${PLAUSIBLE_API_URL}/aggregate?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
      { headers: authHeaders },
    );

    if (!aggregateResponse.ok) {
      throw new Error(`Plausible API error: ${aggregateResponse.status}`);
    }

    const aggregateData: any = await aggregateResponse.json();
    console.log("Aggregate data:", aggregateData);

    const timeseriesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/timeseries?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&metrics=visitors,pageviews`,
      { headers: authHeaders },
    );
    const timeseriesData: any = await timeseriesResponse.json();

    const pagesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&property=event:page&metrics=visitors,pageviews&limit=10`,
      { headers: authHeaders },
    );
    const pagesData: any = await pagesResponse.json();

    const sourcesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&property=visit:source&metrics=visitors&limit=10`,
      { headers: authHeaders },
    );
    const sourcesData: any = await sourcesResponse.json();

    const devicesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&property=visit:device&metrics=visitors`,
      { headers: authHeaders },
    );
    const devicesData: any = await devicesResponse.json();

    const countriesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${PLAUSIBLE_SITE_ID}&period=custom&date=${period}&property=visit:country&metrics=visitors&limit=10`,
      { headers: authHeaders },
    );
    const countriesData: any = await countriesResponse.json();

    const result = {
      visitors: aggregateData.results.visitors.value || 0,
      pageviews: aggregateData.results.pageviews.value || 0,
      sessionDuration: Math.round(aggregateData.results.visit_duration.value || 0),
      bounceRate: Math.round(aggregateData.results.bounce_rate.value || 0),
      dailyData:
        timeseriesData.results?.map((item: any) => ({
          date: item.date,
          visitors: item.visitors || 0,
          pageviews: item.pageviews || 0,
        })) || [],
      topPages:
        pagesData.results?.map((item: any) => ({
          page: item.page,
          visitors: item.visitors || 0,
          pageviews: item.pageviews || 0,
        })) || [],
      topSources:
        sourcesData.results?.map((item: any) => ({
          source: item.source || "Direct",
          visitors: item.visitors || 0,
        })) || [],
      devices:
        devicesData.results?.map((item: any) => ({
          device: item.device,
          visitors: item.visitors || 0,
        })) || [],
      countries:
        countriesData.results?.map((item: any) => ({
          country: item.country,
          visitors: item.visitors || 0,
        })) || [],
    };

    console.log("Formatted result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching Plausible analytics:", error);
    return { error: (error as Error).message, details: "Failed to fetch analytics data from Plausible" };
  }
}

/* ------------------------------------------------------------------ */
/* mapbox-token                                                         */
/* ------------------------------------------------------------------ */

export async function mapboxToken(_body: AnyRecord): Promise<Result> {
  try {
    const MAPBOX_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN;
    if (!MAPBOX_TOKEN) throw new Error("MAPBOX_PUBLIC_TOKEN not configured");
    return { token: MAPBOX_TOKEN };
  } catch (error) {
    console.error("Error in mapbox-token function:", error);
    return { error: (error as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* elevenlabs-conversation-token                                        */
/* ------------------------------------------------------------------ */

export async function elevenlabsConversationToken(body: AnyRecord): Promise<Result> {
  try {
    const agentId = body?.agentId as string | undefined;
    if (!agentId) return { error: "Agent ID is required" };

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      return { error: "ElevenLabs API key not configured" };
    }

    console.log("Requesting conversation token for agent:", agentId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { method: "GET", headers: { "xi-api-key": ELEVENLABS_API_KEY } },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return { error: `ElevenLabs API error: ${response.status}` };
    }

    const data: any = await response.json();
    console.log("Token received successfully");
    return { token: data.token };
  } catch (error) {
    console.error("Error in elevenlabs-conversation-token:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/* process-sitemap-queue                                                */
/* ------------------------------------------------------------------ */

const DEFAULT_QUEUE_URLS = [
  "https://www.mvaimobiliare.ro",
  "https://www.mvaimobiliare.ro/proprietati",
  "https://www.mvaimobiliare.ro/complexe",
  "https://www.mvaimobiliare.ro/blog",
];

function extractSitemapTargetUrls(notifications: Array<{ metadata?: { target_urls?: unknown } }>): string[] {
  const urls = notifications.flatMap((notification) => {
    const targetUrls = notification?.metadata?.target_urls;
    return Array.isArray(targetUrls) ? targetUrls.filter((url): url is string => typeof url === "string") : [];
  });
  return urls.length > 0 ? [...new Set(urls)] : DEFAULT_QUEUE_URLS;
}

export async function processSitemapQueue(_body: AnyRecord): Promise<Result> {
  const supabase = await db();
  try {
    console.log("[process-sitemap-queue] Starting processing");

    const { data: notifications, error: fetchError } = await supabase
      .from("sitemap_notifications")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error("[process-sitemap-queue] Fetch error:", fetchError);
      return { success: true, message: "Sitemap queue processing started in background" };
    }

    if (!notifications || notifications.length === 0) {
      console.log("[process-sitemap-queue] No notifications to process");
      return { success: true, message: "Sitemap queue processing started in background" };
    }

    console.log(`[process-sitemap-queue] Processing ${notifications.length} notifications`);
    const targetUrls = extractSitemapTargetUrls(notifications);
    console.log(`[process-sitemap-queue] Sending ${targetUrls.length} URLs to notification function`);

    try {
      const notifyResult = await notifyGoogleSitemap({ targetUrls });
      console.log("[process-sitemap-queue] Successfully notified search engines:", notifyResult);
    } catch (notifyError) {
      console.error("[process-sitemap-queue] Notify error:", notifyError);
    }

    const notificationIds = notifications.map((n: any) => n.id);
    const { error: deleteError } = await supabase.from("sitemap_notifications").delete().in("id", notificationIds);

    if (deleteError) {
      console.error("[process-sitemap-queue] Delete error:", deleteError);
    } else {
      console.log(`[process-sitemap-queue] Deleted ${notificationIds.length} processed notifications`);
    }

    return { success: true, message: "Sitemap queue processing started in background" };
  } catch (error) {
    console.error("[process-sitemap-queue] Error:", error);
    return fail((error as Error).message);
  }
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                           */
/* ------------------------------------------------------------------ */

export const MISC_OPS_HANDLERS = {
  "google-reviews": googleReviews,
  "monitor-redirects": monitorRedirects,
  "notify-google-sitemap": notifyGoogleSitemap,
  "lighthouse-report": lighthouseReport,
  "social-auto-post": socialAutoPost,
  "scheduled-social-post": scheduledSocialPost,
  "plausible-analytics": plausibleAnalytics,
  "mapbox-token": mapboxToken,
  "elevenlabs-conversation-token": elevenlabsConversationToken,
  "process-sitemap-queue": processSitemapQueue,
} as const;

export type MiscOpsFunctionName = keyof typeof MISC_OPS_HANDLERS;

export async function runMiscOpsFunction(name: MiscOpsFunctionName, body: AnyRecord): Promise<Result> {
  const handler = MISC_OPS_HANDLERS[name];
  if (!handler) return fail(`Unknown function: ${name}`);
  try {
    return await handler(body);
  } catch (e) {
    console.error(`[miscOps:${name}]`, e);
    return fail(e instanceof Error ? e.message : "Unknown error");
  }
}
