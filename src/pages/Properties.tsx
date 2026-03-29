import { useState, useMemo, lazy, Suspense } from "react"

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
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage"
import { useFavorites } from "@/hooks/useFavorites"
import { PropertyGridSkeleton } from "@/components/skeletons"
import { useLanguage } from "@/contexts/LanguageContext"
import { getPropertyUrl, generateImmofluxSlug, getImmofluxPropertyUrl } from "@/lib/propertySlug"
import { ScheduleViewingDialog } from "@/components/ScheduleViewingDialog"

// Lazy load heavy components
const RecentlyViewed = lazy(() => import("@/components/RecentlyViewed").then(m => ({ default: m.RecentlyViewed })));
const ImageLightbox = lazy(() => import("@/components/ImageLightbox").then(m => ({ default: m.ImageLightbox })));

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
  const [visibleCount, setVisibleCount] = useState(12)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites()
  const { t, language } = useLanguage()

  const pageText = useMemo(() => ({
    transactionType: language === 'ro' ? 'Tip tranzacție' : 'Transaction type',
    selectTransactionType: language === 'ro' ? 'Selectează tipul' : 'Select transaction type',
    zone: language === 'ro' ? 'Zonă' : 'Zone',
    allZones: language === 'ro' ? 'Toate zonele' : 'All zones',
    showAdvancedFilters: language === 'ro' ? 'Arată filtre avansate' : 'Show advanced filters',
    hideAdvancedFilters: language === 'ro' ? 'Ascunde filtre avansate' : 'Hide advanced filters',
    resultsCount: language === 'ro' ? 'proprietăți găsite' : 'properties found',
    resetFilters: language === 'ro' ? 'Resetează filtrele' : 'Reset filters',
    noFilteredResultsTitle: language === 'ro' ? 'Nu s-au găsit proprietăți' : 'No properties found',
    noFilteredResultsDescription: language === 'ro' ? 'Modifică filtrele pentru a găsi proprietăți' : 'Adjust the filters to find properties',
    noPropertiesTitle: language === 'ro' ? 'Nu există proprietăți' : 'No properties available',
    noPropertiesDescription: language === 'ro' ? 'Proprietățile vor apărea aici după ce sunt adăugate' : 'Properties will appear here after they are added',
    call: language === 'ro' ? 'Sună' : 'Call',
  }), [language])

  // Fetch all properties (local + synced IMMOFLUX from catalog_offers)
  const { data: catalogProperties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog_offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .neq('is_published', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []).map((p: any) => {
        const isImmoflux = p.crm_source === 'immoflux' || p.source === 'immoflux';
        const immofluxId = isImmoflux && p.external_id ? Number(String(p.external_id).replace('immoflux-', '')) : null;
        return {
          ...p,
          _immoflux_id: immofluxId,
          _immoflux_slug: isImmoflux && immofluxId ? generateImmofluxSlug({
            idnum: immofluxId,
            nrcamere: p.rooms,
            zona: p.zone,
            localitate: p.location || p.city,
          } as any) : null,
          _immoflux_top: isImmoflux && p.promotion_type === 'top',
          _immoflux_pole: isImmoflux && p.promotion_type === 'pole_position',
        }
      })
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  })

  const properties = useMemo(() => {
    return [...catalogProperties].sort((a: any, b: any) => {
      const aPole = a._immoflux_pole ? 2 : 0;
      const bPole = b._immoflux_pole ? 2 : 0;
      const aTop = a._immoflux_top ? 1 : 0;
      const bTop = b._immoflux_top ? 1 : 0;
      return (bPole + bTop) - (aPole + aTop);
    });
  }, [catalogProperties]);

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

  // Memoized zone extraction cache
  const propertyZones = useMemo(() => {
    const zoneMap = new Map<string, string | null>();
    const knownZones = [
      'MILITARI RESIDENCE', 'RENEW RESIDENCE', 'EUROCASA RESIDENCE',
      'COSMOPOLIS', 'GREENFIELD', 'VALEA CASCADELOR', 'PRELUNGIREA GHENCEA',
      'PLAZA ROMANIA', '13 SEPTEMBRIE', 'BUCURESTII NOI', 'EROII REVOLUTIEI',
      'APARATORII PATRIEI', 'POPESTI-LEORDENI', 'POPESTI LEORDENI',
      'DRUMUL TABEREI', 'AVIATIEI', 'PIPERA', 'BĂNEASA', 'BANEASA',
      'FLOREASCA', 'RAHOVA', 'GHENCEA', 'TITAN', 'PANTELIMON', 'BERCENI',
      'UNIRII', 'VITAN', 'DRISTOR', 'IANCULUI', 'OBOR', 'COLENTINA',
      'METALURGIEI', 'BRAGADIRU', 'VOLUNTARI', 'CHIAJNA', 'MILITARI',
      'CRANGASI', 'GIULESTI', 'TIMISOARA', 'LUJERULUI', 'GROZAVESTI',
      'POLITEHNICA', 'COTROCENI', 'DOMENII', 'VICTORIEI', 'ROMANA',
      'UNIVERSITATE', 'TINERETULUI', 'GIURGIULUI', 'SEBASTIAN', 'ORIZONT'
    ];

    for (const property of properties) {
      const text = `${property.title || ''} ${property.description || ''}`.toUpperCase();
      let found: string | null = null;
      for (const zone of knownZones) {
        if (text.includes(zone)) {
          found = zone;
          break;
        }
      }
      zoneMap.set(property.id, found);
    }

    return zoneMap;
  }, [properties]);

  const extractZone = (property: any): string | null => {
    return propertyZones.get(property.id) ?? null;
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

  // Paginated properties for rendering
  const visibleProperties = useMemo(() => {
    return filteredProperties.slice(0, visibleCount)
  }, [filteredProperties, visibleCount])

  // Reset visible count when filters change
  const resetFilters = () => {
    setPriceMin("")
    setPriceMax("")
    setRoomsFilter("all")
    setLocationFilter("all")
    setTransactionTypeFilter("all")
    setFloorFilter("all")
    setBathroomsFilter("all")
    setYearBuiltFilter("all")
    setPropertyTypeFilter("all")
    setVisibleCount(12)
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
          "addressLocality": getDisplayLocation(property),
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
        <title>Apartamente de Vânzare Militari Sector 6 – MVA Imobiliare</title>
        <meta name="description" content="Vezi toate apartamentele de vânzare din cartierul Militari: garsoniere, 2 camere, 3 camere în Gorjului, Lujerului, Iuliu Maniu. Prețuri actualizate, agenție locală." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="apartamente vânzare Militari, garsoniere Gorjului, 2 camere Lujerului, 3 camere Iuliu Maniu, apartamente Sector 6, Pacii, agent imobiliar Militari" />
        <link rel="canonical" href="https://mvaimobiliare.ro/proprietati" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="Catalog complet de apartamente de vânzare în cartierul Militari, Sector 6 București. Include garsoniere, apartamente cu 2-4 camere în Gorjului, Lujerului, Iuliu Maniu, Pacii. Prețuri actualizate. Contact direct: 0767941512." />
        <meta name="category" content="Real Estate Listings" />
        <meta name="inventory-size" content={`${filteredProperties.length} properties`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/proprietati" />
        <meta property="og:title" content="Apartamente de Vânzare Militari Sector 6 – MVA Imobiliare" />
        <meta property="og:description" content="Vezi toate apartamentele de vânzare din cartierul Militari: garsoniere, 2 camere, 3 camere în Gorjului, Lujerului, Iuliu Maniu. Prețuri actualizate, agenție locală." />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:image" content={filteredProperties[0]?.images?.[0] || "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg"} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Apartamente de Vânzare Militari Sector 6 – MVA Imobiliare" />
        <meta property="twitter:description" content="Apartamente de vânzare în Militari: garsoniere, 2 camere, 3 camere. Prețuri actualizate." />

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
                          {pageText.transactionType}
                        </label>
                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                          <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder={pageText.selectTransactionType} />
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
                          {language === 'ro' ? 'Camere' : 'Rooms'}
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
                          {pageText.zone}
                        </label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger className="glass h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder={pageText.zone} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{pageText.allZones}</SelectItem>
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
                          ? pageText.hideAdvancedFilters
                          : pageText.showAdvancedFilters
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
                        {filteredProperties.length} {pageText.resultsCount}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={resetFilters}
                        className="glass hover:glass-hover w-full sm:w-auto min-h-[44px] touch-manipulation"
                      >
                        {pageText.resetFilters}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Recently Viewed Section */}
            <Suspense fallback={<div className="mb-8 h-32 bg-muted animate-pulse rounded-xl" />}>
              <RecentlyViewed className="mb-8" maxItems={6} />
            </Suspense>

            {/* Properties List */}
            {isLoadingProperties ? (
              <PropertyGridSkeleton count={8} />
            ) : filteredProperties.length === 0 && properties.length > 0 ? (
              <Card className="max-w-2xl mx-auto glass border-[0.5px]">
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{pageText.noFilteredResultsTitle}</h3>
                    <p className="text-muted-foreground">{pageText.noFilteredResultsDescription}</p>
                </CardContent>
              </Card>
            ) : properties.length === 0 ? (
              <Card className="max-w-2xl mx-auto glass border-[0.5px]">
                <CardContent className="py-12 text-center">
                  <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{pageText.noPropertiesTitle}</h3>
                    <p className="text-muted-foreground">{pageText.noPropertiesDescription}</p>
                </CardContent>
              </Card>
            ) : (
              <>
              <div className="grid lg:grid-cols-4 gap-6">
                {visibleProperties.map((property, index) => (
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
                      
                      {/* Promotion badges */}
                      {(property._immoflux_pole || property._immoflux_top) && (
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                          {property._immoflux_pole && (
                            <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 border-0">
                              ⚡ POLE POSITION
                            </Badge>
                          )}
                          {property._immoflux_top && !property._immoflux_pole && (
                            <Badge className="bg-gold hover:bg-gold/90 text-black font-bold text-xs shadow-lg shadow-gold/30 border-0">
                              ★ TOP
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Images */}
                      {property.images && Array.isArray(property.images) && property.images.length > 0 && (
                        <div className={`mb-4 overflow-hidden rounded-lg ${property._immoflux_pole ? 'ring-2 ring-purple-500/50' : property._immoflux_top ? 'ring-2 ring-gold/50' : ''}`}>
                          <OptimizedPropertyImage 
                            src={(property.images as string[])[0]} 
                            alt={`Apartament ${property.rooms || ''} camere ${property.transaction_type === 'rent' ? 'închiriere' : 'vânzare'} ${getDisplayLocation(property)}${property.surface_min ? ` ${property.surface_min}mp` : ''}`}
                            title={`${property.title} - ${property.price_min?.toLocaleString('de-DE')} ${property.currency || 'EUR'}`}
                            className="group-hover:scale-105 transition-transform duration-300"
                            aspectRatio="video"
                            priority={index < 4}
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
                          <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-gold" />
                              <span>{getDisplayLocation(property)}</span>
                            </div>
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
                        <ScheduleViewingDialog
                          propertyTitle={property.title}
                          propertyId={property.id}
                          propertyUrl={property.source === 'immoflux' || property._immoflux_slug
                            ? getImmofluxPropertyUrl({
                                idnum: property._immoflux_id || Number(String(property.id).replace('immoflux-', '')),
                                nrcamere: property.rooms,
                                zona: property.zone,
                                localitate: property.city || property.location,
                                titlu: property.title,
                              })
                            : getPropertyUrl(property)}
                          trigger={
                            <Button 
                              variant="default"
                              size="sm" 
                              className="w-full text-xs h-8 bg-primary hover:bg-primary/90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Solicită vizionare
                            </Button>
                          }
                        />
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
                              {pageText.call}
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
                          <Link to={(property as any)._immoflux_id ? `/proprietate/${(property as any)._immoflux_slug}` : getPropertyUrl(property)}>
                            <Info className="w-3 h-3 mr-1" />
                            Vezi Detalii
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
                {/* Load More Button */}
                {visibleCount < filteredProperties.length && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="glass hover:glass-hover min-w-[200px]"
                    >
                      Arată mai multe ({filteredProperties.length - visibleCount} rămase)
                    </Button>
                  </div>
                )}
              </>
              )}
            </div>
          </div>
        </main>


      {/* Image Gallery - Optimized Lightbox with swipe */}
      <Suspense fallback={null}>
        <ImageLightbox
          images={selectedProperty?.images || []}
          isOpen={!!selectedProperty}
          onClose={closeGallery}
          initialIndex={galleryInitialIndex}
        />
      </Suspense>

      <Footer />
    </div>
    </>
  )
}

export default Properties