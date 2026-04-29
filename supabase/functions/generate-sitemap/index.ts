import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Project {
  id: string;
  name: string;
  slug?: string | null;
  updated_at: string;
}

interface BlogPost {
  slug: string;
  updated_at: string;
}

const SITE_URL = 'https://mvaimobiliare.ro';

const toKebab = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getComplexSlug = (project: Project) => {
  if (project.slug?.trim()) return project.slug.trim();
  const shortId = project.id.replace(/-/g, '').slice(0, 4);
  return `${toKebab(project.name || 'ansamblu-rezidential')}-${shortId}`;
};

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating dynamic sitemap.xml');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [projectsResult, propertiesResult, blogPostsResult, newsResult] = await Promise.all([
      supabase
        .from('real_estate_projects')
        .select('id, name, slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('catalog_offers')
        .select('id, slug, updated_at')
        .eq('is_published', true)
        .eq('availability_status', 'available')
        .not('slug', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('news_articles')
        .select('slug, updated_at, published_date')
        .eq('status', 'published')
        .not('slug', 'is', null)
        .order('published_date', { ascending: false })
        .limit(5000),
    ]);

    if (projectsResult.error) throw projectsResult.error;
    if (propertiesResult.error) throw propertiesResult.error;
    if (blogPostsResult.error) throw blogPostsResult.error;
    if (newsResult.error) throw newsResult.error;

    const projects = (projectsResult.data || []) as Project[];
    const properties = propertiesResult.data || [];
    const blogPosts = (blogPostsResult.data || []) as BlogPost[];
    const newsArticles = (newsResult.data || []) as Array<{ slug: string; updated_at: string; published_date: string | null }>;

    console.log(`Found ${projects.length} complexes, ${properties.length} properties, ${blogPosts.length} blog posts, ${newsArticles.length} news articles`);

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
      { loc: '/news', priority: '0.9', changefreq: 'daily', lastmod: currentDate },
      { loc: '/calculator-credit', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
      { loc: '/intrebari-frecvente', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
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
    <loc>${SITE_URL}/complexe/${xmlEscape(getComplexSlug(project))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    for (const property of properties) {
      if (!property.slug) continue;
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
      JSON.stringify({ error: (error as Error).message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
