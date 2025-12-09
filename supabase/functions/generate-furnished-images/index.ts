import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const roomTypePrompts: Record<string, string> = {
  living: "spacious living room with comfortable sofa, coffee table, TV area, and elegant decor",
  bedroom: "cozy bedroom with luxurious bed, bedside tables, wardrobe, and soft lighting",
  kitchen: "modern kitchen with sleek cabinets, countertops, appliances, and dining area",
  bathroom: "elegant bathroom with modern fixtures, bathtub or shower, vanity, and tiles",
  office: "home office with desk, comfortable chair, bookshelves, and good lighting",
  dining: "dining room with large table, chairs, chandelier, and decorative elements",
  balcony: "furnished balcony or terrace with outdoor furniture, plants, and city view",
  hallway: "welcoming hallway with console table, mirror, coat rack, and ambient lighting",
};

const stylePrompts: Record<string, string> = {
  modern: "contemporary modern style with clean lines, neutral colors, and minimalist furniture",
  minimalist: "minimalist design with simple forms, monochromatic palette, and essential furniture only",
  classic: "classic elegant style with ornate details, rich textures, and traditional furniture",
  scandinavian: "Scandinavian style with light wood, white walls, cozy textiles, and hygge atmosphere",
  industrial: "industrial style with exposed brick, metal accents, raw materials, and urban feel",
  luxury: "luxury high-end style with premium materials, designer furniture, and sophisticated decor",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, roomType, style, numberOfImages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting image generation with description:', description);
    console.log('Room type:', roomType, 'Style:', style, 'Number of images:', numberOfImages);

    const roomPrompt = roomTypePrompts[roomType] || roomTypePrompts.living;
    const stylePrompt = stylePrompts[style] || stylePrompts.modern;

    const generatedImages = [];
    const numImages = Math.min(numberOfImages || 4, 8);

    for (let i = 0; i < numImages; i++) {
      const prompt = `Professional real estate photography of ${roomPrompt}, ${stylePrompt}. 
      Additional details: ${description}. 
      Ultra-realistic interior design photo, high-end apartment, professional lighting, 
      architectural photography, 4K quality, magazine-worthy composition, warm and inviting atmosphere.
      Variation ${i + 1} with slightly different angle and lighting.`;

      console.log(`Generating image ${i + 1}/${numImages}`);

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
              content: prompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error generating image ${i + 1}:`, response.status, errorText);
        
        if (response.status === 429) {
          console.log('Rate limited, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        continue;
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        generatedImages.push({
          index: i + 1,
          imageUrl,
          roomType: `${style} ${roomType}`
        });
        console.log(`Successfully generated image ${i + 1}`);
      }

      // Small delay to avoid rate limiting
      if (i < numImages - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
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