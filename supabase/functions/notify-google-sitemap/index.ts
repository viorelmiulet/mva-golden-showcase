import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Notifying Google about sitemap update');

    const sitemapUrl = 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/generate-sitemap-index';
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

    // Notify Google Search Console about sitemap update
    const response = await fetch(googlePingUrl, {
      method: 'GET',
    });

    if (response.ok) {
      console.log('Successfully notified Google about sitemap update');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google notified successfully',
          sitemap: sitemapUrl 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      console.error('Failed to notify Google:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to notify Google',
          status: response.status 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Still return 200 as this is not critical
        }
      );
    }

  } catch (error) {
    console.error('Error notifying Google:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 200, // Return 200 as this is not critical for the app
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
