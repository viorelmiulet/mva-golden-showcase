import { useEffect, useState } from "react";
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
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { Helmet } from "react-helmet-async";
import { ApartmentImageGallery } from "@/components/ApartmentImageGallery";
import { ScheduleViewingDialog } from "@/components/ScheduleViewingDialog";
import { TiltCard } from "@/components/TiltCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import MortgageCalculator from "@/components/MortgageCalculator";
import { PropertyDetailSkeleton } from "@/components/skeletons";
import { usePlausible } from "@/hooks/usePlausible";

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
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { trackProperty, trackContact } = usePlausible();

  useEffect(() => {
    if (!id) {
      navigate("/proprietati");
      return;
    }
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (property) {
      fetchSimilarProperties();
      // Track property view in Plausible
      trackProperty('view', property.id, property.title);
      // Track property view in recently viewed
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
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Proprietatea nu a fost găsită");
        navigate("/proprietati");
        return;
      }

      setProperty(data as Property);
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

  // Structured Data for Property
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": property.title,
    "description": property.description,
    "image": property.images?.[0] || "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "offers": {
      "@type": "Offer",
      "url": `https://mvaimobiliare.ro/proprietati/${property.id}`,
      "priceCurrency": property.currency || "EUR",
      "price": property.price_min,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "availability": property.availability_status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "RealEstateAgent",
        "name": "MVA Imobiliare",
        "url": "https://mvaimobiliare.ro"
      }
    },
    "category": "Real Estate",
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Suprafață",
        "value": `${property.surface_min}${property.surface_max !== property.surface_min ? `-${property.surface_max}` : ''} mp`
      },
      {
        "@type": "PropertyValue",
        "name": "Camere",
        "value": property.rooms
      },
      {
        "@type": "PropertyValue",
        "name": "Locație",
        "value": property.location
      }
    ]
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
        "item": `https://mvaimobiliare.ro/proprietati/${property.id}`
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{property.title} | MVA Imobiliare</title>
        <meta name="description" content={property.description} />
        <meta name="keywords" content={`${property.location}, ${property.rooms} camere, ${formatSurface(property.surface_min, property.surface_max)}, apartamente de vânzare, imobiliare București, ${property.project_name || ''}`} />
        <link rel="canonical" href={`https://mvaimobiliare.ro/proprietati/${property.id}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://mvaimobiliare.ro/proprietati/${property.id}`} />
        <meta property="og:title" content={`${property.title} | MVA Imobiliare`} />
        <meta property="og:description" content={property.description} />
        <meta property="og:site_name" content="MVA Imobiliare" />
        {property.images?.[0] && (
          <meta property="og:image" content={property.images[0]} />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://mvaimobiliare.ro/proprietati/${property.id}`} />
        <meta name="twitter:title" content={`${property.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={property.description} />
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

            <article className="space-y-6 sm:space-y-8">
              
              {/* Title & Location - FIRST */}
              <header>
                {property.availability_status === "available" && (
                  <Badge className="bg-green-600 text-white mb-2 sm:mb-3 text-[10px] sm:text-xs">
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Disponibil
                  </Badge>
                )}
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3">
                  {property.title}
                </h1>
                
                {property.project_name && (
                  <p className="text-base sm:text-lg md:text-xl text-gold font-semibold mb-1.5 sm:mb-2">
                    {property.project_name}
                  </p>
                )}
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gold flex-shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg">{property.location}</span>
                </div>
              </header>

              {/* Images Gallery - SECOND */}
              <section aria-label="Imagini proprietate" className="w-full">
                <ApartmentImageGallery 
                  images={property.images || []} 
                  title={property.title}
                />
              </section>

              {/* Price & Details - THIRD */}
              <section className="space-y-4 sm:space-y-5 md:space-y-6" aria-label="Detalii proprietate">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <Card className="border-gold/20">
                    <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <Euro className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-0.5 sm:mb-1">Preț</div>
                      <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground">
                        {formatPrice(property.price_min, property.price_max)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gold/20">
                    <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <Ruler className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-0.5 sm:mb-1">Suprafață</div>
                      <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground">
                        {formatSurface(property.surface_min, property.surface_max)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gold/20">
                    <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-0.5 sm:mb-1">Camere</div>
                      <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground">
                        {property.rooms}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Property Details */}
                {(property.floor || property.bathrooms || property.year_built || property.parking || 
                  property.heating || property.furnished || property.building_type || property.compartment ||
                  property.balconies || property.surface_land || property.comfort) && (
                  <Card className="border-gold/20">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Detalii Tehnice</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {property.floor !== null && property.floor !== undefined && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Etaj</div>
                              <div className="text-sm font-medium">
                                {property.floor}{property.total_floors ? ` / ${property.total_floors}` : ''}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {property.bathrooms !== null && property.bathrooms !== undefined && (
                          <div className="flex items-center gap-2">
                            <Bath className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Băi</div>
                              <div className="text-sm font-medium">{property.bathrooms}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.year_built && (
                          <div className="flex items-center gap-2">
                            <Construction className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">An Construcție</div>
                              <div className="text-sm font-medium">{property.year_built}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.parking !== null && property.parking !== undefined && (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Parcare</div>
                              <div className="text-sm font-medium">{property.parking} locuri</div>
                            </div>
                          </div>
                        )}
                        
                        {property.balconies !== null && property.balconies !== undefined && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Balcoane</div>
                              <div className="text-sm font-medium">{property.balconies}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.surface_land && (
                          <div className="flex items-center gap-2">
                            <Square className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Teren</div>
                              <div className="text-sm font-medium">{property.surface_land} mp</div>
                            </div>
                          </div>
                        )}
                        
                        {property.heating && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Încălzire</div>
                              <div className="text-sm font-medium">{property.heating}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.furnished && (
                          <div className="flex items-center gap-2">
                            <Sofa className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Mobilat</div>
                              <div className="text-sm font-medium">{property.furnished}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.building_type && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Tip Clădire</div>
                              <div className="text-sm font-medium">{property.building_type}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.compartment && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Compartimentare</div>
                              <div className="text-sm font-medium">{property.compartment}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.comfort && (
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Confort</div>
                              <div className="text-sm font-medium">{property.comfort}</div>
                            </div>
                          </div>
                        )}
                        
                        {property.property_type && (
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gold flex-shrink-0" />
                            <div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Tip Proprietate</div>
                              <div className="text-sm font-medium">{property.property_type}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Video & Virtual Tour */}
                {(property.video || property.virtual_tour) && (
                  <Card className="border-gold/20">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Media</h2>
                      <div className="flex flex-wrap gap-3">
                        {property.video && (
                          <a 
                            href={property.video} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors"
                          >
                            <Video className="w-5 h-5 text-gold" />
                            <span className="text-sm font-medium">Vezi Video</span>
                          </a>
                        )}
                        {property.virtual_tour && (
                          <a 
                            href={property.virtual_tour} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors"
                          >
                            <View className="w-5 h-5 text-gold" />
                            <span className="text-sm font-medium">Tur Virtual 360°</span>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <Card className="border-gold/20">
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Descriere</h2>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Features & Amenities in Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Features */}
                  {property.features && property.features.length > 0 && (
                    <Card className="border-gold/20">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">Caracteristici</h2>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {property.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-gold/10 text-gold text-[10px] sm:text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <Card className="border-gold/20">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">Facilități</h2>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {property.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="border-gold/30 text-[10px] sm:text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <ScheduleViewingDialog
                    propertyTitle={property.title}
                    propertyId={property.id}
                    trigger={
                      <Button className="w-full" size="lg" variant="luxury">
                        <Calendar className="w-5 h-5 mr-2" />
                        Programează Vizionare
                      </Button>
                    }
                  />

                  <Button
                    onClick={contactWhatsApp}
                    className="w-full"
                    size="lg"
                    variant="luxuryOutline"
                  >
                    <WhatsAppIcon className="w-5 h-5 mr-2" />
                    Contactează pe WhatsApp
                  </Button>

                  <Button
                    onClick={shareProperty}
                    variant="luxuryOutline"
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copiat!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Distribuie
                      </>
                    )}
                  </Button>

                  {property.storia_link && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(property.storia_link!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Vezi pe Storia
                    </Button>
                  )}
                </div>

              </section>
            </article>

            {/* Mortgage Calculator Section */}
            <section className="mt-12" aria-label="Calculator credit">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">
                Estimează Rata Lunară
              </h2>
              <MortgageCalculator defaultPrice={property.price_min} />
            </section>

            {/* Contact Section */}
            <Card className="mt-12 border-gold/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Interesat de această proprietate?</h2>
                <p className="text-muted-foreground mb-6">
                  Contactează-ne pentru mai multe informații sau pentru a programa o vizionare.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={contactWhatsApp}
                  >
                    <WhatsAppIcon className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="luxuryOutline"
                    size="lg"
                    onClick={() => window.location.href = "tel:+40767941512"}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Sună acum
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = "mailto:contact@mvaimobiliare.ro"}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties Section */}
            {similarProperties.length > 0 && (
              <section className="mt-12" aria-label="Proprietăți similare">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">
                  Proprietăți Similare
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {similarProperties.map((prop) => (
                    <Link 
                      key={prop.id} 
                      to={`/proprietati/${prop.id}`}
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
                                <Home className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            {prop.availability_status === "available" && (
                              <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[10px]">
                                Disponibil
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-3 sm:p-4">
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-gold transition-colors">
                              {prop.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground text-xs sm:text-sm mb-2">
                              <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                              <span className="truncate">{prop.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-bold text-gold">
                                €{prop.price_min?.toLocaleString("de-DE")}
                              </span>
                              <div className="flex items-center gap-2 text-muted-foreground">
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
            <RecentlyViewed 
              excludePropertyId={property.id} 
              className="mt-12 border-t border-border pt-8"
              maxItems={6}
            />

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PropertyDetail;
