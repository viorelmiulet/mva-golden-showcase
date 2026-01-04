import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MobileHeader from "@/components/mobile/MobileHeader";
import { 
  MapPin, 
  Home, 
  Ruler, 
  Heart, 
  Share2, 
  Phone, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobilePropertyDetail = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language } = useLanguage();

  const { data: property, isLoading } = useQuery({
    queryKey: ['mobile-property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `${property?.title} - ${formatPrice(property?.price_min || 0)}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bună ziua! Sunt interesat de proprietatea: ${property?.title}\n${window.location.href}`
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader showBack />
        <div className="pt-14">
          <Skeleton className="w-full h-72" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader showBack />
        <div className="pt-14 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ro' ? 'Proprietate negăsită' : 'Property not found'}
          </h2>
          <Link to="/app/cauta">
            <Button variant="luxury">
              {language === 'ro' ? 'Înapoi la căutare' : 'Back to search'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images || [];

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
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleFavorite(property.id, 'property')}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite(property.id, 'property') ? 'fill-gold text-gold' : ''}`}
              />
            </Button>
          </div>
        }
      />
      
      {/* Image Gallery */}
      <div className="pt-14">
        <div className="relative">
          <div 
            className="w-full h-72 bg-muted cursor-pointer"
            onClick={() => setShowGallery(true)}
          >
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={`${property.title} - apartament ${property.rooms || ''} camere${property.surface_min ? `, ${property.surface_min} mp` : ''} în ${property.location || 'București'}`}
                title={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {language === 'ro' ? 'Fără imagine' : 'No image'}
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title and price */}
        <div>
          <h1 className="text-xl font-bold mb-2">{property.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4" />
            {property.location || 'București'}
          </p>
          <p className="text-2xl font-bold text-gold">
            {formatPrice(property.price_min || 0, property.currency || 'EUR')}
          </p>
        </div>

        {/* Quick info */}
        <div className="flex gap-4">
          {property.rooms && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ro' ? 'Camere' : 'Rooms'}
                </p>
                <p className="font-semibold">{property.rooms}</p>
              </div>
            </div>
          )}
          {property.surface_min && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ro' ? 'Suprafață' : 'Surface'}
                </p>
                <p className="font-semibold">{property.surface_min} m²</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">
                {language === 'ro' ? 'Descriere' : 'Description'}
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {property.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">
                {language === 'ro' ? 'Caracteristici' : 'Features'}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {property.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floor plan */}
        {property.floor_plan && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">
                {language === 'ro' ? 'Plan apartament' : 'Floor Plan'}
              </h2>
              <img
                src={property.floor_plan}
                alt="Floor plan"
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}
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

      {/* Fullscreen gallery modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-background">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGallery(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="h-full flex items-center justify-center">
            <img
              src={images[currentImageIndex]}
              alt={property.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-gold' : 'bg-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MobilePropertyDetail;
