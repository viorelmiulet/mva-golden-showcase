import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('=== API Keys Manager Function Started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    let body = null;
    
    // If no action is provided and it's a POST request, try to get action from body
    if (!action && req.method === 'POST') {
      body = await req.json();
      action = body.action;
    }
    
    // Default to 'list' if no action is provided for GET requests
    if (!action && req.method === 'GET') {
      action = 'list';
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Action requested:', action);

    switch (action) {
      case 'list': {
        console.log('Listing all API keys');
        
        const { data: apiKeys, error } = await supabaseClient
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching API keys:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: apiKeys
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      case 'create': {
        if (!body && req.method === 'POST') {
          body = await req.json();
        } else if (!body) {
          throw new Error('Create action requires POST method');
        }
        console.log('Creating new API key:', body);
        
        const { key_name, description, expires_at } = body;
        
        if (!key_name) {
          throw new Error('key_name is required');
        }

        // Generate the API key using the database function
        const { data: generatedKey, error: keyError } = await supabaseClient
          .rpc('generate_api_key');

        if (keyError) {
          console.error('Error generating API key:', keyError);
          throw keyError;
        }

        // Insert the new API key
        const { data: newApiKey, error: insertError } = await supabaseClient
          .from('api_keys')
          .insert({
            key_name,
            api_key: generatedKey,
            description,
            expires_at: expires_at || null,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting API key:', insertError);
          throw insertError;
        }

        console.log('API key created successfully:', newApiKey.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: newApiKey
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      case 'toggle': {
        if (!body) {
          body = await req.json();
        }
        console.log('Toggling API key status:', body);
        
        const { id, is_active } = body;
        
        if (!id) {
          throw new Error('API key ID is required');
        }

        const { data: updatedKey, error } = await supabaseClient
          .from('api_keys')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error toggling API key:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: updatedKey
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      case 'delete': {
        if (!body) {
          body = await req.json();
        }
        console.log('Deleting API key:', body);
        
        const { id } = body;
        
        if (!id) {
          throw new Error('API key ID is required');
        }

        const { error } = await supabaseClient
          .from('api_keys')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting API key:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'API key deleted successfully'
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
        throw new Error('Invalid action. Supported actions: list, create, toggle, delete');
      }
    }

  } catch (error: any) {
    console.error('Error in API Keys Manager function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});