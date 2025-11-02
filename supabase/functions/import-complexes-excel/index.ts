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

    const { fileData, fileName } = await req.json();

    if (!fileData) {
      throw new Error('No file data provided');
    }

    console.log('Processing Excel file:', fileName);

    // Decode base64 to buffer
    const buffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
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
    if (data.length > 0) {
      console.log('Excel columns detected:', Object.keys(data[0]));
    }

    let imported = 0;
    const errors: string[] = [];

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

    for (const row of data) {
      try {
        // Extract values using flexible column matching
        const name = getColumnValue(row, 'Nume', 'Name', 'Denumire', 'Complex');
        const location = getColumnValue(row, 'Locatie', 'Location', 'Adresa', 'Address');
        
        // Validate required fields
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

        // Build price range
        let priceRange = null;
        if (priceMin && priceMax) {
          const min = parseFloat(priceMin.replace(/[^\d.-]/g, ''));
          const max = parseFloat(priceMax.replace(/[^\d.-]/g, ''));
          if (!isNaN(min) && !isNaN(max)) {
            priceRange = `${min.toLocaleString()} - ${max.toLocaleString()} EUR`;
          }
        }

        // Build surface range
        let surfaceRange = null;
        if (surfaceMin && surfaceMax) {
          const min = parseFloat(surfaceMin.replace(/[^\d.-]/g, ''));
          const max = parseFloat(surfaceMax.replace(/[^\d.-]/g, ''));
          if (!isNaN(min) && !isNaN(max)) {
            surfaceRange = `${min} - ${max} mp`;
          }
        }

        // Normalize status
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
          console.log(`Imported: ${name}`);
        }

      } catch (rowError: any) {
        console.error('Error processing row:', rowError);
        const rowName = getColumnValue(row, 'Nume', 'Name', 'Denumire', 'Complex') || 'Unknown';
        errors.push(`${rowName}: ${rowError.message}`);
      }
    }

    const response = {
      success: true,
      imported,
      total: data.length,
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
