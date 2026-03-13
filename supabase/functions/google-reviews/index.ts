import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for cached reviews (less than 24h old)
    const { data: cached } = await supabase
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', 'google_reviews_cache')
      .single();

    if (cached?.value) {
      const updatedAt = new Date(cached.updated_at).getTime();
      const now = Date.now();
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

      // If cache is fresh (less than 23 hours), return it
      if (hoursSinceUpdate < 23) {
        return new Response(cached.value, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Fetch fresh reviews from Google
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placeId = 'ChIJ0z61LKEBskARIoiIxFyR1rY';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&language=ro&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      // If we have stale cache, return it as fallback
      if (cached?.value) {
        return new Response(cached.value, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({ error: data.error_message || data.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      reviews: data.result?.reviews || [],
      rating: data.result?.rating || 0,
      totalReviews: data.result?.user_ratings_total || 0,
      name: data.result?.name || 'MVA Imobiliare',
    };

    const resultJson = JSON.stringify(result);

    // Cache the result in site_settings
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'google_reviews_cache', value: resultJson, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (upsertError) {
      console.error('Error caching reviews:', upsertError);
    }

    return new Response(resultJson, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch reviews' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
