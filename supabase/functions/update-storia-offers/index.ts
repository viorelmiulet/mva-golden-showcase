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

interface StoryOffer {
  title: string;
  price: number;
  surface: number;
  rooms: number;
  location: string;
  features: string[];
  description: string;
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

    console.log('Starting Storia offers update...');

    // Crawl the Storia MVA page
    const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.storia.ro/ro/companii/agentii/mva-imobiliare-ID4660679',
        crawlerOptions: {
          includes: ['https://www.storia.ro/ro/companii/agentii/mva-imobiliare-ID4660679'],
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
      console.error('Firecrawl API error:', errorText);
      throw new Error(`Firecrawl API error: ${crawlResponse.status}`);
    }

    const crawlData = await crawlResponse.json();
    console.log('Crawl started, job ID:', crawlData.jobId);

    // Wait for crawl to complete and get results
    let crawlStatus = 'active';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait time

    while (crawlStatus === 'active' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      const statusResponse = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${crawlData.jobId}`, {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to get crawl status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      crawlStatus = statusData.status;
      console.log(`Crawl status: ${crawlStatus}, attempt ${attempts}/${maxAttempts}`);

      if (crawlStatus === 'completed') {
        console.log('Crawl completed, processing results...');
        
        // Parse the content for offers
        const offers = parseStoryOffers(statusData.data[0]?.markdown || '');
        console.log(`Found ${offers.length} offers to process`);

        if (offers.length > 0) {
          // Clear existing Militari Residence offers to avoid duplicates
          const { error: deleteError } = await supabase
            .from('catalog_offers')
            .delete()
            .eq('project_name', 'MILITARI RESIDENCE');

          if (deleteError) {
            console.error('Error deleting old offers:', deleteError);
          } else {
            console.log('Cleared existing Militari Residence offers');
          }

          // Insert new offers
          const { data: insertedOffers, error: insertError } = await supabase
            .from('catalog_offers')
            .insert(offers.map(offer => ({
              title: offer.title,
              description: offer.description,
              price_min: offer.price,
              price_max: offer.price,
              surface_min: offer.surface,
              surface_max: offer.surface,
              rooms: offer.rooms,
              location: offer.location,
              project_name: 'MILITARI RESIDENCE',
              features: offer.features,
              amenities: ['Complex rezidențial modern', 'Zonă dezvoltată', 'Acces transport public'],
              availability_status: 'available',
              is_featured: offer.price < 70000 // Feature lower priced offers
            })));

          if (insertError) {
            console.error('Error inserting offers:', insertError);
            throw insertError;
          }

          console.log(`Successfully inserted ${offers.length} offers`);

          return new Response(JSON.stringify({
            success: true,
            message: `Successfully updated ${offers.length} offers from Storia`,
            offers: offers.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            message: 'No offers found in the scraped content'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (crawlStatus === 'failed') {
        throw new Error('Crawl job failed');
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Crawl job timed out after 5 minutes');
    }

  } catch (error) {
    console.error('Error in update-storia-offers function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseStoryOffers(markdown: string): StoryOffer[] {
  const offers: StoryOffer[] = [];
  console.log('Parsing markdown content for offers...');

  // Split content by offer patterns
  const offerSections = markdown.split(/(?=\d+\s*\/\s*\d+.*?€)/);

  for (const section of offerSections) {
    try {
      // Extract price
      const priceMatch = section.match(/(\d+\s*\d*)\s*€/);
      if (!priceMatch) continue;
      
      const price = parseInt(priceMatch[1].replace(/\s/g, ''));
      if (price < 20000 || price > 200000) continue; // Reasonable price range

      // Extract title/description
      const titleMatch = section.match(/\[([^\]]+)\]/);
      if (!titleMatch) continue;
      
      const title = titleMatch[1].trim();

      // Extract rooms
      let rooms = 1;
      if (title.toLowerCase().includes('2 cam') || title.toLowerCase().includes('doua cam')) {
        rooms = 2;
      } else if (title.toLowerCase().includes('3 cam') || title.toLowerCase().includes('trei cam')) {
        rooms = 3;
      } else if (title.toLowerCase().includes('garso') || title.toLowerCase().includes('1 cam')) {
        rooms = 1;
      }

      // Extract surface
      const surfaceMatch = section.match(/(\d+)m²/);
      const surface = surfaceMatch ? parseInt(surfaceMatch[1]) : (rooms === 1 ? 35 : rooms === 2 ? 50 : 75);

      // Extract location
      const locationMatch = section.match(/(Militari[^,]*,\s*[^,]+,\s*[^,]+)/);
      const location = locationMatch ? locationMatch[1] : 'Militari, Sectorul 6, Bucuresti';

      // Create features based on title content
      const features = [];
      if (title.toLowerCase().includes('decomandat')) features.push('Apartament decomandat');
      if (title.toLowerCase().includes('imediata')) features.push('Mutare imediată');
      if (title.toLowerCase().includes('2026')) features.push('Finalizare 2026');
      if (title.toLowerCase().includes('etaj')) {
        const etajMatch = section.match(/(\d+)\s*etaj/);
        if (etajMatch) features.push(`Etaj ${etajMatch[1]}`);
      }
      
      features.push('Finisaje moderne');
      if (rooms === 1) features.push('Compact și funcțional');
      if (rooms >= 2) features.push('Spațios');

      const offer: StoryOffer = {
        title: title,
        price: price,
        surface: surface,
        rooms: rooms,
        location: location,
        features: features,
        description: `${title} în complexul Militari Residence. Suprafață ${surface}m², ${rooms} ${rooms === 1 ? 'cameră' : 'camere'}.`
      };

      offers.push(offer);
      console.log(`Parsed offer: ${title} - ${price}€`);

    } catch (error) {
      console.error('Error parsing offer section:', error);
      continue;
    }
  }

  return offers;
}