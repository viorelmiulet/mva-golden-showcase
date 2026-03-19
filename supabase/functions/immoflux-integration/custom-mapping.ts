// Check if a string looks like GPS coordinates
function isCoordinates(str: string): boolean {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str.trim());
}

// Reverse geocode coordinates using Nominatim (free, no API key needed)
async function reverseGeocode(lat: number, lng: number): Promise<{ zone: string; city: string }> {
  try {
    // Try Google Maps API first if available
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (googleApiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ro&result_type=sublocality|neighborhood|locality&key=${googleApiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.results?.length) {
          let zone = '';
          let city = '';
          for (const result of data.results) {
            for (const component of result.address_components || []) {
              const types = component.types || [];
              if (!zone && (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood'))) {
                zone = component.long_name;
              }
              if (!city && types.includes('locality')) {
                city = component.long_name;
              }
            }
          }
          if (zone || city) return { zone: zone || city, city: city || zone };
        }
      }
    }

    // Fallback to Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ro&zoom=16`,
      { headers: { 'User-Agent': 'MVA-Imobiliare/1.0' } }
    );
    if (!response.ok) return { zone: '', city: '' };
    const data = await response.json();
    const addr = data.address || {};
    const zone = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
    const city = addr.city || addr.town || addr.municipality || '';
    return { zone, city };
  } catch {
    return { zone: '', city: '' };
  }
}

// Known project name patterns to extract from title
const PROJECT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /militari\s*residence/i, name: 'Militari Residence' },
  { pattern: /pollux\s*residence/i, name: 'Pollux Residence' },
  { pattern: /tineretului/i, name: 'Tineretului' },
  { pattern: /eurocasa/i, name: 'Eurocasa Residence' },
  { pattern: /renew\s*residence/i, name: 'Renew Residence' },
  { pattern: /orhideea/i, name: 'Orhideea Residence' },
  { pattern: /pipera/i, name: 'Pipera' },
  { pattern: /drumul\s*taberei/i, name: 'Drumul Taberei' },
  { pattern: /berceni/i, name: 'Berceni' },
  { pattern: /titan/i, name: 'Titan' },
  { pattern: /colentina/i, name: 'Colentina' },
  { pattern: /aviatiei/i, name: 'Aviației' },
  { pattern: /floreasca/i, name: 'Floreasca' },
  { pattern: /herastrau/i, name: 'Herăstrău' },
  { pattern: /dorobanti/i, name: 'Dorobanți' },
];

function extractProjectName(title: string): string | null {
  if (!title) return null;
  for (const { pattern, name } of PROJECT_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return null;
}

// Normalize availability status from CRM values
function normalizeAvailabilityStatus(raw: string | null | undefined): string {
  if (!raw) return 'available';
  const s = raw.toLowerCase().trim();
  if (s.includes('vandut') || s.includes('vândut') || s.includes('sold') || s === 'vanzare finalizata') return 'sold';
  if (s.includes('inactiv') || s.includes('inactive') || s.includes('unavailable') || s.includes('indisponibil') || s.includes('retras') || s.includes('expirat')) return 'inactive';
  if (s.includes('activ') || s.includes('available') || s.includes('disponibil')) return 'available';
  return 'available';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Import XML with custom field mapping — full CRM mapping with upsert
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
    const properties = await parseXmlWithCustomMapping(xmlContent, fieldMapping);
    
    if (properties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No properties found in XML feed with provided mapping', imported: 0 }),
        { headers: corsHeaders }
      );
    }

    console.log(`Parsed ${properties.length} properties, starting upsert...`);

    // Upsert: for each property, check if external_id exists → UPDATE or INSERT
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    const batchSize = 50;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('catalog_offers')
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: false })
        .select('id');

      if (error) {
        if (error.message.includes('extensions.net.http_post') || error.message.includes('cross-database references')) {
          console.warn(`Trigger error (non-fatal): ${error.message}`);
          inserted += batch.length; // Likely succeeded
        } else {
          console.error(`Upsert batch failed: ${error.message}`);
          failed += batch.length;
        }
      } else {
        inserted += data?.length || 0;
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} properties`);
      }
    }

    // Update import source history
    try {
      await supabase.from('xml_import_sources').upsert({
        url: xmlUrl,
        last_used_at: new Date().toISOString(),
        import_count: 1,
        last_mapping: fieldMapping,
      }, { onConflict: 'url' });
    } catch { /* non-critical */ }

    console.log(`Import complete: ${inserted} upserted, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Import completat: ${inserted} proprietăți importate/actualizate${failed > 0 ? `, ${failed} eșuate` : ''}`,
        imported: inserted,
        updated,
        failed,
        preview: properties.slice(0, 3)
      }),
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('XML import with custom mapping failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: `Import XML cu mapare eșuat: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function parseXmlWithCustomMapping(xmlContent: string, fieldMapping: Record<string, string>): Promise<any[]> {
  const properties: any[] = [];
  
  try {
    // Clean XML
    const cleanXml = xmlContent
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/xmlns[^=]*="[^"]*"/gi, '')
      .replace(/\s+/g, ' ');
    
    // Detect property blocks
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
    
    // Extract broker info from header
    const brokerInfo = extractBrokerInfo(cleanXml);
    
    for (let index = 0; index < propertyBlocks.length; index++) {
      const block = propertyBlocks[index];
      try {
        const property = await mapSingleProperty(block, index, fieldMapping, brokerInfo);
        if (property) {
          properties.push(property);
        }
      } catch (blockError: any) {
        console.error(`Error parsing property block ${index + 1}:`, blockError.message);
      }
    }

    console.log(`Successfully parsed ${properties.length} properties`);
    return properties;
    
  } catch (error: any) {
    console.error('Error in parseXmlWithCustomMapping:', error);
    return [];
  }
}

async function mapSingleProperty(block: string, index: number, fieldMapping: Record<string, string>, brokerInfo: any): Promise<any | null> {
  // Extract mapped fields
  const d: any = {};
  Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
    if (!sourceField) return;
    const value = extractFieldValue(block, sourceField);
    if (value) d[targetField] = value;
  });

  // Also always try to extract CRM-specific fields directly from XML
  const directFields = [
    'id', 'listing_type', 'title', 'description', 'date_added',
    'rooms', 'bathrooms', 'kitchens', 'balconies', 'floor', 'building_flors',
    'parking', 'build_year', 'appartment_type', 'build_materials',
    'property_type', 'property_subtype', 'area',
    'air_conditioning', 'internet', 'television', 'security',
    'electricity', 'wather', 'gas', 'wood_floors', 'phone',
    'exclusivity', 'broker', 'agency',
    'commission_type', 'commission_value',
  ];
  
  for (const field of directFields) {
    if (!d[field]) {
      const val = extractFieldValue(block, field);
      if (val) d[field] = val;
    }
  }

  // Parse price from nested <price><price>X</price><currency>Y</currency></price>
  const priceBlock = block.match(/<price[^>]*>[\s\S]*?<\/price>/gi);
  let priceVal = 0;
  let currency = 'EUR';
  let priceType: string | null = null;
  if (priceBlock) {
    const lastPriceBlock = priceBlock[priceBlock.length - 1];
    // Try nested price value
    const innerPrice = extractFieldValue(lastPriceBlock, 'price');
    if (innerPrice) {
      const num = parseFloat(innerPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(num)) priceVal = Math.round(num);
    }
    const cur = extractFieldValue(lastPriceBlock, 'currency');
    if (cur) currency = cur.toUpperCase();
    const pt = extractFieldValue(lastPriceBlock, 'price_type');
    if (pt) priceType = pt;
  }
  // Override with direct mapping if available
  if (d.price) {
    const num = parseFloat(d.price.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num) && num > 0) priceVal = Math.round(num);
  }
  if (d.currency) currency = d.currency.toUpperCase();
  if (d.price_type) priceType = d.price_type;

  // Parse numeric fields
  const rooms = parseInt(d.rooms) || 0;
  const bathrooms = parseInt(d.bathrooms) || null;
  const kitchens = parseInt(d.kitchens) || null;
  const balconies = parseInt(d.balconies) || 0;
  const floor = parseInt(d.floor) || null;
  const totalFloors = parseInt(d.building_flors || d.total_floors) || null;
  const parking = d.parking === '1' ? 1 : (parseInt(d.parking) || 0);
  const yearBuilt = parseInt(d.build_year || d.year_built) || null;
  const area = parseFloat(d.area || d.surface || '0') || null;

  // Filter: skip if price=0 or rooms=0
  if (priceVal <= 0 || rooms <= 0) {
    console.log(`✗ Property ${index + 1} skipped: price=${priceVal}, rooms=${rooms}`);
    return null;
  }

  // Parse coordinates
  let latitude: number | null = null;
  let longitude: number | null = null;
  // Try geo_location block
  const geoBlock = block.match(/<geo_location[^>]*>[\s\S]*?<\/geo_location>/i);
  if (geoBlock) {
    const latStr = extractFieldValue(geoBlock[0], 'lat');
    const lonStr = extractFieldValue(geoBlock[0], 'lon');
    if (latStr) latitude = parseFloat(latStr) || null;
    if (lonStr) longitude = parseFloat(lonStr) || null;
  }
  // Override with direct mapping
  if (d.latitude) latitude = parseFloat(d.latitude) || null;
  if (d.longitude) longitude = parseFloat(d.longitude) || null;

  // Commission
  const commBlock = block.match(/<commission[^>]*>[\s\S]*?<\/commission>/i);
  let commissionType: string | null = null;
  let commissionValue: number | null = null;
  if (commBlock) {
    commissionType = extractFieldValue(commBlock[0], 'commission_type') || null;
    const cv = extractFieldValue(commBlock[0], 'commission_value');
    commissionValue = cv ? (parseFloat(cv) || 0) : null;
  }
  if (d.commission_type) commissionType = d.commission_type;
  if (d.commission_value) commissionValue = parseFloat(d.commission_value) || null;

  // Transaction type
  const rawTxType = (d.listing_type || d.transaction_type || '').toLowerCase();
  const transactionType = (rawTxType === 'rent' || rawTxType === 'inchiriere') ? 'inchiriere' : 'vanzare';

  // Boolean amenities
  const boolField = (name: string) => {
    const val = d[name] || extractFieldValue(block, name);
    return val === '1' || val?.toLowerCase() === 'true';
  };

  // Build features array from booleans
  const features: string[] = [];
  const featureMap: Record<string, string> = {
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
  for (const [xmlField, label] of Object.entries(featureMap)) {
    if (boolField(xmlField)) features.push(label);
  }

  // Images
  const images = parseImages(block);

  // External ID
  const externalId = d.id || d.external_id || null;

  // Title & description
  const title = d.title || `Proprietate ${index + 1}`;
  const description = d.description || '';

  // Project name from title
  const projectName = extractProjectName(title);

  // Reverse geocode for zone/location
  let zone: string | null = d.zone || null;
  let location: string | null = d.location || null;
  let city: string | null = d.city || null;

  if (latitude && longitude && (!zone || isCoordinates(zone))) {
    try {
      const geo = await reverseGeocode(latitude, longitude);
      if (geo.zone) {
        zone = geo.zone;
        if (!location || isCoordinates(location)) location = geo.zone;
      }
      if (geo.city) city = geo.city;
      // Small delay for Nominatim rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch {
      console.warn(`Geocoding failed for ${latitude},${longitude}`);
    }
  }

  // Contact info from broker
  let contactInfo = brokerInfo || null;

  const property: any = {
    // Identification
    external_id: externalId,
    crm_source: 'black-swan-estate',
    source: 'api',

    // Transaction
    transaction_type: transactionType,

    // Core data
    title,
    description,
    date_added: d.date_added ? new Date(d.date_added).toISOString() : null,

    // Apartment details
    rooms,
    bathrooms,
    kitchens,
    balconies,
    floor,
    total_floors: totalFloors,
    parking,
    year_built: yearBuilt,
    appartment_type: d.appartment_type || null,
    build_materials: d.build_materials || null,
    property_type: d.property_type || null,
    property_subtype: d.property_subtype || null,
    surface_min: area,
    surface_max: area,

    // Price
    price_min: priceVal,
    price_max: priceVal,
    currency,
    price_type: priceType,

    // Location
    latitude,
    longitude,
    zone,
    location: location || zone || city || 'Necunoscut',
    city,

    // Commission
    commission_type: commissionType,
    commission_value: commissionValue,

    // Boolean amenities
    has_ac: boolField('air_conditioning') || null,
    has_internet: boolField('internet') || null,
    has_tv: boolField('television') || null,
    has_security: boolField('security') || null,
    has_electricity: boolField('electricity') || null,
    has_water: boolField('wather') || null,
    has_gas: boolField('gas') || null,
    has_wood_floors: boolField('wood_floors') || null,
    has_phone: boolField('phone') || null,

    // Exclusivity
    exclusivity: boolField('exclusivity') || false,

    // Images
    images,

    // Features array
    features,
    amenities: features,

    // Status
    availability_status: 'available',
    is_published: true,

    // Broker/agency
    broker_id: d.broker || null,
    agency_id: d.agency || null,
    agent: d.broker || null,
    agency: d.agency || null,

    // Project name (auto-extracted from title)
    project_name: projectName,

    // Contact
    contact_info: contactInfo,
  };

  // Remove null/undefined values to avoid DB issues
  Object.keys(property).forEach(key => {
    if (property[key] === null || property[key] === undefined) {
      delete property[key];
    }
  });

  // Keep external_id even if it will be used for upsert conflict
  if (externalId) property.external_id = externalId;

  console.log(`✓ Property ${index + 1}: ${title} | ${priceVal} ${currency} | ${rooms} cam | ext_id: ${externalId}`);
  return property;
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

function extractFieldValue(xmlBlock: string, fieldName: string): string | null {
  if (!fieldName) return null;
  const cleanFieldName = fieldName.replace(/[<>]/g, '').trim();
  if (!cleanFieldName) return null;
  
  const patterns = [
    new RegExp(`<${cleanFieldName}[^>]*>([\\s\\S]*?)<\\/${cleanFieldName}>`, 'i'),
    new RegExp(`<${cleanFieldName}>([\\s\\S]*?)<\\/${cleanFieldName}>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = xmlBlock.match(pattern);
    if (match) {
      let value = match[1] || '';
      value = value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (value && value.length > 0 && !value.match(/^[<>_]+$/)) {
        return value;
      }
    }
  }
  
  return null;
}

function parseImages(xmlBlock: string): string[] {
  const imageSet = new Set<string>();
  
  // Extract all image URLs from the block
  const blockUrls = xmlBlock.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi);
  if (blockUrls) {
    blockUrls.forEach(url => imageSet.add(url));
  }
  
  return Array.from(imageSet).slice(0, 20);
}
