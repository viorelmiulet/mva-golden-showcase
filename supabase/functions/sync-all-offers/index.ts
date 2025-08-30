import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sync of all offers from Storia and OLX...');
    
    const results = {
      storia: { success: false, offers: 0, message: '' },
      olx: { success: false, offers: 0, message: '' }
    };

    // Call Storia function
    try {
      console.log('Calling Storia sync function...');
      const storiaResponse = await supabase.functions.invoke('update-storia-offers', {
        body: {}
      });
      
      if (storiaResponse.data) {
        results.storia = {
          success: storiaResponse.data.success || false,
          offers: storiaResponse.data.offers || 0,
          message: storiaResponse.data.message || 'Unknown error'
        };
      }
      
      if (storiaResponse.error) {
        console.error('Storia sync error:', storiaResponse.error);
        results.storia.message = storiaResponse.error.message || 'Function call failed';
      }
    } catch (error) {
      console.error('Error calling Storia function:', error);
      results.storia.message = error.message || 'Function call failed';
    }

    // Call OLX function
    try {
      console.log('Calling OLX sync function...');
      const olxResponse = await supabase.functions.invoke('update-olx-offers', {
        body: {}
      });
      
      if (olxResponse.data) {
        results.olx = {
          success: olxResponse.data.success || false,
          offers: olxResponse.data.offers || 0,
          message: olxResponse.data.message || 'Unknown error'
        };
      }
      
      if (olxResponse.error) {
        console.error('OLX sync error:', olxResponse.error);
        results.olx.message = olxResponse.error.message || 'Function call failed';
      }
    } catch (error) {
      console.error('Error calling OLX function:', error);
      results.olx.message = error.message || 'Function call failed';
    }

    const totalOffers = results.storia.offers + results.olx.offers;
    const bothSucceeded = results.storia.success && results.olx.success;
    const anySucceeded = results.storia.success || results.olx.success;

    console.log('Sync results:', results);

    return new Response(JSON.stringify({
      success: anySucceeded,
      total_offers: totalOffers,
      results: results,
      message: bothSucceeded 
        ? `Successfully synced ${totalOffers} offers from both Storia and OLX`
        : anySucceeded 
        ? `Partially successful: ${totalOffers} offers synced. Check individual results.`
        : 'Failed to sync offers from both sources'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: anySucceeded ? 200 : 500
    });

  } catch (error) {
    console.error('Error in sync-all-offers function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});