import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://www.mvaimobiliare.ro'
const FALLBACK_IMAGE = 'https://mvaimobiliare.ro/og-image.jpg'

// ===== Persistent image-validation cache (DB-backed with TTL) =====
const IMG_CACHE_TTL_DAYS = 7
const IMG_CACHE_TTL_MS = IMG_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
const imageMemCache = new Map<string, boolean>() // request-scope memo only

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

let imgSupabase: ReturnType<typeof createClient> | null = null
function getImgClient() {
  if (!imgSupabase) {
    imgSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
  }
  return imgSupabase
}

async function loadCachedValidations(urls: string[]): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>()
  if (urls.length === 0) return out
  const hashByUrl = new Map<string, string>()
  await Promise.all(urls.map(async (u) => hashByUrl.set(u, await sha256Hex(u))))
  const hashes = Array.from(hashByUrl.values())
  const sb = getImgClient()
  // Chunk to avoid URL/IN-list limits
  const CHUNK = 200
  const nowIso = new Date().toISOString()
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const slice = hashes.slice(i, i + CHUNK)
    const { data, error } = await sb
      .from('image_validation_cache')
      .select('url_hash, is_valid, expires_at')
      .in('url_hash', slice)
      .gt('expires_at', nowIso)
    if (error) { console.error('cache read error:', error.message); continue }
    const byHash = new Map<string, boolean>()
    for (const row of data || []) byHash.set((row as any).url_hash, (row as any).is_valid)
    for (const [u, h] of hashByUrl) {
      if (byHash.has(h)) out.set(u, byHash.get(h)!)
    }
  }
  return out
}

async function persistValidations(rows: { url: string; is_valid: boolean; status_code?: number; content_type?: string }[]) {
  if (rows.length === 0) return
  const sb = getImgClient()
  const expires_at = new Date(Date.now() + IMG_CACHE_TTL_MS).toISOString()
  const checked_at = new Date().toISOString()
  const payload = await Promise.all(rows.map(async (r) => ({
    url_hash: await sha256Hex(r.url),
    url: r.url,
    is_valid: r.is_valid,
    status_code: r.status_code ?? null,
    content_type: r.content_type ?? null,
    checked_at,
    expires_at,
  })))
  const { error } = await sb.from('image_validation_cache').upsert(payload, { onConflict: 'url_hash' })
  if (error) console.error('cache write error:', error.message)
}

async function probeImage(url: string): Promise<{ ok: boolean; status?: number; content_type?: string }> {
  const check = async (method: 'HEAD' | 'GET') => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    try {
      const res = await fetch(url, {
        method,
        signal: ctrl.signal,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : {},
        redirect: 'follow',
      })
      const ct = res.headers.get('content-type') || ''
      const ok = (res.ok || res.status === 206) && (ct.startsWith('image/') || ct === '')
      return { ok, status: res.status, content_type: ct }
    } catch {
      return { ok: false }
    } finally {
      clearTimeout(t)
    }
  }
  let r = await check('HEAD')
  if (!r.ok) r = await check('GET')
  return r
}

// Validate a list of URLs using persistent cache; only probes the cache misses.
async function validateImagesBatch(urls: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>()
  const unique = Array.from(new Set(urls.filter(u => /^https?:\/\//i.test(u))))
  // 1) Request-scope memo
  const remaining: string[] = []
  for (const u of unique) {
    if (imageMemCache.has(u)) result.set(u, imageMemCache.get(u)!)
    else remaining.push(u)
  }
  if (remaining.length === 0) return result
  // 2) Persistent cache
  const cached = await loadCachedValidations(remaining)
  const toProbe: string[] = []
  for (const u of remaining) {
    if (cached.has(u)) {
      const v = cached.get(u)!
      result.set(u, v); imageMemCache.set(u, v)
    } else {
      toProbe.push(u)
    }
  }
  // 3) Probe misses with limited concurrency
  const PROBE_CONCURRENCY = 8
  const newRows: { url: string; is_valid: boolean; status_code?: number; content_type?: string }[] = []
  let cursor = 0
  await Promise.all(Array.from({ length: PROBE_CONCURRENCY }, async () => {
    while (true) {
      const i = cursor++
      if (i >= toProbe.length) return
      const u = toProbe[i]
      const r = await probeImage(u)
      result.set(u, r.ok); imageMemCache.set(u, r.ok)
      newRows.push({ url: u, is_valid: r.ok, status_code: r.status, content_type: r.content_type })
    }
  }))
  // 4) Persist (fire-and-forget but awaited so caller logs are accurate)
  await persistValidations(newRows)
  return result
}

async function filterValidImages(urls: string[], maxValid: number, validations: Map<string, boolean>): Promise<string[]> {
  const valid: string[] = []
  for (const u of urls) {
    if (valid.length >= maxValid) break
    if (validations.get(u)) valid.push(u)
  }
  return valid
}

// ===== Link validation (similar persistent cache, shorter TTL since slugs can change) =====
const LINK_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const linkMemCache = new Map<string, boolean>()

async function probeLink(url: string): Promise<{ ok: boolean; status?: number; content_type?: string }> {
  const check = async (method: 'HEAD' | 'GET') => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    try {
      const res = await fetch(url, {
        method,
        signal: ctrl.signal,
        headers: { 'User-Agent': 'MVAFeedBot/1.0 (+https://www.mvaimobiliare.ro)' },
        redirect: 'follow',
      })
      const ct = res.headers.get('content-type') || ''
      // Accept any 2xx that returns HTML; SPA may always 200, so also check the body for "404" markers
      const ok = res.ok && (ct.includes('text/html') || ct === '')
      return { ok, status: res.status, content_type: ct }
    } catch {
      return { ok: false }
    } finally {
      clearTimeout(t)
    }
  }
  // For SPA, HEAD often returns the shell; do GET to inspect a small chunk for 404 marker
  let r = await check('GET')
  if (!r.ok) r = await check('HEAD')
  return r
}

async function validateLinksBatch(urls: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>()
  const unique = Array.from(new Set(urls.filter(u => /^https?:\/\//i.test(u))))
  const remaining: string[] = []
  for (const u of unique) {
    if (linkMemCache.has(u)) result.set(u, linkMemCache.get(u)!)
    else remaining.push(u)
  }
  if (remaining.length === 0) return result
  const cached = await loadCachedValidations(remaining)
  const toProbe: string[] = []
  for (const u of remaining) {
    if (cached.has(u)) {
      const v = cached.get(u)!
      result.set(u, v); linkMemCache.set(u, v)
    } else {
      toProbe.push(u)
    }
  }
  const PROBE_CONCURRENCY = 6
  const newRows: { url: string; is_valid: boolean; status_code?: number; content_type?: string }[] = []
  let cursor = 0
  await Promise.all(Array.from({ length: PROBE_CONCURRENCY }, async () => {
    while (true) {
      const i = cursor++
      if (i >= toProbe.length) return
      const u = toProbe[i]
      const r = await probeLink(u)
      result.set(u, r.ok); linkMemCache.set(u, r.ok)
      newRows.push({ url: u, is_valid: r.ok, status_code: r.status, content_type: r.content_type })
    }
  }))
  // Persist with link-specific (shorter) TTL
  if (newRows.length > 0) {
    const sb = getImgClient()
    const expires_at = new Date(Date.now() + LINK_CACHE_TTL_MS).toISOString()
    const checked_at = new Date().toISOString()
    const payload = await Promise.all(newRows.map(async (r) => ({
      url_hash: await sha256Hex(r.url),
      url: r.url,
      is_valid: r.is_valid,
      status_code: r.status_code ?? null,
      content_type: r.content_type ?? null,
      checked_at,
      expires_at,
    })))
    const { error } = await sb.from('image_validation_cache').upsert(payload, { onConflict: 'url_hash' })
    if (error) console.error('link cache write error:', error.message)
  }
  return result
}

const escapeCsv = (val: unknown): string => {
  if (val === null || val === undefined) return ''
  let s = String(val).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    s = '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1).trim() + '…' : s

// Fallback slug builder if DB slug is missing
const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const buildSlug = (p: any): string => {
  if (p.slug) return p.slug
  const parts: string[] = []
  const rooms = p.rooms || 1
  parts.push(rooms <= 1 ? 'garsoniera' : `apartament-${rooms}-camere`)
  if (p.surface_min) parts.push(`${p.surface_min}mp`)
  if (p.project_name) parts.push(slugify(p.project_name))
  if (p.city) parts.push(slugify(p.city))
  parts.push(p.id.replace(/-/g, '').slice(0, 4))
  return parts.filter(Boolean).join('-')
}

// ===== Module-level cache (persists across warm invocations of the same instance) =====
type FeedResult = {
  csv: string
  headers: string[]
  allValues: string[][]
  excluded: { id: string; external_id: string | null; title: string; reason: string }[]
  total_input: number
  generated_at: string
  size_bytes: number
}
type FeedFormat = 'home_listings' | 'products'
const CACHE: Record<FeedFormat, { result: FeedResult; expires_at: number } | null> = {
  home_listings: null,
  products: null,
}
const INFLIGHT: Record<FeedFormat, Promise<FeedResult> | null> = {
  home_listings: null,
  products: null,
}
const TTL_MS = 30 * 60 * 1000 // 30 minutes

async function generateFeed(format: FeedFormat = 'home_listings'): Promise<FeedResult> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const all: any[] = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('catalog_offers')
      .select('id, external_id, title, description, descriere_lunga, slug, price_min, currency, images, availability_status, is_published, project_id, project_name, rooms, city, zone, surface_min, property_type, transaction_type')
      .eq('is_published', true)
      .is('project_id', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  type Excluded = { id: string; external_id: string | null; title: string; reason: string }
  const excluded: Excluded[] = []
  const valid: any[] = []
  const MIN_TITLE_LEN = 5
  const MIN_PRICE = 1
  const MAX_PRICE = 100_000_000

  for (const p of all) {
    const title = stripHtml(p.title || '').trim()
    const price = Number(p.price_min)
    const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u)) : []
    if (!title) { excluded.push({ id: p.id, external_id: p.external_id, title: p.title || '(fara titlu)', reason: 'Titlu lipsa' }); continue }
    if (title.length < MIN_TITLE_LEN) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: `Titlu prea scurt (<${MIN_TITLE_LEN} caractere)` }); continue }
    if (!Number.isFinite(price) || price < MIN_PRICE) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: 'Pret lipsa sau 0' }); continue }
    if (price > MAX_PRICE) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: `Pret nerealist (>${MAX_PRICE.toLocaleString()} EUR)` }); continue }
    if (imgs.length === 0) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: 'Fara imagini valide (URL)' }); continue }
    valid.push(p)
  }

  // Meta Home Listings (Real Estate) catalog format
  // Headers per format
  // - home_listings: Meta Real Estate catalog (current default)
  // - products: standard Commerce/Products catalog → REQUIRED for WhatsApp Business Catalog
  const headers = format === 'products'
    ? [
        'id', 'title', 'description', 'availability', 'condition',
        'price', 'link', 'image_link', 'brand',
        'google_product_category', 'product_type',
        'additional_image_link',
      ]
    : [
        'home_listing_id', 'name', 'availability', 'description', 'url',
        'price', 'listing_type', 'property_type',
        'address.addr1', 'address.city', 'address.region', 'address.postal_code', 'address.country',
        'num_beds', 'num_baths', 'area_size', 'area_unit',
        'image[0].url',
        'image[1].url', 'image[2].url', 'image[3].url', 'image[4].url',
        'image[5].url', 'image[6].url', 'image[7].url', 'image[8].url', 'image[9].url'
      ]

  // Pre-batch validate ALL candidate image URLs in one go (uses persistent cache + concurrent probing)
  const allCandidateUrls: string[] = []
  for (const p of valid) {
    const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string') : []
    allCandidateUrls.push(...imgs)
  }
  const validations = await validateImagesBatch(allCandidateUrls)

  // Pre-batch validate ALL property links (/proprietati/<slug>) — same persistent cache pattern
  const linkByProp = new Map<string, string>()
  for (const p of valid) {
    linkByProp.set(p.id, `${SITE_URL}/proprietati/${buildSlug(p)}`)
  }
  const linkValidations = await validateLinksBatch(Array.from(linkByProp.values()))

  const noReachableImage: Excluded[] = []
  const brokenLinks: Excluded[] = []
  const buildValues = (p: any): string[] | null => {
    const id = p.external_id || p.id
    const name = truncate(stripHtml(p.title || 'Proprietate'), 100)
    const descSrc = p.descriere_lunga || p.description || p.title || ''
    const description = truncate(stripHtml(descSrc), 4900) || name
    const isRent = p.transaction_type === 'rent'
    // Meta accepted values: for_sale, for_rent, sale_pending, recently_sold, off_market, available_soon
    let availability = 'off_market'
    if (p.availability_status === 'available') availability = isRent ? 'for_rent' : 'for_sale'
    else if (p.availability_status === 'reserved') availability = 'sale_pending'
    else if (p.availability_status === 'sold') availability = 'recently_sold'
    const price = `${Number(p.price_min).toFixed(2)} ${p.currency || 'EUR'}`
    const link = linkByProp.get(p.id) || `${SITE_URL}/proprietati/${buildSlug(p)}`
    if (!linkValidations.get(link)) {
      brokenLinks.push({ id: p.id, external_id: p.external_id, title: name, reason: `Link inaccesibil/404: ${link}` })
      return null
    }
    const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string') : []
    const validImgs: string[] = []
    for (const u of imgs) {
      if (validImgs.length >= 10) break
      if (validations.get(u)) validImgs.push(u)
    }
    if (validImgs.length === 0) {
      noReachableImage.push({ id: p.id, external_id: p.external_id, title: name, reason: 'Toate imaginile sunt inaccesibile (HEAD/GET fail)' })
      return null
    }
    // listing_type: for_sale_by_agent / for_rent_by_agent
    const listing_type = isRent ? 'for_rent_by_agent' : 'for_sale_by_agent'
    // property_type — Meta accepts: apartment, condo, house, townhouse, land, other
    const ptRaw = (p.property_type || '').toString().toLowerCase()
    let property_type = 'apartment'
    if (/casa|house|vila|villa/.test(ptRaw)) property_type = 'house'
    else if (/teren|land|lot/.test(ptRaw)) property_type = 'land'
    else if (/spatiu|comerc|birou|office|comm/.test(ptRaw)) property_type = 'other'
    else if (/duplex|townhouse/.test(ptRaw)) property_type = 'townhouse'

    // Address — Meta requires at least addr1+city+region+country
    const addrCity = (p.city || 'Bucuresti').toString().trim()
    const addrZone = p.zone && !/^\d|.*\d{2,}\.\d{3,}/.test(p.zone) ? p.zone.split(',')[0].trim() : ''
    const addr1 = addrZone ? `${addrZone}, ${addrCity}` : addrCity
    const region = addrCity.toLowerCase() === 'bucuresti' || addrCity.toLowerCase() === 'bucurești' ? 'Bucuresti' : addrCity
    const postal = ''
    const country = 'RO'

    const beds = p.rooms ? String(p.rooms) : ''
    const baths = ''
    const area_size = p.surface_min ? String(p.surface_min) : ''
    const area_unit = area_size ? 'sqm' : ''

    // Build 10 image slots
    const imgSlots: string[] = []
    for (let i = 0; i < 10; i++) imgSlots.push(validImgs[i] || '')

    if (format === 'products') {
      // Standard Commerce/Products feed — accepted by WhatsApp Business Catalog
      // Required: id, title, description, availability (in stock|out of stock),
      // condition (new|used|refurbished), price ("<amount> <CUR>"), link, image_link, brand
      const prodAvailability = (p.availability_status === 'available') ? 'in stock' : 'out of stock'
      const condition = 'new'
      const brand = 'MVA Imobiliare'
      const googleCategory = 'Real Estate'
      const productType = isRent ? 'Inchirieri' : 'Vanzari'
      const additional = imgSlots.slice(1, 10).filter(Boolean).join(',')
      return [
        id, name, description, prodAvailability, condition,
        price, link, imgSlots[0], brand,
        googleCategory, productType,
        additional,
      ].map(String)
    }

    return [
      id, name, availability, description, link,
      price, listing_type, property_type,
      addr1, addrCity, region, postal, country,
      beds, baths, area_size, area_unit,
      imgSlots[0],
      imgSlots[1], imgSlots[2], imgSlots[3], imgSlots[4],
      imgSlots[5], imgSlots[6], imgSlots[7], imgSlots[8], imgSlots[9]
    ].map(String)
  }

  const built = valid.map(buildValues)
  const allValues = built.filter((v): v is string[] => v !== null)
  excluded.push(...brokenLinks, ...noReachableImage)

  const csv = [headers.join(','), ...allValues.map(v => v.map(escapeCsv).join(','))].join('\n')
  const generated_at = new Date().toISOString()
  const size_bytes = new TextEncoder().encode(csv).length

  // Clear request-scope memos only; persistent cache (DB) survives with its own TTL
  imageMemCache.clear()
  linkMemCache.clear()

  return { csv, headers, allValues, excluded, total_input: all.length, generated_at, size_bytes }
}

async function getFeed(forceRefresh: boolean): Promise<{ result: FeedResult; from_cache: boolean; expires_at: number }> {
  const now = Date.now()
  if (!forceRefresh && CACHE && CACHE.expires_at > now) {
    return { result: CACHE.result, from_cache: true, expires_at: CACHE.expires_at }
  }
  if (INFLIGHT) {
    const result = await INFLIGHT
    return { result, from_cache: false, expires_at: CACHE?.expires_at ?? Date.now() + TTL_MS }
  }
  INFLIGHT = generateFeed()
  try {
    const result = await INFLIGHT
    CACHE = { result, expires_at: Date.now() + TTL_MS }
    return { result, from_cache: false, expires_at: CACHE.expires_at }
  } finally {
    INFLIGHT = null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const previewMode = url.searchParams.get('preview') === '1'
  const previewLimit = parseInt(url.searchParams.get('limit') || '5', 10)
  const forceRefresh = url.searchParams.get('refresh') === '1'

  try {
    const { result, from_cache, expires_at } = await getFeed(forceRefresh)
    const { csv, headers, allValues, excluded, total_input, generated_at, size_bytes } = result
    const cacheAgeSec = Math.max(0, Math.floor((Date.now() - new Date(generated_at).getTime()) / 1000))
    const maxAgeSec = Math.max(0, Math.floor((expires_at - Date.now()) / 1000))

    if (previewMode) {
      return new Response(JSON.stringify({
        total: allValues.length,
        total_input,
        excluded_count: excluded.length,
        excluded,
        preview: Math.min(previewLimit, allValues.length),
        size_bytes,
        generated_at,
        from_cache,
        cache_age_seconds: cacheAgeSec,
        cache_expires_in_seconds: maxAgeSec,
        cache_ttl_minutes: Math.round(TTL_MS / 60000),
        headers,
        rows: allValues.slice(0, previewLimit),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename="mva-facebook-catalog.csv"',
        'Cache-Control': `public, max-age=${maxAgeSec}, s-maxage=${maxAgeSec}`,
        'X-Total-Products': String(allValues.length),
        'X-Excluded-Products': String(excluded.length),
        'X-Generated-At': generated_at,
        'X-Cache': from_cache ? 'HIT' : 'MISS',
        'X-Cache-Age': String(cacheAgeSec),
      },
    })
  } catch (e: any) {
    console.error('facebook-catalog-feed error:', e)
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
