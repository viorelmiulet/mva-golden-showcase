import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { type, propertyData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating content for type:', type);

    if (type === 'text') {
      // Generate promotional text using Gemini Flash
      const textPrompt = propertyData 
        ? `Creează un text promoțional captivant pentru Facebook pentru agenția imobiliară MVA IMOBILIARE. 
           Proprietate: ${propertyData.title || 'Proprietate exclusivă'}
           Locație: ${propertyData.location || 'Locație excelentă'}
           Preț: ${propertyData.price ? `${propertyData.price} EUR` : 'Preț atractiv'}
           Cameră: ${propertyData.rooms || '-'}
           Suprafață: ${propertyData.surface ? `${propertyData.surface} mp` : '-'}
           
           Textul trebuie să fie:
           - Profesional dar accesibil
           - Să evidențieze punctele forte
           - Să includă call-to-action
           - Maxim 300 caractere pentru conținutul principal
           - În limba română
           - NU folosi cuvintele "lux" sau "luxury"
           
           La final adaugă OBLIGATORIU pe linii separate:
           📞 0767.941.512
           📧 contact@mvaimobiliare.ro
           🌐 mvaimobiliare.ro`
        : `Creează un text promoțional captivant pentru Facebook pentru agenția imobiliară MVA IMOBILIARE. 
           Textul trebuie să:
           - Prezinte serviciile agenției
           - Fie profesional și atractiv
           - Includă un call-to-action
           - Fie optimizat pentru Facebook (maxim 300 caractere pentru conținutul principal)
           - Fie în limba română
           - NU folosi cuvintele "lux" sau "luxury"
           
           La final adaugă OBLIGATORIU pe linii separate:
           📞 0767.941.512
           📧 contact@mvaimobiliare.ro
           🌐 mvaimobiliare.ro`;

      const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Ești un expert în marketing imobiliar și creezi conținut promoțional pentru social media.' },
            { role: 'user', content: textPrompt }
          ],
        }),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('Text generation error:', textResponse.status, errorText);
        throw new Error(`Failed to generate text: ${textResponse.status}`);
      }

      const textData = await textResponse.json();
      const generatedText = textData.choices[0].message.content;

      return new Response(
        JSON.stringify({ text: generatedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'image') {
      // Generate promotional image using Gemini Image Preview
      const imagePrompt = propertyData
        ? `Create a professional real estate promotional image for Facebook. 
           Modern ${propertyData.rooms || '2'}-room apartment in ${propertyData.location || 'excellent location'}.
           Style: Bright, modern, contemporary real estate photography.
           Include: Beautiful interior or exterior view, professional composition.
           Aspect ratio: 1200x630 (Facebook post format).
           High quality, ultra realistic, professional photography.
           DO NOT include the words "luxury" or "lux" in any form.`
        : `Create a professional real estate agency promotional image for MVA IMOBILIARE.
           Style: Modern, elegant, contemporary real estate branding.
           Include: Abstract modern home concepts, golden accents, professional composition.
           Aspect ratio: 1200x630 (Facebook post format).
           High quality, ultra realistic, professional design.
           DO NOT include the words "luxury" or "lux" in any form.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: imagePrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Image generation error:', imageResponse.status, errorText);
        throw new Error(`Failed to generate image: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImage) {
        throw new Error('No image generated');
      }

      return new Response(
        JSON.stringify({ image: generatedImage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid type specified');

  } catch (error) {
    console.error('Error in generate-facebook-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
