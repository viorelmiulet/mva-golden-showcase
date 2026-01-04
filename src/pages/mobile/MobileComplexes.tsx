import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/mobile/MobileHeader";
import { MapPin, Heart, Building2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileComplexes = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language } = useLanguage();

  // Fetch all complexes with apartment count
  const { data: complexes = [], isLoading } = useQuery({
    queryKey: ['mobile-all-complexes-with-counts'],
    queryFn: async () => {
      // First get all projects
      const { data: projects, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .order('is_recommended', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!projects) return [];

      // Then get apartment counts for each
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const { count } = await supabase
            .from('catalog_offers')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('availability_status', 'available');
          
          return {
            ...project,
            available_apartments: count || 0
          };
        })
      );

      return projectsWithCounts;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={language === 'ro' ? 'Complexe rezidențiale' : 'Residential Complexes'} showBack />
      
      <div className="pt-14 px-4 pb-4">
        {/* Results count */}
        <div className="py-3">
          <p className="text-sm text-muted-foreground">
            {complexes.length} {language === 'ro' ? 'complexe disponibile' : 'complexes available'}
          </p>
        </div>

        {/* Complexes grid */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : complexes.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">
                {language === 'ro' ? 'Niciun complex disponibil' : 'No complexes available'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ro' 
                  ? 'Revino curând pentru noi oferte'
                  : 'Check back soon for new offers'}
              </p>
            </div>
          ) : (
            complexes.map((complex) => (
              <Link key={complex.id} to={`/app/complex/${complex.id}`}>
                <Card className="overflow-hidden hover:border-gold/30 transition-colors">
                  <div className="relative">
                    <img
                      src={complex.main_image || '/placeholder.svg'}
                      alt={`${complex.name} - complex rezidențial în ${complex.location || 'București'} cu ${complex.available_apartments || 0} apartamente disponibile`}
                      title={complex.name}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(complex.id, 'complex');
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                    >
                      <Heart 
                        className={`w-5 h-5 ${isFavorite(complex.id, 'complex') ? 'fill-gold text-gold' : 'text-foreground'}`} 
                      />
                    </button>
                    {complex.is_recommended && (
                      <Badge className="absolute top-3 left-3 bg-gold text-background">
                        {language === 'ro' ? 'Recomandat' : 'Recommended'}
                      </Badge>
                    )}
                    {complex.status && (
                      <Badge variant="secondary" className="absolute bottom-3 left-3">
                        {complex.status}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{complex.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4" />
                      {complex.location}
                    </p>
                    {complex.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {complex.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {complex.available_apartments > 0 && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          {complex.available_apartments} {language === 'ro' ? 'apt. disponibile' : 'available'}
                        </Badge>
                      )}
                      {complex.price_range && (
                        <Badge variant="outline" className="text-gold border-gold/30">
                          {complex.price_range}
                        </Badge>
                      )}
                      {complex.rooms_range && (
                        <Badge variant="outline">
                          {complex.rooms_range} {language === 'ro' ? 'camere' : 'rooms'}
                        </Badge>
                      )}
                      {complex.surface_range && (
                        <Badge variant="outline">
                          {complex.surface_range}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileComplexes;
