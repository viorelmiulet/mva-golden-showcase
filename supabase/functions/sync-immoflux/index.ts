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

// ─── IMMOFLUX code dictionaries (per documentatie-api) ──────────────────
const UTILITATI_LABELS: Record<string, string> = {
  '10001': 'Curent', '10002': 'Apă', '10003': 'Canalizare', '10004': 'Gaz',
  '10005': 'Puț', '10006': 'Fosă septică', '10007': 'Curent trifazic',
  '10009': 'CATV', '10010': 'Telefon', '10011': 'Telefon internațional',
  '10012': 'Acces internet', '10013': 'Fibră optică', '10014': 'Telefon internațional',
  '10015': 'Utilități în zonă', '10016': 'Sistem irigație',
};
const INCALZIRE_LABELS: Record<string, string> = {
  '10101': 'Termoficare', '10102': 'Centrală proprie', '10103': 'Centrală imobil',
  '10104': 'Convectoare', '10105': 'Sobă teracotă', '10106': 'Centrală pe lemne',
  '10107': 'Încălzire pardoseală', '10108': 'Calorifere', '10109': 'Șemineu',
};
const CLIMATIZARE_LABELS: Record<string, string> = {
  '10201': 'Aer condiționat', '10202': 'Ventiloconvectoare', '10203': 'Aeroterme',
};
const TEREN_LABELS: Record<string, string> = {
  '10301': 'Oportunitate de investiție', '10302': 'Construcție demolabilă',
  '10303': 'Parcelabil', '10304': 'La șosea', '10305': 'Acces auto', '10306': 'Teren împrejmuit',
};
const FINISAJE_LABELS: Record<string, string> = {
  '20001': 'Izolație exterior', '20002': 'Izolație interior', '20003': 'Bloc izolat termic',
  '20101': 'Pereți vopsea lavabilă', '20102': 'Pereți var', '20103': 'Pereți faianță',
  '20104': 'Pereți lambriu', '20105': 'Pereți tapet', '20106': 'Pereți marmură',
  '20107': 'Pereți humă', '20108': 'Pereți vinarom',
  '20201': 'Parchet', '20202': 'Gresie', '20203': 'Marmură', '20204': 'Mochetă',
  '20205': 'Dușumea', '20206': 'Linoleum',
  '20301': 'Finisat', '20302': 'Gri', '20303': 'Roșu', '20304': 'Stare bună',
  '20305': 'Necesită renovare', '20306': 'Renovat',
  '20401': 'Ferestre PVC', '20402': 'Ferestre lemn', '20403': 'Ferestre aluminiu',
  '20501': 'Jaluzele verticale', '20502': 'Jaluzele orizontale',
  '20601': 'Rulouri aluminiu', '20602': 'Rulouri lemn', '20603': 'Rulouri PVC',
  '20701': 'Ușă intrare metal', '20702': 'Ușă intrare lemn', '20703': 'Ușă intrare PVC', '20704': 'Ușă intrare PAL',
  '20801': 'Lămpi', '20802': 'Spoturi', '20803': 'Aplice', '20804': 'Iluminat exterior', '20805': 'Lumină naturală',
  '20901': 'Uși interior celulare', '20902': 'Uși interior lemn', '20903': 'Uși interior panel',
  '20904': 'Uși interior PVC', '20905': 'Uși interior sticlă', '20906': 'Uși interior metal',
  '21001': 'Acoperiș Lindab', '21002': 'Acoperiș țiglă', '21003': 'Terasă',
  '21004': 'Acoperiș tablă', '21005': 'Acoperiș carton', '21006': 'Șindrilă bituminoasă',
};
const DOTARI_LABELS: Record<string, string> = {
  '30001': 'Terasă', '30002': 'WC serviciu', '30003': 'Boxă la subsol', '30004': 'Debara',
  '30011': 'Pivniță', '30012': 'Cramă', '30013': 'Spațiu depozitare', '30014': 'Dressing',
  '30015': 'WC serviciu', '30016': 'Anexe', '30017': 'Dependințe',
  '30021': 'Pivniță', '30022': 'Cramă', '30023': 'Spațiu depozitare', '30024': 'Anexe',
  '30025': 'Dependințe', '30026': 'Parcare proprie', '30027': 'Parcare acoperită',
  '30028': 'Spațiu verde amenajat',
  '30101': 'Bucătărie mobilată', '30102': 'Bucătărie parțial mobilată', '30103': 'Bucătărie utilată',
  '30104': 'Bucătărie parțial utilată', '30105': 'Bucătărie nemobilată', '30106': 'Bucătărie neutilată',
  '30201': 'Apometre', '30202': 'Contor căldură', '30203': 'Contor gaz',
  '30301': 'Nemobilat', '30302': 'Parțial mobilat', '30303': 'Complet mobilat', '30304': 'Mobilat lux',
  '30401': 'Interfon', '30402': 'Videointerfon', '30403': 'Lift', '30404': 'Spații agrement',
  '30405': 'Saună', '30406': 'SPA', '30407': 'Acoperiș', '30408': 'Curte', '30409': 'Curte comună',
  '30410': 'Grădină', '30411': 'Piscină interioară', '30412': 'Piscină exterioară', '30413': 'Uscătorie',
  '30501': 'Fier de călcat', '30502': 'Cafetieră', '30503': 'Uscător păr', '30504': 'Toaster',
  '30505': 'DVD', '30506': 'Mașină de spălat rufe', '30507': 'Sandwich-maker', '30508': 'Frigider',
  '30509': 'Cuptor microunde', '30510': 'Aragaz', '30511': 'Hotă', '30512': 'Mașină de spălat vase',
  '30513': 'Robot bucătărie', '30514': 'Aspirator', '30515': 'TV', '30516': 'HI-FI',
  '30601': 'Jacuzzi', '30602': 'Scară interioară', '30603': 'Șemineu', '30604': 'Senzor de fum',
  '30605': 'Sistem de alarmă', '30606': 'Telecomandă poartă garaj', '30607': 'Telecomandă poartă acces auto',
};

interface ImmofluxProperty {
  idnum: number;
  idstr?: string;
  alias?: string;
  agent: number;
  agent_info?: { nume?: string; email?: string; telefon?: string; phone?: string };
  dataadaugare?: number | string;
  datamodificare?: number | string;
  adresa?: string;
  titlu: { ro?: string; en?: string } | string;
  descriere: { ro?: string; en?: string } | string;
  vecinatati?: { ro?: string; en?: string } | string;
  utilitati?: string;
  finisaje?: string;
  dotari?: string;
  altedetaliizona?: string;
  pretnegociabil?: number;
  longitudine?: number;
  latitudine?: number;
  tiplocuinta?: string;
  tipimobil?: string;
  tipteren?: string;
  clasificareteren?: string;
  nrfronturistradale?: number;
  frontstradal?: number | string;
  suprafatateren?: string | number;
  latimedrumacces?: number | string;
  nrcamere?: number;
  nrbucatarii?: number;
  etaj?: string;
  tipcompartimentare?: string;
  suprafatautila?: string | number;
  confort?: string;
  suprafataconstruita?: string | number;
  anconstructie?: number;
  nrbai?: number;
  nrnivele?: number;
  nrbalcoane?: number;
  nrgaraje?: number;
  stadiuconstructie?: string;
  stadiuconstructie_value?: string;
  tipconstructie_value?: string;
  starefinisaje_value?: string;
  mobilat_value?: string;
  bucatarie_values?: string[] | string;
  utilitati_values?: string[] | string;
  finisaje_values?: string[] | string;
  dotari_values?: string[] | string;
  structurarezistenta?: string;
  status?: string;
  localitate?: string;
  judet?: string;
  zona?: string;
  caroiaj?: string;
  devanzare?: number;
  monedavanzare?: string;
  monedainchiriere?: string;
  pretvanzare?: number;
  pretinchiriere?: number;
  pretfaratva?: number;
  comisioncumparator?: number | string;
  images?: Array<{ src: string; tip?: string; pozitie: number; modificata?: string }>;
  publicare?: number;
  top?: number;
  pole?: number;
  poleposition?: number;
  custom1?: string;
  custom2?: string;
  portals?: unknown[];
  tip?: string;
  eficienta_energetica?: string | Record<string, unknown>;
}

async function fetchAllProperties(supabase: any): Promise<ImmofluxProperty[]> {
  const baseUrl = await getBaseUrlFromDb(supabase);
  const auth = await getBasicAuthFromDb(supabase);
  const headers = { 'Authorization': auth, 'Accept': 'application/json' };

  const firstRes = await fetch(`${baseUrl}/api/sites/v1/properties?page=1`, { headers });
  if (!firstRes.ok) throw new Error(`IMMOFLUX API error: ${firstRes.status}`);
  const firstData = await firstRes.json();
  const allProps: ImmofluxProperty[] = [...(firstData.data || [])];
  const lastPage = firstData.last_page || 1;

  console.log(`[sync-immoflux] Total pages: ${lastPage}, total: ${firstData.total}`);

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

// Helpers ─────────────────────────────────────────────
const toArr = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(/[,;|\s]+/).filter(Boolean);
  return [];
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
};
const intOrNull = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const localized = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return (v as any).ro || (v as any).en || '';
  return String(v);
};
const labelize = (codes: string[], dict: Record<string, string>): string[] =>
  codes.map(c => dict[c]).filter(Boolean);

function mapToCatalogOffer(p: ImmofluxProperty): Record<string, unknown> {
  const title = localized(p.titlu) || `Proprietate #${p.idnum}`;
  let description = localized(p.descriere);

  // Append context blocks to description
  const vecin = localized(p.vecinatati);
  if (vecin) description += `\n\nVecinătăți: ${vecin}`;
  if (p.utilitati) description += `\n\nUtilități: ${p.utilitati}`;
  if (p.finisaje) description += `\n\nFinisaje: ${p.finisaje}`;
  if (p.dotari) description += `\n\nDotări: ${p.dotari}`;
  if (p.altedetaliizona) description += `\n\nAlte detalii zonă: ${p.altedetaliizona}`;

  const isSale = p.devanzare === 1;
  const price = isSale ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare);
  const currency = isSale ? (p.monedavanzare || 'EUR') : (p.monedainchiriere || 'EUR');

  const surface = intOrNull(p.suprafatautila);
  const surfaceLand = intOrNull(p.suprafatateren);

  const images = (p.images || []).sort((a, b) => a.pozitie - b.pozitie).map(img => img.src);
  const isPole = p.pole === 1 || p.poleposition === 1;
  const isTop = p.top === 1;
  const promotionType = isPole ? 'pole_position' : (isTop ? 'top' : null);

  // Code-based feature decoding
  const utilCodes = toArr(p.utilitati_values);
  const finisCodes = toArr(p.finisaje_values);
  const dotariCodes = toArr(p.dotari_values);
  const bucCodes = toArr(p.bucatarie_values);

  const features = [
    ...labelize(finisCodes, FINISAJE_LABELS),
    ...labelize(utilCodes, UTILITATI_LABELS),
    ...labelize(utilCodes, INCALZIRE_LABELS),
    ...labelize(utilCodes, TEREN_LABELS),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const amenities = [
    ...labelize(dotariCodes, DOTARI_LABELS),
    ...labelize(bucCodes, DOTARI_LABELS),
    ...labelize(utilCodes, CLIMATIZARE_LABELS),
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Boolean utility flags (codes per IMMOFLUX docs)
  const has = (code: string) => utilCodes.includes(code);
  const hasDot = (code: string) => dotariCodes.includes(code);

  const has_electricity = has('10001') || has('10007') || null;
  const has_water = has('10002') || has('10005') || null;
  const has_gas = has('10004') || hasDot('30203') || null;
  const has_internet = has('10012') || has('10013') || null;
  const has_tv = has('10009') || hasDot('30515') || null;
  const has_phone = has('10010') || has('10011') || has('10014') || null;
  const has_ac = utilCodes.includes('10201') || null;
  const has_security = hasDot('30605') || hasDot('30604') || null;
  const has_wood_floors = finisCodes.includes('20201') || finisCodes.includes('20205') || null;

  // Heating
  const heatingCode = utilCodes.find(c => INCALZIRE_LABELS[c]);
  const heating = heatingCode ? INCALZIRE_LABELS[heatingCode] : null;

  // Furnished
  const mobilatCode = dotariCodes.find(c => ['30301', '30302', '30303', '30304'].includes(c));
  const furnished = p.mobilat_value || (mobilatCode ? DOTARI_LABELS[mobilatCode] : null);

  // Parking count
  const parking = (hasDot('30026') ? 1 : 0) + (hasDot('30027') ? 1 : 0) + (p.nrgaraje || 0);

  // Agent
  const agent = p.agent_info?.nume || (p.agent ? `Agent #${p.agent}` : null);
  const agencyContact = p.agent_info ? {
    name: p.agent_info.nume,
    email: p.agent_info.email,
    phone: p.agent_info.phone || p.agent_info.telefon,
  } : null;

  // Date added
  let date_added: string | null = null;
  if (p.dataadaugare) {
    const ts = typeof p.dataadaugare === 'number' ? p.dataadaugare : parseInt(String(p.dataadaugare));
    if (!isNaN(ts)) date_added = new Date(ts * (ts > 1e12 ? 1 : 1000)).toISOString();
  }

  return {
    external_id: `immoflux-${p.idnum}`,
    crm_source: 'immoflux',
    source: 'immoflux',
    title,
    description,
    descriere_lunga: description,
    price_min: price || 0,
    price_max: price || 0,
    currency,
    rooms: p.nrcamere || 1,
    kitchens: p.nrbucatarii || null,
    surface_min: surface,
    surface_max: surface,
    surface_land: surfaceLand,
    images,
    location: p.adresa || p.zona || p.localitate,
    zone: p.zona || null,
    city: p.localitate || null,
    floor: intOrNull(p.etaj),
    total_floors: p.nrnivele || null,
    bathrooms: p.nrbai || null,
    balconies: p.nrbalcoane || null,
    year_built: p.anconstructie || null,
    transaction_type: isSale ? 'sale' : 'rent',
    is_featured: isTop || isPole,
    promotion_type: promotionType,
    is_published: p.publicare === 0 ? false : true,
    property_type: p.tiplocuinta || p.tipimobil || null,
    property_subtype: p.tipteren || null,
    appartment_type: p.tip || null,
    building_type: p.tipconstructie_value || null,
    compartment: p.tipcompartimentare || null,
    build_materials: p.structurarezistenta || null,
    comfort: p.confort || null,
    heating,
    furnished,
    parking: parking || null,
    latitude: p.latitudine || null,
    longitude: p.longitudine || null,
    availability_status: 'available',
    features: features.length ? features : null,
    amenities: amenities.length ? amenities : null,
    agent,
    contact_info: agencyContact,
    broker_id: p.agent ? String(p.agent) : null,
    has_water, has_gas, has_electricity, has_internet, has_tv,
    has_phone, has_ac, has_security, has_wood_floors,
    price_type: p.pretnegociabil === 1 ? 'negotiable' : null,
    commission_value: num(p.comisioncumparator),
    date_added,
    project_id: null,
  };
}

async function writeStatus(supabase: any, value: Record<string, unknown>) {
  try {
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'immoflux_sync_status', value: JSON.stringify(value) },
        { onConflict: 'key' }
      );
  } catch (e) {
    console.warn('[sync-immoflux] writeStatus failed:', (e as Error).message);
  }
}

async function runSync(supabase: any, startedAt: string) {
  try {
    console.log('[sync-immoflux] Starting sync...');
    await writeStatus(supabase, { status: 'running', started_at: startedAt, stage: 'fetching' });

    const properties = await fetchAllProperties(supabase);
    const mapped = properties.map(mapToCatalogOffer);
    console.log(`[sync-immoflux] Mapped ${mapped.length} properties for upsert`);

    await writeStatus(supabase, {
      status: 'running', started_at: startedAt, stage: 'upserting',
      total: mapped.length, synced: 0,
    });

    let upserted = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < mapped.length; i += batchSize) {
      const batch = mapped.slice(i, i + batchSize);
      const { error } = await supabase
        .from('catalog_offers')
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: false });

      if (error) {
        if (error.message.includes('extensions.net.http_post') || error.message.includes('cross-database references')) {
          console.warn(`[sync-immoflux] Trigger error (non-fatal): ${error.message}`);
          upserted += batch.length;
        } else {
          console.error(`[sync-immoflux] Upsert batch failed: ${error.message}`);
          failed += batch.length;
        }
      } else {
        upserted += batch.length;
      }
    }

    // Set-based diff for deactivation: fetch existing external_ids, diff in memory,
    // then update only those missing in small batches (avoids huge NOT IN URL).
    await writeStatus(supabase, {
      status: 'running', started_at: startedAt, stage: 'deactivating',
      total: mapped.length, synced: upserted, failed,
    });

    const currentIds = new Set(mapped.map(m => m.external_id as string));
    const { data: existing, error: listErr } = await supabase
      .from('catalog_offers')
      .select('external_id')
      .eq('crm_source', 'immoflux')
      .neq('availability_status', 'sold');

    if (listErr) {
      console.warn(`[sync-immoflux] List existing failed: ${listErr.message}`);
    } else if (existing && existing.length > 0) {
      const toDeactivate = existing
        .map((r: any) => r.external_id as string)
        .filter((id: string) => id && !currentIds.has(id));

      console.log(`[sync-immoflux] Deactivating ${toDeactivate.length} properties no longer in CRM`);
      const deactivateBatch = 100;
      for (let i = 0; i < toDeactivate.length; i += deactivateBatch) {
        const slice = toDeactivate.slice(i, i + deactivateBatch);
        const { error: deactivateError } = await supabase
          .from('catalog_offers')
          .update({ availability_status: 'sold', is_published: true })
          .in('external_id', slice);
        if (deactivateError) {
          console.warn(`[sync-immoflux] Deactivate batch failed: ${deactivateError.message}`);
        }
      }
    }

    const finishedAt = new Date().toISOString();
    const result = {
      status: 'done',
      success: true,
      started_at: startedAt,
      finished_at: finishedAt,
      synced: upserted,
      failed,
      total: mapped.length,
    };
    console.log('[sync-immoflux] Sync complete:', result);
    await writeStatus(supabase, result);
  } catch (error: any) {
    console.error('[sync-immoflux] Background error:', error);
    await writeStatus(supabase, {
      status: 'error',
      success: false,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error: error?.message || String(error),
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ?status=1 → read-only status check (used by frontend polling)
    const url = new URL(req.url);
    if (url.searchParams.get('status') === '1') {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'immoflux_sync_status')
        .maybeSingle();
      let parsed: any = null;
      try { parsed = data?.value ? JSON.parse(data.value) : null; } catch { parsed = null; }
      return new Response(JSON.stringify({ ok: true, status: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Guard: don't start a new sync if one is already running (under 5 min old)
    const { data: existing } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'immoflux_sync_status')
      .maybeSingle();
    let current: any = null;
    try { current = existing?.value ? JSON.parse(existing.value) : null; } catch {}
    if (current?.status === 'running') {
      const startedMs = current.started_at ? Date.parse(current.started_at) : 0;
      const ageMs = Date.now() - startedMs;
      if (ageMs < 5 * 60 * 1000) {
        return new Response(JSON.stringify({ started: false, alreadyRunning: true, status: current }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const startedAt = new Date().toISOString();
    await writeStatus(supabase, { status: 'running', started_at: startedAt, stage: 'starting' });

    // Run in background — return immediately so the client isn't blocked
    // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime
    if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runSync(supabase, startedAt));
    } else {
      runSync(supabase, startedAt);
    }

    return new Response(JSON.stringify({ started: true, started_at: startedAt }), {
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
