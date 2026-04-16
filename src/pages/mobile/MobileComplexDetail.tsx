import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/mobile/MobileHeader";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import { 
  MapPin, 
  Home, 
  Ruler, 
  Heart, 
  Share2, 
  Phone, 
  Check,
  ChevronRight,
  Building2
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageLightbox } from "@/components/ImageLightbox";

const MobileComplexDetail = () => {
  const { id } = useParams();
  
  const { language } = useLanguage();
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: complex, isLoading } = useQuery({
    queryKey: ['mobile-complex', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch apartments in this complex - no limit to get all
  const { data: apartments = [], isLoading: isLoadingApartments } = useQuery({
    queryKey: ['mobile-complex-apartments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('project_id', id)
        .eq('availability_status', 'available')
        .order('rooms', { ascending: true })
        .order('price_min', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: complex?.name,
          text: complex?.description || complex?.name,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bună ziua! Sunt interesat de complexul: ${complex?.name}\n${window.location.href}`
  );

  const formatPrice = (price: number, currency: string = 'EUR') => {
    const validCurrency = currency === 'LEI' ? 'RON' : (currency || 'EUR');
    try {
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: validCurrency,
        maximumFractionDigits: 0
      }).format(price);
    } catch {
      return `€${price.toLocaleString('de-DE')}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader showBack />
        <div className="pt-14">
          <Skeleton className="w-full h-56" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader showBack />
        <div className="pt-14 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ro' ? 'Complex negăsit' : 'Complex not found'}
          </h2>
          <Link to="/app/complexe">
            <Button variant="luxury">
              {language === 'ro' ? 'Înapoi la complexe' : 'Back to complexes'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader 
        showBack 
        rightAction={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleShare}
              aria-label="Distribuie"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        }
      />
      
      {/* Hero image */}
      <div className="pt-14">
        <div className="relative h-56">
          <OptimizedPropertyImage
            src={complex.main_image}
            alt={`${complex.name} - complex rezidențial în ${complex.location || 'București'} cu apartamente moderne și facilități premium`}
            title={complex.name}
            containerClassName="w-full h-full"
            aspectRatio="auto"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-2">
              {complex.is_recommended && (
                <Badge className="bg-gold text-background">
                  {language === 'ro' ? 'Recomandat' : 'Recommended'}
                </Badge>
              )}
              {complex.status && (
                <Badge variant="secondary">{complex.status}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{complex.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {complex.location}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2">
          {complex.price_range && (
            <Badge variant="outline" className="text-gold border-gold/30 py-1.5 px-3">
              {complex.price_range}
            </Badge>
          )}
          {complex.rooms_range && (
            <Badge variant="outline" className="py-1.5 px-3">
              {complex.rooms_range} {language === 'ro' ? 'camere' : 'rooms'}
            </Badge>
          )}
          {complex.surface_range && (
            <Badge variant="outline" className="py-1.5 px-3">
              {complex.surface_range}
            </Badge>
          )}
        </div>

        {/* Description */}
        {complex.description && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">
                {language === 'ro' ? 'Despre complex' : 'About'}
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {complex.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {complex.features && complex.features.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">
                {language === 'ro' ? 'Dotări' : 'Features'}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {complex.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location advantages */}
        {complex.location_advantages && complex.location_advantages.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">
                {language === 'ro' ? 'Avantaje locație' : 'Location Advantages'}
              </h2>
              <div className="space-y-2">
                {complex.location_advantages.map((advantage: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{advantage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available apartments */}
        <div>
          <h2 className="font-semibold mb-3">
            {language === 'ro' ? 'Apartamente disponibile' : 'Available Apartments'} 
            {!isLoadingApartments && ` (${apartments.length})`}
          </h2>
          
          {isLoadingApartments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : apartments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ro' 
                    ? 'Nu există apartamente disponibile momentan' 
                    : 'No apartments available at the moment'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apartments.map((apt) => (
                <div key={apt.id} className="space-y-1">
                  <Link to={`/app/proprietate/${apt.id}`}>
                    <Card className="hover:border-gold/30 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {apt.images && apt.images.length > 0 ? (
                              <OptimizedPropertyImage
                                src={apt.images[0]}
                                alt=""
                                containerClassName="w-12 h-12 rounded-lg"
                                aspectRatio="auto"
                                quality={60}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                                <Home className="w-6 h-6 text-gold" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {apt.title || `${apt.rooms} ${language === 'ro' ? 'camere' : 'rooms'}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.rooms} {language === 'ro' ? 'cam' : 'rooms'}
                                {apt.surface_min && ` • ${apt.surface_min}m²`}
                              </p>
                              <p className="text-gold font-semibold text-sm">
                                {formatPrice(apt.price_min || 0, apt.currency || 'EUR')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {apt.floor_plan && apt.availability_status === 'available' && (
                    <button
                      type="button"
                      className="w-full rounded-lg overflow-hidden border border-border hover:border-gold/40 transition-all cursor-zoom-in group"
                      onClick={() => {
                        setLightboxImages([apt.floor_plan!]);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={apt.floor_plan}
                        alt={`Schiță ${apt.title || ''}`}
                        className="w-full h-20 object-contain bg-white dark:bg-white/10 p-1"
                        loading="lazy"
                      />
                      <div className="text-[9px] text-muted-foreground py-1 text-center bg-muted/30">
                        {language === 'ro' ? 'Apasă pentru mărire' : 'Tap to enlarge'}
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={0}
      />
    </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border/50">
        <div className="flex gap-3">
          <a href="tel:0767941512" className="flex-1">
            <Button variant="outline" className="w-full">
              <Phone className="w-4 h-4 mr-2" />
              {language === 'ro' ? 'Sună acum' : 'Call now'}
            </Button>
          </a>
          <a 
            href={`https://wa.me/40767941512?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="luxury" className="w-full">
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileComplexDetail;
