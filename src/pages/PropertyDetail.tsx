import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  MessageCircle,
  Copy,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ScheduleViewingDialog } from "@/components/ScheduleViewingDialog";

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
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/proprietati");
      return;
    }
    fetchProperty();
  }, [id]);

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

  const shareProperty = async () => {
    const url = window.location.href;
    
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
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
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
            
            {/* Back Button */}
            <nav aria-label="Breadcrumb navigation">
              <Link to="/proprietati">
                <Button variant="ghost" className="mb-3 sm:mb-4 md:mb-6 group text-xs sm:text-sm h-8 sm:h-9 md:h-10">
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                  Înapoi la Proprietăți
                </Button>
              </Link>
            </nav>

            <article className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              
              {/* Images Section */}
              <section className="space-y-2 sm:space-y-3 md:space-y-4" aria-label="Imagini proprietate">
                <Card className="overflow-hidden border-gold/20 cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                  <div className="aspect-video relative group">
                    {property.images && property.images.length > 0 ? (
                      <>
                        <img
                          src={property.images[selectedImage]}
                          alt={`${property.title} în ${property.location} - Imagine principală ${selectedImage + 1} cu ${property.rooms} camere și ${formatSurface(property.surface_min, property.surface_max)}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-sm sm:text-base md:text-lg font-semibold bg-black/50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg">
                            Click pentru vedere mare
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Card>

                {property.images && property.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {property.images.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(idx);
                          setIsLightboxOpen(true);
                        }}
                        className={`aspect-video rounded-md sm:rounded-lg overflow-hidden border-2 transition-all hover:scale-105 touch-manipulation ${
                          selectedImage === idx
                            ? "border-gold shadow-lg"
                            : "border-transparent hover:border-gold/50"
                        }`}
                        aria-label={`Vizualizează imaginea ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${property.title} - Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Image Lightbox */}
                <ImageLightbox
                  images={property.images || []}
                  isOpen={isLightboxOpen}
                  onClose={() => setIsLightboxOpen(false)}
                  initialIndex={selectedImage}
                />
              </section>

              {/* Details Section */}
              <section className="space-y-4 sm:space-y-5 md:space-y-6" aria-label="Detalii proprietate">
                
                {/* Title & Location */}
                <header>
                  {property.availability_status === "available" && (
                    <Badge className="bg-green-600 text-white mb-2 sm:mb-3 text-[10px] sm:text-xs">
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Disponibil
                    </Badge>
                  )}
                  
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3">
                    {property.title}
                  </h1>
                  
                  {property.project_name && (
                    <p className="text-sm sm:text-base md:text-lg text-gold font-semibold mb-1.5 sm:mb-2">
                      {property.project_name}
                    </p>
                  )}
                  
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gold flex-shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg">{property.location}</span>
                  </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <Card className="border-gold/20">
                    <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                        <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1">Preț</div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">
                        {formatPrice(property.price_min, property.price_max)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gold/20">
                    <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                        <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1">Suprafață</div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">
                        {formatSurface(property.surface_min, property.surface_max)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gold/20">
                    <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1">Camere</div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground">
                        {property.rooms}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card className="border-gold/20">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">Descriere</h2>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <Card className="border-gold/20">
                    <CardContent className="p-3 sm:p-4 md:p-6">
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
                    <CardContent className="p-3 sm:p-4 md:p-6">
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

                {/* Action Buttons */}
                <div className="space-y-3">
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
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contactează pe WhatsApp
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
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
                </div>

              </section>
            </article>

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
                    <MessageCircle className="w-5 h-5 mr-2" />
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

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PropertyDetail;
