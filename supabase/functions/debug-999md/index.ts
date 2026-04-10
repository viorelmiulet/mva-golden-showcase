import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE = "https://partners-api.999.md";
const API_KEY = Deno.env.get("API_999MD_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = "Basic " + btoa(`${API_KEY}:`);

  // Incearca diferite combinatii de category_id pentru subcategoria 1345
  const results: Record<string, unknown> = {};

  // Offer types cu category_id = 1345 (subcategoria ca parinte)
  const r1 = await fetch(`${API_BASE}/categories/1345/subcategories?lang=ro`, {
    headers: { Authorization: auth }
  });
  results["subcategorii_1345"] = await r1.json();

  // Offer types direct pe subcategoria 1345 cu parinte 270
  const r2 = await fetch(`${API_BASE}/features?category_id=270&subcategory_id=1345&offer_type=1&lang=ro`, {
    headers: { Authorization: auth }
  });
  results["features_270_1345"] = await r2.json();

  // Incearca subcategoria 1346 (urmatoarea)
  const r3 = await fetch(`${API_BASE}/categories/270/subcategories/1346/offer-types?lang=ro`, {
    headers: { Authorization: auth }
  });
  results["offer_types_1346"] = await r3.json();

  // Incearca cu category_id = 1345 direct
  const r4 = await fetch(`${API_BASE}/categories/1345/subcategories/1346/offer-types?lang=ro`, {
    headers: { Authorization: auth }
  });
  results["offer_types_1345_1346"] = await r4.json();

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
