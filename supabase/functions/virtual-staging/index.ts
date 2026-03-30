import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - JWT first, anon key fallback
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.56.0");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;

    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) isAuthorized = true;
      } catch (_) {}
    }
    if (!isAuthorized) {
      const apikeyHeader = req.headers.get("apikey");
      if (apikeyHeader === ANON_KEY) isAuthorized = true;
    }
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { imageBase64, roomType, style, additionalPrompt, numberOfImages = 1 } = await req.json();

    console.log("Virtual staging request received");
    console.log("Room type:", roomType);
    console.log("Style:", style);
    console.log("Number of images:", numberOfImages);

    if (!imageBase64) {
      throw new Error("Image is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt for virtual staging
    const roomPrompts: Record<string, string> = {
      living: "living room with sofa, coffee table, TV stand, armchairs, decorative plants, and wall art",
      bedroom: "bedroom with a modern bed, nightstands, wardrobe, dresser, and soft lighting",
      kitchen: "modern kitchen with dining table, chairs, appliances on counter, and decorative items",
      bathroom: "bathroom with towels, bath accessories, plants, and decorative elements",
      office: "home office with desk, ergonomic chair, bookshelves, and office accessories",
      dining: "dining room with elegant dining table, chairs, chandelier, and decorative centerpiece",
    };

    const stylePrompts: Record<string, string> = {
      modern: "modern minimalist style with clean lines, neutral colors, and contemporary furniture",
      classic: "classic elegant style with traditional furniture, warm colors, and ornate details",
      scandinavian: "Scandinavian style with light wood, white walls, simple furniture, and cozy textiles",
      industrial: "industrial style with exposed brick, metal accents, and raw materials",
      bohemian: "bohemian style with colorful textiles, plants, eclectic furniture, and artistic elements",
      luxury: "luxury high-end style with premium materials, designer furniture, and sophisticated decor",
    };

    const roomDescription = roomPrompts[roomType] || roomPrompts.living;
    const styleDescription = stylePrompts[style] || stylePrompts.modern;

    // Ensure the image has the correct data URL format
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith("data:image")) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    // Number of images to generate (max 5)
    const numImages = Math.min(Math.max(1, numberOfImages), 5);
    const generatedImages: { index: number; imageUrl: string; style: string }[] = [];

    console.log(`Generating ${numImages} images...`);

    for (let i = 0; i < numImages; i++) {
      const variationSuffix = numImages > 1 
        ? ` Create variation ${i + 1} with a unique furniture arrangement and slightly different decor choices.`
        : "";

      const prompt = `Transform this empty room into a beautifully furnished ${roomDescription}. 
Use ${styleDescription}. 
The furniture should look realistic and fit naturally in the space. 
Maintain the room's architecture, walls, floors, and windows. 
Add appropriate lighting and shadows for realism.${variationSuffix}
${additionalPrompt ? `Additional requirements: ${additionalPrompt}` : ""}`;

      console.log(`Generating image ${i + 1}/${numImages}...`);

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI gateway error for image ${i + 1}:`, response.status, errorText);

          if (response.status === 429) {
            console.log("Rate limited, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          if (response.status === 402) {
            if (generatedImages.length === 0) {
              return new Response(
                JSON.stringify({ error: "Credite AI insuficiente. Contactează administratorul." }),
                { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            break;
          }
          continue;
        }

        const aiResponse = await response.json();
        const message = aiResponse.choices?.[0]?.message;
        const generatedImage = message?.images?.[0]?.image_url?.url;

        if (generatedImage) {
          generatedImages.push({
            index: i + 1,
            imageUrl: generatedImage,
            style: `${style} - Variație ${i + 1}`,
          });
          console.log(`Successfully generated image ${i + 1}`);
        }

        // Small delay between requests to avoid rate limiting
        if (i < numImages - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.error(`Error generating image ${i + 1}:`, err);
        continue;
      }
    }

    if (generatedImages.length === 0) {
      throw new Error("Nu s-a putut genera nicio imagine. Încearcă din nou.");
    }

    console.log(`Virtual staging completed: ${generatedImages.length} images generated`);

    return new Response(
      JSON.stringify({
        success: true,
        images: generatedImages,
        totalGenerated: generatedImages.length,
        // For backwards compatibility
        stagedImage: generatedImages[0]?.imageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in virtual-staging:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
