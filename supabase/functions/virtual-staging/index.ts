import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, roomType, style, additionalPrompt } = await req.json();

    console.log("Virtual staging request received");
    console.log("Room type:", roomType);
    console.log("Style:", style);

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

    const prompt = `Transform this empty room into a beautifully furnished ${roomDescription}. 
Use ${styleDescription}. 
The furniture should look realistic and fit naturally in the space. 
Maintain the room's architecture, walls, floors, and windows. 
Add appropriate lighting and shadows for realism.
${additionalPrompt ? `Additional requirements: ${additionalPrompt}` : ""}`;

    console.log("Generated prompt:", prompt);

    // Ensure the image has the correct data URL format
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith("data:image")) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    console.log("Calling Lovable AI for virtual staging...");

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
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Prea multe cereri. Încearcă din nou mai târziu." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credite AI insuficiente. Contactează administratorul." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error: " + errorText);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const message = aiResponse.choices?.[0]?.message;
    if (!message) {
      throw new Error("No message in AI response");
    }

    // Extract the generated image
    const generatedImage = message.images?.[0]?.image_url?.url;
    const textContent = message.content || "";

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(message));
      throw new Error("No image generated. The AI may not have been able to process this image.");
    }

    console.log("Virtual staging completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        stagedImage: generatedImage,
        description: textContent,
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
