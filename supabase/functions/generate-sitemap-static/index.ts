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
    console.log('Generating static pages sitemap.xml');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
      { loc: '/proprietati', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/complexe', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      
      { loc: '/despre-noi', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/servicii', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/de-ce-sa-ne-alegi', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/contact', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/calculator-credit', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/intrebari-frecvente', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/cariera', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/politica-confidentialitate', priority: '0.3', changefreq: 'yearly', lastmod: currentDate },
      { loc: '/militari-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/renew-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/eurocasa-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/termeni-conditii', priority: '0.3', changefreq: 'yearly', lastmod: currentDate },
    ];

    // Fetch published blog posts dynamically
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (blogError) {
      console.error('Error fetching blog posts:', blogError);
    }

    // Add blog posts to sitemap
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : currentDate;
        staticPages.push({
          loc: `/blog/${post.slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod,
        });
      }
    }

    console.log(`Generated sitemap with ${staticPages.length} URLs (${blogPosts?.length || 0} blog posts)`);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Robots-Tag': 'noindex',
      },
    });

  } catch (error) {
    console.error('Error generating static sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
