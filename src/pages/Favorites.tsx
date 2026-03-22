import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { getPropertyUrl } from "@/lib/propertySlug";
import { getComplexUrl } from "@/lib/complexSlug";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Building2, 
  Home, 
  MapPin, 
  Euro, 
  Trash2,
  ArrowRight
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { FavoritesPageSkeleton } from "@/components/skeletons";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isLoading: favLoading, isAuthenticated, removeFavorite } = useFavorites();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const propertyIds = favorites.filter(f => f.item_type === 'property').map(f => f.item_id);
  const complexIds = favorites.filter(f => f.item_type === 'complex').map(f => f.item_id);

  const { data: properties } = useQuery({
    queryKey: ['favorite-properties', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .in('id', propertyIds);
      if (error) throw error;
      return data;
    },
    enabled: propertyIds.length > 0
  });

  const { data: complexes } = useQuery({
    queryKey: ['favorite-complexes', complexIds],
    queryFn: async () => {
      if (complexIds.length === 0) return [];
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .in('id', complexIds);
      if (error) throw error;
      return data;
    },
    enabled: complexIds.length > 0
  });

  if (isCheckingAuth || favLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
          <FavoritesPageSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Favorite | MVA Imobiliare</title>
        <meta name="description" content="Proprietățile și complexele tale favorite salvate." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://mvaimobiliare.ro/favorite" />
        
        <meta property="og:title" content="Favorite | MVA Imobiliare" />
        <meta property="og:description" content="Proprietățile și complexele tale favorite salvate." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/favorite" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Favorite | MVA Imobiliare" />
        <meta name="twitter:description" content="Proprietățile și complexele tale favorite salvate." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2">Favoritele Mele</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? 'element salvat' : 'elemente salvate'}
            </p>
          </div>

          {favorites.length === 0 ? (
            <Card className="p-6 sm:p-8 md:p-12 text-center">
              <Heart className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">Nu ai favorite încă</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                Explorează proprietățile și complexele noastre și salvează-le pentru mai târziu.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                <Link to="/proprietati">
                  <Button className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                    <Home className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Vezi Proprietăți
                  </Button>
                </Link>
                <Link to="/complexe">
                  <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                    <Building2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Vezi Complexe
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto grid grid-cols-3 sm:flex h-auto">
                <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5">
                  Toate ({favorites.length})
                </TabsTrigger>
                <TabsTrigger value="properties" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5">
                  Apartamente ({propertyIds.length})
                </TabsTrigger>
                <TabsTrigger value="complexes" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5">
                  Complexe ({complexIds.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {complexes && complexes.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Complexe Rezidențiale
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {complexes.map((complex) => (
                        <ComplexCard 
                          key={complex.id} 
                          complex={complex} 
                          onRemove={() => removeFavorite(complex.id, 'complex')}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {properties && properties.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Apartamente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {properties.map((property) => (
                        <PropertyCard 
                          key={property.id} 
                          property={property} 
                          onRemove={() => removeFavorite(property.id, 'property')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="properties">
                {properties && properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                      <PropertyCard 
                        key={property.id} 
                        property={property} 
                        onRemove={() => removeFavorite(property.id, 'property')}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Nu ai apartamente salvate</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="complexes">
                {complexes && complexes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {complexes.map((complex) => (
                      <ComplexCard 
                        key={complex.id} 
                        complex={complex} 
                        onRemove={() => removeFavorite(complex.id, 'complex')}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Nu ai complexe salvate</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

const PropertyCard = ({ property, onRemove }: { property: any; onRemove: () => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{property.title}</h3>
          {property.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property.location}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
          aria-label="Elimină din favorite"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        {property.rooms && (
          <Badge variant="secondary">{property.rooms} camere</Badge>
        )}
        {property.surface_min && (
          <Badge variant="outline">{property.surface_min} mp</Badge>
        )}
      </div>
      
      {property.price_min && (
        <div className="flex items-center gap-1 text-primary font-bold">
          <Euro className="h-4 w-4" />
          {property.price_min.toLocaleString()}
        </div>
      )}
      
      <Link to={getPropertyUrl(property)}>
        <Button variant="outline" size="sm" className="w-full">
          Vezi Detalii
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const ComplexCard = ({ complex, onRemove }: { complex: any; onRemove: () => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    {complex.main_image && (
      <img 
        src={complex.main_image} 
        alt={complex.name}
        className="w-full h-40 object-cover"
        loading="lazy"
      />
    )}
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{complex.name}</h3>
          {complex.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {complex.location}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
          aria-label="Elimină din favorite"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {complex.status && (
          <Badge variant="secondary">{complex.status}</Badge>
        )}
        {complex.price_range && (
          <Badge variant="outline">{complex.price_range}</Badge>
        )}
      </div>
      
      <Link to={getComplexUrl(complex)}>
        <Button variant="outline" size="sm" className="w-full">
          Vezi Complex
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

export default Favorites;