import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE = "https://partners-api.999.md";
const API_KEY = Deno.env.get("API_999MD_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAuthHeader(): string {
  return "Basic " + btoa(`${API_KEY}:`);
}

async function uploadImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();
    const formData = new FormData();
    formData.append("file", blob, "image.jpg");
    const res = await fetch(`${API_BASE}/images`, {
      method: "POST",
      headers: { Authorization: getAuthHeader() },
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.image_id ?? null;
  } catch (e) {
    console.error("uploadImageFromUrl error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const payload = await req.json();
    if (!payload.title || !payload.price || !payload.phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Campuri obligatorii: title, price, phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload imagini
    const imageIds: string[] = [];
    if (payload.images && payload.images.length > 0) {
      for (const imgUrl of payload.images.slice(0, 20)) {
        const id = await uploadImageFromUrl(imgUrl);
        if (id) imageIds.push(id);
      }
    }

    const features = [
      { id: "2", value: Number(payload.price), unit: payload.currency ?? "eur" },
      { id: "12", value: { ro: payload.title, ru: payload.title } },
      { id: "13", value: { ro: payload.description, ru: payload.description } },
      { id: "16", value: [payload.phone] },
      ...(payload.surface ? [{ id: "3", value: Number(payload.surface), unit: "m2" }] : []),
      ...(payload.rooms ? [{ id: "58", value: String(payload.rooms) }] : []),
      ...(payload.floor ? [{ id: "52", value: Number(payload.floor) }] : []),
      ...(payload.total_floors ? [{ id: "53", value: Number(payload.total_floors) }] : []),
      ...(imageIds.length > 0 ? [{ id: "14", value: imageIds }] : []),
      { id: "5", value: payload.city_id ?? "12869" },
      ...(payload.zone_id ? [{ id: "7", value: String(payload.zone_id) }] : []),
      { id: "795", value: "18894" },
    ];

    const body = {
      category_id: "270",
      subcategory_id: "6959",
      offer_type: "776",
      features,
    };

    const res = await fetch(`${API_BASE}/adverts`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      const rawError = typeof data === 'object' ? (data.error?.message ?? data.error ?? "Eroare API") : String(data);
      const errorMsg = rawError === "insufficient balance"
        ? "Sold insuficient pe contul 999.md. Alimentează contul pentru a publica anunțuri."
        : String(rawError);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg, raw: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, advert_id: data.advert?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
