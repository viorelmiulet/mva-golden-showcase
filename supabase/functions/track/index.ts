import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { type, session_id, page_path, page_title, referrer, utm_source, utm_medium, device_type, browser, event_type, event_data, duration_seconds } = body;

    if (!session_id || !page_path) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'pageview') {
      const { error } = await supabase.from('page_views').insert({
        session_id,
        page_path,
        page_title: page_title || '',
        referrer: referrer || '',
        utm_source: utm_source || '',
        utm_medium: utm_medium || '',
        device_type: device_type || 'desktop',
        browser: browser || 'Other',
      });
      if (error) throw error;
    } else if (type === 'event') {
      const { error } = await supabase.from('events').insert({
        session_id,
        event_type: event_type || 'unknown',
        event_data: event_data || {},
        page_path,
      });
      if (error) throw error;
    } else if (type === 'duration') {
      // Update the last pageview for this session+path with duration
      const { error } = await supabase
        .from('page_views')
        .update({ duration_seconds: duration_seconds || 0 })
        .eq('session_id', session_id)
        .eq('page_path', page_path)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Track error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
