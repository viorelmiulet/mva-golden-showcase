export const scheduledSocialPostCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyData {
  id: string;
  slug?: string | null;
  title: string;
  location?: string;
  price_min?: number;
  price_max?: number;
  rooms?: number;
  surface_min?: number;
  surface_max?: number;
  images?: string[];
  description?: string;
  currency?: string;
  created_at: string;
}

interface WebhookPayload {
  property: PropertyData;
  platform: string;
  content: string;
  propertyUrl: string;
  imageUrl?: string;
  timestamp: string;
}

export async function handleScheduledSocialPost(): Promise<Response> {
  const corsHeaders = scheduledSocialPostCorsHeaders;
  console.log("scheduled-social-post: Request received");

  try {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");

    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_webhooks")
      .single();

    if (!settingsData?.value) {
      console.log("scheduled-social-post: No webhooks configured");
      return new Response(
        JSON.stringify({ success: false, error: "No webhooks configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const settings = JSON.parse(settingsData.value);

    if (!settings.enabled || !settings.scheduled) {
      console.log("scheduled-social-post: Scheduled posting is disabled");
      return new Response(
        JSON.stringify({ success: false, error: "Scheduled posting is disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lastRun = settings.lastScheduledRun
      ? new Date(settings.lastScheduledRun)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log("scheduled-social-post: Last run:", lastRun.toISOString());

    const { data: properties, error: propertiesError } = await supabase
      .from("catalog_offers")
      .select("*")
      .gt("created_at", lastRun.toISOString())
      .is("project_id", null)
      .order("created_at", { ascending: true });

    if (propertiesError) {
      console.error("scheduled-social-post: Error fetching properties:", propertiesError);
      throw propertiesError;
    }

    if (!properties || properties.length === 0) {
      console.log("scheduled-social-post: No new properties to post");

      settings.lastScheduledRun = new Date().toISOString();
      await supabase
        .from("site_settings")
        .update({ value: JSON.stringify(settings), updated_at: new Date().toISOString() })
        .eq("key", "social_webhooks");

      return new Response(
        JSON.stringify({ success: true, message: "No new properties to post", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`scheduled-social-post: Found ${properties.length} new properties`);

    const siteUrl = process.env.SITE_URL || "https://www.mvaimobiliare.ro";
    let totalPosted = 0;
    const allResults: Record<string, any>[] = [];

    const generateContent = (platform: string, prop: PropertyData): string => {
      const price = prop.price_min
        ? `${prop.price_min.toLocaleString("ro-RO")} ${prop.currency || "EUR"}`
        : "Preț la cerere";

      const surface = prop.surface_min ? `${prop.surface_min} mp` : "";
      const rooms = prop.rooms ? `${prop.rooms} camere` : "";
      const details = [rooms, surface].filter(Boolean).join(" • ");

      switch (platform) {
        case "facebook":
          return `${prop.title}\n📍 ${prop.location || "București"}\n💰 ${price}\n${details ? `📐 ${details}\n` : ""}\n${prop.description?.substring(0, 200) || ""}\n\n👉 Detalii: ${siteUrl}/proprietati/${prop.slug || prop.id}\n\n#imobiliare #apartament #bucuresti #MVAImobiliare`;

        case "instagram":
          return `${prop.title}\n\n📍 ${prop.location || "București"}\n💰 ${price}\n${details ? `📐 ${details}\n` : ""}\n\n${prop.description?.substring(0, 300) || ""}\n\n👉 Link in bio!\n\n#imobiliare #apartament #bucuresti #proprietate #investitie #acasa #realestate #MVAImobiliare #apartamentdevaznare #locuinta`;

        case "linkedin":
          return `${prop.title}\n\n📍 Locație: ${prop.location || "București"}\n💼 Preț: ${price}\n${details ? `📊 ${details}\n` : ""}\n\nContactați-ne pentru detalii și programarea unei vizionări.\n\n${siteUrl}/proprietati/${prop.slug || prop.id}\n\n#RealEstate #Investment #Property`;

        default:
          return `${prop.title} - ${price} - ${prop.location || "București"}`;
      }
    };

    for (const property of properties) {
      const results: Record<string, boolean> = {};

      for (const [platform, webhookUrl] of Object.entries(settings)) {
        if (
          platform === "enabled" ||
          platform === "scheduled" ||
          platform === "scheduleInterval" ||
          platform === "lastScheduledRun" ||
          !webhookUrl ||
          typeof webhookUrl !== "string"
        )
          continue;

        console.log(`scheduled-social-post: Sending ${property.title} to ${platform}`);

        const content = generateContent(platform, property as any);
        const payload: WebhookPayload = {
          property: {
            id: property.id,
            title: property.title,
            location: property.location,
            price_min: property.price_min,
            price_max: property.price_max,
            rooms: property.rooms,
            surface_min: property.surface_min,
            surface_max: property.surface_max,
            images: property.images,
            description: property.description,
            currency: property.currency,
            created_at: property.created_at,
          } as PropertyData,
          platform,
          content,
          propertyUrl: `${siteUrl}/proprietati/${property.slug || property.id}`,
          imageUrl: property.images?.[0] || undefined,
          timestamp: new Date().toISOString(),
        };

        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          results[platform] = response.ok;
          console.log(`scheduled-social-post: ${platform} response: ${response.status}`);
        } catch (error) {
          console.error(`scheduled-social-post: ${platform} error:`, error);
          results[platform] = false;
        }
      }

      await supabase.from("audit_logs").insert({
        action_type: "social_auto_post",
        record_id: property.id,
        record_title: property.title,
        metadata: { results, source: "scheduled", webhooks: Object.keys(results) },
      });

      allResults.push({ propertyId: property.id, title: property.title, results });
      totalPosted++;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    settings.lastScheduledRun = new Date().toISOString();
    await supabase
      .from("site_settings")
      .update({ value: JSON.stringify(settings), updated_at: new Date().toISOString() })
      .eq("key", "social_webhooks");

    console.log(`scheduled-social-post: Completed. Posted ${totalPosted} properties`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Posted ${totalPosted} properties`,
        count: totalPosted,
        results: allResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in scheduled-social-post:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
}
