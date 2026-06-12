// netlify/edge-functions/property-meta.ts
//
// Edge Function pentru mvaimobiliare.ro:
//  1. Interceptează paginile de proprietăți
//  2. Ia datele din Supabase (catalog_offers) după slug
//  3. Injectează title / description / canonical / OG / Twitter / JSON-LD
//     direct în HTML — vizibile pentru WhatsApp, Facebook, Google, fără JS
//  4. Întoarce status 404 real (+ noindex) pentru slug-uri inexistente
//  5. La orice eroare Supabase → fail-open: site-ul se livrează normal
//
// ─────────────────────────────────────────────────────────────────────

import type { Config, Context } from "@netlify/edge-functions";

// ═══ CONFIG — VERIFICĂ ȘI AJUSTEAZĂ ═══════════════════════════════════

// (1) Ruta paginilor de proprietăți. Schimbă dacă folosești alt prefix
//     (ex: "/proprietati/*", "/apartament/*").
export const config: Config = {
  path: "/proprietati/*",
};

const SITE_URL = "https://mvaimobiliare.ro";
const SITE_NAME = "MVA Imobiliare";
const FALLBACK_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

// Cheia anon e publică prin design (există deja în bundle-ul frontend),
// deci poate fi hardcodată aici fără risc. Valorile se copiază din
// clientul Supabase existent în proiect (src/integrations/supabase/client.ts).
const SUPABASE_URL = "https://fdpandnzblzvamhsoukt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU";

// (2) Numele tabelei și ale coloanelor — ajustează la schema ta reală.
const TABLE = "catalog_offers";
const COL = {
  slug: "slug",
  title: "title",
  description: "description",
  price: "price_min",
  currency: "currency", // ex: "EUR" / "RON"; dacă nu există coloana, șterge-o din SELECT
  rooms: "rooms", // nr. camere
  area: "surface_min", // suprafață utilă (mp)
  complex: "project_name", // numele ansamblului — șterge dacă nu există
  images: "images", // jsonb: array de URL-uri sau de obiecte { url: ... }
};

const SELECT = Object.values(COL).join(",");

// ═══ HELPERS ══════════════════════════════════════════════════════════

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

/** Normalizează coloana de imagini: array de string-uri, array de obiecte
 *  { url } sau string JSON. Întoarce primul URL absolut găsit. */
function firstImage(raw: unknown): string | null {
  let arr: unknown = raw;
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      return arr.startsWith("http") ? arr : null;
    }
  }
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  const url =
    typeof first === "string"
      ? first
      : first && typeof first === "object"
        ? ((first as Record<string, unknown>).url as string) ??
          ((first as Record<string, unknown>).src as string)
        : null;
  if (!url || typeof url !== "string") return null;
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

function formatPrice(price: unknown, currency: unknown): string | null {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  const cur = typeof currency === "string" && currency ? currency : "EUR";
  const formatted = new Intl.NumberFormat("ro-RO").format(n);
  return cur === "EUR" ? `${formatted} €` : `${formatted} ${cur}`;
}

/** Descriere meta de ~160 caractere construită din datele listării. */
function buildDescription(p: Record<string, unknown>): string {
  const parts: string[] = [];
  const rooms = Number(p[COL.rooms]);
  if (Number.isFinite(rooms) && rooms > 0) {
    parts.push(rooms === 1 ? "Garsonieră" : `Apartament ${rooms} camere`);
  }
  const area = Number(p[COL.area]);
  if (Number.isFinite(area) && area > 0) parts.push(`${area} mp`);
  const price = formatPrice(p[COL.price], p[COL.currency]);
  if (price) parts.push(price);
  const complex = p[COL.complex];
  if (typeof complex === "string" && complex) parts.push(complex);

  const lead = parts.join(", ");
  const desc = typeof p[COL.description] === "string"
    ? (p[COL.description] as string).replace(/\s+/g, " ").trim()
    : "";

  const full = lead && desc ? `${lead}. ${desc}` : lead || desc;
  return truncate(full || `Proprietate de vânzare — ${SITE_NAME}`, 160);
}

function buildJsonLd(
  p: Record<string, unknown>,
  canonical: string,
  image: string,
  description: string,
): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p[COL.title] ?? SITE_NAME,
    description,
    url: canonical,
    image: [image],
  };
  const priceNum = Number(p[COL.price]);
  if (Number.isFinite(priceNum) && priceNum > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      price: priceNum,
      priceCurrency:
        typeof p[COL.currency] === "string" && p[COL.currency]
          ? p[COL.currency]
          : "EUR",
      availability: "https://schema.org/InStock",
    };
  }
  // \u003c previne închiderea prematură a tagului <script>
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

/** Scoate meta-tagurile statice din shell ca să nu existe duplicate. */
function stripStaticMeta(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
}

function injectHead(html: string, block: string): string {
  return stripStaticMeta(html).replace("</head>", `${block}\n</head>`);
}

async function fetchProperty(
  slug: string,
): Promise<{ ok: boolean; property: Record<string, unknown> | null }> {
  try {
    const endpoint =
      `${SUPABASE_URL}/rest/v1/${TABLE}` +
      `?${COL.slug}=eq.${encodeURIComponent(slug)}` +
      `&select=${encodeURIComponent(SELECT)}&limit=1`;

    const res = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return { ok: false, property: null };

    const rows = (await res.json()) as Record<string, unknown>[];
    return { ok: true, property: rows[0] ?? null };
  } catch {
    return { ok: false, property: null };
  }
}

// ═══ HANDLER ══════════════════════════════════════════════════════════

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/\/+$/, "").split("/").pop() ?? "";

  // Slug invalid (gol, conține "." etc.) → pass-through, nu ne atingem.
  if (!/^[a-z0-9-]+$/i.test(slug)) return context.next();

  // Shell-ul SPA și query-ul Supabase, în paralel.
  const [originResponse, result] = await Promise.all([
    context.next(),
    fetchProperty(slug),
  ]);

  const contentType = originResponse.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return originResponse;

  const html = await originResponse.text();
  const headers = new Headers(originResponse.headers);
  headers.set("content-type", "text/html; charset=utf-8");

  // Eroare Supabase → fail-open: livrăm site-ul normal, fără injecție.
  if (!result.ok) {
    headers.set("cache-control", "no-store");
    return new Response(html, { status: 200, headers });
  }

  // ── Slug inexistent → 404 real + noindex ─────────────────────────────
  if (!result.property) {
    const notFoundBlock = [
      `<title>Proprietate negăsită — ${SITE_NAME}</title>`,
      `<meta name="robots" content="noindex, nofollow">`,
      `<meta name="description" content="Această proprietate nu mai este disponibilă.">`,
    ].join("\n");

    headers.set("cache-control", "public, max-age=0, s-maxage=60");
    return new Response(injectHead(html, notFoundBlock), {
      status: 404,
      headers,
    });
  }

  // ── Proprietate găsită → injectăm meta complet ────────────────────────
  const p = result.property;
  const canonical = `${SITE_URL}${url.pathname}`;
  const rawTitle =
    typeof p[COL.title] === "string" && p[COL.title]
      ? (p[COL.title] as string)
      : "Proprietate de vânzare";
  const title = truncate(`${rawTitle} — ${SITE_NAME}`, 70);
  const description = buildDescription(p);
  const image = firstImage(p[COL.images]) ?? FALLBACK_OG_IMAGE;

  const e = escapeHtml;
  const block = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(description)}">`,
    `<link rel="canonical" href="${e(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}">`,
    `<meta property="og:locale" content="ro_RO">`,
    `<meta property="og:url" content="${e(canonical)}">`,
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(description)}">`,
    `<meta property="og:image" content="${e(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${e(title)}">`,
    `<meta name="twitter:description" content="${e(description)}">`,
    `<meta name="twitter:image" content="${e(image)}">`,
    `<script type="application/ld+json">${buildJsonLd(p, canonical, image, description)}</script>`,
  ].join("\n");

  // Cache CDN 5 min + stale-while-revalidate: preview-uri rapide,
  // prețuri rezonabil de proaspete.
  headers.set(
    "cache-control",
    "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
  );

  return new Response(injectHead(html, block), { status: 200, headers });
};
