import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Home, 
  Ruler, 
  Euro,
  ArrowRight,
  Sparkles,
  Star,
  Loader2
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Link } from "react-router-dom"

const Properties = () => {
  // Fetch 12 random offers from catalog_offers
  const { data: randomOffers = [], isLoading } = useQuery({
    queryKey: ['random_offers_home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      
      // Shuffle and take 12
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 12);
    },
    refetchOnWindowFocus: false,
  })

  // Structured Data for Properties
  const propertiesStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": randomOffers.slice(0, 10).map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Apartment",
        "name": property.title,
        "description": property.description,
        "image": property.images?.[0] || "",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": property.location,
          "addressCountry": "RO"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": property.currency || "EUR",
          "price": property.price_min,
          "seller": {
            "@type": "RealEstateAgent",
            "name": "MVA Imobiliare"
          }
        },
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": property.surface_min || property.surface_max,
          "unitCode": "MTK"
        },
        "numberOfRooms": property.rooms
      }
    }))
  }

  const renderOffers = (offers: any[]) => (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 lg:gap-8 xl:gap-6">
      {offers.map((property) => (
        <Link to={`/proprietati/${property.id}`} key={property.id}>
          <Card 
            className="group relative overflow-hidden glass glass-hover touch-manipulation border-gold/20 h-full"
          >
            {property.is_featured && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                <Badge className="bg-gold text-primary-foreground shadow-lg text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recomandat
                </Badge>
              </div>
            )}
            
            {/* Image */}
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={property.images?.[0] || "/placeholder.svg"} 
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Price Badge */}
              <div className="absolute bottom-3 right-3 glass rounded-xl px-3 py-2 border border-gold/30">
                <div className="flex items-center text-gold font-bold">
                  <Euro className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="text-xs sm:text-sm">
                    {property.price_min?.toLocaleString()} {property.currency || 'EUR'}
                  </span>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title & Location */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold leading-tight text-foreground group-hover:text-gold transition-colors line-clamp-2">
                  {property.title}
                </h3>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                  <span className="font-medium text-xs sm:text-sm line-clamp-1">{property.location}</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg hover:bg-gold/5 transition-colors">
                  <div className="text-xs text-muted-foreground">Preț</div>
                  <div className="text-xs font-semibold text-foreground">
                    {property.price_min?.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-2 rounded-lg hover:bg-gold/5 transition-colors">
                  <div className="text-xs text-muted-foreground">mp</div>
                  <div className="text-xs font-semibold text-foreground">
                    {property.surface_min || property.surface_max || '-'}
                  </div>
                </div>
                
                <div className="text-center p-2 rounded-lg hover:bg-gold/5 transition-colors">
                  <div className="text-xs text-muted-foreground">Camere</div>
                  <div className="text-xs font-semibold text-foreground">{property.rooms}</div>
                </div>
              </div>
              
              {/* CTA Button */}
              <Button 
                variant="luxuryOutline" 
                className="w-full group h-9 text-sm"
              >
                Vezi Detalii
                <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )

  return (
    <section id="proprietati" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background to-secondary/20">
      {/* Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertiesStructuredData) }}
      />
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4 sm:mb-6 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Proiecte Exclusive
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8">
              <span className="text-foreground">Proprietăți </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Premium
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Descoperă selecția noastră de apartamente și case din București și împrejurimi, 
              cu finisaje moderne și prețuri competitive.
            </p>
            
            {/* Navigation CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/proprietati">
                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="group h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base w-full sm:w-auto"
                >
                  Vezi toate proprietățile
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/proiecte">
                <Button 
                  variant="luxuryOutline" 
                  size="lg" 
                  className="group h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base w-full sm:w-auto"
                >
                  Ansambluri rezidențiale
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Properties Grid */}
          <div className="mb-12 sm:mb-16">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : randomOffers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nu sunt disponibile proprietăți momentan.</p>
              </div>
            ) : (
              renderOffers(randomOffers)
            )}
          </div>

            {/* CTA Section */}
          <footer className="text-center">
            <div className="glass rounded-2xl lg:rounded-3xl p-6 sm:p-8 border border-gold/30 max-w-4xl mx-auto">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                Vrei să Explorezi Mai Mult?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed px-4 sm:px-0">
                Vezi toate proprietățile disponibile sau descoperă ansamblurile noastre rezidențiale premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link to="/proprietati">
                  <Button variant="luxury" size="lg" className="group px-6 sm:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-base w-full sm:w-auto">
                    Toate proprietățile
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/proiecte">
                  <Button variant="luxuryOutline" size="lg" className="group px-6 sm:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-base w-full sm:w-auto">
                    Ansambluri rezidențiale
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default Properties