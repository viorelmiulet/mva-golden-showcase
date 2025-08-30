import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface OLXOffer {
  title: string;
  price: number;
  surface: number;
  rooms: number;
  location: string;
  features: string[];
  description: string;
  olxLink: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY environment variable is not set');
      throw new Error('Firecrawl API key not configured');
    }

    console.log('Starting OLX offers update...');

    // Crawl OLX specifically for apartments in Bucharest (excluding houses and land)
    const searchUrls = [
      // Apartamente Bucuresti - toate sectoarele, exclusiv apartamente si garsoniere
      'https://www.olx.ro/d/imobiliare/apartamente-garsoniere-de-vanzare/bucuresti/?search%5Bfilter_enum_rooms%5D%5B0%5D=one&search%5Bfilter_enum_rooms%5D%5B1%5D=two&search%5Bfilter_enum_rooms%5D%5B2%5D=three&search%5Bfilter_enum_rooms%5D%5B3%5D=four&search%5Bfilter_float_price%3Afrom%5D=15000&search%5Bfilter_float_price%3Ato%5D=200000',
      // Garsoniere Bucuresti
      'https://www.olx.ro/d/imobiliare/apartamente-garsoniere-de-vanzare/bucuresti/?search%5Bfilter_enum_rooms%5D%5B0%5D=one&search%5Bfilter_float_price%3Afrom%5D=15000&search%5Bfilter_float_price%3Ato%5D=100000'
    ];

    let allOffers: OLXOffer[] = [];

    for (const url of searchUrls) {
      try {
        console.log(`Crawling URL: ${url}`);
        
        // Start crawl job
        const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            crawlerOptions: {
              includes: [url],
              limit: 1
            },
            pageOptions: {
              onlyMainContent: true,
              includeHtml: true
            }
          })
        });

        if (!crawlResponse.ok) {
          const errorText = await crawlResponse.text();
          console.error('Firecrawl API error for URL:', url, errorText);
          continue;
        }

        const crawlData = await crawlResponse.json();
        console.log('Crawl started for URL:', url, 'Job ID:', crawlData.jobId);

        // Wait for crawl to complete
        let crawlStatus = 'active';
        let attempts = 0;
        const maxAttempts = 30;

        while (crawlStatus === 'active' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;

          const statusResponse = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${crawlData.jobId}`, {
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
            }
          });

          if (!statusResponse.ok) {
            console.error(`Failed to get crawl status for job ${crawlData.jobId}`);
            break;
          }

          const statusData = await statusResponse.json();
          crawlStatus = statusData.status;
          console.log(`Crawl status: ${crawlStatus}, attempt ${attempts}/${maxAttempts}`);

          if (crawlStatus === 'completed') {
            console.log('Crawl completed, processing results...');
            
            const offers = parseOLXOffers(statusData.data[0]?.markdown || '');
            console.log(`Found ${offers.length} offers from ${url}`);
            allOffers = allOffers.concat(offers);
            break;
          } else if (crawlStatus === 'failed') {
            console.error('Crawl job failed for URL:', url);
            break;
          }
        }

        if (attempts >= maxAttempts) {
          console.error('Crawl job timed out for URL:', url);
        }

      } catch (error) {
        console.error('Error crawling URL:', url, error);
        continue;
      }
    }

    console.log(`Total offers found: ${allOffers.length}`);

    if (allOffers.length > 0) {
      // Clear existing OLX offers to avoid duplicates
      const { error: deleteError } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('project_name', 'OLX OFFERS');

      if (deleteError) {
        console.error('Error deleting old OLX offers:', deleteError);
      } else {
        console.log('Cleared existing OLX offers');
      }

      // Insert new offers
      const { data: insertedOffers, error: insertError } = await supabase
        .from('catalog_offers')
        .insert(allOffers.map(offer => ({
          title: offer.title,
          description: offer.description,
          price_min: offer.price,
          price_max: offer.price,
          surface_min: offer.surface,
          surface_max: offer.surface,
          rooms: offer.rooms,
          location: offer.location,
          project_name: 'OLX OFFERS',
          features: offer.features,
          amenities: ['Verificat OLX', 'Diverse opțiuni', 'Prețuri competitive'],
          availability_status: 'available',
          is_featured: offer.price < 80000,
          whatsapp_catalog_id: offer.olxLink
        })));

      if (insertError) {
        console.error('Error inserting OLX offers:', insertError);
        throw insertError;
      }

      console.log(`Successfully inserted ${allOffers.length} OLX offers`);

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully updated ${allOffers.length} offers from OLX`,
        offers: allOffers.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'No offers found in the scraped OLX content'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in update-olx-offers function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseOLXOffers(markdown: string): OLXOffer[] {
  const offers: OLXOffer[] = [];
  console.log('Parsing OLX markdown content for offers...');

  // Look for OLX offer links
  const linkPattern = /\[([^\]]+)\]\((https:\/\/www\.olx\.ro\/d\/oferta\/[^\s)]+)\)/g;
  const matches = [...markdown.matchAll(linkPattern)];

  for (const match of matches) {
    try {
      const [fullMatch, title, olxLink] = match;
      
      // Skip if not a valid property offer
      if (!title || !olxLink || !olxLink.includes('/oferta/')) continue;
      
      // Skip if title doesn't seem to be about apartments (more strict filtering)
      const titleLower = title.toLowerCase();
      if (!titleLower.includes('apartament') && 
          !titleLower.includes('garsonier') &&
          !titleLower.includes('cam')) continue;
      
      // Exclude houses, land, commercial spaces, etc.
      if (titleLower.includes('casa') ||
          titleLower.includes('vila') ||
          titleLower.includes('teren') ||
          titleLower.includes('spatiu comercial') ||
          titleLower.includes('birou') ||
          titleLower.includes('magazin') ||
          titleLower.includes('hala') ||
          titleLower.includes('depozit')) continue;

      // Find the surrounding context for this offer
      const matchIndex = markdown.indexOf(fullMatch);
      const contextStart = Math.max(0, matchIndex - 800);
      const contextEnd = Math.min(markdown.length, matchIndex + 1200);
      const context = markdown.slice(contextStart, contextEnd);

      // Extract price from context - look for various OLX price patterns
      const pricePatterns = [
        /(\d+\.?\d*)\s*€/g,
        /(\d+\.?\d*)\s*EUR/g,
        /(\d+\.?\d*)\s*euro/gi,
        /Preț:\s*(\d+\.?\d*)/g,
        /(\d{2,6})\s*lei/gi
      ];
      
      let price = 0;
      for (const pattern of pricePatterns) {
        const priceMatches = [...context.matchAll(pattern)];
        for (const priceMatch of priceMatches) {
          let priceValue = parseFloat(priceMatch[1].replace(/\./g, ''));
          
          // Convert LEI to EUR if necessary (approximate rate 1 EUR = 5 LEI)
          if (pattern.toString().includes('lei')) {
            priceValue = Math.round(priceValue / 5);
          }
          
          if (priceValue >= 15000 && priceValue <= 200000) {
            price = priceValue;
            break;
          }
        }
        if (price > 0) break;
      }
      
      if (price === 0) continue;

      // Extract rooms from title and context
      let rooms = 1;
      const roomsPatterns = [
        /(\d+)\s*cam/i,
        /(\d+)\s*room/i,
        /apartament\s*(\d+)/i,
        /(garsonier|studio)/i
      ];
      
      for (const pattern of roomsPatterns) {
        const roomMatch = (title + ' ' + context).match(pattern);
        if (roomMatch) {
          if (roomMatch[1] && !isNaN(parseInt(roomMatch[1]))) {
            rooms = parseInt(roomMatch[1]);
          } else if (roomMatch[1] && (roomMatch[1].toLowerCase().includes('garsonier') || roomMatch[1].toLowerCase().includes('studio'))) {
            rooms = 1;
          }
          break;
        }
      }
      
      rooms = Math.min(Math.max(rooms, 1), 4); // Clamp between 1-4

      // Extract surface from context
      const surfacePatterns = [
        /(\d+)\s*mp/i,
        /(\d+)\s*m²/i,
        /(\d+)\s*metri/i,
        /Suprafața[:\s]*(\d+)/i
      ];
      
      let surface = 0;
      for (const pattern of surfacePatterns) {
        const surfaceMatch = context.match(pattern);
        if (surfaceMatch && parseInt(surfaceMatch[1]) > 10 && parseInt(surfaceMatch[1]) < 300) {
          surface = parseInt(surfaceMatch[1]);
          break;
        }
      }
      
      // Default surface based on rooms if not found
      if (surface === 0) {
        surface = rooms === 1 ? 40 : rooms === 2 ? 55 : rooms === 3 ? 75 : 90;
      }

      // Extract location from context (focus on Bucharest sectors and areas)
      let location = 'București';
      const locationPatterns = [
        /(Sectorul\s*[1-6][^,\n]*)/i,
        /(Militari[^,\n]*)/i,
        /(Drumul Taberei[^,\n]*)/i,
        /(Titan[^,\n]*)/i,
        /(Pantelimon[^,\n]*)/i,
        /(Colentina[^,\n]*)/i,
        /(Bucuresti[^,\n]*)/i,
        /(Centrul Vechi[^,\n]*)/i,
        /(Herastrau[^,\n]*)/i,
        /(Aviatorilor[^,\n]*)/i,
        /(Amzei[^,\n]*)/i
      ];
      
      for (const pattern of locationPatterns) {
        const locationMatch = context.match(pattern);
        if (locationMatch) {
          location = locationMatch[1].trim();
          break;
        }
      }

      // Create features based on title and context (enhanced for Bucharest apartments)
      const features = [];
      const featureKeywords = {
        'decomandat': 'Apartament decomandat',
        'semidecomandat': 'Semidecomandat',
        'modern': 'Finisaje moderne',
        'renovat': 'Recent renovat',
        'mobilat': 'Mobilat',
        'nemobilat': 'Nemobilat',
        'centrala': 'Centrală termică',
        'balcon': 'Balcon',
        'terasa': 'Terasă',
        'parcare': 'Loc de parcare',
        'lift': 'Lift',
        'etaj': 'Etaj intermediar',
        'parter': 'La parter',
        'mansarda': 'La mansardă',
        'metrou': 'Aproape de metrou',
        'parc': 'Aproape de parc'
      };
      
      const fullText = (title + ' ' + context).toLowerCase();
      for (const [keyword, feature] of Object.entries(featureKeywords)) {
        if (fullText.includes(keyword)) {
          features.push(feature);
        }
      }
      
      // Add default features for Bucharest apartments
      if (features.length === 0) {
        features.push('Apartament București', 'Zonă centrală');
      }
      
      // Always add location-specific features
      features.push('Apartament București');

      const offer: OLXOffer = {
        title: title.trim(),
        price: price,
        surface: surface,
        rooms: rooms,
        location: location,
        features: features,
        description: `Apartament ${rooms} ${rooms === 1 ? 'cameră' : 'camere'} în ${location}, ${surface}m². ${title.trim()}. Preț: €${price.toLocaleString()}.`,
        olxLink: olxLink
      };

      offers.push(offer);
      console.log(`Parsed Bucharest apartment: ${title} - €${price.toLocaleString()} - ${rooms} camere - ${surface}m² - ${location}`);

    } catch (error) {
      console.error('Error parsing OLX offer:', error);
      continue;
    }
  }

  console.log(`Successfully parsed ${offers.length} Bucharest apartments from OLX`);
  return offers;
}