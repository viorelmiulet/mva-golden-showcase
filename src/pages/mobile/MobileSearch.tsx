import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Search, Filter, MapPin, Home, Ruler, Heart, X, SlidersHorizontal } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileSearch = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState(initialType);
  const [roomsFilter, setRoomsFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language } = useLanguage();

  // Fetch properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['mobile-search-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .is('project_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Detect transaction type from text
  const detectTransactionType = (property: any): 'sale' | 'rent' => {
    const base = `${property.title || ''} ${property.description || ''}`.toLowerCase();
    const text = base
      .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i')
      .replace(/ș/g,'s').replace(/ş/g,'s').replace(/ț/g,'t').replace(/ţ/g,'t');

    const rentKeywords = [
      'inchiriere', 'inchiriez', 'de inchiriat', 'chirie',
      'for rent', 'rent', 'se inchiriaza'
    ];

    if (rentKeywords.some(k => text.includes(k))) return 'rent';
    return (property.transaction_type === 'rent' || property.transaction_type === 'sale')
      ? property.transaction_type
      : 'sale';
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          property.title?.toLowerCase().includes(query) ||
          property.location?.toLowerCase().includes(query) ||
          property.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Transaction type
      if (transactionType !== 'all') {
        const txType = detectTransactionType(property);
        if (txType !== transactionType) return false;
      }

      // Rooms
      if (roomsFilter !== 'all') {
        const rooms = parseInt(roomsFilter);
        if (roomsFilter === '4') {
          if (property.rooms < 4) return false;
        } else {
          if (property.rooms !== rooms) return false;
        }
      }

      // Price range
      const minPrice = priceMin ? parseInt(priceMin) : null;
      const maxPrice = priceMax ? parseInt(priceMax) : null;
      if (minPrice && property.price_min < minPrice) return false;
      if (maxPrice && property.price_min > maxPrice) return false;

      return true;
    });
  }, [properties, searchQuery, transactionType, roomsFilter, priceMin, priceMax]);

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  const activeFiltersCount = [
    transactionType !== 'all',
    roomsFilter !== 'all',
    priceMin !== '',
    priceMax !== ''
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTransactionType('all');
    setRoomsFilter('all');
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <div className="min-h-screen">
      <MobileHeader title={language === 'ro' ? 'Caută proprietăți' : 'Search properties'} />
      
      <div className="pt-14 px-4 pb-4">
        {/* Search Bar */}
        <div className="sticky top-14 bg-background z-10 py-3 -mx-4 px-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ro' ? 'Caută după locație, nume...' : 'Search by location, name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-background text-xs font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
                <SheetHeader className="pb-4">
                  <SheetTitle>{language === 'ro' ? 'Filtre' : 'Filters'}</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm mb-2 block">
                      {language === 'ro' ? 'Tip tranzacție' : 'Transaction type'}
                    </Label>
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'ro' ? 'Toate' : 'All'}</SelectItem>
                        <SelectItem value="sale">{language === 'ro' ? 'Vânzare' : 'For Sale'}</SelectItem>
                        <SelectItem value="rent">{language === 'ro' ? 'Chirie' : 'For Rent'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">
                      {language === 'ro' ? 'Număr camere' : 'Rooms'}
                    </Label>
                    <Select value={roomsFilter} onValueChange={setRoomsFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'ro' ? 'Toate' : 'All'}</SelectItem>
                        <SelectItem value="1">1 {language === 'ro' ? 'cameră' : 'room'}</SelectItem>
                        <SelectItem value="2">2 {language === 'ro' ? 'camere' : 'rooms'}</SelectItem>
                        <SelectItem value="3">3 {language === 'ro' ? 'camere' : 'rooms'}</SelectItem>
                        <SelectItem value="4">4+ {language === 'ro' ? 'camere' : 'rooms'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">
                      {language === 'ro' ? 'Interval preț (EUR)' : 'Price range (EUR)'}
                    </Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      {language === 'ro' ? 'Resetează' : 'Reset'}
                    </Button>
                    <Button variant="luxury" className="flex-1" onClick={() => setShowFilters(false)}>
                      {language === 'ro' ? 'Aplică filtre' : 'Apply filters'}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {transactionType !== 'all' && (
                <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => setTransactionType('all')}>
                  {transactionType === 'sale' ? (language === 'ro' ? 'Vânzare' : 'Sale') : (language === 'ro' ? 'Chirie' : 'Rent')}
                  <X className="w-3 h-3" />
                </Button>
              )}
              {roomsFilter !== 'all' && (
                <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => setRoomsFilter('all')}>
                  {roomsFilter === '4' ? '4+' : roomsFilter} {language === 'ro' ? 'cam.' : 'rooms'}
                  <X className="w-3 h-3" />
                </Button>
              )}
              {(priceMin || priceMax) && (
                <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => { setPriceMin(''); setPriceMax(''); }}>
                  {priceMin && `€${priceMin}`}{priceMin && priceMax && ' - '}{priceMax && `€${priceMax}`}
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="py-3">
          <p className="text-sm text-muted-foreground">
            {filteredProperties.length} {language === 'ro' ? 'proprietăți găsite' : 'properties found'}
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="w-full h-48" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">
                {language === 'ro' ? 'Nicio proprietate găsită' : 'No properties found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ro' 
                  ? 'Încearcă să modifici criteriile de căutare'
                  : 'Try adjusting your search criteria'}
              </p>
            </div>
          ) : (
            filteredProperties.map((property) => (
              <Link key={property.id} to={`/app/proprietate/${property.id}`}>
                <Card className="overflow-hidden hover:border-gold/30 transition-colors">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={property.images?.[0] || '/placeholder.svg'}
                        alt={property.title}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(property.id, 'property');
                        }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                      >
                        <Heart 
                          className={`w-5 h-5 ${isFavorite(property.id, 'property') ? 'fill-gold text-gold' : 'text-foreground'}`} 
                        />
                      </button>
                      {property.images && property.images.length > 1 && (
                        <span className="absolute bottom-3 right-3 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs">
                          1/{property.images.length}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {property.title}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.location || 'București'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-gold font-bold">
                          {formatPrice(property.price_min || 0, property.currency || 'EUR')}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {property.rooms && (
                            <span className="flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              {property.rooms} {language === 'ro' ? 'cam.' : 'rooms'}
                            </span>
                          )}
                          {property.surface_min && (
                            <span className="flex items-center gap-1">
                              <Ruler className="w-3 h-3" />
                              {property.surface_min}m²
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSearch;
