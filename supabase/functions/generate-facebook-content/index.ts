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
        ? `Create a professional real estate promotional image for Facebook with a COMPLETE SCENE (NO WHITE BACKGROUND). 
           Modern ${propertyData.rooms || '2'}-room apartment in ${propertyData.location || 'excellent location'}.
           Style: Bright, modern, contemporary real estate photography with full environment and context.
           Include: Beautiful interior or exterior view with complete surroundings, professional composition.
           The entire image should be filled with content - show the property in its environment (cityscape, neighborhood, full room interior, etc).
           NO WHITE OR PLAIN BACKGROUNDS - fill the entire frame with realistic real estate photography.
           Aspect ratio: 1200x630 (Facebook post format).
           High quality, ultra realistic, professional photography.
           DO NOT include the words "luxury" or "lux" in any form.
           
           CRITICAL - MVA LOGO PLACEMENT:
           You MUST include the MVA IMOBILIARE logo in the TOP-LEFT or TOP-RIGHT corner of the image.
           The logo design is:
           - A golden hexagonal badge with a glowing golden "M" letter in the center
           - Below the hexagon: "MVA" in large golden letters
           - Below MVA: "IMOBILIARE" in smaller golden letters
           - The logo has a premium, elegant golden color (#D4AF37 to #F4E4A6 gradient)
           - The logo should have a subtle glow effect
           - Size: approximately 15-20% of the image height
           - Position: corner placement with some padding from edges
           - The logo colors should adapt slightly to match the overall image color temperature (warmer or cooler tones)
           
           CRITICAL - TEXT OVERLAY REQUIREMENTS (Romanian language):
           You MUST include an elegant overlay banner at the bottom of the image with EXACTLY this text in Romanian:
           
           Line 1: "Telefon: 0767.941.512"
           Line 2: "Email: contact@mvaimobiliare.ro"
           Line 3: "Web: mvaimobiliare.ro"
           
           SPELLING RULES FOR ROMANIAN:
           - "Telefon" (NOT "Telefono" or "Telephone")
           - Use the EXACT email and phone number provided above
           - The word "Web:" is correct (short for Website)
           
           Make the text overlay:
           - Clear, professional typography
           - Good contrast against the background (white text on semi-transparent dark overlay OR dark text on semi-transparent light overlay)
           - Positioned at the bottom of the image
           - All text MUST be perfectly legible and correctly spelled in Romanian`
        : `Create a professional real estate agency promotional image for MVA IMOBILIARE with a COMPLETE SCENE (NO WHITE BACKGROUND).
           Style: Modern, elegant, contemporary real estate branding with full visual environment.
           Include: Complete real estate scenes - modern buildings, cityscapes, beautiful interiors with golden accents.
           The entire image should be filled with content - show a complete environment, not isolated elements.
           NO WHITE OR PLAIN BACKGROUNDS - fill the entire 1200x630 frame with rich, professional real estate imagery.
           Aspect ratio: 1200x630 (Facebook post format).
           High quality, ultra realistic, professional design with complete backgrounds.
           DO NOT include the words "luxury" or "lux" in any form.
           
           CRITICAL - MVA LOGO PLACEMENT:
           You MUST include the MVA IMOBILIARE logo in the TOP-LEFT or TOP-RIGHT corner of the image.
           The logo design is:
           - A golden hexagonal badge with a glowing golden "M" letter in the center
           - Below the hexagon: "MVA" in large golden letters
           - Below MVA: "IMOBILIARE" in smaller golden letters
           - The logo has a premium, elegant golden color (#D4AF37 to #F4E4A6 gradient)
           - The logo should have a subtle glow effect
           - Size: approximately 15-20% of the image height
           - Position: corner placement with some padding from edges
           - The logo colors should adapt slightly to match the overall image color temperature (warmer or cooler tones)
           
           CRITICAL - TEXT OVERLAY REQUIREMENTS (Romanian language):
           You MUST include an elegant overlay banner at the bottom of the image with EXACTLY this text in Romanian:
           
           Line 1: "Telefon: 0767.941.512"
           Line 2: "Email: contact@mvaimobiliare.ro"
           Line 3: "Web: mvaimobiliare.ro"
           
           SPELLING RULES FOR ROMANIAN:
           - "Telefon" (NOT "Telefono" or "Telephone")
           - Use the EXACT email and phone number provided above
           - The word "Web:" is correct (short for Website)
           
           Make the text overlay:
           - Clear, professional typography
           - Good contrast against the background (white text on semi-transparent dark overlay OR dark text on semi-transparent light overlay)
           - Positioned at the bottom of the image
           - All text MUST be perfectly legible and correctly spelled in Romanian`;

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
