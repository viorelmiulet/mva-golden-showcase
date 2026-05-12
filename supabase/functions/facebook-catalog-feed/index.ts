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

// ===== Price + currency normalization (WhatsApp/Meta Commerce strict format) =====
// WhatsApp Business + Meta Commerce require: "<amount with 2 decimals> <ISO 4217 CCY>"
//   e.g. "120000.00 EUR". Niciodată gol, fără separatori de mii, mereu punct decimal.
const ISO_CURRENCY_RE = /^[A-Z]{3}$/
const CURRENCY_ALIASES: Record<string, string> = {
  '€': 'EUR', 'EURO': 'EUR', 'EUROS': 'EUR',
  'LEI': 'RON', 'RON.': 'RON',
  '$': 'USD', 'US$': 'USD', 'DOLLAR': 'USD', 'DOLLARS': 'USD',
  '£': 'GBP', 'GBP.': 'GBP',
  'MDL.': 'MDL',
}

const normalizeCurrency = (raw: unknown): string => {
  if (raw === null || raw === undefined) return 'EUR'
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '')
  if (!s) return 'EUR'
  if (CURRENCY_ALIASES[s]) return CURRENCY_ALIASES[s]
  if (ISO_CURRENCY_RE.test(s)) return s
  // Fallback sigur — Meta refuză coduri non-ISO
  return 'EUR'
}

const normalizePriceAmount = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === '') return null
  let num: number
  if (typeof raw === 'number') {
    num = raw
  } else {
    // Strip non-numeric, suportă "1.234,56" / "1,234.56" / "120000 EUR"
    let s = String(raw).trim()
    // Elimină codul de monedă/simbolurile lipite
    s = s.replace(/[A-Za-z€$£]/g, '').trim()
    // Dacă există atât "," cât și ".", asumă "," = mii
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/,/g, '')
    } else if (s.includes(',') && !s.includes('.')) {
      // ",34" sau "1234,56" → punct decimal
      s = s.replace(',', '.')
    }
    s = s.replace(/\s+/g, '')
    num = Number(s)
  }
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

// Format final acceptat de WhatsApp/Meta: "120000.00 EUR"
const formatMetaPrice = (amount: number, currency: string): string => {
  const ccy = ISO_CURRENCY_RE.test(currency) ? currency : 'EUR'
  return `${amount.toFixed(2)} ${ccy}`
}

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
    const price = normalizePriceAmount(p.price_min)
    const currency = normalizeCurrency(p.currency)
    const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u)) : []
    if (!title) { excluded.push({ id: p.id, external_id: p.external_id, title: p.title || '(fara titlu)', reason: 'Titlu lipsa' }); continue }
    if (title.length < MIN_TITLE_LEN) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: `Titlu prea scurt (<${MIN_TITLE_LEN} caractere)` }); continue }
    if (price === null || price < MIN_PRICE) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: 'Pret lipsa, 0 sau invalid (nu poate fi normalizat la format Meta)' }); continue }
    if (price > MAX_PRICE) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: `Pret nerealist (>${MAX_PRICE.toLocaleString()} EUR)` }); continue }
    if (!ISO_CURRENCY_RE.test(currency)) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: `Cod monedă invalid: "${p.currency}"` }); continue }
    // Atașăm valorile normalizate ca să le reutilizăm în buildValues fără re-parse
    p.__priceNum = price
    p.__currency = currency
    p.__priceFormatted = formatMetaPrice(price, currency)
    if (imgs.length === 0) { excluded.push({ id: p.id, external_id: p.external_id, title, reason: 'Fara imagini valide (URL)' }); continue }
    valid.push(p)
  }

  // Meta Home Listings (Real Estate) catalog format
  // Headers per format
  // - products (DEFAULT): standard Commerce/Products catalog → REQUIRED for WhatsApp Business Catalog
  //   Conține toate câmpurile required + recommended de Meta Commerce + WhatsApp.
  // - home_listings: Meta Real Estate catalog (NU este acceptat de WhatsApp Business Catalog)
  const headers = format === 'home_listings'
    ? [
        'home_listing_id', 'name', 'availability', 'description', 'url',
        'price', 'listing_type', 'property_type',
        'address.addr1', 'address.city', 'address.region', 'address.postal_code', 'address.country',
        'num_beds', 'num_baths', 'area_size', 'area_unit',
        'image[0].url',
        'image[1].url', 'image[2].url', 'image[3].url', 'image[4].url',
        'image[5].url', 'image[6].url', 'image[7].url', 'image[8].url', 'image[9].url'
      ]
    : [
        // Required
        'id', 'title', 'description', 'availability', 'condition',
        'price', 'link', 'image_link', 'brand',
        // Recommended / categorization
        'google_product_category', 'fb_product_category', 'product_type',
        // Identifiers / inventory (WhatsApp + Commerce)
        'identifier_exists', 'item_group_id', 'retailer_id',
        'quantity_to_sell_on_facebook', 'inventory', 'status',
        // Currency (separat — cerut explicit de WhatsApp Business)
        'currency',
        // Locație
        'origin_country',
        // Imagini suplimentare (până la 10 URL-uri separate prin virgulă)
        'additional_image_link',
        // Custom labels — folosite pentru segmentare audiențe / reguli WhatsApp
        'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4',
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
    const price = p.__priceFormatted as string // pre-normalizat: "<amount.00> <ISO CCY>"
    const link = linkByProp.get(p.id) || `${SITE_URL}/proprietati/${buildSlug(p)}`
    if (!linkValidations.get(link)) {
      brokenLinks.push({ id: p.id, external_id: p.external_id, title: name, reason: `Link inaccesibil/404: ${link}` })
      return null
    }
    // Meta accepts max 1 main image_link + 10 additional_image_link (=> 11 total).
    // Pentru home_listings, schema CSV are doar 10 sloturi (image[0..9]).
    const MAX_IMAGES = format === 'home_listings' ? 10 : 11
    const imgsRaw: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string') : []
    // Dedupe păstrând ordinea
    const seen = new Set<string>()
    const imgs: string[] = []
    for (const u of imgsRaw) { if (!seen.has(u)) { seen.add(u); imgs.push(u) } }
    const validImgs: string[] = []
    for (const u of imgs) {
      if (validImgs.length >= MAX_IMAGES) break
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

    if (format !== 'home_listings') {
      // ===== Standard Commerce / Products feed (DEFAULT) =====
      // Acceptat de WhatsApp Business Catalog + Meta Commerce Manager.
      // Conține toate câmpurile required + recommended.
      const currency = p.__currency as string
      const priceWithCurrency = p.__priceFormatted as string
      const prodAvailability = (p.availability_status === 'available') ? 'in stock' : 'out of stock'
      const condition = 'new'
      const brand = 'MVA Imobiliare'
      const googleCategory = 'Real Estate'
      const fbCategory = 'real_estate' // Meta fb_product_category
      const productType = isRent
        ? `Imobiliare > Inchirieri > ${property_type}`
        : `Imobiliare > Vanzari > ${property_type}`
      const identifierExists = 'no' // nu avem GTIN/MPN — obligatoriu să fie 'no'
      const itemGroupId = p.project_id || (p.project_name ? slugify(p.project_name) : id)
      const retailerId = id
      const quantity = (p.availability_status === 'available') ? '1' : '0'
      const inventory = quantity
      const status = (p.availability_status === 'available') ? 'active' : 'archived'
      const additional = imgSlots.slice(1, 10).filter(Boolean).join(',')

      // Custom labels (segmentare audiențe / reguli WhatsApp)
      const cl0 = property_type
      const cl1 = isRent ? 'inchiriere' : 'vanzare'
      const cl2 = beds ? `${beds}-camere` : ''
      const cl3 = addrCity
      const cl4 = area_size ? `${area_size}-mp` : ''

      return [
        // Required
        id, name, description, prodAvailability, condition,
        priceWithCurrency, link, imgSlots[0], brand,
        // Categorization
        googleCategory, fbCategory, productType,
        // Identifiers / inventory
        identifierExists, itemGroupId, retailerId,
        quantity, inventory, status,
        // Currency separat
        currency,
        // Country
        'RO',
        // Additional images
        additional,
        // Custom labels
        cl0, cl1, cl2, cl3, cl4,
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

async function getFeed(forceRefresh: boolean, format: FeedFormat): Promise<{ result: FeedResult; from_cache: boolean; expires_at: number }> {
  const now = Date.now()
  const cached = CACHE[format]
  if (!forceRefresh && cached && cached.expires_at > now) {
    return { result: cached.result, from_cache: true, expires_at: cached.expires_at }
  }
  if (INFLIGHT[format]) {
    const result = await INFLIGHT[format]!
    return { result, from_cache: false, expires_at: CACHE[format]?.expires_at ?? Date.now() + TTL_MS }
  }
  INFLIGHT[format] = generateFeed(format)
  try {
    const result = await INFLIGHT[format]!
    CACHE[format] = { result, expires_at: Date.now() + TTL_MS }
    return { result, from_cache: false, expires_at: CACHE[format]!.expires_at }
  } finally {
    INFLIGHT[format] = null
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
  const formatParam = (url.searchParams.get('format') || '').toLowerCase()
  // Default = 'products' (Commerce standard) → singurul format acceptat de WhatsApp Business Catalog.
  // 'home_listings' rămâne disponibil cu ?format=home_listings (legacy Real Estate, NU funcționează în WhatsApp).
  const format: FeedFormat = formatParam === 'home_listings' ? 'home_listings' : 'products'

  try {
    const { result, from_cache, expires_at } = await getFeed(forceRefresh, format)
    const { csv, headers, allValues, excluded, total_input, generated_at, size_bytes } = result
    const cacheAgeSec = Math.max(0, Math.floor((Date.now() - new Date(generated_at).getTime()) / 1000))
    const maxAgeSec = Math.max(0, Math.floor((expires_at - Date.now()) / 1000))

    if (previewMode) {
      return new Response(JSON.stringify({
        format,
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

    const filename = format === 'products'
      ? 'mva-products-catalog.csv'
      : 'mva-facebook-catalog.csv'

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': `public, max-age=${maxAgeSec}, s-maxage=${maxAgeSec}`,
        'X-Feed-Format': format,
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
