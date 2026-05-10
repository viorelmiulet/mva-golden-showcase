import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://www.mvaimobiliare.ro'

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

    // Filter rows without price/image
    const valid = all.filter(p => {
      const price = Number(p.price_min)
      const hasImg = Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string'
      return price > 0 && hasImg
    })

    const headers = [
      'id', 'title', 'description', 'availability', 'condition', 'price',
      'link', 'image_link', 'additional_image_link', 'brand',
      'google_product_category', 'product_type',
      'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4'
    ]

    const buildValues = (p: any): string[] => {
      const id = p.external_id || p.id
      const title = truncate(stripHtml(p.title || 'Proprietate'), 150)
      const descSrc = p.descriere_lunga || p.description || p.title || ''
      const description = truncate(stripHtml(descSrc), 4900) || title
      const availability = p.availability_status === 'available' ? 'in stock' : 'out of stock'
      const price = `${Number(p.price_min).toFixed(2)} ${p.currency || 'EUR'}`
      const slug = buildSlug(p)
      const link = `${SITE_URL}/proprietati/${slug}`
      const imgs: string[] = Array.isArray(p.images) ? p.images.filter((u: any) => typeof u === 'string') : []
      const image_link = imgs[0] || ''
      const additional = imgs.slice(1, 11).join(',')

      const propType = p.property_type || 'Imobil'
      const roomsLabel = p.rooms ? (p.rooms <= 1 ? 'Garsoniera' : `${p.rooms} camere`) : ''
      const cityLabel = p.city || ''
      const zoneLabel = p.zone && !/^\d|.*\d{2,}\.\d{3,}/.test(p.zone) ? p.zone.split(',')[0].trim() : ''
      const txnLabel = p.transaction_type === 'rent' ? 'Inchiriere' : 'Vanzare'

      const productTypeParts = [propType, roomsLabel, cityLabel, zoneLabel].filter(Boolean)
      const product_type = productTypeParts.join(' > ')

      // custom labels (Facebook ad targeting & sets)
      const custom_label_0 = roomsLabel                           // ex: "2 camere"
      const custom_label_1 = zoneLabel                            // ex: "Militari Residence"
      const custom_label_2 = cityLabel                            // ex: "Bucuresti"
      const custom_label_3 = txnLabel                             // ex: "Vanzare" / "Inchiriere"
      const custom_label_4 = p.surface_min ? `${p.surface_min} mp` : ''

      return [
        id, title, description, availability, 'new', price, link,
        image_link, additional, 'MVA Imobiliare', 'Real Estate', product_type,
        custom_label_0, custom_label_1, custom_label_2, custom_label_3, custom_label_4
      ].map(String)
    }

    const allValues = valid.map(buildValues)
    const csv = [headers.join(','), ...allValues.map(v => v.map(escapeCsv).join(','))].join('\n')

    if (previewMode) {
      return new Response(JSON.stringify({
        total: valid.length,
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
