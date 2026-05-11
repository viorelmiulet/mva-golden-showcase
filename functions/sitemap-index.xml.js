// Cloudflare Pages Function: /sitemap-index.xml
// Returnează un sitemap index care listează toate sitemap-urile site-ului.
// Util pentru Google Search Console — un singur URL de submis.

const SITE = "https://www.mvaimobiliare.ro";

const SITEMAPS = [
  "/sitemap.xml",
  "/news-sitemap.xml",
  "/sitemap-images.xml",
];

export async function onRequestGet() {
  const lastmod = new Date().toISOString();

  const entries = SITEMAPS.map(
    (path) =>
      `  <sitemap>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      // Index-ul în sine nu se schimbă des — cache mai agresiv
      "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
