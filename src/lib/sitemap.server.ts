/**
 * Server-only sitemap generators (Wave 1 of the edge-function migration).
 * Replaces the Supabase edge functions:
 *   generate-sitemap-index / -static / -properties / -immoflux /
 *   -complexes / -images and generate-news-sitemap
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const SITE = "https://www.mvaimobiliare.ro";

export function xmlResponse(body: string, maxAge = 3600, noindex = true) {
  const headers: Record<string, string> = {
    "Content-Type": "application/xml; charset=UTF-8",
    "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    "Access-Control-Allow-Origin": "*",
  };
  if (noindex) headers["X-Robots-Tag"] = "noindex";
  return new Response(body, { headers });
}

/** Publishable-key Supabase client, safe for public read-only data. */
export function publicSupabase() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers: h });
      },
    },
  });
}

export function escapeXml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const day = (value?: string | null) =>
  (value ? new Date(value) : new Date()).toISOString().split("T")[0];

const toKebab = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getComplexSlug = (p: { id: string; name: string | null; slug?: string | null }) => {
  if (p.slug?.trim()) return p.slug.trim();
  const shortId = p.id.replace(/-/g, "").slice(0, 4);
  return `${toKebab(p.name || "ansamblu-rezidential")}-${shortId}`;
};

const isValidUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const toAbsoluteUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${SITE}${url}`;
  return `${SITE}/${url}`;
};

function urlset(inner: string, extraNs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${extraNs}>
${inner}</urlset>`;
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

/* ---------------------------------------------------------------- index */

export function buildSitemapIndex(): string {
  const now = new Date().toISOString();
  const children = [
    "/sitemap.xml",
    "/sitemap-complexe.xml",
    "/sitemap-properties.xml",
    "/sitemap-immoflux.xml",
    "/sitemap-images.xml",
    "/news-sitemap.xml",
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children
  .map((c) => `  <sitemap>\n    <loc>${SITE}${c}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`)
  .join("\n")}
</sitemapindex>`;
}

/* --------------------------------------------------------------- static */

const STATIC_PAGES: Array<{ loc: string; priority: string; changefreq: string }> = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/proprietati", priority: "0.9", changefreq: "daily" },
  { loc: "/complexe", priority: "0.9", changefreq: "weekly" },
  { loc: "/despre-noi", priority: "0.8", changefreq: "monthly" },
  { loc: "/servicii", priority: "0.8", changefreq: "monthly" },
  { loc: "/de-ce-sa-ne-alegi", priority: "0.8", changefreq: "monthly" },
  { loc: "/contact", priority: "0.8", changefreq: "monthly" },
  { loc: "/blog", priority: "0.8", changefreq: "weekly" },
  { loc: "/news", priority: "0.8", changefreq: "daily" },
  { loc: "/calculator-credit", priority: "0.7", changefreq: "monthly" },
  { loc: "/intrebari-frecvente", priority: "0.7", changefreq: "monthly" },
  { loc: "/cariera", priority: "0.6", changefreq: "monthly" },
  { loc: "/militari-residence", priority: "0.9", changefreq: "weekly" },
  { loc: "/renew-residence", priority: "0.9", changefreq: "weekly" },
  { loc: "/eurocasa-residence", priority: "0.9", changefreq: "weekly" },
  { loc: "/militari-vs-chiajna-comparatie", priority: "0.8", changefreq: "monthly" },
  { loc: "/politica-confidentialitate", priority: "0.3", changefreq: "yearly" },
  { loc: "/termeni-conditii", priority: "0.3", changefreq: "yearly" },
];

export async function buildStaticSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const today = day();
  let inner = STATIC_PAGES.map((p) =>
    urlEntry(`${SITE}${p.loc}`, today, p.changefreq, p.priority),
  ).join("");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  for (const post of posts ?? []) {
    if (!post.slug) continue;
    inner += urlEntry(`${SITE}/blog/${post.slug}`, day(post.updated_at), "monthly", "0.7");
  }
  return urlset(inner);
}

/* ----------------------------------------------------------- properties */

export async function buildPropertiesSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const { data } = await supabase
    .from("catalog_offers")
    .select("id, slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  const inner = (data ?? [])
    .filter((p) => typeof p.slug === "string" && p.slug.trim().length > 0)
    .map((p) => urlEntry(`${SITE}/proprietati/${p.slug}`, day(p.updated_at), "weekly", "0.8"))
    .join("");
  return urlset(inner);
}

/* ------------------------------------------------------------- immoflux */

export async function buildImmofluxSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const { data } = await supabase
    .from("catalog_offers")
    .select("immoflux_slug, updated_at")
    .eq("crm_source", "immoflux")
    .eq("is_published", true)
    .neq("availability_status", "sold")
    .not("immoflux_slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(10000);

  const inner = (data ?? [])
    .filter((p) => typeof p.immoflux_slug === "string" && p.immoflux_slug.trim().length > 0)
    .map((p) => urlEntry(`${SITE}/proprietate/${p.immoflux_slug}`, day(p.updated_at), "weekly", "0.8"))
    .join("");
  return urlset(inner);
}

/* ------------------------------------------------------------ complexes */

export async function buildComplexesSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const { data } = await supabase
    .from("real_estate_projects")
    .select("id, name, slug, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  const inner = (data ?? [])
    .map((p) => urlEntry(`${SITE}/complexe/${getComplexSlug(p)}`, day(p.updated_at), "weekly", "0.8"))
    .join("");
  return urlset(inner);
}

/* --------------------------------------------------------------- images */

export async function buildImagesSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const [propertiesResult, projectsResult, newsResult] = await Promise.all([
    supabase
      .from("catalog_offers")
      .select("id, title, slug, immoflux_slug, images, updated_at")
      .eq("is_published", true)
      .not("images", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("real_estate_projects")
      .select("id, name, slug, main_image, updated_at")
      .eq("is_published", true)
      .not("main_image", "is", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("news_articles")
      .select("slug, title, description, featured_image, updated_at, published_date")
      .eq("status", "published")
      .not("featured_image", "is", null)
      .order("published_date", { ascending: false }),
  ]);

  let inner = "";

  for (const property of propertiesResult.data ?? []) {
    const images = Array.isArray(property.images) ? (property.images as unknown[]) : [];
    if (images.length === 0) continue;
    // Use the stored canonical slug; never recompute a slug on the fly.
    const path = property.slug
      ? `/proprietati/${property.slug}`
      : property.immoflux_slug
        ? `/proprietate/${property.immoflux_slug}`
        : null;
    if (!path) continue;

    let entries = "";
    images.slice(0, 50).forEach((raw, i) => {
      const imageUrl = typeof raw === "string" ? toAbsoluteUrl(raw) : "";
      if (!imageUrl || !isValidUrl(imageUrl)) return;
      entries += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${escapeXml(`${property.title || "Proprietate"} - Imagine ${i + 1}`)}</image:caption>
      <image:title>${escapeXml(property.title || "Proprietate imobiliară")}</image:title>
    </image:image>
`;
    });
    if (!entries) continue;

    inner += `  <url>
    <loc>${escapeXml(`${SITE}${path}`)}</loc>
    <lastmod>${day(property.updated_at)}</lastmod>
${entries}  </url>
`;
  }

  for (const project of projectsResult.data ?? []) {
    const image = toAbsoluteUrl(project.main_image ?? "");
    if (!isValidUrl(image)) continue;
    inner += `  <url>
    <loc>${escapeXml(`${SITE}/complexe/${getComplexSlug(project)}`)}</loc>
    <lastmod>${day(project.updated_at)}</lastmod>
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
      <image:caption>${escapeXml(project.name)} - Complex rezidențial</image:caption>
      <image:title>${escapeXml(project.name)}</image:title>
    </image:image>
  </url>
`;
  }

  for (const article of newsResult.data ?? []) {
    const image = toAbsoluteUrl(article.featured_image ?? "");
    if (!isValidUrl(image)) continue;
    inner += `  <url>
    <loc>${escapeXml(`${SITE}/news/${article.slug}`)}</loc>
    <lastmod>${day(article.updated_at)}</lastmod>
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
      <image:caption>${escapeXml(article.description || article.title || "Articol news")}</image:caption>
      <image:title>${escapeXml(article.title || "Articol news MVA Imobiliare")}</image:title>
    </image:image>
  </url>
`;
  }

  return urlset(inner, `\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`);
}

/* ----------------------------------------------------------------- news */

export async function buildNewsSitemap(): Promise<string> {
  const supabase = publicSupabase();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("news_articles")
    .select("slug, title, keywords, published_date, updated_at")
    .eq("status", "published")
    .gte("published_date", twoDaysAgo)
    .order("published_date", { ascending: false });

  let inner = "";
  for (const a of data ?? []) {
    const pubDate = a.published_date || a.updated_at;
    inner += `  <url>
    <loc>${SITE}/news/${escapeXml(a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>MVA Imobiliare</news:name>
        <news:language>ro</news:language>
      </news:publication>
      <news:publication_date>${new Date(pubDate ?? Date.now()).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>${
        a.keywords ? `\n      <news:keywords>${escapeXml(a.keywords)}</news:keywords>` : ""
      }
    </news:news>
  </url>
`;
  }
  return urlset(inner, `\n        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"`);
}
