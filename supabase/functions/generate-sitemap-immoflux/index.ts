import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating Immoflux sitemap.xml using stored immoflux_slug');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Match public visibility:
    //   - crm_source = 'immoflux'
    //   - published, not sold (sold properties are hidden from sitemap per project policy)
    //   - stored immoflux_slug present (canonical slug; never recompute on the fly)
    const { data: properties, error } = await supabase
      .from('catalog_offers')
      .select('immoflux_slug, updated_at')
      .eq('crm_source', 'immoflux')
      .eq('is_published', true)
      .neq('availability_status', 'sold')
      .not('immoflux_slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10000);

    if (error) {
      console.error('Error fetching Immoflux properties:', error);
      throw error;
    }

    const rows = (properties || []).filter(
      (p: any) => typeof p.immoflux_slug === 'string' && p.immoflux_slug.trim().length > 0,
    );
    console.log(`Found ${rows.length} indexable Immoflux properties with stored slug`);

    const baseUrl = 'https://www.mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const p of rows) {
      const lastmod = p.updated_at
        ? new Date(p.updated_at).toISOString().split('T')[0]
        : currentDate;
      sitemap += `  <url>
    <loc>${baseUrl}/proprietate/${p.immoflux_slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Error generating Immoflux sitemap:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
