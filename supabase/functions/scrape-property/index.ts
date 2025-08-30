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

  // OBLIGATORIU: Price extraction - Multiple strategies (DOAR EUR)
  let price_min = 0;
  let price_max = 0;
  
  // Strategy 1: EUR format - prioritate maximă
  const eurPriceMatch = text.match(/€\s*([0-9.,]+)|([0-9.,]+)\s*€/gi);
  if (eurPriceMatch) {
    for (const match of eurPriceMatch) {
      const priceStr = match.replace(/[€\s.,]/g, '');
      const price = parseInt(priceStr);
      if (price > 10000 && price < 10000000) { // Valid EUR property price
        price_min = price_max = price;
        console.log(`Found EUR price: ${price}`);
        break;
      }
    }
  }

  // Strategy 2: LEI format (convert to EUR) - DOAR dacă nu avem EUR
  if (price_min === 0) {
    const leiPriceMatch = text.match(/([0-9.,]+)\s*(lei|ron)\b/gi);
    if (leiPriceMatch) {
      for (const match of leiPriceMatch) {
        const priceStr = match.replace(/[lei|ron\s.,]/gi, '');
        const leiPrice = parseInt(priceStr);
        if (leiPrice > 50000 && leiPrice < 50000000) { // Valid LEI price range
          // Convert LEI to EUR (aproximativ 1 EUR = 5 LEI)
          price_min = price_max = Math.round(leiPrice / 5);
          console.log(`Converted ${leiPrice} LEI to ${price_min} EUR`);
          break;
        }
      }
    }
  }

  // Strategy 3: Look for price patterns in structured data or meta tags
  if (price_min === 0) {
    const metaPriceMatch = html.match(/price['":\s]*([0-9.,]+)/gi);
    if (metaPriceMatch) {
      for (const match of metaPriceMatch) {
        const priceStr = match.replace(/[^0-9]/g, '');
        const price = parseInt(priceStr);
        if (price > 10000 && price < 10000000) {
          price_min = price_max = price;
          console.log(`Found meta price: ${price} EUR`);
          break;
        }
      }
    }
  }

  // Strategy 4: Generic number patterns with context
  if (price_min === 0) {
    const pricePatterns = [
      /pret[^0-9]*([0-9.,]+)/gi,
      /cost[^0-9]*([0-9.,]+)/gi,
      /([0-9]{4,7})\s*(?:eur|euro|€)/gi,
      /([0-9]{4,7})\s*(?!mp|m²|metri|camere|cam|room)/g // Numbers 4-7 digits not followed by area/room indicators
    ];
    
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const priceStr = match.replace(/[^0-9]/g, '');
          const price = parseInt(priceStr);
          // Assume it's EUR if reasonable range
          if (price > 15000 && price < 5000000) {
            price_min = price_max = price;
            console.log(`Found price pattern: ${price} EUR`);
            break;
          }
        }
        if (price_min > 0) break;
      }
    }
  }

  // OBLIGATORIU: Surface extraction - Multiple strategies  
  let surface_min: number | undefined;
  let surface_max: number | undefined;
  
  // Strategy 1: Direct mp/m² patterns
  const surfacePatterns = [
    /([0-9]+)\s*m[p²2]/gi,
    /suprafata[^0-9]*([0-9]+)/gi,
    /([0-9]+)\s*mp/gi,
    /([0-9]+)\s*metri/gi,
    /([0-9]{2,3})\s*(?=\s*(?:mp|m²|metri|suprafata))/gi // 2-3 digits before area keywords
  ];

  for (const pattern of surfacePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const surfaceStr = match.replace(/[^0-9]/g, '');
        const surface = parseInt(surfaceStr);
        if (surface > 15 && surface < 500) { // Realistic surface range
          surface_min = surface_max = surface;
          console.log(`Found surface: ${surface} mp`);
          break;
        }
      }
      if (surface_min) break;
    }
  }

  // OBLIGATORIU: Rooms extraction - Multiple strategies
  let rooms = 0;
  
  // Strategy 1: Direct room patterns
  const roomPatterns = [
    /([0-9]+)\s*cam/gi,
    /([0-9]+)\s*camera/gi,
    /([0-9]+)\s*rooms/gi,
    /garsoniera/gi, // Special case for studio
    /([1-5])\s*(?=\s*(?:cam|camera|rooms))/gi // 1-5 digits before room keywords
  ];

  for (const pattern of roomPatterns) {
    if (pattern.source.includes('garsoniera')) {
      if (text.toLowerCase().includes('garsoniera')) {
        rooms = 1;
        console.log('Found garsoniera (1 room)');
        break;
      }
    } else {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const roomStr = match.replace(/[^0-9]/g, '');
          const roomCount = parseInt(roomStr);
          if (roomCount > 0 && roomCount <= 10) { // Valid room range
            rooms = roomCount;
            console.log(`Found rooms: ${roomCount}`);
            break;
          }
        }
        if (rooms > 0) break;
      }
    }
  }

  // Strategy 2: Look in structured data and meta tags
  if (rooms === 0) {
    const metaRoomsMatch = html.match(/rooms?['":\s]*([0-9]+)/gi);
    if (metaRoomsMatch) {
      for (const match of metaRoomsMatch) {
        const roomStr = match.replace(/[^0-9]/g, '');
        const roomCount = parseInt(roomStr);
        if (roomCount > 0 && roomCount <= 10) {
          rooms = roomCount;
          console.log(`Found meta rooms: ${roomCount}`);
          break;
        }
      }
    }
  }

  // Strategy 3: Look for apartment type indicators
  if (rooms === 0) {
    if (text.toLowerCase().includes('studio') || text.toLowerCase().includes('garsoniera')) {
      rooms = 1;
      console.log('Found studio/garsoniera indicator');
    } else if (text.toLowerCase().includes('apartament')) {
      // Look for numbers near apartament
      const apartmentMatch = text.match(/apartament[^0-9]*([1-5])/gi);
      if (apartmentMatch) {
        const roomStr = apartmentMatch[0].replace(/[^0-9]/g, '');
        const roomCount = parseInt(roomStr);
        if (roomCount > 0 && roomCount <= 5) {
          rooms = roomCount;
          console.log(`Found apartment rooms: ${roomCount}`);
        }
      }
    }
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

  // Improved image extraction - multiple strategies
  const images: string[] = [];
  const imageUrls = new Set<string>();
  
  // Strategy 1: Standard img tags
  const imgMatches = html.match(/<img[^>]+>/gi);
  if (imgMatches) {
    imgMatches.forEach(imgTag => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const dataSrcMatch = imgTag.match(/data-src=["']([^"']+)["']/i);
      const srcSetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
      
      [srcMatch?.[1], dataSrcMatch?.[1], srcSetMatch?.[1]].forEach(src => {
        if (src) {
          let cleanSrc = src.split(',')[0].split(' ')[0]; // Take first URL from srcset
          if (cleanSrc.startsWith('//')) {
            cleanSrc = 'https:' + cleanSrc;
          } else if (cleanSrc.startsWith('/')) {
            const urlObj = new URL(html.includes('olx.ro') ? 'https://www.olx.ro' : 'https://www.imobiliare.ro');
            cleanSrc = urlObj.origin + cleanSrc;
          }
          
          // Better filtering for property images
          if (cleanSrc.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) && 
              !cleanSrc.match(/(logo|icon|sprite|avatar|btn|button)/i) &&
              cleanSrc.length > 20) {
            imageUrls.add(cleanSrc);
          }
        }
      });
    });
  }
  
  // Strategy 2: Look for specific OLX/Imobiliare patterns
  const olxImagePatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/gi);
  if (olxImagePatches) {
    olxImagePatches.forEach(url => {
      if (!url.match(/(logo|icon|sprite|avatar)/i) && url.length > 30) {
        imageUrls.add(url);
      }
    });
  }
  
  // Strategy 3: CSS background images
  const bgMatches = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi);
  if (bgMatches) {
    bgMatches.forEach(bgMatch => {
      const urlMatch = bgMatch.match(/url\(["']?([^"')]+)["']?\)/i);
      if (urlMatch && urlMatch[1]) {
        let src = urlMatch[1];
        if (src.startsWith('//')) {
          src = 'https:' + src;
        }
        if (src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) && !src.match(/(logo|icon)/i)) {
          imageUrls.add(src);
        }
      }
    });
  }
  
  // Convert set to array and limit to prevent timeout
  const finalImages = Array.from(imageUrls).slice(0, 10);

  // VALIDARE OBLIGATORIE - verifică că avem datele esențiale
  const validationErrors: string[] = [];
  
  if (price_min === 0) {
    validationErrors.push('Prețul nu a putut fi găsit');
  }
  
  if (!surface_min || surface_min === 0) {
    validationErrors.push('Suprafața nu a putut fi găsită');  
  }
  
  if (rooms === 0) {
    validationErrors.push('Numărul de camere nu a putut fi găsit');
  }

  // Log pentru debugging
  console.log(`Validation results for "${title}":`, {
    price_min,
    surface_min, 
    rooms,
    errors: validationErrors
  });

  if (validationErrors.length > 0) {
    const errorMsg = `Date obligatorii lipsă pentru "${title}": ${validationErrors.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return {
    title: title || 'Proprietate',
    description: description || 'Descriere indisponibilă',
    location,
    images: finalImages,
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