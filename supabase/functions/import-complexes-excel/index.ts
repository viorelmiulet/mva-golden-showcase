import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileData, fileName, file, projectId, projectName, location: reqLocation } = await req.json();

    const base64Data = fileData || file;
    if (!base64Data) {
      throw new Error('No file data provided');
    }

    console.log('Processing Excel file:', fileName);

    // Decode base64 to buffer
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Read Excel file
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON - preserves exact column names from Excel
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Keep values as formatted strings
      defval: '' // Default value for empty cells
    });

    console.log(`Found ${data.length} rows in Excel`);
    
    // Get column headers from first row
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    console.log('Excel columns detected:', headers);

    // Detect data type based on column headers
    const isApartmentData = headers.some(h => 
      h.toUpperCase().includes('ETAJ') || 
      h.toUpperCase().includes('NR AP') || 
      h.toUpperCase().includes('TIP COM') ||
      h.toUpperCase().includes('SUPRAFATA')
    );

    const isComplexData = headers.some(h => 
      h.toLowerCase().includes('nume') || 
      h.toLowerCase().includes('name') ||
      h.toLowerCase().includes('locatie') ||
      h.toLowerCase().includes('location')
    );

    console.log('Data type detected:', { isApartmentData, isComplexData });

    let imported = 0;
    const errors: string[] = [];
    let complexId: string | null = null;

    // Helper function to find column value by various possible names
    const getColumnValue = (row: any, ...possibleNames: string[]): string | null => {
      for (const name of possibleNames) {
        // Try exact match first
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return String(row[name]).trim();
        }
        // Try case-insensitive match
        const keys = Object.keys(row);
        const matchingKey = keys.find(k => k.toLowerCase() === name.toLowerCase());
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
          return String(row[matchingKey]).trim();
        }
      }
      return null;
    };

    // Import apartments data
    if (isApartmentData) {
      console.log('Processing apartment data...');
      
      // Determine target complex
      let complexName = fileName?.replace(/\.(xlsx|xls|csv)$/i, '') || 'Complex Importat';
      if (projectId) {
        complexId = projectId;
        complexName = projectName || complexName;
        console.log('Using existing complex ID from request:', complexId, 'name:', complexName);
      } else {
        // Create a complex for these apartments
        const { data: newComplex, error: complexError } = await supabaseClient
          .from('real_estate_projects')
          .insert({
            name: complexName,
            location: reqLocation || 'București',
            description: `Complex importat din ${fileName}`,
            status: 'available'
          })
          .select()
          .single();

        if (complexError) {
          console.error('Error creating complex:', complexError);
          throw new Error(`Nu s-a putut crea complexul: ${complexError.message}`);
        }

        complexId = newComplex.id;
        console.log('Created complex:', complexName, 'with ID:', complexId);
      }

      // Process apartments
      for (const row of data) {
        try {
          const apartmentNumber = getColumnValue(row, 'NR AP', 'Nr Ap', 'Numar Apartament');
          const floor = getColumnValue(row, 'ETAJ', 'Etaj');
          const type = getColumnValue(row, 'TIP COM', 'Tip', 'Type');
          const surface = getColumnValue(row, 'SUPRAFATA', 'Suprafata', 'Surface');
          const priceCredit = getColumnValue(row, 'CREDIT', 'Credit');
          const price50 = getColumnValue(row, 'AVANS 50%', 'Avans 50');
          const price80 = getColumnValue(row, 'AVANS 80%', 'Avans 80');
          const clientName = getColumnValue(row, 'NUME', 'Nume Client');
          const agent = getColumnValue(row, 'AGENT', 'Agent');

          // Skip rows without apartment number or that are floor separators
          if (!apartmentNumber || apartmentNumber.toLowerCase().includes('etaj') || apartmentNumber.toLowerCase().includes('parter') || apartmentNumber.toLowerCase().includes('demisol')) {
            continue;
          }

          // Determine price and status
          let price = null;
          let availabilityStatus = 'available';
          
          if (price80) {
            price = parseFloat(price80.replace(/[^\d.-]/g, ''));
          } else if (price50) {
            price = parseFloat(price50.replace(/[^\d.-]/g, ''));
          } else if (priceCredit) {
            price = parseFloat(priceCredit.replace(/[^\d.-]/g, ''));
          }

          if (clientName && clientName.toLowerCase().includes('rezervat')) {
            availabilityStatus = 'reserved';
          } else if (clientName && clientName.trim() !== '') {
            availabilityStatus = 'sold';
          }

          // Determine rooms
          let rooms = 1;
          if (type) {
            const typeLower = type.toLowerCase();
            if (typeLower.includes('2 camere') || typeLower.includes('ap 2')) {
              rooms = 2;
            } else if (typeLower.includes('3 camere') || typeLower.includes('ap 3')) {
              rooms = 3;
            } else if (typeLower.includes('studio')) {
              rooms = 1;
            }
          }

          const surfaceNum = surface ? parseFloat(surface.replace(/[^\d.-]/g, '')) : null;

          const apartmentData = {
            title: `${type || 'Apartament'} ${apartmentNumber}${floor ? ' - ' + floor : ''}`,
            location: 'București',
            description: `${type || 'Apartament'} pe ${floor || 'etaj nedefinit'}${agent ? `, Agent: ${agent}` : ''}${clientName && clientName.trim() ? `, Client: ${clientName}` : ''}`,
            price_min: price || 0,
            price_max: price || 0,
            surface_min: surfaceNum || 0,
            surface_max: surfaceNum || 0,
            rooms,
            available_units: availabilityStatus === 'available' ? 1 : 0,
            project_id: complexId,
            project_name: complexName,
            source: 'excel_import',
            availability_status: availabilityStatus,
            currency: 'EUR',
            transaction_type: 'sale'
          };

          const { error: aptError } = await supabaseClient
            .from('catalog_offers')
            .insert(apartmentData);

          if (aptError) {
            console.error('Error inserting apartment:', aptError);
            errors.push(`${apartmentNumber}: ${aptError.message}`);
          } else {
            imported++;
            console.log(`Imported apartment: ${apartmentNumber}`);
          }

        } catch (rowError: any) {
          console.error('Error processing apartment row:', rowError);
          errors.push(`Eroare la procesare: ${rowError.message}`);
        }
      }
    }
    
    // Import complex data
    else if (isComplexData) {
      console.log('Processing complex data...');
      
      for (const row of data) {
        try {
          const name = getColumnValue(row, 'Nume', 'Name', 'Denumire', 'Complex');
          const location = getColumnValue(row, 'Locatie', 'Location', 'Adresa', 'Address');
          
          if (!name || !location) {
            errors.push(`Rând omis: lipsește Nume sau Locație`);
            continue;
          }

          const description = getColumnValue(row, 'Descriere', 'Description', 'Detalii');
          const developer = getColumnValue(row, 'Dezvoltator', 'Developer', 'Constructor');
          const priceMin = getColumnValue(row, 'Pret Min', 'Price Min', 'Pret Minim');
          const priceMax = getColumnValue(row, 'Pret Max', 'Price Max', 'Pret Maxim');
          const surfaceMin = getColumnValue(row, 'Suprafata Min', 'Surface Min', 'Suprafata Minima');
          const surfaceMax = getColumnValue(row, 'Suprafata Max', 'Surface Max', 'Suprafata Maxima');
          const rooms = getColumnValue(row, 'Camere', 'Rooms', 'Nr Camere');
          const completionDate = getColumnValue(row, 'Data Finalizare', 'Completion Date', 'Finalizare');
          const statusValue = getColumnValue(row, 'Status', 'Stare', 'Disponibilitate');

          let priceRange = null;
          if (priceMin && priceMax) {
            const min = parseFloat(priceMin.replace(/[^\d.-]/g, ''));
            const max = parseFloat(priceMax.replace(/[^\d.-]/g, ''));
            if (!isNaN(min) && !isNaN(max)) {
              priceRange = `${min.toLocaleString()} - ${max.toLocaleString()} EUR`;
            }
          }

          let surfaceRange = null;
          if (surfaceMin && surfaceMax) {
            const min = parseFloat(surfaceMin.replace(/[^\d.-]/g, ''));
            const max = parseFloat(surfaceMax.replace(/[^\d.-]/g, ''));
            if (!isNaN(min) && !isNaN(max)) {
              surfaceRange = `${min} - ${max} mp`;
            }
          }

          let status = 'available';
          if (statusValue) {
            const statusLower = statusValue.toLowerCase();
            if (statusLower.includes('vand') || statusLower.includes('sold')) {
              status = 'sold_out';
            } else if (statusLower.includes('curand') || statusLower.includes('soon')) {
              status = 'coming_soon';
            }
          }

          const complexData = {
            name,
            location,
            description,
            developer,
            price_range: priceRange,
            surface_range: surfaceRange,
            rooms_range: rooms,
            completion_date: completionDate,
            status,
          };

          const { error } = await supabaseClient
            .from('real_estate_projects')
            .insert(complexData);

          if (error) {
            console.error('Error inserting complex:', error);
            errors.push(`${name}: ${error.message}`);
          } else {
            imported++;
            console.log(`Imported complex: ${name}`);
          }

        } catch (rowError: any) {
          console.error('Error processing row:', rowError);
          const rowName = getColumnValue(row, 'Nume', 'Name', 'Denumire', 'Complex') || 'Unknown';
          errors.push(`${rowName}: ${rowError.message}`);
        }
      }
    } else {
      throw new Error('Nu s-a putut detecta tipul de date. Asigurați-vă că fișierul conține coloanele necesare.');
    }

    const response = {
      success: true,
      imported,
      total: data.length,
      dataType: isApartmentData ? 'apartments' : 'complexes',
      complexId: complexId,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Import completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in import-complexes-excel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
