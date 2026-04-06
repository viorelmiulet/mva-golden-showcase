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

interface ProjectData {
  id: string;
  name: string;
  location?: string;
  description?: string;
  main_image?: string;
  price_range?: string;
  surface_range?: string;
  rooms_range?: string;
  developer?: string;
  status?: string;
}

interface WebhookPayload {
  property?: PropertyData;
  project?: ProjectData;
  type: 'property' | 'project';
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
  // FACEBOOK REQUIRED FIELD - Use this for Facebook Pages "message"
  message: string;
  // Instagram-specific field - SHORT caption ready to use
  instagram_caption: string;
  // TikTok-specific field - SHORT caption ready to use
  tiktok_caption: string;
  // Google Business-specific field - Professional caption for GMB
  google_caption: string;
  // Media field for Instagram/TikTok/Google Business (required by Zapier)
  media: string;
  // Alternative media fields for different Zapier actions
  media_url: string;
  image_url: string;
  photo_url: string;
  // FACEBOOK PAGES REQUIRED FIELD - "Photo" (source)
  photo: string;
  // URL for Google Business "Learn More" button
  url: string;
  // ALL IMAGES - Array of all property images
  all_images: string[];
  images_count: number;
  // Individual image URLs for easy Zapier/Make access (up to 20 images)
  [key: `image_${number}`]: string | undefined;
  // INSTAGRAM CAROUSEL - Fields for multi-image carousel posts
  instagram_carousel: {
    enabled: boolean;
    images: string[];
    images_count: number;
    caption: string;
  };
  // Comma-separated image URLs for carousel (easier for some Zapier integrations)
  carousel_images_csv: string;
  // JSON string of carousel images for advanced Zapier use
  carousel_images_json: string;
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
    const { propertyId, projectId, action, platform, type } = body;
    console.log('social-auto-post: Action:', action, 'PropertyId:', propertyId, 'ProjectId:', projectId, 'Platform:', platform, 'Type:', type);

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

    // Determine if we're posting a property or a project
    const isProject = type === 'project' || projectId;
    
    let property: any = null;
    let project: any = null;

    if (isProject) {
      // Get project data
      const { data: projectData, error: projectError } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        console.error('Project not found:', projectError);
        return new Response(
          JSON.stringify({ success: false, error: 'Project not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      project = projectData;
    } else {
      // Get property data
      const { data: propertyData, error: propertyError } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError || !propertyData) {
        console.error('Property not found:', propertyError);
        return new Response(
          JSON.stringify({ success: false, error: 'Property not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      property = propertyData;
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
    
    // Get custom hashtags from settings or use default
    const customHashtags = webhooks.hashtags || '#imobiliare #apartament #bucuresti #MVAImobiliare #militariresidence #apartamentdevanzare #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #apartamentnoi';

    // Build rich property details with emoji icons
    const buildPropertyDetails = (prop: any): string => {
      const lines: string[] = [];
      
      // Price per sqm
      const pricePerSqm = (prop.price_min && prop.surface_min) 
        ? `(${(prop.price_min / prop.surface_min).toFixed(2).replace('.', ',')} EUR/mp)`
        : '';
      const price = prop.price_min 
        ? `${prop.price_min.toLocaleString('ro-RO')} ${prop.currency || 'EUR'} ${pricePerSqm}`
        : 'Preț la cerere';
      lines.push(`💰 ${price}`);
      
      // Main specs row
      if (prop.rooms) lines.push(`🛏 Camere: ${prop.rooms}`);
      if (prop.bathrooms) lines.push(`🚿 Băi: ${prop.bathrooms}`);
      if (prop.surface_min) lines.push(`📐 Suprafață utilă: ${prop.surface_min} mp`);
      if (prop.surface_max && prop.surface_max !== prop.surface_min) lines.push(`📏 Suprafață construită: ${prop.surface_max} mp`);
      
      // Building details
      if (prop.floor !== null && prop.floor !== undefined) lines.push(`🏢 Etaj: ${prop.floor}`);
      if (prop.total_floors) lines.push(`🔢 Nr. nivele: ${prop.total_floors}`);
      if (prop.balconies) lines.push(`🌅 Balcoane: ${prop.balconies}`);
      if (prop.year_built) lines.push(`📅 An construcție: ${prop.year_built}`);
      
      // Type & structure
      if (prop.compartment) lines.push(`🏠 Compartimentare: ${prop.compartment}`);
      if (prop.comfort) lines.push(`⭐ Confort: ${prop.comfort}`);
      if (prop.build_materials) lines.push(`🧱 Structură: ${prop.build_materials}`);
      if (prop.building_type) lines.push(`🏗 Tip locuință: ${prop.building_type}`);
      if (prop.property_subtype) lines.push(`🏘 Tip imobil: ${prop.property_subtype}`);
      
      // Utilities & features  
      if (prop.heating) lines.push(`🔥 Încălzire: ${prop.heating}`);
      if (prop.furnished) lines.push(`🪑 Mobilat: ${prop.furnished}`);
      if (prop.parking) lines.push(`🅿️ Parcare: ${prop.parking}`);
      
      // Location
      if (prop.zone) lines.push(`📍 Zonă: ${prop.zone}`);
      if (prop.city) lines.push(`🏙 Oraș: ${prop.city}`);
      if (prop.location) lines.push(`📌 Locație: ${prop.location}`);
      
      // Availability
      if (prop.availability_status) lines.push(`✅ Disponibilitate: ${prop.availability_status}`);
      if (prop.transaction_type) lines.push(`📋 Tip tranzacție: ${prop.transaction_type === 'sale' ? 'Vânzare' : prop.transaction_type === 'rent' ? 'Închiriere' : prop.transaction_type}`);
      
      // Amenities
      const amenities: string[] = [];
      if (prop.has_ac) amenities.push('Aer condiționat');
      if (prop.has_electricity) amenities.push('Curent');
      if (prop.has_water) amenities.push('Apă');
      if (prop.has_gas) amenities.push('Gaz');
      if (prop.has_internet) amenities.push('Internet');
      if (prop.has_tv) amenities.push('CATV');
      if (prop.has_security) amenities.push('Pază');
      if (amenities.length > 0) lines.push(`⚡ Utilități: ${amenities.join(' • ')}`);
      
      // Features array
      if (prop.features?.length) lines.push(`✨ Finisaje: ${prop.features.join(' • ')}`);
      
      return lines.join('\n');
    };

    // Generate content for properties
    const generatePropertyContent = (platform: string, prop: any): string => {
      const propertyUrl = `${siteUrl}/proprietati/${prop.slug || prop.id}`;
      const details = buildPropertyDetails(prop);

      return `🏠 ${prop.title}

${details}

📞 0767.941.512
🌐 mvaimobiliare.ro

👉 Detalii: ${propertyUrl}

${customHashtags}`;
    };

    // Generate content for projects/complexes
    const generateProjectContent = (platform: string, proj: any): string => {
      const location = proj.location || 'București';
      const projectUrl = `${siteUrl}/complexe/${proj.id}`;
      const priceRange = proj.price_range || 'Preț la cerere';
      const surfaceRange = proj.surface_range || '';
      const roomsRange = proj.rooms_range || '';
      
      // Project-specific hashtags
      const projectName = proj.name?.toLowerCase().replace(/\s+/g, '') || '';
      const projectHashtags = `#imobiliare #ansamblrezidential #bucuresti #MVAImobiliare #${projectName} #apartamentnoi #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #dezvoltatorimobiliar`;

      return `🏗️ ${proj.name}

📍 ${location}
💰 ${priceRange}
${surfaceRange ? `📐 ${surfaceRange}` : ''}
${roomsRange ? `🛏 ${roomsRange}` : ''}

${proj.description ? proj.description.substring(0, 200) + (proj.description.length > 200 ? '...' : '') : ''}

📞 0767.941.512
🌐 mvaimobiliare.ro

👉 Detalii: ${projectUrl}

${projectHashtags}`;
    };

    // Send to each configured webhook
    console.log('social-auto-post: Sending to webhooks...');
    
    // Filter by platform if specified
    const platformsToSend = platform && platform !== 'all' 
      ? [[platform, webhooks[platform]]] 
      : Object.entries(webhooks);
    
    for (const [platformName, webhookUrl] of platformsToSend) {
      if (platformName === 'enabled' || platformName === 'scheduled' || platformName === 'scheduleInterval' || 
          platformName === 'lastScheduledRun' || platformName === 'hashtags' || 
          !webhookUrl || typeof webhookUrl !== 'string') continue;

      console.log(`social-auto-post: Sending to ${platformName}: ${webhookUrl}`);
      
      let payload: WebhookPayload;
      
      if (isProject && project) {
        // Generate project payload
        const content = generateProjectContent(platformName, project);
        const projectUrl = `${siteUrl}/complexe/${project.id}`;
        
        // Convert relative image paths to absolute URLs
        let projectImage = project.main_image || '';
        if (projectImage && !projectImage.startsWith('http')) {
          projectImage = `${siteUrl}${projectImage.startsWith('/') ? '' : '/'}${projectImage}`;
        }
        console.log(`social-auto-post: Project image URL: ${projectImage}`);
        
        const projectName = project.name?.toLowerCase().replace(/\s+/g, '') || '';
        const projectHashtags = `#imobiliare #ansamblrezidential #bucuresti #MVAImobiliare #${projectName} #apartamentnoi #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #dezvoltatorimobiliar`;
        
        const projectCaption = content;

        // For Facebook: only single image and fixed location "Militari Residence"
        const facebookLocation = 'Militari Residence';
        
        payload = {
          type: 'project',
          project: {
            id: project.id,
            name: project.name,
            location: facebookLocation,
            description: project.description?.substring(0, 500) || '',
            main_image: projectImage,
            price_range: project.price_range,
            surface_range: project.surface_range,
            rooms_range: project.rooms_range,
            developer: project.developer,
            status: project.status,
          },
          platform: platformName,
          content: content.replace(project.location || 'București', facebookLocation),
          propertyUrl: projectUrl,
          imageUrl: projectImage,
          timestamp: new Date().toISOString(),
          // Easy access fields for Zapier
          title: project.name,
          description: project.description?.substring(0, 500) || '',
          location: facebookLocation,
          price: project.price_range || 'Preț la cerere',
          rooms: project.rooms_range || '',
          surface: project.surface_range || '',
          hashtags: projectHashtags,
          website: 'mvaimobiliare.ro',
          phone: '0767.941.512',
          message: content.replace(project.location || 'București', facebookLocation),
          instagram_caption: projectCaption.replace(project.location || 'București', facebookLocation),
          tiktok_caption: projectCaption.replace(project.location || 'București', facebookLocation),
          google_caption: content.replace(projectHashtags, '').replace(project.location || 'București', facebookLocation).trim(),
          // SINGLE IMAGE ONLY for Facebook
          media: projectImage,
          media_url: projectImage,
          image_url: projectImage,
          photo_url: projectImage,
          photo: projectImage,
          url: projectUrl,
          // Only single image
          all_images: projectImage ? [projectImage] : [],
          images_count: projectImage ? 1 : 0,
          image_1: projectImage || undefined,
          instagram_carousel: {
            enabled: false,
            images: projectImage ? [projectImage] : [],
            images_count: projectImage ? 1 : 0,
            caption: projectCaption.replace(project.location || 'București', facebookLocation),
          },
          carousel_images_csv: projectImage || '',
          carousel_images_json: JSON.stringify(projectImage ? [projectImage] : []),
        };
      } else {
        // Generate property payload with rich details
        const content = generatePropertyContent(platformName, property);
        const richDetails = buildPropertyDetails(property);
        
        const priceFormatted = property.price_min 
          ? `${property.price_min.toLocaleString('ro-RO')} ${property.currency || 'EUR'}`
          : 'Preț la cerere';
        
        const roomsFormatted = property.rooms ? `${property.rooms} ${property.rooms === 1 ? 'cameră' : 'camere'}` : '';
        const surfaceFormatted = property.surface_min ? `${property.surface_min} mp` : '';
        const locationFormatted = property.location || 'Militari Residence';
        const propertyUrl = `${siteUrl}/proprietati/${property.slug || property.id}`;
        
        const hashtags = customHashtags;

        // Rich description with all property details
        const richDescription = richDetails;

        const instagramCaption = `🏠 ${property.title}

${richDetails}

📞 0767.941.512
🌐 mvaimobiliare.ro

👉 Detalii: ${propertyUrl}

${hashtags}`;

        const tiktokCaption = instagramCaption;

        const googleCaption = `🏠 ${property.title}

${richDetails}

📞 0767.941.512
🌐 mvaimobiliare.ro

👉 Detalii: ${propertyUrl}`;

        // FIRST 5 IMAGES
        const allImages = (property.images || []).slice(0, 5);
        const firstImageUrl = allImages[0] || '';
        
        payload = {
          type: 'property',
          property: {
            id: property.id,
            title: property.title,
            location: locationFormatted,
            price_min: property.price_min,
            price_max: property.price_max,
            rooms: property.rooms,
            surface_min: property.surface_min,
            surface_max: property.surface_max,
            images: allImages,
            description: richDescription,
            currency: property.currency,
          },
          platform: platformName,
          content,
          propertyUrl,
          imageUrl: firstImageUrl,
          timestamp: new Date().toISOString(),
          title: property.title,
          description: richDescription,
          location: locationFormatted,
          price: priceFormatted,
          rooms: roomsFormatted,
          surface: surfaceFormatted,
          hashtags: hashtags,
          website: 'mvaimobiliare.ro',
          phone: '0767.941.512',
          message: content.replace(property.location || 'Militari Residence', locationFormatted),
          instagram_caption: instagramCaption,
          tiktok_caption: tiktokCaption,
          google_caption: googleCaption,
          // First image as primary
          media: firstImageUrl,
          media_url: firstImageUrl,
          image_url: firstImageUrl,
          photo_url: firstImageUrl,
          photo: firstImageUrl,
          url: propertyUrl,
          // All 5 images
          all_images: allImages,
          images_count: allImages.length,
          image_1: allImages[0] || undefined,
          image_2: allImages[1] || undefined,
          image_3: allImages[2] || undefined,
          image_4: allImages[3] || undefined,
          image_5: allImages[4] || undefined,
          instagram_carousel: {
            enabled: allImages.length > 1,
            images: allImages,
            images_count: allImages.length,
            caption: instagramCaption,
          },
          carousel_images_csv: allImages.join(','),
          carousel_images_json: JSON.stringify(allImages),
        };
      }

      console.log(`social-auto-post: Payload for ${platformName}:`, JSON.stringify(payload).substring(0, 500));

      try {
        const response = await fetch(webhookUrl as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        results[platformName] = response.ok;
        console.log(`social-auto-post: ${platformName} response: ${response.status} - ${responseText.substring(0, 200)}`);
      } catch (error) {
        console.error(`social-auto-post: ${platformName} error:`, error);
        results[platformName] = false;
      }
    }

    // Log the auto-post attempt
    await supabase.from('audit_logs').insert({
      action_type: 'social_auto_post',
      record_id: isProject ? projectId : propertyId,
      record_title: isProject ? project?.name : property?.title,
      metadata: { type: isProject ? 'project' : 'property', results, webhooks: Object.keys(webhooks) },
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
