/**
 * Cloudflare Pages Function: edge handling for /proprietate/:slug
 *
 * - UUID slugs → look up in catalog_offers; if found, 301 to /proprietati/<canonical>
 *   (UUIDs don't belong on the Immoflux route — they're catalog properties).
 *   If not found in catalog, tag noindex, follow.
 * - Bare numeric idnum slugs → tag noindex, follow (client redirects to canonical
 *   Immoflux slug; we can't replicate that slug-builder server-side without the
 *   full property payload).
 * - Anything else → pass through to the SPA.
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

  // UUID under /proprietate/ → likely a catalog UUID mistakenly routed here.
  // Try resolving against catalog_offers and 301 to /proprietati/<slug>.
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
      console.error("[slug-redirect cf /proprietate] uuid lookup error:", err);
    }
    return passthroughWithNoindex(context);
  }

  // Bare numeric idnum (legacy Immoflux URL) — client-side redirects to canonical slug.
  if (/^\d+$/.test(slug)) {
    return passthroughWithNoindex(context);
  }

  return context.next();
}
