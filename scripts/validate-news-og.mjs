#!/usr/bin/env node
/**
 * Validates that the og-meta edge function returns og:type="article",
 * a non-default og:image, and a complete JSON-LD Article block
 * (headline, description, datePublished, image) for every published news article.
 *
 * Usage: node scripts/validate-news-og.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fdpandnzblzvamhsoukt.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const REST = `${SUPABASE_URL}/rest/v1/news_articles?select=slug,featured_image&status=eq.published`;
const OG_FN = `${SUPABASE_URL}/functions/v1/og-meta`;
const DEFAULT_IMG = '/og-image.jpg';
const SITE_URL = 'https://mvaimobiliare.ro';

const toAbsoluteUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

const meta = (html, prop) => {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  return html.match(re)?.[1] ?? null;
};

const extractJsonLd = (html) => {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].replace(/\\u003c/g, '<');
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // ignore malformed
    }
  }
  return blocks.find((b) => b && b['@type'] === 'Article') || null;
};

const articles = await fetch(REST, { headers }).then((r) => r.json());
console.log(`Validating ${articles.length} published news articles...\n`);

let failed = 0;
for (const { slug, featured_image } of articles) {
  const url = `${OG_FN}?path=/news/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { headers });
  const html = await res.text();
  const ogType = meta(html, 'og:type');
  const ogImage = meta(html, 'og:image');
  const jsonLd = extractJsonLd(html);

  const expectedImage = toAbsoluteUrl(featured_image);
  const errors = [];
  if (ogType !== 'article') errors.push(`og:type=${ogType}`);
  if (!ogImage) {
    errors.push('og:image missing');
  } else if (ogImage.endsWith(DEFAULT_IMG) && featured_image) {
    errors.push('og:image fell back to default');
  } else if (expectedImage && ogImage !== expectedImage && ogImage !== featured_image) {
    errors.push(`og:image mismatch (got ${ogImage}, expected ${expectedImage})`);
  }

  if (!jsonLd) {
    errors.push('JSON-LD Article missing');
  } else {
    if (!jsonLd.headline || typeof jsonLd.headline !== 'string') errors.push('JSON-LD headline missing');
    if (!jsonLd.description || typeof jsonLd.description !== 'string') errors.push('JSON-LD description missing');
    if (!jsonLd.datePublished || isNaN(Date.parse(jsonLd.datePublished))) errors.push('JSON-LD datePublished invalid');
    const img = jsonLd.image;
    const imgList = typeof img === 'string' ? [img] : Array.isArray(img) ? img : [];
    if (imgList.length === 0 || !imgList.every((i) => typeof i === 'string' && i.length > 0)) {
      errors.push('JSON-LD image missing');
    } else if (expectedImage && !imgList.includes(expectedImage) && !imgList.includes(featured_image)) {
      errors.push(`JSON-LD image mismatch (got ${imgList[0]}, expected ${expectedImage})`);
    }
  }

  if (errors.length) {
    failed++;
    console.log(`❌ ${slug}\n   ${errors.join(', ')}`);
  } else {
    console.log(`✅ ${slug}`);
  }
}

console.log(`\n${articles.length - failed}/${articles.length} passed`);
process.exit(failed ? 1 : 0);
