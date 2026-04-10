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

  // Fetch categorii
  const catRes = await fetch(`${API_BASE}/categories?lang=ro`, {
    headers: { Authorization: auth }
  });
  const categories = await catRes.json();

  return new Response(JSON.stringify(categories, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
