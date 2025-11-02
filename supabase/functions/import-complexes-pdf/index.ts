import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    console.log('Processing PDF file:', fileName);

    // Decode base64 to buffer
    const buffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
    // Use Deepseek API to extract complex data from PDF text
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Convert buffer to text (simple extraction - for production use a proper PDF parser)
    const text = new TextDecoder().decode(buffer);
    
    // Use AI to extract structured data
    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Tu ești un asistent care extrage date structurate despre complexe rezidențiale din text. 
            Returnează DOAR un array JSON valid cu complexe, fără text adițional.
            Structura pentru fiecare complex:
            {
              "name": "nume complex",
              "location": "locație",
              "description": "descriere",
              "developer": "dezvoltator",
              "price_min": număr sau null,
              "price_max": număr sau null,
              "surface_min": număr sau null,
              "surface_max": număr sau null,
              "rooms_range": "text sau null",
              "completion_date": "text sau null",
              "status": "available/sold_out/coming_soon"
            }`
          },
          {
            role: 'user',
            content: `Extrage datele despre complexe rezidențiale din următorul text:\n\n${text.substring(0, 10000)}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Deepseek API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No data extracted from PDF');
    }

    console.log('AI Response:', extractedText);

    // Parse the JSON response
    let complexes: any[];
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
      complexes = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Could not parse extracted data. Please ensure the PDF contains structured complex information.');
    }

    if (!Array.isArray(complexes)) {
      complexes = [complexes];
    }

    let imported = 0;
    const errors: string[] = [];

    for (const complex of complexes) {
      try {
        // Validate required fields
        if (!complex.name || !complex.location) {
          errors.push(`Complex omis: lipsește nume sau locație`);
          continue;
        }

        // Build price range
        let priceRange = null;
        if (complex.price_min && complex.price_max) {
          priceRange = `${complex.price_min.toLocaleString()} - ${complex.price_max.toLocaleString()} EUR`;
        }

        // Build surface range
        let surfaceRange = null;
        if (complex.surface_min && complex.surface_max) {
          surfaceRange = `${complex.surface_min} - ${complex.surface_max} mp`;
        }

        const complexData = {
          name: complex.name.trim(),
          location: complex.location.trim(),
          description: complex.description?.trim() || null,
          developer: complex.developer?.trim() || null,
          price_range: priceRange,
          surface_range: surfaceRange,
          rooms_range: complex.rooms_range?.trim() || null,
          completion_date: complex.completion_date?.toString().trim() || null,
          status: complex.status || 'available',
        };

        const { error } = await supabaseClient
          .from('real_estate_projects')
          .insert(complexData);

        if (error) {
          console.error('Error inserting complex:', error);
          errors.push(`${complex.name}: ${error.message}`);
        } else {
          imported++;
          console.log(`Imported: ${complex.name}`);
        }

      } catch (rowError: any) {
        console.error('Error processing complex:', rowError);
        errors.push(`${complex.name || 'Unknown'}: ${rowError.message}`);
      }
    }

    const response = {
      success: true,
      imported,
      total: complexes.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Import completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in import-complexes-pdf:', error);
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
