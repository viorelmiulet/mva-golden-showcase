import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate SEO-friendly slug (mirrors src/lib/propertySlug.ts)
const toKebab = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const generatePropertySlug = (property: {
  id: string;
  rooms?: number | null;
  project_name?: string | null;
  zone?: string | null;
  location?: string | null;
}): string => {
  const parts: string[] = [];
  const rooms = property.rooms || 1;
  if (rooms <= 1) {
    parts.push('garsoniera');
  } else {
    parts.push(`apartament-${rooms}-camere`);
  }
  if (property.project_name) {
    parts.push(toKebab(property.project_name));
  }
  const zone = property.zone || property.location;
  if (zone) {
    const kebabZone = toKebab(zone.split(',')[0].trim());
    if (kebabZone && !parts.some(p => p.includes(kebabZone))) {
      parts.push(kebabZone);
    }
  }
  const shortId = property.id.replace(/-/g, '').substring(0, 4);
  parts.push(shortId);
  return parts.join('-');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating properties sitemap.xml with SEO slugs');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: properties, error: propertiesError } = await supabase
      .from('catalog_offers')
      .select('id, title, updated_at, availability_status, rooms, project_name, zone, location')
      .eq('is_published', true)
      .eq('availability_status', 'available')
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw propertiesError;
    }

    console.log(`Found ${properties?.length || 0} published properties`);

    const baseUrl = 'https://mvaimobiliare.ro';
    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    if (properties && properties.length > 0) {
      for (const property of properties) {
        const lastmod = property.updated_at 
          ? new Date(property.updated_at).toISOString().split('T')[0]
          : currentDate;
        
        const slug = generatePropertySlug(property);
        
        sitemap += `  <url>
    <loc>${baseUrl}/proprietati/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
    console.error('Error generating properties sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
