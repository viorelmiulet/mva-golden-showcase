import { useState, useEffect } from 'react';

export interface FavoriteApartment {
  id: string;
  title: string;
  price_min?: number;
  price_max?: number;
  surface_min?: number;
  surface_max?: number;
  rooms?: number;
  availability_status?: string;
  project_name?: string;
  project_id?: string;
  images?: string[];
  savedAt: string;
}

const FAVORITES_KEY = 'mva_favorite_apartments';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteApartment[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (apartment: Omit<FavoriteApartment, 'savedAt'>) => {
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(fav => fav.id === apartment.id)) {
        return prev;
      }
      return [...prev, { ...apartment, savedAt: new Date().toISOString() }];
    });
  };

  const removeFavorite = (apartmentId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== apartmentId));
  };

  const isFavorite = (apartmentId: string) => {
    return favorites.some(fav => fav.id === apartmentId);
  };

  const toggleFavorite = (apartment: Omit<FavoriteApartment, 'savedAt'>) => {
    if (isFavorite(apartment.id)) {
      removeFavorite(apartment.id);
    } else {
      addFavorite(apartment);
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
};
