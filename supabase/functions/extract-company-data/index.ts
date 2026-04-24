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

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    console.log('Extracting company data from certificate...');

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
            content: `Ești un expert în extragerea datelor din Certificate de Înmatriculare ale companiilor românești (emise de ONRC / Registrul Comerțului).
Analizează imaginea și extrage următoarele informații despre firmă:
- Denumirea firmei (inclusiv forma juridică: SRL, SA, PFA, etc.)
- CUI / CIF (Cod Unic de Înregistrare). Include prefixul RO doar dacă apare explicit pe document.
- Numărul de ordine în Registrul Comerțului (format JXX/NNNN/YYYY, ex: J40/1234/2020)
- Sediul social complet (strada, număr, bloc, scară, etaj, apartament, localitate, sector/județ)

Returnează datele STRICT în format JSON, fără alte explicații. Pentru câmpuri necitite folosește null.
Format:
{
  "company_name": "string",
  "company_cui": "string",
  "company_reg_com": "string",
  "company_sediu": "string"
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrage datele firmei din acest certificat de înmatriculare:' },
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
        return new Response(JSON.stringify({ error: 'Limită de cereri depășită. Încercați din nou mai târziu.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credit insuficient. Adăugați fonduri în workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    console.log('AI response:', content);

    let extractedData;
    try {
      let cleanedContent = content;
      if (content.includes('```json')) {
        cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (content.includes('```')) {
        cleanedContent = content.replace(/```\s*/g, '');
      }
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Nu s-au putut extrage datele firmei. Asigurați-vă că imaginea este clară.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ data: extractedData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error extracting company data:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Eroare la extragerea datelor' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
