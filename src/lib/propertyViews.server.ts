/**
 * Property view tracking — server side.
 *
 * GDPR: the raw IP address is never stored. It is combined with the user agent
 * and a server-side salt, hashed with SHA-256, and only the first 32 hex chars
 * are persisted. That is enough for 24h deduplication and nothing else.
 */

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|embedly|quora|pinterest|vkshare|preview|headless|lighthouse|pagespeed|gtmetrix|monitor|curl|wget|python-requests|axios|node-fetch|go-http|java\/|libwww|scrapy|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|sogou|applebot|amazonbot|gptbot|claudebot|ccbot|perplexity/i;

export const isBotUserAgent = (ua: string | null | undefined): boolean => {
  if (!ua || ua.trim().length < 10) return true;
  return BOT_UA.test(ua);
};

export const buildVisitorHash = async (ip: string, ua: string): Promise<string> => {
  const salt = process.env['SUPABASE_SERVICE_ROLE_KEY']?.slice(-16) ?? 'mva-view-salt';
  const data = new TextEncoder().encode(`${ip}|${ua}|${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
};

export const extractClientIp = (headers: Headers): string =>
  (headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown').trim();

/** Records one view, deduplicated per (property, visitor) within 24 hours. */
export async function recordView(
  propertyId: string,
  headers: Headers,
): Promise<{ recorded: boolean }> {
  const ua = headers.get('user-agent') || '';
  if (isBotUserAgent(ua)) return { recorded: false };

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const visitorHash = await buildVisitorHash(extractClientIp(headers), ua);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabaseAdmin
    .from('property_views')
    .select('id')
    .eq('property_id', propertyId)
    .eq('visitor_hash', visitorHash)
    .gte('viewed_at', since)
    .limit(1)
    .maybeSingle();

  if (existing) return { recorded: false };

  const { error } = await supabaseAdmin
    .from('property_views')
    .insert({ property_id: propertyId, visitor_hash: visitorHash });
  if (error) {
    console.error('[property-views] insert error:', error.message);
    return { recorded: false };
  }
  return { recorded: true };
}

export type ViewCounts = { total: number; last7: number };

/** Total + last-7-days counts for a single property. */
export async function countsForProperty(propertyId: string): Promise<ViewCounts> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, weekRes] = await Promise.all([
    supabaseAdmin
      .from('property_views')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId),
    supabaseAdmin
      .from('property_views')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .gte('viewed_at', since),
  ]);

  return { total: totalRes.count ?? 0, last7: weekRes.count ?? 0 };
}

/** Total + last-7-days counts for every property that has at least one view. */
export async function countsForAllProperties(): Promise<Record<string, ViewCounts>> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const out: Record<string, ViewCounts> = {};

  const batch = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from('property_views')
      .select('property_id, viewed_at')
      .range(from, from + batch - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const entry = (out[row.property_id] ??= { total: 0, last7: 0 });
      entry.total += 1;
      if (new Date(row.viewed_at).getTime() >= weekAgo) entry.last7 += 1;
    }

    if (data.length < batch) break;
    from += batch;
  }

  return out;
}
