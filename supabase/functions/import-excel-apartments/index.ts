import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { apartments, projectId } = await req.json();
    
    if (!apartments || !Array.isArray(apartments)) {
      return new Response(
        JSON.stringify({ error: "Apartamentele sunt necesare" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error("Supabase environment not configured");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Get project details
    const { data: project } = await supabase
      .from("real_estate_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Proiect negăsit" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform apartments for insertion
    const offersToInsert = apartments.map((apt: any) => {
      const priceCredit = parseInt(apt.pret_credit.replace(/[€.,\s]/g, ''));
      const priceCash = parseInt(apt.pret_cash.replace(/[€.,\s]/g, ''));
      
      // Determine rooms based on apartment type
      let rooms = 1;
      if (apt.tip.includes('decomandat')) {
        rooms = 2;
      } else if (apt.tip.includes('studio')) {
        rooms = 1;
      }

      return {
        title: `Apartament ${apt.nr} - ${apt.tip}`,
        description: `${apt.tip} cu suprafața de ${apt.suprafata}mp, situat la ${apt.floor}`,
        project_id: projectId,
        project_name: project.name,
        location: project.location,
        surface_min: parseInt(apt.suprafata),
        surface_max: parseInt(apt.suprafata),
        price_min: priceCash,
        price_max: priceCredit,
        rooms: rooms,
        transaction_type: 'sale',
        currency: 'EUR',
        features: [apt.floor, `Apartament ${apt.nr}`, apt.tip],
        amenities: project.amenities || [],
        source: 'excel_import',
        availability_status: 'available',
        images: []
      };
    });

    // Insert apartments
    const { data: insertedOffers, error: insertError } = await supabase
      .from("catalog_offers")
      .insert(offersToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: insertedOffers.length,
        apartments: insertedOffers.map(o => ({ id: o.id, title: o.title }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    console.error("import-excel-apartments error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
