/**
 * Cloudflare Pages Function: server-side 301 redirects for /proprietati/:slug
 *
 * Mirrors logic from netlify/edge-functions/slug-redirect.js but runs on
 * Cloudflare Pages (the actual host). Emits real 301 + X-Robots-Tag at edge
 * so Googlebot stops re-crawling UUID variants.
 */

const SUPABASE_URL = "https://fdpandnzblzvamhsoukt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU";

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const passthroughWithNoindex = async (context) => {
  const response = await context.next();
  try {
    const cloned = new Response(response.body, response);
    cloned.headers.set("X-Robots-Tag", "noindex, follow");
    return cloned;
  } catch {
    return response;
  }
};

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const slug = decodeURIComponent(params.slug || "");

  if (!slug) return context.next();

  // UUID → look up canonical slug and 301
  if (isUUID(slug)) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/catalog_offers?select=slug&id=eq.${slug}&limit=1`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        const canonicalSlug = data?.[0]?.slug;
        if (canonicalSlug) {
          const target = `/proprietati/${canonicalSlug}${url.search}`;
          return new Response(null, {
            status: 301,
            headers: {
              Location: new URL(target, url.origin).toString(),
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Robots-Tag": "noindex, follow",
            },
          });
        }
      }
    } catch (err) {
      console.error("[slug-redirect cf] uuid lookup error:", err);
    }
    return passthroughWithNoindex(context);
  }

  try {
    // Pure-numeric suffix (3+ digits) and not a hex shortid → Immoflux idnum
    const numericMatch = slug.match(/(\d{3,})$/);
    const last4 = slug.slice(-4);
    const isHexShortId = /^[a-f0-9]{4}$/i.test(last4) && !/^\d+$/.test(last4);

    if (numericMatch && !isHexShortId) {
      const target = `/proprietate/${slug}${url.search}`;
      return new Response(null, {
        status: 301,
        headers: {
          Location: new URL(target, url.origin).toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (!/^[a-f0-9]{4}$/i.test(last4)) return context.next();

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/catalog_offers?select=slug&id=ilike.${last4}*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) return context.next();
    const data = await res.json();
    const canonicalSlug = data?.[0]?.slug;

    if (canonicalSlug && canonicalSlug !== slug) {
      const target = `/proprietati/${canonicalSlug}${url.search}`;
      return new Response(null, {
        status: 301,
        headers: {
          Location: new URL(target, url.origin).toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err) {
    console.error("[slug-redirect cf] error:", err);
  }

  return context.next();
}
