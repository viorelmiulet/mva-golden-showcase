import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getConfigFromDb(supabase: any, key: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    return data?.value || null;
  } catch { return null; }
}

async function getBasicAuthFromDb(supabase: any): Promise<string> {
  const user = await getConfigFromDb(supabase, 'integration_immoflux_user') || Deno.env.get('IMMOFLUX_USER') || '';
  const pass = await getConfigFromDb(supabase, 'integration_immoflux_pass') || Deno.env.get('IMMOFLUX_PASS') || '';
  return 'Basic ' + btoa(`${user}:${pass}`);
}

async function getBaseUrlFromDb(supabase: any): Promise<string> {
  let url = (await getConfigFromDb(supabase, 'integration_immoflux_base_url') || Deno.env.get('IMMOFLUX_BASE_URL') || 'https://web.immoflux.ro').replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  return url;
}

function getBasicAuth(): string {
  const user = Deno.env.get('IMMOFLUX_USER') || '';
  const pass = Deno.env.get('IMMOFLUX_PASS') || '';
  return 'Basic ' + btoa(`${user}:${pass}`);
}

function getBaseUrl(): string {
  let url = (Deno.env.get('IMMOFLUX_BASE_URL') || 'https://web.immoflux.ro').replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  return url;
}

interface ImmofluxProperty {
  idnum: number;
  idstr: string;
  titlu: { ro: string; en?: string } | string;
  descriere: { ro: string; en?: string } | string;
  pretvanzare: number | null;
  pretinchiriere: number | null;
  monedavanzare: string;
  monedainchiriere?: string;
  devanzare: number | null;
  nrcamere: number;
  suprafatautila: string | number;
  suprafatateren?: string | number;
  etaj: string;
  localitate: string;
  judet: string;
  zona: string;
  latitudine: number;
  longitudine: number;
  images: Array<{ src: string; pozitie: number }>;
  agent: number;
  top: number;
  pole?: number;
  poleposition?: number;
  tiplocuinta: string;
  nrbai: number;
  anconstructie: number;
  status: string;
  nrbalcoane?: number;
  tipcompartimentare?: string;
  structurarezistenta?: string;
}

async function fetchAllProperties(): Promise<ImmofluxProperty[]> {
  const baseUrl = getBaseUrl();
  const auth = getBasicAuth();
  const headers = { 'Authorization': auth, 'Accept': 'application/json' };

  // First page
  const firstRes = await fetch(`${baseUrl}/api/sites/v1/properties?page=1`, { headers });
  if (!firstRes.ok) throw new Error(`IMMOFLUX API error: ${firstRes.status}`);
  const firstData = await firstRes.json();
  const allProps: ImmofluxProperty[] = [...(firstData.data || [])];
  const lastPage = firstData.last_page || 1;

  console.log(`[sync-immoflux] Total pages: ${lastPage}, total: ${firstData.total}`);

  // Fetch remaining pages in parallel batches of 5
  for (let batchStart = 2; batchStart <= lastPage; batchStart += 5) {
    const batchEnd = Math.min(batchStart + 4, lastPage);
    const promises = [];
    for (let p = batchStart; p <= batchEnd; p++) {
      promises.push(
        fetch(`${baseUrl}/api/sites/v1/properties?page=${p}`, { headers })
          .then(r => r.ok ? r.json() : { data: [] })
      );
    }
    const results = await Promise.all(promises);
    results.forEach(r => allProps.push(...(r.data || [])));
  }

  console.log(`[sync-immoflux] Fetched ${allProps.length} properties total`);
  return allProps;
}

function mapToCatalogOffer(p: ImmofluxProperty): Record<string, unknown> {
  const title = typeof p.titlu === 'object' ? p.titlu?.ro || `Proprietate #${p.idnum}` : String(p.titlu || `Proprietate #${p.idnum}`);
  const description = typeof p.descriere === 'object' ? p.descriere?.ro || '' : String(p.descriere || '');
  const isSale = p.devanzare === 1;
  const price = isSale ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare);
  const currency = isSale ? (p.monedavanzare || 'EUR') : (p.monedainchiriere || 'EUR');
  const surface = typeof p.suprafatautila === 'string' ? parseFloat(p.suprafatautila) || null : p.suprafatautila;
  const surfaceLand = typeof p.suprafatateren === 'string' ? parseFloat(p.suprafatateren as string) || null : (p.suprafatateren || null);
  const images = (p.images || []).sort((a, b) => a.pozitie - b.pozitie).map(img => img.src);
  const isPole = p.pole === 1 || p.poleposition === 1;

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
    is_featured: p.top === 1 || isPole,
    is_published: true,
    property_type: p.tiplocuinta || null,
    compartment: p.tipcompartimentare || null,
    build_materials: p.structurarezistenta || null,
    latitude: p.latitudine || null,
    longitude: p.longitudine || null,
    availability_status: 'available',
    // No project_id so it shows in public listing
    project_id: null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('[sync-immoflux] Starting sync...');
    const properties = await fetchAllProperties();

    const mapped = properties.map(mapToCatalogOffer);
    console.log(`[sync-immoflux] Mapped ${mapped.length} properties for upsert`);

    let upserted = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < mapped.length; i += batchSize) {
      const batch = mapped.slice(i, i + batchSize);
      const { error, data } = await supabase
        .from('catalog_offers')
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: false })
        .select('id');

      if (error) {
        // Trigger errors are non-fatal
        if (error.message.includes('extensions.net.http_post') || error.message.includes('cross-database references')) {
          console.warn(`[sync-immoflux] Trigger error (non-fatal): ${error.message}`);
          upserted += batch.length;
        } else {
          console.error(`[sync-immoflux] Upsert batch failed: ${error.message}`);
          failed += batch.length;
        }
      } else {
        upserted += data?.length || 0;
      }
    }

    // Mark IMMOFLUX properties not in current feed as inactive
    const currentIds = mapped.map(m => m.external_id);
    if (currentIds.length > 0) {
      const { error: deactivateError } = await supabase
        .from('catalog_offers')
        .update({ availability_status: 'inactive', is_published: false })
        .eq('crm_source', 'immoflux')
        .not('external_id', 'in', `(${currentIds.join(',')})`);

      if (deactivateError) {
        console.warn(`[sync-immoflux] Deactivate old properties failed: ${deactivateError.message}`);
      }
    }

    const result = {
      success: true,
      synced: upserted,
      failed,
      total: mapped.length,
      timestamp: new Date().toISOString(),
    };

    console.log(`[sync-immoflux] Sync complete:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[sync-immoflux] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
