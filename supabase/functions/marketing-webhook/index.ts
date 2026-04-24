import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MarketingPayload {
  title: string;
  description: string;
  images: string[];
  price?: string;
  location?: string;
  features?: string[];
  hashtags?: string;
  platform?: string; // 'facebook' | 'instagram' | 'all'
  property_url?: string;
  contact_phone?: string;
  contact_email?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: MarketingPayload = await req.json();
    
    console.log('Received marketing payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate formatted content for different platforms
    const defaultHashtags = payload.hashtags || '#imobiliare #apartament #bucuresti #MVAImobiliare #militariresidence #apartamentdevanzare #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #apartamentnoi';
    
    // Build features text
    const featuresText = payload.features?.length 
      ? `\n✨ ${payload.features.join(' • ')}`
      : '';

    // Facebook/Instagram formatted post
    const socialMediaPost = `🏠 ${payload.title}

${payload.description || ''}
${featuresText}
${payload.price ? `\n💰 Preț: ${payload.price}` : ''}
${payload.location ? `\n📍 Locație: ${payload.location}` : ''}
${payload.property_url ? `\n👉 Detalii: ${payload.property_url}` : ''}
${payload.contact_phone ? `\n📞 Contact: ${payload.contact_phone}` : ''}

${defaultHashtags}`;

    // Short version for platforms with character limits
    const shortPost = `🏠 ${payload.title}
${payload.price ? `💰 ${payload.price}` : ''}
${payload.location ? `📍 ${payload.location}` : ''}
${payload.property_url ? `👉 ${payload.property_url}` : ''}`;

    // Response formatted for Zapier
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        // Original data
        title: payload.title,
        description: payload.description || '',
        images: payload.images || [],
        primary_image: payload.images?.[0] || null,
        price: payload.price || null,
        location: payload.location || null,
        features: payload.features || [],
        property_url: payload.property_url || null,
        contact_phone: payload.contact_phone || null,
        contact_email: payload.contact_email || null,
        
        // Formatted content for social media
        facebook_post: socialMediaPost,
        instagram_caption: socialMediaPost,
        twitter_post: shortPost,
        
        // Individual components for flexible use
        hashtags: defaultHashtags,
        emoji_title: `🏠 ${payload.title}`,
        formatted_price: payload.price ? `💰 Preț: ${payload.price}` : '',
        formatted_location: payload.location ? `📍 Locație: ${payload.location}` : '',
        
        // Image URLs for Zapier
        image_1: payload.images?.[0] || null,
        image_2: payload.images?.[1] || null,
        image_3: payload.images?.[2] || null,
        image_4: payload.images?.[3] || null,
        image_count: payload.images?.length || 0,
      }
    };

    console.log('Sending response to Zapier:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing marketing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
