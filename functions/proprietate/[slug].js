/**
 * Cloudflare Pages Function: edge handling for /proprietate/:slug (Immoflux)
 *
 * - UUID slugs → tag noindex, follow (canonical resolution happens client-side
 *   because Immoflux slug generation isn't replicated server-side).
 * - Bare numeric idnum slugs → tag noindex, follow so crawlers deprioritize them.
 * - Anything else → pass through to the SPA.
 */

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
  const slug = decodeURIComponent(params.slug || "");
  if (!slug) return context.next();

  if (isUUID(slug)) {
    return passthroughWithNoindex(context);
  }

  // Bare numeric idnum (legacy URL); client redirects to canonical slug.
  if (/^\d+$/.test(slug)) {
    return passthroughWithNoindex(context);
  }

  return context.next();
}
