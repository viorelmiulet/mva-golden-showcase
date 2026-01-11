import { supabase } from "@/integrations/supabase/client";

export const triggerSocialAutoPost = async (propertyId: string): Promise<boolean> => {
  try {
    // Check if auto-posting is enabled
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'social_webhooks')
      .single();

    if (!settings?.value) {
      console.log('No social webhooks configured');
      return false;
    }

    const webhookSettings = JSON.parse(settings.value);
    
    if (!webhookSettings.enabled) {
      console.log('Social auto-posting is disabled');
      return false;
    }

    // Trigger the edge function
    const { data, error } = await supabase.functions.invoke('social-auto-post', {
      body: { propertyId }
    });

    if (error) {
      console.error('Error triggering social auto-post:', error);
      return false;
    }

    console.log('Social auto-post result:', data);
    return data?.success || false;
  } catch (error) {
    console.error('Error in triggerSocialAutoPost:', error);
    return false;
  }
};
