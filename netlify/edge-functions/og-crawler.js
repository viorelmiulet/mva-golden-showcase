const SUPABASE_FUNCTIONS_URL = 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'LinkedInBot',
  'Twitterbot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'Pinterestbot',
  'vkShare',
];

// Routes that need dynamic OG tags
const DYNAMIC_ROUTES = [
  /^\/proprieta(?:te|ti)\/.+/,
  /^\/complexe\/.+/,
  /^\/blog\/.+/,
];

export default async (request, context) => {
  const userAgent = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;

  // Only intercept crawlers on dynamic routes
  const isCrawler = CRAWLER_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
  const isDynamicRoute = DYNAMIC_ROUTES.some(pattern => pattern.test(path));

  if (!isCrawler || !isDynamicRoute) {
    return context.next();
  }

  try {
    const ogUrl = `${SUPABASE_FUNCTIONS_URL}/og-meta?path=${encodeURIComponent(path)}`;
    const response = await fetch(ogUrl, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU',
      },
    });

    if (response.ok) {
      const html = await response.text();
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (e) {
    console.error('OG meta edge function error:', e);
  }

  return context.next();
};

export const config = {
  path: ["/proprietate/*", "/proprietati/*", "/complexe/*", "/blog/*"],
};
