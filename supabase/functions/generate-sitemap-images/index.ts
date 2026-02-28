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
    console.log('Generating images sitemap.xml');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    // Fetch published properties and projects with images in parallel
    const [propertiesResult, projectsResult] = await Promise.all([
      supabase
        .from('catalog_offers')
        .select('id, title, images, updated_at')
        .eq('is_published', true)
        .not('images', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('real_estate_projects')
        .select('id, name, main_image, updated_at')
        .eq('is_published', true)
        .not('main_image', 'is', null)
        .order('updated_at', { ascending: false }),
    ]);

    const properties = propertiesResult.data || [];
    const projects = projectsResult.data || [];

    console.log(`Found ${properties.length} properties, ${projects.length} projects with images`);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Property images
    for (const property of properties) {
      if (property.images && property.images.length > 0) {
        const lastmod = property.updated_at 
          ? new Date(property.updated_at).toISOString().split('T')[0]
          : currentDate;

        sitemap += `  <url>
    <loc>${escapeXml(`${baseUrl}/proprietati/${property.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
`;
        
        for (let i = 0; i < Math.min(property.images.length, 50); i++) {
          const imageUrl = property.images[i];
          if (imageUrl && isValidUrl(imageUrl)) {
            sitemap += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${escapeXml(`${property.title || 'Proprietate'} - Imagine ${i + 1}`)}</image:caption>
      <image:title>${escapeXml(property.title || 'Proprietate imobiliară')}</image:title>
    </image:image>
`;
          }
        }
        
        sitemap += `  </url>
`;
      }
    }

    // Project images
    for (const project of projects) {
      if (project.main_image) {
        const lastmod = project.updated_at 
          ? new Date(project.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        sitemap += `  <url>
    <loc>${escapeXml(`${baseUrl}/complexe/${project.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <image:image>
      <image:loc>${escapeXml(project.main_image)}</image:loc>
      <image:caption>${escapeXml(project.name)} - Complex rezidențial</image:caption>
      <image:title>${escapeXml(project.name)}</image:title>
    </image:image>
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
        'X-Robots-Tag': 'noindex',
      },
    });

  } catch (error) {
    console.error('Error generating images sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
