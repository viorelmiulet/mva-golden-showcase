import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check if a string looks like GPS coordinates
function isCoordinates(str: string): boolean {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str.trim());
}

// Reverse geocode coordinates to zone name using Google Maps API
async function getZoneFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not set, skipping geocoding');
      return '';
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ro&result_type=sublocality|neighborhood|locality&key=${googleApiKey}`
    );
    
    if (!response.ok) {
      console.warn(`Google Geocoding returned ${response.status} for ${lat},${lng}`);
      return '';
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results?.length) {
      console.warn(`No results for ${lat},${lng}: ${data.status}`);
      return '';
    }
    
    // Extract neighborhood/sublocality from address components
    for (const result of data.results) {
      for (const component of result.address_components || []) {
        const types = component.types || [];
        if (types.includes('sublocality') || types.includes('sublocality_level_1') || 
            types.includes('neighborhood') || types.includes('route')) {
          const zone = component.long_name;
          console.log(`Geocoded ${lat},${lng} → "${zone}"`);
          return zone;
        }
      }
    }
    
    // Fallback: use first result's formatted address locality part
    const firstResult = data.results[0];
    for (const component of firstResult.address_components || []) {
      if (component.types?.includes('locality')) {
        return component.long_name;
      }
    }
    
    return '';
  } catch (error) {
    console.error(`Geocoding error for ${lat},${lng}:`, error);
    return '';
  }
}

// Rate-limit delay (Nominatim requires 1 req/sec)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const limit = body.limit || 50; // Process in batches to avoid timeout

    console.log(`Fix property zones — dry_run: ${dryRun}, limit: ${limit}`);

    // Fetch properties with GPS coordinates in location field and no proper zone
    const { data: properties, error } = await supabase
      .from('catalog_offers')
      .select('id, zone, location, latitude, longitude, project_name')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .or('zone.is.null,zone.eq.')
      .limit(limit);

    if (error) throw error;

    // Also find properties where location contains coordinates
    const propsWithCoordLocation = (properties || []).filter(
      p => !p.zone && p.latitude && p.longitude && (!p.location || isCoordinates(p.location))
    );

    console.log(`Found ${propsWithCoordLocation.length} properties needing zone fix`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Found ${propsWithCoordLocation.length} properties with GPS coordinates needing zone names`,
          count: propsWithCoordLocation.length,
          sample: propsWithCoordLocation.slice(0, 5).map(p => ({
            id: p.id,
            location: p.location,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let fixed = 0;
    let failed = 0;

    for (const prop of propsWithCoordLocation) {
      try {
        const zone = await getZoneFromCoordinates(prop.latitude, prop.longitude);
        
        if (zone) {
          const updateData: any = { zone };
          
          // Also fix location if it contains coordinates
          if (prop.location && isCoordinates(prop.location)) {
            updateData.location = zone;
          }

          const { error: updateError } = await supabase
            .from('catalog_offers')
            .update(updateData)
            .eq('id', prop.id);

          if (updateError) {
            console.error(`Failed to update ${prop.id}:`, updateError.message);
            failed++;
          } else {
            fixed++;
            console.log(`✓ Fixed ${prop.id}: zone = "${zone}"`);
          }
        } else {
          console.log(`✗ No zone found for ${prop.id} (${prop.latitude}, ${prop.longitude})`);
          failed++;
        }

        // Respect Nominatim rate limit: 1 request per second
        await delay(1100);
      } catch (err) {
        console.error(`Error processing ${prop.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Zone fix completed: ${fixed} fixed, ${failed} failed out of ${propsWithCoordLocation.length}`,
        fixed,
        failed,
        total: propsWithCoordLocation.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Fix property zones error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
