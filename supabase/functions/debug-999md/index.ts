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

  const res = await fetch(`${API_BASE}/categories/270/subcategories/6959/offer-types?lang=ro`, {
    headers: { Authorization: auth }
  });
  const data = await res.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
