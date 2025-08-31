import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const immofluxApiKey = Deno.env.get('IMMOFLUX_API_KEY');
    const immofluxApiUser = Deno.env.get('IMMOFLUX_API_USER');

    if (!immofluxApiKey || !immofluxApiUser) {
      throw new Error('Immoflux API credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, propertyId } = await req.json();

    console.log('Immoflux integration called with action:', action);

    switch (action) {
      case 'sync_properties':
        return await syncProperties(supabase, immofluxApiKey, immofluxApiUser);
      
      case 'get_property':
        return await getProperty(supabase, immofluxApiKey, immofluxApiUser, propertyId);
      
      case 'test_connection':
        return await testConnection(immofluxApiKey, immofluxApiUser);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Error in immoflux-integration function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function testConnection(apiKey: string, apiUser: string) {
  try {
    // Test connection to Immoflux API
    // This is a generic approach - adjust URL based on actual Immoflux API documentation
    const testResponse = await fetch('https://api.immoflux.ro/v1/properties', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-User': apiUser,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      throw new Error(`API connection failed: ${testResponse.status} ${testResponse.statusText}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection to Immoflux API successful',
        status: testResponse.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Connection test failed: ${error.message}`,
        suggestion: 'Please verify your API credentials and endpoint URL'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function syncProperties(supabase: any, apiKey: string, apiUser: string) {
  try {
    console.log('Starting property sync from Immoflux...');

    // Fetch properties from Immoflux API
    // Adjust this URL based on actual Immoflux API documentation
    const response = await fetch('https://api.immoflux.ro/v1/properties', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-User': apiUser,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received data from Immoflux:', JSON.stringify(data, null, 2));

    // Transform Immoflux data to match our catalog_offers structure
    const transformedOffers = transformImmofluxData(data);

    if (transformedOffers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found to sync',
          synced: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clear existing Immoflux offers
    await supabase
      .from('catalog_offers')
      .delete()
      .eq('project_name', 'IMMOFLUX_SYNC');

    // Insert new offers
    const { data: insertedData, error: insertError } = await supabase
      .from('catalog_offers')
      .insert(transformedOffers);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`Successfully synced ${transformedOffers.length} properties from Immoflux`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${transformedOffers.length} properties from Immoflux`,
        synced: transformedOffers.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Property sync failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Property sync failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getProperty(supabase: any, apiKey: string, apiUser: string, propertyId: string) {
  try {
    console.log('Fetching property from Immoflux:', propertyId);

    // Fetch specific property from Immoflux API
    const response = await fetch(`https://api.immoflux.ro/v1/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-User': apiUser,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const propertyData = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        property: propertyData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Get property failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Get property failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

function transformImmofluxData(data: any): any[] {
  try {
    // This function transforms Immoflux API response to our catalog_offers format
    // Adjust based on actual Immoflux API response structure
    
    const properties = Array.isArray(data) ? data : data.properties || data.results || [data];
    
    return properties.map((property: any) => ({
      title: property.title || property.name || 'Proprietate Immoflux',
      description: property.description || property.details || '',
      price_min: parseInt(property.price || property.price_min || property.minPrice || 0),
      price_max: parseInt(property.price_max || property.maxPrice || property.price || 0),
      surface_min: parseInt(property.surface || property.area || property.surface_min || 0),
      surface_max: parseInt(property.surface_max || property.maxArea || property.surface || 0),
      rooms: parseInt(property.rooms || property.bedrooms || property.room_count || 1),
      location: property.location || property.address || property.city || 'Locație necunoscută',
      features: Array.isArray(property.features) ? property.features : [],
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      images: property.images ? (Array.isArray(property.images) ? property.images : [property.images]) : [],
      contact_info: property.contact || property.agent || {},
      project_name: 'IMMOFLUX_SYNC',
      currency: property.currency || 'EUR',
      availability_status: property.status || 'available',
      is_featured: property.featured || false,
    }));
    
  } catch (error) {
    console.error('Data transformation failed:', error);
    return [];
  }
}