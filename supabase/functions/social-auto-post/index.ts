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
  // Additional fields for easier Zapier integration
  title: string;
  description: string;
  location: string;
  price: string;
  rooms: string;
  surface: string;
  hashtags: string;
  website: string;
  phone: string;
}

serve(async (req) => {
  console.log('social-auto-post: Request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { propertyId, action } = body;
    console.log('social-auto-post: Action:', action, 'PropertyId:', propertyId);

    if (action === 'test') {
      // Test webhook connectivity by actually sending a test request
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'social_webhooks')
        .single();

      if (!settings?.value) {
        console.log('social-auto-post: No webhooks configured');
        return new Response(
          JSON.stringify({ success: false, error: 'No webhooks configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const webhooks = JSON.parse(settings.value);
      console.log('social-auto-post: Webhooks config:', JSON.stringify(webhooks));
      
      if (!webhooks.enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Auto-posting is disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const testResults: Record<string, { success: boolean; status?: number; error?: string }> = {};
      
      // Actually test each configured webhook
      for (const [platform, webhookUrl] of Object.entries(webhooks)) {
        if (platform === 'enabled' || !webhookUrl || typeof webhookUrl !== 'string') continue;
        
        console.log(`social-auto-post: Testing ${platform} webhook: ${webhookUrl}`);
        
        try {
          const testPayload = {
            test: true,
            platform,
            message: 'Test de conexiune de la MVA Imobiliare',
            timestamp: new Date().toISOString(),
            source: 'mva-imobiliare-test'
          };
          
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
          });
          
          testResults[platform] = { 
            success: response.ok, 
            status: response.status 
          };
          console.log(`social-auto-post: ${platform} test result: ${response.status}`);
        } catch (error) {
          console.error(`social-auto-post: ${platform} test error:`, error);
          testResults[platform] = { 
            success: false, 
            error: error.message 
          };
        }
      }

      const allSuccess = Object.values(testResults).every(r => r.success);
      const configuredPlatforms = Object.keys(testResults);
      
      return new Response(
        JSON.stringify({ 
          success: allSuccess || configuredPlatforms.length === 0, 
          message: configuredPlatforms.length > 0 
            ? `Testat: ${configuredPlatforms.join(', ')}` 
            : 'Niciun webhook configurat',
          results: testResults 
        }),
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
    const siteUrl = Deno.env.get('SITE_URL') || 'https://mvaimobiliare.ro';

    // Generate simple content for Zapier
    const generateContent = (platform: string, prop: PropertyData): string => {
      const hashtags = platform === 'instagram' 
        ? '#imobiliare #apartament #bucuresti #proprietate #investitie #acasa #realestate #MVAImobiliare #apartamentdevanzare #locuinta'
        : platform === 'facebook'
        ? '#imobiliare #apartament #bucuresti #MVAImobiliare'
        : '#RealEstate #Investment #Property';

      const price = prop.price_min 
        ? `${prop.price_min.toLocaleString('ro-RO')} ${prop.currency || 'EUR'}`
        : 'Preț la cerere';

      return `${prop.title}

💰 ${price}
📍 Militari Residence
📞 0767.941.512
🌐 mvaimobiliare.ro

${hashtags}`;
    };

    // Send to each configured webhook
    console.log('social-auto-post: Sending to webhooks...');
    
    for (const [platform, webhookUrl] of Object.entries(webhooks)) {
      if (platform === 'enabled' || !webhookUrl || typeof webhookUrl !== 'string') continue;

      console.log(`social-auto-post: Sending to ${platform}: ${webhookUrl}`);
      
      const content = generateContent(platform, property);
      
      // Format price for easy access
      const priceFormatted = property.price_min 
        ? `${property.price_min.toLocaleString('ro-RO')} ${property.currency || 'EUR'}`
        : 'Preț la cerere';
      
      // Format rooms and surface
      const roomsFormatted = property.rooms ? `${property.rooms} camere` : '';
      const surfaceFormatted = property.surface_min ? `${property.surface_min} mp` : '';
      
      // Generate hashtags based on platform
      const hashtags = platform === 'instagram' 
        ? '#imobiliare #apartament #bucuresti #proprietate #investitie #acasa #realestate #MVAImobiliare #apartamentdevanzare #locuinta'
        : platform === 'facebook'
        ? '#imobiliare #apartament #bucuresti #MVAImobiliare'
        : '#RealEstate #Investment #Property';

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
        // Easy access fields for Zapier
        title: property.title,
        description: property.description || '',
        location: property.location || 'București',
        price: priceFormatted,
        rooms: roomsFormatted,
        surface: surfaceFormatted,
        hashtags: hashtags,
        website: 'mvaimobiliare.ro',
        phone: '0767.941.512',
      };

      console.log(`social-auto-post: Payload for ${platform}:`, JSON.stringify(payload).substring(0, 500));

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        results[platform] = response.ok;
        console.log(`social-auto-post: ${platform} response: ${response.status} - ${responseText.substring(0, 200)}`);
      } catch (error) {
        console.error(`social-auto-post: ${platform} error:`, error);
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
