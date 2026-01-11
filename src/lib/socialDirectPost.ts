import { supabase } from "@/integrations/supabase/client";

interface PostContent {
  text: string;
  imageUrls?: string[];
  platform: string;
}

interface BulkPostContent {
  texts: Record<string, string>;
  imageUrls?: string[];
}

interface WebhookSettings {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  enabled: boolean;
}

export const postToSocialMedia = async (content: PostContent): Promise<boolean> => {
  try {
    // Get webhook settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'social_webhooks')
      .single();

    if (!settings?.value) {
      console.log('No social webhooks configured');
      return false;
    }

    const webhookSettings: WebhookSettings = JSON.parse(settings.value);
    
    if (!webhookSettings.enabled) {
      console.log('Social posting is disabled');
      return false;
    }

    // Get the webhook URL for the specific platform
    const webhookUrl = webhookSettings[content.platform as keyof WebhookSettings];
    
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      console.log(`No webhook configured for ${content.platform}`);
      return false;
    }

    // Send to webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify({
        message: content.text,
        text: content.text,
        images: content.imageUrls || [],
        platform: content.platform,
        timestamp: new Date().toISOString(),
        source: "marketing-ai",
        triggered_from: window.location.origin,
      }),
    });

    console.log(`Posted to ${content.platform} webhook`);
    return true;
  } catch (error) {
    console.error('Error posting to social media:', error);
    return false;
  }
};

export const postBulkToZapier = async (
  content: BulkPostContent, 
  onProgress?: (platform: string, index: number, total: number) => void
): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {};
  
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'social_webhooks')
      .single();

    if (!settings?.value) {
      console.log('No social webhooks configured');
      return results;
    }

    const webhookSettings: WebhookSettings = JSON.parse(settings.value);
    
    if (!webhookSettings.enabled) {
      console.log('Social posting is disabled');
      return results;
    }

    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter'] as const;
    const activePlatforms = platforms.filter(p => 
      webhookSettings[p] && content.texts[p]?.trim()
    );

    let index = 0;
    for (const platform of activePlatforms) {
      const webhookUrl = webhookSettings[platform];
      if (!webhookUrl) continue;

      try {
        onProgress?.(platform, index + 1, activePlatforms.length);
        
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            message: content.texts[platform],
            text: content.texts[platform],
            images: content.imageUrls || [],
            platform,
            timestamp: new Date().toISOString(),
            source: "marketing-ai-bulk",
            triggered_from: window.location.origin,
          }),
        });

        results[platform] = true;
        console.log(`Bulk posted to ${platform} webhook`);
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        results[platform] = false;
      }

      index++;
    }

    return results;
  } catch (error) {
    console.error('Error in bulk posting:', error);
    return results;
  }
};

export const getConfiguredPlatforms = async (): Promise<string[]> => {
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'social_webhooks')
      .single();

    if (!settings?.value) return [];

    const webhookSettings: WebhookSettings = JSON.parse(settings.value);
    
    if (!webhookSettings.enabled) return [];

    const platforms: string[] = [];
    if (webhookSettings.facebook) platforms.push('facebook');
    if (webhookSettings.instagram) platforms.push('instagram');
    if (webhookSettings.linkedin) platforms.push('linkedin');
    if (webhookSettings.twitter) platforms.push('twitter');

    return platforms;
  } catch (error) {
    console.error('Error getting configured platforms:', error);
    return [];
  }
};
