import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for, cf-connecting-ip",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_IPS = new Set(["91.98.232.172"]);
const INDEXNOW_KEY = "eigr05fz1t3k1y20luvs3bh4yqd7u73d";
const SITE_URL = "https://www.mvaimobiliare.ro";

// ---- Types ----------------------------------------------------------------
interface LukianPhoto { url: string; order?: number }
interface LukianLocation {
  county?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  latitude?: number | string;
  longitude?: number | string;
}
interface LukianSurface {
  usable?: number | string;
  built?: number | string;
  land?: number | string;
}
interface LukianProperty {
  event?: "upsert" | "delete";
  external_id: string;
  id?: number | string;
  status?: string;
  title?: string;
  property_type?: string;
  transaction_type?: string;
  price?: number | string | null;
  currency?: string;
  previous_price?: number | string | null;
  surface?: LukianSurface;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  total_floors?: number | null;
  year_built?: number | null;
  comfort?: string | null;
  partitioning?: string | null;
  orientation?: string | null;
  heating?: string | null;
  energy_class?: string | null;
  location?: LukianLocation;
  description?: string;
  features?: string[];
  photos?: LukianPhoto[];
  video_url?: string | null;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---- Helpers --------------------------------------------------------------
function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
}

function kebab(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown): number | null {
  const n = toNum(v);
  return n === null ? null : Math.round(n);
}

const PROPERTY_TYPE_RO: Record<string, string> = {
  apartment: "apartament",
  house: "casa",
  villa: "vila",
  land: "teren",
  commercial: "spatiu-comercial",
  office: "birou",
  industrial: "spatiu-industrial",
  garage: "garaj",
};

function buildSeoSlug(p: LukianProperty): string {
  const parts: string[] = [];
  const typeRo = PROPERTY_TYPE_RO[(p.property_type || "").toLowerCase()] || "proprietate";
  const rooms = toInt(p.rooms);

  if (typeRo === "apartament" && rooms && rooms <= 1) {
    // Studio: just "garsoniera", no "apartament-" prefix
    parts.push("garsoniera");
  } else {
    parts.push(typeRo);
    if ((typeRo === "apartament" || typeRo === "casa" || typeRo === "vila") && rooms && rooms >= 2) {
      parts.push(`${rooms}-camere`);
    }
  }

  const usable = toInt(p.surface?.usable) ?? toInt(p.surface?.built) ?? toInt(p.surface?.land);
  if (usable && usable > 0) parts.push(`${usable}mp`);

  const floor = toInt(p.floor);
  if (floor !== null && floor >= 0) parts.push(floor === 0 ? "parter" : `etaj-${floor}`);

  const neighborhood = p.location?.neighborhood ? kebab(p.location.neighborhood) : "";
  if (neighborhood && neighborhood.length > 1) parts.push(neighborhood);

  const city = p.location?.city ? kebab(p.location.city) : "";
  if (city && city.length > 1 && !parts.some((x) => x.includes(city))) parts.push(city);

  // Stable unique suffix from external_id (e.g. IF-174008 -> if174008)
  const tail = kebab(p.external_id || String(p.id || "")).replace(/-/g, "");
  if (tail) parts.push(tail);

  return parts.filter(Boolean).join("-");
}

function buildMetaDescription(desc?: string, fallback?: string): string {
  const raw = (desc || fallback || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  if (raw.length <= 160) return raw;
  const cut = raw.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-\s]+$/, "") + "…";
}

const STATUS_MAP: Record<string, string> = {
  active: "available",
  reserved: "reserved",
  sold: "sold",
  rented: "rented",
  archived: "archived",
};

function mapLukianToCatalog(p: LukianProperty): Record<string, unknown> {
  const status = STATUS_MAP[(p.status || "").toLowerCase()] || "available";
  const isActive = status === "available";

  const usable = toInt(p.surface?.usable);
  const built = toInt(p.surface?.built);
  const land = toInt(p.surface?.land);
  const surface = usable ?? built ?? land;

  const photos = Array.isArray(p.photos) ? [...p.photos] : [];
  photos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const images = photos.map((ph) => ph.url).filter(Boolean);

  const price = toInt(p.price) ?? 0;
  const slug = buildSeoSlug(p);
  const metaDescription = buildMetaDescription(p.description, p.title);

  const extraSections: Record<string, unknown> = {
    lukian_id: p.id,
    lukian_external_id: p.external_id,
    lukian_status: p.status,
    lukian_updated_at: p.updated_at,
    meta_description: metaDescription,
  };
  if (p.bedrooms != null) extraSections.bedrooms = p.bedrooms;
  if (p.partitioning) extraSections.partitioning = p.partitioning;
  if (p.orientation) extraSections.orientation = p.orientation;
  if (p.energy_class) extraSections.energy_class = p.energy_class;
  if (p.previous_price != null) extraSections.previous_price = toInt(p.previous_price);
  if (p.location?.county) extraSections.county = p.location.county;
  if (p.location?.street) extraSections.street = p.location.street;

  const featuresArr = Array.isArray(p.features) ? p.features.filter(Boolean) : [];

  return {
    external_id: p.external_id,
    crm_source: "lukian",
    source: "lukian",
    title: p.title || `Proprietate ${p.external_id}`,
    description: p.description || "",
    descriere_lunga: p.description || "",
    slug,
    price_min: price,
    price_max: price,
    currency: (p.currency || "EUR").toUpperCase(),
    rooms: toInt(p.rooms),
    bathrooms: toInt(p.bathrooms),
    surface_min: surface,
    surface_max: surface,
    surface_land: land,
    images,
    features: featuresArr,
    location: p.location?.street || p.location?.neighborhood || p.location?.city || null,
    zone: p.location?.neighborhood || null,
    city: p.location?.city || null,
    floor: toInt(p.floor),
    floor_label: p.floor != null ? String(p.floor) : null,
    total_floors: toInt(p.total_floors),
    year_built: toInt(p.year_built),
    property_type: p.property_type || null,
    transaction_type: p.transaction_type || "sale",
    comfort: p.comfort || null,
    compartment: p.partitioning || null,
    heating: p.heating || null,
    latitude: toNum(p.location?.latitude),
    longitude: toNum(p.location?.longitude),
    video: p.video_url || null,
    availability_status: status,
    is_published: isActive,
    extra_sections: extraSections,
    project_id: null,
  };
}

async function pingIndexNow(url: string) {
  try {
    await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "mvaimobiliare.ro",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [url],
      }),
    });
  } catch (e) {
    console.warn("[import-lukian] IndexNow ping failed:", (e as Error).message);
  }
}

// ---- Handler --------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1) IP whitelist
  const ip = getClientIp(req);
  if (!ip || !ALLOWED_IPS.has(ip)) {
    console.warn("[import-lukian] Rejected IP:", ip);
    return new Response(JSON.stringify({ error: "Forbidden: IP not allowed", ip }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Bearer token
  const expectedToken = Deno.env.get("LUKIAN_WEBHOOK_TOKEN");
  if (!expectedToken) {
    console.error("[import-lukian] LUKIAN_WEBHOOK_TOKEN not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (provided !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const items: LukianProperty[] = Array.isArray(body) ? body : [body];

    const results: Array<Record<string, unknown>> = [];

    for (const item of items) {
      if (!item || !item.external_id) {
        results.push({ success: false, error: "missing external_id" });
        continue;
      }

      const event = item.event || "upsert";

      // DELETE → soft deactivate (keep page for SEO)
      if (event === "delete") {
        const { error } = await supabase
          .from("catalog_offers")
          .update({ availability_status: "archived", is_published: false })
          .eq("external_id", item.external_id)
          .eq("crm_source", "lukian");
        results.push({
          external_id: item.external_id,
          action: "soft_deleted",
          success: !error,
          error: error?.message,
        });
        continue;
      }

      // UPSERT
      const mapped = mapLukianToCatalog(item);
      const { data, error } = await supabase
        .from("catalog_offers")
        .upsert(mapped, { onConflict: "external_id", ignoreDuplicates: false })
        .select("id, slug, availability_status, is_published");

      if (error) {
        console.error("[import-lukian] upsert error:", error.message, item.external_id);
        results.push({ external_id: item.external_id, success: false, error: error.message });
        continue;
      }

      const row = data?.[0];
      results.push({
        external_id: item.external_id,
        action: "upserted",
        success: true,
        id: row?.id,
        slug: row?.slug,
        availability_status: row?.availability_status,
      });

      // Ping IndexNow for active listings
      if (row?.is_published && row?.slug) {
        await pingIndexNow(`${SITE_URL}/proprietati/${row.slug}`);
      }
    }

    const ok = results.every((r) => r.success);
    return new Response(
      JSON.stringify({ success: ok, count: results.length, results }),
      {
        status: ok ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[import-lukian] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
