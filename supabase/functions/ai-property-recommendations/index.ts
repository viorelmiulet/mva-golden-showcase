import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, preferences } = await req.json();
    
    console.log("Received request for client:", clientId);
    console.log("Preferences:", JSON.stringify(preferences));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch available properties
    const { data: properties, error: propertiesError } = await supabase
      .from("catalog_offers")
      .select("*")
      .eq("availability_status", "available")
      .limit(50);

    if (propertiesError) {
      console.error("Error fetching properties:", propertiesError);
      throw propertiesError;
    }

    console.log(`Found ${properties?.length || 0} available properties`);

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "Nu există proprietăți disponibile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare properties summary for AI
    const propertiesSummary = properties.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      price_min: p.price_min,
      price_max: p.price_max,
      surface_min: p.surface_min,
      surface_max: p.surface_max,
      rooms: p.rooms,
      features: p.features,
      amenities: p.amenities,
      project_name: p.project_name,
    }));

    const systemPrompt = `Ești un agent imobiliar expert care ajută clienții să găsească proprietatea perfectă.
Analizează preferințele clientului și lista de proprietăți disponibile.
Returnează un JSON cu proprietățile recomandate, ordonate după relevanță (cele mai potrivite primele).
Pentru fiecare recomandare, explică de ce se potrivește preferințelor clientului.`;

    const userPrompt = `Preferințele clientului:
${JSON.stringify(preferences, null, 2)}

Proprietăți disponibile:
${JSON.stringify(propertiesSummary, null, 2)}

Analizează și returnează un JSON în formatul:
{
  "recommendations": [
    {
      "property_id": "id-ul proprietății",
      "match_score": 95,
      "reasons": ["motiv 1", "motiv 2"]
    }
  ]
}

Returnează maxim 5 proprietăți, ordonate după scorul de potrivire (descrescător).
Consideră prețul, suprafața, numărul de camere, locația și facilitățile.`;

    console.log("Calling Lovable AI for recommendations...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Prea multe cereri. Încearcă din nou mai târziu." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credite AI insuficiente. Contactează administratorul." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error: " + errorText);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    let aiRecommendations;
    try {
      aiRecommendations = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Enrich recommendations with full property data
    const enrichedRecommendations = (aiRecommendations.recommendations || []).map((rec: any) => {
      const property = properties.find((p) => p.id === rec.property_id);
      return {
        ...rec,
        property,
      };
    }).filter((rec: any) => rec.property); // Only include valid properties

    console.log(`Returning ${enrichedRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({ recommendations: enrichedRecommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-property-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
