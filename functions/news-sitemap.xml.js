/**
 * Cloudflare Pages Function: proxy /news-sitemap.xml → Supabase Edge Function.
 */
const SUPABASE_URL = "https://fdpandnzblzvamhsoukt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU";

export async function onRequest() {
  try {
    const upstream = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-news-sitemap`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        // Google News needs freshness: browser 5 min · edge 10 min · stale 1h
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("[news-sitemap.xml proxy] error:", err);
    return new Response("Sitemap unavailable", { status: 502 });
  }
}
