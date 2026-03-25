import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function getBasicAuth(): string {
  const user = Deno.env.get('IMMOFLUX_USER') || '';
  const pass = Deno.env.get('IMMOFLUX_PASS') || '';
  return 'Basic ' + btoa(`${user}:${pass}`);
}

function getBaseUrl(): string {
  let url = (Deno.env.get('IMMOFLUX_BASE_URL') || 'https://web.immoflux.ro').replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

async function proxyGet(path: string): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  console.log(`[immoflux-proxy] GET ${url}`);
  const resp = await fetch(url, {
    headers: {
      'Authorization': getBasicAuth(),
      'Accept': 'application/json',
    },
  });
  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function proxyPost(path: string, payload: unknown): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  console.log(`[immoflux-proxy] POST ${url}`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuth(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Edge function is mounted at /immoflux-proxy, so strip that prefix
    // pathParts after stripping: e.g. ["properties"], ["properties","123"], ["agents"], ["webhook"], ["contact"], ["visit"]
    const subPath = pathParts.slice(pathParts.indexOf('immoflux-proxy') + 1);
    const action = subPath[0] || '';

    // GET /immoflux-proxy/properties?page=1
    if (req.method === 'GET' && action === 'properties') {
      const propertyId = subPath[1];
      if (propertyId) {
        return await proxyGet(`/api/sites/v1/properties/${propertyId}`);
      }
      const page = url.searchParams.get('page') || '1';
      return await proxyGet(`/api/sites/v1/properties?page=${page}`);
    }

    // GET /immoflux-proxy/agents
    if (req.method === 'GET' && action === 'agents') {
      return await proxyGet('/api/sites/v1/agents');
    }

    // POST /immoflux-proxy/webhook
    if (req.method === 'POST' && action === 'webhook') {
      const body = await req.json();
      console.log('[immoflux-proxy] Webhook received:', JSON.stringify(body));
      // Process webhook notification – for now just acknowledge
      return new Response(JSON.stringify({ success: true, message: 'Webhook received' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /immoflux-proxy/contact
    if (req.method === 'POST' && action === 'contact') {
      const body = await req.json();
      return await proxyPost('/api/sites/v1/contacts', body);
    }

    // POST /immoflux-proxy/visit
    if (req.method === 'POST' && action === 'visit') {
      try {
        const body = await req.json();
        const visitUrl = `${getBaseUrl()}/api/sites/v1/visits`;
        console.log(`[immoflux-proxy] POST ${visitUrl}`);
        const resp = await fetch(visitUrl, {
          method: 'POST',
          headers: {
            'Authorization': getBasicAuth(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        // Always return success - visit tracking is best-effort
        if (!resp.ok) {
          console.log(`[immoflux-proxy] Visit endpoint returned ${resp.status}, ignoring`);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.log('[immoflux-proxy] Visit tracking failed, ignoring:', e);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[immoflux-proxy] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
