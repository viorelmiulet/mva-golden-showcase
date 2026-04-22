// Edge function: generates branded Open Graph SVG images at 1200x630
// Usage: /functions/v1/og-image?type=property&id=<uuid>
//        /functions/v1/og-image?type=immoflux&id=<numericId>
//        /functions/v1/og-image?type=project&id=<uuid>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const W = 1200;
const H = 630;
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0D67A";
const BG = "#0A0A0A";

// Escape XML/SVG text content
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap title to up to 2 lines (~28 chars per line)
function wrapTitle(title: string, maxChars = 30, maxLines = 2): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // Append remaining words to last line if truncated
  const used = lines.join(" ").split(/\s+/).length;
  if (used < words.length && lines.length === maxLines) {
    const last = lines[lines.length - 1];
    const remaining = words.slice(used).join(" ");
    const truncated = `${last} ${remaining}`.slice(0, maxChars + 3) + "…";
    lines[lines.length - 1] = truncated;
  }
  return lines;
}

function buildSvg(opts: {
  imageUrl: string | null;
  title: string;
  price: string | null;
  meta: string | null;
  badge: string;
}): string {
  const { imageUrl, title, price, meta, badge } = opts;
  const titleLines = wrapTitle(title, 30, 2);
  const titleY = price ? 360 : 400;
  const lineHeight = 70;

  // Photo block on the right (or full bg if available); else solid gradient
  const photoBlock = imageUrl
    ? `
    <defs>
      <pattern id="propImg" patternUnits="userSpaceOnUse" width="${W}" height="${H}">
        <image href="${esc(imageUrl)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#propImg)"/>
    <rect width="${W}" height="${H}" fill="rgba(10,10,10,0.72)"/>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BG}" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="${BG}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0.25"/>
    </linearGradient>
    <rect width="${W}" height="${H}" fill="url(#fade)"/>
  `
    : `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0A0A0A"/>
        <stop offset="100%" stop-color="#1a1410"/>
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
  `;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * lineHeight}" font-family="Georgia, 'Playfair Display', serif" font-size="56" font-weight="700" fill="#FFFFFF">${esc(line)}</text>`,
    )
    .join("");

  const priceSvg = price
    ? `<text x="80" y="${titleY + titleLines.length * lineHeight + 60}" font-family="Georgia, serif" font-size="64" font-weight="700" fill="${GOLD}">${esc(price)}</text>`
    : "";

  const metaSvg = meta
    ? `<text x="80" y="${H - 70}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" fill="#E5E5E5" letter-spacing="1">${esc(meta)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${photoBlock}

  <!-- Gold accent bar -->
  <rect x="0" y="0" width="8" height="${H}" fill="${GOLD}"/>

  <!-- Top brand strip -->
  <text x="80" y="100" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="${GOLD_LIGHT}" letter-spacing="4">MVA IMOBILIARE</text>

  <!-- Badge / category -->
  <rect x="80" y="140" width="${badge.length * 14 + 40}" height="44" rx="22" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <text x="${100}" y="171" font-family="Inter, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="${GOLD}" letter-spacing="2">${esc(badge.toUpperCase())}</text>

  <!-- Title -->
  ${titleSvg}

  <!-- Price -->
  ${priceSvg}

  <!-- Meta line -->
  ${metaSvg}

  <!-- Bottom URL -->
  <text x="${W - 80}" y="${H - 70}" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="${GOLD}">mvaimobiliare.ro</text>

  <!-- Decorative gold corner -->
  <line x1="${W - 80}" y1="100" x2="${W - 30}" y2="100" stroke="${GOLD}" stroke-width="3"/>
  <line x1="${W - 30}" y1="100" x2="${W - 30}" y2="150" stroke="${GOLD}" stroke-width="3"/>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const type = (url.searchParams.get("type") || "").toLowerCase().trim();
    const id = (url.searchParams.get("id") || "").trim();
    const locale = (url.searchParams.get("locale") || "ro").toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let title = "MVA Imobiliare";
    let price: string | null = null;
    let meta: string | null = null;
    let imageUrl: string | null = null;
    let badge = "Imobiliare";

    if (type === "property" && id) {
      const { data } = await supabase
        .from("catalog_offers")
        .select("title,price_min,price_max,currency,zone,location,city,rooms,surface_min,images,transaction_type")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        title = data.title || `Apartament ${data.rooms || ""} camere`;
        const cur = data.currency || "EUR";
        if (data.price_min) {
          price = `${Number(data.price_min).toLocaleString("ro-RO")} ${cur}`;
        }
        const parts = [
          data.rooms ? `${data.rooms} camere` : null,
          data.surface_min ? `${data.surface_min} mp` : null,
          data.zone || data.location || data.city,
        ].filter(Boolean);
        meta = parts.join(" · ");
        if (Array.isArray(data.images) && data.images.length > 0) {
          imageUrl = String(data.images[0]);
        }
        badge = data.transaction_type === "rent" ? "De închiriat" : "De vânzare";
      }
    } else if (type === "project" && id) {
      const { data } = await supabase
        .from("real_estate_projects")
        .select("name,description,location,price_range,rooms_range,main_image,status")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        title = data.name;
        price = data.price_range || null;
        meta = [data.rooms_range ? `${data.rooms_range} camere` : null, data.location].filter(Boolean).join(" · ");
        imageUrl = data.main_image;
        badge = "Ansamblu rezidențial";
      }
    } else if (type === "immoflux" && id) {
      try {
        const proxyUrl = `${supabaseUrl}/functions/v1/immoflux-proxy/properties/${id}`;
        const resp = await fetch(proxyUrl, {
          headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" },
        });
        if (resp.ok) {
          const p = await resp.json();
          const t = typeof p.titlu === "object" ? p.titlu?.ro : p.titlu;
          title = t || `Apartament ${p.nrcamere || ""} camere`;
          if (p.pretvanzare) {
            price = `${Number(p.pretvanzare).toLocaleString("ro-RO")} ${p.monedavanzare || "EUR"}`;
          }
          const parts = [
            p.nrcamere ? `${p.nrcamere} camere` : null,
            p.suprafatautila ? `${p.suprafatautila} mp` : null,
            p.zona || p.localitate,
          ].filter(Boolean);
          meta = parts.join(" · ");
          if (Array.isArray(p.images) && p.images.length > 0) {
            imageUrl = p.images[0]?.src || p.images[0];
          }
          badge = p.devanzare === 1 ? "De vânzare" : "De închiriat";
        }
      } catch (e) {
        console.error("og-image: immoflux fetch error", e);
      }
    }

    let svg: string;
    try {
      svg = buildSvg({ imageUrl, title, price, meta, badge });
    } catch (genError) {
      console.error("og-image: SVG generation failed", { type, id, locale, error: genError });
      // Fallback minimal branded SVG so social crawlers still get a valid image
      svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="0" width="8" height="${H}" fill="${GOLD}"/>
  <text x="80" y="100" font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="${GOLD_LIGHT}" letter-spacing="4">MVA IMOBILIARE</text>
  <text x="80" y="${H / 2}" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#FFFFFF">${esc(title || "MVA Imobiliare")}</text>
  <text x="${W - 80}" y="${H - 70}" text-anchor="end" font-family="Inter, sans-serif" font-size="24" fill="${GOLD}">mvaimobiliare.ro</text>
</svg>`;
    }

    // ETag includes type+id+locale to ensure unique cache key per combination
    const cacheKey = `${type}:${id}:${locale}:${svg}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(cacheKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const etag = `"${hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16)}"`;

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: etag,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          Vary: "Accept-Encoding, Accept-Language",
        },
      });
    }

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800, immutable",
        ETag: etag,
        "CDN-Cache-Control": "public, max-age=86400",
        Vary: "Accept-Encoding, Accept-Language",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("og-image error", { message, stack: e instanceof Error ? e.stack : undefined });
    // Always return a valid SVG (status 200) so social crawlers don't break.
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<!-- og-image fallback: ${esc(message).slice(0, 200)} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="0" width="8" height="${H}" fill="${GOLD}"/>
  <text x="50%" y="50%" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-size="56" font-weight="700">MVA Imobiliare</text>
  <text x="50%" y="60%" text-anchor="middle" fill="#E5E5E5" font-family="Inter, sans-serif" font-size="24">mvaimobiliare.ro</text>
</svg>`,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "X-OG-Fallback": "true",
          "X-OG-Error": message.slice(0, 120).replace(/[^\x20-\x7E]/g, ""),
        },
      },
    );
  }
});
