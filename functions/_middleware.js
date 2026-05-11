/**
 * Cloudflare Pages middleware: serves Prerender.io HTML to bots.
 *
 * Replaces the legacy netlify/edge-functions/prerender.js which is no longer
 * executed (production runs on Cloudflare Pages, not Netlify).
 *
 * Order of operations:
 *   1. Skip static assets (extensions list).
 *   2. If the request is from a known bot AND the path is NOT a UUID property
 *      route (those are handled by functions/proprietati/[slug].js and
 *      functions/proprietate/[slug].js, which emit real 301s) → fetch the
 *      pre-rendered HTML from Prerender.io and return it.
 *   3. Otherwise → context.next() to fall through to the SPA / route function.
 *
 * Required env binding (set in Cloudflare Pages dashboard → Settings →
 * Environment variables): PRERENDER_TOKEN
 */

const BOT_AGENTS =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|applebot|duckduckbot/i;

const STATIC_ASSET_RE =
  /\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|woff2|svg|eot|webp|avif|map|json)$/i;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Routes that must NEVER be indexed — emit X-Robots-Tag at edge level.
const NOINDEX_RE =
  /^\/(admin|contract|semnare|contract-signature|404|not-found)(\/|$)/i;

const isUUIDPropertyPath = (pathname) => {
  const m = pathname.match(/^\/(proprietati|proprietate)\/([^/]+)\/?$/);
  if (!m) return false;
  return UUID_RE.test(decodeURIComponent(m[2]));
};

// Wrap a Response and add X-Robots-Tag: noindex, follow when needed.
const withNoindex = async (responsePromise) => {
  const res = await responsePromise;
  const headers = new Headers(res.headers);
  headers.set("X-Robots-Tag", "noindex, follow");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
};

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || "";
  const needsNoindex = NOINDEX_RE.test(url.pathname);

  // 1. Static assets — never prerender. Still add noindex if path matches.
  if (STATIC_ASSET_RE.test(url.pathname)) {
    return needsNoindex ? withNoindex(next()) : next();
  }

  // 2. Non-bot or UUID property routes → fall through (let route functions /
  //    SPA handle it). UUID routes get real 301 from their own Pages Function.
  if (!BOT_AGENTS.test(userAgent) || isUUIDPropertyPath(url.pathname)) {
    return needsNoindex ? withNoindex(next()) : next();
  }

  const prerenderToken = env?.PRERENDER_TOKEN;
  if (!prerenderToken) {
    console.warn("[prerender cf] PRERENDER_TOKEN not set, skipping");
    return next();
  }

  // 3. Bot request on a regular page → fetch from Prerender.io.
  try {
    const prerenderUrl = `https://service.prerender.io/${request.url}`;
    const response = await fetch(prerenderUrl, {
      headers: { "X-Prerender-Token": prerenderToken },
      redirect: "follow",
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Prerendered": "true",
      },
    });
  } catch (err) {
    console.error("[prerender cf] error:", err);
    return next();
  }
}
