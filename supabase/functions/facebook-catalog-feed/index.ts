import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://www.mvaimobiliare.ro'
const FALLBACK_IMAGE = 'https://mvaimobiliare.ro/og-image.jpg'

// Validate image URL with HEAD (fallback to GET Range) — returns true only if reachable & image
const imageCache = new Map<string, boolean>()
async function isImageReachable(url: string): Promise<boolean> {
  if (!url || !/^https?:\/\//i.test(url)) return false
  if (imageCache.has(url)) return imageCache.get(url)!
  const check = async (method: 'HEAD' | 'GET'): Promise<boolean> => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    try {
      const res = await fetch(url, {
        method,
        signal: ctrl.signal,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : {},
        redirect: 'follow',
      })
      if (!res.ok && res.status !== 206) return false
      const ct = res.headers.get('content-type') || ''
      return ct.startsWith('image/') || ct === '' // some CDNs omit CT on HEAD
    } catch {
      return false
    } finally {
      clearTimeout(t)
      try { /* drain */ } catch {}
    }
  }
  let ok = await check('HEAD')
  if (!ok) ok = await check('GET')
  imageCache.set(url, ok)
  return ok
}

async function filterValidImages(urls: string[], maxValid: number): Promise<string[]> {
  const valid: string[] = []
  // Sequential with early exit to limit load
  for (const u of urls) {
    if (valid.length >= maxValid) break
    if (await isImageReachable(u)) valid.push(u)
  }
  return valid
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const previewMode = url.searchParams.get('preview') === '1'
  const previewLimit = parseInt(url.searchParams.get('limit') || '5', 10)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Pull all eligible properties (paginate to bypass 1000 default)
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

    // Validation rules + exclusion report
    type Excluded = { id: string; external_id: string | null; title: string; reason: string };
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

    const headers = [
      'id', 'title', 'description', 'availability', 'condition', 'price',
      'link', 'image_link', 'additional_image_link', 'brand',
      'google_product_category', 'product_type',
      'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4'
    ]

    // Track per-property image validation results for the report
    const noReachableImage: Excluded[] = []

    const buildValues = async (p: any): Promise<string[] | null> => {
      const id = p.external_id || p.id
      const title = truncate(stripHtml(p.title || 'Proprietate'), 150)
      const descSrc = p.descriere_lunga || p.description || p.title || ''
      const description = truncate(stripHtml(descSrc), 4900) || title
      const availability = p.availability_status === 'available' ? 'in stock' : 'out of stock'
      const price = `${Number(p.price_min).toFixed(2)} ${p.currency || 'EUR'}`
      const slug = buildSlug(p)
      const link = `${SITE_URL}/proprietati/${slug}`
      const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string') : []
      const validImgs = await filterValidImages(imgs, 11)

      if (validImgs.length === 0) {
        // Hard-exclude rather than send fallback as primary image
        noReachableImage.push({ id: p.id, external_id: p.external_id, title, reason: 'Toate imaginile sunt inaccesibile (HEAD/GET fail)' })
        return null
      }

      const image_link = validImgs[0]
      const additional = validImgs.slice(1, 11).join(',')

      const propType = p.property_type || 'Imobil'
      const roomsLabel = p.rooms ? (p.rooms <= 1 ? 'Garsoniera' : `${p.rooms} camere`) : ''
      const cityLabel = p.city || ''
      const zoneLabel = p.zone && !/^\d|.*\d{2,}\.\d{3,}/.test(p.zone) ? p.zone.split(',')[0].trim() : ''
      const txnLabel = p.transaction_type === 'rent' ? 'Inchiriere' : 'Vanzare'

      const productTypeParts = [propType, roomsLabel, cityLabel, zoneLabel].filter(Boolean)
      const product_type = productTypeParts.join(' > ')

      const custom_label_0 = roomsLabel
      const custom_label_1 = zoneLabel
      const custom_label_2 = cityLabel
      const custom_label_3 = txnLabel
      const custom_label_4 = p.surface_min ? `${p.surface_min} mp` : ''

      return [
        id, title, description, availability, 'new', price, link,
        image_link, additional, 'MVA Imobiliare', 'Real Estate', product_type,
        custom_label_0, custom_label_1, custom_label_2, custom_label_3, custom_label_4
      ].map(String)
    }

    const CONCURRENCY = 8
    const built: (string[] | null)[] = new Array(valid.length)
    let cursor = 0
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        const i = cursor++
        if (i >= valid.length) return
        built[i] = await buildValues(valid[i])
      }
    })
    await Promise.all(workers)
    const allValues = built.filter((v): v is string[] => v !== null)
    excluded.push(...noReachableImage)

    const csv = [headers.join(','), ...allValues.map(v => v.map(escapeCsv).join(','))].join('\n')

    if (previewMode) {
      return new Response(JSON.stringify({
        total: allValues.length,
        total_input: all.length,
        excluded_count: excluded.length,
        excluded,
        preview: Math.min(previewLimit, allValues.length),
        size_bytes: new TextEncoder().encode(csv).length,
        generated_at: new Date().toISOString(),
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
        'Cache-Control': 'public, max-age=1800',
        'X-Total-Products': String(valid.length),
        'X-Generated-At': new Date().toISOString(),
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
