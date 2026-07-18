import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Drop street-derived zones (see sync-immoflux for full explanation).
const OTHER_RO_CITIES = new Set([
  'cluj','cluj-napoca','constanta','iasi','brasov','sibiu',
  'craiova','galati','ploiesti','oradea','arad','pitesti','bacau','buzau',
  'targu-mures','baia-mare','satu-mare','braila','suceava','ramnicu-valcea',
  'targoviste','focsani','tulcea','deva','alba-iulia'
]);
// See sync-immoflux for full explanation.
const BUCHAREST_NEIGHBORHOODS = new Set([
  'berceni','pantelimon','colentina','titan','rahova','dorobanti','aviatorilor',
  'iancului','timisoara','ghencea','militari','giulesti','crangasi','vitan',
  'dristor','obor','unirii','floreasca','baneasa','pipera','aviatiei',
  'drumul taberei','lujerului','grozavesti','politehnica','cotroceni','domenii',
  'victoriei','romana','universitate','tineretului','giurgiului','sebastian',
  'orizont','13 septembrie','bucurestii noi','aparatorii patriei',
  'eroii revolutiei','metalurgiei','valea cascadelor','prelungirea ghencea'
]);
function normalizeRo(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/\s+/g, ' ')
    .trim();
}
function sanitizeZone(rawZone: any, city: any, address: any): string | null {
  if (!rawZone) return null;
  const z = String(rawZone).trim();
  if (!z) return null;
  const zNorm = normalizeRo(z);
  const cityNorm = city ? normalizeRo(String(city)) : '';
  const isBucharest = cityNorm.startsWith('bucur');
  if (isBucharest && BUCHAREST_NEIGHBORHOODS.has(zNorm)) return z;
  if (isBucharest && OTHER_RO_CITIES.has(zNorm.replace(/\s+/g, '-'))) return null;
  if (address) {
    const aNorm = normalizeRo(String(address));
    const embedded = new RegExp(`(^|\\W)(bd\\.?|b-dul|bulevardul|str\\.?|strada|sos\\.?|soseaua|calea|aleea|intrarea|splaiul)\\s+${zNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(aNorm);
    if (embedded) return null;
  }
  return z;
}

interface ImmofluxWebhookPayload {
  event: 'property.created' | 'property.updated' | 'property.deleted' | 'property.status_changed';
  data: {
    idnum: number;
    idstr?: string;
    titlu?: { ro: string; en?: string } | string;
    descriere?: { ro: string; en?: string } | string;
    vecinatati?: { ro: string; en?: string } | string;
    opinieagent?: { ro: string; en?: string } | string;
    utilitati?: string;
    finisaje?: string;
    dotari?: string;
    altedetaliizona?: string;
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

function localized(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return (v as any).ro || (v as any).en || '';
  return String(v);
}

function buildImmofluxSlug(p: ImmofluxWebhookPayload['data'], surface: number | null, floorLabel: string | null): string {
  const parts: string[] = [];
  const rooms = p.nrcamere || 1;
  parts.push(rooms <= 1 ? 'garsoniera' : `apartament-${rooms}-camere`);
  if (surface && surface > 0) parts.push(`${surface}mp`);
  if (floorLabel) {
    if (/parter|demisol/i.test(floorLabel)) parts.push('parter');
    else {
      const m = floorLabel.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (Number.isFinite(n) && n >= 0) parts.push(n === 0 ? 'parter' : `etaj-${n}`);
      }
    }
  }
  const slugify = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  if (p.zona) {
    const z = slugify(p.zona.split(',')[0].trim());
    if (z && z.length > 2 && !parts.some(x => x.includes(z))) parts.push(z);
  }
  if (p.localitate) {
    const c = slugify(p.localitate.split(',')[0].trim());
    if (c && c.length > 2 && !parts.some(x => x.includes(c))) parts.push(c);
  }
  if (p.idnum !== undefined && p.idnum !== null) parts.push(String(p.idnum));
  return parts.join('-');
}

function mapToCatalogOffer(p: ImmofluxWebhookPayload['data']): Record<string, unknown> {
  const title = typeof p.titlu === 'object' ? p.titlu?.ro || `Proprietate #${p.idnum}` : String(p.titlu || `Proprietate #${p.idnum}`);
  const description = typeof p.descriere === 'object' ? p.descriere?.ro || '' : String(p.descriere || '');
  const vecin = localized(p.vecinatati);
  const opinieAgent = localized(p.opinieagent);
  const extraSections: Record<string, string> = {};
  if (p.utilitati) extraSections.utilitati = p.utilitati;
  if (p.finisaje) extraSections.finisaje = p.finisaje;
  if (p.dotari) extraSections.dotari = p.dotari;
  if (vecin) extraSections.vecinatati = vecin;
  if (opinieAgent) extraSections.opinieagent = opinieAgent;
  if (p.altedetaliizona) extraSections.altedetaliizona = p.altedetaliizona;

  const isSale = p.devanzare === 1;
  const price = isSale ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare);
  const currency = isSale ? (p.monedavanzare || 'EUR') : (p.monedainchiriere || 'EUR');
  const surfaceRaw = typeof p.suprafatautila === 'string' ? parseFloat(p.suprafatautila) : p.suprafatautila;
  const surface = Number.isFinite(surfaceRaw as number) ? Math.round(surfaceRaw as number) : null;
  const surfaceLand = typeof p.suprafatateren === 'string' ? parseFloat(p.suprafatateren as string) || null : (p.suprafatateren || null);
  const images = (p.images || []).sort((a, b) => a.pozitie - b.pozitie).map(img => img.src);
  const isPole = p.pole === 1 || p.poleposition === 1;
  const isTop = p.top === 1;
  const promotionType = isPole ? 'pole_position' : (isTop ? 'top' : null);

  const floorLabel = p.etaj ? String(p.etaj).trim() : null;
  const floorInt = typeof p.etaj === 'string' ? (parseInt(p.etaj) || (/parter/i.test(p.etaj) ? 0 : null)) : null;

  return {
    external_id: `immoflux-${p.idnum}`,
    crm_source: 'immoflux',
    source: 'immoflux',
    title,
    description,
    extra_sections: Object.keys(extraSections).length ? extraSections : null,
    immoflux_slug: buildImmofluxSlug(p, surface, floorLabel),
    price_min: price || 0,
    price_max: price || 0,
    currency,
    rooms: p.nrcamere || 1,
    surface_min: surface,
    surface_max: surface,
    surface_land: surfaceLand ? Math.round(surfaceLand as number) : null,
    images,
    location: p.zona || p.localitate,
    zone: sanitizeZone(p.zona, p.localitate, (p as any).adresa),
    city: p.localitate,
    floor: floorInt,
    floor_label: floorLabel,
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
      // Mark as sold (keep visible + link valid for SEO) instead of deactivating
      const { error } = await supabase
        .from('catalog_offers')
        .update({ availability_status: 'sold', is_published: true })
        .eq('external_id', externalId);

      if (error) {
        console.error('[immoflux-webhook] Mark as sold failed:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, action: 'marked_sold', external_id: externalId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Withdrawn / retras / inactive status → hard-delete, do not upsert.
    const rawStatus = (payload.data.status || '').toString().toLowerCase().trim();
    const isWithdrawn = rawStatus.includes('retras')
      || rawStatus.includes('inactiv')
      || rawStatus.includes('inactive')
      || rawStatus.includes('unavailable')
      || rawStatus.includes('indisponibil')
      || rawStatus.includes('expirat')
      || rawStatus.includes('expired');

    if (isWithdrawn) {
      const { error: delErr } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('external_id', externalId);
      if (delErr) {
        console.error('[immoflux-webhook] Delete withdrawn failed:', delErr.message);
        return new Response(JSON.stringify({ success: false, error: delErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, action: 'deleted_withdrawn', external_id: externalId }), {
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
