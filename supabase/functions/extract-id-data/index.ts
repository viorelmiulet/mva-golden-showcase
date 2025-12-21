import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Extracting data from ID card...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Ești un expert în extragerea datelor din documente de identitate românești (carte de identitate).
Analizează imaginea și extrage următoarele informații:
- Nume complet (nume și prenume)
- CNP (cod numeric personal - 13 cifre)
- Seria și numărul CI
- Emitentul CI (ex: SPCLEP Sector 1, SPCLEP Cluj-Napoca, etc.)
- Data emiterii CI
- Adresa completă (strada, număr, bloc, scară, etaj, apartament, localitate, județ)
- Data nașterii
- Locul nașterii
- Sexul
- Cetățenia
- Data expirării

Returnează datele în format JSON strict, fără alte explicații. Dacă un câmp nu poate fi citit, pune null.
Format:
{
  "nume": "string",
  "prenume": "string",
  "cnp": "string",
  "seria": "string",
  "numar": "string",
  "emitent": "string sau null",
  "data_emiterii": "string (DD.MM.YYYY) sau null",
  "adresa": {
    "strada": "string",
    "numar": "string",
    "bloc": "string sau null",
    "scara": "string sau null",
    "etaj": "string sau null",
    "apartament": "string sau null",
    "localitate": "string",
    "judet": "string"
  },
  "data_nasterii": "string (DD.MM.YYYY)",
  "locul_nasterii": "string",
  "sex": "M sau F",
  "cetatenie": "string",
  "data_expirarii": "string (DD.MM.YYYY)"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrage toate datele din această carte de identitate românească:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limită de cereri depășită. Încercați din nou mai târziu.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credit insuficient. Adăugați fonduri în workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Nu s-au putut extrage datele din imagine. Asigurați-vă că imaginea este clară.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting ID data:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Eroare la extragerea datelor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
