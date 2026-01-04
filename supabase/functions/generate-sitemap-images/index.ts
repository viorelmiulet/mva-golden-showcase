import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CatalogOffer {
  id: string;
  title: string;
  images: string[] | null;
  updated_at: string;
}

interface RealEstateProject {
  id: string;
  name: string;
  main_image: string | null;
  updated_at: string;
}

interface ShortTermRental {
  id: string;
  title: string;
  images: string[] | null;
  updated_at: string;
}

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

    // Fetch all data in parallel
    const [propertiesResult, projectsResult, rentalsResult] = await Promise.all([
      supabase
        .from('catalog_offers')
        .select('id, title, images, updated_at')
        .not('images', 'is', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('real_estate_projects')
        .select('id, name, main_image, updated_at')
        .not('main_image', 'is', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('short_term_rentals')
        .select('id, title, images, updated_at')
        .not('images', 'is', null)
        .order('updated_at', { ascending: false })
    ]);

    const properties = propertiesResult.data as CatalogOffer[] || [];
    const projects = projectsResult.data as RealEstateProject[] || [];
    const rentals = rentalsResult.data as ShortTermRental[] || [];

    console.log(`Found ${properties.length} properties, ${projects.length} projects, ${rentals.length} rentals with images`);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add property images
    for (const property of properties) {
      if (property.images && property.images.length > 0) {
        const lastmod = property.updated_at 
          ? new Date(property.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        const pageUrl = property.id ? `${baseUrl}/proprietati/${property.id}` : null;
        if (!pageUrl) continue;

        sitemap += `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
`;
        
        for (let i = 0; i < Math.min(property.images.length, 1000); i++) {
          const imageUrl = property.images[i];
          if (imageUrl && isValidUrl(imageUrl)) {
            const caption = `${property.title || 'Proprietate'} - Imagine ${i + 1}`;
            sitemap += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:title>${escapeXml(property.title || 'Proprietate imobiliară')}</image:title>
    </image:image>
`;
          }
        }
        
        sitemap += `  </url>
`;
      }
    }

    // Add project images
    for (const project of projects) {
      if (project.main_image) {
        const lastmod = project.updated_at 
          ? new Date(project.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        const pageUrl = `${baseUrl}/complexe/${project.id}`;
        
        sitemap += `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
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

    // Add rental images
    for (const rental of rentals) {
      if (rental.images && rental.images.length > 0) {
        const lastmod = rental.updated_at 
          ? new Date(rental.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        const pageUrl = `${baseUrl}/regim-hotelier/${rental.id}`;

        sitemap += `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
`;
        
        for (let i = 0; i < Math.min(rental.images.length, 1000); i++) {
          const imageUrl = rental.images[i];
          if (imageUrl && isValidUrl(imageUrl)) {
            const caption = `${rental.title || 'Cazare'} - Imagine ${i + 1}`;
            sitemap += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:title>${escapeXml(rental.title || 'Cazare regim hotelier')}</image:title>
    </image:image>
`;
          }
        }
        
        sitemap += `  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log('Images sitemap generated successfully');

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
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
