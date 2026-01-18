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

    if (action === 'insert_offer') {
      const offer = body?.offer as Record<string, unknown> | null;
      if (!offer) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required field: offer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Minimal validation for required catalog_offers fields
      const required = ['title','description','location','price_min','price_max','rooms'];
      const missing = required.filter(k => offer[k] === undefined || offer[k] === null || (typeof offer[k] === 'string' && String(offer[k]).trim() === ''));
      if (missing.length > 0) {
        return new Response(
          JSON.stringify({ success: false, error: `Missing required offer fields: ${missing.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Defaults
      if (!('currency' in offer)) offer['currency'] = 'EUR';
      if (!('availability_status' in offer)) offer['availability_status'] = 'available';
      if (!('source' in offer)) offer['source'] = 'manual';
      if (!('images' in offer)) offer['images'] = [];
      if (!('features' in offer)) offer['features'] = [];
      if (!('amenities' in offer)) offer['amenities'] = [];
      if (!('is_published' in offer)) offer['is_published'] = true;

      console.log('[admin-offers] Inserting offer');
      const { data, error } = await supabase.from('catalog_offers').insert(offer).select('id').maybeSingle();
      if (error) {
        console.error('[admin-offers] Insert error', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Offer inserted successfully', id: data?.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_offer') {
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
    }

    if (action === 'update_offer') {
      const id = body?.id as string | null;
      const data = body?.data as Record<string, unknown> | null;
      
      if (!id || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: id, data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[admin-offers] Updating offer', { id });

      const { error } = await supabase
        .from('catalog_offers')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('[admin-offers] Update error', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Offer updated successfully', id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_status') {
      const id = (body?.id || url.searchParams.get('id')) as string | null;
      const status = (body?.availability_status || url.searchParams.get('availability_status')) as string | null;

      if (!id || !status) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: id, availability_status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const allowed = ['available', 'reserved', 'sold'];
      if (!allowed.includes(status)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid availability_status. Use available | reserved | sold.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[admin-offers] Update status', { id, status });

      const { error } = await supabase
        .from('catalog_offers')
        .update({ availability_status: status })
        .eq('id', id);

      if (error) {
        console.error('[admin-offers] Update status error', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Status updated successfully', id, availability_status: status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use action="delete_offer" | "insert_offer" | "update_offer" | "update_status".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-offers] Unexpected error', e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});