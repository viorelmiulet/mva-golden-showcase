import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.0.0'
import { importXmlWithCustomMapping } from './custom-mapping.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Request body parsing...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, propertyId, url, xml_url } = requestBody;

    console.log('Immoflux integration called with action:', action);

    // Actions that DON'T require Immoflux credentials
    const xmlActions = ['analyze_xml', 'import_xml_feed', 'import_xml_with_mapping'];
    const noCredentialsActions = [...xmlActions, 'scrape_website'];
    
    // Check credentials only for actions that need them
    if (!noCredentialsActions.includes(action)) {
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
    }

    switch (action) {
      case 'sync_properties':
        return await syncProperties(supabase, immofluxApiKey!, immofluxApiUser!);
      
      case 'scrape_website':
        return await scrapeWebsiteProperties(supabase, url || 'https://imobiliaremilitari.ro/crm/properties');
      
      case 'get_property':
        return await getProperty(supabase, immofluxApiKey!, immofluxApiUser!, propertyId);
      
      case 'analyze_xml':
        return await analyzeXmlStructure(xml_url);
      
      case 'import_xml_feed':
        return await importXmlFeed(supabase, xml_url);
      
      case 'import_xml_with_mapping':
        return await importXmlWithCustomMapping(supabase, xml_url, requestBody.field_mapping);
      
      case 'test_connection':
        return await testConnection(immofluxApiKey!, immofluxApiUser!);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error: any) {
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

  } catch (error: any) {
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

    // Insert new offers in batches and treat sitemap trigger error as non-fatal
    const batchSize = 50;
    let totalInserted = 0;
    for (let i = 0; i < transformedOffers.length; i += batchSize) {
      const batch = transformedOffers.slice(i, i + batchSize);
      const { data: batchData, error: batchError } = await supabase
        .from('catalog_offers')
        .insert(batch)
        .select();
      if (batchError) {
        if (batchError.message.includes('extensions.net.http_post') || batchError.message.includes('cross-database references')) {
          console.warn('Non-fatal trigger error during sync:', batchError.message);
          // Continue; insert likely succeeded but trigger failed
        } else {
          throw new Error(`Database insert failed: ${batchError.message}`);
        }
      } else {
        totalInserted += batchData?.length || 0;
        console.log(`Synced batch ${i / batchSize + 1} of ${Math.ceil(transformedOffers.length / batchSize)} (${batch.length} rows)`);
      }
    }

    console.log(`Successfully synced ${transformedOffers.length} properties from Immoflux`);

    // Trigger background sitemap processing
    if (transformedOffers.length > 0) {
      console.log('[immoflux-integration] Triggering sitemap queue processing');
      supabase.functions.invoke('process-sitemap-queue', { body: {} }).catch((err: any) => {
        console.warn('[immoflux-integration] Failed to trigger sitemap processing:', err);
      });
    }

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

  } catch (error: any) {
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

  } catch (error: any) {
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

    // Insert new offers in batches and treat sitemap trigger error as non-fatal
    const batchSize = 50;
    let totalInserted = 0;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      const { data: batchData, error: batchError } = await supabase
        .from('catalog_offers')
        .insert(batch)
        .select();
      if (batchError) {
        if (batchError.message.includes('extensions.net.http_post') || batchError.message.includes('cross-database references')) {
          console.warn('Non-fatal trigger error during scrape insert:', batchError.message);
          // Continue; insert likely succeeded but trigger failed
        } else {
          throw new Error(`Database insert failed: ${batchError.message}`);
        }
      } else {
        totalInserted += batchData?.length || 0;
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(properties.length / batchSize)} (${batch.length} rows)`);
      }
    }

    console.log(`Successfully scraped ${properties.length} properties from website`);

    // Trigger background sitemap processing
    if (properties.length > 0) {
      console.log('[immoflux-integration] Triggering sitemap queue processing');
      supabase.functions.invoke('process-sitemap-queue', { body: {} }).catch((err: any) => {
        console.warn('[immoflux-integration] Failed to trigger sitemap processing:', err);
      });
    }

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

  } catch (error: any) {
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
    
    const lines = content.split('\n');
    let currentProperty: any = null;
    let i = 0;
    let lookingForPrice = false;
    let lookingForRooms = false;
    
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
          project_name: 'IMOBILIAREMILITARI_SCRAPE',
          contact_info: null,
          storia_link: null,
          whatsapp_catalog_id: null
        };
        lookingForPrice = false;
        lookingForRooms = false;
      }
      
      // Extract location (Bucuresti typically appears after title)
      else if (currentProperty && line === 'Bucuresti' && !currentProperty.location) {
        currentProperty.location = line;
      }
      
      // Look for "Preț" keyword to know next line is price
      else if (currentProperty && line === 'Preț') {
        lookingForPrice = true;
      }
      
      // Look for "Camere" keyword to know next line is room count
      else if (currentProperty && line === 'Camere') {
        lookingForRooms = true;
      }
      
      // Extract price (after "Preț" keyword)
      else if (currentProperty && lookingForPrice && line.includes('EUR')) {
        const priceMatch = line.match(/([\d,\.]+)\s*EUR/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/[,\.]/g, ''));
          currentProperty.price_min = price;
          currentProperty.price_max = price;
        }
        lookingForPrice = false;
      }
      
      // Extract rooms (after "Camere" keyword)
      else if (currentProperty && lookingForRooms && line.match(/^\d+$/)) {
        currentProperty.rooms = parseInt(line);
        lookingForRooms = false;
      }
      
      // Extract longer descriptions (lines with substantial text)
      else if (currentProperty && line.length > 50 && !line.includes('![') && !line.includes('http') && !line.includes('tel:') && !line.includes('wa.me') && currentProperty.description === '') {
        currentProperty.description = line;
      }
      
      // Extract features (common amenity words)
      else if (currentProperty && (line === 'Balcon' || line === 'Parcare' || line === 'Lift' || line === 'Centrala' || line === 'TVA INCLUS !!' || line === 'Comision 0%')) {
        if (!currentProperty.features.includes(line)) {
          currentProperty.features.push(line);
        }
      }
      
      // Extract image URLs
      else if (line.includes('![') && line.includes('](')) {
        const imageMatch = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (imageMatch && currentProperty) {
          currentProperty.images.push(imageMatch[1]);
        }
      }
      
      // Extract contact information
      else if (currentProperty && (line.includes('tel:') || line.includes('wa.me'))) {
        if (!currentProperty.contact_info) {
          currentProperty.contact_info = {};
        }
        if (line.includes('tel:')) {
          const phoneMatch = line.match(/tel:(\d+)/);
          if (phoneMatch) {
            currentProperty.contact_info.phone = phoneMatch[1];
          }
        }
        if (line.includes('wa.me')) {
          const whatsappMatch = line.match(/wa\.me\/(\d+)/);
          if (whatsappMatch) {
            currentProperty.contact_info.whatsapp = whatsappMatch[1];
          }
        }
      }
      
      i++;
    }
    
    // Don't forget the last property
    if (currentProperty && currentProperty.title) {
      properties.push(currentProperty);
    }
    
    console.log(`Successfully parsed ${properties.length} properties from imobiliaremilitari.ro`);
    if (properties.length > 0) {
      console.log('Sample property:', JSON.stringify(properties[0], null, 2));
    }
    
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
    
  } catch (error: any) {
    console.error('Error transforming Immoflux data:', error);
    return [];
  }
}

// Analyze XML structure function - ENHANCED FOR IMMOFLUX
async function analyzeXmlStructure(xmlUrl: string) {
  try {
    console.log('Analyzing XML structure from:', xmlUrl);
    
    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    console.log('XML Content length:', xmlContent.length);
    
    // Basic analysis
    const preview = xmlContent.substring(0, 5000);
    
    // Extract root element
    const rootMatch = xmlContent.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/);
    const rootElement = rootMatch ? rootMatch[1] : 'Unknown';
    
    // Clean XML for analysis
    const cleanXml = xmlContent.replace(/<\?xml[^>]*\?>/gi, '')
                               .replace(/xmlns[^=]*="[^"]*"/gi, '')
                               .replace(/\s+/g, ' ');
    
    // Analyze all tags
    const allTags = cleanXml.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
    const tagCounts: { [key: string]: number } = {};
    
    allTags.forEach(tag => {
      const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
      if (tagName && tagName !== 'br' && tagName !== 'hr' && tagName !== 'img') {
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      }
    });
    
    // Find potential property container tags
    const frequentTags = Object.entries(tagCounts)
      .filter(([_, count]: [string, number]) => count > 1 && count < 1000)
      .sort(([_,a]: [string, number], [__,b]: [string, number]) => b - a)
      .slice(0, 10);
    
    // Try to detect property blocks with common patterns
    const propertyPatterns = [
      'item', 'property', 'offer', 'listing', 'oferta', 'anunt', 'imobil', 'unit', 'entry', 'ad'
    ];
    
    let detectedPattern = null;
    let blockCount = 0;
    let samplePropertyFields: string[] = [];
    let sampleProperty: any = {};
    
    for (const pattern of propertyPatterns) {
      const regex = new RegExp(`<${pattern}[^>]*>[\\s\\S]*?<\\/${pattern}>`, 'gi');
      const matches = cleanXml.match(regex);
      if (matches && matches.length > 0) {
        detectedPattern = pattern;
        blockCount = matches.length;
        
        // Extract fields from first property
        if (matches[0]) {
          const firstBlock = matches[0];
          const fieldMatches = firstBlock.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
          const fieldsInBlock = new Set<string>();
          fieldMatches.forEach(tag => {
            const fieldName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
            if (fieldName && fieldName !== pattern) {
              fieldsInBlock.add(fieldName);
              // Extract sample value
              const valueMatch = firstBlock.match(new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, 'i'));
              if (valueMatch && valueMatch[1]) {
                sampleProperty[fieldName] = valueMatch[1].trim().substring(0, 100);
              }
            }
          });
          samplePropertyFields = Array.from(fieldsInBlock);
        }
        
        break;
      }
    }
    
    // If no standard pattern found, use the most frequent tag
    if (!detectedPattern && frequentTags.length > 0) {
      const candidateTag = frequentTags[0][0];
      const regex = new RegExp(`<${candidateTag}[^>]*>[\\s\\S]*?<\\/${candidateTag}>`, 'gi');
      const matches = cleanXml.match(regex);
      if (matches && matches.length > 1) {
        detectedPattern = candidateTag;
        blockCount = matches.length;
        
        // Extract fields from first match
        if (matches[0]) {
          const firstBlock = matches[0];
          const fieldMatches = firstBlock.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
          const fieldsInBlock = new Set<string>();
          fieldMatches.forEach(tag => {
            const fieldName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
            if (fieldName && fieldName !== candidateTag) {
              fieldsInBlock.add(fieldName);
              // Extract sample value
              const valueMatch = firstBlock.match(new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, 'i'));
              if (valueMatch && valueMatch[1]) {
                sampleProperty[fieldName] = valueMatch[1].trim().substring(0, 100);
              }
            }
          });
          samplePropertyFields = Array.from(fieldsInBlock).slice(0, 20);
        }
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'XML structure analyzed successfully',
      data: {
        summary: {
          totalLength: xmlContent.length,
          rootElement: rootElement,
          detectedPropertyPattern: detectedPattern,
          estimatedPropertyCount: blockCount,
          samplePropertyFields: samplePropertyFields
        },
        sampleProperty: sampleProperty,
        tagFrequency: frequentTags,
        potentialPropertyContainers: frequentTags.filter(([tag, count]) => 
          tag.toLowerCase().includes('item') || 
          tag.toLowerCase().includes('property') || 
          tag.toLowerCase().includes('offer') ||
          tag.toLowerCase().includes('oferta') ||
          tag.toLowerCase().includes('anunt') ||
          count > 5
        ),
        preview: preview,
        recommendation: detectedPattern ? 
          `Use pattern: <${detectedPattern}> (found ${blockCount} blocks)` : 
          'No clear property pattern detected - may need manual inspection'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error analyzing XML:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Import XML feed function - OPTIMIZED FOR IMMOFLUX FORMAT
async function importXmlFeed(supabase: any, xmlUrl: string) {
  try {
    console.log('Starting XML feed import from:', xmlUrl);
    
    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    console.log('XML Content fetched, length:', xmlContent.length);
    console.log('XML preview (first 2000 chars):', xmlContent.substring(0, 2000));
    
    // Parse XML content to extract properties specifically for Immoflux format
    const properties = parseImmofluxXmlProperties(xmlContent);
    
    if (properties.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found in XML feed',
          imported: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Parsed ${properties.length} properties, clearing previous XML imports and inserting new ones...`);

    // Delete previous XML imports (source = 'api') before inserting new ones
    const { error: deleteError } = await supabase
      .from('catalog_offers')
      .delete()
      .eq('source', 'api');

    if (deleteError) {
      console.error('Error deleting previous XML imports:', deleteError.message);
      // Continue with insert even if delete fails
    } else {
      console.log('Successfully cleared previous XML imports');
    }

    // Insert new offers in batches and treat sitemap trigger error as non-fatal
    const batchSize = 50;
    let totalInserted = 0;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      const { data: batchData, error: batchError } = await supabase
        .from('catalog_offers')
        .insert(batch)
        .select();
      if (batchError) {
        if (batchError.message.includes('extensions.net.http_post') || batchError.message.includes('cross-database references')) {
          console.warn('Non-fatal trigger error during XML import:', batchError.message);
          // Continue; insert likely succeeded but trigger failed
        } else {
          throw new Error(`Database insert failed: ${batchError.message}`);
        }
      } else {
        totalInserted += batchData?.length || 0;
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(properties.length / batchSize)} (${batch.length} rows)`);
      }
    }

    console.log(`Successfully imported ${properties.length} properties from XML`);

    // Trigger background sitemap processing
    if (properties.length > 0) {
      console.log('[immoflux-integration] Triggering sitemap queue processing');
      supabase.functions.invoke('process-sitemap-queue', { body: {} }).catch((err: any) => {
        console.warn('[immoflux-integration] Failed to trigger sitemap processing:', err);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `XML import completed: ${properties.length} properties imported`,
        imported: properties.length,
        preview: properties.slice(0, 3)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('XML feed import failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `XML feed import failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Parse XML properties function - OPTIMIZED FOR IMMOFLUX BRIDGE FORMAT
function parseImmofluxXmlProperties(xmlContent: string): any[] {
  const properties: any[] = [];
  
  try {
    console.log('Parsing Immoflux XML content...');
    console.log('XML content length:', xmlContent.length);
    
    // Log a sample of the XML structure to understand the format
    const firstPart = xmlContent.substring(0, 3000);
    console.log('XML structure sample:', firstPart);
    
    // Remove XML declaration and namespaces for easier parsing
    const cleanXml = xmlContent
                               .replace(/<\?xml[^>]*\?>/gi, '')
                               .replace(/<!\[CDATA\[/g, '')
                               .replace(/\]\]>/g, '')
                               .replace(/xmlns[^=]*="[^"]*"/gi, '')
                               .replace(/\s+/g, ' ');
    
    // Immoflux bridge format typically uses <item> elements or <ofertas> or similar
    // Try specific Immoflux patterns first, then fallback to generic patterns
    let propertyBlocks = 
      cleanXml.match(/<ad[^>]*>[\s\S]*?<\/ad>/gi) ||               // Rubrikk: <ad>
      cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||           // Most common for RSS/XML bridges
      cleanXml.match(/<oferta[^>]*>[\s\S]*?<\/oferta>/gi) ||       // Spanish/Romanian format
      cleanXml.match(/<ofertas[^>]*>[\s\S]*?<\/ofertas>/gi) ||     // Multiple offers
      cleanXml.match(/<property[^>]*>[\s\S]*?<\/property>/gi) ||   // English format
      cleanXml.match(/<propriedade[^>]*>[\s\S]*?<\/propriedade>/gi) || // Portuguese
      cleanXml.match(/<immobile[^>]*>[\s\S]*?<\/immobile>/gi) ||   // Italian/French
      cleanXml.match(/<imobil[^>]*>[\s\S]*?<\/imobil>/gi) ||       // Romanian
      cleanXml.match(/<anunt[^>]*>[\s\S]*?<\/anunt>/gi) ||         // Romanian ads
      cleanXml.match(/<listing[^>]*>[\s\S]*?<\/listing>/gi) ||     // Generic listing
      cleanXml.match(/<offer[^>]*>[\s\S]*?<\/offer>/gi) ||         // Generic offer
      cleanXml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ||         // RSS entry
      cleanXml.match(/<unit[^>]*>[\s\S]*?<\/unit>/gi);             // Unit
    
    if (!propertyBlocks) {
      console.log('No property blocks found with Immoflux patterns');
      
      // Try to find any repeating elements that might contain properties
      const allTags = cleanXml.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g);
      if (allTags) {
        const tagCounts: { [key: string]: number } = {};
        allTags.forEach(tag => {
          const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
          if (tagName && tagName !== 'br' && tagName !== 'hr' && tagName !== 'img') {
            tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
          }
        });
        
        console.log('Tag frequency analysis:', tagCounts);
        
        // Find the most frequent tag that might represent properties (but has a reasonable count)
        const frequentTags = Object.entries(tagCounts)
          .filter(([_, count]: [string, number]) => count > 3 && count < 1000) // Reasonable range
          .sort(([_,a]: [string, number], [__,b]: [string, number]) => b - a);
        
        console.log('Candidate property tags:', frequentTags.slice(0, 5));
        
        // Try the most relevant tag as property container (prefer <ad>, avoid <image>)
        if (frequentTags.length > 0) {
          const preferred = frequentTags.find(([tag]) => tag.toLowerCase() === 'ad');
          const nonImage = frequentTags.find(([tag]) => !['image','img','url'].includes(tag.toLowerCase()));
          const candidateTag = (preferred?.[0]) || (nonImage?.[0]) || frequentTags[0][0];
          console.log(`Trying candidate tag: ${candidateTag}`);
          
          propertyBlocks = cleanXml.match(new RegExp(`<${candidateTag}[^>]*>[\\s\\S]*?<\\/${candidateTag}>`, 'gi'));
          
          if (propertyBlocks) {
            console.log(`Found ${propertyBlocks.length} blocks using tag: ${candidateTag}`);
          }
        }
      }
      
      if (!propertyBlocks) {
        console.log('Could not identify property structure in XML - trying full document as single property');
        // Try parsing the entire document as a single property (some feeds have only one)
        propertyBlocks = [cleanXml];
      }
    }
    
    console.log(`Found ${propertyBlocks.length} potential property blocks`);
    
    // Log first block structure for debugging
    if (propertyBlocks.length > 0) {
      console.log('First property block sample (first 800 chars):', propertyBlocks[0].substring(0, 800));
    }
    
    propertyBlocks.forEach((block, index) => {
      try {
        // Enhanced extraction with multiple field patterns
        const title = extractImmofluxField(block, ['title', 'titulo', 'titlu', 'name', 'denumire', 'subject']) || `Proprietate importata ${index + 1}`;
        const description = extractImmofluxField(block, ['description', 'desc', 'content', 'continut', 'detalii', 'details', 'body']) || '';
        const location = extractImmofluxField(block, ['location', 'address', 'adresa', 'zona', 'oras', 'city', 'localitate', 'judet']) || 'Bucuresti';
        
        // Price handling - multiple possible fields and formats
        const priceRaw = extractImmofluxField(block, ['price', 'pret', 'cost', 'valor', 'amount', 'suma']);
        const price = parseImmofluxPrice(priceRaw);
        
        // Currency detection
        const currency = extractImmofluxField(block, ['currency', 'moneda', 'valuta']) || 
                        (priceRaw && priceRaw.includes('EUR') ? 'EUR' : 
                         priceRaw && priceRaw.includes('RON') ? 'RON' : 
                         priceRaw && priceRaw.includes('LEI') ? 'LEI' : 'EUR');
        
        // Surface/area
        const surfaceRaw = extractImmofluxField(block, ['surface', 'area', 'suprafata', 'mp', 'metripatrati', 'size']);
        const surface = parseImmofluxNumber(surfaceRaw);
        
        // Rooms
        const roomsRaw = extractImmofluxField(block, ['rooms', 'camere', 'dormitoare', 'bedrooms', 'nr_camere']);
        const rooms = parseImmofluxNumber(roomsRaw) || 1;
        
        // Images - multiple patterns
        const images = extractImmofluxImages(block);
        
        // Features/amenities
        const features = extractImmofluxFeatures(block);
        
        // Contact info
        const contact = extractImmofluxContact(block);
        
        console.log(`Property ${index + 1} parsed:`, {
          title: title.substring(0, 50),
          price,
          currency,
          surface,
          rooms,
          location,
          imagesCount: images.length
        });

        // Build property with special handling for OFERTE360 <oferta> format and Rubrikk <ad> format
        const isOferta = /<oferta[\s>]/i.test(block);
        const isRubrikkAd = /<ad__headline[\s>]/i.test(block) || /<ad__price[\s>]/i.test(block);
        let property: any;

        if (isOferta) {
          const titleRoMatch = block.match(/<titlu[^>]*>[\s\S]*?<ro[^>]*>([\s\S]*?)<\/ro>[\s\S]*?<\/titlu>/i);
          const descRoMatch = block.match(/<descriere[^>]*>[\s\S]*?<ro[^>]*>([\s\S]*?)<\/ro>[\s\S]*?<\/descriere>/i);
          const titleFinal = (titleRoMatch?.[1] || title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const descFinal = (descRoMatch?.[1] || description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

          const locParts: string[] = [];
          const locLocalitate = extractImmofluxField(block, ['localitate']);
          const locJudet = extractImmofluxField(block, ['judet']);
          const locZona = extractImmofluxField(block, ['zona']);
          if (locLocalitate) locParts.push(locLocalitate);
          if (locJudet) locParts.push(locJudet);
          if (locZona) locParts.push(locZona);
          const locationFinal = (locParts.join(', ') || location || 'Bucuresti').trim();

          const devanzare = parseInt(extractImmofluxField(block, ['devanzare']) || '0');
          const priceRaw = devanzare === 1
            ? (extractImmofluxField(block, ['pretvanzare']) || extractImmofluxField(block, ['pretfaratva']))
            : (extractImmofluxField(block, ['pretinchiriere']) || extractImmofluxField(block, ['pretvanzare']) || extractImmofluxField(block, ['pretfaratva']));
          const priceParsed = parseImmofluxPrice(priceRaw);

          let currencyFinal = extractImmofluxField(block, devanzare === 1 ? ['monedavanzare'] : ['monedainchiriere'])
            || extractImmofluxField(block, ['monedavanzare','monedainchiriere'])
            || 'EUR';
          currencyFinal = currencyFinal.toUpperCase().includes('RON') ? 'LEI' : (currencyFinal.toUpperCase().includes('LEI') ? 'LEI' : 'EUR');

          const roomsParsed = parseImmofluxNumber(extractImmofluxField(block, ['nrcamere'])) || rooms || 1;
          const surfaceParsed = parseImmofluxNumber(extractImmofluxField(block, ['suprafatautila']) || extractImmofluxField(block, ['suprafataconstruita'])) || surface || null;

          const imagesFinal = extractImmofluxImages(block);

          const featuresArr: string[] = [];
          const f1 = extractImmofluxField(block, ['utilitati']);
          const f2 = extractImmofluxField(block, ['finisaje']);
          const f3 = extractImmofluxField(block, ['dotari']);
          [f1, f2, f3].filter(Boolean).forEach((s: any) => {
            (String(s).split(/[,;|]/).map(x => x.trim()).filter(Boolean)).forEach(v => featuresArr.push(v));
          });
          const compart = extractImmofluxField(block, ['tipcompartimentare']); if (compart) featuresArr.push(compart);
          const tiploc = extractImmofluxField(block, ['tiplocuinta']); if (tiploc) featuresArr.push(tiploc);
          const pretNeg = extractImmofluxField(block, ['pretnegociabil']); if (pretNeg === '1') featuresArr.push('Pret negociabil');
          const uniqueFeatures = Array.from(new Set(featuresArr)).slice(0, 10);

          const statusRaw = (extractImmofluxField(block, ['status']) || 'activ').toLowerCase();
          const availability = normalizeAvailabilityStatus(statusRaw);

          property = {
            title: titleFinal || title,
            description: descFinal || description,
            price_min: priceParsed,
            price_max: priceParsed,
            surface_min: surfaceParsed,
            surface_max: surfaceParsed,
            rooms: roomsParsed,
            location: locationFinal,
            features: uniqueFeatures,
            amenities: uniqueFeatures,
            images: imagesFinal,
            contact_info: null,
            project_name: null,
            currency: currencyFinal,
            availability_status: availability,
            is_featured: false,
            source: 'api'
          };
        } else if (isRubrikkAd) {
          // Rubrikk export (<ad> container with ad__* tags)
          const titleR = extractImmofluxField(block, ['ad__headline']) || title;
          const descR = extractImmofluxField(block, ['ad__description']) || description || '';
          const priceR = parseImmofluxPrice(extractImmofluxField(block, ['ad__price']));
          const currencyR = (extractImmofluxField(block, ['ad__price_currency']) || 'EUR').toUpperCase();

          const city = extractImmofluxField(block, ['location__municipality_city']);
          const county = extractImmofluxField(block, ['location__county']);
          const district = extractImmofluxField(block, ['location__district_quarter_part_of_town']);
          const locationFinal = [city, district, county].filter(Boolean).join(', ') || location || 'Bucuresti';

          const roomsR = parseImmofluxNumber(extractImmofluxField(block, ['real_estate__number_of_rooms'])) || rooms || 1;
          const surfaceR = parseImmofluxNumber(extractImmofluxField(block, ['real_estate__size_living_space'])) || surface || null;

          // Prefer images declared under <ad__all_imageurls><image>...</image></ad__all_imageurls>
          const imagesBlockMatch = block.match(/<ad__all_imageurls[^>]*>([\s\S]*?)<\/ad__all_imageurls>/i);
          const imagesFinal = imagesBlockMatch ? extractImmofluxImages(imagesBlockMatch[1]) : extractImmofluxImages(block);

          const contact_info: any = {};
          const company = extractImmofluxField(block, ['advertiser__name_company_name']);
          const email = extractImmofluxField(block, ['advertiser__email']);
          const mobile = extractImmofluxField(block, ['advertiser__mobile']);
          const phone = extractImmofluxField(block, ['advertiser__phone']);
          if (company) contact_info.company = company;
          if (email) contact_info.email = email;
          if (mobile) contact_info.mobile = mobile;
          if (phone) contact_info.phone = phone;
          const contactFinal = Object.keys(contact_info).length ? contact_info : null;

          property = {
            title: titleR || `Anunt ${index + 1}`,
            description: descR,
            price_min: priceR,
            price_max: priceR,
            surface_min: surfaceR,
            surface_max: surfaceR,
            rooms: roomsR,
            location: locationFinal,
            features: [],
            amenities: [],
            images: imagesFinal,
            contact_info: contactFinal,
            project_name: null,
            currency: currencyR,
            availability_status: normalizeAvailabilityStatus(extractImmofluxField(block, ['status', 'ad__status']) || 'available'),
            is_featured: false,
            source: 'api'
          };
        } else {
          property = {
            title: title,
            description: description,
            price_min: price,
            price_max: price,
            surface_min: surface,
            surface_max: surface,
            rooms: rooms,
            location: location,
            features: features,
            amenities: features, // Use same as features for now
            images: images,
            contact_info: contact,
            project_name: null,
            currency: currency,
            availability_status: normalizeAvailabilityStatus(extractImmofluxField(block, ['status', 'availability', 'stare']) || 'available'),
            is_featured: false,
            source: 'api'
          };
        }
        
        // Only add if it has minimum required data
        if (property.title && property.price_min > 0 && property.rooms > 0) {
          properties.push(property);
          console.log(`✓ Added property ${index + 1}: ${property.title} - ${property.price_min} ${property.currency}`);
        } else {
          console.log(`✗ Skipped property ${index + 1}: incomplete data`, {
            hasTitle: !!property.title,
            price: property.price_min,
            rooms: property.rooms
          });
        }
        
      } catch (blockError: any) {
        console.error(`Error parsing property block ${index + 1}:`, blockError.message);
        console.log('Problematic block:', block.substring(0, 500));
      }
    });
    
    console.log(`Successfully parsed ${properties.length} valid properties from ${propertyBlocks.length} blocks`);
    
    // Log sample of parsed properties
    if (properties.length > 0) {
      console.log('Sample parsed property:', JSON.stringify(properties[0], null, 2));
    }
    
    return properties;
    
  } catch (error: any) {
    console.error('Error parsing Immoflux XML properties:', error);
    console.log('XML content that caused error:', xmlContent.substring(0, 1000));
    return [];
  }
}

// Normalize availability status from CRM values to our standard values
function normalizeAvailabilityStatus(raw: string | null | undefined): string {
  if (!raw) return 'available';
  const s = raw.toLowerCase().trim();
  
  // Sold
  if (s.includes('vandut') || s.includes('vândut') || s.includes('sold') || s === 'vanzare finalizata' || s === 'vândut') {
    return 'sold';
  }
  // Inactive / unavailable
  if (s.includes('inactiv') || s.includes('inactive') || s.includes('unavailable') || s.includes('indisponibil') || s.includes('retras') || s.includes('expirat') || s.includes('expired')) {
    return 'inactive';
  }
  // Available
  if (s.includes('activ') || s.includes('available') || s.includes('disponibil') || s === 'active' || s === 'available') {
    return 'available';
  }
  // Default
  return 'available';
}

// Enhanced helper functions for Immoflux XML parsing
function extractImmofluxField(xmlBlock: string, possibleTags: string[]): string | null {
  for (const tag of possibleTags) {
    // Try both with and without attributes
    const patterns = [
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),  // With attributes
      new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'),       // Without attributes
      new RegExp(`<${tag}[^>]*\\/>([^<]*?)`, 'i'),              // Self-closing with content after
      new RegExp(`${tag}[:\\s]*["']?([^"'\\r\\n<]+)`, 'i')      // Key-value format
    ];
    
    for (const pattern of patterns) {
      const match = xmlBlock.match(pattern);
      if (match && match[1] && match[1].trim()) {
        let value = match[1].trim();
        // Clean HTML entities and tags
        value = value.replace(/&[a-zA-Z0-9#]+;/g, ' ')  // HTML entities
                    .replace(/<[^>]+>/g, ' ')            // HTML tags
                    .replace(/\s+/g, ' ')                // Multiple whitespace
                    .trim();
        if (value && value !== '') {
          return value;
        }
      }
    }
  }
  return null;
}

function parseImmofluxPrice(priceStr: string | null): number {
  if (!priceStr) return 0;
  
  // Remove everything except digits, dots, and commas
  const cleanPrice = priceStr.replace(/[^\d.,]/g, '');
  
  // Handle European format (123.456,78) vs American format (123,456.78)
  let finalPrice = cleanPrice;
  
  // If there's both comma and dot, assume European format if comma is last
  if (finalPrice.includes(',') && finalPrice.includes('.')) {
    if (finalPrice.lastIndexOf(',') > finalPrice.lastIndexOf('.')) {
      // European format: 123.456,78 -> 123456.78
      finalPrice = finalPrice.replace(/\./g, '').replace(',', '.');
    } else {
      // American format: 123,456.78 -> 123456.78
      finalPrice = finalPrice.replace(/,/g, '');
    }
  } else if (finalPrice.includes(',')) {
    // Only comma - could be thousands separator or decimal
    const parts = finalPrice.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal: 123,50 -> 123.50
      finalPrice = finalPrice.replace(',', '.');
    } else {
      // Likely thousands: 123,456 -> 123456
      finalPrice = finalPrice.replace(/,/g, '');
    }
  }
  
  const parsed = parseFloat(finalPrice);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function parseImmofluxNumber(numStr: string | null): number | null {
  if (!numStr) return null;
  const cleanNum = numStr.replace(/[^\d.,]/g, '');
  if (!cleanNum) return null;
  
  // Simple parsing for numbers (assume last dot/comma is decimal if <= 2 digits after)
  let finalNum = cleanNum;
  const lastDot = finalNum.lastIndexOf('.');
  const lastComma = finalNum.lastIndexOf(',');
  
  if (lastComma > lastDot && lastComma > -1) {
    const afterComma = finalNum.substring(lastComma + 1);
    if (afterComma.length <= 2) {
      finalNum = finalNum.replace(',', '.');
    } else {
      finalNum = finalNum.replace(/,/g, '');
    }
  } else {
    finalNum = finalNum.replace(/,/g, '');
  }
  
  const parsed = parseFloat(finalNum);
  return isNaN(parsed) ? null : Math.round(parsed);
}

function extractImmofluxImages(xmlBlock: string): string[] {
  const images: string[] = [];
  const imageSet = new Set<string>(); // Prevent duplicates
  
  // Multiple patterns for image URLs
  const patterns = [
    /<image[^>]*>([^<]+)<\/image>/gi,                    // <image>url</image>
    /<img[^>]+src=["']([^"']+)["']/gi,                   // <img src="url">
    /<url[^>]*>([^<]+)<\/url>/gi,                        // <url>url</url>
    /<foto[^>]*>([^<]+)<\/foto>/gi,                      // <foto>url</foto>
    /<picture[^>]*>([^<]+)<\/picture>/gi,                // <picture>url</picture>
    /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi // Direct URLs
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(xmlBlock)) !== null) {
      let url = match[1] || match[0];
      url = url.trim();
      
      // Validate URL
      if (url.startsWith('http') && (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp'))) {
        imageSet.add(url);
      }
    }
  });
  
  return Array.from(imageSet).slice(0, 15); // Limit to 15 images
}

function extractImmofluxFeatures(xmlBlock: string): string[] {
  const features: string[] = [];
  
  // Common feature patterns
  const featurePatterns = [
    /balcon/gi, /parcare/gi, /lift/gi, /centrala/gi, /gradina/gi, /terasa/gi,
    /garaj/gi, /subsol/gi, /mansarda/gi, /boiler/gi, /aer\s*conditionat/gi,
    /furnished/gi, /mobilat/gi, /internet/gi, /cable/gi, /security/gi, /securitate/gi
  ];
  
  featurePatterns.forEach(pattern => {
    if (pattern.test(xmlBlock)) {
      const match = pattern.exec(xmlBlock);
      if (match) {
        features.push(match[0].toLowerCase());
      }
    }
  });
  
  // Also extract from specific feature tags
  const featureTags = ['amenities', 'features', 'dotari', 'facilitati'];
  featureTags.forEach(tag => {
    const featureValue = extractImmofluxField(xmlBlock, [tag]);
    if (featureValue) {
      // Split by common separators
      const individualFeatures = featureValue.split(/[,;|]/).map(f => f.trim()).filter(f => f);
      features.push(...individualFeatures);
    }
  });
  
  return [...new Set(features)].slice(0, 10); // Remove duplicates, limit to 10
}

function extractImmofluxContact(xmlBlock: string): any {
  const contact: any = {};
  
  const phone = extractImmofluxField(xmlBlock, ['phone', 'telefon', 'tel', 'telephone', 'contact_phone']);
  const email = extractImmofluxField(xmlBlock, ['email', 'mail', 'contact_email', 'e_mail']);
  const agent = extractImmofluxField(xmlBlock, ['agent', 'contact_person', 'person', 'nume_agent', 'consultant']);
  const company = extractImmofluxField(xmlBlock, ['company', 'firma', 'agentie', 'agency']);
  
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (agent) contact.agent = agent;
  if (company) contact.company = company;
  
  return Object.keys(contact).length > 0 ? contact : null;
}

// Helper functions for XML parsing
function extractXmlValue(xmlBlock: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xmlBlock.match(regex);
  return match ? match[1].trim() : null;
}

function parseXmlPrice(priceStr: string | null): number {
  if (!priceStr) return 0;
  const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  return parseInt(parseFloat(cleanPrice).toString()) || 0;
}

function parseXmlNumber(numStr: string | null): number | null {
  if (!numStr) return null;
  const cleanNum = numStr.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  const parsed = parseInt(parseFloat(cleanNum).toString());
  return isNaN(parsed) ? null : parsed;
}

function extractXmlArray(xmlBlock: string, tagName: string): string[] {
  const items: string[] = [];
  const itemRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  while ((match = itemRegex.exec(xmlBlock)) !== null) {
    items.push(match[1].trim());
  }
  return items;
}

function extractXmlImages(xmlBlock: string): string[] {
  const images: string[] = [];
  const imageRegex = /<image[^>]*>([^<]+)<\/image>/gi;
  const urlRegex = /<url[^>]*>([^<]+)<\/url>/gi;
  
  let match;
  while ((match = imageRegex.exec(xmlBlock)) !== null) {
    images.push(match[1].trim());
  }
  
  while ((match = urlRegex.exec(xmlBlock)) !== null) {
    const url = match[1].trim();
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg')) {
      images.push(url);
    }
  }
  
  return images;
}

function extractXmlContact(xmlBlock: string): any {
  const contact: any = {};
  
  const phone = extractXmlValue(xmlBlock, 'phone') || extractXmlValue(xmlBlock, 'telephone');
  const email = extractXmlValue(xmlBlock, 'email') || extractXmlValue(xmlBlock, 'contact_email');
  const agent = extractXmlValue(xmlBlock, 'agent') || extractXmlValue(xmlBlock, 'contact_person');
  
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (agent) contact.agent = agent;
  
  return Object.keys(contact).length > 0 ? contact : null;
}