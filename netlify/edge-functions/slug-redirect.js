/**
 * Server-side 301 redirects for old property slugs.
 * Looks up the canonical slug from the database based on the short ID
 * (last 4 chars for catalog_offers, last numeric segment for Immoflux)
 * and issues a 301 redirect if the URL slug is outdated.
 *
 * This preserves SEO link juice when slug formats change.
 */

const SUPABASE_URL = "https://fdpandnzblzvamhsoukt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU";

const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip non-property routes
  const isCatalog = path.startsWith("/proprietati/");
  const isImmoflux = path.startsWith("/proprietate/");
  if (!isCatalog && !isImmoflux) {
    return context.next();
  }

  const slug = decodeURIComponent(path.split("/")[2] || "");
  if (!slug) return context.next();

  // UUID URLs: server-side 301 to canonical slug + noindex signal for crawlers
  if (isUUID(slug)) {
    if (isCatalog) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/catalog_offers?select=slug&id=eq.${slug}&limit=1`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
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
        console.error("[slug-redirect] uuid lookup error:", err);
      }
    }
    // No canonical found (or Immoflux UUID) — still tag as noindex while client redirects
    const response = await context.next();
    try { response.headers.set("X-Robots-Tag", "noindex, follow"); } catch {}
    return response;
  }

  try {
    if (isCatalog) {
      // If suffix is purely numeric (3+ digits), it's an Immoflux idnum mistakenly
      // routed under /proprietati/ — 301 to /proprietate/<slug>
      const numericMatch = slug.match(/(\d{3,})$/);
      const isHexShortId = /^[a-f0-9]{4}$/i.test(slug.slice(-4)) && !/^\d+$/.test(slug.slice(-4));

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

      // Last 4 chars = short ID
      const shortId = slug.slice(-4);
      if (!/^[a-f0-9]{4}$/i.test(shortId)) return context.next();

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/catalog_offers?select=slug&id=ilike.${shortId}*&limit=1`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
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
    } else if (isImmoflux) {
      // Last numeric segment = idnum
      const match = slug.match(/(\d+)$/);
      if (!match) return context.next();
      const idnum = match[1];

      // If slug is ONLY the numeric id (legacy bare-id URL), let client redirect
      // to canonical slug (it has the property data). Otherwise, trust the slug.
      // Server-side canonical lookup for Immoflux would require duplicating slug
      // generation logic — handled by client-side redirect in ImmofluxPropertyDetail.tsx.
      if (slug === idnum) {
        // Bare numeric IDs are not canonical; the client will redirect.
        // Mark with a hint for crawlers to deprioritize this variant.
        const response = await context.next();
        try {
          response.headers.set("X-Robots-Tag", "noindex, follow");
        } catch {}
        return response;
      }
    }
  } catch (err) {
    console.error("[slug-redirect] error:", err);
  }

  return context.next();
};
