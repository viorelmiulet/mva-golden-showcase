import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { triggerSocialAutoPost } from '@/lib/socialAutoPost';

export interface ScrapeResult {
  success: boolean;
  message: string;
  scraped: number;
  properties?: any[];
  error?: string;
}

export const useWebsiteScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scrapeWebsite = async (url: string): Promise<ScrapeResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting website scraping for:', url);
      
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'scrape_website',
          url: url
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to invoke scraping function');
      }

      if (data?.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        return data;
      } else {
        throw new Error(data?.error || 'Scraping failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error scraping website:', err);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testImmofluxConnection = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'test_connection'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Connection Test Successful",
          description: data.message,
        });
        return true;
      } else {
        throw new Error(data?.error || 'Connection test failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      console.error('Error testing connection:', err);
      setError(errorMessage);
      
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const syncImmofluxProperties = async (): Promise<ScrapeResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'sync_properties'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sync Successful",
          description: data.message,
        });
        return data;
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      console.error('Error syncing properties:', err);
      setError(errorMessage);
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeXmlStructure = async (xmlUrl: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'analyze_xml',
          xml_url: xmlUrl
        }
      });

      if (error) throw error;

      if (data?.success) {
        return data;
      } else {
        throw new Error(data?.error || 'XML analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'XML analysis failed';
      console.error('Error analyzing XML:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const importXmlFeed = async (xmlUrl: string): Promise<ScrapeResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'import_xml_feed',
          xml_url: xmlUrl
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Import XML Reușit",
          description: data.message,
        });
        
        // Trigger social auto-post for imported properties
        if (data.properties && Array.isArray(data.properties)) {
          for (const property of data.properties) {
            if (property.id) {
              await triggerSocialAutoPost(property.id);
            }
          }
        }
        
        return data;
      } else {
        throw new Error(data?.error || 'Import XML eșuat');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import XML eșuat';
      console.error('Error importing XML:', err);
      setError(errorMessage);
      
      toast({
        title: "Import XML Eșuat",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const importXmlWithMapping = async (xmlUrl: string, fieldMapping: Record<string, string>): Promise<ScrapeResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('immoflux-integration', {
        body: {
          action: 'import_xml_with_mapping',
          xml_url: xmlUrl,
          field_mapping: fieldMapping
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Import XML cu Mapare Reușit",
          description: data.message,
        });
        
        // Trigger social auto-post for imported properties
        if (data.properties && Array.isArray(data.properties)) {
          for (const property of data.properties) {
            if (property.id) {
              await triggerSocialAutoPost(property.id);
            }
          }
        }
        
        return data;
      } else {
        throw new Error(data?.error || 'Import XML cu mapare eșuat');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import XML cu mapare eșuat';
      console.error('Error importing XML with mapping:', err);
      setError(errorMessage);
      
      toast({
        title: "Import XML Eșuat",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scrapeWebsite,
    testImmofluxConnection,
    syncImmofluxProperties,
    importXmlFeed,
    importXmlWithMapping,
    analyzeXmlStructure,
    isLoading,
    error,
  };
};