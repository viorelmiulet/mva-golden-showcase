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
  exterior: "modern apartment building exterior with beautiful facade, landscaping, and entrance",
  pool: "luxury swimming pool area with sun loungers, umbrellas, and tropical plants",
  garden: "beautiful garden with lawn, flower beds, outdoor seating, and pathways",
};

const stylePrompts: Record<string, string> = {
  modern: "contemporary modern style with clean lines, neutral colors, and minimalist furniture",
  minimalist: "minimalist design with simple forms, monochromatic palette, and essential furniture only",
  classic: "classic elegant style with ornate details, rich textures, and traditional furniture",
  scandinavian: "Scandinavian style with light wood, white walls, cozy textiles, and hygge atmosphere",
  industrial: "industrial style with exposed brick, metal accents, raw materials, and urban feel",
  luxury: "luxury high-end style with premium materials, designer furniture, and sophisticated decor",
  bohemian: "bohemian style with colorful textiles, plants, eclectic patterns, and artistic elements",
  art_deco: "Art Deco style with geometric patterns, bold colors, luxurious materials, and glamorous details",
  rustic: "rustic style with natural wood, stone elements, warm colors, and cozy country feel",
  coastal: "Mediterranean coastal style with white and blue colors, natural materials, and seaside vibes",
};

const lightingPrompts: Record<string, string> = {
  natural: "beautiful natural daylight streaming through windows",
  warm: "warm golden hour lighting with soft shadows",
  bright: "bright and airy lighting with even illumination",
  dramatic: "dramatic lighting with strong contrasts and shadows",
  soft: "soft diffused lighting creating a calm atmosphere",
  evening: "evening ambiance with warm artificial lights and city lights outside",
};

const photoStylePrompts: Record<string, string> = {
  professional: "professional real estate photography, magazine quality, sharp details",
  magazine: "interior design magazine cover photo, editorial style, perfectly styled",
  cozy: "cozy and inviting atmosphere, warm and welcoming feeling",
  staging: "professional home staging photography, selling point highlights",
  "3d_render": "photorealistic 3D architectural rendering, CGI quality",
  architectural: "architectural photography, emphasizing space and structure",
};

const DEFAULT_LOGO_URL = "https://fdpandnzblzvamhsoukt.supabase.co/storage/v1/object/public/public-assets/mva-logo-luxury-white.svg";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      description, 
      roomType, 
      style, 
      numberOfImages,
      aspectRatio = "16:9",
      lighting = "natural",
      photoStyle = "professional",
      includeLogo = false,
      useCustomLogo = false,
      customLogoBase64 = null,
      logoPosition = "bottom-right",
      logoSize = "medium"
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting image generation with description:', description);
    console.log('Room type:', roomType, 'Style:', style, 'Number of images:', numberOfImages);
    console.log('Aspect ratio:', aspectRatio, 'Lighting:', lighting, 'Photo style:', photoStyle);
    console.log('Include logo:', includeLogo, 'Use custom logo:', useCustomLogo);

    const roomPrompt = roomTypePrompts[roomType] || roomTypePrompts.living;
    const stylePrompt = stylePrompts[style] || stylePrompts.modern;
    const lightingPrompt = lightingPrompts[lighting] || lightingPrompts.natural;
    const photoStylePrompt = photoStylePrompts[photoStyle] || photoStylePrompts.professional;

    // Build logo instruction
    let logoInstruction = "";
    if (includeLogo) {
      const positionMap: Record<string, string> = {
        "bottom-right": "bottom right corner",
        "bottom-left": "bottom left corner",
        "top-right": "top right corner",
        "top-left": "top left corner",
        "center": "center of the image",
      };
      const sizeMap: Record<string, string> = {
        small: "small and subtle",
        medium: "medium sized",
        large: "prominent and visible",
      };
      
      const logoDesc = useCustomLogo && customLogoBase64 
        ? "the provided company logo"
        : "a subtle 'MVA IMOBILIARE' watermark text";
      
      logoInstruction = ` Include ${logoDesc} as a ${sizeMap[logoSize] || "medium sized"} watermark in the ${positionMap[logoPosition] || "bottom right corner"}, semi-transparent.`;
    }

    const generatedImages = [];
    const numImages = Math.min(numberOfImages || 4, 8);

    for (let i = 0; i < numImages; i++) {
      const prompt = `${photoStylePrompt} of ${roomPrompt}, ${stylePrompt}. 
      ${lightingPrompt}. Additional details: ${description}. 
      Ultra-realistic interior design photo, high-end apartment, ${aspectRatio} aspect ratio,
      4K quality, magazine-worthy composition.${logoInstruction}
      Variation ${i + 1} with slightly different angle and composition.`;

      console.log(`Generating image ${i + 1}/${numImages}`);

      const messages: any[] = [
        {
          role: 'user',
          content: useCustomLogo && customLogoBase64 
            ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: customLogoBase64 } }
              ]
            : prompt
        }
      ];

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages,
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
