import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Facebook Catalog Import Function Started ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Request body parsing...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, csvData, feedUrl, feedType } = requestBody;

    console.log('Facebook Catalog Import called with action:', action);

    if (action === 'import_csv') {
      return await importFromCSV(supabase, csvData);
    }

    if (action === 'validate_csv') {
      return await validateCSV(csvData);
    }

    if (action === 'import_from_url') {
      return await importFromURL(supabase, feedUrl, feedType);
    }

    if (action === 'test_url') {
      return await testURL(feedUrl);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Facebook Catalog Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function validateCSV(csvData: string) {
  console.log('Validating CSV data...');
  
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV trebuie să conțină cel puțin un header și o linie de date');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    console.log('CSV Headers found:', headers);

    // Required Facebook Catalog fields mapping
    const requiredFields = {
      'id': ['id', 'property_id', 'listing_id'],
      'title': ['title', 'name', 'property_name'],
      'description': ['description', 'desc'],
      'availability': ['availability', 'status', 'availability_status'],
      'condition': ['condition', 'property_condition'],
      'price': ['price', 'price_min', 'cost'],
      'link': ['link', 'url', 'property_url'],
      'image_link': ['image_link', 'main_image', 'primary_image'],
      'brand': ['brand', 'developer', 'agency']
    };

    // Optional fields mapping
    const optionalFields = {
      'additional_image_link': ['additional_image_link', 'images', 'gallery'],
      'location': ['location', 'address', 'city'],
      'rooms': ['rooms', 'bedrooms', 'camere'],
      'surface': ['surface', 'area', 'suprafata'],
      'features': ['features', 'amenities', 'caracteristici']
    };

    const mappedFields: any = {};
    const missingRequired: string[] = [];

    // Check required fields
    for (const [fbField, possibleNames] of Object.entries(requiredFields)) {
      const found = possibleNames.find(name => headers.includes(name));
      if (found) {
        mappedFields[fbField] = found;
      } else {
        missingRequired.push(fbField);
      }
    }

    // Check optional fields
    for (const [fbField, possibleNames] of Object.entries(optionalFields)) {
      const found = possibleNames.find(name => headers.includes(name));
      if (found) {
        mappedFields[fbField] = found;
      }
    }

    if (missingRequired.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Câmpuri obligatorii lipsă: ${missingRequired.join(', ')}`,
          missing_fields: missingRequired,
          available_headers: headers
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse a few sample rows to validate data
    const sampleRows = lines.slice(1, Math.min(4, lines.length)).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `CSV valid! ${lines.length - 1} proprietăți găsite`,
        mapped_fields: mappedFields,
        sample_rows: sampleRows,
        total_rows: lines.length - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CSV validation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Eroare validare CSV: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
}

async function importFromCSV(supabase: any, csvData: string) {
  console.log('Starting CSV import...');
  
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV trebuie să conțină cel puțin un header și o linie de date');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    console.log(`Processing ${dataLines.length} rows...`);

    const properties = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Map Facebook Catalog fields to our database structure
        const property = await mapFacebookCatalogToProperty(row, headers);
        
        if (property) {
          properties.push(property);
          successCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push(`Linia ${i + 2}: ${error.message}`);
        console.error(`Error processing row ${i + 2}:`, error);
      }
    }

    if (properties.length === 0) {
      throw new Error('Nu s-au putut procesa proprietăți din CSV');
    }

    // Insert properties in batches
    console.log(`Inserting ${properties.length} properties...`);
    const { data, error } = await supabase
      .from('catalog_offers')
      .insert(properties)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Eroare inserare în baza de date: ${error.message}`);
    }

    const message = `Import finalizat! ${successCount} proprietăți adăugate cu succes.${errorCount > 0 ? ` ${errorCount} erori.` : ''}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        imported_count: successCount,
        error_count: errorCount,
        errors: errors.slice(0, 10), // Limit errors shown
        data: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CSV import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Eroare import CSV: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function mapFacebookCatalogToProperty(row: any, headers: string[]) {
  // Helper function to get value by possible field names
  const getValue = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (headers.includes(name) && row[name]) {
        return row[name];
      }
    }
    return null;
  };

  // Extract basic required fields
  const title = getValue(['title', 'name', 'property_name']);
  const description = getValue(['description', 'desc']);
  const priceStr = getValue(['price', 'price_min', 'cost']);
  const location = getValue(['location', 'address', 'city']) || 'București';

  if (!title || !description) {
    throw new Error('Câmpurile title și description sunt obligatorii');
  }

  // Parse price
  let price_min = 0;
  let price_max = 0;
  let currency = 'EUR';

  if (priceStr) {
    const priceMatch = priceStr.toString().match(/(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      const priceValue = parseFloat(priceMatch[1]);
      price_min = priceValue;
      price_max = priceValue;
    }
    
    // Detect currency
    if (priceStr.includes('RON') || priceStr.includes('lei')) {
      currency = 'RON';
    } else if (priceStr.includes('USD') || priceStr.includes('$')) {
      currency = 'USD';
    }
  }

  // Parse rooms
  const roomsStr = getValue(['rooms', 'bedrooms', 'camere']);
  const rooms = roomsStr ? parseInt(roomsStr.toString()) || 1 : 1;

  // Parse surface
  const surfaceStr = getValue(['surface', 'area', 'suprafata']);
  let surface_min = null;
  let surface_max = null;
  if (surfaceStr) {
    const surfaceMatch = surfaceStr.toString().match(/(\d+(?:\.\d+)?)/);
    if (surfaceMatch) {
      const surfaceValue = parseFloat(surfaceMatch[1]);
      surface_min = surfaceValue;
      surface_max = surfaceValue;
    }
  }

  // Parse images
  const mainImage = getValue(['image_link', 'main_image', 'primary_image']);
  const additionalImages = getValue(['additional_image_link', 'images', 'gallery']);
  
  const images = [];
  if (mainImage) images.push(mainImage);
  if (additionalImages) {
    const additionalImageUrls = additionalImages.split('|').map((url: string) => url.trim()).filter(Boolean);
    images.push(...additionalImageUrls);
  }

  // Parse features
  const featuresStr = getValue(['features', 'amenities', 'caracteristici']);
  const features = featuresStr ? featuresStr.split(',').map((f: string) => f.trim()).filter(Boolean) : [];

  // Get project name from brand or developer
  const project_name = getValue(['brand', 'developer', 'agency']);

  // Map availability status
  const availability = getValue(['availability', 'status', 'availability_status']);
  const availability_status = availability && availability.toLowerCase().includes('available') ? 'available' : 'available';

  return {
    title: title.toString(),
    description: description.toString(),
    location,
    price_min,
    price_max,
    currency,
    surface_min,
    surface_max,
    rooms,
    images,
    features,
    amenities: [], // Default empty
    project_name,
    availability_status,
    contact_info: null,
    whatsapp_catalog_id: getValue(['id', 'property_id', 'listing_id']),
    is_featured: false,
    storia_link: getValue(['link', 'url', 'property_url'])
  };
}

async function testURL(feedUrl: string) {
  console.log('Testing URL access:', feedUrl);
  
  try {
    if (!feedUrl) {
      throw new Error('URL feed-ului este obligatoriu');
    }

    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvData = await response.text();
    
    if (!csvData || csvData.trim().length === 0) {
      throw new Error('URL-ul nu conține date CSV');
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV-ul trebuie să conțină cel puțin un header și o linie de date');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `URL valid! ${lines.length - 1} proprietăți găsite`,
        preview: lines.slice(0, 3).join('\n'),
        total_rows: lines.length - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('URL test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Eroare acces URL: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
}

async function importFromURL(supabase: any, feedUrl: string, feedType: string) {
  console.log(`Starting import from URL: ${feedUrl} (${feedType})`);
  
  try {
    if (!feedUrl) {
      throw new Error('URL feed-ului este obligatoriu');
    }

    // Fetch CSV data from URL
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Nu am putut accesa feed-ul Immoflux`);
    }

    const csvData = await response.text();
    
    if (!csvData || csvData.trim().length === 0) {
      throw new Error('Feed-ul Immoflux este gol');
    }

    console.log(`CSV data fetched successfully, length: ${csvData.length}`);

    // Clear existing Immoflux data for this feed type
    console.log(`Clearing existing ${feedType} data...`);
    const { error: deleteError } = await supabase
      .from('catalog_offers')
      .delete()
      .ilike('title', `%IMMOFLUX_${feedType.toUpperCase()}%`);

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      // Continue anyway, this is not critical
    }

    // Process the CSV data
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Feed-ul nu conține proprietăți');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    console.log(`Processing ${dataLines.length} rows from ${feedType} feed...`);

    const properties = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Map Facebook Catalog fields to our database structure
        const property = await mapImmofluxFeedToProperty(row, headers, feedType);
        
        if (property) {
          properties.push(property);
          successCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push(`Linia ${i + 2}: ${error.message}`);
        console.error(`Error processing row ${i + 2}:`, error);
      }
    }

    if (properties.length === 0) {
      throw new Error('Nu s-au putut procesa proprietăți din feed');
    }

    // Insert properties in batches
    console.log(`Inserting ${properties.length} properties from ${feedType} feed...`);
    const { data, error } = await supabase
      .from('catalog_offers')
      .insert(properties)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Eroare inserare în baza de date: ${error.message}`);
    }

    const message = `Import ${feedType} finalizat! ${successCount} proprietăți adăugate.${errorCount > 0 ? ` ${errorCount} erori.` : ''}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        feed_type: feedType,
        imported_count: successCount,
        error_count: errorCount,
        errors: errors.slice(0, 10),
        data: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Import from URL error (${feedType}):`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Eroare import ${feedType}: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function mapImmofluxFeedToProperty(row: any, headers: string[], feedType: string) {
  // Helper function to get value by possible field names
  const getValue = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (headers.includes(name) && row[name]) {
        return row[name];
      }
    }
    return null;
  };

  // Extract basic required fields
  const title = getValue(['title', 'name', 'property_name']) || 'Proprietate Immoflux';
  const description = getValue(['description', 'desc']) || 'Proprietate din feed Immoflux';
  const priceStr = getValue(['price', 'price_min', 'cost']);
  const location = getValue(['location', 'address', 'city']) || 'București';

  // Parse price
  let price_min = 0;
  let price_max = 0;
  let currency = 'EUR';

  if (priceStr) {
    const priceMatch = priceStr.toString().match(/(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      const priceValue = parseFloat(priceMatch[1]);
      price_min = priceValue;
      price_max = priceValue;
    }
    
    // Detect currency
    if (priceStr.includes('RON') || priceStr.includes('lei')) {
      currency = 'RON';
    } else if (priceStr.includes('USD') || priceStr.includes('$')) {
      currency = 'USD';
    }
  }

  // Parse rooms
  const roomsStr = getValue(['rooms', 'bedrooms', 'camere']);
  const rooms = roomsStr ? parseInt(roomsStr.toString()) || 1 : 1;

  // Parse surface
  const surfaceStr = getValue(['surface', 'area', 'suprafata']);
  let surface_min = null;
  let surface_max = null;
  if (surfaceStr) {
    const surfaceMatch = surfaceStr.toString().match(/(\d+(?:\.\d+)?)/);
    if (surfaceMatch) {
      const surfaceValue = parseFloat(surfaceMatch[1]);
      surface_min = surfaceValue;
      surface_max = surfaceValue;
    }
  }

  // Parse images
  const mainImage = getValue(['image_link', 'main_image', 'primary_image']);
  const additionalImages = getValue(['additional_image_link', 'images', 'gallery']);
  
  const images = [];
  if (mainImage) images.push(mainImage);
  if (additionalImages) {
    const additionalImageUrls = additionalImages.split('|').map((url: string) => url.trim()).filter(Boolean);
    images.push(...additionalImageUrls);
  }

  // Parse features
  const featuresStr = getValue(['features', 'amenities', 'caracteristici']);
  const features = featuresStr ? featuresStr.split(',').map((f: string) => f.trim()).filter(Boolean) : [];

  // Mark as Immoflux feed import
  const project_name = `IMMOFLUX_${feedType.toUpperCase()}`;

  // Map availability status
  const availability = getValue(['availability', 'status', 'availability_status']);
  const availability_status = availability && availability.toLowerCase().includes('available') ? 'available' : 'available';

  return {
    title: `${title} - IMMOFLUX_${feedType.toUpperCase()}`,
    description: description.toString(),
    location,
    price_min,
    price_max,
    currency,
    surface_min,
    surface_max,
    rooms,
    images,
    features,
    amenities: [],
    project_name,
    availability_status,
    contact_info: null,
    whatsapp_catalog_id: getValue(['id', 'property_id', 'listing_id']),
    is_featured: false,
    storia_link: getValue(['link', 'url', 'property_url'])
  };
}