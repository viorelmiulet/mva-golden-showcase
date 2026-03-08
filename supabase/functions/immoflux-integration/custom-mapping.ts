// Import XML with custom field mapping
export async function importXmlWithCustomMapping(supabase: any, xmlUrl: string, fieldMapping: Record<string, string>) {
  try {
    console.log('Starting XML import with custom mapping from:', xmlUrl);
    console.log('Field mapping:', fieldMapping);
    
    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    console.log('XML Content fetched, length:', xmlContent.length);
    
    // Parse XML using custom mapping
    const properties = parseXmlWithCustomMapping(xmlContent, fieldMapping);
    
    if (properties.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found in XML feed with provided mapping',
          imported: 0
        }),
        {
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    console.log(`Parsed ${properties.length} properties with custom mapping, clearing previous imports...`);

    // Delete previous XML imports (source = 'api')
    const { error: deleteError } = await supabase
      .from('catalog_offers')
      .delete()
      .eq('source', 'api');

    if (deleteError) {
      console.error('Error deleting previous XML imports:', deleteError.message);
    } else {
      console.log('Successfully cleared previous XML imports');
    }

    // Insert new offers in batches to handle large imports
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('catalog_offers')
        .insert(batch)
        .select();

      // Handle trigger-related errors gracefully (sitemap notification trigger may fail in edge function context)
      if (insertError) {
        // If it's a trigger/extension error, log it but continue
        if (insertError.message.includes('extensions.net.http_post') || 
            insertError.message.includes('cross-database references')) {
          console.warn(`Trigger error (non-fatal): ${insertError.message}`);
          console.log(`Batch ${i / batchSize + 1} insert may have succeeded despite trigger error`);
        } else {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }
      } else {
        insertedCount += insertedData?.length || 0;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} properties`);
      }
    }

    console.log(`Successfully imported ${properties.length} properties with custom mapping`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Import cu mapare personalizată completat: ${properties.length} proprietăți importate`,
        imported: properties.length,
        preview: properties.slice(0, 3)
      }),
      {
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error: any) {
    console.error('XML import with custom mapping failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Import XML cu mapare eșuat: ${error.message}`
      }),
      {
        status: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json' 
        },
      }
    );
  }
}

function parseXmlWithCustomMapping(xmlContent: string, fieldMapping: Record<string, string>): any[] {
  const properties: any[] = [];
  
  try {
    console.log('Parsing XML with custom field mapping...');
    
    // Clean XML
    const cleanXml = xmlContent
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/xmlns[^=]*="[^"]*"/gi, '')
      .replace(/\s+/g, ' ');
    
    // Try to detect property blocks (same patterns as auto-detect)
    let propertyBlocks = 
      cleanXml.match(/<listing[^>]*>[\s\S]*?<\/listing>/gi) ||
      cleanXml.match(/<ad[^>]*>[\s\S]*?<\/ad>/gi) ||
      cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||
      cleanXml.match(/<oferta[^>]*>[\s\S]*?<\/oferta>/gi) ||
      cleanXml.match(/<property[^>]*>[\s\S]*?<\/property>/gi) ||
      cleanXml.match(/<offer[^>]*>[\s\S]*?<\/offer>/gi) ||
      cleanXml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ||
      cleanXml.match(/<unit[^>]*>[\s\S]*?<\/unit>/gi);
    
    if (!propertyBlocks) {
      console.log('No standard property blocks found');
      return [];
    }
    
    console.log(`Found ${propertyBlocks.length} property blocks`);
    
    // Extract broker/agency info from the feed header for contact enrichment
    const brokerInfo = extractBrokerInfo(cleanXml);
    
    propertyBlocks.forEach((block, index) => {
      try {
        // Extract values based on custom mapping
        const extractedData: any = {};
        
        // Extract each mapped field
        Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
          if (!sourceField) return;
          
          const value = extractFieldValue(block, sourceField);
          if (value) {
            extractedData[targetField] = value;
          }
        });
        
        // Build property object
        const title = extractedData.title || `Proprietate ${index + 1}`;
        const description = extractedData.description || '';
        const location = extractedData.location || extractedData.zone || extractedData.city || 'Necunoscut';
        
        // Parse price - handle nested <price><price>37000</price></price> structure
        let priceRaw = extractedData.price;
        // If price contains nested price tag content, extract the numeric value
        if (priceRaw) {
          const nestedPriceMatch = priceRaw.match(/(\d[\d.,]*)/);
          if (nestedPriceMatch) {
            priceRaw = nestedPriceMatch[1];
          }
        }
        const price = parsePrice(priceRaw);
        
        // Parse surface
        const surfaceRaw = extractedData.surface;
        const surface = parseNumber(surfaceRaw);
        
        // Parse rooms
        const roomsRaw = extractedData.rooms;
        const rooms = parseNumber(roomsRaw) || 1;
        
        // Currency - try from mapping first, then from price block
        let currency = extractedData.currency || 'EUR';
        if (!extractedData.currency) {
          const currencyFromBlock = extractFieldValue(block, 'currency');
          if (currencyFromBlock) currency = currencyFromBlock;
        }
        
        // Images - handle <images><image>url</image>...</images> structure
        const imagesRaw = extractedData.images;
        const images = parseImages(block, imagesRaw);
        
        // Build features from individual boolean fields (REBS CRM format)
        const features = buildFeaturesFromBlock(block, extractedData);
        
        // Contact - enrich with broker info from header
        const contactRaw = extractedData.contact;
        let contact = parseContact(contactRaw);
        if (!contact && brokerInfo) {
          contact = brokerInfo;
        }
        
        // Transaction type
        const transactionType = extractedData.transaction_type?.toLowerCase() === 'rent' || 
                               extractedData.transaction_type?.toLowerCase() === 'inchiriere' 
                               ? 'rent' : 'sale';
        
        // Parse additional fields
        const floor = parseNumber(extractedData.floor);
        const totalFloors = parseNumber(extractedData.total_floors);
        const bathrooms = parseNumber(extractedData.bathrooms);
        const yearBuilt = parseNumber(extractedData.year_built);
        const parking = parseNumber(extractedData.parking);
        const balconies = parseNumber(extractedData.balconies);
        const surfaceLand = parseNumber(extractedData.surface_land);
        const surfaceTotal = parseNumber(extractedData.surface_total);
        
        // Parse coordinates - handle both direct fields and nested geo_location
        let latitude = extractedData.latitude ? parseFloat(extractedData.latitude) : null;
        let longitude = extractedData.longitude ? parseFloat(extractedData.longitude) : null;
        
        // Fallback: try to extract lat/lon from geo_location block
        if (!latitude || !longitude) {
          const latVal = extractFieldValue(block, 'lat');
          const lonVal = extractFieldValue(block, 'lon');
          if (latVal) latitude = parseFloat(latVal);
          if (lonVal) longitude = parseFloat(lonVal);
        }
        
        // Agent/agency - try broker info from header if not mapped
        const agentName = extractedData.agent || null;
        const agencyName = extractedData.agency || null;
        
        // Source URL
        const sourceUrl = extractedData.source_url || null;
        
        // External ID
        const externalId = extractedData.external_id || null;
        
        const property: any = {
          title,
          description,
          location,
          price_min: price,
          price_max: price,
          surface_min: surface,
          surface_max: surfaceTotal || surface,
          rooms,
          currency,
          images,
          features,
          amenities: features,
          contact_info: contact,
          transaction_type: transactionType,
          availability_status: normalizeAvailabilityStatus(extractedData.availability_status),
          is_featured: false,
          source: 'api',
          project_name: null,
          // Additional fields
          floor,
          total_floors: totalFloors,
          bathrooms,
          year_built: yearBuilt,
          property_type: extractedData.property_type || null,
          building_type: extractedData.building_type || null,
          compartment: extractedData.compartment || null,
          heating: extractedData.heating || null,
          parking,
          balconies,
          furnished: extractedData.furnished || null,
          external_id: externalId,
          source_url: sourceUrl,
          zone: extractedData.zone || null,
          city: extractedData.city || null,
          latitude,
          longitude,
          agent: agentName,
          agency: agencyName,
          surface_land: surfaceLand,
          comfort: extractedData.comfort || null,
          video: extractedData.video || null,
          virtual_tour: extractedData.virtual_tour || null,
        };
        
        // Remove null values to avoid database issues
        Object.keys(property).forEach(key => {
          if (property[key] === null || property[key] === undefined) {
            delete property[key];
          }
        });
        
        // Validate minimum required fields - relaxed: accept if has title
        if (property.title && (property.price_min > 0 || property.rooms > 0)) {
          properties.push(property);
          console.log(`✓ Property ${index + 1} mapped: ${property.title}`);
        } else {
          console.log(`✗ Property ${index + 1} skipped: missing required data (title: ${property.title}, price: ${property.price_min}, rooms: ${property.rooms})`);
        }
        
      } catch (blockError: any) {
        console.error(`Error parsing property block ${index + 1}:`, blockError.message);
      }
    });
    
    console.log(`Successfully parsed ${properties.length} properties with custom mapping`);
    return properties;
    
  } catch (error: any) {
    console.error('Error in parseXmlWithCustomMapping:', error);
    return [];
  }
}

// Extract broker contact info from feed header
function extractBrokerInfo(xmlContent: string): any {
  try {
    const brokerBlock = xmlContent.match(/<broker[^>]*>[\s\S]*?<\/broker>/i);
    if (!brokerBlock) return null;
    
    const phone = extractFieldValue(brokerBlock[0], 'phone');
    const email = extractFieldValue(brokerBlock[0], 'email');
    const name = extractFieldValue(brokerBlock[0], 'name');
    
    const contact: any = {};
    if (phone && phone !== '0' && phone !== '1') contact.phone = phone;
    if (email) contact.email = email;
    if (name) contact.name = name;
    
    return Object.keys(contact).length > 0 ? contact : null;
  } catch {
    return null;
  }
}

// Build features array from individual boolean fields (REBS CRM format)
function buildFeaturesFromBlock(block: string, extractedData: any): string[] {
  const features: string[] = [];
  
  // Add any mapped features first
  if (extractedData.features) {
    const parsed = parseFeatures(extractedData.features);
    features.push(...parsed);
  }
  
  // REBS CRM boolean amenity fields
  const booleanFeatureMap: Record<string, string> = {
    'air_conditioning': 'Aer Condiționat',
    'internet': 'Internet',
    'television': 'Televiziune',
    'security': 'Securitate',
    'electricity': 'Electricitate',
    'wather': 'Apă',
    'gas': 'Gaz',
    'wood_floors': 'Parchet Lemn',
    'phone': 'Telefon',
    'elevator': 'Lift',
    'intercom': 'Interfon',
    'central_heating': 'Centrală Termică',
    'terrace': 'Terasă',
    'garden': 'Grădină',
    'pool': 'Piscină',
    'storage': 'Boxă',
  };
  
  Object.entries(booleanFeatureMap).forEach(([xmlField, label]) => {
    const value = extractFieldValue(block, xmlField);
    if (value === '1' || value?.toLowerCase() === 'true' || value?.toLowerCase() === 'da' || value?.toLowerCase() === 'yes') {
      if (!features.includes(label)) {
        features.push(label);
      }
    }
  });
  
  // Add compartment/apartment type as feature
  const aptType = extractFieldValue(block, 'appartment_type') || extractFieldValue(block, 'apartment_type');
  if (aptType && !features.includes(aptType)) {
    features.push(aptType);
  }
  
  // Add build materials as feature
  const buildMat = extractFieldValue(block, 'build_materials');
  if (buildMat && !features.includes(buildMat)) {
    features.push(`Construcție: ${buildMat}`);
  }
  
  return features.slice(0, 20);
}

function extractFieldValue(xmlBlock: string, fieldName: string): string | null {
  if (!fieldName) return null;
  
  // Clean the field name from any XML artifacts
  const cleanFieldName = fieldName.replace(/[<>]/g, '').trim();
  if (!cleanFieldName) return null;
  
  // Try multiple patterns to extract the value
  const patterns = [
    // Standard XML tag with attributes
    new RegExp(`<${cleanFieldName}[^>]*>([\\s\\S]*?)<\\/${cleanFieldName}>`, 'i'),
    // Standard XML tag without attributes
    new RegExp(`<${cleanFieldName}>([\\s\\S]*?)<\\/${cleanFieldName}>`, 'i'),
    // Self-closing or attribute value
    new RegExp(`<${cleanFieldName}[^>]*>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = xmlBlock.match(pattern);
    if (match) {
      let value = match[1] || '';
      
      // Clean up the extracted value
      value = value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]+>/g, ' ')  // Remove nested HTML/XML tags
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim();
      
      if (value && value.length > 0 && !value.match(/^[<>_]+$/)) {
        return value;
      }
    }
  }
  
  return null;
}

function parsePrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0;
  const cleanPrice = priceStr.replace(/[^\d.,]/g, '');
  let finalPrice = cleanPrice;
  
  if (finalPrice.includes(',') && finalPrice.includes('.')) {
    if (finalPrice.lastIndexOf(',') > finalPrice.lastIndexOf('.')) {
      finalPrice = finalPrice.replace(/\./g, '').replace(',', '.');
    } else {
      finalPrice = finalPrice.replace(/,/g, '');
    }
  } else if (finalPrice.includes(',')) {
    const parts = finalPrice.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      finalPrice = finalPrice.replace(',', '.');
    } else {
      finalPrice = finalPrice.replace(/,/g, '');
    }
  }
  
  const parsed = parseFloat(finalPrice);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function parseNumber(numStr: string | null | undefined): number | null {
  if (!numStr) return null;
  const cleanNum = numStr.replace(/[^\d.,]/g, '');
  if (!cleanNum) return null;
  
  let finalNum = cleanNum.replace(/,/g, '.');
  const parsed = parseFloat(finalNum);
  return isNaN(parsed) ? null : Math.round(parsed);
}

function parseImages(xmlBlock: string, imagesField: string | null | undefined): string[] {
  const images: string[] = [];
  const imageSet = new Set<string>();
  
  // If specific images field was mapped, use it
  if (imagesField) {
    const urls = imagesField.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi);
    if (urls) {
      urls.forEach(url => imageSet.add(url));
    }
  }
  
  // Also try to extract from the entire block
  const blockUrls = xmlBlock.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi);
  if (blockUrls) {
    blockUrls.forEach(url => imageSet.add(url));
  }
  
  return Array.from(imageSet).slice(0, 15);
}

function parseFeatures(featuresStr: string | null | undefined): string[] {
  if (!featuresStr) return [];
  
  const features = featuresStr.split(/[,;|]/).map(f => f.trim()).filter(f => f && f.length > 0);
  return features.slice(0, 10);
}

function parseContact(contactStr: string | null | undefined): any {
  if (!contactStr) return null;
  
  const contact: any = {};
  
  // Try to extract phone
  const phoneMatch = contactStr.match(/(\+?\d[\d\s\-()]{7,})/);
  if (phoneMatch) {
    contact.phone = phoneMatch[1].trim();
  }
  
  // Try to extract email
  const emailMatch = contactStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    contact.email = emailMatch[1];
  }
  
  return Object.keys(contact).length > 0 ? contact : null;
}
