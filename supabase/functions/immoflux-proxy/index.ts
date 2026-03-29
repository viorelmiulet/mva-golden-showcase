import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// DB config helper with env fallback
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  }
  return _supabase;
}

async function getConfig(dbKey: string, envKey: string): Promise<string> {
  try {
    const { data } = await getSupabase()
      .from('site_settings')
      .select('value')
      .eq('key', dbKey)
      .maybeSingle();
    if (data?.value) return data.value;
  } catch {}
  return Deno.env.get(envKey) || '';
}

// Cached config values (refreshed per cold start)
let _authPromise: Promise<string> | null = null;
let _baseUrlPromise: Promise<string> | null = null;

function getBasicAuth(): Promise<string> {
  if (!_authPromise) {
    _authPromise = (async () => {
      const user = await getConfig('integration_immoflux_user', 'IMMOFLUX_USER');
      const pass = await getConfig('integration_immoflux_pass', 'IMMOFLUX_PASS');
      return 'Basic ' + btoa(`${user}:${pass}`);
    })();
  }
  return _authPromise;
}

function getBaseUrl(): Promise<string> {
  if (!_baseUrlPromise) {
    _baseUrlPromise = (async () => {
      let url = (await getConfig('integration_immoflux_base_url', 'IMMOFLUX_BASE_URL') || 'https://web.immoflux.ro').replace(/\/+$/, '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      return url;
    })();
  }
  return _baseUrlPromise;
}

// In-memory cache with TTL
const cache = new Map<string, { data: string; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: string): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  // Evict old entries if cache grows too large
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expires < now) cache.delete(k);
    }
  }
}

async function proxyGet(path: string, useCache = true): Promise<Response> {
  const cacheKey = `GET:${path}`;
  
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[immoflux-proxy] Cache HIT: ${path}`);
      return new Response(cached, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }
  }

  const [baseUrl, auth] = await Promise.all([getBaseUrl(), getBasicAuth()]);
  const url = `${baseUrl}${path}`;
  console.log(`[immoflux-proxy] GET ${url}`);
  const resp = await fetch(url, {
    headers: {
      'Authorization': auth,
      'Accept': 'application/json',
    },
  });
  const body = await resp.text();
  
  if (resp.ok && useCache) {
    setCache(cacheKey, body);
  }

  return new Response(body, {
    status: resp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
}

async function proxyPost(path: string, payload: unknown): Promise<Response> {
  const [baseUrl, auth] = await Promise.all([getBaseUrl(), getBasicAuth()]);
  const url = `${baseUrl}${path}`;
  console.log(`[immoflux-proxy] POST ${url}`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
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
        const [baseUrl, auth] = await Promise.all([getBaseUrl(), getBasicAuth()]);
        const visitUrl = `${baseUrl}/api/sites/v1/visits`;
        console.log(`[immoflux-proxy] POST ${visitUrl}`);
        const resp = await fetch(visitUrl, {
          method: 'POST',
          headers: {
            'Authorization': auth,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
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
