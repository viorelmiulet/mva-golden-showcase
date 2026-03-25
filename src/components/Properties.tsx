import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Euro, ArrowRight, Sparkles, Loader2, Calendar, Zap } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Link } from "react-router-dom"
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage"
import { getPropertyUrl, generateImmofluxSlug, getImmofluxPropertyUrl } from "@/lib/propertySlug"
import ScrollReveal from "@/components/ScrollReveal"
import { ScheduleViewingDialog } from "@/components/ScheduleViewingDialog"
import { useMemo } from "react"
import { type ImmofluxProperty, getTitle, getMainImage, getSurface, isPoleProperty } from "@/hooks/useImmoflux"

const isCoordinates = (str: string | null | undefined): boolean => {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim());
};

const getDisplayLocation = (p: any): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  if (p.project_name) return p.project_name;
  return 'București';
};

const Properties = () => {
  const { data: catalogOffers = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['random_offers_home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .limit(100);
      if (error) throw error;
      return (data || []).sort(() => Math.random() - 0.5);
    },
    refetchOnWindowFocus: false,
  });

  // Fetch IMMOFLUX pole position / top properties
  const { data: immofluxFeatured = [], isLoading: isLoadingImmoflux } = useQuery({
    queryKey: ['immoflux-featured-home'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/immoflux-proxy/properties?page=1`, {
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const allProps: ImmofluxProperty[] = data.data || [];
      // Filter pole position and top properties
      return allProps.filter((p: any) => p.poleposition === 1 || p.top === 1).map((p: any) => ({
        id: `immoflux-${p.idnum}`,
        title: typeof p.titlu === 'object' ? p.titlu?.ro || `Proprietate #${p.idnum}` : String(p.titlu || `Proprietate #${p.idnum}`),
        description: typeof p.descriere === 'object' ? p.descriere?.ro || '' : String(p.descriere || ''),
        price_min: p.devanzare === 1 ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare),
        currency: p.devanzare === 1 ? (p.monedavanzare || 'EUR') : (p.monedainchiriere || 'EUR'),
        rooms: p.nrcamere,
        surface_min: typeof p.suprafatautila === 'string' ? parseFloat(p.suprafatautila) || null : p.suprafatautila,
        surface_max: null,
        images: (p.images || []).sort((a: any, b: any) => a.pozitie - b.pozitie).map((img: any) => img.src),
        location: p.localitate,
        zone: p.zona,
        city: p.localitate,
        is_featured: true,
        source: 'immoflux',
        _immoflux_id: p.idnum,
        _immoflux_slug: generateImmofluxSlug(p),
         _immoflux_pole: isPoleProperty(p),
        _immoflux_top: p.top === 1,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingCatalog || isLoadingImmoflux;

  // Merge: pole position first, then top, then random catalog offers
  const randomOffers = useMemo(() => {
    const poleProps = immofluxFeatured.filter((p: any) => p._immoflux_pole);
    const topProps = immofluxFeatured.filter((p: any) => p._immoflux_top && !p._immoflux_pole);
    const remainingSlots = 8 - poleProps.length - topProps.length;
    const catalogSlice = catalogOffers.slice(0, Math.max(0, remainingSlots));
    return [...poleProps, ...topProps, ...catalogSlice].slice(0, 8);
  }, [immofluxFeatured, catalogOffers]);

  const propertiesStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": randomOffers.slice(0, 8).map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Apartment",
        "name": property.title,
        "description": property.description,
        "image": property.images?.[0] || "",
        "address": { "@type": "PostalAddress", "addressLocality": property.location, "addressCountry": "RO" },
        "offers": { "@type": "Offer", "priceCurrency": property.currency || "EUR", "price": property.price_min },
        "numberOfRooms": property.rooms
      }
    }))
  };

  return (
    <section id="proprietati" className="py-16 sm:py-20 lg:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertiesStructuredData) }} />
      
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          
          <ScrollReveal>
            <header className="text-center mb-10 lg:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                <span className="text-foreground">Descoperă </span>
                <span className="text-gradient-gold">Proprietățile</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
                Selecția noastră de apartamente și case din București și împrejurimi.
              </p>
              <Link to="/proprietati">
                <Button variant="luxury" size="lg" className="group h-11 px-6 text-sm">
                  Vezi toate proprietățile
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : randomOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nu sunt disponibile proprietăți momentan.</p>
            ) : (
              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {randomOffers.map((property: any) => (
                  <Link to={property._immoflux_slug ? `/proprietate/${property._immoflux_slug}` : getPropertyUrl(property)} key={property.id}>
                    <Card className={`group overflow-hidden glass border transition-colors h-full relative ${property._immoflux_pole ? 'border-purple-500/40 hover:border-purple-500/60' : property._immoflux_top ? 'border-gold/40 hover:border-gold/60' : 'border-border/50 hover:border-gold/30'}`}>
                      {property._immoflux_pole ? (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-purple-600 text-white text-xs font-bold border-0 shadow-lg shadow-purple-600/30">
                            <Zap className="w-3 h-3 mr-1" />POLE POSITION
                          </Badge>
                        </div>
                      ) : property._immoflux_top ? (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-gold text-black text-xs font-bold border-0 shadow-lg shadow-gold/30">
                            <Sparkles className="w-3 h-3 mr-1" />TOP
                          </Badge>
                        </div>
                      ) : property.is_featured ? (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-gold text-primary-foreground text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />Recomandat
                          </Badge>
                        </div>
                      ) : null}
                      <div className="relative overflow-hidden">
                        <OptimizedPropertyImage
                          src={property.images?.[0]}
                          alt={`${property.title} - ${property.rooms || ''} camere`}
                          className="group-hover:scale-105 transition-transform duration-500"
                          aspectRatio="video"
                          width={640}
                          height={360}
                          quality={75}
                        />
                        <div className="absolute bottom-2 right-2 glass rounded-lg px-2.5 py-1.5 border border-border/50">
                          <div className="flex items-center text-gold font-bold text-xs">
                            <Euro className="w-3 h-3 mr-1" />
                            {property.price_min?.toLocaleString()} {property.currency || 'EUR'}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-muted-foreground text-xs">
                          <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                          <span className="line-clamp-1">{getDisplayLocation(property)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="text-center"><span className="text-[10px] text-muted-foreground block">Preț</span><span className="text-xs font-semibold text-foreground">{property.price_min?.toLocaleString()}</span></div>
                          <div className="text-center"><span className="text-[10px] text-muted-foreground block">mp</span><span className="text-xs font-semibold text-foreground">{property.surface_min || property.surface_max || '-'}</span></div>
                          <div className="text-center"><span className="text-[10px] text-muted-foreground block">Camere</span><span className="text-xs font-semibold text-foreground">{property.rooms}</span></div>
                        </div>
                        <div className="pt-2" onClick={(e) => e.preventDefault()}>
                          <ScheduleViewingDialog
                            propertyTitle={property.title}
                            propertyId={property.id}
                            trigger={
                              <Button variant="default" size="sm" className="w-full text-[10px] h-7 bg-primary hover:bg-primary/90">
                                <Calendar className="w-3 h-3 mr-1" />
                                Solicită vizionare
                              </Button>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default Properties;
