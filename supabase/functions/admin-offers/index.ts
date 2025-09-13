// Admin Offers Edge Function - delete offers with service role
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server misconfiguration: missing Supabase env vars' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const method = req.method;

    console.log('[admin-offers] Incoming request', { method, path: url.pathname });

    const body = method !== 'GET' && method !== 'HEAD' ? await req.json().catch(() => ({})) : {};
    const action = (body?.action || url.searchParams.get('action')) as string | null;

    if (action !== 'delete_offer') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Use action="delete_offer".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const id = (body?.id || url.searchParams.get('id')) as string | null;
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[admin-offers] Deleting offer', { id });

    const { error } = await supabase.from('catalog_offers').delete().eq('id', id);
    if (error) {
      console.error('[admin-offers] Delete error', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Offer deleted successfully', id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-offers] Unexpected error', e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});