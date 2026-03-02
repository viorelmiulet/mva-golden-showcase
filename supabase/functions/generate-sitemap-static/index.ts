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

    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
      { loc: '/proprietati', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/complexe', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/regim-hotelier', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
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
      // Blog posts
      { loc: '/blog/ghidul-complet-cumparare-proprietate-bucuresti', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/tendinte-piata-imobiliara-2025', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/cum-pregatesti-casa-pentru-vanzare', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/investitii-imobiliare-ghid-incepatori', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/apartamente-militari-residence-ghid-cumparatori-2025', priority: '0.8', changefreq: 'monthly', lastmod: '2026-03-02' },
    ];

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
