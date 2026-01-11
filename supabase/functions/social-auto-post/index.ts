import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  id: string;
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
}

interface WebhookPayload {
  property: PropertyData;
  platform: string;
  content: string;
  propertyUrl: string;
  imageUrl?: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { propertyId, action } = await req.json();

    if (action === 'test') {
      // Test webhook connectivity
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'social_webhooks')
        .single();

      if (!settings?.value) {
        return new Response(
          JSON.stringify({ success: false, error: 'No webhooks configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Webhooks are configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get property data
    const { data: property, error: propertyError } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property not found:', propertyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Property not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'social_webhooks')
      .single();

    if (!settings?.value) {
      console.log('No webhooks configured, skipping auto-post');
      return new Response(
        JSON.stringify({ success: false, error: 'No webhooks configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhooks = JSON.parse(settings.value);
    const results: Record<string, boolean> = {};
    const siteUrl = Deno.env.get('SITE_URL') || 'https://mva-imobiliare.ro';

    // Generate content for each platform
    const generateContent = (platform: string, prop: PropertyData): string => {
      const price = prop.price_min 
        ? `${prop.price_min.toLocaleString('ro-RO')} ${prop.currency || 'EUR'}`
        : 'Preț la cerere';
      
      const surface = prop.surface_min 
        ? `${prop.surface_min} mp` 
        : '';
      
      const rooms = prop.rooms 
        ? `${prop.rooms} camere` 
        : '';

      const details = [rooms, surface].filter(Boolean).join(' • ');

      switch (platform) {
        case 'facebook':
          return `🏠 PROPRIETATE NOUĂ!\n\n${prop.title}\n📍 ${prop.location || 'București'}\n💰 ${price}\n${details ? `📐 ${details}\n` : ''}\n${prop.description?.substring(0, 200) || ''}\n\n👉 Detalii: ${siteUrl}/proprietati/${prop.id}\n\n#imobiliare #apartament #bucuresti #MVAImobiliare`;
        
        case 'instagram':
          return `🏠 PROPRIETATE NOUĂ!\n\n${prop.title}\n\n📍 ${prop.location || 'București'}\n💰 ${price}\n${details ? `📐 ${details}\n` : ''}\n\n${prop.description?.substring(0, 300) || ''}\n\n👉 Link in bio!\n\n#imobiliare #apartament #bucuresti #proprietate #investitie #acasa #realestate #MVAImobiliare #apartamentdevaznare #locuinta`;
        
        case 'linkedin':
          return `🏢 Nouă Oportunitate Imobiliară\n\n${prop.title}\n\n📍 Locație: ${prop.location || 'București'}\n💼 Preț: ${price}\n${details ? `📊 ${details}\n` : ''}\n\nContactați-ne pentru detalii și programarea unei vizionări.\n\n${siteUrl}/proprietati/${prop.id}\n\n#RealEstate #Investment #Property`;
        
        default:
          return `${prop.title} - ${price} - ${prop.location || 'București'}`;
      }
    };

    // Send to each configured webhook
    for (const [platform, webhookUrl] of Object.entries(webhooks)) {
      if (!webhookUrl || typeof webhookUrl !== 'string') continue;

      const content = generateContent(platform, property);
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
        },
        platform,
        content,
        propertyUrl: `${siteUrl}/proprietati/${property.id}`,
        imageUrl: property.images?.[0] || undefined,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        results[platform] = response.ok;
        console.log(`Webhook ${platform}: ${response.ok ? 'success' : 'failed'}`);
      } catch (error) {
        console.error(`Webhook ${platform} error:`, error);
        results[platform] = false;
      }
    }

    // Log the auto-post attempt
    await supabase.from('audit_logs').insert({
      action_type: 'social_auto_post',
      record_id: propertyId,
      record_title: property.title,
      metadata: { results, webhooks: Object.keys(webhooks) },
    });

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in social-auto-post:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
