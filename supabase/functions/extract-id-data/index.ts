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
    // Auth check - JWT first, anon key fallback
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.56.0');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;

    if (authHeader?.startsWith('Bearer ')) {
      const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) isAuthorized = true;
      } catch (_) {}
    }
    if (!isAuthorized) {
      const apikeyHeader = req.headers.get('apikey');
      if (apikeyHeader === ANON_KEY) isAuthorized = true;
    }
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { imageBase64, imageBase64List } = body ?? {};

    // Normalize to array (accept either single image — backward compatible — or a list)
    const images: string[] = Array.isArray(imageBase64List) && imageBase64List.length > 0
      ? imageBase64List
      : (imageBase64 ? [imageBase64] : []);

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Extracting data from ${images.length} ID image(s)...`);

    const userContent: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text: images.length > 1
          ? `Extrage toate datele din aceste ${images.length} imagini ale aceluiași document de identitate (ex: față + verso CI românească, sau ambele fețe ale unui permis de ședere). Combină informațiile într-un singur JSON conform schemei.`
          : 'Extrage toate datele din această carte de identitate românească:'
      },
      ...images.map((img) => ({
        type: 'image_url',
        image_url: {
          url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
        }
      }))
    ];

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
            content: `Ești un expert în extragerea datelor din documente de identitate românești (carte de identitate) ȘI din permise de ședere pentru cetățeni străini.

IMPORTANT: Poți primi MAI MULTE imagini ale ACELUIAȘI document de identitate al ACELEIAȘI persoane — de exemplu față + verso ale unei cărți de identitate noi românești, sau ambele fețe ale unui permis de ședere (residence permit) pentru un cetățean străin. Analizează TOATE imaginile și returnează UN SINGUR obiect JSON combinat:
- Dacă un câmp apare doar într-o imagine, folosește acea valoare.
- Dacă apare în mai multe imagini, alege varianta cea mai clară/completă.
- Nu duplica și nu inventa câmpuri.

Câmpuri de extras:
- Nume și prenume
- CNP / cod numeric personal (sau echivalent pentru permis de ședere)
- Seria și numărul documentului
- Emitentul (ex: SPCLEP Sector 1, Inspectoratul General pentru Imigrări, etc.)
- Data emiterii
- Adresa completă (strada, număr, bloc, scară, etaj, apartament, localitate, județ)
- Cod poștal (dacă apare pe document)
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
    "judet": "string",
    "cod_postal": "string sau null"
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
            content: userContent
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
      // Remove markdown code blocks if present
      let cleanedContent = content;
      if (content.includes('```json')) {
        cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (content.includes('```')) {
        cleanedContent = content.replace(/```\s*/g, '');
      }
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        console.log('Extracted data:', JSON.stringify(extractedData));
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
      JSON.stringify({ error: (error as Error).message || 'Eroare la extragerea datelor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
