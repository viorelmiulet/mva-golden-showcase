import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FavoriteItem = {
  id: string;
  item_id: string;
  item_type: 'property' | 'complex';
  created_at: string;
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      if (session?.user?.id) {
        fetchFavorites(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      if (session?.user?.id) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites((data || []) as FavoriteItem[]);
    }
    setIsLoading(false);
  };

  const addFavorite = async (itemId: string, itemType: 'property' | 'complex') => {
    if (!userId) {
      toast.error("Trebuie să fii autentificat pentru a salva la favorite");
      return false;
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        item_id: itemId,
        item_type: itemType
      });

    if (error) {
      if (error.code === '23505') {
        toast.info("Deja la favorite");
      } else {
        toast.error("Eroare la salvare");
        console.error('Error adding favorite:', error);
      }
      return false;
    }

    toast.success(itemType === 'property' ? "Apartament salvat la favorite" : "Complex salvat la favorite");
    fetchFavorites(userId);
    return true;
  };

  const removeFavorite = async (itemId: string, itemType: 'property' | 'complex') => {
    if (!userId) return false;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType);

    if (error) {
      toast.error("Eroare la ștergere");
      console.error('Error removing favorite:', error);
      return false;
    }

    toast.success("Eliminat din favorite");
    fetchFavorites(userId);
    return true;
  };

  const isFavorite = (itemId: string, itemType: 'property' | 'complex') => {
    return favorites.some(f => f.item_id === itemId && f.item_type === itemType);
  };

  const toggleFavorite = async (itemId: string, itemType: 'property' | 'complex') => {
    if (isFavorite(itemId, itemType)) {
      return removeFavorite(itemId, itemType);
    } else {
      return addFavorite(itemId, itemType);
    }
  };

  return {
    favorites,
    isLoading,
    isAuthenticated: !!userId,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: () => userId && fetchFavorites(userId)
  };
};