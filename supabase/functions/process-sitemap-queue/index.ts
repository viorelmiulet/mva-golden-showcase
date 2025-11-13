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
    console.log('[process-sitemap-queue] Starting background processing');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Start background task without awaiting
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          console.log('[process-sitemap-queue] Fetching pending notifications');
          
          // Get all pending notifications
          const { data: notifications, error: fetchError } = await supabase
            .from('sitemap_notifications')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);

          if (fetchError) {
            console.error('[process-sitemap-queue] Fetch error:', fetchError);
            return;
          }

          if (!notifications || notifications.length === 0) {
            console.log('[process-sitemap-queue] No notifications to process');
            return;
          }

          console.log(`[process-sitemap-queue] Processing ${notifications.length} notifications`);

          // Call notify-google-sitemap function
          const { data: notifyResult, error: notifyError } = await supabase.functions.invoke(
            'notify-google-sitemap',
            { body: {} }
          );

          if (notifyError) {
            console.error('[process-sitemap-queue] Notify error:', notifyError);
          } else {
            console.log('[process-sitemap-queue] Successfully notified Google:', notifyResult);
          }

          // Delete processed notifications
          const notificationIds = notifications.map(n => n.id);
          const { error: deleteError } = await supabase
            .from('sitemap_notifications')
            .delete()
            .in('id', notificationIds);

          if (deleteError) {
            console.error('[process-sitemap-queue] Delete error:', deleteError);
          } else {
            console.log(`[process-sitemap-queue] Deleted ${notificationIds.length} processed notifications`);
          }

        } catch (error) {
          console.error('[process-sitemap-queue] Background task error:', error);
        }
      })()
    );

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Sitemap queue processing started in background'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[process-sitemap-queue] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
