import { useState, useEffect } from "react"
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
  ExternalLink
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface CatalogOffer {
  id: string
  title: string
  description: string
  price_min: number
  price_max: number
  surface_min: number | null
  surface_max: number | null
  rooms: number
  location: string
  project_name: string | null
  features: string[]
  amenities: string[]
  availability_status: string
  whatsapp_catalog_id: string | null
  storia_link: string | null
}

const Properties = () => {
  const [offers, setOffers] = useState<CatalogOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('catalog_offers')
          .select('*')
          .eq('availability_status', 'available')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching offers:', error)
        } else {
          setOffers(data || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])
  // Group offers by project
  const groupedOffers = offers.reduce((acc, offer) => {
    const projectName = offer.project_name || 'Altele'
    if (!acc[projectName]) {
      acc[projectName] = []
    }
    acc[projectName].push(offer)
    return acc
  }, {} as Record<string, CatalogOffer[]>)

  const formatPrice = (min: number, max?: number) => {
    if (max && max !== min) {
      return `€${min.toLocaleString()} - €${max.toLocaleString()}`
    }
    return `€${min.toLocaleString()}`
  }

  const formatSurface = (min: number | null, max?: number | null) => {
    if (!min) return "N/A"
    if (max && max !== min) {
      return `${min} - ${max} mp`
    }
    return `${min} mp`
  }

  // Structured Data for Properties
  const propertiesStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": offers.map((offer, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Residence",
        "name": offer.title,
        "description": offer.description,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": offer.location,
          "addressCountry": "RO"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": offer.price_min,
          "seller": {
            "@type": "RealEstateAgent",
            "name": "MVA Imobiliare"
          }
        },
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": offer.surface_min
        },
        "numberOfRooms": offer.rooms
      }
    }))
  }

  const renderOffers = (offersToShow: CatalogOffer[]) => {
    if (loading) {
      return (
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (offersToShow.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Nu există oferte disponibile momentan.</p>
        </div>
      )
    }

    return (
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
        {offersToShow.map((offer) => (
          <Card 
            key={offer.id} 
            className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-border/30 bg-card/50 backdrop-blur-sm hover:border-gold/50"
          >
            {offer.project_name === 'MILITARI RESIDENCE' && (
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
                <Badge className="bg-gold text-primary-foreground shadow-lg text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Storia
                </Badge>
              </div>
            )}
            
            {/* Project Image Placeholder */}
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <Home className="w-12 h-12 text-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-gold">{offer.project_name || 'Apartament'}</p>
                </div>
              </div>
              
              {/* Price Badge */}
              <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gold/20">
                <div className="flex items-center text-gold font-bold">
                  <Euro className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatPrice(offer.price_min, offer.price_max)}</span>
                </div>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-4 sm:space-y-6">
              
              {/* Title & Location */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-foreground group-hover:text-gold transition-colors">
                  {offer.title}
                </h2>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-gold" />
                  <span className="font-medium">{offer.location}</span>
                </div>
              </div>
            
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Preț</div>
                  <div className="text-xs sm:text-sm font-semibold text-foreground">{formatPrice(offer.price_min, offer.price_max)}</div>
                </div>
                
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Suprafață</div>
                  <div className="text-xs sm:text-sm font-semibold text-foreground">{formatSurface(offer.surface_min, offer.surface_max)}</div>
                </div>
                
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Camere</div>
                  <div className="text-xs sm:text-sm font-semibold text-foreground">{offer.rooms} {offer.rooms === 1 ? 'cameră' : 'camere'}</div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2">
                {offer.description}
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {offer.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                    {feature}
                  </Badge>
                ))}
                {offer.features.length > 3 && (
                  <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                    +{offer.features.length - 3} mai multe
                  </Badge>
                )}
              </div>
            
              {/* CTA Buttons */}
              <div className="flex gap-2">
                {offer.storia_link ? (
                  <a href={offer.storia_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="luxuryOutline" size="sm" className="w-full group text-xs">
                      Vezi pe Storia
                      <ExternalLink className="ml-1 w-3 h-3" />
                    </Button>
                  </a>
                ) : (
                  <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="luxuryOutline" size="sm" className="w-full group text-xs">
                      Contactează-ne
                      <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                )}
                
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="luxury" size="sm" className="w-full group text-xs">
                    WhatsApp
                    <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <section id="proprietati" className="py-24 bg-gradient-to-b from-background to-secondary/20">
      {/* Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertiesStructuredData) }}
      />
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              <Star className="w-4 h-4 mr-2" />
              Proiecte Exclusive
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Proprietăți </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Premium
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Descoperă {offers.length} apartamente disponibile din vestul Bucureștiului, 
              actualizate automat din Storia și OLX.
            </p>
            
            {/* See All Apartments CTA */}
            <div className="mt-8">
              <Button 
                variant="luxuryOutline" 
                size="lg" 
                className="group"
                onClick={() => {
                  if ((window as any).Tawk_API) {
                    (window as any).Tawk_API.toggle();
                  }
                }}
              >
                Contactează-ne acum
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </header>

          {/* Properties Tabs */}
          <div className="mb-16">
            <Tabs defaultValue="toate" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-sm sm:max-w-md mx-auto mb-8 sm:mb-12 bg-background/50 backdrop-blur-sm border border-gold/20">
                <TabsTrigger 
                  value="toate" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                >
                  Toate
                </TabsTrigger>
                <TabsTrigger 
                  value="disponibile"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                >
                  Disponibile
                </TabsTrigger>
                <TabsTrigger 
                  value="catalog"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm cursor-pointer"
                  onClick={() => window.open('https://wa.me/40767941512', '_blank')}
                >
                  Vezi catalogul
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="toate" className="mt-0">
                {renderOffers(offers)}
              </TabsContent>
              
              <TabsContent value="disponibile" className="mt-0">
                {renderOffers(offers.filter(offer => offer.availability_status === 'available'))}
              </TabsContent>
            </Tabs>
          </div>

          {/* CTA Section */}
          <footer className="text-center">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-2xl p-8 border border-gold/20 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Explorează Toate Apartamentele Disponibile
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Explorează catalogul nostru complet pentru a vedea toate opțiunile 
                disponibile, planuri detaliate și programarea vizitelor.
              </p>
              <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                <Button variant="luxury" size="lg" className="group px-8">
                  Vezi toate ofertele
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default Properties