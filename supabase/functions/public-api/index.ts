import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

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
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Validate API key
    await validateApiKey(apiKey || '', supabaseClient);

    console.log('Endpoint requested:', endpoint);

    switch (endpoint) {
      case 'offers': {
        if (req.method === 'GET') {
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
        
        else if (req.method === 'POST') {
          console.log('Creating new offer');
          
          const body = await req.json();
          
          // Validate required fields
          const requiredFields = ['title', 'description', 'location', 'price_min', 'rooms'];
          for (const field of requiredFields) {
            if (!body[field]) {
              throw new Error(`Missing required field: ${field}`);
            }
          }

          // Prepare offer data
          const offerData = {
            title: body.title,
            description: body.description,
            location: body.location,
            price_min: parseInt(body.price_min),
            price_max: body.price_max ? parseInt(body.price_max) : parseInt(body.price_min),
            surface_min: body.surface_min ? parseInt(body.surface_min) : null,
            surface_max: body.surface_max ? parseInt(body.surface_max) : null,
            rooms: parseInt(body.rooms),
            currency: body.currency || 'EUR',
            project_name: body.project_name || null,
            images: body.images || [],
            features: body.features || [],
            amenities: body.amenities || [],
            availability_status: body.availability_status || 'available',
            is_featured: body.is_featured || false,
            contact_info: body.contact_info || null,
            storia_link: body.storia_link || null,
            whatsapp_catalog_id: body.whatsapp_catalog_id || null
          };

          const { data: newOffer, error } = await supabaseClient
            .from('catalog_offers')
            .insert([offerData])
            .select()
            .single();

          if (error) {
            console.error('Error creating offer:', error);
            throw error;
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: newOffer,
              message: 'Offer created successfully'
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              },
              status: 201
            }
          );
        }
        
        else if (req.method === 'PUT') {
          console.log('Updating offer');
          
          const pathParts = url.pathname.split('/');
          const offerId = pathParts[pathParts.length - 1];
          
          if (!offerId || offerId === 'offers') {
            throw new Error('Offer ID is required for PUT requests. Use /offers/{id}');
          }

          const body = await req.json();
          
          // Prepare update data (only include provided fields)
          const updateData: any = {};
          
          if (body.title) updateData.title = body.title;
          if (body.description) updateData.description = body.description;
          if (body.location) updateData.location = body.location;
          if (body.price_min) updateData.price_min = parseInt(body.price_min);
          if (body.price_max) updateData.price_max = parseInt(body.price_max);
          if (body.surface_min) updateData.surface_min = parseInt(body.surface_min);
          if (body.surface_max) updateData.surface_max = parseInt(body.surface_max);
          if (body.rooms) updateData.rooms = parseInt(body.rooms);
          if (body.currency) updateData.currency = body.currency;
          if (body.project_name !== undefined) updateData.project_name = body.project_name;
          if (body.images) updateData.images = body.images;
          if (body.features) updateData.features = body.features;
          if (body.amenities) updateData.amenities = body.amenities;
          if (body.availability_status) updateData.availability_status = body.availability_status;
          if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
          if (body.contact_info !== undefined) updateData.contact_info = body.contact_info;
          if (body.storia_link !== undefined) updateData.storia_link = body.storia_link;
          if (body.whatsapp_catalog_id !== undefined) updateData.whatsapp_catalog_id = body.whatsapp_catalog_id;

          updateData.updated_at = new Date().toISOString();

          const { data: updatedOffer, error } = await supabaseClient
            .from('catalog_offers')
            .update(updateData)
            .eq('id', offerId)
            .select()
            .single();

          if (error) {
            console.error('Error updating offer:', error);
            throw error;
          }

          if (!updatedOffer) {
            throw new Error('Offer not found');
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: updatedOffer,
              message: 'Offer updated successfully'
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        else if (req.method === 'DELETE') {
          console.log('Deleting offer');
          
          const pathParts = url.pathname.split('/');
          const offerId = pathParts[pathParts.length - 1];
          
          if (!offerId || offerId === 'offers') {
            throw new Error('Offer ID is required for DELETE requests. Use /offers/{id}');
          }

          const { error } = await supabaseClient
            .from('catalog_offers')
            .delete()
            .eq('id', offerId);

          if (error) {
            console.error('Error deleting offer:', error);
            throw error;
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Offer deleted successfully'
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        else {
          throw new Error(`Method ${req.method} not allowed for /offers endpoint`);
        }
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
        throw new Error('Invalid endpoint. Available endpoints: GET /offers, POST /offers, PUT /offers/{id}, DELETE /offers/{id}, GET /projects, GET /stats');
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