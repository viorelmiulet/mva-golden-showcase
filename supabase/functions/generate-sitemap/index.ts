import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Project {
  id: string;
  name?: string | null;
  updated_at: string;
}

interface Property {
  id: string;
  rooms?: number | null;
  project_name?: string | null;
  zone?: string | null;
  location?: string | null;
  updated_at: string;
}

interface PropertyWithSlug extends Property {
  slug: string;
}

interface BlogPost {
  slug: string;
  updated_at: string;
}

const SITE_URL = 'https://mvaimobiliare.ro';

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const mapPropertySlugs = async (
  supabase: ReturnType<typeof createClient>,
  properties: Property[],
): Promise<PropertyWithSlug[]> => {
  const chunkSize = 100;
  const propertiesWithSlugs: PropertyWithSlug[] = [];

  for (let index = 0; index < properties.length; index += chunkSize) {
    const chunk = properties.slice(index, index + chunkSize);
    const slugChunk = await Promise.all(
      chunk.map(async (property) => {
        const { data: slug, error } = await supabase.rpc('generate_property_slug_db', {
          property_id: property.id,
          property_rooms: property.rooms ?? null,
          property_project_name: property.project_name ?? null,
          property_zone: property.zone ?? null,
          property_location: property.location ?? null,
        });

        if (error || !slug) {
          console.error('Error generating property slug:', property.id, error);
          return null;
        }

        return {
          ...property,
          slug,
        } satisfies PropertyWithSlug;
      }),
    );

    propertiesWithSlugs.push(...slugChunk.filter((property): property is PropertyWithSlug => Boolean(property)));
  }

  return propertiesWithSlugs;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating dynamic sitemap.xml');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [projectsResult, propertiesResult, blogPostsResult] = await Promise.all([
      supabase
        .from('real_estate_projects')
        .select('id, name, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('catalog_offers')
        .select('id, updated_at, rooms, project_name, zone, location')
        .eq('is_published', true)
        .eq('availability_status', 'available')
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
    ]);

    if (projectsResult.error) {
      console.error('Error fetching projects:', projectsResult.error);
      throw projectsResult.error;
    }

    if (propertiesResult.error) {
      console.error('Error fetching properties:', propertiesResult.error);
      throw propertiesResult.error;
    }

    if (blogPostsResult.error) {
      console.error('Error fetching blog posts:', blogPostsResult.error);
      throw blogPostsResult.error;
    }

    const projects = (projectsResult.data || []) as Project[];
    const properties = (propertiesResult.data || []) as Property[];
    const blogPosts = (blogPostsResult.data || []) as BlogPost[];
    const propertiesWithSlugs = await mapPropertySlugs(supabase, properties);

    console.log(`Found ${projects.length} complexes, ${propertiesWithSlugs.length} properties, ${blogPosts.length} blog posts`);

    const currentDate = new Date().toISOString().split('T')[0];

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
      { loc: '/proprietati', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/complexe', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/militari-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/renew-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/eurocasa-residence', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/despre-noi', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/servicii', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/de-ce-sa-ne-alegi', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/contact', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
      { loc: '/calculator-credit', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/faq', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/cariera', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/politica-confidentialitate', priority: '0.3', changefreq: 'yearly', lastmod: currentDate },
      { loc: '/termeni-conditii', priority: '0.3', changefreq: 'yearly', lastmod: currentDate },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    for (const blogPost of blogPosts) {
      if (!blogPost.slug) continue;

      const lastmod = blogPost.updated_at
        ? new Date(blogPost.updated_at).toISOString().split('T')[0]
        : currentDate;

      sitemap += `  <url>
    <loc>${SITE_URL}/blog/${xmlEscape(blogPost.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    for (const project of projects) {
      const lastmod = project.updated_at
        ? new Date(project.updated_at).toISOString().split('T')[0]
        : currentDate;

      sitemap += `  <url>
    <loc>${SITE_URL}/complexe/${project.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    for (const property of propertiesWithSlugs) {
      const lastmod = property.updated_at
        ? new Date(property.updated_at).toISOString().split('T')[0]
        : currentDate;

      sitemap += `  <url>
    <loc>${SITE_URL}/proprietati/${xmlEscape(property.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    sitemap += `</urlset>`;

    console.log('Sitemap generated successfully');

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
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
