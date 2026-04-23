// Edge function: publish-homedirect
// Sincronizează un anunț (catalog_offers) cu HomeDirect CRM API.
// API: https://www.homedirect.ro/api/docs/
// Autentificare: header X-API-Key
// Endpoint: /api/crm/v1/properties

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type HDAction = "publish" | "update" | "delete";

interface RequestBody {
  listing_id?: string;
  action?: HDAction;
  use_dev?: boolean;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- Mapping helpers (catalog_offers -> HomeDirect) ----------

function mapFloor(floor: number | null | undefined): string | undefined {
  if (floor === null || floor === undefined) return undefined;
  if (floor < 0) return "basement";
  if (floor === 0) return "ground";
  if (floor >= 1 && floor <= 10) return `floor${floor}`;
  if (floor > 10) return "floorAbove10";
  return undefined;
}

function mapPropertyType(t: string | null | undefined): string {
  const v = (t || "").toLowerCase();
  if (v.includes("garson") || v.includes("studio")) return "apartment";
  if (v.includes("casa") || v.includes("house") || v.includes("vila")) return "house";
  if (v.includes("teren") || v.includes("land")) return "land";
  if (v.includes("comerc")) return "commercial";
  if (v.includes("birou") || v.includes("office")) return "office";
  if (v.includes("hotel")) return "commercial";
  return "apartment";
}

function mapTransactionType(t: string | null | undefined): string {
  const v = (t || "").toLowerCase();
  if (v.includes("inchir") || v.includes("rent")) return "rent";
  return "buy";
}

function mapConstructionYear(year: number | null | undefined): string | undefined {
  if (!year) return undefined;
  if (year >= 2010) return "after-2010";
  if (year >= 2000) return "2000-2010";
  if (year >= 1990) return "1990-2000";
  if (year >= 1977) return "1977-1990";
  if (year >= 1941) return "1941-1977";
  return "before-1941";
}

function buildPostData(listing: any) {
  const postData: Record<string, unknown> = {
    title: listing.title,
    price: Math.round(Number(listing.price_min) || 0),
    city: listing.city || "București",
    type: mapTransactionType(listing.transaction_type),
    property: mapPropertyType(listing.property_type),
    latitude: listing.latitude != null ? String(listing.latitude) : undefined,
    longitude: listing.longitude != null ? String(listing.longitude) : undefined,
  };

  if (listing.zone) postData.district = listing.zone;
  if (listing.rooms) postData.bedroom = listing.rooms;
  if (listing.bathrooms) postData.bathroom = listing.bathrooms;

  const floor = mapFloor(listing.floor);
  if (floor) postData.floor = floor;
  if (listing.total_floors) postData.totalFloors = String(listing.total_floors);

  const year = mapConstructionYear(listing.year_built);
  if (year) postData.constructionYear = year;

  // images injected separately after rehosting
  return postData;
}

function buildPayload(listing: any, images: string[]) {
  const postData = buildPostData(listing);
  if (images.length > 0) postData.images = images;
  return {
    postData,
    postDetail: {
      desc:
        listing.description ||
        listing.descriere_lunga ||
        listing.title,
      size: listing.surface_min ? Math.round(Number(listing.surface_min)) : undefined,
    },
  };
}

// ---------- Image rehosting ----------
// Descarcă imaginile externe (ex: immoflux) și le re-uploadează pe Supabase Storage,
// astfel încât HomeDirect să le poată descărca fără să fie blocat de hotlink protection.

const SUPABASE_STORAGE_HOST = "supabase.co";

async function rehostImage(
  supabase: any,
  url: string,
  listingId: string,
  index: number
): Promise<string | null> {
  try {
    // Dacă imaginea e deja pe Supabase, păstreaz-o
    if (url.includes(SUPABASE_STORAGE_HOST)) return url;

    const res = await fetch(url, {
      headers: {
        // unele servere imagini blochează lipsa user-agent-ului
        "User-Agent":
          "Mozilla/5.0 (compatible; MVAImobiliareBot/1.0; +https://mvaimobiliare.ro)",
        "Accept": "image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.warn("[rehost] fetch failed", res.status, url);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext =
      contentType.includes("png") ? "png" :
      contentType.includes("webp") ? "webp" :
      contentType.includes("gif") ? "gif" : "jpg";
    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `homedirect/${listingId}/${index}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("property-images")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) {
      console.warn("[rehost] upload failed", upErr.message, url);
      return null;
    }
    const { data: pub } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);
    return pub?.publicUrl || null;
  } catch (e) {
    console.warn("[rehost] error", (e as Error).message, url);
    return null;
  }
}

async function rehostImages(
  supabase: any,
  images: unknown,
  listingId: string
): Promise<string[]> {
  if (!Array.isArray(images)) return [];
  const results = await Promise.all(
    images.map((u, i) =>
      typeof u === "string" && u.startsWith("http")
        ? rehostImage(supabase, u, listingId, i)
        : Promise.resolve(null)
    )
  );
  return results.filter((u): u is string => !!u);
}

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(
      { success: false, error: "Server misconfiguration: missing Supabase env vars" },
      500
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { listing_id, action, use_dev } = body;

  if (!listing_id || typeof listing_id !== "string") {
    return json({ success: false, error: "Missing required field: listing_id" }, 400);
  }
  if (!action || !["publish", "update", "delete"].includes(action)) {
    return json(
      { success: false, error: "Invalid action. Use 'publish' | 'update' | 'delete'." },
      400
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Read API key from site_settings
  const { data: keyRow, error: keyErr } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "integration_homedirect_api_key")
    .maybeSingle();

  if (keyErr) {
    console.error("[publish-homedirect] Failed to read API key", keyErr);
    return json({ success: false, error: "Could not read HomeDirect API key" }, 500);
  }

  const apiKey = keyRow?.value?.trim();
  if (!apiKey) {
    return json(
      {
        success: false,
        error:
          "HomeDirect API Key lipsă. Setează cheia în Admin → Setări → Chei API & Integrări → HomeDirect.",
      },
      400
    );
  }

  // 2. Load the listing
  const { data: listing, error: listingErr } = await supabase
    .from("catalog_offers")
    .select("*")
    .eq("id", listing_id)
    .maybeSingle();

  if (listingErr || !listing) {
    return json(
      { success: false, error: listingErr?.message || "Listing not found" },
      404
    );
  }

  // 3. Determine HomeDirect API base URL (CRM v1)
  const apiBaseUrl = use_dev
    ? "https://dev.homedirect.ro/api/crm/v1"
    : "https://homedirect.ro/api/crm/v1";
  const propertiesUrl = `${apiBaseUrl}/properties`;

  const hdHeaders = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  try {
    if (action === "publish") {
      const rehosted = await rehostImages(supabase, listing.images, listing_id);
      console.log("[publish-homedirect] rehosted", rehosted.length, "of", (listing.images || []).length);
      const payload = buildPayload(listing, rehosted);

      console.log("[publish-homedirect] PUBLISH url", propertiesUrl);
      console.log("[publish-homedirect] PUBLISH payload", JSON.stringify(payload));

      const hdResponse = await fetch(propertiesUrl, {
        method: "POST",
        headers: hdHeaders,
        body: JSON.stringify(payload),
      });

      const rawText = await hdResponse.text();
      console.log("[publish-homedirect] PUBLISH response", hdResponse.status, rawText);
      let hdData: any;
      try { hdData = JSON.parse(rawText); } catch { hdData = { raw: rawText }; }

      if (!hdResponse.ok) {
        return json(
          {
            success: false,
            error:
              hdData?.message ||
              hdData?.error ||
              `HomeDirect publish failed (${hdResponse.status})`,
            status: hdResponse.status,
            details: hdData,
            sent_payload: payload,
          },
          200
        );
      }

      const hdProp = hdData?.data || hdData?.property || hdData;
      const homedirectId = hdProp?.id || hdProp?._id;
      const shortId = hdProp?.shortId || hdProp?.short_id;

      await supabase
        .from("catalog_offers")
        .update({
          homedirect_id: homedirectId,
          homedirect_short_id: shortId,
          homedirect_status: "published",
          homedirect_synced_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      return json({
        success: true,
        message: "Anunțul a fost publicat pe HomeDirect",
        homedirect_id: homedirectId,
        homedirect_short_id: shortId,
      });
    }

    if (action === "update") {
      if (!listing.homedirect_id) {
        return json(
          { success: false, error: "Acest anunț nu este publicat pe HomeDirect" },
          400
        );
      }

      const rehosted = await rehostImages(supabase, listing.images, listing_id);
      const payload = buildPayload(listing, rehosted);

      const hdResponse = await fetch(`${propertiesUrl}/${listing.homedirect_id}`, {
        method: "PUT",
        headers: hdHeaders,
        body: JSON.stringify(payload),
      });

      const rawText = await hdResponse.text();
      let hdData: any;
      try { hdData = JSON.parse(rawText); } catch { hdData = { raw: rawText }; }

      if (!hdResponse.ok) {
        return json(
          {
            success: false,
            error: hdData?.message || `HomeDirect update failed (${hdResponse.status})`,
            status: hdResponse.status,
            details: hdData,
            sent_payload: payload,
          },
          200
        );
      }

      await supabase
        .from("catalog_offers")
        .update({
          homedirect_status: "published",
          homedirect_synced_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      return json({
        success: true,
        message: "Modificările au fost sincronizate",
        homedirect_id: listing.homedirect_id,
        homedirect_short_id: listing.homedirect_short_id,
      });
    }

    if (action === "delete") {
      if (!listing.homedirect_id) {
        return json(
          { success: false, error: "Acest anunț nu este publicat pe HomeDirect" },
          400
        );
      }

      const hdResponse = await fetch(`${propertiesUrl}/${listing.homedirect_id}`, {
        method: "DELETE",
        headers: { "X-API-Key": apiKey },
      });

      if (!hdResponse.ok && hdResponse.status !== 404) {
        const rawText = await hdResponse.text();
        let hdData: any;
        try { hdData = JSON.parse(rawText); } catch { hdData = { raw: rawText }; }
        return json(
          {
            success: false,
            error: hdData?.message || `HomeDirect delete failed (${hdResponse.status})`,
            status: hdResponse.status,
            details: hdData,
          },
          200
        );
      }

      await supabase
        .from("catalog_offers")
        .update({
          homedirect_id: null,
          homedirect_short_id: null,
          homedirect_status: "deleted",
          homedirect_synced_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      return json({
        success: true,
        message: "Anunțul a fost retras de pe HomeDirect",
      });
    }

    return json({ success: false, error: "Unsupported action" }, 400);
  } catch (e) {
    console.error("[publish-homedirect] Unexpected error", e);
    return json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      500
    );
  }
});
