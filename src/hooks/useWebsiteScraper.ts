import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
      let dataResp: any;
      try {
        const { data, error } = await supabase.functions.invoke('immoflux-integration', {
          body: {
            action: 'analyze_xml',
            xml_url: xmlUrl
          }
        });
        if (error) throw error;
        dataResp = data;
      } catch (primaryErr) {
        console.warn('Primary analyze_xml invoke failed, trying direct fetch fallback...', primaryErr);
        const res = await fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/immoflux-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2JxZXljdmlxY2t6anlva3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDk1NjgsImV4cCI6MjA3MTk4NTU2OH0.FcSHvGjPEkUVKtPvjQqlwErNdizEPX2YeBFc20O4dnE',
          },
          body: JSON.stringify({ action: 'analyze_xml', xml_url: xmlUrl }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        dataResp = JSON.parse(text);
      }

      if (dataResp?.success) {
        return dataResp;
      } else {
        throw new Error(dataResp?.error || 'XML analysis failed');
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
      let dataResp: any;
      try {
        const { data, error } = await supabase.functions.invoke('immoflux-integration', {
          body: {
            action: 'import_xml_feed',
            xml_url: xmlUrl
          }
        });
        if (error) throw error;
        dataResp = data;
      } catch (primaryErr) {
        console.warn('Primary import_xml_feed invoke failed, trying direct fetch fallback...', primaryErr);
        const res = await fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/immoflux-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2JxZXljdmlxY2t6anlva3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDk1NjgsImV4cCI6MjA3MTk4NTU2OH0.FcSHvGjPEkUVKtPvjQqlwErNdizEPX2YeBFc20O4dnE',
          },
          body: JSON.stringify({ action: 'import_xml_feed', xml_url: xmlUrl }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        dataResp = JSON.parse(text);
      }

      if (dataResp?.success) {
        toast({
          title: "XML Import Successful",
          description: dataResp.message,
        });
        return dataResp;
      } else {
        throw new Error(dataResp?.error || 'XML import failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'XML import failed';
      console.error('Error importing XML:', err);
      setError(errorMessage);
      
      toast({
        title: "XML Import Failed",
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
    analyzeXmlStructure,
    isLoading,
    error,
  };
};