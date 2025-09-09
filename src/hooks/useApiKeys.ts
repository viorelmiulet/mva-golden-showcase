import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
}

export interface CreateApiKeyData {
  key_name: string;
  description?: string;
  expires_at?: string;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-keys-manager', {
        body: { action: 'list' }
      });

      if (error) throw error;

      if (data?.success) {
        setApiKeys(data.data || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async (keyData: CreateApiKeyData): Promise<ApiKey | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-keys-manager', {
        body: {
          action: 'create',
          ...keyData
        }
      });

      if (error) throw error;

      if (data?.success) {
        const newKey = data.data;
        setApiKeys(prev => [newKey, ...prev]);
        return newKey;
      } else {
        throw new Error(data?.error || 'Failed to create API key');
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-keys-manager', {
        body: {
          action: 'toggle',
          id,
          is_active: isActive
        }
      });

      if (error) throw error;

      if (data?.success) {
        setApiKeys(prev => 
          prev.map(key => 
            key.id === id ? { ...key, is_active: isActive } : key
          )
        );
        return true;
      } else {
        throw new Error(data?.error || 'Failed to toggle API key');
      }
    } catch (err) {
      console.error('Error toggling API key:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-keys-manager', {
        body: {
          action: 'delete',
          id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setApiKeys(prev => prev.filter(key => key.id !== id));
        return true;
      } else {
        throw new Error(data?.error || 'Failed to delete API key');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    isLoading,
    error,
    fetchApiKeys,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
  };
};