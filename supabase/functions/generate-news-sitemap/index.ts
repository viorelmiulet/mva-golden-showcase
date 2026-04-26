import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const escapeXml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Google News only includes articles from the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('slug, title, keywords, published_date, updated_at')
      .eq('status', 'published')
      .gte('published_date', twoDaysAgo)
      .order('published_date', { ascending: false });

    if (error) throw error;

    const baseUrl = 'https://mvaimobiliare.ro';

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    if (articles && articles.length > 0) {
      for (const a of articles) {
        const pubDate = a.published_date || a.updated_at;
        sitemap += `  <url>
    <loc>${baseUrl}/news/${escapeXml(a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>MVA Imobiliare</news:name>
        <news:language>ro</news:language>
      </news:publication>
      <news:publication_date>${new Date(pubDate).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>${
        a.keywords ? `\n      <news:keywords>${escapeXml(a.keywords)}</news:keywords>` : ''
      }
    </news:news>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
