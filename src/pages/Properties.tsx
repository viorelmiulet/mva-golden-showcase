import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { 
  MapPin, 
  Euro, 
  Home, 
  Ruler,
  Loader2,
  ExternalLink,
  Images,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Calendar,
  Building,
  MessageCircle,
  Phone,
  Filter,
  Search,
  Heart
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { useFavorites } from "@/hooks/useFavorites"

interface ScrapedProperty {
  title: string
  description: string
  location: string
  images: string[]
  price_min: number
  price_max: number
  surface_min?: number
  surface_max?: number
  rooms: number
  features: string[]
}

const Properties = () => {
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<any>(null)
  const [priceFilter, setPriceFilter] = useState("all")
  const [roomsFilter, setRoomsFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  
  const [showFilters, setShowFilters] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites()

  // Fetch existing properties (exclude properties from residential complexes)
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog_offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Helper: detect transaction type from text when missing or incorrect
  const detectTransactionType = (property: any): 'sale' | 'rent' => {
    const base = `${property.title || ''} ${property.description || ''}`.toLowerCase()
    const text = base
      .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i')
      .replace(/ș/g,'s').replace(/ş/g,'s').replace(/ț/g,'t').replace(/ţ/g,'t')

    const rentKeywords = [
      'inchiriere', 'inchiriez', 'de inchiriat', 'chirie',
      'for rent', 'rent', 'se inchiriaza', 'se inchiriază'
    ]

    if (rentKeywords.some(k => text.includes(k))) return 'rent'
    return (property.transaction_type === 'rent' || property.transaction_type === 'sale')
      ? property.transaction_type
      : 'sale'
  }

  // Filter properties based on filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Price filter
      if (priceFilter && priceFilter !== "all") {
        const [minPrice, maxPrice] = priceFilter.split('-').map(p => parseInt(p))
        if (maxPrice) {
          if (property.price_min < minPrice || property.price_min > maxPrice) return false
        } else {
          if (property.price_min < minPrice) return false
        }
      }

      // Rooms filter
      if (roomsFilter && roomsFilter !== "all") {
        const selectedRooms = parseInt(roomsFilter)
        if (roomsFilter === "7") {
          // 7+ means 7 or more rooms
          if (property.rooms < 7) return false
        } else {
          // Exact match for other values
          if (property.rooms !== selectedRooms) return false
        }
      }

      // Zone filter (using extracted zone from title/description)
      if (locationFilter && locationFilter !== "all") {
        const propertyZone = extractZone(property)
        if (!propertyZone || propertyZone !== locationFilter) {
          return false
        }
      }

      // Transaction type filter
      if (transactionTypeFilter && transactionTypeFilter !== "all") {
        const txType = detectTransactionType(property)
        if (txType !== transactionTypeFilter) return false
      }

      return true
    })
  }, [properties, priceFilter, roomsFilter, locationFilter, transactionTypeFilter])

  // Extract zone from title or description
  function extractZone(property: any): string | null {
    const text = `${property.title || ''} ${property.description || ''}`.toUpperCase()
    
    // Common zones/neighborhoods to look for (ordered by priority - more specific first)
    const zones = [
      'MILITARI RESIDENCE',
      'RENEW RESIDENCE',
      'EUROCASA RESIDENCE',
      'COSMOPOLIS',
      'GREENFIELD',
      'VALEA CASCADELOR',
      'PRELUNGIREA GHENCEA',
      'PLAZA ROMANIA',
      '13 SEPTEMBRIE',
      'BUCURESTII NOI',
      'EROII REVOLUTIEI',
      'APARATORII PATRIEI',
      'POPESTI-LEORDENI',
      'POPESTI LEORDENI',
      'DRUMUL TABEREI',
      'AVIATIEI',
      'PIPERA',
      'BĂNEASA',
      'BANEASA',
      'FLOREASCA',
      'RAHOVA',
      'GHENCEA',
      'TITAN',
      'PANTELIMON',
      'BERCENI',
      'UNIRII',
      'VITAN',
      'DRISTOR',
      'IANCULUI',
      'OBOR',
      'COLENTINA',
      'METALURGIEI',
      'BRAGADIRU',
      'VOLUNTARI',
      'CHIAJNA',
      'MILITARI',
      'CRANGASI',
      'GIULESTI',
      'TIMISOARA',
      'LUJERULUI',
      'GROZAVESTI',
      'POLITEHNICA',
      'COTROCENI',
      'DOMENII',
      'VICTORIEI',
      'ROMANA',
      'UNIVERSITATE',
      'TINERETULUI',
      'GIURGIULUI',
      'SEBASTIAN',
      'ORIZONT'
    ]
    
    for (const zone of zones) {
      if (text.includes(zone)) {
        return zone
      }
    }
    
    return null
  }

  // Get unique zones for filter dropdown (using extractZone function)
  const uniqueZones = useMemo(() => {
    const zones = properties
      .map(p => extractZone(p))
      .filter(Boolean)
      .filter((zone): zone is string => zone !== null)
    return [...new Set(zones)].sort()
  }, [properties])

  const openPropertyGallery = (property: any) => {
    setSelectedProperty(property)
    setCurrentImageIndex(0)
  }

  const closeGallery = () => {
    setSelectedProperty(null)
    setCurrentImageIndex(0)
  }

  const openPropertyDetails = (property: any) => {
    setSelectedPropertyDetails(property)
  }

  const closePropertyDetails = () => {
    setSelectedPropertyDetails(null)
  }

  const nextImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prev) => 
        prev + 1 >= selectedProperty.images.length ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prev) => 
        prev - 1 < 0 ? selectedProperty.images.length - 1 : prev - 1
      )
    }
  }

  // Enhanced structured data for AI understanding
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Acasă",
        "item": "https://mva-imobiliare.lovable.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Proprietăți",
        "item": "https://mva-imobiliare.lovable.app/proprietati"
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Proprietăți disponibile de vânzare",
    "description": "Lista completă de apartamente și case premium disponibile pentru vânzare",
    "numberOfItems": filteredProperties.length,
    "itemListElement": filteredProperties.slice(0, 10).map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": property.rooms > 2 ? "House" : "Apartment",
        "@id": `https://mva-imobiliare.lovable.app/proprietati#${property.id}`,
        "name": property.title,
        "description": property.description,
        "image": property.images?.[0] || "",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": property.location,
          "addressRegion": "București",
          "addressCountry": "RO"
        },
        "numberOfRooms": property.rooms,
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": property.surface_min,
          "unitCode": "MTK"
        },
        "offers": {
          "@type": "Offer",
          "price": property.price_min,
          "priceCurrency": property.currency || "EUR",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "RealEstateAgent",
            "name": "MVA Imobiliare"
          }
        }
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>Proprietăți de Vânzare - Apartamente și Case | MVA Imobiliare</title>
        <meta name="description" content="Descoperă portofoliul nostru de apartamente și case premium de vânzare în Chiajna și vestul Bucureștiului. Proprietăți verificate cu finisaje de lux, preturi competitive și consultanță expertă." />
        <meta name="keywords" content="apartamente de vânzare București, case premium Chiajna, proprietăți vest București, apartamente noi, vânzare imobiliare, oferte apartamente" />
        <link rel="canonical" href="https://mvaimobiliare.ro/proprietati" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="Catalog complet de proprietăți imobiliare în București și Chiajna disponibile pentru vânzare și închiriere. Include apartamente cu 1-4 camere, case și proprietăți premium cu prețuri de la 30.000€ până la 200.000€+. Fiecare proprietate include detalii complete: suprafață, număr camere, locație, preț, fotografii și caracteristici. Contact direct: 0767941512." />
        <meta name="category" content="Real Estate Listings" />
        <meta name="inventory-size" content={`${filteredProperties.length} properties`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/proprietati" />
        <meta property="og:title" content="Proprietăți de Vânzare - MVA Imobiliare" />
        <meta property="og:description" content={`${filteredProperties.length} proprietăți disponibile în Chiajna și vestul Bucureștiului`} />
        <meta property="og:image" content={filteredProperties[0]?.images?.[0] || "https://mva-imobiliare.lovable.app/mva-logo-luxury-horizontal.svg"} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Proprietăți de Vânzare" />
        <meta property="twitter:description" content={`${filteredProperties.length} proprietăți verificate în București`} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(itemListSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12 px-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Ofertele Noastre
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Descoperă proprietățile noastre disponibile pentru vânzare
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 sm:mb-8">
              {/* Advanced Filters */}
                <Card className="glass border-[0.5px]">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* Transaction Type Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Tip tranzacție</label>
                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Selectează tipul" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate</SelectItem>
                            <SelectItem value="sale">Vânzare</SelectItem>
                            <SelectItem value="rent">Chirie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Price Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Preț (EUR)</label>
                        <Select value={priceFilter} onValueChange={setPriceFilter}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Selectează prețul" />
                          </SelectTrigger>
                           <SelectContent>
                            <SelectItem value="all">Toate prețurile</SelectItem>
                            <SelectItem value="0-50000">Sub 50.000 EUR</SelectItem>
                            <SelectItem value="50000-100000">50.000 - 100.000 EUR</SelectItem>
                            <SelectItem value="100000-200000">100.000 - 200.000 EUR</SelectItem>
                            <SelectItem value="200000-300000">200.000 - 300.000 EUR</SelectItem>
                            <SelectItem value="300000">Peste 300.000 EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rooms Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Camere</label>
                        <Select value={roomsFilter} onValueChange={setRoomsFilter}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Numărul de camere" />
                          </SelectTrigger>
                           <SelectContent>
                            <SelectItem value="all">Toate</SelectItem>
                            <SelectItem value="1">1 cameră</SelectItem>
                            <SelectItem value="2">2 camere</SelectItem>
                            <SelectItem value="3">3 camere</SelectItem>
                            <SelectItem value="4">4 camere</SelectItem>
                            <SelectItem value="5">5 camere</SelectItem>
                            <SelectItem value="6">6 camere</SelectItem>
                            <SelectItem value="7">7+ camere</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Zone Filter */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Zonă</label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Selectează zona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate zonele</SelectItem>
                            {uniqueZones.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {filteredProperties.length} proprietăți găsite
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPriceFilter("all")
                          setRoomsFilter("all")
                          setLocationFilter("all")
                          setTransactionTypeFilter("all")
                        }}
                        className="glass hover:glass-hover w-full sm:w-auto min-h-[44px] touch-manipulation"
                      >
                        Resetează filtrele
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Properties List */}
            {isLoadingProperties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : filteredProperties.length === 0 && properties.length > 0 ? (
              <Card className="max-w-2xl mx-auto glass border-[0.5px]">
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nu s-au găsit proprietăți</h3>
                  <p className="text-muted-foreground">Modifică filtrele pentru a găsi proprietăți</p>
                </CardContent>
              </Card>
            ) : properties.length === 0 ? (
              <Card className="max-w-2xl mx-auto glass border-[0.5px]">
                <CardContent className="py-12 text-center">
                  <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nu există proprietăți</h3>
                  <p className="text-muted-foreground">Proprietățile vor apărea aici după ce sunt adăugate</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-4 gap-6">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="group glass hover:glass-hover border-[0.5px] relative">
                    <CardContent className="p-6">
                      {/* Favorite Button */}
                      {isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(property.id, 'property')
                          }}
                          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          <Heart 
                            className={`w-5 h-5 transition-colors ${
                              isFavorite(property.id, 'property') 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground hover:text-red-500'
                            }`} 
                          />
                        </button>
                      )}
                      
                      {/* Images */}
                      {property.images && Array.isArray(property.images) && property.images.length > 0 && (
                        <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                          <img 
                            src={(property.images as string[])[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      {/* Title & Location with Source Badge */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-gold transition-colors flex-1">
                            {property.title}
                          </h3>
                          {(property.source === 'crm' || property.source === 'api') && (
                            <Badge variant="secondary" className="bg-gold/10 text-gold border-[0.5px] border-gold/20 ml-2">
                              Nou
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {property.location && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-gold" />
                              <span>{property.location}</span>
                            </div>
                          )}
                          <Badge 
                            variant={detectTransactionType(property) === 'rent' ? 'default' : 'secondary'}
                            className={detectTransactionType(property) === 'rent' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0' 
                              : 'bg-gold/20 hover:bg-gold/30 text-gold-dark border-gold/30 font-semibold'}
                          >
                            {detectTransactionType(property) === 'rent' ? 'Închiriere' : 'Vânzare'}
                          </Badge>
                          {extractZone(property) && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold">
                              {extractZone(property)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Euro className="w-5 h-5 text-gold" />
                          </div>
                          <div className="text-xs text-muted-foreground">Preț</div>
                          <div className="text-sm font-semibold">
                            {property.price_min?.toLocaleString('de-DE')} {property.currency || 'EUR'}
                            {property.price_max && property.price_max !== property.price_min && 
                              ` - ${property.price_max.toLocaleString('de-DE')} ${property.currency || 'EUR'}`
                            }
                          </div>
                        </div>

                        {(property.surface_min || property.surface_max) && (
                          <div className="text-center">
                            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                              <Ruler className="w-5 h-5 text-gold" />
                            </div>
                            <div className="text-xs text-muted-foreground">Suprafață</div>
                            <div className="text-sm font-semibold">
                              {property.surface_min}
                              {property.surface_max && property.surface_max !== property.surface_min && 
                                ` - ${property.surface_max}`
                              } mp
                            </div>
                          </div>
                        )}

                        <div className="text-center">
                          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Home className="w-5 h-5 text-gold" />
                          </div>
                          <div className="text-xs text-muted-foreground">Camere</div>
                          <div className="text-sm font-semibold">{property.rooms}</div>
                        </div>
                      </div>

                      {/* Description */}
                      {property.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {property.description}
                        </p>
                      )}

                      {/* Features */}
                      {property.features && Array.isArray(property.features) && property.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(property.features as string[]).slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="bg-gold/10 text-gold border-[0.5px] border-gold/20 text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {(property.features as string[]).length > 3 && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                              +{(property.features as string[]).length - 3} mai multe
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Project Name */}
                      {property.project_name && (
                        <div className="text-center p-3 bg-gold/10 rounded-lg border-[0.5px] border-gold/20 mb-4">
                          <p className="text-sm font-cormorant font-medium text-gold tracking-wide">
                            {property.project_name}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Call Now Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="hover:bg-gold/10 hover:border-gold text-xs h-8"
                          >
                            <a href="tel:0767941512">
                              <Phone className="w-3 h-3 mr-1" />
                              Sună
                            </a>
                          </Button>
                          
                          {/* WhatsApp Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="hover:bg-green-50 hover:border-green-400 text-xs h-8"
                          >
                            <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              WhatsApp
                            </a>
                          </Button>
                        </div>
                        <Button 
                          asChild
                          className="w-full text-xs h-8"
                          size="sm"
                        >
                          <Link to={`/proprietati/${property.id}`}>
                            <Info className="w-3 h-3 mr-1" />
                            Vezi Detalii
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

      {/* Image Gallery Modal */}
      <Dialog open={!!selectedProperty} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedProperty?.title}</span>
              <Button variant="ghost" size="sm" onClick={closeGallery}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedProperty && selectedProperty.images && (
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-video bg-muted">
                <img
                  src={(selectedProperty.images as string[])[currentImageIndex]}
                  alt={`${selectedProperty.title} - Imagine ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Buttons */}
                {(selectedProperty.images as string[]).length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {(selectedProperty.images as string[]).length}
                </div>
              </div>
              
              {/* Thumbnail Navigation */}
              {(selectedProperty.images as string[]).length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {(selectedProperty.images as string[]).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex 
                            ? 'border-primary' 
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Property Info */}
              <div className="p-6 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gold">{selectedProperty.price_min?.toLocaleString('de-DE')} {selectedProperty.currency || 'EUR'}</div>
                    <div className="text-sm text-muted-foreground">Preț</div>
                  </div>
                  {selectedProperty.surface_min && (
                    <div>
                      <div className="text-2xl font-bold">{selectedProperty.surface_min} mp</div>
                      <div className="text-sm text-muted-foreground">Suprafață</div>
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold">{selectedProperty.rooms}</div>
                    <div className="text-sm text-muted-foreground">Camere</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gold">{(selectedProperty.images as string[]).length}</div>
                    <div className="text-sm text-muted-foreground">Poze</div>
                  </div>
                </div>
                
                {selectedProperty.location && (
                  <div className="mt-4 flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-gold" />
                    <span>{selectedProperty.location}</span>
                  </div>
                )}
                
                {selectedProperty.storia_link && (
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <a href={selectedProperty.storia_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Vezi Anunțul Original
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Property Details Modal */}
      <Dialog open={!!selectedPropertyDetails} onOpenChange={closePropertyDetails}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">
              {selectedPropertyDetails?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedPropertyDetails && (
            <div className="space-y-6">
              {/* Main Image */}
              {selectedPropertyDetails.images && Array.isArray(selectedPropertyDetails.images) && selectedPropertyDetails.images.length > 0 && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img 
                    src={(selectedPropertyDetails.images as string[])[0]} 
                    alt={selectedPropertyDetails.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Key Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Euro className="w-8 h-8 text-gold mx-auto mb-2" />
                  <div className="font-bold text-lg">{selectedPropertyDetails.price_min?.toLocaleString('de-DE')} {selectedPropertyDetails.currency || 'EUR'}</div>
                  {selectedPropertyDetails.price_max && selectedPropertyDetails.price_max !== selectedPropertyDetails.price_min && (
                    <div className="text-sm text-muted-foreground">- {selectedPropertyDetails.price_max.toLocaleString('de-DE')} {selectedPropertyDetails.currency || 'EUR'}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">Preț</div>
                </div>

                {(selectedPropertyDetails.surface_min || selectedPropertyDetails.surface_max) && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Ruler className="w-8 h-8 text-gold mx-auto mb-2" />
                    <div className="font-bold text-lg">
                      {selectedPropertyDetails.surface_min}
                      {selectedPropertyDetails.surface_max && selectedPropertyDetails.surface_max !== selectedPropertyDetails.surface_min && 
                        ` - ${selectedPropertyDetails.surface_max}`
                      } mp
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Suprafață</div>
                  </div>
                )}

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Home className="w-8 h-8 text-gold mx-auto mb-2" />
                  <div className="font-bold text-lg">{selectedPropertyDetails.rooms}</div>
                  <div className="text-xs text-muted-foreground mt-1">Camere</div>
                </div>

                {selectedPropertyDetails.images && Array.isArray(selectedPropertyDetails.images) && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Images className="w-8 h-8 text-gold mx-auto mb-2" />
                    <div className="font-bold text-lg">{(selectedPropertyDetails.images as string[]).length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Imagini</div>
                  </div>
                )}
              </div>

              {/* Location */}
              {selectedPropertyDetails.location && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gold" />
                    Locație
                  </h3>
                  <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedPropertyDetails.location}
                  </p>
                </div>
              )}

              {/* Project Name */}
              {selectedPropertyDetails.project_name && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building className="w-5 h-5 text-gold" />
                    Proiect
                  </h3>
                  <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg font-cormorant text-lg font-medium tracking-wide">
                    {selectedPropertyDetails.project_name}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedPropertyDetails.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Descriere Completă</h3>
                  <div className="text-muted-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap break-words max-h-none overflow-visible">
                    {selectedPropertyDetails.description}
                  </div>
                </div>
              )}

              {/* Features */}
              {selectedPropertyDetails.features && Array.isArray(selectedPropertyDetails.features) && selectedPropertyDetails.features.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Caracteristici</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedPropertyDetails.features as string[]).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {selectedPropertyDetails.amenities && Array.isArray(selectedPropertyDetails.amenities) && selectedPropertyDetails.amenities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Facilități</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedPropertyDetails.amenities as string[]).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="border-gold/30 text-foreground">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPropertyDetails.availability_status && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Status</h4>
                    <Badge 
                      variant={selectedPropertyDetails.availability_status === 'available' ? 'default' : 'secondary'}
                      className={selectedPropertyDetails.availability_status === 'available' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {selectedPropertyDetails.availability_status === 'available' ? 'Disponibil' : selectedPropertyDetails.availability_status}
                    </Badge>
                  </div>
                )}
                
                {selectedPropertyDetails.created_at && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold" />
                      Adăugat la
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPropertyDetails.created_at).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {selectedPropertyDetails.images && Array.isArray(selectedPropertyDetails.images) && selectedPropertyDetails.images.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      closePropertyDetails()
                      openPropertyGallery(selectedPropertyDetails)
                    }}
                    className="flex-1"
                  >
                    <Images className="w-4 h-4 mr-2" />
                    Vezi Toate Pozele ({(selectedPropertyDetails.images as string[]).length})
                  </Button>
                )}
                
                {selectedPropertyDetails.storia_link && (
                  <Button variant="outline" asChild className="flex-1">
                    <a href={selectedPropertyDetails.storia_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Vezi Anunțul Original
                    </a>
                  </Button>
                )}
                
                <Button asChild className="flex-1">
                  <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactează-ne pe WhatsApp
                  </a>
                </Button>
                  </div>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
    </>
  )
}

export default Properties