const BOT_AGENTS = /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|applebot|duckduckbot/i;

export default async (request, context) => {
  const userAgent = request.headers.get("user-agent") || "";
  const url = new URL(request.url);

  // Skip for static assets
  if (url.pathname.match(/\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|woff2|svg|eot|webp)$/i)) {
    return context.next();
  }

  // Only intercept bot requests
  if (!BOT_AGENTS.test(userAgent)) {
    return context.next();
  }

  const prerenderToken = Deno.env.get("PRERENDER_TOKEN");
  if (!prerenderToken) {
    console.warn("[prerender] PRERENDER_TOKEN not set, skipping");
    return context.next();
  }

  const prerenderUrl = `https://service.prerender.io/${request.url}`;

  try {
    const response = await fetch(prerenderUrl, {
      headers: {
        "X-Prerender-Token": prerenderToken,
      },
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
    console.error("[prerender] Error:", err);
    return context.next();
  }
};
