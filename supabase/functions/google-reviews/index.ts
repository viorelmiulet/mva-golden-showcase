import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MVA Imobiliare Place ID - extracted from Google Maps
const PLACE_ID = "ChIJK7aEm5L_sUARQvzGxMRXrzQ";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      throw new Error('Google Maps API key not configured');
    }

    console.log('Fetching reviews for Place ID:', PLACE_ID);

    // Fetch place details including reviews
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews&language=ro&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const result = data.result;
    
    // Format reviews for frontend
    const reviews = (result.reviews || []).map((review: any) => ({
      author_name: review.author_name,
      author_photo: review.profile_photo_url,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time: review.relative_time_description,
    }));

    console.log(`Found ${reviews.length} reviews, overall rating: ${result.rating}`);

    return new Response(
      JSON.stringify({
        name: result.name,
        rating: result.rating,
        total_reviews: result.user_ratings_total,
        reviews: reviews,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
