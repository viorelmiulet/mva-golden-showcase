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

  // Pas 1: toate subcategoriile imobiliare
  const subRes = await fetch(`${API_BASE}/categories/270/subcategories?lang=ro`, {
    headers: { Authorization: auth }
  });
  const subData = await subRes.json();
  const subcategories = subData.subcategories ?? [];

  // Pas 2: pentru fiecare subcategorie, fetch offer-types
  const results = [];
  for (const sub of subcategories) {
    const otRes = await fetch(`${API_BASE}/categories/270/subcategories/${sub.id}/offer-types?lang=ro`, {
      headers: { Authorization: auth }
    });
    const otData = await otRes.json();
    results.push({
      subcategory_id: sub.id,
      subcategory_title: sub.title,
      offer_types: otData.offer_types ?? otData
    });
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
