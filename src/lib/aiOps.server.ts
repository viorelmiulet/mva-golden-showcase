/**
 * Server-only implementation of the AI / scraping edge functions (wave 3).
 * Ports: ai-property-recommendations, extract-id-data, extract-company-data,
 *        generate-facebook-content, generate-furnished-images,
 *        virtual-staging, scrape-property, chat-assistant.
 *
 * Behaviour (payloads, prompts, models, response shapes) is kept identical
 * to the original Supabase Edge Functions so existing call sites keep working.
 *
 * NOTE ON AUTH: the original edge functions re-validated the caller's
 * Supabase JWT / anon key inside the function body. Since these are now
 * TanStack server functions invoked directly from our own trusted frontend
 * (same pattern as wave 2's admin.server.ts), that redundant auth re-check
 * is not reproduced here.
 */

type AnyRecord = Record<string, unknown>;
type Result = AnyRecord;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
  };
}

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function aiErrorResponse(status: number, fallbackMessage: string): Result {
  if (status === 429) return { error: "Prea multe cereri. Încearcă din nou mai târziu." };
  if (status === 402) return { error: "Credite AI insuficiente. Contactează administratorul." };
  return { error: fallbackMessage };
}

/* ------------------------------------------------------------------ */
/* ai-property-recommendations                                         */
/* ------------------------------------------------------------------ */

export async function aiPropertyRecommendations(body: AnyRecord): Promise<Result> {
  const { clientId, preferences } = body as { clientId?: string; preferences?: unknown };
  console.log("Received request for client:", clientId);
  console.log("Preferences:", JSON.stringify(preferences));

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const supabase = await db();
  const { data: properties, error: propertiesError } = await supabase
    .from("catalog_offers")
    .select("*")
    .eq("availability_status", "available")
    .limit(50);

  if (propertiesError) {
    console.error("Error fetching properties:", propertiesError);
    throw propertiesError;
  }

  console.log(`Found ${properties?.length || 0} available properties`);

  if (!properties || properties.length === 0) {
    return { recommendations: [], message: "Nu există proprietăți disponibile" };
  }

  const propertiesSummary = properties.map((p: any) => ({
    id: p.id,
    title: p.title,
    location: p.location,
    price_min: p.price_min,
    price_max: p.price_max,
    surface_min: p.surface_min,
    surface_max: p.surface_max,
    rooms: p.rooms,
    features: p.features,
    amenities: p.amenities,
    project_name: p.project_name,
  }));

  const systemPrompt = `Ești un agent imobiliar expert care ajută clienții să găsească proprietatea perfectă.
Analizează preferințele clientului și lista de proprietăți disponibile.
Returnează un JSON cu proprietățile recomandate, ordonate după relevanță (cele mai potrivite primele).
Pentru fiecare recomandare, explică de ce se potrivește preferințelor clientului.`;

  const userPrompt = `Preferințele clientului:
${JSON.stringify(preferences, null, 2)}

Proprietăți disponibile:
${JSON.stringify(propertiesSummary, null, 2)}

Analizează și returnează un JSON în formatul:
{
  "recommendations": [
    {
      "property_id": "id-ul proprietății",
      "match_score": 95,
      "reasons": ["motiv 1", "motiv 2"]
    }
  ]
}

Returnează maxim 5 proprietăți, ordonate după scorul de potrivire (descrescător).
Consideră prețul, suprafața, numărul de camere, locația și facilitățile.`;

  console.log("Calling Lovable AI for recommendations...");

  const response = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    if (response.status === 429 || response.status === 402) {
      return aiErrorResponse(response.status, "AI gateway error: " + errorText);
    }
    throw new Error("AI gateway error: " + errorText);
  }

  const aiResponse = await response.json();
  console.log("AI response received");

  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");

  let aiRecommendations: any;
  try {
    aiRecommendations = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid AI response format");
  }

  const enrichedRecommendations = (aiRecommendations.recommendations || [])
    .map((rec: any) => {
      const property = properties.find((p: any) => p.id === rec.property_id);
      return { ...rec, property };
    })
    .filter((rec: any) => rec.property);

  console.log(`Returning ${enrichedRecommendations.length} recommendations`);
  return { recommendations: enrichedRecommendations };
}

/* ------------------------------------------------------------------ */
/* extract-id-data                                                     */
/* ------------------------------------------------------------------ */

function stripJsonFences(content: string): string {
  let cleaned = content;
  if (content.includes("```json")) {
    cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  } else if (content.includes("```")) {
    cleaned = content.replace(/```\s*/g, "");
  }
  return cleaned;
}

export async function extractIdData(body: AnyRecord): Promise<Result> {
  const { imageBase64, imageBase64List } = body as { imageBase64?: string; imageBase64List?: string[] };

  const images: string[] =
    Array.isArray(imageBase64List) && imageBase64List.length > 0
      ? imageBase64List
      : imageBase64
        ? [imageBase64]
        : [];

  if (images.length === 0) {
    return { error: "Image is required" };
  }

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  console.log(`Extracting data from ${images.length} ID image(s)...`);

  const userContent: Array<Record<string, unknown>> = [
    {
      type: "text",
      text:
        images.length > 1
          ? `Extrage toate datele din aceste ${images.length} imagini ale aceluiași document de identitate (ex: față + verso CI românească, sau ambele fețe ale unui permis de ședere). Combină informațiile într-un singur JSON conform schemei.`
          : "Extrage toate datele din această carte de identitate românească:",
    },
    ...images.map((img) => ({
      type: "image_url",
      image_url: {
        url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
      },
    })),
  ];

  const response = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
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
}`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return { error: "Limită de cereri depășită. Încercați din nou mai târziu." };
    }
    if (response.status === 402) {
      return { error: "Credit insuficient. Adăugați fonduri în workspace." };
    }
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  console.log("AI response:", content);

  let extractedData: any;
  try {
    const cleanedContent = stripJsonFences(content);
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
      console.log("Extracted data:", JSON.stringify(extractedData));
    } else {
      throw new Error("No JSON found in response");
    }
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    return { error: "Nu s-au putut extrage datele din imagine. Asigurați-vă că imaginea este clară." };
  }

  return { data: extractedData };
}

/* ------------------------------------------------------------------ */
/* extract-company-data                                                */
/* ------------------------------------------------------------------ */

export async function extractCompanyData(body: AnyRecord): Promise<Result> {
  const { imageBase64 } = body as { imageBase64?: string };
  if (!imageBase64) return { error: "Image is required" };

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  console.log("Extracting company data from certificate...");

  const response = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
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
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrage datele firmei din acest certificat de înmatriculare:" },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return { error: "Limită de cereri depășită. Încercați din nou mai târziu." };
    }
    if (response.status === 402) {
      return { error: "Credit insuficient. Adăugați fonduri în workspace." };
    }
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  console.log("AI response:", content);

  let extractedData: any;
  try {
    const cleanedContent = stripJsonFences(content);
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    return { error: "Nu s-au putut extrage datele firmei. Asigurați-vă că imaginea este clară." };
  }

  return { data: extractedData };
}

/* ------------------------------------------------------------------ */
/* generate-facebook-content                                           */
/* ------------------------------------------------------------------ */

export async function generateFacebookContent(body: AnyRecord): Promise<Result> {
  const { type, propertyData, customPrompt } = body as {
    type?: string;
    propertyData?: any;
    customPrompt?: string;
  };

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  console.log("Generating content for type:", type);

  if (type === "text") {
    const textPrompt =
      customPrompt ||
      (propertyData
        ? `Creează un text promoțional FOARTE DETALIAT și captivant pentru Facebook pentru agenția imobiliară MVA IMOBILIARE. 
           Proprietate: ${propertyData.title || "Proprietate exclusivă"}
           Locație: ${propertyData.location || "Locație excelentă"}
           Preț: ${propertyData.price ? `${propertyData.price} EUR` : "Preț atractiv"}
           Cameră: ${propertyData.rooms || "-"}
           Suprafață: ${propertyData.surface ? `${propertyData.surface} mp` : "-"}
           
           Textul trebuie să fie:
           - FOARTE LUNG și EXTREM DE DETALIAT (minim 1200-1500 caractere pentru conținutul principal)
           - Profesional dar accesibil și prietenos
           - Să folosească MULTE emoticoane relevante pe tot parcursul textului (🏠 🌟 ✨ 🔑 💎 🏡 🌳 🚗 🛋️ 🍽️ 🛁 🚿 💡 🎯 ⭐ 📍 🌆 🏢 etc.)
           - Să evidențieze în detaliu toate punctele forte și avantajele proprietății
           - Să descrie extensiv caracteristicile și facilitățile
           - Să prezinte zona și vecinătatea în detaliu
           - Să creeze o imagine vie, bogată și atractivă a proprietății
           - Să includă call-to-action puternic la final
           - În limba română
           - NU folosi cuvintele "lux" sau "luxury"
           
           La final adaugă OBLIGATORIU pe linii separate:
           📞 0767.941.512
           📧 contact@mvaimobiliare.ro
           🌐 mvaimobiliare.ro`
        : `Creează un text promoțional FOARTE DETALIAT și captivant pentru Facebook pentru agenția imobiliară MVA IMOBILIARE. 
           Textul trebuie să:
           - Fie EXTREM DE LUNG și DETALIAT (minim 1200-1500 caractere pentru conținutul principal)
           - Să folosească MULTE emoticoane relevante pe tot parcursul textului
           - Prezinte în detaliu TOATE serviciile și avantajele agenției
           - Fie profesional, atractiv și FOARTE cuprinzător
           - Să includă call-to-action puternic
           - Fie în limba română
           - NU folosi cuvintele "lux" sau "luxury"
           
           La final adaugă OBLIGATORIU pe linii separate:
           📞 0767.941.512
           📧 contact@mvaimobiliare.ro
           🌐 mvaimobiliare.ro`);

    const textResponse = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ești un expert în marketing imobiliar și creezi conținut promoțional pentru social media." },
          { role: "user", content: textPrompt },
        ],
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("Text generation error:", textResponse.status, errorText);
      throw new Error(`Failed to generate text: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const generatedText = textData.choices[0].message.content;
    return { text: generatedText };
  } else if (type === "image") {
    const imagePrompt = propertyData
      ? `Create a professional real estate promotional image for Facebook with a COMPLETE SCENE (NO WHITE BACKGROUND). 
           Modern ${propertyData.rooms || "2"}-room apartment in ${propertyData.location || "excellent location"}.
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
           - A golden roof-line silhouette (two angled strokes meeting at a peak) with a small chimney on the right slope
           - Below the roof: "MVA" in serif capitals — M and A in gold, V in silver
           - Below MVA: "IMOBILIARE" in smaller golden letters with wide letter-spacing
           - The logo has a premium, elegant golden color (#DAA520 to #FFE7A0 gradient)
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
           - A golden roof-line silhouette (two angled strokes meeting at a peak) with a small chimney on the right slope
           - Below the roof: "MVA" in serif capitals — M and A in gold, V in silver
           - Below MVA: "IMOBILIARE" in smaller golden letters with wide letter-spacing
           - The logo has a premium, elegant golden color (#DAA520 to #FFE7A0 gradient)
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

    const imageResponse = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image generation error:", imageResponse.status, errorText);
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedImage) throw new Error("No image generated");

    return { image: generatedImage };
  }

  throw new Error("Invalid type specified");
}

/* ------------------------------------------------------------------ */
/* generate-furnished-images                                           */
/* ------------------------------------------------------------------ */

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

const styleDescPrompts: Record<string, string> = {
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

export async function generateFurnishedImages(body: AnyRecord): Promise<Result> {
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
    logoSize = "medium",
  } = body as AnyRecord & {
    description?: string;
    roomType?: string;
    style?: string;
    numberOfImages?: number;
    aspectRatio?: string;
    lighting?: string;
    photoStyle?: string;
    includeLogo?: boolean;
    useCustomLogo?: boolean;
    customLogoBase64?: string | null;
    logoPosition?: string;
    logoSize?: string;
  };

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  console.log("Starting image generation with description:", description);
  console.log("Room type:", roomType, "Style:", style, "Number of images:", numberOfImages);
  console.log("Aspect ratio:", aspectRatio, "Lighting:", lighting, "Photo style:", photoStyle);
  console.log("Include logo:", includeLogo, "Use custom logo:", useCustomLogo);

  const roomPrompt = roomTypePrompts[roomType as string] || roomTypePrompts.living;
  const stylePrompt = styleDescPrompts[style as string] || styleDescPrompts.modern;
  const lightingPrompt = lightingPrompts[lighting] || lightingPrompts.natural;
  const photoStylePrompt = photoStylePrompts[photoStyle] || photoStylePrompts.professional;

  let logoInstruction = "";
  if (includeLogo) {
    const positionMap: Record<string, string> = {
      "bottom-right": "bottom right corner",
      "bottom-left": "bottom left corner",
      "top-right": "top right corner",
      "top-left": "top left corner",
      center: "center of the image",
    };
    const sizeMap: Record<string, string> = {
      small: "small and subtle",
      medium: "medium sized",
      large: "prominent and visible",
    };

    const logoDesc = useCustomLogo && customLogoBase64 ? "the provided company logo" : "a subtle 'MVA IMOBILIARE' watermark text";

    logoInstruction = ` Include ${logoDesc} as a ${sizeMap[logoSize] || "medium sized"} watermark in the ${positionMap[logoPosition] || "bottom right corner"}, semi-transparent.`;
  }

  const generatedImages: Array<{ index: number; imageUrl: string; roomType: string }> = [];
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
        role: "user",
        content:
          useCustomLogo && customLogoBase64
            ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: customLogoBase64 } },
              ]
            : prompt,
      },
    ];

    const response = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error generating image ${i + 1}:`, response.status, errorText);

      if (response.status === 429) {
        console.log("Rate limited, waiting before retry...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      continue;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (imageUrl) {
      generatedImages.push({ index: i + 1, imageUrl, roomType: `${style} ${roomType}` });
      console.log(`Successfully generated image ${i + 1}`);
    }

    if (i < numImages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.log(`Generated ${generatedImages.length} images successfully`);

  return {
    success: true,
    images: generatedImages,
    totalGenerated: generatedImages.length,
  };
}

/* ------------------------------------------------------------------ */
/* virtual-staging                                                     */
/* ------------------------------------------------------------------ */

const vsRoomPrompts: Record<string, string> = {
  living: "living room with sofa, coffee table, TV stand, armchairs, decorative plants, and wall art",
  bedroom: "bedroom with a modern bed, nightstands, wardrobe, dresser, and soft lighting",
  kitchen: "modern kitchen with dining table, chairs, appliances on counter, and decorative items",
  bathroom: "bathroom with towels, bath accessories, plants, and decorative elements",
  office: "home office with desk, ergonomic chair, bookshelves, and office accessories",
  dining: "dining room with elegant dining table, chairs, chandelier, and decorative centerpiece",
};

const vsStylePrompts: Record<string, string> = {
  modern: "modern minimalist style with clean lines, neutral colors, and contemporary furniture",
  classic: "classic elegant style with traditional furniture, warm colors, and ornate details",
  scandinavian: "Scandinavian style with light wood, white walls, simple furniture, and cozy textiles",
  industrial: "industrial style with exposed brick, metal accents, and raw materials",
  bohemian: "bohemian style with colorful textiles, plants, eclectic furniture, and artistic elements",
  luxury: "luxury high-end style with premium materials, designer furniture, and sophisticated decor",
};

export async function virtualStaging(body: AnyRecord): Promise<Result> {
  const { imageBase64, roomType, style, additionalPrompt, numberOfImages = 1 } = body as {
    imageBase64?: string;
    roomType?: string;
    style?: string;
    additionalPrompt?: string;
    numberOfImages?: number;
  };

  console.log("Virtual staging request received");
  console.log("Room type:", roomType);
  console.log("Style:", style);
  console.log("Number of images:", numberOfImages);

  if (!imageBase64) throw new Error("Image is required");

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const roomDescription = vsRoomPrompts[roomType as string] || vsRoomPrompts.living;
  const styleDescription = vsStylePrompts[style as string] || vsStylePrompts.modern;

  let imageUrl = imageBase64;
  if (!imageBase64.startsWith("data:image")) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const numImages = Math.min(Math.max(1, numberOfImages), 5);
  const generatedImages: { index: number; imageUrl: string; style: string }[] = [];

  console.log(`Generating ${numImages} images...`);

  for (let i = 0; i < numImages; i++) {
    const variationSuffix =
      numImages > 1 ? ` Create variation ${i + 1} with a unique furniture arrangement and slightly different decor choices.` : "";

    const prompt = `Transform this empty room into a beautifully furnished ${roomDescription}. 
Use ${styleDescription}. 
The furniture should look realistic and fit naturally in the space. 
Maintain the room's architecture, walls, floors, and windows. 
Add appropriate lighting and shadows for realism.${variationSuffix}
${additionalPrompt ? `Additional requirements: ${additionalPrompt}` : ""}`;

    console.log(`Generating image ${i + 1}/${numImages}...`);

    try {
      const response = await fetch(LOVABLE_GATEWAY, {
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
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
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
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        if (response.status === 402) {
          if (generatedImages.length === 0) {
            return { error: "Credite AI insuficiente. Contactează administratorul." };
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

      if (i < numImages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
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

  return {
    success: true,
    images: generatedImages,
    totalGenerated: generatedImages.length,
    stagedImage: generatedImages[0]?.imageUrl,
  };
}

/* ------------------------------------------------------------------ */
/* scrape-property                                                     */
/* ------------------------------------------------------------------ */

interface ScrapedProperty {
  title: string;
  description: string;
  location: string;
  images: string[];
  price_min: number;
  price_max: number;
  currency: string;
  rooms: number;
  features: string[];
}

function extractQuickly(html: string, text: string): ScrapedProperty {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/\s*-\s*(imobiliare\.ro|OLX|Anunturi).*$/i, "");
  }

  let description = "";
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,200})/i);
  if (descMatch) description = descMatch[1];

  let location = "București";
  const locationMatch = text.match(/(sector\s*[0-9]+|bucuresti[^,]*)/i);
  if (locationMatch) location = locationMatch[0].trim();

  let price_min = 0;
  let price_max = 0;
  let currency = "EUR";

  const eurPriceMatch = text.match(/€\s*([0-9.,]+)|([0-9.,]+)\s*€|([0-9.,]+)\s*eur/gi);
  if (eurPriceMatch && price_min === 0) {
    for (const match of eurPriceMatch) {
      const priceStr = match.replace(/[€eur\s.,]/gi, "");
      const price = parseInt(priceStr);
      if (price > 1000 && price < 10000000) {
        price_min = price_max = price;
        currency = "EUR";
        console.log(`Found EUR price: ${price} EUR`);
        break;
      }
    }
  }

  if (price_min === 0) {
    const leiPriceMatch = text.match(/([0-9.,]+)\s*(lei|ron)\b/gi);
    if (leiPriceMatch) {
      for (const match of leiPriceMatch) {
        const priceStr = match.replace(/[lei|ron\s.,]/gi, "");
        const leiPrice = parseInt(priceStr);
        if (leiPrice > 10000 && leiPrice < 50000000) {
          price_min = price_max = leiPrice;
          currency = "LEI";
          console.log(`Found LEI price: ${leiPrice} LEI`);
          break;
        }
      }
    }
  }

  if (price_min === 0) {
    const metaPriceMatch = html.match(/price['":\s]*([0-9.,]+)/gi);
    if (metaPriceMatch) {
      for (const match of metaPriceMatch) {
        const priceStr = match.replace(/[^0-9]/g, "");
        const price = parseInt(priceStr);
        if (price > 10000 && price < 10000000) {
          price_min = price_max = price;
          currency = "EUR";
          console.log(`Found meta price: ${price} EUR`);
          break;
        }
      }
    }
  }

  if (price_min === 0) {
    const pricePatterns = [
      /pret[^0-9]*([0-9.,]+)\s*(eur|lei|ron|€)/gi,
      /cost[^0-9]*([0-9.,]+)\s*(eur|lei|ron|€)/gi,
      /([0-9]{4,7})\s*(eur|euro|€|lei|ron)/gi,
      /([0-9]{4,7})\s*(?!mp|m²|metri|camere|cam|room)/g,
    ];

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const priceStr = match.replace(/[^0-9]/g, "");
          const price = parseInt(priceStr);

          if (match.toLowerCase().includes("eur") || match.includes("€")) {
            currency = "EUR";
          } else if (match.toLowerCase().includes("lei") || match.toLowerCase().includes("ron")) {
            currency = "LEI";
          } else {
            currency = price > 100000 ? "LEI" : "EUR";
          }

          if (price > 5000 && price < 50000000) {
            price_min = price_max = price;
            console.log(`Found price pattern: ${price} ${currency}`);
            break;
          }
        }
        if (price_min > 0) break;
      }
    }
  }

  let rooms = 0;

  const roomPatterns = [
    /([0-9]+)\s*cam/gi,
    /([0-9]+)\s*camera/gi,
    /([0-9]+)\s*rooms/gi,
    /garsoniera/gi,
    /([1-5])\s*(?=\s*(?:cam|camera|rooms))/gi,
  ];

  for (const pattern of roomPatterns) {
    if (pattern.source.includes("garsoniera")) {
      if (text.toLowerCase().includes("garsoniera")) {
        rooms = 1;
        console.log("Found garsoniera (1 room)");
        break;
      }
    } else {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const roomStr = match.replace(/[^0-9]/g, "");
          const roomCount = parseInt(roomStr);
          if (roomCount > 0 && roomCount <= 10) {
            rooms = roomCount;
            console.log(`Found rooms: ${roomCount}`);
            break;
          }
        }
        if (rooms > 0) break;
      }
    }
  }

  if (rooms === 0) {
    const metaRoomsMatch = html.match(/rooms?['":\s]*([0-9]+)/gi);
    if (metaRoomsMatch) {
      for (const match of metaRoomsMatch) {
        const roomStr = match.replace(/[^0-9]/g, "");
        const roomCount = parseInt(roomStr);
        if (roomCount > 0 && roomCount <= 10) {
          rooms = roomCount;
          console.log(`Found meta rooms: ${roomCount}`);
          break;
        }
      }
    }
  }

  if (rooms === 0) {
    if (text.toLowerCase().includes("studio") || text.toLowerCase().includes("garsoniera")) {
      rooms = 1;
      console.log("Found studio/garsoniera indicator");
    } else if (text.toLowerCase().includes("apartament")) {
      const apartmentMatch = text.match(/apartament[^0-9]*([1-5])/gi);
      if (apartmentMatch) {
        const roomStr = apartmentMatch[0].replace(/[^0-9]/g, "");
        const roomCount = parseInt(roomStr);
        if (roomCount > 0 && roomCount <= 5) {
          rooms = roomCount;
          console.log(`Found apartment rooms: ${roomCount}`);
        }
      }
    }
  }

  const features: string[] = [];
  const quickFeatures = ["balcon", "parcare", "lift", "centrala"];
  const textLower = text.toLowerCase();
  quickFeatures.forEach((feature) => {
    if (textLower.includes(feature)) {
      features.push(feature.charAt(0).toUpperCase() + feature.slice(1));
    }
  });

  const images: string[] = [];
  const imageUrls = new Set<string>();

  const imgMatches = html.match(/<img[^>]+>/gi);
  if (imgMatches) {
    imgMatches.forEach((imgTag) => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const dataSrcMatch = imgTag.match(/data-src=["']([^"']+)["']/i);
      const srcSetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);

      [srcMatch?.[1], dataSrcMatch?.[1], srcSetMatch?.[1]].forEach((src) => {
        if (src) {
          let cleanSrc = src.split(",")[0].split(" ")[0];
          if (cleanSrc.startsWith("//")) {
            cleanSrc = "https:" + cleanSrc;
          } else if (cleanSrc.startsWith("/")) {
            const urlObj = new URL(html.includes("olx.ro") ? "https://www.olx.ro" : "https://www.imobiliare.ro");
            cleanSrc = urlObj.origin + cleanSrc;
          }

          if (
            cleanSrc.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) &&
            !cleanSrc.match(/(logo|icon|sprite|avatar|btn|button)/i) &&
            cleanSrc.length > 20
          ) {
            imageUrls.add(cleanSrc);
          }
        }
      });
    });
  }

  const olxImagePatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/gi);
  if (olxImagePatches) {
    olxImagePatches.forEach((url) => {
      if (!url.match(/(logo|icon|sprite|avatar)/i) && url.length > 30) {
        imageUrls.add(url);
      }
    });
  }

  const bgMatches = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi);
  if (bgMatches) {
    bgMatches.forEach((bgMatch) => {
      const urlMatch = bgMatch.match(/url\(["']?([^"')]+)["']?\)/i);
      if (urlMatch && urlMatch[1]) {
        let src = urlMatch[1];
        if (src.startsWith("//")) src = "https:" + src;
        if (src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) && !src.match(/(logo|icon)/i)) {
          imageUrls.add(src);
        }
      }
    });
  }

  const finalImages = Array.from(imageUrls).slice(0, 10);

  const validationErrors: string[] = [];
  if (price_min === 0) validationErrors.push("Prețul nu a putut fi găsit");
  if (rooms === 0) validationErrors.push("Numărul de camere nu a putut fi găsit");

  console.log(`Validation results for "${title}":`, { price_min, currency, rooms, errors: validationErrors });

  if (validationErrors.length > 0) {
    const errorMsg = `Date obligatorii lipsă pentru "${title}": ${validationErrors.join(", ")}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return {
    title: title || "Proprietate",
    description: description || "Descriere indisponibilă",
    location,
    images: finalImages,
    price_min,
    price_max,
    currency,
    rooms,
    features,
  };
}

export async function scrapeProperty(body: AnyRecord): Promise<Result> {
  const { url } = body as { url?: string };

  if (!url) {
    return { success: false, error: "URL is required" };
  }

  console.log("Scraping property from URL:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").substring(0, 50000);

    clearTimeout(timeoutId);

    console.log(`Processing content: ${text.length} characters`);

    try {
      const property = extractQuickly(html, text);
      console.log("Successfully scraped property:", property.title);
      return { success: true, property };
    } catch (extractError: any) {
      console.error("Extraction error:", extractError?.message);
      return {
        success: false,
        error: `Nu am putut extrage datele necesare: ${extractError?.message || "Unknown extraction error"}`,
      };
    }
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    console.error("Fetch error:", fetchError);
    if (fetchError.name === "AbortError") {
      return { success: false, error: "Timpul de așteptare a expirat - site-ul nu răspunde" };
    }
    return { success: false, error: `Eroare la accesarea site-ului: ${fetchError.message}` };
  }
}

/* ------------------------------------------------------------------ */
/* chat-assistant                                                      */
/* ------------------------------------------------------------------ */

export async function chatAssistant(body: AnyRecord): Promise<Result> {
  const { message, conversationHistory = [], sessionId } = body as {
    message?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    sessionId?: string;
  };

  if (!message) throw new Error("Message is required");

  const currentSessionId = sessionId || crypto.randomUUID();

  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

  if (!deepseekApiKey) {
    console.error("DEEPSEEK_API_KEY environment variable is not set");
    throw new Error("DeepSeek API key not configured");
  }

  console.log("DeepSeek API key found:", deepseekApiKey ? "Yes" : "No");
  console.log("Perplexity API key found:", perplexityApiKey ? "Yes" : "No");

  const supabase = await db();

  const { error: saveUserError } = await supabase.from("chat_conversations").insert({
    session_id: currentSessionId,
    message: message,
    role: "user",
  });
  if (saveUserError) console.error("Error saving user message:", saveUserError);

  const lowerMessage = message.toLowerCase();
  let catalogQuery = supabase
    .from("catalog_offers")
    .select("*")
    .eq("availability_status", "available")
    .order("is_featured", { ascending: false });

  if (lowerMessage.includes("garsoniera") || lowerMessage.includes("studio")) {
    catalogQuery = catalogQuery.eq("rooms", 1);
    console.log("Filtering: garsoniera (1 room)");
  } else if (lowerMessage.match(/\b1\s*cam/i)) {
    catalogQuery = catalogQuery.eq("rooms", 1);
    console.log("Filtering: 1 camera");
  } else if (lowerMessage.match(/\b2\s*cam/i)) {
    catalogQuery = catalogQuery.eq("rooms", 2);
    console.log("Filtering: 2 camere");
  } else if (lowerMessage.match(/\b3\s*cam/i)) {
    catalogQuery = catalogQuery.eq("rooms", 3);
    console.log("Filtering: 3 camere");
  } else if (lowerMessage.match(/\b4\s*cam/i)) {
    catalogQuery = catalogQuery.eq("rooms", 4);
    console.log("Filtering: 4 camere");
  }

  const priceMatch = lowerMessage.match(/(\d+)[.,]?(\d+)?\s*(?:k|mii|euro|eur|€)/i);
  if (priceMatch) {
    let maxPrice = parseInt(priceMatch[1]);
    if (priceMatch[2]) maxPrice = parseInt(priceMatch[1] + priceMatch[2]);
    if (lowerMessage.includes("k") || lowerMessage.includes("mii")) maxPrice *= 1000;

    if (
      lowerMessage.includes("pana") ||
      lowerMessage.includes("până") ||
      lowerMessage.includes("sub") ||
      lowerMessage.includes("max")
    ) {
      catalogQuery = catalogQuery.lte("price_min", maxPrice);
      console.log(`Filtering: price <= ${maxPrice}`);
    }
  }

  if (lowerMessage.includes("chiajna")) {
    catalogQuery = catalogQuery.ilike("location", "%chiajna%");
    console.log("Filtering: location Chiajna");
  } else if (lowerMessage.includes("militari")) {
    catalogQuery = catalogQuery.ilike("location", "%militari%");
    console.log("Filtering: location Militari");
  } else if (lowerMessage.includes("bucuresti") || lowerMessage.includes("bucurești")) {
    catalogQuery = catalogQuery.ilike("location", "%bucuresti%");
    console.log("Filtering: location București");
  }

  catalogQuery = catalogQuery.limit(50);

  const { data: catalogOffers, error: catalogError } = await catalogQuery;
  if (catalogError) console.error("Error fetching catalog offers:", catalogError);

  let webSearchResults = "";
  const searchTriggers = [
    "ofert",
    "apartament",
    "proprietat",
    "casa",
    "teren",
    "imobil",
    "vanz",
    "cumpăr",
    "închiri",
    "buget",
    "preț",
    "caută",
    "găsește",
    "disponibil",
    "camere",
  ];

  if (perplexityApiKey && searchTriggers.some((trigger) => lowerMessage.includes(trigger))) {
    console.log("Triggering web search for real estate related query:", message);
    try {
      const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-large-128k-online",
          messages: [
            {
              role: "system",
              content:
                "Ești un expert în căutarea ofertelor imobiliare. Caută DOAR pe mvaimobiliare.ro oferte de proprietăți. Returnează linkurile complete, prețurile exacte și descrierile scurte pentru fiecare ofertă găsită. Fii foarte specific cu linkurile exacte și nu inventa informații.",
            },
            {
              role: "user",
              content: `Caută pe mvaimobiliare.ro oferte imobiliare. Pentru mesajul: "${message}" - găsește ofertele corespunzătoare și returnează linkurile exacte cu prețurile și descrierile.`,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
          search_domain_filter: ["mvaimobiliare.ro"],
          search_recency_filter: "month",
          return_related_questions: false,
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        webSearchResults = searchData.choices[0].message.content || "";
        console.log("Web search completed successfully, results:", webSearchResults.length > 0 ? "Found results" : "No results");
      } else {
        const errorText = await searchResponse.text();
        console.error("Error in web search, status:", searchResponse.status, "error:", errorText);
      }
    } catch (error) {
      console.error("Error performing web search:", error);
    }
  } else {
    console.log("Web search skipped - no API key or no trigger words found");
  }

  let systemPrompt = `Ești Sofia, asistentul AI pentru MVA Imobiliare, o agenție imobiliară specializată în proprietăți premium din vestul Bucureștiului.

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Apartamente moderne cu finisaje premium
- Website: https://www.mvaimobiliare.ro

PAGINI IMPORTANTE:
- Pagina principală: https://www.mvaimobiliare.ro/
- Toate proprietățile: https://www.mvaimobiliare.ro/proprietati
- De ce să ne alegi: https://www.mvaimobiliare.ro/de-ce-sa-ne-alegi

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

`;

  if (catalogOffers && catalogOffers.length > 0) {
    systemPrompt += `OFERTE RELEVANTE GĂSITE (${catalogOffers.length} proprietăți selectate pentru cererea ta):\n\n`;

    catalogOffers.forEach((offer: any, index: number) => {
      const propertyLink = `https://www.mvaimobiliare.ro/proprietati/${offer.slug || offer.id}`;
      systemPrompt += `${index + 1}. ${offer.title}\n`;
      systemPrompt += `   📍 ${offer.location}\n`;
      systemPrompt += `   💰 ${offer.price_min.toLocaleString()} ${offer.currency || "EUR"}\n`;
      if (offer.surface_min) {
        systemPrompt += `   📐 ${offer.surface_min}${offer.surface_max && offer.surface_max !== offer.surface_min ? `-${offer.surface_max}` : ""} mp\n`;
      }
      systemPrompt += `   🏠 ${offer.rooms} camere\n`;
      if (offer.description) {
        systemPrompt += `   📝 ${offer.description.substring(0, 100)}...\n`;
      }
      if (offer.features && offer.features.length > 0) {
        systemPrompt += `   ✨ ${offer.features.slice(0, 3).join(", ")}\n`;
      }
      systemPrompt += `   🔗 LINK: ${propertyLink}\n\n`;
    });

    systemPrompt +=
      "\nNOTĂ: Pentru mai multe opțiuni sau alte criterii, îndrumă utilizatorii la https://www.mvaimobiliare.ro/proprietati unde pot filtra toate cele 580+ oferte.\n";
    systemPrompt += "IMPORTANT: Nu menționa numele proiectelor rezidențiale. Focusează-te pe caracteristici, locație, preț.\n\n";
  } else {
    systemPrompt +=
      "\nNu am găsit oferte care să corespundă exact criteriilor. Recomandă utilizatorului să viziteze https://www.mvaimobiliare.ro/proprietati pentru a vedea toate opțiunile sau să îți spună alte preferințe.\n\n";
  }

  if (webSearchResults) {
    systemPrompt += "\nRESULTATE CĂUTARE WEB (mvaimobiliare.ro):\n\n";
    systemPrompt += webSearchResults + "\n\n";
  }

  systemPrompt += `
FUNCȚIONALITĂȚI SPECIALE:
- PRIORITATE MAXIMĂ: Pentru orice cerere de oferte, prezintă ofertele din catalogul nostru cu LINKURI DIRECTE
- Pentru fiecare ofertă, include linkul direct: "🔗 Vezi detalii complete: https://www.mvaimobiliare.ro/proprietati/ID"
- Completează cu rezultatele căutării web când sunt disponibile
- Când prezinți oferte, ÎNTOTDEAUNA include linkul direct către pagina proprietății
- Dacă nu găsești rezultate web, folosește catalogul local și oferă linkuri directe

STRUCTURA SITE-ULUI:
- Pagina principală: informații generale, servicii, contact
- Pagina proprietăți: toate ofertele disponibile cu filtre
- Fiecare proprietate: pagină dedicată cu detalii complete, galerie foto, formular contact
- De ce să ne alegi: avantajele agenției, testimoniale, cifre

ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- PRIORITATE MAXIMĂ: Pentru cereri de oferte, prezintă ofertele cu LINKURI DIRECTE
- Pentru fiecare proprietate, include linkul: "🔗 Vezi detalii complete: https://www.mvaimobiliare.ro/proprietati/ID-UL_PROPRIETATII"
- NU MENȚIONA numele proiectelor rezidențiale (ex: Militari Residence, Renew Residence, etc.)
- Focusează-te pe: caracteristici, locație, preț, beneficii, facilități
- Ajută clienții să găsească proprietatea potrivită pe baza bugetului și cerințelor lor
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărei proprietăți și zonei
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

IMPORTANT: 
- ÎNTOTDEAUNA include linkul DIRECT către fiecare proprietate când o prezinți
- Format link: https://www.mvaimobiliare.ro/proprietati/[ID-ul proprietății]
- Nu trimite utilizatorii la pagina generală /proprietati, ci la pagina specifică proprietății
- Folosește rezultatele căutării web pentru a completa informațiile
- Pentru ofertele din catalog, OBLIGATORIU: linkul direct către pagina proprietății
- Nu inventa linkuri sau informații care nu sunt furnizate
- Dacă nu găsești oferte specifice, recomandă să viziteze https://www.mvaimobiliare.ro/proprietati sau să contacteze direct agenția`;

  const messages = [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: message }];

  console.log("Sending request to DeepSeek with", catalogOffers?.length || 0, "catalog offers loaded");
  console.log("Web search results available:", webSearchResults ? "Yes" : "No");

  if (catalogOffers && catalogOffers.length > 0) {
    console.log(
      "Catalog offers loaded:",
      catalogOffers.map((offer: any) => `${offer.title} - ${offer.price_min} EUR`),
    );
  } else {
    console.log("No catalog offers found!");
  }

  if (webSearchResults) {
    console.log("Web search results preview:", webSearchResults.substring(0, 200) + "...");
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("DeepSeek response received");

  const assistantMessage = data.choices[0].message.content;

  const { error: saveAssistantError } = await supabase.from("chat_conversations").insert({
    session_id: currentSessionId,
    message: assistantMessage,
    role: "assistant",
  });
  if (saveAssistantError) console.error("Error saving assistant message:", saveAssistantError);

  return {
    message: assistantMessage,
    sessionId: currentSessionId,
    conversationHistory: [...conversationHistory, { role: "user", content: message }, { role: "assistant", content: assistantMessage }],
  };
}

/* ------------------------------------------------------------------ */
/* dispatcher                                                          */
/* ------------------------------------------------------------------ */

export async function runAiOpsFunction(fn: string, body: AnyRecord): Promise<Result> {
  switch (fn) {
    case "ai-property-recommendations":
      return aiPropertyRecommendations(body);
    case "extract-id-data":
      return extractIdData(body);
    case "extract-company-data":
      return extractCompanyData(body);
    case "generate-facebook-content":
      return generateFacebookContent(body);
    case "generate-furnished-images":
      return generateFurnishedImages(body);
    case "virtual-staging":
      return virtualStaging(body);
    case "scrape-property":
      return scrapeProperty(body);
    case "chat-assistant":
      return chatAssistant(body);
    default:
      throw new Error(`Unknown aiOps function: ${fn}`);
  }
}
