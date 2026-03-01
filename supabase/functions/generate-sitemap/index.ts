import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Project {
  id: string;
  updated_at: string;
}

interface Property {
  id: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating dynamic sitemap.xml');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all projects (complexes)
    const { data: projects, error: projectsError } = await supabase
      .from('real_estate_projects')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Fetch all properties (without project_id - standalone properties)
    const { data: properties, error: propertiesError } = await supabase
      .from('catalog_offers')
      .select('id, updated_at')
      .is('project_id', null)
      .order('updated_at', { ascending: false });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw propertiesError;
    }

    console.log(`Found ${projects?.length || 0} complexes and ${properties?.length || 0} properties`);

    // Build sitemap XML
    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    // Static pages with priority and changefreq
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
      { loc: '/proprietati', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/complexe', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/de-ce-sa-ne-alegi', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/intrebari-frecvente', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
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

    // Add complex detail pages
    if (projects && projects.length > 0) {
      for (const project of projects) {
        const lastmod = project.updated_at 
          ? new Date(project.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        sitemap += `  <url>
    <loc>${baseUrl}/complexe/${project.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add property detail pages
    if (properties && properties.length > 0) {
      for (const property of properties) {
        const lastmod = property.updated_at 
          ? new Date(property.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        sitemap += `  <url>
    <loc>${baseUrl}/proprietati/${property.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log('Sitemap generated successfully');

    // Return XML response
    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
