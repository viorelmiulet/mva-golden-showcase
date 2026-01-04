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
    const { booking_url, import_to_rentals } = await req.json();

    if (!booking_url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL Booking.com necesar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Booking.com URL
    if (!booking_url.includes("booking.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "URL-ul trebuie să fie de pe Booking.com" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Perplexity AI nu este configurat" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting Booking.com listing info using Perplexity:", booking_url);

    // Use Perplexity AI to search for information about the Booking.com listing
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting property information from Booking.com listings. 
            Extract detailed property information and return it ONLY as a valid JSON object with these exact fields:
            {
              "title": "property title/name",
              "description": "full description",
              "location": "city and neighborhood",
              "address": "full address if available",
              "price_per_night": number (just the number, no currency),
              "currency": "EUR or USD or RON",
              "rooms": number of bedrooms,
              "bathrooms": number of bathrooms,
              "max_guests": maximum guests,
              "amenities": ["array", "of", "amenities"],
              "images": ["array", "of", "image", "urls"],
              "check_in_time": "15:00",
              "check_out_time": "11:00",
              "house_rules": "any rules mentioned",
              "rating": number or null (e.g. 8.5),
              "reviews_count": number or null,
              "property_type": "apartment/house/studio/hotel",
              "surface": number in sqm or null,
              "breakfast_included": boolean,
              "free_cancellation": boolean,
              "free_wifi": boolean,
              "parking": boolean or "paid" or "free"
            }
            Return ONLY the JSON object, no other text.`
          },
          {
            role: "user",
            content: `Please find and extract all available information about this Booking.com listing: ${booking_url}
            
            Search for details like the property name, description, location, price, number of rooms, amenities, rating, and any other relevant information.
            Return the data as a JSON object.`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error("Perplexity API error:", perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Eroare Perplexity: ${perplexityResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    console.log("Perplexity response received");

    const aiContent = perplexityData.choices?.[0]?.message?.content || "";
    const citations = perplexityData.citations || [];

    console.log("AI content:", aiContent);

    // Try to parse the JSON from the response
    let extractedData: any = {};
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      // Try to extract basic info from text
      extractedData = extractBasicInfoFromText(aiContent, booking_url);
    }

    // Build amenities array from extracted data
    const amenities: string[] = Array.isArray(extractedData.amenities) ? extractedData.amenities : [];
    if (extractedData.free_wifi) amenities.push("WiFi gratuit");
    if (extractedData.breakfast_included) amenities.push("Mic dejun inclus");
    if (extractedData.free_cancellation) amenities.push("Anulare gratuită");
    if (extractedData.parking === true || extractedData.parking === "free") amenities.push("Parcare gratuită");
    if (extractedData.parking === "paid") amenities.push("Parcare cu plată");

    // Build the final data object with defaults
    const parsedData = {
      title: extractedData.title || `Proprietate Booking.com`,
      description: extractedData.description || aiContent.substring(0, 500),
      location: extractedData.location || "",
      address: extractedData.address || "",
      price_per_night: parseFloat(extractedData.price_per_night) || 0,
      currency: extractedData.currency || "EUR",
      rooms: parseInt(extractedData.rooms) || 1,
      bathrooms: parseInt(extractedData.bathrooms) || 1,
      max_guests: parseInt(extractedData.max_guests) || 2,
      amenities: [...new Set(amenities)], // Remove duplicates
      images: Array.isArray(extractedData.images) ? extractedData.images : [],
      check_in_time: extractedData.check_in_time || "15:00",
      check_out_time: extractedData.check_out_time || "11:00",
      house_rules: extractedData.house_rules || "",
      rating: parseFloat(extractedData.rating) || null,
      reviews_count: parseInt(extractedData.reviews_count) || null,
      property_type: extractedData.property_type || "apartament",
      surface: parseFloat(extractedData.surface) || null,
      breakfast_included: extractedData.breakfast_included || false,
      free_cancellation: extractedData.free_cancellation || false,
      source_url: booking_url,
      citations: citations,
      ai_summary: aiContent,
    };

    // If import_to_rentals is true, save to short_term_rentals table
    if (import_to_rentals) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: rental, error: insertError } = await supabase
        .from("short_term_rentals")
        .insert({
          title: parsedData.title || "Proprietate Booking.com",
          description: parsedData.description,
          location: parsedData.location,
          address: parsedData.address,
          rooms: parsedData.rooms || 1,
          bathrooms: parsedData.bathrooms || 1,
          max_guests: parsedData.max_guests || 2,
          surface: parsedData.surface,
          base_price: parsedData.price_per_night || 0,
          currency: parsedData.currency,
          amenities: parsedData.amenities,
          images: parsedData.images,
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
    console.error("Error importing Booking.com listing:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Eroare necunoscută" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract basic info from unstructured text
function extractBasicInfoFromText(text: string, url: string): any {
  const data: any = {};
  
  // Try to extract title (usually the first sentence or heading)
  const titleMatch = text.match(/^([^.\n]+)/);
  if (titleMatch) {
    data.title = titleMatch[1].trim().substring(0, 100);
  }
  
  // Try to extract price
  const priceMatch = text.match(/(\d+)\s*(€|EUR|RON|USD|\$|lei)/i);
  if (priceMatch) {
    data.price_per_night = parseInt(priceMatch[1]);
    if (priceMatch[2].includes("€") || priceMatch[2].toUpperCase() === "EUR") {
      data.currency = "EUR";
    } else if (priceMatch[2].includes("$") || priceMatch[2].toUpperCase() === "USD") {
      data.currency = "USD";
    } else {
      data.currency = "RON";
    }
  }
  
  // Try to extract rating (Booking uses X.X format like 8.5)
  const ratingMatch = text.match(/(\d+[.,]\d)\s*\/\s*10|rating[:\s]*(\d+[.,]\d)/i);
  if (ratingMatch) {
    data.rating = parseFloat((ratingMatch[1] || ratingMatch[2]).replace(",", "."));
  }
  
  // Try to extract rooms
  const roomMatch = text.match(/(\d+)\s*(dormitor|bedroom|camer[aă]|room)/i);
  if (roomMatch) {
    data.rooms = parseInt(roomMatch[1]);
  }
  
  // Try to extract guests
  const guestMatch = text.match(/(\d+)\s*(oaspe|guest|persoan[aă])/i);
  if (guestMatch) {
    data.max_guests = parseInt(guestMatch[1]);
  }
  
  // Try to extract location from common patterns
  const locationMatch = text.match(/(București|Bucharest|Cluj|Timișoara|Iași|Brașov|Constanța|Sibiu|Chiajna|Militari)/i);
  if (locationMatch) {
    data.location = locationMatch[1];
  }
  
  // Check for common amenities
  data.free_wifi = /wifi|wi-fi/i.test(text);
  data.breakfast_included = /mic dejun|breakfast/i.test(text);
  data.free_cancellation = /anulare gratuit[aă]|free cancellation/i.test(text);
  data.parking = /parcare|parking/i.test(text);
  
  // Use the full text as description
  data.description = text.substring(0, 1000);
  
  return data;
}
