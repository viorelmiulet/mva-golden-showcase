import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import {
  ArrowLeft,
  MapPin,
  Euro,
  Ruler,
  Home,
  Share2,
  ExternalLink,
  Phone,
  Mail,
  Copy,
  CheckCircle,
  Calendar,
  Building,
  Bath,
  Car,
  Thermometer,
  Sofa,
  Layers,
  Construction,
  Square,
  Video,
  View,
  Tag,
  MapPinned,
  User,
  Briefcase,
  Hash,
  Link2,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { Helmet } from "react-helmet-async";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { usePlausible } from "@/hooks/usePlausible";
import { generatePropertySlug, extractShortIdFromSlug, isUUID, getPropertyUrl } from "@/lib/propertySlug";

// Lazy load heavy below-fold components
const ApartmentImageGallery = lazy(() => import("@/components/ApartmentImageGallery").then(m => ({ default: m.ApartmentImageGallery })));
const ScheduleViewingDialog = lazy(() => import("@/components/ScheduleViewingDialog").then(m => ({ default: m.ScheduleViewingDialog })));
const TiltCard = lazy(() => import("@/components/TiltCard").then(m => ({ default: m.TiltCard })));
const RecentlyViewed = lazy(() => import("@/components/RecentlyViewed").then(m => ({ default: m.RecentlyViewed })));
const MortgageCalculator = lazy(() => import("@/components/MortgageCalculator"));

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price_min: number;
  price_max: number;
  currency: string;
  surface_min: number;
  surface_max: number;
  rooms: number;
  images: any;
  features: any;
  amenities: any;
  project_name: string | null;
  storia_link: string | null;
  availability_status: string;
  // Additional fields from XML import
  floor?: number | null;
  total_floors?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  property_type?: string | null;
  building_type?: string | null;
  compartment?: string | null;
  heating?: string | null;
  parking?: number | null;
  balconies?: number | null;
  furnished?: string | null;
  external_id?: string | null;
  source_url?: string | null;
  zone?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  agent?: string | null;
  agency?: string | null;
  surface_land?: number | null;
  comfort?: string | null;
  video?: string | null;
  virtual_tour?: string | null;
  contact_info?: any;
  transaction_type?: string | null;
  descriere_lunga?: string | null;
  floor_plan?: string | null;
}

// Auto-generate extended description from property characteristics
const generateAutoDescription = (p: Property): string => {
  const parts: string[] = [];

  const tipTranzactie = p.transaction_type === 'rent' ? 'închiriere' : 'vânzare';
  const numarCamere = p.rooms || 1;
  const camereTxt = numarCamere === 1 ? 'cameră' : 'camere';
  const ansamblu = p.project_name || 'zonă rezidențială';
  const zona = p.zone || p.location || 'Militari';
  const suprafata = p.surface_min || '';
  const etaj = p.floor ?? '';
  const totalEtaje = p.total_floors ?? '';
  const pret = p.price_min ? p.price_min.toLocaleString('ro-RO') : '';

  // Opening sentence
  parts.push(`Apartament cu ${numarCamere} ${camereTxt} de ${tipTranzactie} în ${ansamblu}, ${zona}, Chiajna, Ilfov.`);

  // Surface & floor
  if (suprafata) {
    let surfaceLine = `Suprafață utilă ${suprafata} mp`;
    if (etaj !== '') {
      surfaceLine += `, etaj ${etaj}${totalEtaje ? `/${totalEtaje}` : ''}`;
    }
    surfaceLine += '.';
    parts.push(surfaceLine);
  }

  // Features / amenities as dotări
  const dotari: string[] = [];
  if (p.bathrooms) dotari.push(`${p.bathrooms} ${p.bathrooms === 1 ? 'baie' : 'băi'}`);
  if (p.balconies) dotari.push(`${p.balconies} ${p.balconies === 1 ? 'balcon' : 'balcoane'}`);
  if (p.parking) dotari.push(`${p.parking} ${p.parking === 1 ? 'loc de parcare' : 'locuri de parcare'}`);
  if (p.heating) dotari.push(`încălzire ${p.heating}`);
  if (p.furnished) dotari.push(p.furnished === 'da' ? 'mobilat complet' : p.furnished === 'partial' ? 'mobilat parțial' : `mobilare: ${p.furnished}`);
  if (p.compartment) dotari.push(`compartimentare ${p.compartment}`);
  if (p.comfort) dotari.push(`confort ${p.comfort}`);
  if (p.building_type) dotari.push(`construcție tip ${p.building_type}`);
  if (p.amenities && Array.isArray(p.amenities) && p.amenities.length > 0) {
    dotari.push(...(p.amenities as string[]));
  }
  if (p.features && Array.isArray(p.features) && p.features.length > 0) {
    dotari.push(...(p.features as string[]));
  }
  if (dotari.length > 0) {
    parts.push(`Dotări incluse: ${dotari.join(', ')}.`);
  }

  // Price
  if (pret) {
    const tipFinantare = p.transaction_type === 'rent' ? 'chirie lunară' : 'cash sau credit';
    parts.push(`Preț ${pret} euro, ${tipFinantare}.`);
  }

  // Complex paragraph
  parts.push(`Proprietatea face parte din ansamblul rezidențial ${ansamblu}, unul dintre cele mai căutate complexe din zona Militari–Chiajna.`);

  // CTA paragraph
  parts.push(`MVA Imobiliare oferă asistență completă pentru această proprietate, de la vizionare gratuită până la semnarea actelor la notar. Pentru mai multe detalii și programarea unei vizionări, contactați-ne la 0767 941 512.`);

  return parts.join(' ');
};

const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { trackProperty, trackContact } = usePlausible();

  useEffect(() => {
    if (!slug) {
      navigate("/proprietati");
      return;
    }
    fetchProperty();
  }, [slug]);

  useEffect(() => {
    if (property) {
      fetchSimilarProperties();
      trackProperty('view', property.id, property.title);
      addToRecentlyViewed({
        id: property.id,
        title: property.title,
        images: property.images,
        price_min: property.price_min,
        location: property.location,
        rooms: property.rooms,
        surface_min: property.surface_min,
      });
    }
  }, [property]);

  const fetchProperty = async () => {
    try {
      // Check if slug is a UUID (old URL format) — redirect to new slug
      if (isUUID(slug!)) {
        const { data } = await supabase
          .from("catalog_offers")
          .select("*")
          .eq("id", slug)
          .maybeSingle();
        if (data) {
          const newSlug = generatePropertySlug(data as Property);
          navigate(`/proprietati/${newSlug}`, { replace: true });
          return;
        }
        toast.error("Proprietatea nu a fost găsită");
        navigate("/proprietati");
        return;
      }

      // Extract short ID from slug (last 4 chars) and find matching property
      const shortId = extractShortIdFromSlug(slug!);
      const { data: allProperties, error } = await supabase
        .from("catalog_offers")
        .select("*");

      if (error) throw error;

      // Filter candidates whose UUID starts with the short ID, then match slug
      const match = allProperties?.find(
        (p) => {
          const pShortId = p.id.replace(/-/g, '').substring(0, 4);
          return pShortId === shortId && generatePropertySlug(p as Property) === slug;
        }
      );

      if (!match) {
        toast.error("Proprietatea nu a fost găsită");
        navigate("/proprietati");
        return;
      }

      setProperty(match as Property);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Eroare la încărcarea proprietății");
      navigate("/proprietati");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilarProperties = async () => {
    if (!property) return;
    
    try {
      // Fetch properties with similar characteristics (same rooms or similar price range)
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .neq("id", property.id)
        .is("project_id", null) // Only individual properties, not complex apartments
        .eq("availability_status", "available")
        .or(`rooms.eq.${property.rooms},location.ilike.%${property.location?.split(',')[0] || ''}%`)
        .limit(4);

      if (error) throw error;

      setSimilarProperties((data as Property[]) || []);
    } catch (error) {
      console.error("Error fetching similar properties:", error);
    }
  };

  const shareProperty = async () => {
    const url = window.location.href;
    
    // Track share event
    trackProperty('share', property?.id || '', property?.title);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || "Proprietate MVA",
          text: property?.description || "",
          url: url,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copiat în clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Nu am putut copia link-ul");
      }
    }
  };

  const contactWhatsApp = () => {
    // Track WhatsApp contact
    trackContact('whatsapp', 'property_detail', property?.id);
    
    const message = `Bună ziua! Sunt interesat de proprietatea: ${property?.title} - ${window.location.href}`;
    window.open(
      `https://wa.me/40767941512?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />
        <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            <PropertyDetailSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) return null;

  const formatPrice = (min: number, max: number) => {
    if (min === max) return `€${min.toLocaleString("de-DE")}`;
    return `€${min.toLocaleString("de-DE")} - €${max.toLocaleString("de-DE")}`;
  };

  const formatSurface = (min: number, max: number) => {
    if (min === max) return `${min} mp`;
    return `${min} - ${max} mp`;
  };

  // Helper variables for SEO
  const zona = property.zone || property.location || 'București';
  const camere = property.rooms || '';
  const suprafata = property.surface_min || '';
  const etaj = property.floor ?? '-';
  const pret = property.price_min ? property.price_min.toLocaleString('ro-RO') : '-';
  const tipTranzactie = property.transaction_type === 'rent' ? 'Închiriere' : 'Vânzare';

  // Structured Data - RealEstateListing
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `Apartament ${camere} camere ${zona}`,
    "description": property.description || `Apartament ${camere} camere de ${tipTranzactie.toLowerCase()} în ${zona}, Militari Sector 6.`,
    "url": `https://mvaimobiliare.ro${getPropertyUrl(property)}`,
    "image": property.images?.[0] || "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "datePosted": new Date().toISOString(),
    "offers": {
      "@type": "Offer",
      "price": property.price_min,
      "priceCurrency": property.currency || "EUR",
      "availability": property.availability_status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "RealEstateAgent",
        "name": "MVA Imobiliare",
        "url": "https://mvaimobiliare.ro"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "București",
      "addressRegion": "Sector 6",
      "streetAddress": zona,
      "addressCountry": "RO"
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.surface_min,
      "unitCode": "MTK"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Acasă",
        "item": "https://mvaimobiliare.ro/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Proprietăți",
        "item": "https://mvaimobiliare.ro/proprietati"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": property.title,
        "item": `https://mvaimobiliare.ro${getPropertyUrl(property)}`
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{`${camere} camere ${zona} etaj ${etaj} ${suprafata}mp – ${tipTranzactie} ${pret}€ | MVA Imobiliare`}</title>
        <meta name="description" content={`Apartament ${camere} camere de ${tipTranzactie.toLowerCase()} în ${zona}, Militari Sector 6. Suprafață ${suprafata}mp, etaj ${etaj}. Preț ${pret} euro. Vizionare gratuită – MVA Imobiliare.`} />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content={`${property.zone || property.location || ''}, ${property.rooms || ''} camere, ${property.surface_min || ''}mp, apartamente de vânzare Militari, imobiliare Sector 6, ${property.project_name || ''}`} />
        <link rel="canonical" href={`https://mvaimobiliare.ro${getPropertyUrl(property)}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://mvaimobiliare.ro${getPropertyUrl(property)}`} />
        <meta property="og:title" content={`Apartament ${property.rooms || ''} camere ${property.zone || property.location || ''} – ${property.price_min ? property.price_min.toLocaleString('ro-RO') : '-'} euro`} />
        <meta property="og:description" content={`${property.surface_min || ''}mp, etaj ${property.floor ?? '-'}, ${property.zone || property.location || ''} Militari. Detalii și vizionare la MVA Imobiliare.`} />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:site_name" content="MVA Imobiliare" />
        {property.images?.[0] && (
          <meta property="og:image" content={property.images[0]} />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://mvaimobiliare.ro${getPropertyUrl(property)}`} />
        <meta name="twitter:title" content={`Apartament ${property.rooms || ''} camere ${property.zone || property.location || ''} – ${property.price_min ? property.price_min.toLocaleString('ro-RO') : '-'} euro`} />
        <meta name="twitter:description" content={`${property.surface_min || ''}mp, etaj ${property.floor ?? '-'}, ${property.zone || property.location || ''}. Vizionare gratuită.`} />
        {property.images?.[0] && (
          <meta name="twitter:image" content={property.images[0]} />
        )}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(propertySchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />
        
        <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4" role="main">
          <div className="container mx-auto max-w-6xl">
            
            {/* Breadcrumbs */}
            <Breadcrumbs 
              items={[
                { label: 'Proprietăți', href: '/proprietati' },
                { label: property.title }
              ]} 
            />

            {/* Back Button */}
            <nav aria-label="Breadcrumb navigation">
              <Link to="/proprietati">
                <Button variant="ghost" className="mb-3 sm:mb-4 md:mb-6 group text-xs sm:text-sm h-8 sm:h-9 md:h-10">
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                  Înapoi la Proprietăți
                </Button>
              </Link>
            </nav>

              {/* Sold / Inactive Banner */}
              {property.availability_status && property.availability_status !== 'available' && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:p-6 text-center space-y-2">
                  <p className="text-lg sm:text-xl font-bold text-destructive">
                    {property.availability_status === 'sold' ? 'Această proprietate a fost vândută' : 'Această proprietate nu mai este disponibilă'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Conținutul paginii este păstrat ca referință. Vezi mai jos proprietăți similare disponibile.
                  </p>
                </div>
              )}

            <article className="space-y-6 sm:space-y-8">
              
              {/* Title & Location - FIRST */}
              <header>
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                  {property.availability_status === "available" && (
                    <Badge className="bg-green-600 text-white text-[10px] sm:text-xs">
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Disponibil
                    </Badge>
                  )}
                  {property.transaction_type && (
                    <Badge className={`text-[10px] sm:text-xs ${
                      property.transaction_type === 'rent' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gold/20 text-gold-dark border-gold/30'
                    }`}>
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      {property.transaction_type === 'rent' ? 'Închiriere' : 'Vânzare'}
                    </Badge>
                  )}
                  {property.property_type && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs border-gold/30">
                      {property.property_type}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3">
                  {property.title}
                </h1>
                
                {property.project_name && (
                  <p className="text-base sm:text-lg md:text-xl text-gold font-semibold mb-1.5 sm:mb-2">
                    {property.project_name}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gold flex-shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg">{property.location}</span>
                  </div>
                  {property.zone && property.zone !== property.location && (
                    <div className="flex items-center">
                      <MapPinned className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-gold flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{property.zone}</span>
                    </div>
                  )}
                  {property.city && property.city !== property.location && (
                    <span className="text-xs sm:text-sm text-muted-foreground">• {property.city}</span>
                  )}
                </div>
              </header>

              {/* Images Gallery - SECOND */}
              <section aria-label="Imagini proprietate" className="w-full">
                <Suspense fallback={<div className="aspect-video bg-muted animate-pulse rounded-xl" />}>
                  <ApartmentImageGallery 
                    images={property.images || []} 
                    title={property.title}
                    propertyDetails={{
                      rooms: property.rooms,
                      zone: property.zone || property.location,
                      city: property.city || 'București',
                      surface: property.surface_min,
                      transactionType: property.transaction_type === 'rent' ? 'închiriere' : 'vânzare',
                    }}
                  />
                </Suspense>
              </section>

              {/* Price & Details - THIRD */}
              <section className="space-y-4 sm:space-y-5" aria-label="Detalii proprietate">
                
                {/* Compact Stats Bar */}
                <Card className="border-gold/20 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-3 sm:grid-cols-3 divide-x divide-border">
                      <div className="p-3 sm:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Preț</div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-gold">
                          {formatPrice(property.price_min, property.price_max)}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Suprafață</div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-foreground">
                          {formatSurface(property.surface_min, property.surface_max)}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Camere</div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-foreground">
                          {property.rooms}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Technical Details - Compact Grid */}
                {(() => {
                  const details: { icon: React.ReactNode; label: string; value: string }[] = [];
                  
                  if (property.floor !== null && property.floor !== undefined)
                    details.push({ icon: <Building className="w-4 h-4 text-gold" />, label: 'Etaj', value: `${property.floor}${property.total_floors ? ` / ${property.total_floors}` : ''}` });
                  if (property.bathrooms !== null && property.bathrooms !== undefined)
                    details.push({ icon: <Bath className="w-4 h-4 text-gold" />, label: 'Băi', value: `${property.bathrooms}` });
                  if (property.year_built)
                    details.push({ icon: <Construction className="w-4 h-4 text-gold" />, label: 'An Construcție', value: `${property.year_built}` });
                  if (property.parking !== null && property.parking !== undefined)
                    details.push({ icon: <Car className="w-4 h-4 text-gold" />, label: 'Parcare', value: `${property.parking} locuri` });
                  if (property.balconies !== null && property.balconies !== undefined)
                    details.push({ icon: <Layers className="w-4 h-4 text-gold" />, label: 'Balcoane', value: `${property.balconies}` });
                  if (property.surface_land)
                    details.push({ icon: <Square className="w-4 h-4 text-gold" />, label: 'Teren', value: `${property.surface_land} mp` });
                  if (property.heating)
                    details.push({ icon: <Thermometer className="w-4 h-4 text-gold" />, label: 'Încălzire', value: property.heating });
                  if (property.furnished)
                    details.push({ icon: <Sofa className="w-4 h-4 text-gold" />, label: 'Mobilat', value: property.furnished });
                  if (property.building_type)
                    details.push({ icon: <Building className="w-4 h-4 text-gold" />, label: 'Tip Clădire', value: property.building_type });
                  if (property.compartment)
                    details.push({ icon: <Layers className="w-4 h-4 text-gold" />, label: 'Compartimentare', value: property.compartment });
                  if (property.comfort)
                    details.push({ icon: <Home className="w-4 h-4 text-gold" />, label: 'Confort', value: property.comfort });
                  if (property.property_type)
                    details.push({ icon: <Home className="w-4 h-4 text-gold" />, label: 'Tip Proprietate', value: property.property_type });

                  if (details.length === 0) return null;

                  return (
                    <Card className="border-gold/20">
                      <CardContent className="p-3 sm:p-4 md:p-5">
                        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Detalii Tehnice</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                          {details.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              {d.icon}
                              <div className="min-w-0">
                                <div className="text-[10px] text-muted-foreground leading-tight">{d.label}</div>
                                <div className="text-xs sm:text-sm font-medium truncate">{d.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Video & Virtual Tour */}
                {(property.video || property.virtual_tour) && (
                  <div className="flex flex-wrap gap-2">
                    {property.video && (
                      <a 
                        href={property.video} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors border border-gold/20"
                      >
                        <Video className="w-4 h-4 text-gold" />
                        <span className="text-sm font-medium">Video</span>
                      </a>
                    )}
                    {property.virtual_tour && (
                      <a 
                        href={property.virtual_tour} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors border border-gold/20"
                      >
                        <View className="w-4 h-4 text-gold" />
                        <span className="text-sm font-medium">Tur Virtual 360°</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Features (deduplicated with amenities) */}
                {(() => {
                  const allFeatures = new Set<string>();
                  if (property.features?.length) property.features.forEach((f: string) => allFeatures.add(f));
                  if (property.amenities?.length) property.amenities.forEach((a: string) => allFeatures.add(a));
                  const uniqueFeatures = Array.from(allFeatures);
                  
                  if (uniqueFeatures.length === 0) return null;

                  return (
                    <Card className="border-gold/20">
                      <CardContent className="p-3 sm:p-4 md:p-5">
                        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Caracteristici & Facilități</h2>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {uniqueFeatures.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-gold/10 text-gold text-[10px] sm:text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Description */}
                {(() => {
                  const desc = property.description || '';
                  const wordCount = desc.trim().split(/\s+/).filter(Boolean).length;
                  const fullDescription = property.descriere_lunga 
                    || (wordCount < 150 ? (desc ? desc + '\n\n' : '') + generateAutoDescription(property) : desc);
                  
                  return fullDescription ? (
                    <Card className="border-gold/20">
                      <CardContent className="p-3 sm:p-4 md:p-5">
                        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Descriere</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                          {fullDescription}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Agent / Agency / Contact Info */}
                {(property.agent || property.agency || property.contact_info) && (
                  <Card className="border-gold/20">
                    <CardContent className="p-3 sm:p-4 md:p-5">
                      <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Informații Contact</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                        {property.agent && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <User className="w-4 h-4 text-gold flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground">Agent</div>
                              <div className="text-xs sm:text-sm font-medium truncate">{property.agent}</div>
                            </div>
                          </div>
                        )}
                        {property.agency && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Briefcase className="w-4 h-4 text-gold flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground">Agenție</div>
                              <div className="text-xs sm:text-sm font-medium truncate">{property.agency}</div>
                            </div>
                          </div>
                        )}
                        {property.contact_info?.phone && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground">Telefon</div>
                              <a href={`tel:${property.contact_info.phone}`} className="text-xs sm:text-sm font-medium hover:text-gold transition-colors truncate block">
                                {property.contact_info.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {property.contact_info?.email && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground">Email</div>
                              <a href={`mailto:${property.contact_info.email}`} className="text-xs sm:text-sm font-medium hover:text-gold transition-colors truncate block">
                                {property.contact_info.email}
                              </a>
                            </div>
                          </div>
                        )}
                        {property.contact_info?.name && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <User className="w-4 h-4 text-gold flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground">Contact</div>
                              <div className="text-xs sm:text-sm font-medium truncate">{property.contact_info.name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* External Reference */}
                {(property.external_id || property.source_url) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {property.external_id && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-gold" />
                        Ref: {property.external_id}
                      </span>
                    )}
                    {property.source_url && (
                      <a 
                        href={property.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gold transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Anunț original
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Suspense fallback={null}>
                    <ScheduleViewingDialog
                      propertyTitle={property.title}
                      propertyId={property.id}
                      trigger={
                        <Button className="w-full" size="default" variant="luxury">
                          <Calendar className="w-4 h-4 mr-1.5" />
                          <span className="hidden sm:inline">Programează</span>
                          <span className="sm:hidden">Vizionare</span>
                        </Button>
                      }
                    />
                  </Suspense>

                  <Button
                    onClick={contactWhatsApp}
                    className="w-full"
                    size="default"
                    variant="luxuryOutline"
                  >
                    <WhatsAppIcon className="w-4 h-4 mr-1.5" />
                    WhatsApp
                  </Button>

                  <Button
                    onClick={shareProperty}
                    variant="outline"
                    className="w-full"
                    size="default"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Copiat!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-1.5" />
                        Distribuie
                      </>
                    )}
                  </Button>

                  {property.storia_link ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="default"
                      onClick={() => window.open(property.storia_link!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Storia
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="default"
                      onClick={() => window.location.href = "tel:+40767941512"}
                    >
                      <Phone className="w-4 h-4 mr-1.5" />
                      Sună
                    </Button>
                  )}
                </div>

              </section>
            </article>

            {/* Mortgage Calculator Section */}
            <Suspense fallback={<div className="mt-8 sm:mt-12 h-64 bg-muted animate-pulse rounded-xl" />}>
              <section className="mt-8 sm:mt-12" aria-label="Calculator credit">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground">
                  Estimează Rata Lunară
                </h2>
                <MortgageCalculator defaultPrice={property.price_min} />
              </section>
            </Suspense>

            {/* Contact Section */}
            <Card className="mt-8 sm:mt-12 border-gold/20">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Interesat de această proprietate?</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Contactează-ne pentru mai multe informații sau pentru a programa o vizionare.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4">
                  <Button
                    variant="luxury"
                    size="default"
                    className="w-full sm:w-auto"
                    onClick={contactWhatsApp}
                  >
                    <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="luxuryOutline"
                    size="default"
                    className="w-full sm:w-auto"
                    onClick={() => window.location.href = "tel:+40767941512"}
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Sună acum
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full sm:w-auto"
                    onClick={() => window.location.href = "mailto:contact@mvaimobiliare.ro"}
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties Section */}
            {similarProperties.length > 0 && (
              <section className="mt-8 sm:mt-12" aria-label="Proprietăți similare">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground">
                  Proprietăți Similare
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                  {similarProperties.map((prop) => (
                    <Link 
                      key={prop.id} 
                      to={getPropertyUrl(prop)}
                      className="block"
                    >
                      <TiltCard tiltIntensity={12} glareEnabled={true}>
                        <Card className="border-gold/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gold/40 group">
                          <div className="aspect-[4/3] relative overflow-hidden">
                            {prop.images?.[0] ? (
                              <img
                                src={prop.images[0]}
                                alt={`${prop.title} - apartament ${prop.rooms || ''} camere în ${prop.location || 'București'}`}
                                title={prop.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                itemProp="image"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Home className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                              </div>
                            )}
                            {prop.availability_status === "available" && (
                              <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-green-600 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">
                                Disponibil
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-2 sm:p-3 md:p-4">
                            <h3 className="font-semibold text-xs sm:text-sm md:text-base line-clamp-2 mb-1 sm:mb-2 group-hover:text-gold transition-colors">
                              {prop.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground text-[10px] sm:text-xs mb-1 sm:mb-2">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-gold flex-shrink-0" />
                              <span className="truncate">{prop.location}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs gap-0.5 sm:gap-0">
                              <span className="font-bold text-gold text-xs sm:text-sm">
                                €{prop.price_min?.toLocaleString("de-DE")}
                              </span>
                              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                                <span>{prop.surface_min} mp</span>
                                <span>•</span>
                                <span>{prop.rooms} cam</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TiltCard>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recently Viewed Section */}
            <Suspense fallback={<div className="mt-12 h-48 bg-muted animate-pulse rounded-xl" />}>
              <RecentlyViewed 
                excludePropertyId={property.id} 
                className="mt-12 border-t border-border pt-8"
                maxItems={6}
              />
            </Suspense>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PropertyDetail;
