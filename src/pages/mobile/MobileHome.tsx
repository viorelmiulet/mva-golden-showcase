import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/mobile/MobileHeader";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import { MapPin, Home, Ruler, ArrowRight, Sparkles, Building2, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileHome = () => {
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites();
  const { language } = useLanguage();

  // Fetch featured properties
  const { data: featuredProperties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['mobile-featured-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('is_featured', true)
        .is('project_id', null)
        .limit(5)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch recent properties if no featured
  const { data: recentProperties = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['mobile-recent-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .limit(6)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: featuredProperties.length === 0
  });

  // Fetch complexes
  const { data: complexes = [], isLoading: loadingComplexes } = useQuery({
    queryKey: ['mobile-complexes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('is_recommended', true)
        .limit(4)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const properties = featuredProperties.length > 0 ? featuredProperties : recentProperties;
  const isLoading = loadingProperties || loadingRecent;

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - no header needed, full design */}
      <div className="px-4 pt-6 pb-4">
        {/* Logo and welcome */}
        <div className="flex items-center gap-3 mb-5">
          <img 
            src="/mva-logo-luxury.svg" 
            alt="MVA Imobiliare - Agenție imobiliară premium în București și Chiajna"
            title="MVA Imobiliare"
            className="h-10 w-10"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">MVA Imobiliare</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ro' ? 'Găsește-ți căminul ideal' : 'Find your ideal home'}
            </p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent rounded-2xl p-5 border border-gold/20 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium text-gold">
              {language === 'ro' ? 'Apartamente Premium' : 'Premium Apartments'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {language === 'ro' 
              ? 'Descoperă cele mai bune oferte imobiliare din București'
              : 'Discover the best real estate offers in Bucharest'}
          </p>
          <Link to="/app/cauta">
            <Button variant="luxury" className="w-full">
              {language === 'ro' ? 'Începe căutarea' : 'Start searching'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <Link to="/app/cauta?type=sale" className="flex flex-col items-center p-3 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-2">
              <Home className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-center">
              {language === 'ro' ? 'Vânzare' : 'For Sale'}
            </span>
          </Link>
          <Link to="/app/cauta?type=rent" className="flex flex-col items-center p-3 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-center">
              {language === 'ro' ? 'Chirie' : 'For Rent'}
            </span>
          </Link>
          <Link to="/app/complexe" className="flex flex-col items-center p-3 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-center">
              {language === 'ro' ? 'Complexe' : 'Complexes'}
            </span>
          </Link>
        </div>
      </div>
      {/* Featured Properties */}
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {language === 'ro' ? 'Proprietăți recomandate' : 'Recommended Properties'}
          </h2>
          <Link to="/app/cauta" className="text-sm text-gold font-medium flex items-center gap-1">
            {language === 'ro' ? 'Vezi toate' : 'View all'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
            ))
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{language === 'ro' ? 'Nicio proprietate disponibilă' : 'No properties available'}</p>
            </div>
          ) : (
            properties.slice(0, 4).map((property) => (
              <Link key={property.id} to={`/app/proprietate/${property.id}`}>
                <Card className="overflow-hidden hover:border-gold/30 transition-colors">
                  <CardContent className="p-0">
                      <div className="flex gap-3">
                      <div className="relative w-28 h-28 flex-shrink-0">
                        <OptimizedPropertyImage
                          src={property.images?.[0]}
                          alt={`${property.title} - apartament ${property.rooms || ''} camere${property.surface_min ? `, ${property.surface_min} mp` : ''} în ${property.location || 'București'}`}
                          title={property.title}
                          containerClassName="w-full h-full"
                          aspectRatio="auto"
                          quality={70}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(property.id, 'property');
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                        >
                          <Heart 
                            className={`w-4 h-4 ${isFavorite(property.id, 'property') ? 'fill-gold text-gold' : 'text-foreground'}`} 
                          />
                        </button>
                      </div>
                      <div className="py-3 pr-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">
                            {property.title}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.location || 'București'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gold font-bold text-sm">
                            {formatPrice(property.price_min || 0, property.currency || 'EUR')}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {property.rooms && (
                              <span className="flex items-center gap-0.5">
                                <Home className="w-3 h-3" />
                                {property.rooms}
                              </span>
                            )}
                            {property.surface_min && (
                              <span className="flex items-center gap-0.5">
                                <Ruler className="w-3 h-3" />
                                {property.surface_min}m²
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Complexes Section */}
      {complexes.length > 0 && (
        <section className="pb-6">
          <div className="flex items-center justify-between mb-3 px-4">
            <h2 className="text-lg font-semibold">
              {language === 'ro' ? 'Complexe rezidențiale' : 'Residential Complexes'}
            </h2>
            <Link to="/app/complexe" className="text-sm text-gold font-medium flex items-center gap-1">
              {language === 'ro' ? 'Vezi toate' : 'View all'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scrollbar-hide">
            {loadingComplexes ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 snap-start">
                  <Skeleton className="h-36 w-full rounded-xl" />
                </div>
              ))
            ) : (
              complexes.map((complex) => (
                <Link 
                  key={complex.id} 
                  to={`/app/complex/${complex.id}`}
                  className="flex-shrink-0 w-64 snap-start"
                >
                  <Card className="overflow-hidden h-36 relative">
                    <OptimizedPropertyImage
                      src={complex.main_image}
                      alt={`${complex.name} - complex rezidențial în ${complex.location || 'București'} cu apartamente moderne`}
                      title={complex.name}
                      containerClassName="w-full h-full"
                      aspectRatio="auto"
                      quality={70}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-sm mb-1">{complex.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {complex.location}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default MobileHome;
