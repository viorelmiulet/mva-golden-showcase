import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Heart, MapPin, Home, Ruler, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileFavorites = () => {
  const { favorites, isLoading: loadingFavorites, removeFavorite, isAuthenticated } = useFavorites();
  const { language } = useLanguage();

  // Fetch property details for favorites
  const propertyIds = favorites.filter(f => f.item_type === 'property').map(f => f.item_id);
  const complexIds = favorites.filter(f => f.item_type === 'complex').map(f => f.item_id);

  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['favorite-properties', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .in('id', propertyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: propertyIds.length > 0
  });

  const { data: complexes = [], isLoading: loadingComplexes } = useQuery({
    queryKey: ['favorite-complexes', complexIds],
    queryFn: async () => {
      if (complexIds.length === 0) return [];
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .in('id', complexIds);
      if (error) throw error;
      return data || [];
    },
    enabled: complexIds.length > 0
  });

  const isLoading = loadingFavorites || loadingProperties || loadingComplexes;

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title={language === 'ro' ? 'Favorite' : 'Favorites'} showBack />
        <div className="pt-14 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ro' ? 'Autentifică-te pentru favorite' : 'Sign in for favorites'}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {language === 'ro' 
              ? 'Salvează proprietățile preferate și accesează-le de pe orice dispozitiv'
              : 'Save your favorite properties and access them from any device'}
          </p>
          <Link to="/app/cont">
            <Button variant="luxury">
              {language === 'ro' ? 'Autentificare' : 'Sign in'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={language === 'ro' ? 'Favorite' : 'Favorites'} showBack />
      
      <div className="pt-14 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <Skeleton className="w-28 h-28 flex-shrink-0" />
                    <div className="py-3 pr-3 flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-5 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ro' ? 'Nicio proprietate salvată' : 'No saved properties'}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {language === 'ro' 
                ? 'Adaugă proprietăți la favorite pentru a le accesa rapid'
                : 'Add properties to favorites for quick access'}
            </p>
            <Link to="/app/cauta">
              <Button variant="luxury">
                {language === 'ro' ? 'Explorează proprietăți' : 'Explore properties'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Properties */}
            {properties.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ro' ? 'Proprietăți' : 'Properties'} ({properties.length})
                </h2>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex gap-3">
                          <Link to={`/app/proprietate/${property.id}`} className="w-28 h-28 flex-shrink-0">
                            <img
                              src={property.images?.[0] || '/placeholder.svg'}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div className="py-3 pr-3 flex-1 flex flex-col justify-between">
                            <div>
                              <Link to={`/app/proprietate/${property.id}`}>
                                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                  {property.title}
                                </h3>
                              </Link>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.location || 'București'}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gold font-bold text-sm">
                                {formatPrice(property.price_min || 0, property.currency || 'EUR')}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeFavorite(property.id, 'property')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Complexes */}
            {complexes.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ro' ? 'Complexe' : 'Complexes'} ({complexes.length})
                </h2>
                <div className="space-y-3">
                  {complexes.map((complex) => (
                    <Card key={complex.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex gap-3">
                          <Link to={`/app/complex/${complex.id}`} className="w-28 h-28 flex-shrink-0">
                            <img
                              src={complex.main_image || '/placeholder.svg'}
                              alt={complex.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div className="py-3 pr-3 flex-1 flex flex-col justify-between">
                            <div>
                              <Link to={`/app/complex/${complex.id}`}>
                                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                  {complex.name}
                                </h3>
                              </Link>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {complex.location}
                              </p>
                            </div>
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeFavorite(complex.id, 'complex')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFavorites;
