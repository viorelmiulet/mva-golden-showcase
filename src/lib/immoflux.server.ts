/**
 * Server-only implementation of the Immoflux integration + import edge
 * functions (wave 3). Ports: immoflux-integration, sync-immoflux,
 * immoflux-proxy, import-complexes-excel, import-complexes-pdf,
 * import-excel-apartments, import-renew-apartments, facebook-catalog-import.
 *
 * Behaviour (actions, payloads, response shapes) is kept as close as
 * possible to the original Supabase Edge Functions. Notable adaptation:
 * `sync-immoflux` no longer runs as a fire-and-forget background task (no
 * `EdgeRuntime.waitUntil` / execution-context access in a TanStack server
 * function) — it now runs the sync inline and returns the final result.
 */

type AnyRecord = Record<string, unknown>;
type Result = AnyRecord;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
    rpc: (name: string, args?: AnyRecord) => any;
    storage: { from: (bucket: string) => any };
  };
}

const fail = (error: string): Result => ({ success: false, error });

/* ==================================================================== */
/* Shared: site_settings config helper                                  */
/* ==================================================================== */

async function getConfig(supabase: any, dbKey: string, envKey: string): Promise<string> {
  try {
    const { data } = await supabase.from("site_settings").select("value").eq("key", dbKey).maybeSingle();
    if (data?.value) return data.value;
  } catch {
    /* ignore */
  }
  return process.env[envKey] || "";
}

async function getBasicAuth(supabase: any): Promise<string> {
  const user = await getConfig(supabase, "integration_immoflux_user", "IMMOFLUX_USER");
  const pass = await getConfig(supabase, "integration_immoflux_pass", "IMMOFLUX_PASS");
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function getBaseUrl(supabase: any): Promise<string> {
  let url = (
    (await getConfig(supabase, "integration_immoflux_base_url", "IMMOFLUX_BASE_URL")) ||
    "https://web.immoflux.ro"
  ).replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  return url;
}

/* ==================================================================== */
/* immoflux-integration                                                 */
/* ==================================================================== */

function normalizeAvailabilityStatusIntegration(raw: string | null | undefined): string {
  if (!raw) return "available";
  const s = raw.toLowerCase().trim();
  if (s.includes("vandut") || s.includes("vândut") || s.includes("sold") || s === "vanzare finalizata" || s === "vândut")
    return "sold";
  if (
    s.includes("inactiv") ||
    s.includes("inactive") ||
    s.includes("unavailable") ||
    s.includes("indisponibil") ||
    s.includes("retras") ||
    s.includes("expirat") ||
    s.includes("expired")
  )
    return "inactive";
  if (s.includes("activ") || s.includes("available") || s.includes("disponibil") || s === "active") return "available";
  return "available";
}

function extractImmofluxField(xmlBlock: string, possibleTags: string[]): string | null {
  for (const tag of possibleTags) {
    const patterns = [
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
      new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"),
      new RegExp(`<${tag}[^>]*\\/>([^<]*?)`, "i"),
      new RegExp(`${tag}[:\\s]*["']?([^"'\\r\\n<]+)`, "i"),
    ];
    for (const pattern of patterns) {
      const match = xmlBlock.match(pattern);
      if (match && match[1] && match[1].trim()) {
        let value = match[1].trim();
        value = value
          .replace(/&[a-zA-Z0-9#]+;/g, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (value) return value;
      }
    }
  }
  return null;
}

function parseImmofluxPrice(priceStr: string | null): number {
  if (!priceStr) return 0;
  const cleanPrice = priceStr.replace(/[^\d.,]/g, "");
  let finalPrice = cleanPrice;
  if (finalPrice.includes(",") && finalPrice.includes(".")) {
    if (finalPrice.lastIndexOf(",") > finalPrice.lastIndexOf(".")) {
      finalPrice = finalPrice.replace(/\./g, "").replace(",", ".");
    } else {
      finalPrice = finalPrice.replace(/,/g, "");
    }
  } else if (finalPrice.includes(",")) {
    const parts = finalPrice.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      finalPrice = finalPrice.replace(",", ".");
    } else {
      finalPrice = finalPrice.replace(/,/g, "");
    }
  }
  const parsed = parseFloat(finalPrice);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function parseImmofluxNumber(numStr: string | null): number | null {
  if (!numStr) return null;
  const cleanNum = numStr.replace(/[^\d.,]/g, "");
  if (!cleanNum) return null;
  let finalNum = cleanNum;
  const lastDot = finalNum.lastIndexOf(".");
  const lastComma = finalNum.lastIndexOf(",");
  if (lastComma > lastDot && lastComma > -1) {
    const afterComma = finalNum.substring(lastComma + 1);
    if (afterComma.length <= 2) finalNum = finalNum.replace(",", ".");
    else finalNum = finalNum.replace(/,/g, "");
  } else {
    finalNum = finalNum.replace(/,/g, "");
  }
  const parsed = parseFloat(finalNum);
  return isNaN(parsed) ? null : Math.round(parsed);
}

function extractImmofluxImages(xmlBlock: string): string[] {
  const imageSet = new Set<string>();
  const patterns = [
    /<image[^>]*>([^<]+)<\/image>/gi,
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<url[^>]*>([^<]+)<\/url>/gi,
    /<foto[^>]*>([^<]+)<\/foto>/gi,
    /<picture[^>]*>([^<]+)<\/picture>/gi,
    /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(xmlBlock)) !== null) {
      let url = match[1] || match[0];
      url = url.trim();
      if (
        url.startsWith("http") &&
        (url.includes(".jpg") || url.includes(".png") || url.includes(".jpeg") || url.includes(".gif") || url.includes(".webp"))
      ) {
        imageSet.add(url);
      }
    }
  });
  return Array.from(imageSet).slice(0, 15);
}

function extractImmofluxFeatures(xmlBlock: string): string[] {
  const features: string[] = [];
  const featurePatterns = [
    /balcon/gi, /parcare/gi, /lift/gi, /centrala/gi, /gradina/gi, /terasa/gi,
    /garaj/gi, /subsol/gi, /mansarda/gi, /boiler/gi, /aer\s*conditionat/gi,
    /furnished/gi, /mobilat/gi, /internet/gi, /cable/gi, /security/gi, /securitate/gi,
  ];
  featurePatterns.forEach((pattern) => {
    if (pattern.test(xmlBlock)) {
      const match = pattern.exec(xmlBlock);
      if (match) features.push(match[0].toLowerCase());
    }
  });
  const featureTags = ["amenities", "features", "dotari", "facilitati"];
  featureTags.forEach((tag) => {
    const featureValue = extractImmofluxField(xmlBlock, [tag]);
    if (featureValue) {
      const individualFeatures = featureValue.split(/[,;|]/).map((f) => f.trim()).filter(Boolean);
      features.push(...individualFeatures);
    }
  });
  return [...new Set(features)].slice(0, 10);
}

function extractImmofluxContact(xmlBlock: string): any {
  const contact: any = {};
  const phone = extractImmofluxField(xmlBlock, ["phone", "telefon", "tel", "telephone", "contact_phone"]);
  const email = extractImmofluxField(xmlBlock, ["email", "mail", "contact_email", "e_mail"]);
  const agent = extractImmofluxField(xmlBlock, ["agent", "contact_person", "person", "nume_agent", "consultant"]);
  const company = extractImmofluxField(xmlBlock, ["company", "firma", "agentie", "agency"]);
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (agent) contact.agent = agent;
  if (company) contact.company = company;
  return Object.keys(contact).length > 0 ? contact : null;
}

function parseImmofluxXmlProperties(xmlContent: string): any[] {
  const properties: any[] = [];
  try {
    const cleanXml = xmlContent
      .replace(/<\?xml[^>]*\?>/gi, "")
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/xmlns[^=]*="[^"]*"/gi, "")
      .replace(/\s+/g, " ");

    let propertyBlocks =
      cleanXml.match(/<ad[^>]*>[\s\S]*?<\/ad>/gi) ||
      cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||
      cleanXml.match(/<oferta[^>]*>[\s\S]*?<\/oferta>/gi) ||
      cleanXml.match(/<ofertas[^>]*>[\s\S]*?<\/ofertas>/gi) ||
      cleanXml.match(/<property[^>]*>[\s\S]*?<\/property>/gi) ||
      cleanXml.match(/<propriedade[^>]*>[\s\S]*?<\/propriedade>/gi) ||
      cleanXml.match(/<immobile[^>]*>[\s\S]*?<\/immobile>/gi) ||
      cleanXml.match(/<imobil[^>]*>[\s\S]*?<\/imobil>/gi) ||
      cleanXml.match(/<anunt[^>]*>[\s\S]*?<\/anunt>/gi) ||
      cleanXml.match(/<listing[^>]*>[\s\S]*?<\/listing>/gi) ||
      cleanXml.match(/<offer[^>]*>[\s\S]*?<\/offer>/gi) ||
      cleanXml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ||
      cleanXml.match(/<unit[^>]*>[\s\S]*?<\/unit>/gi);

    if (!propertyBlocks) {
      const allTags = cleanXml.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g);
      if (allTags) {
        const tagCounts: { [key: string]: number } = {};
        allTags.forEach((tag) => {
          const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
          if (tagName && tagName !== "br" && tagName !== "hr" && tagName !== "img") {
            tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
          }
        });
        const frequentTags = Object.entries(tagCounts)
          .filter(([, count]) => count > 3 && count < 1000)
          .sort(([, a], [, b]) => b - a);
        if (frequentTags.length > 0) {
          const preferred = frequentTags.find(([tag]) => tag.toLowerCase() === "ad");
          const nonImage = frequentTags.find(([tag]) => !["image", "img", "url"].includes(tag.toLowerCase()));
          const candidateTag = preferred?.[0] || nonImage?.[0] || frequentTags[0][0];
          propertyBlocks = cleanXml.match(new RegExp(`<${candidateTag}[^>]*>[\\s\\S]*?<\\/${candidateTag}>`, "gi"));
        }
      }
      if (!propertyBlocks) propertyBlocks = [cleanXml];
    }

    propertyBlocks.forEach((block, index) => {
      try {
        const title = extractImmofluxField(block, ["title", "titulo", "titlu", "name", "denumire", "subject"]) || `Proprietate importata ${index + 1}`;
        const description = extractImmofluxField(block, ["description", "desc", "content", "continut", "detalii", "details", "body"]) || "";
        const location = extractImmofluxField(block, ["location", "address", "adresa", "zona", "oras", "city", "localitate", "judet"]) || "Bucuresti";
        const priceRaw = extractImmofluxField(block, ["price", "pret", "cost", "valor", "amount", "suma"]);
        const price = parseImmofluxPrice(priceRaw);
        const currency =
          extractImmofluxField(block, ["currency", "moneda", "valuta"]) ||
          (priceRaw && priceRaw.includes("EUR") ? "EUR" : priceRaw && priceRaw.includes("RON") ? "RON" : priceRaw && priceRaw.includes("LEI") ? "LEI" : "EUR");
        const surfaceRaw = extractImmofluxField(block, ["surface", "area", "suprafata", "mp", "metripatrati", "size"]);
        const surface = parseImmofluxNumber(surfaceRaw);
        const roomsRaw = extractImmofluxField(block, ["rooms", "camere", "dormitoare", "bedrooms", "nr_camere"]);
        const rooms = parseImmofluxNumber(roomsRaw) || 1;
        const images = extractImmofluxImages(block);
        const features = extractImmofluxFeatures(block);
        const contact = extractImmofluxContact(block);

        const isOferta = /<oferta[\s>]/i.test(block);
        const isRubrikkAd = /<ad__headline[\s>]/i.test(block) || /<ad__price[\s>]/i.test(block);
        let property: any;

        if (isOferta) {
          const titleRoMatch = block.match(/<titlu[^>]*>[\s\S]*?<ro[^>]*>([\s\S]*?)<\/ro>[\s\S]*?<\/titlu>/i);
          const descRoMatch = block.match(/<descriere[^>]*>[\s\S]*?<ro[^>]*>([\s\S]*?)<\/ro>[\s\S]*?<\/descriere>/i);
          const titleFinal = (titleRoMatch?.[1] || title || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const descFinal = (descRoMatch?.[1] || description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

          const locParts: string[] = [];
          const locLocalitate = extractImmofluxField(block, ["localitate"]);
          const locJudet = extractImmofluxField(block, ["judet"]);
          const locZona = extractImmofluxField(block, ["zona"]);
          if (locLocalitate) locParts.push(locLocalitate);
          if (locJudet) locParts.push(locJudet);
          if (locZona) locParts.push(locZona);
          const locationFinal = (locParts.join(", ") || location || "Bucuresti").trim();

          const devanzare = parseInt(extractImmofluxField(block, ["devanzare"]) || "0");
          const priceRawOferta =
            devanzare === 1
              ? extractImmofluxField(block, ["pretvanzare"]) || extractImmofluxField(block, ["pretfaratva"])
              : extractImmofluxField(block, ["pretinchiriere"]) || extractImmofluxField(block, ["pretvanzare"]) || extractImmofluxField(block, ["pretfaratva"]);
          const priceParsed = parseImmofluxPrice(priceRawOferta);

          let currencyFinal =
            extractImmofluxField(block, devanzare === 1 ? ["monedavanzare"] : ["monedainchiriere"]) ||
            extractImmofluxField(block, ["monedavanzare", "monedainchiriere"]) ||
            "EUR";
          currencyFinal = currencyFinal.toUpperCase().includes("RON") ? "LEI" : currencyFinal.toUpperCase().includes("LEI") ? "LEI" : "EUR";

          const roomsParsed = parseImmofluxNumber(extractImmofluxField(block, ["nrcamere"])) || rooms || 1;
          const surfaceParsed = parseImmofluxNumber(extractImmofluxField(block, ["suprafatautila"]) || extractImmofluxField(block, ["suprafataconstruita"])) || surface || null;
          const imagesFinal = extractImmofluxImages(block);

          const featuresArr: string[] = [];
          const f1 = extractImmofluxField(block, ["utilitati"]);
          const f2 = extractImmofluxField(block, ["finisaje"]);
          const f3 = extractImmofluxField(block, ["dotari"]);
          [f1, f2, f3].filter(Boolean).forEach((s: any) => {
            String(s).split(/[,;|]/).map((x) => x.trim()).filter(Boolean).forEach((v) => featuresArr.push(v));
          });
          const compart = extractImmofluxField(block, ["tipcompartimentare"]);
          if (compart) featuresArr.push(compart);
          const tiploc = extractImmofluxField(block, ["tiplocuinta"]);
          if (tiploc) featuresArr.push(tiploc);
          const pretNeg = extractImmofluxField(block, ["pretnegociabil"]);
          if (pretNeg === "1") featuresArr.push("Pret negociabil");
          const uniqueFeatures = Array.from(new Set(featuresArr)).slice(0, 10);

          const statusRaw = (extractImmofluxField(block, ["status"]) || "activ").toLowerCase();
          const availability = normalizeAvailabilityStatusIntegration(statusRaw);

          property = {
            title: titleFinal || title,
            description: descFinal || description,
            price_min: priceParsed,
            price_max: priceParsed,
            surface_min: surfaceParsed,
            surface_max: surfaceParsed,
            rooms: roomsParsed,
            location: locationFinal,
            features: uniqueFeatures,
            amenities: uniqueFeatures,
            images: imagesFinal,
            contact_info: null,
            project_name: null,
            currency: currencyFinal,
            availability_status: availability,
            is_featured: false,
            source: "api",
          };
        } else if (isRubrikkAd) {
          const titleR = extractImmofluxField(block, ["ad__headline"]) || title;
          const descR = extractImmofluxField(block, ["ad__description"]) || description || "";
          const priceR = parseImmofluxPrice(extractImmofluxField(block, ["ad__price"]));
          const currencyR = (extractImmofluxField(block, ["ad__price_currency"]) || "EUR").toUpperCase();

          const city = extractImmofluxField(block, ["location__municipality_city"]);
          const county = extractImmofluxField(block, ["location__county"]);
          const district = extractImmofluxField(block, ["location__district_quarter_part_of_town"]);
          const locationFinal = [city, district, county].filter(Boolean).join(", ") || location || "Bucuresti";

          const roomsR = parseImmofluxNumber(extractImmofluxField(block, ["real_estate__number_of_rooms"])) || rooms || 1;
          const surfaceR = parseImmofluxNumber(extractImmofluxField(block, ["real_estate__size_living_space"])) || surface || null;

          const imagesBlockMatch = block.match(/<ad__all_imageurls[^>]*>([\s\S]*?)<\/ad__all_imageurls>/i);
          const imagesFinal = imagesBlockMatch ? extractImmofluxImages(imagesBlockMatch[1]) : extractImmofluxImages(block);

          const contact_info: any = {};
          const company = extractImmofluxField(block, ["advertiser__name_company_name"]);
          const email = extractImmofluxField(block, ["advertiser__email"]);
          const mobile = extractImmofluxField(block, ["advertiser__mobile"]);
          const phone = extractImmofluxField(block, ["advertiser__phone"]);
          if (company) contact_info.company = company;
          if (email) contact_info.email = email;
          if (mobile) contact_info.mobile = mobile;
          if (phone) contact_info.phone = phone;
          const contactFinal = Object.keys(contact_info).length ? contact_info : null;

          property = {
            title: titleR || `Anunt ${index + 1}`,
            description: descR,
            price_min: priceR,
            price_max: priceR,
            surface_min: surfaceR,
            surface_max: surfaceR,
            rooms: roomsR,
            location: locationFinal,
            features: [],
            amenities: [],
            images: imagesFinal,
            contact_info: contactFinal,
            project_name: null,
            currency: currencyR,
            availability_status: normalizeAvailabilityStatusIntegration(extractImmofluxField(block, ["status", "ad__status"]) || "available"),
            is_featured: false,
            source: "api",
          };
        } else {
          property = {
            title,
            description,
            price_min: price,
            price_max: price,
            surface_min: surface,
            surface_max: surface,
            rooms,
            location,
            features,
            amenities: features,
            images,
            contact_info: contact,
            project_name: null,
            currency,
            availability_status: normalizeAvailabilityStatusIntegration(extractImmofluxField(block, ["status", "availability", "stare"]) || "available"),
            is_featured: false,
            source: "api",
          };
        }

        if (property.title && property.price_min > 0 && property.rooms > 0) {
          properties.push(property);
        }
      } catch {
        /* skip malformed block */
      }
    });

    return properties;
  } catch {
    return [];
  }
}

function transformImmofluxData(data: any): any[] {
  try {
    const properties = Array.isArray(data) ? data : data.properties || data.results || [data];
    return properties.map((property: any) => ({
      title: property.title || property.name || "Proprietate Immoflux",
      description: property.description || property.details || "",
      price_min: parseInt(property.price || property.price_min || property.minPrice || 0),
      price_max: parseInt(property.price_max || property.maxPrice || property.price || 0),
      surface_min: parseInt(property.surface || property.area || property.surface_min || 0),
      surface_max: parseInt(property.surface_max || property.maxArea || property.surface || 0),
      rooms: parseInt(property.rooms || property.bedrooms || property.room_count || 1),
      location: property.location || property.address || property.city || "Locație necunoscută",
      features: Array.isArray(property.features) ? property.features : [],
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      images: property.images ? (Array.isArray(property.images) ? property.images : [property.images]) : [],
      contact_info: property.contact || property.agent || {},
      project_name: "IMMOFLUX_SYNC",
      currency: property.currency || "EUR",
      availability_status: property.status || "available",
      is_featured: property.featured || false,
    }));
  } catch {
    return [];
  }
}

async function insertBatches(supabase: any, rows: any[], batchSize = 50): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data: batchData, error: batchError } = await supabase.from("catalog_offers").insert(batch).select();
    if (batchError) {
      if (batchError.message.includes("extensions.net.http_post") || batchError.message.includes("cross-database references")) {
        inserted += batch.length;
      } else {
        failed += batch.length;
      }
    } else {
      inserted += batchData?.length || 0;
    }
  }
  return { inserted, failed };
}

async function syncPropertiesFromApi(supabase: any, apiKey: string, apiUser: string): Promise<Result> {
  try {
    const response = await fetch("https://api.immoflux.ro/v1/properties", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "X-API-User": apiUser, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const data = await response.json();
    const transformedOffers = transformImmofluxData(data);
    if (transformedOffers.length === 0) return { success: true, message: "No properties found to sync", synced: 0 };

    await supabase.from("catalog_offers").delete().eq("project_name", "IMMOFLUX_SYNC");
    await insertBatches(supabase, transformedOffers);

    return { success: true, message: `Successfully synced ${transformedOffers.length} properties from Immoflux`, synced: transformedOffers.length };
  } catch (error: any) {
    return { success: false, error: `Property sync failed: ${error.message}` };
  }
}

async function getPropertyFromApi(apiKey: string, apiUser: string, propertyId: string): Promise<Result> {
  try {
    const response = await fetch(`https://api.immoflux.ro/v1/properties/${propertyId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "X-API-User": apiUser, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const propertyData = await response.json();
    return { success: true, property: propertyData };
  } catch (error: any) {
    return { success: false, error: `Get property failed: ${error.message}` };
  }
}

async function testImmofluxConnection(apiKey: string, apiUser: string): Promise<Result> {
  const possibleUrls = [
    "https://api.immoflux.ro/v1/properties",
    "https://immoflux.ro/api/v1/properties",
    "https://app.immoflux.ro/api/properties",
    "https://web.immoflux.ro/api/properties",
  ];
  let lastError = "";
  for (const url of possibleUrls) {
    try {
      const testResponse = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, "X-API-User": apiUser, "Content-Type": "application/json" },
      });
      if (testResponse.ok) {
        return { success: true, message: `Connection successful to ${url}`, status: testResponse.status, url };
      }
      const errorText = await testResponse.text();
      lastError = `${url}: ${testResponse.status} - ${errorText}`;
    } catch (fetchError: any) {
      lastError = `${url}: Network error - ${fetchError.message}`;
    }
  }
  return { success: false, error: `Connection test failed: All API endpoints failed. Last error: ${lastError}`, suggestion: "Please verify your API credentials and endpoint URL" };
}

function parsePropertiesFromContent(content: string): any[] {
  const properties: any[] = [];
  try {
    const lines = content.split("\n");
    let currentProperty: any = null;
    let i = 0;
    let lookingForPrice = false;
    let lookingForRooms = false;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith("### ")) {
        if (currentProperty && currentProperty.title) properties.push(currentProperty);
        currentProperty = {
          title: line.replace("### ", "").trim(),
          description: "",
          location: "",
          price_min: 0,
          price_max: 0,
          surface_min: null,
          surface_max: null,
          rooms: 1,
          currency: "EUR",
          images: [],
          features: [],
          amenities: [],
          availability_status: "available",
          is_featured: false,
          project_name: "IMOBILIAREMILITARI_SCRAPE",
          contact_info: null,
          storia_link: null,
          whatsapp_catalog_id: null,
        };
        lookingForPrice = false;
        lookingForRooms = false;
      } else if (currentProperty && line === "Bucuresti" && !currentProperty.location) {
        currentProperty.location = line;
      } else if (currentProperty && line === "Preț") {
        lookingForPrice = true;
      } else if (currentProperty && line === "Camere") {
        lookingForRooms = true;
      } else if (currentProperty && lookingForPrice && line.includes("EUR")) {
        const priceMatch = line.match(/([\d,.]+)\s*EUR/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/[,.]/g, ""));
          currentProperty.price_min = price;
          currentProperty.price_max = price;
        }
        lookingForPrice = false;
      } else if (currentProperty && lookingForRooms && line.match(/^\d+$/)) {
        currentProperty.rooms = parseInt(line);
        lookingForRooms = false;
      } else if (
        currentProperty &&
        line.length > 50 &&
        !line.includes("![") &&
        !line.includes("http") &&
        !line.includes("tel:") &&
        !line.includes("wa.me") &&
        currentProperty.description === ""
      ) {
        currentProperty.description = line;
      } else if (
        currentProperty &&
        (line === "Balcon" || line === "Parcare" || line === "Lift" || line === "Centrala" || line === "TVA INCLUS !!" || line === "Comision 0%")
      ) {
        if (!currentProperty.features.includes(line)) currentProperty.features.push(line);
      } else if (line.includes("![") && line.includes("](")) {
        const imageMatch = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (imageMatch && currentProperty) currentProperty.images.push(imageMatch[1]);
      } else if (currentProperty && (line.includes("tel:") || line.includes("wa.me"))) {
        if (!currentProperty.contact_info) currentProperty.contact_info = {};
        if (line.includes("tel:")) {
          const phoneMatch = line.match(/tel:(\d+)/);
          if (phoneMatch) currentProperty.contact_info.phone = phoneMatch[1];
        }
        if (line.includes("wa.me")) {
          const whatsappMatch = line.match(/wa\.me\/(\d+)/);
          if (whatsappMatch) currentProperty.contact_info.whatsapp = whatsappMatch[1];
        }
      }
      i++;
    }
    if (currentProperty && currentProperty.title) properties.push(currentProperty);
    return properties;
  } catch {
    return [];
  }
}

async function scrapeWebsiteProperties(supabase: any, url: string): Promise<Result> {
  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY not configured");

    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: true }),
    });
    const scrapeResult: any = await resp.json();
    if (!resp.ok || scrapeResult.success === false) throw new Error("Failed to scrape website: " + (scrapeResult.error || resp.statusText));

    const properties = parsePropertiesFromContent(scrapeResult.data?.markdown || scrapeResult.markdown || "");
    if (properties.length === 0) return { success: true, message: "No properties found to scrape", scraped: 0 };

    await supabase.from("catalog_offers").delete().eq("project_name", "WEBSITE_SCRAPE");
    await insertBatches(supabase, properties);

    return { success: true, message: `Successfully scraped ${properties.length} properties from ${url}`, scraped: properties.length, properties };
  } catch (error: any) {
    return { success: false, error: `Website scraping failed: ${error.message}` };
  }
}

async function analyzeXmlStructure(xmlUrl: string): Promise<Result> {
  try {
    const response = await fetch(xmlUrl);
    if (!response.ok) throw new Error(`Failed to fetch XML: ${response.status}`);
    const xmlContent = await response.text();
    const preview = xmlContent.substring(0, 5000);
    const rootMatch = xmlContent.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/);
    const rootElement = rootMatch ? rootMatch[1] : "Unknown";
    const cleanXml = xmlContent.replace(/<\?xml[^>]*\?>/gi, "").replace(/xmlns[^=]*="[^"]*"/gi, "").replace(/\s+/g, " ");
    const allTags = cleanXml.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
    const tagCounts: { [key: string]: number } = {};
    allTags.forEach((tag) => {
      const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
      if (tagName && tagName !== "br" && tagName !== "hr" && tagName !== "img") tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
    });
    const frequentTags = Object.entries(tagCounts)
      .filter(([, count]) => count > 1 && count < 1000)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const propertyPatterns = ["item", "property", "offer", "listing", "oferta", "anunt", "imobil", "unit", "entry", "ad"];
    let detectedPattern: string | null = null;
    let blockCount = 0;
    let samplePropertyFields: string[] = [];
    let sampleProperty: any = {};

    for (const pattern of propertyPatterns) {
      const regex = new RegExp(`<${pattern}[^>]*>[\\s\\S]*?<\\/${pattern}>`, "gi");
      const matches = cleanXml.match(regex);
      if (matches && matches.length > 0) {
        detectedPattern = pattern;
        blockCount = matches.length;
        if (matches[0]) {
          const firstBlock = matches[0];
          const fieldMatches = firstBlock.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
          const fieldsInBlock = new Set<string>();
          fieldMatches.forEach((tag) => {
            const fieldName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
            if (fieldName && fieldName !== pattern) {
              fieldsInBlock.add(fieldName);
              const valueMatch = firstBlock.match(new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, "i"));
              if (valueMatch && valueMatch[1]) sampleProperty[fieldName] = valueMatch[1].trim().substring(0, 100);
            }
          });
          samplePropertyFields = Array.from(fieldsInBlock);
        }
        break;
      }
    }

    if (!detectedPattern && frequentTags.length > 0) {
      const candidateTag = frequentTags[0][0];
      const regex = new RegExp(`<${candidateTag}[^>]*>[\\s\\S]*?<\\/${candidateTag}>`, "gi");
      const matches = cleanXml.match(regex);
      if (matches && matches.length > 1) {
        detectedPattern = candidateTag;
        blockCount = matches.length;
        if (matches[0]) {
          const firstBlock = matches[0];
          const fieldMatches = firstBlock.match(/<([a-zA-Z][a-zA-Z0-9_-]*)[^>]*>/g) || [];
          const fieldsInBlock = new Set<string>();
          fieldMatches.forEach((tag) => {
            const fieldName = tag.match(/<([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1];
            if (fieldName && fieldName !== candidateTag) {
              fieldsInBlock.add(fieldName);
              const valueMatch = firstBlock.match(new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, "i"));
              if (valueMatch && valueMatch[1]) sampleProperty[fieldName] = valueMatch[1].trim().substring(0, 100);
            }
          });
          samplePropertyFields = Array.from(fieldsInBlock).slice(0, 20);
        }
      }
    }

    return {
      success: true,
      message: "XML structure analyzed successfully",
      data: {
        summary: {
          totalLength: xmlContent.length,
          rootElement,
          detectedPropertyPattern: detectedPattern,
          estimatedPropertyCount: blockCount,
          samplePropertyFields,
        },
        sampleProperty,
        tagFrequency: frequentTags,
        potentialPropertyContainers: frequentTags.filter(
          ([tag, count]) =>
            tag.toLowerCase().includes("item") ||
            tag.toLowerCase().includes("property") ||
            tag.toLowerCase().includes("offer") ||
            tag.toLowerCase().includes("oferta") ||
            tag.toLowerCase().includes("anunt") ||
            count > 5,
        ),
        preview,
        recommendation: detectedPattern ? `Use pattern: <${detectedPattern}> (found ${blockCount} blocks)` : "No clear property pattern detected - may need manual inspection",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function importXmlFeed(supabase: any, xmlUrl: string): Promise<Result> {
  try {
    const response = await fetch(xmlUrl);
    if (!response.ok) throw new Error(`Failed to fetch XML: ${response.status}`);
    const xmlContent = await response.text();
    const properties = parseImmofluxXmlProperties(xmlContent);

    if (properties.length === 0) return { success: true, message: "No properties found in XML feed", imported: 0 };

    await supabase.from("catalog_offers").delete().eq("source", "api");
    await insertBatches(supabase, properties);

    return { success: true, message: `XML import completed: ${properties.length} properties imported`, imported: properties.length, preview: properties.slice(0, 3) };
  } catch (error: any) {
    return { success: false, error: `XML feed import failed: ${error.message}` };
  }
}

/* -------- custom-mapping.ts port (import_xml_feed with mapping / import_xml_with_mapping) -------- */

function isCoordinatesStr(str: string): boolean {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str.trim());
}

async function reverseGeocodeCustomMapping(lat: number, lng: number): Promise<{ zone: string; city: string }> {
  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ro&result_type=sublocality|neighborhood|locality&key=${googleApiKey}`,
      );
      if (response.ok) {
        const data: any = await response.json();
        if (data.status === "OK" && data.results?.length) {
          let zone = "";
          let city = "";
          for (const result of data.results) {
            for (const component of result.address_components || []) {
              const types = component.types || [];
              if (!zone && (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood"))) zone = component.long_name;
              if (!city && types.includes("locality")) city = component.long_name;
            }
          }
          if (zone || city) return { zone: zone || city, city: city || zone };
        }
      }
    }
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ro&zoom=16`, {
      headers: { "User-Agent": "MVA-Imobiliare/1.0" },
    });
    if (!response.ok) return { zone: "", city: "" };
    const data: any = await response.json();
    const addr = data.address || {};
    const zone = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
    const city = addr.city || addr.town || addr.municipality || "";
    return { zone, city };
  } catch {
    return { zone: "", city: "" };
  }
}

const CM_PROJECT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /militari\s*residence/i, name: "Militari Residence" },
  { pattern: /pollux\s*residence/i, name: "Pollux Residence" },
  { pattern: /tineretului/i, name: "Tineretului" },
  { pattern: /eurocasa/i, name: "Eurocasa Residence" },
  { pattern: /renew\s*residence/i, name: "Renew Residence" },
  { pattern: /orhideea/i, name: "Orhideea Residence" },
  { pattern: /pipera/i, name: "Pipera" },
  { pattern: /drumul\s*taberei/i, name: "Drumul Taberei" },
  { pattern: /berceni/i, name: "Berceni" },
  { pattern: /titan/i, name: "Titan" },
  { pattern: /colentina/i, name: "Colentina" },
  { pattern: /aviatiei/i, name: "Aviației" },
  { pattern: /floreasca/i, name: "Floreasca" },
  { pattern: /herastrau/i, name: "Herăstrău" },
  { pattern: /dorobanti/i, name: "Dorobanți" },
];

function extractProjectNameCustomMapping(title: string): string | null {
  if (!title) return null;
  for (const { pattern, name } of CM_PROJECT_PATTERNS) if (pattern.test(title)) return name;
  return null;
}

function extractFieldValueCM(xmlBlock: string, fieldName: string): string | null {
  if (!fieldName) return null;
  const cleanFieldName = fieldName.replace(/[<>]/g, "").trim();
  if (!cleanFieldName) return null;
  const patterns = [
    new RegExp(`<${cleanFieldName}[^>]*>([\\s\\S]*?)<\\/${cleanFieldName}>`, "i"),
    new RegExp(`<${cleanFieldName}>([\\s\\S]*?)<\\/${cleanFieldName}>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = xmlBlock.match(pattern);
    if (match) {
      let value = match[1] || "";
      value = value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (value && value.length > 0 && !value.match(/^[<>_]+$/)) return value;
    }
  }
  return null;
}

function parseImagesCM(xmlBlock: string): string[] {
  const imageSet = new Set<string>();
  const blockUrls = xmlBlock.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)/gi);
  if (blockUrls) blockUrls.forEach((url) => imageSet.add(url));
  return Array.from(imageSet).slice(0, 20);
}

function extractBrokerInfoCM(xmlContent: string): any {
  try {
    const brokerBlock = xmlContent.match(/<broker[^>]*>[\s\S]*?<\/broker>/i);
    if (!brokerBlock) return null;
    const phone = extractFieldValueCM(brokerBlock[0], "phone");
    const email = extractFieldValueCM(brokerBlock[0], "email");
    const name = extractFieldValueCM(brokerBlock[0], "name");
    const contact: any = {};
    if (phone && phone !== "0" && phone !== "1") contact.phone = phone;
    if (email) contact.email = email;
    if (name) contact.name = name;
    return Object.keys(contact).length > 0 ? contact : null;
  } catch {
    return null;
  }
}

async function mapSinglePropertyCM(block: string, index: number, fieldMapping: Record<string, string>, brokerInfo: any): Promise<any | null> {
  const d: any = {};
  Object.entries(fieldMapping || {}).forEach(([targetField, sourceField]) => {
    if (!sourceField) return;
    const value = extractFieldValueCM(block, sourceField);
    if (value) d[targetField] = value;
  });

  const directFields = [
    "id", "listing_type", "title", "description", "date_added",
    "rooms", "bathrooms", "kitchens", "balconies", "floor", "building_flors",
    "parking", "build_year", "appartment_type", "build_materials",
    "property_type", "property_subtype", "area",
    "air_conditioning", "internet", "television", "security",
    "electricity", "wather", "gas", "wood_floors", "phone",
    "exclusivity", "broker", "agency",
    "commission_type", "commission_value",
  ];
  for (const field of directFields) {
    if (!d[field]) {
      const val = extractFieldValueCM(block, field);
      if (val) d[field] = val;
    }
  }

  let priceVal = 0;
  let currency = "EUR";
  let priceType: string | null = null;

  const priceWrapperMatch = block.match(/<price>[\s\S]*?<\/price>/gi);
  if (priceWrapperMatch) {
    for (const pw of priceWrapperMatch) {
      if (pw.includes("<currency>") || pw.includes("<price_type>")) {
        const innerPriceMatch = pw.match(/<price>(\d[\d.,]*)<\/price>/i);
        if (innerPriceMatch) {
          const num = parseFloat(innerPriceMatch[1].replace(/[^\d.,]/g, "").replace(",", "."));
          if (!isNaN(num) && num > 0) priceVal = Math.round(num);
        }
        const curMatch = pw.match(/<currency>([^<]+)<\/currency>/i);
        if (curMatch) currency = curMatch[1].trim().toUpperCase();
        const ptMatch = pw.match(/<price_type>([^<]+)<\/price_type>/i);
        if (ptMatch) priceType = ptMatch[1].trim();
        break;
      } else {
        const numStr = pw.replace(/<[^>]+>/g, "").trim();
        const num = parseFloat(numStr.replace(/[^\d.,]/g, "").replace(",", "."));
        if (!isNaN(num) && num > 0) priceVal = Math.round(num);
      }
    }
  }

  if (!priceType) {
    const pt = extractFieldValueCM(block, "price_type");
    if (pt) priceType = pt;
  }
  const curDirect = extractFieldValueCM(block, "currency");
  if (curDirect) currency = curDirect.toUpperCase();

  if (d.price) {
    const num = parseFloat(String(d.price).replace(/[^\d.,]/g, "").replace(",", "."));
    if (!isNaN(num) && num > 0) priceVal = Math.round(num);
  }
  if (d.currency) currency = d.currency.toUpperCase();
  if (d.price_type) priceType = d.price_type;

  const rooms = parseInt(d.rooms) || 0;
  const bathrooms = parseInt(d.bathrooms) || null;
  const kitchens = parseInt(d.kitchens) || null;
  const balconies = parseInt(d.balconies) || 0;
  const floor = parseInt(d.floor) || null;
  const totalFloors = parseInt(d.building_flors || d.total_floors) || null;
  const parking = d.parking === "1" ? 1 : parseInt(d.parking) || 0;
  const yearBuilt = parseInt(d.build_year || d.year_built) || null;
  const area = parseFloat(d.area || d.surface || "0") || null;

  if (priceVal <= 0 || rooms <= 0) return null;

  let latitude: number | null = null;
  let longitude: number | null = null;
  const geoBlock = block.match(/<geo_location[^>]*>[\s\S]*?<\/geo_location>/i);
  if (geoBlock) {
    const latStr = extractFieldValueCM(geoBlock[0], "lat");
    const lonStr = extractFieldValueCM(geoBlock[0], "lon");
    if (latStr) latitude = parseFloat(latStr) || null;
    if (lonStr) longitude = parseFloat(lonStr) || null;
  }
  if (d.latitude) latitude = parseFloat(d.latitude) || null;
  if (d.longitude) longitude = parseFloat(d.longitude) || null;

  const commBlock = block.match(/<commission[^>]*>[\s\S]*?<\/commission>/i);
  let commissionType: string | null = null;
  let commissionValue: number | null = null;
  if (commBlock) {
    commissionType = extractFieldValueCM(commBlock[0], "commission_type") || null;
    const cv = extractFieldValueCM(commBlock[0], "commission_value");
    commissionValue = cv ? parseFloat(cv) || 0 : null;
  }
  if (d.commission_type) commissionType = d.commission_type;
  if (d.commission_value) commissionValue = parseFloat(d.commission_value) || null;

  const rawTxType = (d.listing_type || d.transaction_type || "").toLowerCase();
  const transactionType = rawTxType === "rent" || rawTxType === "inchiriere" ? "inchiriere" : "vanzare";

  const boolField = (name: string) => {
    const val = d[name] || extractFieldValueCM(block, name);
    return val === "1" || val?.toLowerCase() === "true";
  };

  const features: string[] = [];
  const featureMap: Record<string, string> = {
    air_conditioning: "Aer Condiționat", internet: "Internet", television: "Televiziune",
    security: "Securitate", electricity: "Electricitate", wather: "Apă", gas: "Gaz",
    wood_floors: "Parchet Lemn", phone: "Telefon", elevator: "Lift", intercom: "Interfon",
    central_heating: "Centrală Termică", terrace: "Terasă", garden: "Grădină", pool: "Piscină",
    storage: "Boxă",
  };
  for (const [xmlField, label] of Object.entries(featureMap)) if (boolField(xmlField)) features.push(label);

  const images = parseImagesCM(block);
  const externalId = d.id || d.external_id || null;
  const title = d.title || `Proprietate ${index + 1}`;
  const description = d.description || "";
  const projectName = extractProjectNameCustomMapping(title);

  let zone: string | null = d.zone || null;
  let location: string | null = d.location || null;
  let city: string | null = d.city || null;

  if (latitude && longitude && (!zone || isCoordinatesStr(zone))) {
    try {
      const geo = await reverseGeocodeCustomMapping(latitude, longitude);
      if (geo.zone) {
        zone = geo.zone;
        if (!location || isCoordinatesStr(location)) location = geo.zone;
      }
      if (geo.city) city = geo.city;
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      /* ignore geocoding failure */
    }
  }

  const contactInfo = brokerInfo || null;

  const property: any = {
    external_id: externalId,
    crm_source: "black-swan-estate",
    source: "api",
    transaction_type: transactionType,
    title,
    description,
    date_added: d.date_added ? new Date(d.date_added).toISOString() : null,
    rooms,
    bathrooms,
    kitchens,
    balconies,
    floor,
    total_floors: totalFloors,
    parking,
    year_built: yearBuilt,
    appartment_type: d.appartment_type || null,
    build_materials: d.build_materials || null,
    property_type: d.property_type || null,
    property_subtype: d.property_subtype || null,
    surface_min: area,
    surface_max: area,
    price_min: priceVal,
    price_max: priceVal,
    currency,
    price_type: priceType,
    latitude,
    longitude,
    zone,
    location: location || zone || city || "Necunoscut",
    city,
    commission_type: commissionType,
    commission_value: commissionValue,
    has_ac: boolField("air_conditioning") || null,
    has_internet: boolField("internet") || null,
    has_tv: boolField("television") || null,
    has_security: boolField("security") || null,
    has_electricity: boolField("electricity") || null,
    has_water: boolField("wather") || null,
    has_gas: boolField("gas") || null,
    has_wood_floors: boolField("wood_floors") || null,
    has_phone: boolField("phone") || null,
    exclusivity: boolField("exclusivity") || false,
    images,
    features,
    amenities: features,
    availability_status: "available",
    is_published: true,
    broker_id: d.broker || null,
    agency_id: d.agency || null,
    agent: d.broker || null,
    agency: d.agency || null,
    project_name: projectName,
    contact_info: contactInfo,
  };

  Object.keys(property).forEach((key) => {
    if (property[key] === null || property[key] === undefined) delete property[key];
  });
  if (externalId) property.external_id = externalId;

  return property;
}

async function parseXmlWithCustomMapping(xmlContent: string, fieldMapping: Record<string, string>): Promise<any[]> {
  const properties: any[] = [];
  try {
    const cleanXml = xmlContent
      .replace(/<\?xml[^>]*\?>/gi, "")
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/xmlns[^=]*="[^"]*"/gi, "")
      .replace(/\s+/g, " ");

    const propertyBlocks =
      cleanXml.match(/<listing[^>]*>[\s\S]*?<\/listing>/gi) ||
      cleanXml.match(/<ad[^>]*>[\s\S]*?<\/ad>/gi) ||
      cleanXml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||
      cleanXml.match(/<oferta[^>]*>[\s\S]*?<\/oferta>/gi) ||
      cleanXml.match(/<property[^>]*>[\s\S]*?<\/property>/gi) ||
      cleanXml.match(/<offer[^>]*>[\s\S]*?<\/offer>/gi) ||
      cleanXml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ||
      cleanXml.match(/<unit[^>]*>[\s\S]*?<\/unit>/gi);

    if (!propertyBlocks) return [];

    const brokerInfo = extractBrokerInfoCM(cleanXml);

    for (let index = 0; index < propertyBlocks.length; index++) {
      const block = propertyBlocks[index];
      try {
        const property = await mapSinglePropertyCM(block, index, fieldMapping, brokerInfo);
        if (property) properties.push(property);
      } catch {
        /* skip malformed block */
      }
    }
    return properties;
  } catch {
    return [];
  }
}

async function importXmlWithCustomMapping(supabase: any, xmlUrl: string, fieldMapping: Record<string, string>): Promise<Result> {
  try {
    const response = await fetch(xmlUrl);
    if (!response.ok) throw new Error(`Failed to fetch XML: ${response.status}`);
    const xmlContent = await response.text();
    const properties = await parseXmlWithCustomMapping(xmlContent, fieldMapping);

    if (properties.length === 0) return { success: true, message: "No properties found in XML feed with provided mapping", imported: 0 };

    let inserted = 0;
    let failed = 0;
    const batchSize = 50;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      const { data, error } = await supabase.from("catalog_offers").upsert(batch, { onConflict: "external_id", ignoreDuplicates: false }).select("id");
      if (error) {
        if (error.message.includes("extensions.net.http_post") || error.message.includes("cross-database references")) {
          inserted += batch.length;
        } else {
          failed += batch.length;
        }
      } else {
        inserted += data?.length || 0;
      }
    }

    try {
      await supabase.from("xml_import_sources").upsert(
        { url: xmlUrl, last_used_at: new Date().toISOString(), import_count: 1, last_mapping: fieldMapping },
        { onConflict: "url" },
      );
    } catch {
      /* non-critical */
    }

    return {
      success: true,
      message: `Import completat: ${inserted} proprietăți importate/actualizate${failed > 0 ? `, ${failed} eșuate` : ""}`,
      imported: inserted,
      updated: 0,
      failed,
      preview: properties.slice(0, 3),
    };
  } catch (error: any) {
    return { success: false, error: `Import XML cu mapare eșuat: ${error.message}` };
  }
}

export async function immofluxIntegration(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const { action, propertyId, url, xml_url } = body as {
    action?: string;
    propertyId?: string;
    url?: string;
    xml_url?: string;
  };

  const xmlActions = ["analyze_xml", "import_xml_feed", "import_xml_with_mapping"];
  const noCredentialsActions = [...xmlActions, "scrape_website"];

  const immofluxApiKey = await getConfig(supabase, "integration_immoflux_pass", "IMMOFLUX_API_KEY");
  const immofluxApiUser = await getConfig(supabase, "integration_immoflux_user", "IMMOFLUX_API_USER");

  if (!action || !noCredentialsActions.includes(action)) {
    if (!immofluxApiKey || !immofluxApiUser) return fail("Immoflux API credentials not configured");
  }

  switch (action) {
    case "sync_properties":
      return await syncPropertiesFromApi(supabase, immofluxApiKey, immofluxApiUser);
    case "scrape_website":
      return await scrapeWebsiteProperties(supabase, url || "https://imobiliaremilitari.ro/crm/properties");
    case "get_property":
      return await getPropertyFromApi(immofluxApiKey, immofluxApiUser, propertyId || "");
    case "analyze_xml":
      return await analyzeXmlStructure(xml_url || "");
    case "import_xml_feed":
      return await importXmlWithCustomMapping(supabase, xml_url || "", {});
    case "import_xml_with_mapping":
      return await importXmlWithCustomMapping(supabase, xml_url || "", (body.field_mapping as Record<string, string>) || {});
    case "test_connection":
      return await testImmofluxConnection(immofluxApiKey, immofluxApiUser);
    default:
      return fail("Invalid action specified");
  }
}

/* ==================================================================== */
/* sync-immoflux                                                        */
/* ==================================================================== */

const OTHER_RO_CITIES = new Set([
  "cluj", "cluj-napoca", "constanta", "iasi", "brasov", "sibiu",
  "craiova", "galati", "ploiesti", "oradea", "arad", "pitesti", "bacau", "buzau",
  "targu-mures", "baia-mare", "satu-mare", "braila", "suceava", "ramnicu-valcea",
  "targoviste", "focsani", "tulcea", "deva", "alba-iulia",
]);
const BUCHAREST_NEIGHBORHOODS = new Set([
  "berceni", "pantelimon", "colentina", "titan", "rahova", "dorobanti", "aviatorilor",
  "iancului", "timisoara", "ghencea", "militari", "giulesti", "crangasi", "vitan",
  "dristor", "obor", "unirii", "floreasca", "baneasa", "pipera", "aviatiei",
  "drumul taberei", "lujerului", "grozavesti", "politehnica", "cotroceni", "domenii",
  "victoriei", "romana", "universitate", "tineretului", "giurgiului", "sebastian",
  "orizont", "13 septembrie", "bucurestii noi", "aparatorii patriei",
  "eroii revolutiei", "metalurgiei", "valea cascadelor", "prelungirea ghencea",
]);

function normalizeRo(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/\s+/g, " ")
    .trim();
}

// Zone sanitizer: keeps the allowlist behaviour of dropping street/boulevard
// names masquerading as zones exactly as in the original edge function.
function sanitizeZone(rawZone: any, city: any, address: any): string | null {
  if (!rawZone) return null;
  const z = String(rawZone).trim();
  if (!z) return null;
  const zNorm = normalizeRo(z);
  const cityNorm = city ? normalizeRo(String(city)) : "";
  const isBucharest = cityNorm.startsWith("bucur");
  if (isBucharest && BUCHAREST_NEIGHBORHOODS.has(zNorm)) return z;
  if (isBucharest && OTHER_RO_CITIES.has(zNorm.replace(/\s+/g, "-"))) return null;
  if (address) {
    const aNorm = normalizeRo(String(address));
    const embedded = new RegExp(
      `(^|\\W)(bd\\.?|b-dul|bulevardul|str\\.?|strada|sos\\.?|soseaua|calea|aleea|intrarea|splaiul)\\s+${zNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    ).test(aNorm);
    if (embedded) return null;
  }
  return z;
}

const UTILITATI_LABELS: Record<string, string> = {
  "10001": "Curent", "10002": "Apă", "10003": "Canalizare", "10004": "Gaz",
  "10005": "Puț", "10006": "Fosă septică", "10007": "Curent trifazic",
  "10009": "CATV", "10010": "Telefon", "10011": "Telefon internațional",
  "10012": "Acces internet", "10013": "Fibră optică", "10014": "Telefon internațional",
  "10015": "Utilități în zonă", "10016": "Sistem irigație",
};
const INCALZIRE_LABELS: Record<string, string> = {
  "10101": "Termoficare", "10102": "Centrală proprie", "10103": "Centrală imobil",
  "10104": "Convectoare", "10105": "Sobă teracotă", "10106": "Centrală pe lemne",
  "10107": "Încălzire pardoseală", "10108": "Calorifere", "10109": "Șemineu",
};
const CLIMATIZARE_LABELS: Record<string, string> = {
  "10201": "Aer condiționat", "10202": "Ventiloconvectoare", "10203": "Aeroterme",
};
const TEREN_LABELS: Record<string, string> = {
  "10301": "Oportunitate de investiție", "10302": "Construcție demolabilă",
  "10303": "Parcelabil", "10304": "La șosea", "10305": "Acces auto", "10306": "Teren împrejmuit",
};
const FINISAJE_LABELS: Record<string, string> = {
  "20001": "Izolație exterior", "20002": "Izolație interior", "20003": "Bloc izolat termic",
  "20101": "Pereți vopsea lavabilă", "20102": "Pereți var", "20103": "Pereți faianță",
  "20104": "Pereți lambriu", "20105": "Pereți tapet", "20106": "Pereți marmură",
  "20107": "Pereți humă", "20108": "Pereți vinarom",
  "20201": "Parchet", "20202": "Gresie", "20203": "Marmură", "20204": "Mochetă",
  "20205": "Dușumea", "20206": "Linoleum",
  "20301": "Finisat", "20302": "Gri", "20303": "Roșu", "20304": "Stare bună",
  "20305": "Necesită renovare", "20306": "Renovat",
  "20401": "Ferestre PVC", "20402": "Ferestre lemn", "20403": "Ferestre aluminiu",
  "20501": "Jaluzele verticale", "20502": "Jaluzele orizontale",
  "20601": "Rulouri aluminiu", "20602": "Rulouri lemn", "20603": "Rulouri PVC",
  "20701": "Ușă intrare metal", "20702": "Ușă intrare lemn", "20703": "Ușă intrare PVC", "20704": "Ușă intrare PAL",
  "20801": "Lămpi", "20802": "Spoturi", "20803": "Aplice", "20804": "Iluminat exterior", "20805": "Lumină naturală",
  "20901": "Uși interior celulare", "20902": "Uși interior lemn", "20903": "Uși interior panel",
  "20904": "Uși interior PVC", "20905": "Uși interior sticlă", "20906": "Uși interior metal",
  "21001": "Acoperiș Lindab", "21002": "Acoperiș țiglă", "21003": "Terasă",
  "21004": "Acoperiș tablă", "21005": "Acoperiș carton", "21006": "Șindrilă bituminoasă",
};
const DOTARI_LABELS: Record<string, string> = {
  "30001": "Terasă", "30002": "WC serviciu", "30003": "Boxă la subsol", "30004": "Debara",
  "30011": "Pivniță", "30012": "Cramă", "30013": "Spațiu depozitare", "30014": "Dressing",
  "30015": "WC serviciu", "30016": "Anexe", "30017": "Dependințe",
  "30021": "Pivniță", "30022": "Cramă", "30023": "Spațiu depozitare", "30024": "Anexe",
  "30025": "Dependințe", "30026": "Parcare proprie", "30027": "Parcare acoperită",
  "30028": "Spațiu verde amenajat",
  "30101": "Bucătărie mobilată", "30102": "Bucătărie parțial mobilată", "30103": "Bucătărie utilată",
  "30104": "Bucătărie parțial utilată", "30105": "Bucătărie nemobilată", "30106": "Bucătărie neutilată",
  "30201": "Apometre", "30202": "Contor căldură", "30203": "Contor gaz",
  "30301": "Nemobilat", "30302": "Parțial mobilat", "30303": "Complet mobilat", "30304": "Mobilat lux",
  "30401": "Interfon", "30402": "Videointerfon", "30403": "Lift", "30404": "Spații agrement",
  "30405": "Saună", "30406": "SPA", "30407": "Acoperiș", "30408": "Curte", "30409": "Curte comună",
  "30410": "Grădină", "30411": "Piscină interioară", "30412": "Piscină exterioară", "30413": "Uscătorie",
  "30501": "Fier de călcat", "30502": "Cafetieră", "30503": "Uscător păr", "30504": "Toaster",
  "30505": "DVD", "30506": "Mașină de spălat rufe", "30507": "Sandwich-maker", "30508": "Frigider",
  "30509": "Cuptor microunde", "30510": "Aragaz", "30511": "Hotă", "30512": "Mașină de spălat vase",
  "30513": "Robot bucătărie", "30514": "Aspirator", "30515": "TV", "30516": "HI-FI",
  "30601": "Jacuzzi", "30602": "Scară interioară", "30603": "Șemineu", "30604": "Senzor de fum",
  "30605": "Sistem de alarmă", "30606": "Telecomandă poartă garaj", "30607": "Telecomandă poartă acces auto",
};

interface ImmofluxProperty {
  idnum: number;
  agent?: number;
  agent_info?: { nume?: string; email?: string; telefon?: string; phone?: string };
  dataadaugare?: number | string;
  adresa?: string;
  titlu: { ro?: string; en?: string } | string;
  descriere: { ro?: string; en?: string } | string;
  vecinatati?: { ro?: string; en?: string } | string;
  utilitati?: string;
  finisaje?: string;
  dotari?: string;
  altedetaliizona?: string;
  opinieagent?: { ro?: string; en?: string } | string;
  pretnegociabil?: number;
  longitudine?: number;
  latitudine?: number;
  tiplocuinta?: string;
  tipimobil?: string;
  tipteren?: string;
  nrfronturistradale?: number;
  suprafatateren?: string | number;
  nrcamere?: number;
  nrbucatarii?: number;
  etaj?: string;
  tipcompartimentare?: string;
  suprafatautila?: string | number;
  confort?: string;
  suprafataconstruita?: string | number;
  anconstructie?: number;
  nrbai?: number;
  nrnivele?: number;
  nrbalcoane?: number;
  nrgaraje?: number;
  tipconstructie_value?: string;
  mobilat_value?: string;
  bucatarie_values?: string[] | string;
  utilitati_values?: string[] | string;
  finisaje_values?: string[] | string;
  dotari_values?: string[] | string;
  structurarezistenta?: string;
  status?: string;
  localitate?: string;
  judet?: string;
  zona?: string;
  devanzare?: number;
  monedavanzare?: string;
  monedainchiriere?: string;
  pretvanzare?: number;
  pretinchiriere?: number;
  pretfaratva?: number;
  comisioncumparator?: number | string;
  images?: Array<{ src: string; tip?: string; pozitie: number; modificata?: string }>;
  publicare?: number;
  top?: number;
  pole?: number;
  poleposition?: number;
  tip?: string;
}

async function fetchAllProperties(supabase: any): Promise<ImmofluxProperty[]> {
  const baseUrl = await getBaseUrl(supabase);
  const auth = await getBasicAuth(supabase);
  const headers = { Authorization: auth, Accept: "application/json" };

  const firstRes = await fetch(`${baseUrl}/api/sites/v1/properties?page=1`, { headers });
  if (!firstRes.ok) throw new Error(`IMMOFLUX API error: ${firstRes.status}`);
  const firstData: any = await firstRes.json();
  const allProps: ImmofluxProperty[] = [...(firstData.data || [])];
  const lastPage = firstData.last_page || 1;

  for (let batchStart = 2; batchStart <= lastPage; batchStart += 5) {
    const batchEnd = Math.min(batchStart + 4, lastPage);
    const promises = [];
    for (let p = batchStart; p <= batchEnd; p++) {
      promises.push(fetch(`${baseUrl}/api/sites/v1/properties?page=${p}`, { headers }).then((r) => (r.ok ? r.json() : { data: [] })));
    }
    const results = await Promise.all(promises);
    results.forEach((r: any) => allProps.push(...(r.data || [])));
  }

  return allProps;
}

const toArr = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(/[,;|\s]+/).filter(Boolean);
  return [];
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
};
const intOrNull = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const localized = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return (v as any).ro || (v as any).en || "";
  return String(v);
};
const labelize = (codes: string[], dict: Record<string, string>): string[] => codes.map((c) => dict[c]).filter(Boolean);

function buildImmofluxSlug(p: ImmofluxProperty, surface: number | null, floorLabel: string | null): string {
  const parts: string[] = [];
  const rooms = p.nrcamere || 1;
  parts.push(rooms <= 1 ? "garsoniera" : `apartament-${rooms}-camere`);
  if (surface && surface > 0) parts.push(`${surface}mp`);
  if (floorLabel) {
    if (/parter|demisol/i.test(floorLabel)) parts.push("parter");
    else {
      const m = floorLabel.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (Number.isFinite(n) && n >= 0) parts.push(n === 0 ? "parter" : `etaj-${n}`);
      }
    }
  }
  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (p.zona) {
    const z = slugify(p.zona.split(",")[0].trim());
    if (z && z.length > 2 && !parts.some((x) => x.includes(z))) parts.push(z);
  }
  if (p.localitate) {
    const c = slugify(p.localitate.split(",")[0].trim());
    if (c && c.length > 2 && !parts.some((x) => x.includes(c))) parts.push(c);
  }
  if (p.idnum !== undefined && p.idnum !== null) parts.push(String(p.idnum));
  return parts.join("-");
}

function mapToCatalogOffer(p: ImmofluxProperty): Record<string, unknown> {
  const title = localized(p.titlu) || `Proprietate #${p.idnum}`;
  const description = localized(p.descriere);

  const vecin = localized(p.vecinatati);
  const opinieAgent = localized((p as any).opinieagent);
  const extraSections: Record<string, string> = {};
  if (p.utilitati) extraSections.utilitati = p.utilitati;
  if (p.finisaje) extraSections.finisaje = p.finisaje;
  if (p.dotari) extraSections.dotari = p.dotari;
  if (vecin) extraSections.vecinatati = vecin;
  if (opinieAgent) extraSections.opinieagent = opinieAgent;
  if (p.altedetaliizona) extraSections.altedetaliizona = p.altedetaliizona;

  const isSale = p.devanzare === 1;
  const price = isSale ? p.pretvanzare : p.pretinchiriere || p.pretvanzare;
  const currency = isSale ? p.monedavanzare || "EUR" : p.monedainchiriere || "EUR";

  const surface = intOrNull(p.suprafatautila);
  const surfaceLand = intOrNull(p.suprafatateren);

  const images = (p.images || []).sort((a, b) => a.pozitie - b.pozitie).map((img) => img.src);
  const isPole = p.pole === 1 || p.poleposition === 1;
  const isTop = p.top === 1;
  const promotionType = isPole ? "pole_position" : isTop ? "top" : null;

  const utilCodes = toArr(p.utilitati_values);
  const finisCodes = toArr(p.finisaje_values);
  const dotariCodes = toArr(p.dotari_values);
  const bucCodes = toArr(p.bucatarie_values);

  const features = [
    ...labelize(finisCodes, FINISAJE_LABELS),
    ...labelize(utilCodes, UTILITATI_LABELS),
    ...labelize(utilCodes, INCALZIRE_LABELS),
    ...labelize(utilCodes, TEREN_LABELS),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const amenities = [
    ...labelize(dotariCodes, DOTARI_LABELS),
    ...labelize(bucCodes, DOTARI_LABELS),
    ...labelize(utilCodes, CLIMATIZARE_LABELS),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const has = (code: string) => utilCodes.includes(code);
  const hasDot = (code: string) => dotariCodes.includes(code);

  const has_electricity = has("10001") || has("10007") || null;
  const has_water = has("10002") || has("10005") || null;
  const has_gas = has("10004") || hasDot("30203") || null;
  const has_internet = has("10012") || has("10013") || null;
  const has_tv = has("10009") || hasDot("30515") || null;
  const has_phone = has("10010") || has("10011") || has("10014") || null;
  const has_ac = utilCodes.includes("10201") || null;
  const has_security = hasDot("30605") || hasDot("30604") || null;
  const has_wood_floors = finisCodes.includes("20201") || finisCodes.includes("20205") || null;

  const heatingCode = utilCodes.find((c) => INCALZIRE_LABELS[c]);
  const heating = heatingCode ? INCALZIRE_LABELS[heatingCode] : null;

  const mobilatCode = dotariCodes.find((c) => ["30301", "30302", "30303", "30304"].includes(c));
  const furnished = p.mobilat_value || (mobilatCode ? DOTARI_LABELS[mobilatCode] : null);

  const parking = (hasDot("30026") ? 1 : 0) + (hasDot("30027") ? 1 : 0) + (p.nrgaraje || 0);

  const agent = p.agent_info?.nume || (p.agent ? `Agent #${p.agent}` : null);
  const agencyContact = p.agent_info
    ? { name: p.agent_info.nume, email: p.agent_info.email, phone: p.agent_info.phone || p.agent_info.telefon }
    : null;

  let date_added: string | null = null;
  if (p.dataadaugare) {
    const ts = typeof p.dataadaugare === "number" ? p.dataadaugare : parseInt(String(p.dataadaugare));
    if (!isNaN(ts)) date_added = new Date(ts * (ts > 1e12 ? 1 : 1000)).toISOString();
  }

  const floorLabel = p.etaj ? String(p.etaj).trim() : null;
  const floorInt = intOrNull(p.etaj);
  const immofluxSlug = buildImmofluxSlug(p, surface, floorLabel);

  return {
    external_id: `immoflux-${p.idnum}`,
    crm_source: "immoflux",
    source: "immoflux",
    title,
    description,
    descriere_lunga: description,
    extra_sections: Object.keys(extraSections).length ? extraSections : null,
    immoflux_slug: immofluxSlug,
    price_min: price || 0,
    price_max: price || 0,
    currency,
    rooms: p.nrcamere || 1,
    kitchens: p.nrbucatarii || null,
    surface_min: surface,
    surface_max: surface,
    surface_land: surfaceLand,
    images,
    location: p.adresa || p.zona || p.localitate,
    zone: sanitizeZone(p.zona, p.localitate, p.adresa),
    city: p.localitate || null,
    floor: floorInt,
    floor_label: floorLabel,
    total_floors: p.nrnivele || null,
    bathrooms: p.nrbai || null,
    balconies: p.nrbalcoane || null,
    year_built: p.anconstructie || null,
    transaction_type: isSale ? "sale" : "rent",
    is_featured: isTop || isPole,
    promotion_type: promotionType,
    is_published: p.publicare === 0 ? false : true,
    property_type: p.tiplocuinta || p.tipimobil || null,
    property_subtype: p.tipteren || null,
    appartment_type: p.tip || null,
    building_type: p.tipconstructie_value || null,
    compartment: p.tipcompartimentare || null,
    build_materials: p.structurarezistenta || null,
    comfort: p.confort || null,
    heating,
    furnished,
    parking: parking || null,
    latitude: p.latitudine || null,
    longitude: p.longitudine || null,
    availability_status: "available",
    features: features.length ? features : null,
    amenities: amenities.length ? amenities : null,
    agent,
    contact_info: agencyContact,
    broker_id: p.agent ? String(p.agent) : null,
    has_water, has_gas, has_electricity, has_internet, has_tv,
    has_phone, has_ac, has_security, has_wood_floors,
    price_type: p.pretnegociabil === 1 ? "negotiable" : null,
    commission_value: num(p.comisioncumparator),
    date_added,
    project_id: null,
  };
}

async function writeStatus(supabase: any, value: Record<string, unknown>) {
  try {
    await supabase.from("site_settings").upsert({ key: "immoflux_sync_status", value: JSON.stringify(value) }, { onConflict: "key" });
  } catch {
    /* non-fatal */
  }
}

// Withdrawn / inactive statuses from Immoflux (retras/inactiv/indisponibil/expirat).
// These are fully removed from the catalog — no upsert, delete existing rows.
function isWithdrawnStatus(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const s = String(raw).toLowerCase().trim();
  return (
    s.includes("retras") ||
    s.includes("inactiv") ||
    s.includes("inactive") ||
    s.includes("unavailable") ||
    s.includes("indisponibil") ||
    s.includes("expirat") ||
    s.includes("expired")
  );
}

async function runSync(supabase: any, startedAt: string): Promise<Result> {
  try {
    await writeStatus(supabase, { status: "running", started_at: startedAt, stage: "fetching" });

    const properties = await fetchAllProperties(supabase);

    const withdrawnExternalIds: string[] = [];
    const activeProperties: ImmofluxProperty[] = [];
    for (const p of properties) {
      if (isWithdrawnStatus(p.status)) withdrawnExternalIds.push(`immoflux-${p.idnum}`);
      else activeProperties.push(p);
    }

    const mapped = activeProperties.map(mapToCatalogOffer);

    await writeStatus(supabase, { status: "running", started_at: startedAt, stage: "upserting", total: mapped.length, synced: 0 });

    let upserted = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < mapped.length; i += batchSize) {
      const batch = mapped.slice(i, i + batchSize);
      const { error } = await supabase.from("catalog_offers").upsert(batch, { onConflict: "external_id", ignoreDuplicates: false });
      if (error) {
        if (error.message.includes("extensions.net.http_post") || error.message.includes("cross-database references")) upserted += batch.length;
        else failed += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    if (withdrawnExternalIds.length > 0) {
      const delBatch = 100;
      for (let i = 0; i < withdrawnExternalIds.length; i += delBatch) {
        const slice = withdrawnExternalIds.slice(i, i + delBatch);
        await supabase.from("catalog_offers").delete().in("external_id", slice);
      }
    }

    await writeStatus(supabase, { status: "running", started_at: startedAt, stage: "deactivating", total: mapped.length, synced: upserted, failed });

    const currentIds = new Set(mapped.map((m) => m.external_id as string));
    const { data: existing, error: listErr } = await supabase
      .from("catalog_offers")
      .select("external_id")
      .eq("crm_source", "immoflux")
      .neq("availability_status", "sold");

    if (!listErr && existing && existing.length > 0) {
      const toDeactivate = existing.map((r: any) => r.external_id as string).filter((id: string) => id && !currentIds.has(id));
      const deactivateBatch = 100;
      for (let i = 0; i < toDeactivate.length; i += deactivateBatch) {
        const slice = toDeactivate.slice(i, i + deactivateBatch);
        await supabase.from("catalog_offers").update({ availability_status: "sold", is_published: true }).in("external_id", slice);
      }
    }

    const finishedAt = new Date().toISOString();
    const result: Result = { status: "done", success: true, started_at: startedAt, finished_at: finishedAt, synced: upserted, failed, total: mapped.length };
    await writeStatus(supabase, result);
    return result;
  } catch (error: any) {
    const result: Result = { status: "error", success: false, started_at: startedAt, finished_at: new Date().toISOString(), error: error?.message || String(error) };
    await writeStatus(supabase, result);
    return result;
  }
}

export async function syncImmoflux(body: AnyRecord): Promise<Result> {
  const supabase = await db();

  // Read-only status check (used by frontend polling), matches ?status=1.
  if (body?.status === "1" || body?.status === 1 || body?.status === true) {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "immoflux_sync_status").maybeSingle();
    let parsed: any = null;
    try {
      parsed = data?.value ? JSON.parse(data.value) : null;
    } catch {
      parsed = null;
    }
    return { ok: true, status: parsed };
  }

  const { data: existing } = await supabase.from("site_settings").select("value").eq("key", "immoflux_sync_status").maybeSingle();
  let current: any = null;
  try {
    current = existing?.value ? JSON.parse(existing.value) : null;
  } catch {
    /* ignore */
  }
  if (current?.status === "running") {
    const startedMs = current.started_at ? Date.parse(current.started_at) : 0;
    const ageMs = Date.now() - startedMs;
    if (ageMs < 5 * 60 * 1000) {
      return { started: false, alreadyRunning: true, status: current };
    }
  }

  const startedAt = new Date().toISOString();
  await writeStatus(supabase, { status: "running", started_at: startedAt, stage: "starting" });

  // NOTE: unlike the original edge function (which used EdgeRuntime.waitUntil
  // to run in the background and return immediately), this server function
  // runs the sync inline and returns the final result, since there is no
  // background-execution context available here.
  const result = await runSync(supabase, startedAt);
  return { started: true, started_at: startedAt, ...result };
}

/* ==================================================================== */
/* immoflux-proxy                                                       */
/* ==================================================================== */

const proxyCache = new Map<string, { data: string; expires: number }>();
const PROXY_CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): string | null {
  const entry = proxyCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  if (entry) proxyCache.delete(key);
  return null;
}

function setCache(key: string, data: string): void {
  proxyCache.set(key, { data, expires: Date.now() + PROXY_CACHE_TTL_MS });
  if (proxyCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of proxyCache) if (v.expires < now) proxyCache.delete(k);
  }
}

async function proxyGet(supabase: any, path: string, useCache = true): Promise<any> {
  const cacheKey = `GET:${path}`;
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return JSON.parse(cached);
  }
  const [baseUrl, auth] = await Promise.all([getBaseUrl(supabase), getBasicAuth(supabase)]);
  const url = `${baseUrl}${path}`;
  const resp = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const body = await resp.text();
  if (resp.ok && useCache) setCache(cacheKey, body);
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

async function proxyPost(supabase: any, path: string, payload: unknown): Promise<any> {
  const [baseUrl, auth] = await Promise.all([getBaseUrl(supabase), getBasicAuth(supabase)]);
  const url = `${baseUrl}${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await resp.text();
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export async function immofluxProxy(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const action = (body?.action as string) || "";

  if (action === "properties") {
    const propertyId = body?.propertyId as string | undefined;
    if (propertyId) return await proxyGet(supabase, `/api/sites/v1/properties/${propertyId}`);
    const page = (body?.page as string | number | undefined) || 1;
    return await proxyGet(supabase, `/api/sites/v1/properties?page=${page}`);
  }

  if (action === "agents") {
    return await proxyGet(supabase, "/api/sites/v1/agents");
  }

  if (action === "webhook") {
    return { success: true, message: "Webhook received" };
  }

  if (action === "contact") {
    return await proxyPost(supabase, "/api/sites/v1/contacts", body?.payload ?? {});
  }

  if (action === "visit") {
    try {
      await proxyPost(supabase, "/api/sites/v1/visits", body?.payload ?? {});
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  return fail("Not found");
}

/* ==================================================================== */
/* import-complexes-excel                                               */
/* ==================================================================== */

export async function importComplexesExcel(body: AnyRecord): Promise<Result> {
  const XLSX = await import("xlsx");
  const supabase = await db();

  const { fileData, fileName, file, projectId, projectName, location: reqLocation } = body as {
    fileData?: string;
    fileName?: string;
    file?: string;
    projectId?: string;
    projectName?: string;
    location?: string;
  };

  const base64Data = fileData || file;
  if (!base64Data) return fail("No file data provided");

  try {
    const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });

    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const isApartmentData = headers.some(
      (h) => h.toUpperCase().includes("ETAJ") || h.toUpperCase().includes("NR AP") || h.toUpperCase().includes("TIP COM") || h.toUpperCase().includes("SUPRAFATA"),
    );
    const isComplexData = headers.some(
      (h) => h.toLowerCase().includes("nume") || h.toLowerCase().includes("name") || h.toLowerCase().includes("locatie") || h.toLowerCase().includes("location"),
    );

    let imported = 0;
    const errors: string[] = [];
    let complexId: string | null = null;

    const getColumnValue = (row: any, ...possibleNames: string[]): string | null => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== "") return String(row[name]).trim();
        const keys = Object.keys(row);
        const matchingKey = keys.find((k) => k.toLowerCase() === name.toLowerCase());
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== "") return String(row[matchingKey]).trim();
      }
      return null;
    };

    if (isApartmentData) {
      let complexName = fileName?.replace(/\.(xlsx|xls|csv)$/i, "") || "Complex Importat";
      if (projectId) {
        complexId = projectId;
        complexName = projectName || complexName;
      } else {
        const { data: newComplex, error: complexError } = await supabase
          .from("real_estate_projects")
          .insert({ name: complexName, location: reqLocation || "București", description: `Complex importat din ${fileName}`, status: "available" })
          .select()
          .single();
        if (complexError) return fail(`Nu s-a putut crea complexul: ${complexError.message}`);
        complexId = newComplex.id;
      }

      for (const row of data) {
        try {
          const apartmentNumber = getColumnValue(row, "NR AP", "Nr Ap", "Numar Apartament");
          const floor = getColumnValue(row, "ETAJ", "Etaj");
          const type = getColumnValue(row, "TIP COM", "Tip", "Type");
          const surface = getColumnValue(row, "SUPRAFATA", "Suprafata", "Surface");
          const priceCredit = getColumnValue(row, "CREDIT", "Credit");
          const price50 = getColumnValue(row, "AVANS 50%", "Avans 50");
          const price80 = getColumnValue(row, "AVANS 80%", "Avans 80");
          const clientName = getColumnValue(row, "NUME", "Nume Client");
          const agent = getColumnValue(row, "AGENT", "Agent");

          if (!apartmentNumber || apartmentNumber.toLowerCase().includes("etaj") || apartmentNumber.toLowerCase().includes("parter") || apartmentNumber.toLowerCase().includes("demisol")) {
            continue;
          }

          let price: number | null = null;
          let availabilityStatus = "available";
          if (price80) price = parseFloat(price80.replace(/[^\d.-]/g, ""));
          else if (price50) price = parseFloat(price50.replace(/[^\d.-]/g, ""));
          else if (priceCredit) price = parseFloat(priceCredit.replace(/[^\d.-]/g, ""));

          if (clientName && clientName.toLowerCase().includes("rezervat")) availabilityStatus = "reserved";
          else if (clientName && clientName.trim() !== "") availabilityStatus = "sold";

          let rooms = 1;
          if (type) {
            const typeLower = type.toLowerCase();
            if (typeLower.includes("2 camere") || typeLower.includes("ap 2")) rooms = 2;
            else if (typeLower.includes("3 camere") || typeLower.includes("ap 3")) rooms = 3;
            else if (typeLower.includes("studio")) rooms = 1;
          }

          const surfaceNum = surface ? parseFloat(surface.replace(/[^\d.-]/g, "")) : null;

          const apartmentData = {
            title: `${type || "Apartament"} ${apartmentNumber}${floor ? " - " + floor : ""}`,
            location: "București",
            description: `${type || "Apartament"} pe ${floor || "etaj nedefinit"}${agent ? `, Agent: ${agent}` : ""}${clientName && clientName.trim() ? `, Client: ${clientName}` : ""}`,
            price_min: price || 0,
            price_max: price || 0,
            surface_min: surfaceNum || 0,
            surface_max: surfaceNum || 0,
            rooms,
            available_units: availabilityStatus === "available" ? 1 : 0,
            project_id: complexId,
            project_name: complexName,
            source: "excel_import",
            availability_status: availabilityStatus,
            currency: "EUR",
            transaction_type: "sale",
          };

          const { error: aptError } = await supabase.from("catalog_offers").insert(apartmentData);
          if (aptError) errors.push(`${apartmentNumber}: ${aptError.message}`);
          else imported++;
        } catch (rowError: any) {
          errors.push(`Eroare la procesare: ${rowError.message}`);
        }
      }
    } else if (isComplexData) {
      for (const row of data) {
        let name: string | null = null;
        try {
          name = getColumnValue(row, "Nume", "Name", "Denumire", "Complex");
          const location = getColumnValue(row, "Locatie", "Location", "Adresa", "Address");
          if (!name || !location) {
            errors.push("Rând omis: lipsește Nume sau Locație");
            continue;
          }

          const description = getColumnValue(row, "Descriere", "Description", "Detalii");
          const developer = getColumnValue(row, "Dezvoltator", "Developer", "Constructor");
          const priceMin = getColumnValue(row, "Pret Min", "Price Min", "Pret Minim");
          const priceMax = getColumnValue(row, "Pret Max", "Price Max", "Pret Maxim");
          const surfaceMin = getColumnValue(row, "Suprafata Min", "Surface Min", "Suprafata Minima");
          const surfaceMax = getColumnValue(row, "Suprafata Max", "Surface Max", "Suprafata Maxima");
          const rooms = getColumnValue(row, "Camere", "Rooms", "Nr Camere");
          const completionDate = getColumnValue(row, "Data Finalizare", "Completion Date", "Finalizare");
          const statusValue = getColumnValue(row, "Status", "Stare", "Disponibilitate");

          let priceRange: string | null = null;
          if (priceMin && priceMax) {
            const min = parseFloat(priceMin.replace(/[^\d.-]/g, ""));
            const max = parseFloat(priceMax.replace(/[^\d.-]/g, ""));
            if (!isNaN(min) && !isNaN(max)) priceRange = `${min.toLocaleString()} - ${max.toLocaleString()} EUR`;
          }

          let surfaceRange: string | null = null;
          if (surfaceMin && surfaceMax) {
            const min = parseFloat(surfaceMin.replace(/[^\d.-]/g, ""));
            const max = parseFloat(surfaceMax.replace(/[^\d.-]/g, ""));
            if (!isNaN(min) && !isNaN(max)) surfaceRange = `${min} - ${max} mp`;
          }

          let status = "available";
          if (statusValue) {
            const statusLower = statusValue.toLowerCase();
            if (statusLower.includes("vand") || statusLower.includes("sold")) status = "sold_out";
            else if (statusLower.includes("curand") || statusLower.includes("soon")) status = "coming_soon";
          }

          const complexData = { name, location, description, developer, price_range: priceRange, surface_range: surfaceRange, rooms_range: rooms, completion_date: completionDate, status };
          const { error } = await supabase.from("real_estate_projects").insert(complexData);
          if (error) errors.push(`${name}: ${error.message}`);
          else imported++;
        } catch (rowError: any) {
          errors.push(`${name || "Unknown"}: ${rowError.message}`);
        }
      }
    } else {
      return fail("Nu s-a putut detecta tipul de date. Asigurați-vă că fișierul conține coloanele necesare.");
    }

    return { success: true, imported, total: data.length, dataType: isApartmentData ? "apartments" : "complexes", complexId, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    return fail(error.message);
  }
}

/* ==================================================================== */
/* import-complexes-pdf                                                 */
/* ==================================================================== */

export async function importComplexesPdf(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const { fileData, fileName } = body as { fileData?: string; fileName?: string };
  if (!fileData) return fail("No file data provided");

  try {
    const buffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) return fail("DEEPSEEK_API_KEY not configured");

    const text = new TextDecoder().decode(buffer);

    const aiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekApiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Tu ești un asistent care extrage date structurate despre complexe rezidențiale din text. 
            Returnează DOAR un array JSON valid cu complexe, fără text adițional.
            Structura pentru fiecare complex:
            {
              "name": "nume complex",
              "location": "locație",
              "description": "descriere",
              "developer": "dezvoltator",
              "price_min": număr sau null,
              "price_max": număr sau null,
              "surface_min": număr sau null,
              "surface_max": număr sau null,
              "rooms_range": "text sau null",
              "completion_date": "text sau null",
              "status": "available/sold_out/coming_soon"
            }`,
          },
          { role: "user", content: `Extrage datele despre complexe rezidențiale din următorul text:\n\n${text.substring(0, 10000)}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return fail(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData: any = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content;
    if (!extractedText) return fail("No data extracted from PDF");

    let complexes: any[];
    try {
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
      complexes = JSON.parse(jsonText);
    } catch {
      return fail("Could not parse extracted data. Please ensure the PDF contains structured complex information.");
    }

    if (!Array.isArray(complexes)) complexes = [complexes];

    let imported = 0;
    const errors: string[] = [];

    for (const complex of complexes) {
      try {
        if (!complex.name || !complex.location) {
          errors.push("Complex omis: lipsește nume sau locație");
          continue;
        }

        let priceRange: string | null = null;
        if (complex.price_min && complex.price_max) priceRange = `${complex.price_min.toLocaleString()} - ${complex.price_max.toLocaleString()} EUR`;

        let surfaceRange: string | null = null;
        if (complex.surface_min && complex.surface_max) surfaceRange = `${complex.surface_min} - ${complex.surface_max} mp`;

        const complexData = {
          name: complex.name.trim(),
          location: complex.location.trim(),
          description: complex.description?.trim() || null,
          developer: complex.developer?.trim() || null,
          price_range: priceRange,
          surface_range: surfaceRange,
          rooms_range: complex.rooms_range?.trim() || null,
          completion_date: complex.completion_date?.toString().trim() || null,
          status: complex.status || "available",
        };

        const { error } = await supabase.from("real_estate_projects").insert(complexData);
        if (error) errors.push(`${complex.name}: ${error.message}`);
        else imported++;
      } catch (rowError: any) {
        errors.push(`${complex.name || "Unknown"}: ${rowError.message}`);
      }
    }

    return { success: true, imported, total: complexes.length, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    return fail(error.message);
  }
}

/* ==================================================================== */
/* import-excel-apartments                                              */
/* ==================================================================== */

export async function importExcelApartments(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const { apartments, projectId } = body as { apartments?: any[]; projectId?: string };

  if (!apartments || !Array.isArray(apartments)) return fail("Apartamentele sunt necesare");

  try {
    const { data: project } = await supabase.from("real_estate_projects").select("*").eq("id", projectId).single();
    if (!project) return fail("Proiect negăsit");

    const offersToInsert = apartments.map((apt: any) => {
      const priceCredit = parseInt(String(apt.pret_credit).replace(/[€.,\s]/g, ""));
      const priceCash = parseInt(String(apt.pret_cash).replace(/[€.,\s]/g, ""));

      let rooms = 1;
      if (apt.tip.includes("decomandat")) rooms = 2;
      else if (apt.tip.includes("studio")) rooms = 1;

      return {
        title: `Apartament ${apt.nr} - ${apt.tip}`,
        description: `${apt.tip} cu suprafața de ${apt.suprafata}mp, situat la ${apt.floor}`,
        project_id: projectId,
        project_name: project.name,
        location: project.location,
        surface_min: parseInt(apt.suprafata),
        surface_max: parseInt(apt.suprafata),
        price_min: priceCash,
        price_max: priceCredit,
        rooms,
        transaction_type: "sale",
        currency: "EUR",
        features: [apt.floor, `Apartament ${apt.nr}`, apt.tip],
        amenities: project.amenities || [],
        source: "excel_import",
        availability_status: "available",
        images: [],
      };
    });

    const { data: insertedOffers, error: insertError } = await supabase.from("catalog_offers").insert(offersToInsert).select();
    if (insertError) return fail(insertError.message);

    return { success: true, imported: insertedOffers.length, apartments: insertedOffers.map((o: any) => ({ id: o.id, title: o.title })) };
  } catch (e: any) {
    return fail(e?.message || "Unknown error");
  }
}

/* ==================================================================== */
/* import-renew-apartments                                              */
/* ==================================================================== */

interface RenewApartmentData {
  nr: string;
  tip: string;
  suprafata: number;
  pretCredit: number;
  pretCash: number;
  etaj: string;
}

const RENEW_APARTMENTS_DATA: RenewApartmentData[] = [
  { nr: "1", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
  { nr: "2", tip: "garsoniera", suprafata: 35, pretCredit: 54500, pretCash: 52000, etaj: "P" },
  { nr: "3", tip: "garsoniera", suprafata: 35, pretCredit: 54500, pretCash: 52000, etaj: "P" },
  { nr: "4", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
  { nr: "5", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
  { nr: "6", tip: "studio", suprafata: 43, pretCredit: 67500, pretCash: 65000, etaj: "P" },
  { nr: "7", tip: "studio", suprafata: 43, pretCredit: 67500, pretCash: 65000, etaj: "P" },
  { nr: "8", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
  { nr: "9", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
  { nr: "10", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E1" },
  { nr: "11", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E1" },
  { nr: "12", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
  { nr: "13", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E1" },
  { nr: "14", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E1" },
  { nr: "15", tip: "garsoniera", suprafata: 35, pretCredit: 65450, pretCash: 52850, etaj: "E1" },
  { nr: "16", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
  { nr: "17", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
  { nr: "18", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E2" },
  { nr: "19", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E2" },
  { nr: "20", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
  { nr: "21", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E2" },
  { nr: "22", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E2" },
  { nr: "23", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E2" },
  { nr: "24", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
  { nr: "25", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E3" },
  { nr: "26", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E3" },
  { nr: "27", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E3" },
  { nr: "28", tip: "garsoniera", suprafata: 32, pretCredit: 59840, pretCash: 48320, etaj: "E3" },
  { nr: "29", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E3" },
  { nr: "30", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E3" },
  { nr: "31", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E3" },
  { nr: "32", tip: "garsoniera", suprafata: 32, pretCredit: 59840, pretCash: 48320, etaj: "E3" },
  { nr: "33", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
  { nr: "34", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E4" },
  { nr: "35", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E4" },
  { nr: "36", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
  { nr: "37", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E4" },
  { nr: "38", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E4" },
  { nr: "39", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E4" },
  { nr: "40", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
  { nr: "41", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46500, etaj: "E5" },
  { nr: "42", tip: "ap decomandat", suprafata: 52, pretCredit: 72000, pretCash: 70000, etaj: "E5" },
  { nr: "43", tip: "ap decomandat", suprafata: 52, pretCredit: 72000, pretCash: 70000, etaj: "E5" },
  { nr: "44", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46000, etaj: "E5" },
  { nr: "45", tip: "ap decomandat", suprafata: 54, pretCredit: 73000, pretCash: 70500, etaj: "E5" },
  { nr: "46", tip: "garsoniera", suprafata: 35, pretCredit: 53500, pretCash: 51000, etaj: "E5" },
  { nr: "47", tip: "garsoniera", suprafata: 35, pretCredit: 53500, pretCash: 51000, etaj: "E5" },
  { nr: "48", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46500, etaj: "E5" },
];

export async function importRenewApartments(_body: AnyRecord): Promise<Result> {
  const supabase = await db();

  try {
    const { data: project, error: projectError } = await supabase.from("real_estate_projects").select("id").eq("name", "RENEW RESIDENCE").maybeSingle();
    if (projectError) throw projectError;
    if (!project) return fail("Proiectul Renew Residence nu a fost găsit");

    const getRoomCount = (tip: string): number => {
      if (tip === "garsoniera" || tip === "studio") return 1;
      if (tip === "ap decomandat") return 2;
      return 1;
    };

    const offersToInsert = RENEW_APARTMENTS_DATA.map((apt) => ({
      title: `Apartament ${apt.nr} - ${apt.tip}`,
      description: `${apt.tip.charAt(0).toUpperCase() + apt.tip.slice(1)} cu suprafața de ${apt.suprafata} mp, situat la ${apt.etaj}`,
      project_id: project.id,
      project_name: "RENEW RESIDENCE",
      location: "Chiajna",
      rooms: getRoomCount(apt.tip),
      surface_min: apt.suprafata,
      surface_max: apt.suprafata,
      price_min: apt.pretCash,
      price_max: apt.pretCredit,
      currency: "EUR",
      availability_status: "available",
      available_units: 1,
      source: "excel_import",
      features: [
        `Etaj: ${apt.etaj}`,
        `Suprafață: ${apt.suprafata} mp`,
        `Tip: ${apt.tip}`,
        `Preț cash: ${apt.pretCash.toLocaleString()} EUR`,
        `Preț credit: ${apt.pretCredit.toLocaleString()} EUR`,
      ],
    }));

    const { data, error: insertError } = await supabase.from("catalog_offers").insert(offersToInsert).select();
    if (insertError) throw insertError;

    return { success: true, count: data.length, message: `Au fost importate ${data.length} apartamente cu succes!` };
  } catch (error: any) {
    return fail(error.message);
  }
}

/* ==================================================================== */
/* facebook-catalog-import                                              */
/* ==================================================================== */

interface FacebookProduct {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  availability: string;
  condition: string;
  price: string;
  currency: string;
  brand: string;
  retailer_id: string;
  custom_data?: { [key: string]: any };
}

export async function facebookCatalogImport(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const action = (body?.action as string) || "sync";

  if (action === "sync") {
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookCatalogId = process.env.FACEBOOK_CATALOG_ID;
    const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!facebookAppId || !facebookCatalogId) return fail("Facebook App ID and Catalog ID are required");
    if (!facebookAccessToken) return fail("Facebook Access Token is required. App ID cannot be used as access token.");

    try {
      const graphApiUrl = `https://graph.facebook.com/v18.0/${facebookCatalogId}/products?fields=id,name,description,url,image_url,availability,condition,price,currency,brand,retailer_id,custom_data&access_token=${facebookAccessToken}`;
      const response = await fetch(graphApiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        return fail(`Facebook API error: ${response.status} ${response.statusText} ${errorText}`);
      }

      const facebookData: any = await response.json();
      if (!facebookData.data || !Array.isArray(facebookData.data)) return fail("Invalid response format from Facebook API");

      const products: FacebookProduct[] = facebookData.data;

      await supabase.from("catalog_offers").delete().like("project_name", "%Facebook Catalog%");

      const catalogOffers = products.map((product: FacebookProduct) => {
        const priceInCents = parseInt(product.price) || 0;
        const price = Math.round(priceInCents / 100);
        const customData = product.custom_data || {};

        return {
          title: product.name,
          description: product.description || "",
          location: customData.location || "Locație nedefinită",
          images: product.image_url ? [product.image_url] : [],
          price_min: price,
          price_max: price,
          surface_min: customData.surface_min ? parseInt(customData.surface_min) : null,
          surface_max: customData.surface_max ? parseInt(customData.surface_max) : null,
          rooms: customData.rooms ? parseInt(customData.rooms) : 1,
          features: customData.features ? (Array.isArray(customData.features) ? customData.features : [customData.features]) : [],
          amenities: customData.amenities ? (Array.isArray(customData.amenities) ? customData.amenities : [customData.amenities]) : [],
          availability_status: product.availability === "in stock" ? "available" : "sold",
          project_name: "Facebook Catalog Import",
          currency: product.currency || "EUR",
          contact_info: { source: "facebook", retailer_id: product.retailer_id },
        };
      });

      if (catalogOffers.length > 0) {
        const { data: insertedData, error: insertError } = await supabase.from("catalog_offers").insert(catalogOffers).select();
        if (insertError) return fail(insertError.message);
        return { success: true, message: `Successfully imported ${insertedData?.length || 0} properties from Facebook catalog`, imported_count: insertedData?.length || 0 };
      }
      return { success: true, message: "No products found in Facebook catalog", imported_count: 0 };
    } catch (error: any) {
      return fail(error?.message || "Failed to sync Facebook catalog");
    }
  } else if (action === "test") {
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookCatalogId = process.env.FACEBOOK_CATALOG_ID;
    const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!facebookAccessToken) {
      return fail("Facebook Access Token nu este configurat. Ai nevoie de un Access Token valid, nu doar App ID.");
    }

    return {
      success: true,
      message: "Facebook integration configured",
      config: {
        app_id_configured: !!facebookAppId,
        catalog_id_configured: !!facebookCatalogId,
        access_token_configured: !!facebookAccessToken,
      },
    };
  }

  return fail("Invalid action");
}

/* ==================================================================== */
/* Dispatcher                                                           */
/* ==================================================================== */

export const IMMOFLUX_HANDLERS = {
  "immoflux-integration": immofluxIntegration,
  "sync-immoflux": syncImmoflux,
  "immoflux-proxy": immofluxProxy,
  "import-complexes-excel": importComplexesExcel,
  "import-complexes-pdf": importComplexesPdf,
  "import-excel-apartments": importExcelApartments,
  "import-renew-apartments": importRenewApartments,
  "facebook-catalog-import": facebookCatalogImport,
} as const;

export type ImmofluxFunctionName = keyof typeof IMMOFLUX_HANDLERS;

export async function runImmofluxFunction(name: ImmofluxFunctionName, body: AnyRecord): Promise<Result> {
  const handler = IMMOFLUX_HANDLERS[name];
  if (!handler) return fail(`Unknown immoflux function: ${name}`);
  try {
    return await handler(body);
  } catch (e) {
    console.error(`[immoflux:${name}]`, e);
    return fail(e instanceof Error ? e.message : "Unknown error");
  }
}
