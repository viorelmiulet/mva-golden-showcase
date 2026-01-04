import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { airbnb_url, import_to_rentals } = await req.json();

    if (!airbnb_url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL Airbnb necesar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl nu este configurat" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Airbnb URL
    if (!airbnb_url.includes("airbnb.com") && !airbnb_url.includes("airbnb.")) {
      return new Response(
        JSON.stringify({ success: false, error: "URL-ul trebuie să fie de pe Airbnb" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping Airbnb listing:", airbnb_url);

    // Use Firecrawl to scrape the Airbnb listing with JSON extraction
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: airbnb_url,
        formats: [
          "markdown",
          {
            type: "json",
            prompt: `Extract the following information from this Airbnb listing:
              - title: The property title/name
              - description: Full property description
              - location: City and area/neighborhood
              - address: Full address if available
              - price_per_night: Nightly price (number only, no currency)
              - currency: Currency code (EUR, USD, RON, etc.)
              - rooms: Number of bedrooms
              - bathrooms: Number of bathrooms
              - max_guests: Maximum number of guests
              - amenities: Array of amenities/facilities
              - images: Array of image URLs
              - check_in_time: Check-in time
              - check_out_time: Check-out time
              - house_rules: Any house rules mentioned
              - host_name: Name of the host
              - rating: Average rating (number)
              - reviews_count: Number of reviews
              - property_type: Type of property (apartment, house, studio, etc.)
              - surface: Surface area in square meters if mentioned`,
          },
          "screenshot",
        ],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || "Eroare la scraping" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scrape successful");

    // Extract the JSON data
    const extractedData = scrapeData.data?.json || scrapeData.json || {};
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;

    // Parse additional data from markdown if JSON extraction missed some
    const parsedData = {
      title: extractedData.title || extractTitleFromMarkdown(markdown),
      description: extractedData.description || extractDescriptionFromMarkdown(markdown),
      location: extractedData.location || "",
      address: extractedData.address || "",
      price_per_night: parseFloat(extractedData.price_per_night) || extractPriceFromMarkdown(markdown),
      currency: extractedData.currency || "EUR",
      rooms: parseInt(extractedData.rooms) || extractRoomsFromMarkdown(markdown),
      bathrooms: parseInt(extractedData.bathrooms) || 1,
      max_guests: parseInt(extractedData.max_guests) || extractGuestsFromMarkdown(markdown),
      amenities: extractedData.amenities || [],
      images: extractedData.images || [],
      check_in_time: extractedData.check_in_time || "15:00",
      check_out_time: extractedData.check_out_time || "11:00",
      house_rules: extractedData.house_rules || "",
      host_name: extractedData.host_name || "",
      rating: parseFloat(extractedData.rating) || null,
      reviews_count: parseInt(extractedData.reviews_count) || null,
      property_type: extractedData.property_type || "apartament",
      surface: parseFloat(extractedData.surface) || null,
      source_url: airbnb_url,
      screenshot: screenshot,
    };

    // If import_to_rentals is true, save to short_term_rentals table
    if (import_to_rentals) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: rental, error: insertError } = await supabase
        .from("short_term_rentals")
        .insert({
          title: parsedData.title || "Proprietate Airbnb",
          description: parsedData.description,
          location: parsedData.location,
          address: parsedData.address,
          rooms: parsedData.rooms || 1,
          bathrooms: parsedData.bathrooms || 1,
          max_guests: parsedData.max_guests || 2,
          surface: parsedData.surface,
          base_price: parsedData.price_per_night || 0,
          currency: parsedData.currency,
          amenities: Array.isArray(parsedData.amenities) ? parsedData.amenities : [],
          images: Array.isArray(parsedData.images) ? parsedData.images : [],
          check_in_time: parsedData.check_in_time,
          check_out_time: parsedData.check_out_time,
          rules: parsedData.house_rules,
          is_active: false, // Start as inactive for review
          is_featured: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting rental:", insertError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: parsedData, 
            saved: false,
            save_error: insertError.message 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Rental saved:", rental.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: parsedData, 
          saved: true,
          rental_id: rental.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error importing Airbnb listing:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Eroare necunoscută" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions to extract data from markdown if JSON extraction fails
function extractTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.substring(2).trim();
    }
  }
  return "";
}

function extractDescriptionFromMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const descLines: string[] = [];
  let started = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes("despre") || line.toLowerCase().includes("about")) {
      started = true;
      continue;
    }
    if (started && line.trim()) {
      if (line.startsWith("#") || line.startsWith("---")) break;
      descLines.push(line);
      if (descLines.length >= 5) break;
    }
  }
  
  return descLines.join(" ").trim();
}

function extractPriceFromMarkdown(markdown: string): number {
  const priceMatch = markdown.match(/(\d+)\s*(€|EUR|RON|USD|\$)/i);
  if (priceMatch) {
    return parseInt(priceMatch[1]);
  }
  return 0;
}

function extractRoomsFromMarkdown(markdown: string): number {
  const roomMatch = markdown.match(/(\d+)\s*(dormitor|bedroom|camera|room)/i);
  if (roomMatch) {
    return parseInt(roomMatch[1]);
  }
  return 1;
}

function extractGuestsFromMarkdown(markdown: string): number {
  const guestMatch = markdown.match(/(\d+)\s*(oaspe|guest|persoan)/i);
  if (guestMatch) {
    return parseInt(guestMatch[1]);
  }
  return 2;
}
