import { useState, useEffect, useCallback } from 'react';

interface ViewedProperty {
  id: string;
  title: string;
  image: string | null;
  price: number;
  location: string;
  rooms: number;
  surface: number;
  viewedAt: number;
}

const STORAGE_KEY = 'mva_recently_viewed';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedProperty[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out items older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((item: ViewedProperty) => item.viewedAt > thirtyDaysAgo);
        setRecentlyViewed(filtered);
        
        // Update storage if items were filtered out
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  const addToRecentlyViewed = useCallback((property: {
    id: string;
    title: string;
    images?: string[] | null;
    price_min?: number;
    location?: string;
    rooms?: number;
    surface_min?: number;
  }) => {
    try {
      const newItem: ViewedProperty = {
        id: property.id,
        title: property.title,
        image: property.images?.[0] || null,
        price: property.price_min || 0,
        location: property.location || '',
        rooms: property.rooms || 0,
        surface: property.surface_min || 0,
        viewedAt: Date.now(),
      };

      setRecentlyViewed(prev => {
        // Remove if already exists
        const filtered = prev.filter(item => item.id !== property.id);
        // Add to beginning
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentlyViewed([]);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  }, []);

  const removeFromRecentlyViewed = useCallback((propertyId: string) => {
    try {
      setRecentlyViewed(prev => {
        const updated = prev.filter(item => item.id !== propertyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error removing from recently viewed:', error);
    }
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed,
  };
};
