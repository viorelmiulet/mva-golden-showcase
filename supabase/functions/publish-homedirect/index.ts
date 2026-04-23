// Edge function: publish-homedirect
// Sincronizează un anunț (catalog_offers) cu HomeDirect API.
// Cheia API este citită din site_settings (key: integration_homedirect_api_key).

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
        error: "HomeDirect API Key lipsă. Setează cheia în Admin → Setări → Chei API & Integrări → HomeDirect.",
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

  // 3. Determine HomeDirect base URL
  const baseUrl = use_dev
    ? "https://dev-api.homedirect.ro"
    : "https://api.homedirect.ro";

  try {
    let hdResponse: Response;
    let hdData: any = null;

    if (action === "publish") {
      // Build payload from catalog_offers
      const payload = {
        title: listing.title,
        description: listing.description || listing.descriere_lunga || listing.title,
        price: listing.price_min,
        currency: listing.currency || "EUR",
        rooms: listing.rooms,
        surface: listing.surface_min,
        floor: listing.floor,
        total_floors: listing.total_floors,
        bathrooms: listing.bathrooms,
        year_built: listing.year_built,
        property_type: listing.property_type,
        transaction_type: listing.transaction_type || "sale",
        location: listing.location,
        zone: listing.zone,
        city: listing.city,
        latitude: listing.latitude,
        longitude: listing.longitude,
        images: listing.images || [],
        features: listing.features || [],
        amenities: listing.amenities || [],
      };

      hdResponse = await fetch(`${baseUrl}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      hdData = await hdResponse.json().catch(() => ({}));

      if (!hdResponse.ok) {
        return json(
          {
            success: false,
            error: hdData?.message || `HomeDirect publish failed (${hdResponse.status})`,
            details: hdData,
          },
          500
        );
      }

      const homedirectId = hdData?.id || hdData?.listing_id;
      const shortId = hdData?.short_id || hdData?.slug;

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

      const payload = {
        title: listing.title,
        description: listing.description || listing.descriere_lunga || listing.title,
        price: listing.price_min,
        currency: listing.currency || "EUR",
        rooms: listing.rooms,
        surface: listing.surface_min,
        floor: listing.floor,
        total_floors: listing.total_floors,
        bathrooms: listing.bathrooms,
        property_type: listing.property_type,
        transaction_type: listing.transaction_type || "sale",
        location: listing.location,
        zone: listing.zone,
        city: listing.city,
        images: listing.images || [],
        features: listing.features || [],
        amenities: listing.amenities || [],
      };

      hdResponse = await fetch(`${baseUrl}/listings/${listing.homedirect_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      hdData = await hdResponse.json().catch(() => ({}));

      if (!hdResponse.ok) {
        return json(
          {
            success: false,
            error: hdData?.message || `HomeDirect update failed (${hdResponse.status})`,
            details: hdData,
          },
          500
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

      hdResponse = await fetch(`${baseUrl}/listings/${listing.homedirect_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!hdResponse.ok && hdResponse.status !== 404) {
        hdData = await hdResponse.json().catch(() => ({}));
        return json(
          {
            success: false,
            error: hdData?.message || `HomeDirect delete failed (${hdResponse.status})`,
            details: hdData,
          },
          500
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
