import { supabase } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

async function validateApiKey(apiKey: string, supabaseClient: any) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  console.log('Validating API key:', apiKey.substring(0, 8) + '...');
  
  const { data: keyData, error } = await supabaseClient
    .from('api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !keyData) {
    console.error('Invalid API key:', error);
    throw new Error('Invalid or inactive API key');
  }

  // Check if key is expired
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    console.error('API key expired:', keyData.expires_at);
    throw new Error('API key has expired');
  }

  // Update usage statistics
  await supabaseClient
    .from('api_keys')
    .update({ 
      usage_count: (keyData.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', keyData.id);

  console.log('API key validated successfully');
  return keyData;
}

Deno.serve(async (req) => {
  console.log('=== Public API Function Started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const apiKey = req.headers.get('x-api-key');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = supabase(supabaseUrl, supabaseServiceRoleKey);

    // Validate API key
    await validateApiKey(apiKey || '', supabaseClient);

    console.log('Endpoint requested:', endpoint);

    switch (endpoint) {
      case 'offers': {
        console.log('Fetching catalog offers');
        
        // Get query parameters
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const location = url.searchParams.get('location');
        const minPrice = url.searchParams.get('min_price');
        const maxPrice = url.searchParams.get('max_price');
        const rooms = url.searchParams.get('rooms');
        const featured = url.searchParams.get('featured');

        let query = supabaseClient
          .from('catalog_offers')
          .select('*')
          .eq('availability_status', 'available');

        // Apply filters
        if (location) {
          query = query.ilike('location', `%${location}%`);
        }
        if (minPrice) {
          query = query.gte('price_min', parseInt(minPrice));
        }
        if (maxPrice) {
          query = query.lte('price_max', parseInt(maxPrice));
        }
        if (rooms) {
          query = query.eq('rooms', parseInt(rooms));
        }
        if (featured === 'true') {
          query = query.eq('is_featured', true);
        }

        // Apply pagination and ordering
        query = query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        const { data: offers, error } = await query;

        if (error) {
          console.error('Error fetching offers:', error);
          throw error;
        }

        // Get total count for pagination info
        const { count } = await supabaseClient
          .from('catalog_offers')
          .select('*', { count: 'exact', head: true })
          .eq('availability_status', 'available');

        return new Response(
          JSON.stringify({
            success: true,
            data: offers,
            pagination: {
              total: count || 0,
              limit,
              offset,
              has_more: (offset + limit) < (count || 0)
            }
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      case 'projects': {
        console.log('Fetching real estate projects');
        
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const location = url.searchParams.get('location');
        const status = url.searchParams.get('status') || 'available';

        let query = supabaseClient
          .from('real_estate_projects')
          .select('*')
          .eq('status', status);

        if (location) {
          query = query.ilike('location', `%${location}%`);
        }

        query = query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        const { data: projects, error } = await query;

        if (error) {
          console.error('Error fetching projects:', error);
          throw error;
        }

        const { count } = await supabaseClient
          .from('real_estate_projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        return new Response(
          JSON.stringify({
            success: true,
            data: projects,
            pagination: {
              total: count || 0,
              limit,
              offset,
              has_more: (offset + limit) < (count || 0)
            }
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      case 'stats': {
        console.log('Fetching statistics');
        
        // Get basic statistics
        const { data: offersCount } = await supabaseClient
          .from('catalog_offers')
          .select('*', { count: 'exact', head: true })
          .eq('availability_status', 'available');

        const { data: projectsCount } = await supabaseClient
          .from('real_estate_projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        const { data: featuredOffers } = await supabaseClient
          .from('catalog_offers')
          .select('*', { count: 'exact', head: true })
          .eq('is_featured', true)
          .eq('availability_status', 'available');

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              total_offers: offersCount?.length || 0,
              total_projects: projectsCount?.length || 0,
              featured_offers: featuredOffers?.length || 0,
              generated_at: new Date().toISOString()
            }
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      default: {
        throw new Error('Invalid endpoint. Available endpoints: /offers, /projects, /stats');
      }
    }

  } catch (error) {
    console.error('Error in Public API function:', error);
    
    const status = error.message.includes('API key') ? 401 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status 
      }
    );
  }
});