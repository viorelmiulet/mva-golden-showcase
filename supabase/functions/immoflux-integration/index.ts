import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Immoflux Integration Function Started ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const immofluxApiKey = Deno.env.get('IMMOFLUX_API_KEY');
    const immofluxApiUser = Deno.env.get('IMMOFLUX_API_USER');

    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);
    console.log('- IMMOFLUX_API_KEY exists:', !!immofluxApiKey);
    console.log('- IMMOFLUX_API_USER exists:', !!immofluxApiUser);

    if (!immofluxApiKey || !immofluxApiUser) {
      console.error('Missing Immoflux credentials!');
      console.error('IMMOFLUX_API_KEY:', immofluxApiKey ? 'SET' : 'NOT SET');
      console.error('IMMOFLUX_API_USER:', immofluxApiUser ? 'SET' : 'NOT SET');
      throw new Error('Immoflux API credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Request body parsing...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, propertyId, url } = requestBody;

    console.log('Immoflux integration called with action:', action);

    switch (action) {
      case 'sync_properties':
        return await syncProperties(supabase, immofluxApiKey, immofluxApiUser);
      
      case 'scrape_website':
        return await scrapeWebsiteProperties(supabase, url || 'https://imobiliaremilitari.ro/crm/properties');
      
      case 'get_property':
        return await getProperty(supabase, immofluxApiKey, immofluxApiUser, propertyId);
      
      case 'test_connection':
        return await testConnection(immofluxApiKey, immofluxApiUser);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Error in immoflux-integration function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function testConnection(apiKey: string, apiUser: string) {
  try {
    console.log('Testing connection with API Key:', apiKey?.substring(0, 10) + '...');
    console.log('Testing connection with API User:', apiUser);
    
    // Test multiple possible API endpoints
    const possibleUrls = [
      'https://api.immoflux.ro/v1/properties',
      'https://immoflux.ro/api/v1/properties',
      'https://app.immoflux.ro/api/properties',
      'https://web.immoflux.ro/api/properties'
    ];
    
    let lastError = '';
    
    for (const url of possibleUrls) {
      try {
        console.log(`Trying URL: ${url}`);
        
        const testResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-User': apiUser,
            'Content-Type': 'application/json',
          },
        });

        console.log(`Response status for ${url}:`, testResponse.status);
        console.log(`Response headers:`, Object.fromEntries(testResponse.headers.entries()));
        
        if (testResponse.ok) {
          const responseText = await testResponse.text();
          console.log(`Success response from ${url}:`, responseText.substring(0, 200));
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Connection successful to ${url}`,
              status: testResponse.status,
              url: url
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        const errorText = await testResponse.text();
        lastError = `${url}: ${testResponse.status} - ${errorText}`;
        console.log(`Error from ${url}:`, lastError);
        
      } catch (fetchError: any) {
        lastError = `${url}: Network error - ${fetchError.message}`;
        console.log(`Network error for ${url}:`, fetchError.message);
      }
    }
    
    throw new Error(`All API endpoints failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Connection test failed: ${error.message}`,
        suggestion: 'Please verify your API credentials and endpoint URL'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function syncProperties(supabase: any, apiKey: string, apiUser: string) {
  try {
    console.log('Starting property sync from Immoflux...');

    // Fetch properties from Immoflux API
    // Adjust this URL based on actual Immoflux API documentation
    const response = await fetch('https://api.immoflux.ro/v1/properties', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-User': apiUser,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received data from Immoflux:', JSON.stringify(data, null, 2));

    // Transform Immoflux data to match our catalog_offers structure
    const transformedOffers = transformImmofluxData(data);

    if (transformedOffers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found to sync',
          synced: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clear existing Immoflux offers
    await supabase
      .from('catalog_offers')
      .delete()
      .eq('project_name', 'IMMOFLUX_SYNC');

    // Insert new offers
    const { data: insertedData, error: insertError } = await supabase
      .from('catalog_offers')
      .insert(transformedOffers);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`Successfully synced ${transformedOffers.length} properties from Immoflux`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${transformedOffers.length} properties from Immoflux`,
        synced: transformedOffers.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Property sync failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Property sync failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getProperty(supabase: any, apiKey: string, apiUser: string, propertyId: string) {
  try {
    console.log('Fetching property from Immoflux:', propertyId);

    // Fetch specific property from Immoflux API
    const response = await fetch(`https://api.immoflux.ro/v1/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-User': apiUser,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const propertyData = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        property: propertyData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Get property failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Get property failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function scrapeWebsiteProperties(supabase: any, url: string) {
  try {
    console.log('Starting property scraping from website:', url);
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    // Initialize Firecrawl
    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    // Scrape the website
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true
    });

    if (!scrapeResult.success) {
      throw new Error('Failed to scrape website: ' + scrapeResult.error);
    }

    console.log('Scraping successful, parsing properties...');
    
    // Parse properties from the scraped content
    const properties = parsePropertiesFromContent(scrapeResult.markdown || '');
    
    if (properties.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found to scrape',
          scraped: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clear existing scraped offers
    await supabase
      .from('catalog_offers')
      .delete()
      .eq('project_name', 'WEBSITE_SCRAPE');

    // Insert new offers
    const { data: insertedData, error: insertError } = await supabase
      .from('catalog_offers')
      .insert(properties);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`Successfully scraped ${properties.length} properties from website`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully scraped ${properties.length} properties from ${url}`,
        scraped: properties.length,
        properties: properties
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Website scraping failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Website scraping failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

function parsePropertiesFromContent(content: string): any[] {
  const properties: any[] = [];
  
  try {
    console.log('Parsing content length:', content.length);
    
    // Enhanced regex to match property blocks with more flexibility
    const lines = content.split('\n');
    let currentProperty: any = null;
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Look for property titles (headers starting with ###)
      if (line.startsWith('### ')) {
        // If we were building a property, save it
        if (currentProperty && currentProperty.title) {
          properties.push(currentProperty);
        }
        
        // Start new property
        currentProperty = {
          title: line.replace('### ', '').trim(),
          description: '',
          location: '',
          price_min: 0,
          price_max: 0,
          surface_min: null,
          surface_max: null,
          rooms: 1,
          currency: 'EUR',
          images: [],
          features: [],
          amenities: [],
          availability_status: 'available',
          is_featured: false,
          project_name: 'WEBSITE_SCRAPE',
          contact_info: null,
          storia_link: null,
          whatsapp_catalog_id: null
        };
      }
      
      // Extract location (usually follows title)
      else if (currentProperty && line && !line.startsWith('#') && !line.match(/^\d/) && !line.startsWith('€') && currentProperty.location === '') {
        currentProperty.location = line;
      }
      
      // Extract description (paragraph after location)
      else if (currentProperty && line && !line.startsWith('#') && !line.match(/^\d/) && !line.startsWith('€') && currentProperty.description === '' && currentProperty.location !== '') {
        currentProperty.description = line;
      }
      
      // Extract numeric values (rooms, bathrooms, surface)
      else if (currentProperty && line.match(/^\d+$/)) {
        const num = parseInt(line);
        if (!currentProperty.rooms || currentProperty.rooms === 1) {
          currentProperty.rooms = num;
        } else if (!currentProperty.surface_min) {
          currentProperty.surface_min = num;
          currentProperty.surface_max = num;
        }
      }
      
      // Extract surface with "mp"
      else if (currentProperty && line.match(/(\d+)\s*mp/)) {
        const match = line.match(/(\d+)\s*mp/);
        if (match) {
          const surface = parseInt(match[1]);
          currentProperty.surface_min = surface;
          currentProperty.surface_max = surface;
        }
      }
      
      // Extract price
      else if (currentProperty && line.startsWith('€')) {
        const priceMatch = line.match(/€([\d,]+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(',', ''));
          currentProperty.price_min = price;
          currentProperty.price_max = price;
        }
      }
      
      // Extract image URLs
      else if (line.includes('![') && line.includes('](')) {
        const imageMatch = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (imageMatch && currentProperty) {
          currentProperty.images.push(imageMatch[1]);
        }
      }
      
      // Extract status keywords
      else if (currentProperty && (line === 'Nou' || line === 'Activ' || line === 'Premium' || line === 'Rezervat' || line === 'Negociere')) {
        if (line === 'Rezervat') {
          currentProperty.availability_status = 'reserved';
        } else if (line === 'Premium') {
          currentProperty.is_featured = true;
        }
      }
      
      i++;
    }
    
    // Don't forget the last property
    if (currentProperty && currentProperty.title) {
      properties.push(currentProperty);
    }
    
    console.log(`Successfully parsed ${properties.length} properties`);
    console.log('Sample property:', properties[0] ? JSON.stringify(properties[0], null, 2) : 'None');
    
    return properties;
    
  } catch (error) {
    console.error('Error parsing properties:', error);
    return [];
  }
}

function transformImmofluxData(data: any): any[] {
  try {
    // This function transforms Immoflux API response to our catalog_offers format
    // Adjust based on actual Immoflux API response structure
    
    const properties = Array.isArray(data) ? data : data.properties || data.results || [data];
    
    return properties.map((property: any) => ({
      title: property.title || property.name || 'Proprietate Immoflux',
      description: property.description || property.details || '',
      price_min: parseInt(property.price || property.price_min || property.minPrice || 0),
      price_max: parseInt(property.price_max || property.maxPrice || property.price || 0),
      surface_min: parseInt(property.surface || property.area || property.surface_min || 0),
      surface_max: parseInt(property.surface_max || property.maxArea || property.surface || 0),
      rooms: parseInt(property.rooms || property.bedrooms || property.room_count || 1),
      location: property.location || property.address || property.city || 'Locație necunoscută',
      features: Array.isArray(property.features) ? property.features : [],
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      images: property.images ? (Array.isArray(property.images) ? property.images : [property.images]) : [],
      contact_info: property.contact || property.agent || {},
      project_name: 'IMMOFLUX_SYNC',
      currency: property.currency || 'EUR',
      availability_status: property.status || 'available',
      is_featured: property.featured || false,
    }));
    
  } catch (error) {
    console.error('Data transformation failed:', error);
    return [];
  }
}