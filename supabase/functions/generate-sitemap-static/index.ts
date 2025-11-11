const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating static pages sitemap.xml');

    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    // Static pages with priority and changefreq
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
      { loc: '/proprietati', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/complexe', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/de-ce-sa-ne-alegi', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/faq', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/carte-vizita', priority: '0.5', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/cariera', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
      // Blog posts
      { loc: '/blog/ghidul-complet-cumparare-proprietate-bucuresti', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/tendinte-piata-imobiliara-2025', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/cum-pregatesti-casa-pentru-vanzare', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
      { loc: '/blog/investitii-imobiliare-ghid-incepatori', priority: '0.7', changefreq: 'monthly', lastmod: '2025-10-21' },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add static pages
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

    console.log('Static pages sitemap generated successfully');

    // Return XML response
    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
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
