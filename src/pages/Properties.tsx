import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  Phone,
  Filter,
  Search,
  Heart,
  Bath,
  Construction
} from "lucide-react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Breadcrumbs from "@/components/Breadcrumbs"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { useFavorites } from "@/hooks/useFavorites"
import { RecentlyViewed } from "@/components/RecentlyViewed"
import { PropertyGridSkeleton } from "@/components/skeletons"
import { useLanguage } from "@/contexts/LanguageContext"
import { ImageLightbox } from "@/components/ImageLightbox"

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
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)
  
  const [priceMin, setPriceMin] = useState<string>("")
  const [priceMax, setPriceMax] = useState<string>("")
  const [roomsFilter, setRoomsFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  // Advanced filters
  const [floorFilter, setFloorFilter] = useState("all")
  const [bathroomsFilter, setBathroomsFilter] = useState("all")
  const [yearBuiltFilter, setYearBuiltFilter] = useState("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  const [showFilters, setShowFilters] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites()
  const { t, language } = useLanguage()

  // Fetch existing properties (exclude properties from residential complexes and hidden ones)
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog_offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .neq('is_published', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 0, // Force fresh data
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
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
      // Price range filter
      const minPriceValue = priceMin ? parseInt(priceMin) : null
      const maxPriceValue = priceMax ? parseInt(priceMax) : null
      
      if (minPriceValue !== null && property.price_min < minPriceValue) return false
      if (maxPriceValue !== null && property.price_min > maxPriceValue) return false

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

      // Floor filter
      if (floorFilter && floorFilter !== "all") {
        if (floorFilter === "ground") {
          if (property.floor !== 0) return false
        } else if (floorFilter === "top") {
          if (!property.floor || !property.total_floors || property.floor !== property.total_floors) return false
        } else {
          const selectedFloor = parseInt(floorFilter)
          if (property.floor !== selectedFloor) return false
        }
      }

      // Bathrooms filter
      if (bathroomsFilter && bathroomsFilter !== "all") {
        const selectedBathrooms = parseInt(bathroomsFilter)
        if (bathroomsFilter === "3") {
          // 3+ means 3 or more bathrooms
          if (!property.bathrooms || property.bathrooms < 3) return false
        } else {
          if (property.bathrooms !== selectedBathrooms) return false
        }
      }

      // Year built filter
      if (yearBuiltFilter && yearBuiltFilter !== "all") {
        if (!property.year_built) return false
        const currentYear = new Date().getFullYear()
        if (yearBuiltFilter === "new") {
          // Last 2 years
          if (property.year_built < currentYear - 2) return false
        } else if (yearBuiltFilter === "recent") {
          // Last 5 years
          if (property.year_built < currentYear - 5) return false
        } else if (yearBuiltFilter === "2010s") {
          // 2010-2019
          if (property.year_built < 2010 || property.year_built > 2019) return false
        } else if (yearBuiltFilter === "older") {
          // Before 2010
          if (property.year_built >= 2010) return false
        }
      }

      // Property type filter
      if (propertyTypeFilter && propertyTypeFilter !== "all") {
        const propType = (property.property_type || '').toLowerCase()
        const title = (property.title || '').toLowerCase()
        
        if (propertyTypeFilter === "apartament") {
          if (!propType.includes('apartament') && !title.includes('apartament') && !title.includes('garsoniera')) return false
        } else if (propertyTypeFilter === "casa") {
          if (!propType.includes('casa') && !propType.includes('vila') && !title.includes('casa') && !title.includes('vila')) return false
        } else if (propertyTypeFilter === "penthouse") {
          if (!propType.includes('penthouse') && !title.includes('penthouse')) return false
        } else if (propertyTypeFilter === "studio") {
          if (!propType.includes('studio') && !propType.includes('garsoniera') && !title.includes('studio') && !title.includes('garsoniera')) return false
        }
      }

      return true
    })
  }, [properties, priceMin, priceMax, roomsFilter, locationFilter, transactionTypeFilter, floorFilter, bathroomsFilter, yearBuiltFilter, propertyTypeFilter])

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

  const openPropertyGallery = (property: any, index = 0) => {
    setSelectedProperty(property)
    setGalleryInitialIndex(index)
  }

  const closeGallery = () => {
    setSelectedProperty(null)
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
      
      <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Breadcrumbs */}
            <Breadcrumbs items={[{ label: t.properties?.title || 'Proprietăți' }]} />

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 md:mb-12 px-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {t.properties?.title || 'Ofertele Noastre'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
                {t.properties?.subtitle || 'Descoperă proprietățile noastre disponibile pentru vânzare'}
              </p>
            </div>

            {/* Filters */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              {/* Advanced Filters */}
                <Card className="glass border-[0.5px]">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                      {/* Transaction Type Filter */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                          {language === 'ro' ? 'Tip tranzacție' : 'Transaction type'}
                        </label>
                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                          <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder={language === 'ro' ? 'Selectează tipul' : 'Select type'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                            <SelectItem value="sale">{t.properties?.forSale || 'Vânzare'}</SelectItem>
                            <SelectItem value="rent">{t.properties?.forRent || 'Chirie'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Price Range Filter */}
                      <div className="col-span-2 lg:col-span-2">
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                          {t.properties?.price || 'Preț'} (EUR)
                        </label>
                        <div className="flex gap-1.5 sm:gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            className="glass h-9 sm:h-10 text-xs sm:text-sm"
                            min={0}
                          />
                          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            className="glass h-9 sm:h-10 text-xs sm:text-sm"
                            min={0}
                          />
                        </div>
                      </div>

                      {/* Rooms Filter */}
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                          {t.properties?.rooms || 'Camere'}
                        </label>
                        <Select value={roomsFilter} onValueChange={setRoomsFilter}>
                          <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder={t.properties?.rooms || 'Camere'} />
                          </SelectTrigger>
                           <SelectContent>
                            <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                            <SelectItem value="1">1 {language === 'ro' ? 'cameră' : 'room'}</SelectItem>
                            <SelectItem value="2">2 {t.properties?.rooms || 'camere'}</SelectItem>
                            <SelectItem value="3">3 {t.properties?.rooms || 'camere'}</SelectItem>
                            <SelectItem value="4">4 {t.properties?.rooms || 'camere'}</SelectItem>
                            <SelectItem value="5">5 {t.properties?.rooms || 'camere'}</SelectItem>
                            <SelectItem value="6">6 {t.properties?.rooms || 'camere'}</SelectItem>
                            <SelectItem value="7">7+ {t.properties?.rooms || 'camere'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Zone Filter */}
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                          {language === 'ro' ? 'Zonă' : 'Zone'}
                        </label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder={language === 'ro' ? 'Zonă' : 'Zone'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{language === 'ro' ? 'Toate zonele' : 'All zones'}</SelectItem>
                            {uniqueZones.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="mt-3 sm:mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-xs sm:text-sm text-gold hover:text-gold/80"
                      >
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        {showAdvancedFilters 
                          ? (language === 'ro' ? 'Ascunde filtre avansate' : 'Hide advanced filters')
                          : (language === 'ro' ? 'Arată filtre avansate' : 'Show advanced filters')
                        }
                      </Button>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                          {/* Floor Filter */}
                          <div>
                            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                              {language === 'ro' ? 'Etaj' : 'Floor'}
                            </label>
                            <Select value={floorFilter} onValueChange={setFloorFilter}>
                              <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder={language === 'ro' ? 'Etaj' : 'Floor'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                                <SelectItem value="ground">{language === 'ro' ? 'Parter' : 'Ground floor'}</SelectItem>
                                <SelectItem value="1">{language === 'ro' ? 'Etaj 1' : 'Floor 1'}</SelectItem>
                                <SelectItem value="2">{language === 'ro' ? 'Etaj 2' : 'Floor 2'}</SelectItem>
                                <SelectItem value="3">{language === 'ro' ? 'Etaj 3' : 'Floor 3'}</SelectItem>
                                <SelectItem value="4">{language === 'ro' ? 'Etaj 4' : 'Floor 4'}</SelectItem>
                                <SelectItem value="5">{language === 'ro' ? 'Etaj 5+' : 'Floor 5+'}</SelectItem>
                                <SelectItem value="top">{language === 'ro' ? 'Ultimul etaj' : 'Top floor'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Bathrooms Filter */}
                          <div>
                            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                              {language === 'ro' ? 'Băi' : 'Bathrooms'}
                            </label>
                            <Select value={bathroomsFilter} onValueChange={setBathroomsFilter}>
                              <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder={language === 'ro' ? 'Băi' : 'Bathrooms'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                                <SelectItem value="1">1 {language === 'ro' ? 'baie' : 'bathroom'}</SelectItem>
                                <SelectItem value="2">2 {language === 'ro' ? 'băi' : 'bathrooms'}</SelectItem>
                                <SelectItem value="3">3+ {language === 'ro' ? 'băi' : 'bathrooms'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Year Built Filter */}
                          <div>
                            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                              {language === 'ro' ? 'An construcție' : 'Year built'}
                            </label>
                            <Select value={yearBuiltFilter} onValueChange={setYearBuiltFilter}>
                              <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder={language === 'ro' ? 'An' : 'Year'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                                <SelectItem value="new">{language === 'ro' ? 'Construcție nouă (2+ ani)' : 'New build (2+ years)'}</SelectItem>
                                <SelectItem value="recent">{language === 'ro' ? 'Recent (5 ani)' : 'Recent (5 years)'}</SelectItem>
                                <SelectItem value="2010s">2010 - 2019</SelectItem>
                                <SelectItem value="older">{language === 'ro' ? 'Înainte de 2010' : 'Before 2010'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Property Type Filter */}
                          <div>
                            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                              {language === 'ro' ? 'Tip proprietate' : 'Property type'}
                            </label>
                            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                              <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder={language === 'ro' ? 'Tip' : 'Type'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t.common?.all || 'Toate'}</SelectItem>
                                <SelectItem value="apartament">{language === 'ro' ? 'Apartament' : 'Apartment'}</SelectItem>
                                <SelectItem value="casa">{language === 'ro' ? 'Casă / Vilă' : 'House / Villa'}</SelectItem>
                                <SelectItem value="penthouse">Penthouse</SelectItem>
                                <SelectItem value="studio">{language === 'ro' ? 'Garsonieră / Studio' : 'Studio'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clear Filters */}
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {filteredProperties.length} proprietăți găsite
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPriceMin("")
                          setPriceMax("")
                          setRoomsFilter("all")
                          setLocationFilter("all")
                          setTransactionTypeFilter("all")
                          setFloorFilter("all")
                          setBathroomsFilter("all")
                          setYearBuiltFilter("all")
                          setPropertyTypeFilter("all")
                        }}
                        className="glass hover:glass-hover w-full sm:w-auto min-h-[44px] touch-manipulation"
                      >
                        Resetează filtrele
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Recently Viewed Section */}
            <RecentlyViewed className="mb-8" maxItems={6} />

            {/* Properties List */}
            {isLoadingProperties ? (
              <PropertyGridSkeleton count={8} />
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
                            alt={`${property.title} - apartament ${property.rooms || ''} camere${property.surface_min ? `, ${property.surface_min} mp` : ''} în ${property.location || 'București'}, preț ${property.price_min?.toLocaleString('de-DE')} ${property.currency || 'EUR'}`}
                            title={`${property.title} - ${property.price_min?.toLocaleString('de-DE')} ${property.currency || 'EUR'}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            itemProp="image"
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
                            €{property.price_min?.toLocaleString('de-DE')}
                          </div>
                        </div>

                        {(property.surface_min || property.surface_max) && (
                          <div className="text-center">
                            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                              <Ruler className="w-5 h-5 text-gold" />
                            </div>
                            <div className="text-xs text-muted-foreground">Suprafață</div>
                            <div className="text-sm font-semibold">
                              {property.surface_min || property.surface_max || '-'} mp
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

                      {/* Extra Details Row */}
                      {(property.floor !== null || property.bathrooms || property.year_built || property.heating || property.building_type || property.parking) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-muted-foreground">
                          {property.floor !== null && property.floor !== undefined && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gold" />
                              Etaj {property.floor}{property.total_floors ? `/${property.total_floors}` : ''}
                            </span>
                          )}
                          {property.bathrooms !== null && property.bathrooms !== undefined && (
                            <span className="flex items-center gap-1">
                              <Bath className="w-3 h-3 text-gold" />
                              {property.bathrooms} {property.bathrooms === 1 ? 'baie' : 'băi'}
                            </span>
                          )}
                          {property.year_built && (
                            <span className="flex items-center gap-1">
                              <Construction className="w-3 h-3 text-gold" />
                              {property.year_built}
                            </span>
                          )}
                          {property.parking !== null && property.parking !== undefined && property.parking > 0 && (
                            <span>🅿️ {property.parking} loc{property.parking > 1 ? 'uri' : ''}</span>
                          )}
                          {property.surface_land && (
                            <span>🏗️ Teren {property.surface_land} mp</span>
                          )}
                        </div>
                      )}

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

                      {/* Agent / Agency */}
                      {(property.agent || property.agency) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Building className="w-3 h-3 text-gold flex-shrink-0" />
                          <span className="truncate">
                            {property.agent && property.agency 
                              ? `${property.agent} • ${property.agency}`
                              : property.agent || property.agency
                            }
                          </span>
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
                              <WhatsAppIcon className="w-3 h-3 mr-1" />
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

      {/* Image Gallery - Optimized Lightbox with swipe */}
      <ImageLightbox
        images={selectedProperty?.images || []}
        isOpen={!!selectedProperty}
        onClose={closeGallery}
        initialIndex={galleryInitialIndex}
      />

      <Footer />
    </div>
    </>
  )
}

export default Properties