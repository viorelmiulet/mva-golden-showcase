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
    const { planImageUrl, apartmentDetails } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting image generation for plan:', planImageUrl);

    const roomTypes = [
      'living modern cu canapea și masă de cafea',
      'bucătărie contemporană cu mobilier alb',
      'dormitor matrimonial cu pat dublu',
      'baie luxoasă cu cadă',
      'birou modern cu bibliotecă',
      'dining cu masă mare',
      'dormitor copii colorat',
      'hol elegant cu dulap',
      'balcon amenajat cu plante',
      'living luminous cu ferestre mari'
    ];

    const generatedImages = [];

    for (let i = 0; i < 10; i++) {
      const prompt = `Bazat pe acest plan de apartament, generează o imagine foto-realistă de interior mobilat și decorat elegant, stil ${roomTypes[i]}. 
      ${apartmentDetails || ''} 
      Imagini ultra realiste, lighting profesional, design interior modern și luxos, fotografic de calitate înaltă.`;

      console.log(`Generating image ${i + 1}/10 with prompt:`, prompt);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: planImageUrl
                  }
                }
              ]
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error generating image ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        generatedImages.push({
          index: i + 1,
          imageUrl,
          roomType: roomTypes[i]
        });
        console.log(`Successfully generated image ${i + 1}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Generated ${generatedImages.length} images successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        images: generatedImages,
        totalGenerated: generatedImages.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-furnished-images:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});