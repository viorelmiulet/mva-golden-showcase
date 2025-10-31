import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplexRow {
  Nume?: string;
  Locatie?: string;
  Descriere?: string;
  Dezvoltator?: string;
  'Pret Min'?: number;
  'Pret Max'?: number;
  'Suprafata Min'?: number;
  'Suprafata Max'?: number;
  Camere?: string;
  'Data Finalizare'?: string;
  Status?: string;
}

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
    
    // Convert to JSON
    const data: ComplexRow[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows in Excel`);

    let imported = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.Nume || !row.Locatie) {
          errors.push(`Rând omis: lipsește Nume sau Locatie`);
          continue;
        }

        // Build price range
        let priceRange = null;
        if (row['Pret Min'] && row['Pret Max']) {
          priceRange = `${row['Pret Min'].toLocaleString()} - ${row['Pret Max'].toLocaleString()} EUR`;
        }

        // Build surface range
        let surfaceRange = null;
        if (row['Suprafata Min'] && row['Suprafata Max']) {
          surfaceRange = `${row['Suprafata Min']} - ${row['Suprafata Max']} mp`;
        }

        // Normalize status
        let status = 'available';
        if (row.Status) {
          const statusLower = row.Status.toLowerCase();
          if (statusLower.includes('vand') || statusLower.includes('sold')) {
            status = 'sold_out';
          } else if (statusLower.includes('curand') || statusLower.includes('soon')) {
            status = 'coming_soon';
          }
        }

        const complexData = {
          name: row.Nume.trim(),
          location: row.Locatie.trim(),
          description: row.Descriere?.trim() || null,
          developer: row.Dezvoltator?.trim() || null,
          price_range: priceRange,
          surface_range: surfaceRange,
          rooms_range: row.Camere?.trim() || null,
          completion_date: row['Data Finalizare']?.toString().trim() || null,
          status: status,
        };

        const { error } = await supabaseClient
          .from('real_estate_projects')
          .insert(complexData);

        if (error) {
          console.error('Error inserting complex:', error);
          errors.push(`${row.Nume}: ${error.message}`);
        } else {
          imported++;
          console.log(`Imported: ${row.Nume}`);
        }

      } catch (rowError: any) {
        console.error('Error processing row:', rowError);
        errors.push(`${row.Nume || 'Unknown'}: ${rowError.message}`);
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
