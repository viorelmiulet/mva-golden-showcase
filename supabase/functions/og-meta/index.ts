import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://mvaimobiliare.ro';
const DEFAULT_IMAGE = `${SITE_URL}/mva-logo-luxury-horizontal.svg`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let title = 'MVA Imobiliare | Apartamente și Ansambluri Rezidențiale';
    let description = 'Descoperă apartamente de vânzare, ansambluri rezidențiale și servicii imobiliare în București și împrejurimi cu MVA Imobiliare.';
    let image = `${SITE_URL}/og-image.jpg`;
    let ogUrl = `${SITE_URL}${path}`;
    let ogType = 'website';

    // Immoflux property: /proprietate/{slug} (numeric ID at end)
    const immofluxMatch = path.match(/^\/proprietate\/(.+?)(?:\?.*)?$/);
    if (immofluxMatch) {
      const slug = immofluxMatch[1];
      // Extract numeric ID from end of slug
      const idMatch = slug.match(/(\d+)$/);
      if (idMatch) {
        try {
          const proxyUrl = `${supabaseUrl}/functions/v1/immoflux-proxy/properties/${idMatch[1]}`;
          const resp = await fetch(proxyUrl, {
            headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '' },
          });
          if (resp.ok) {
            const prop = await resp.json();
            const propTitle = typeof prop.titlu === 'object' ? prop.titlu.ro : prop.titlu;
            const price = prop.pretvanzare
              ? `${Number(prop.pretvanzare).toLocaleString('ro-RO')} ${prop.monedavanzare || 'EUR'}`
              : 'Preț la cerere';
            const zona = prop.zona || prop.localitate || '';
            
            title = `${propTitle || `Apartament ${prop.nrcamere || ''} camere ${zona}`} – ${price}`;
            description = `${prop.suprafatautila || ''}mp, etaj ${prop.etaj || '-'}, ${zona}. Detalii și vizionare la MVA Imobiliare.`;
            ogType = 'article';
            
            if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
              image = prop.images[0].src || prop.images[0];
            }
          }
        } catch (e) {
          console.error('og-meta: immoflux fetch error:', e);
        }
      }
    }

    // Catalog property: /proprietati/{slug} (4-char hex ID at end)
    const catalogMatch = path.match(/^\/proprietati\/(.+?)(?:\?.*)?$/);
    if (catalogMatch) {
      const slugOrId = catalogMatch[1];
      let property = null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      if (isUUID) {
        const { data } = await supabase
          .from('catalog_offers')
          .select('title, description, location, price_min, currency, surface_min, rooms, images, floor')
          .eq('id', slugOrId)
          .single();
        property = data;
      } else {
        const shortId = slugOrId.slice(-4);
        if (shortId.length === 4) {
          const { data: properties } = await supabase
            .from('catalog_offers')
            .select('title, description, location, price_min, currency, surface_min, rooms, images, floor')
            .like('id', `${shortId}%`);
          if (properties && properties.length > 0) {
            property = properties[0];
          }
        }
        if (!property) {
          const { data } = await supabase
            .from('catalog_offers')
            .select('title, description, location, price_min, currency, surface_min, rooms, images, floor')
            .eq('slug', slugOrId)
            .single();
          property = data;
        }
      }

      if (property) {
        const price = property.price_min
          ? `${property.price_min.toLocaleString('ro-RO')} ${property.currency || 'EUR'}`
          : 'Preț la cerere';
        const zona = property.location || 'Militari';
        
        title = `Apartament ${property.rooms || ''} camere ${zona} – ${price}`;
        description = `${property.surface_min || ''}mp, etaj ${property.floor ?? '-'}, ${zona} Militari. Detalii și vizionare la MVA Imobiliare.`;
        ogType = 'article';
        
        if (property.images && Array.isArray(property.images) && property.images.length > 0) {
          image = property.images[0];
        }
      }
    }

    // Complex detail page: /complexe/{slug}
    const complexMatch = path.match(/^\/complexe\/(.+?)(?:\?.*)?$/);
    if (complexMatch) {
      const slug = complexMatch[1];
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      let query = supabase
        .from('real_estate_projects')
        .select('name, description, location, main_image, slug');
      
      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data: project } = await query.single();
      if (project) {
        title = `${project.name} - Apartamente Disponibile | MVA Imobiliare`;
        description = project.description?.substring(0, 160) || `Apartamente noi în ${project.location}`;
        if (project.main_image) {
          image = project.main_image;
        }
      }
    }

    // Blog post page: /blog/{slug}
    const blogMatch = path.match(/^\/blog\/(.+?)(?:\?.*)?$/);
    if (blogMatch && blogMatch[1] !== '') {
      const slug = blogMatch[1];
      const { data: post } = await supabase
        .from('blog_posts')
        .select('title, excerpt, meta_description, cover_image')
        .eq('slug', slug)
        .single();
      
      if (post) {
        title = post.title;
        description = post.meta_description || post.excerpt || '';
        ogType = 'article';
        if (post.cover_image) {
          image = post.cover_image;
        }
      }
    }

    // News article page: /news/{slug}
    let newsJsonLd: string | null = null;
    const newsMatch = path.match(/^\/news\/(.+?)(?:\?.*)?$/);
    if (newsMatch && newsMatch[1] !== '') {
      const slug = newsMatch[1];
      const { data: article } = await supabase
        .from('news_articles')
        .select('title, description, featured_image, published_date, created_at, updated_at, keywords')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (article) {
        title = article.title;
        description = article.description || '';
        ogType = 'article';
        if (article.featured_image) {
          image = article.featured_image;
        }

        const datePublished = article.published_date || article.created_at;
        const articleImage = /^https?:\/\//i.test(image) ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: String(article.title || '').slice(0, 110),
          description,
          image: [articleImage],
          datePublished,
          dateModified: article.updated_at || datePublished,
          inLanguage: 'ro-RO',
          mainEntityOfPage: { '@type': 'WebPage', '@id': ogUrl },
          author: { '@type': 'Organization', name: 'MVA Imobiliare', url: SITE_URL },
          publisher: {
            '@type': 'Organization',
            name: 'MVA Imobiliare',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/mva-logo-luxury.svg` },
          },
          ...(article.keywords ? { keywords: article.keywords } : {}),
        };
        newsJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
      }
    }

    // Return minimal HTML with OG tags + redirect for regular users
    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="MVA Imobiliare" />
  <meta property="og:locale" content="ro_RO" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  
  <meta http-equiv="refresh" content="0;url=${escapeHtml(ogUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(ogUrl)}">${escapeHtml(title)}</a></p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('og-meta error:', error);
    // Fallback: redirect to site
    return new Response(`<html><head><meta http-equiv="refresh" content="0;url=${SITE_URL}" /></head></html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
