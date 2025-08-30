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

function extractPrice(text: string): { min: number; max: number } {
  // Look for EUR prices
  const eurMatches = text.match(/€\s*([0-9,]+(?:\.[0-9]+)?)/g);
  if (eurMatches) {
    const prices = eurMatches.map(match => {
      const cleanPrice = match.replace(/[€,\s]/g, '');
      return parseInt(cleanPrice);
    }).filter(price => !isNaN(price));
    
    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }
  }

  // Look for RON prices and convert to EUR
  const ronMatches = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*lei|([0-9,]+(?:\.[0-9]+)?)\s*RON/gi);
  if (ronMatches) {
    const prices = ronMatches.map(match => {
      const cleanPrice = match.replace(/[lei,\sRON]/gi, '');
      const ronPrice = parseInt(cleanPrice);
      return Math.round(ronPrice / 5); // Approximate RON to EUR conversion
    }).filter(price => !isNaN(price));
    
    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }
  }

  return { min: 0, max: 0 };
}

function extractSurface(text: string): { min?: number; max?: number } {
  const surfaceMatches = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*m[p²2]|([0-9,]+(?:\.[0-9]+)?)\s*mp/gi);
  if (surfaceMatches) {
    const surfaces = surfaceMatches.map(match => {
      const cleanSurface = match.replace(/[mp²2,\s]/gi, '');
      return parseInt(cleanSurface);
    }).filter(surface => !isNaN(surface) && surface > 10 && surface < 1000);
    
    if (surfaces.length > 0) {
      return {
        min: Math.min(...surfaces),
        max: Math.max(...surfaces)
      };
    }
  }
  return {};
}

function extractRooms(text: string): number {
  // Look for room patterns
  const roomMatches = text.match(/([0-9]+)\s*cam[ere]*|([0-9]+)\s*room|([0-9]+)\s*bedroom/gi);
  if (roomMatches) {
    const rooms = roomMatches.map(match => {
      const cleanRooms = match.replace(/[^0-9]/g, '');
      return parseInt(cleanRooms);
    }).filter(room => !isNaN(room) && room > 0 && room <= 10);
    
    if (rooms.length > 0) {
      return Math.max(...rooms);
    }
  }
  
  // Default to 2 rooms if not found
  return 2;
}

function extractFeatures(text: string): string[] {
  const features: string[] = [];
  
  const featureKeywords = [
    'balcon', 'terasa', 'gradina', 'parcare', 'lift', 'centrala', 
    'aer conditionat', 'gresie', 'faience', 'parchet', 'laminat',
    'mobilat', 'utilat', 'semifinisat', 'modern', 'renovat'
  ];

  featureKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      features.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });

  return features;
}

function extractImages(html: string): string[] {
  const images: string[] = [];
  
  // Look for img tags with src attributes
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  if (imgMatches) {
    imgMatches.forEach(imgTag => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let src = srcMatch[1];
        
        // Make relative URLs absolute
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = 'https://www.imobiliare.ro' + src;
        }
        
        // Filter out icons, logos, and small images
        if (!src.includes('icon') && 
            !src.includes('logo') && 
            !src.includes('sprite') &&
            (src.includes('jpg') || src.includes('jpeg') || src.includes('png') || src.includes('webp'))) {
          images.push(src);
        }
      }
    });
  }

  return Array.from(new Set(images)).slice(0, 10); // Remove duplicates and limit to 10 images
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

    // Fetch the webpage
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`);
    }

    const html = await response.text();
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

    // Extract title
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // Clean up common patterns
      title = title.replace(/\s*-\s*(imobiliare\.ro|OLX|Anunturi).*$/i, '');
    }

    // Extract description
    let description = '';
    const descMatches = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (descMatches) {
      description = descMatches[1];
    } else {
      // Try to find description in content
      const contentMatch = text.match(/descriere[^.]*[:.]\s*([^.]{50,300})/i);
      if (contentMatch) {
        description = contentMatch[1].trim();
      }
    }

    // Extract location
    let location = '';
    const locationPatterns = [
      /sector\s*[0-9]+/gi,
      /bucuresti[^,]*/gi,
      /romania[^,]*/gi
    ];

    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        location = matches[0].trim();
        break;
      }
    }

    // Extract other data
    const prices = extractPrice(text);
    const surfaces = extractSurface(text);
    const rooms = extractRooms(text);
    const features = extractFeatures(text);
    const images = extractImages(html);

    const scrapedProperty: ScrapedProperty = {
      title: title || 'Proprietate',
      description: description || 'Descriere indisponibilă',
      location: location || 'București',
      images,
      price_min: prices.min,
      price_max: prices.max,
      surface_min: surfaces.min,
      surface_max: surfaces.max,
      rooms,
      features
    };

    console.log('Scraped property:', scrapedProperty);

    return new Response(
      JSON.stringify({ 
        success: true, 
        property: scrapedProperty 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

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