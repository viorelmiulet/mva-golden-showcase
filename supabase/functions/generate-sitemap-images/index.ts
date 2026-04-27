import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toKebab = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getComplexSlug = (project: { id: string; name: string; slug?: string | null }) => {
  if (project.slug?.trim()) return project.slug.trim();
  const shortId = project.id.replace(/-/g, '').slice(0, 4);
  return `${toKebab(project.name || 'ansamblu-rezidential')}-${shortId}`;
};

const getPropertySlug = (property: { id: string; rooms?: number | null; project_name?: string | null; zone?: string | null; location?: string | null }) => {
  const parts: string[] = [];
  const rooms = property.rooms || 1;
  parts.push(rooms <= 1 ? 'garsoniera' : `apartament-${rooms}-camere`);

  if (property.project_name) {
    parts.push(toKebab(property.project_name));
  }

  const zone = property.zone || property.location;
  if (zone) {
    const isCoordinates = /^\d|.*\d{2,}\.\d{3,}/.test(zone);
    if (!isCoordinates) {
      const zoneSlug = toKebab(zone.split(',')[0].trim());
      if (zoneSlug && zoneSlug.length > 2 && !parts.some((part) => part.includes(zoneSlug))) {
        parts.push(zoneSlug);
      }
    }
  }

  parts.push(property.id.replace(/-/g, '').substring(0, 4));
  return parts.join('-');
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

    // Fetch published properties, projects and news in parallel
    const [propertiesResult, projectsResult, newsResult] = await Promise.all([
      supabase
        .from('catalog_offers')
        .select('id, title, images, updated_at, rooms, project_name, zone, location')
        .eq('is_published', true)
        .not('images', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('real_estate_projects')
        .select('id, name, slug, main_image, updated_at')
        .eq('is_published', true)
        .not('main_image', 'is', null)
        .order('updated_at', { ascending: false }),
      supabase
        .from('news_articles')
        .select('slug, title, description, featured_image, updated_at, published_date')
        .eq('status', 'published')
        .not('featured_image', 'is', null)
        .order('published_date', { ascending: false }),
    ]);

    const properties = propertiesResult.data || [];
    const projects = projectsResult.data || [];
    const news = newsResult.data || [];

    console.log(`Found ${properties.length} properties, ${projects.length} projects, ${news.length} news with images`);

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
    <loc>${escapeXml(`${baseUrl}/proprietati/${getPropertySlug(property)}`)}</loc>
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
    <loc>${escapeXml(`${baseUrl}/complexe/${getComplexSlug(project)}`)}</loc>
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

    // News article images
    for (const article of news) {
      if (article.featured_image && isValidUrl(article.featured_image)) {
        const lastmod = article.updated_at
          ? new Date(article.updated_at).toISOString().split('T')[0]
          : currentDate;

        sitemap += `  <url>
    <loc>${escapeXml(`${baseUrl}/news/${article.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <image:image>
      <image:loc>${escapeXml(article.featured_image)}</image:loc>
      <image:caption>${escapeXml(article.description || article.title || 'Articol news')}</image:caption>
      <image:title>${escapeXml(article.title || 'Articol news MVA Imobiliare')}</image:title>
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
      JSON.stringify({ error: (error as Error).message }), 
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
