import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedProperty {
  title: string;
  description: string;
  location: string;
  images: string[];
  price_min: number;
  price_max: number;
  surface_min?: number;
  surface_max?: number;
  rooms: number;
  features: string[];
}

function extractQuickly(html: string, text: string): ScrapedProperty {
  // Quick title extraction
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/\s*-\s*(imobiliare\.ro|OLX|Anunturi).*$/i, '');
  }

  // Quick description extraction
  let description = '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,200})/i);
  if (descMatch) {
    description = descMatch[1];
  }

  // Quick location extraction
  let location = 'București';
  const locationMatch = text.match(/(sector\s*[0-9]+|bucuresti[^,]*)/i);
  if (locationMatch) {
    location = locationMatch[0].trim();
  }

  // Quick price extraction - focus on EUR
  let price_min = 0;
  let price_max = 0;
  const priceMatch = text.match(/€\s*([0-9.,]+)|([0-9.,]+)\s*€/i);
  if (priceMatch) {
    const priceStr = (priceMatch[1] || priceMatch[2]).replace(/[.,]/g, '');
    price_min = price_max = parseInt(priceStr) || 0;
  }

  // Quick surface extraction
  let surface_min: number | undefined;
  let surface_max: number | undefined;
  const surfaceMatch = text.match(/([0-9]+)\s*m[p²2]/i);
  if (surfaceMatch) {
    const surface = parseInt(surfaceMatch[1]);
    if (surface > 10 && surface < 500) {
      surface_min = surface_max = surface;
    }
  }

  // Quick rooms extraction
  let rooms = 2;
  const roomMatch = text.match(/([0-9]+)\s*cam/i);
  if (roomMatch) {
    rooms = parseInt(roomMatch[1]) || 2;
  }

  // Quick features extraction - only check most common ones
  const features: string[] = [];
  const quickFeatures = ['balcon', 'parcare', 'lift', 'centrala'];
  const textLower = text.toLowerCase();
  quickFeatures.forEach(feature => {
    if (textLower.includes(feature)) {
      features.push(feature.charAt(0).toUpperCase() + feature.slice(1));
    }
  });

  // Quick image extraction - limit to first few images found
  const images: string[] = [];
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*/gi);
  if (imgMatches && imgMatches.length > 0) {
    for (let i = 0; i < Math.min(imgMatches.length, 3); i++) {
      const srcMatch = imgMatches[i].match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let src = srcMatch[1];
        if (src.startsWith('//')) {
          src = 'https:' + src;
        }
        if (src.includes('jpg') || src.includes('jpeg') || src.includes('png')) {
          images.push(src);
        }
      }
    }
  }

  return {
    title: title || 'Proprietate',
    description: description || 'Descriere indisponibilă',
    location,
    images,
    price_min,
    price_max,
    surface_min,
    surface_max,
    rooms,
    features
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Scraping property from URL:', url);

    // Set up timeout to prevent CPU time exceeded error
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

    try {
      // Fetch with timeout
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      // Get HTML but limit size to prevent memory issues
      const html = await response.text();
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 50000); // Limit text size

      clearTimeout(timeoutId);

      // Quick extraction to avoid timeouts
      const property = extractQuickly(html, text);

      console.log('Scraped property:', property);

      return new Response(
        JSON.stringify({ 
          success: true, 
          property 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - site took too long to respond');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error scraping property:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to scrape property' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});