import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Eye
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { generatePropertySlug, extractShortIdFromSlug, isUUID, getPropertyUrl } from "@/lib/propertySlug";
import { usePropertyViews } from "@/hooks/usePropertyViews";

// Check if a string looks like GPS coordinates
const isCoordinates = (str: string): boolean => {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,?\s*-?\d+\.\d+$/.test(str.trim());
};

const getDisplayLocation = (p: any): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  if (p.project_name) return p.project_name;
  return 'București';
};

// Auto-generate extended description for SEO (min 150 words)
const generateAutoDescription = (p: any): string => {
  const parts: string[] = [];
  const tipTranzactie = p.transaction_type === 'rent' ? 'închiriere' : 'vânzare';
  const numarCamere = p.rooms || 1;
  const camereTxt = numarCamere === 1 ? 'cameră' : 'camere';
  const ansamblu = p.project_name || 'zonă rezidențială';
  const zona = getDisplayLocation(p);
  const suprafata = p.surface_min || '';
  const etaj = p.floor ?? '';
  const totalEtaje = p.total_floors ?? '';
  const pret = p.price_min ? p.price_min.toLocaleString('ro-RO') : '';

  parts.push(`Apartament cu ${numarCamere} ${camereTxt} de ${tipTranzactie} în ${ansamblu}, ${zona}, Chiajna, Ilfov.`);

  if (suprafata) {
    let surfaceLine = `Suprafață utilă ${suprafata} mp`;
    if (etaj !== '') surfaceLine += `, etaj ${etaj}${totalEtaje ? `/${totalEtaje}` : ''}`;
    surfaceLine += '.';
    parts.push(surfaceLine);
  }

  const dotari: string[] = [];
  if (p.bathrooms) dotari.push(`${p.bathrooms} ${p.bathrooms === 1 ? 'baie' : 'băi'}`);
  if (p.balconies) dotari.push(`${p.balconies} ${p.balconies === 1 ? 'balcon' : 'balcoane'}`);
  if (p.parking) dotari.push(`${p.parking} ${p.parking === 1 ? 'loc de parcare' : 'locuri de parcare'}`);
  if (p.heating) dotari.push(`încălzire ${p.heating}`);
  if (p.features && Array.isArray(p.features) && p.features.length > 0) dotari.push(...p.features);
  if (dotari.length > 0) parts.push(`Dotări incluse: ${dotari.join(', ')}.`);

  if (pret) {
    const tipFinantare = p.transaction_type === 'rent' ? 'chirie lunară' : 'cash sau credit';
    parts.push(`Preț ${pret} euro, ${tipFinantare}.`);
  }

  parts.push(`Proprietatea face parte din ansamblul rezidențial ${ansamblu}, unul dintre cele mai căutate complexe din zona Militari–Chiajna.`);
  parts.push(`MVA Imobiliare oferă asistență completă pentru această proprietate, de la vizionare gratuită până la semnarea actelor la notar. Pentru mai multe detalii și programarea unei vizionări, contactați-ne la 0767 941 512.`);

  return parts.join(' ');
};

const MobilePropertyDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language } = useLanguage();
  const propertyPath = property ? getPropertyUrl(property) : undefined;
  const { data: viewCount } = usePropertyViews(propertyPath);

  const { data: property, isLoading } = useQuery({
    queryKey: ['mobile-property', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug');

      // Handle old UUID URLs — redirect
      if (isUUID(slug)) {
        const { data } = await supabase
          .from('catalog_offers')
          .select('*')
          .eq('id', slug)
          .single();
        if (data) {
          const newSlug = generatePropertySlug(data);
          navigate(`/app/proprietate/${newSlug}`, { replace: true });
          return null;
        }
        throw new Error('Not found');
      }

      // Fetch all properties and find exact slug match
      const { data: allProperties, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .limit(1000);
      
      if (error) throw error;
      const match = allProperties?.find(p => generatePropertySlug(p) === slug);
      if (!match) throw new Error('Not found');
      return match;
    },
    enabled: !!slug
  });

  const formatPrice = (price: number, currency: string = 'EUR') => {
    // Ensure valid ISO currency code (LEI is not valid, use RON)
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

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    } else if (distance < -minSwipeDistance) {
      setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
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
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
          {images.length > 0 ? (
              <OptimizedPropertyImage
                src={images[currentImageIndex]}
                alt={`${property.title} - apartament ${property.rooms || ''} camere${property.surface_min ? `, ${property.surface_min} mp` : ''} în ${getDisplayLocation(property)}`}
                title={property.title}
                containerClassName="w-full h-full"
                aspectRatio="auto"
                priority={currentImageIndex === 0}
                quality={85}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {language === 'ro' ? 'Fără imagine' : 'No image'}
              </div>
            )}
          </div>
          
           {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
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
            {getDisplayLocation(property)}
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
        {(() => {
          const desc = property.description || '';
          const wordCount = desc.trim().split(/\s+/).filter(Boolean).length;
          const fullDescription = property.descriere_lunga 
            || (wordCount < 150 ? (desc ? desc + '\n\n' : '') + generateAutoDescription(property) : desc);
          
          return fullDescription ? (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2">
                  {language === 'ro' ? 'Descriere' : 'Description'}
                </h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {fullDescription}
                </p>
              </CardContent>
            </Card>
          ) : null;
        })()}

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

        {/* SEO Content Section - always visible in DOM for crawlers */}
        <section aria-label="Informații detaliate proprietate">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">
                {language === 'ro' ? 'Informații Proprietate' : 'Property Information'}
              </h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {(() => {
                  const tipTranzactie = property.transaction_type === 'rent' ? 'închiriere' : 'vânzare';
                  const numarCamere = property.rooms || 1;
                  const camereTxt = numarCamere === 1 ? 'cameră' : 'camere';
                  const tipLocuinta = numarCamere === 1 ? 'Garsonieră' : `Apartament ${numarCamere} ${camereTxt}`;
                  const ansamblu = property.project_name || 'zonă rezidențială';
                  const zona = getDisplayLocation(property);
                  const suprafata = property.surface_min || '-';
                  const etaj = property.floor ?? '-';
                  const totalEtaje = property.total_floors ?? '-';
                  const pret = property.price_min ? property.price_min.toLocaleString('ro-RO') : '-';

                  const lines: string[] = [];
                  lines.push(`${tipLocuinta} de ${tipTranzactie} în ${ansamblu}, ${zona}`);
                  lines.push('');
                  lines.push(`Tip proprietate: ${tipLocuinta}`);
                  lines.push(`Ansamblu rezidențial: ${ansamblu}`);
                  lines.push(`Zonă / Cartier: ${zona}, Chiajna, Ilfov`);
                  lines.push(`Suprafață utilă: ${suprafata} mp`);
                  lines.push(`Număr camere: ${numarCamere}`);
                  if (property.bathrooms) lines.push(`Băi: ${property.bathrooms}`);
                  if (property.balconies) lines.push(`Balcoane: ${property.balconies}`);
                  lines.push(`Etaj: ${etaj}${totalEtaje !== '-' ? ` / ${totalEtaje}` : ''}`);
                  lines.push(`Preț: ${pret} ${property.currency || 'EUR'}`);
                  if (property.parking) lines.push(`Parcare: ${property.parking} ${property.parking === 1 ? 'loc' : 'locuri'}`);
                  if (property.heating) lines.push(`Încălzire: ${property.heating}`);
                  lines.push('');
                  lines.push(`Această proprietate este intermediată de MVA Imobiliare, agenție specializată în vânzări și închirieri imobiliare în zona Militari, Chiajna și Ilfov. Oferim consultanță gratuită, vizionări fără obligații și asistență completă pe tot parcursul tranzacției. Suntem specializați în ansambluri rezidențiale din zona Militari–Chiajna din 2016. Contactați-ne la 0767 941 512 pentru detalii sau programarea unei vizionări.`);
                  return lines.join('\n');
                })()}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Floor plan */}
        {property.floor_plan && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">
                {language === 'ro' ? 'Plan apartament' : 'Floor Plan'}
              </h2>
              <OptimizedPropertyImage
                src={property.floor_plan}
                alt="Floor plan"
                containerClassName="w-full rounded-lg"
                aspectRatio="auto"
                quality={90}
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Close button - Fixed top right */}
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-[110] h-12 w-12 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20"
            onClick={() => setShowGallery(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Counter - Top left */}
          <div className="fixed top-4 left-4 z-[110] text-white text-sm bg-black/50 px-3 py-2 rounded-full">
            {currentImageIndex + 1} / {images.length}
          </div>
          
        {/* Image container - takes full remaining space */}
        <div 
          className="flex-1 flex items-center justify-center px-1 py-2 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-contain"
          />
          </div>

          
          {/* Thumbnail strip at bottom */}
          {images.length > 1 && (
            <div className="flex-shrink-0 py-2 pb-6 px-2 bg-black/50">
              <div className="flex gap-1.5 justify-center overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all touch-manipulation ${
                      index === currentImageIndex 
                        ? 'border-gold ring-1 ring-gold' 
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobilePropertyDetail;
