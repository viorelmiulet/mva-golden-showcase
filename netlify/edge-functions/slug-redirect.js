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

  // Skip UUID lookups (handled client-side, will redirect)
  if (isUUID(slug)) return context.next();

  try {
    if (isCatalog) {
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
        return Response.redirect(new URL(target, url.origin), 301);
      }
    } else if (isImmoflux) {
      // Last numeric segment = idnum
      const match = slug.match(/(\d+)$/);
      if (!match) return context.next();
      const idnum = match[1];

      // We can't easily compute Immoflux canonical slug server-side without
      // duplicating the slug logic. Instead, we trust the client-side redirect
      // for Immoflux (already handled in ImmofluxPropertyDetail.tsx).
      // Server redirect only ensures consistency for known stale formats:
      // if the slug doesn't end exactly with -<idnum>, normalize.
      // (No-op here — client handles it. Kept for symmetry / future expansion.)
    }
  } catch (err) {
    console.error("[slug-redirect] error:", err);
  }

  return context.next();
};
