import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface ImmofluxWebhookPayload {
  event: 'property.created' | 'property.updated' | 'property.deleted' | 'property.status_changed';
  data: {
    idnum: number;
    idstr?: string;
    titlu?: { ro: string; en?: string } | string;
    descriere?: { ro: string; en?: string } | string;
    pretvanzare?: number | null;
    pretinchiriere?: number | null;
    monedavanzare?: string;
    monedainchiriere?: string;
    devanzare?: number | null;
    nrcamere?: number;
    suprafatautila?: string | number;
    suprafatateren?: string | number;
    etaj?: string;
    localitate?: string;
    judet?: string;
    zona?: string;
    latitudine?: number;
    longitudine?: number;
    images?: Array<{ src: string; pozitie: number }>;
    agent?: number;
    top?: number;
    pole?: number;
    poleposition?: number;
    tiplocuinta?: string;
    nrbai?: number;
    anconstructie?: number;
    status?: string;
    nrbalcoane?: number;
    tipcompartimentare?: string;
    structurarezistenta?: string;
  };
  timestamp?: string;
}

function mapToCatalogOffer(p: ImmofluxWebhookPayload['data']): Record<string, unknown> {
  const title = typeof p.titlu === 'object' ? p.titlu?.ro || `Proprietate #${p.idnum}` : String(p.titlu || `Proprietate #${p.idnum}`);
  const description = typeof p.descriere === 'object' ? p.descriere?.ro || '' : String(p.descriere || '');
  const isSale = p.devanzare === 1;
  const price = isSale ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare);
  const currency = isSale ? (p.monedavanzare || 'EUR') : (p.monedainchiriere || 'EUR');
  const surface = typeof p.suprafatautila === 'string' ? parseFloat(p.suprafatautila) || null : p.suprafatautila;
  const surfaceLand = typeof p.suprafatateren === 'string' ? parseFloat(p.suprafatateren as string) || null : (p.suprafatateren || null);
  const images = (p.images || []).sort((a, b) => a.pozitie - b.pozitie).map(img => img.src);
  const isPole = p.pole === 1 || p.poleposition === 1;
  const isTop = p.top === 1;
  const promotionType = isPole ? 'pole_position' : (isTop ? 'top' : null);

  return {
    external_id: `immoflux-${p.idnum}`,
    crm_source: 'immoflux',
    source: 'immoflux',
    title,
    description,
    price_min: price || 0,
    price_max: price || 0,
    currency,
    rooms: p.nrcamere || 1,
    surface_min: surface,
    surface_max: surface,
    surface_land: surfaceLand ? Math.round(surfaceLand as number) : null,
    images,
    location: p.zona || p.localitate,
    zone: p.zona,
    city: p.localitate,
    floor: typeof p.etaj === 'string' ? parseInt(p.etaj) || null : null,
    bathrooms: p.nrbai || null,
    balconies: p.nrbalcoane || null,
    year_built: p.anconstructie || null,
    transaction_type: isSale ? 'sale' : 'rent',
    is_featured: isTop || isPole,
    promotion_type: promotionType,
    is_published: true,
    property_type: p.tiplocuinta || null,
    compartment: p.tipcompartimentare || null,
    build_materials: p.structurarezistenta || null,
    latitude: p.latitudine || null,
    longitude: p.longitudine || null,
    availability_status: 'available',
    project_id: null,
  };
}

async function getWebhookSecret(supabase: any): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'immoflux_webhook_secret')
      .maybeSingle();
    return data?.value || Deno.env.get('IMMOFLUX_WEBHOOK_SECRET') || null;
  } catch {
    return Deno.env.get('IMMOFLUX_WEBHOOK_SECRET') || null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate webhook secret if configured
    const webhookSecret = await getWebhookSecret(supabase);
    if (webhookSecret) {
      const providedSecret = req.headers.get('x-webhook-secret') || new URL(req.url).searchParams.get('secret');
      if (providedSecret !== webhookSecret) {
        console.error('[immoflux-webhook] Invalid webhook secret');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload: ImmofluxWebhookPayload = await req.json();
    
    if (!payload.event || !payload.data?.idnum) {
      return new Response(JSON.stringify({ error: 'Invalid payload: event and data.idnum required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[immoflux-webhook] Event: ${payload.event}, Property: ${payload.data.idnum}`);

    const externalId = `immoflux-${payload.data.idnum}`;

    if (payload.event === 'property.deleted') {
      const { error } = await supabase
        .from('catalog_offers')
        .update({ availability_status: 'inactive', is_published: false })
        .eq('external_id', externalId);

      if (error) {
        console.error('[immoflux-webhook] Deactivate failed:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, action: 'deactivated', external_id: externalId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For created, updated, status_changed → upsert
    const mapped = mapToCatalogOffer(payload.data);
    const { error, data } = await supabase
      .from('catalog_offers')
      .upsert(mapped, { onConflict: 'external_id', ignoreDuplicates: false })
      .select('id, external_id');

    if (error) {
      // Non-fatal trigger errors
      if (error.message.includes('extensions.net.http_post') || error.message.includes('cross-database references')) {
        console.warn(`[immoflux-webhook] Trigger error (non-fatal): ${error.message}`);
      } else {
        console.error('[immoflux-webhook] Upsert failed:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const result = {
      success: true,
      action: payload.event === 'property.created' ? 'created' : 'updated',
      external_id: externalId,
      id: data?.[0]?.id || null,
      timestamp: new Date().toISOString(),
    };

    console.log(`[immoflux-webhook] Success:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[immoflux-webhook] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
