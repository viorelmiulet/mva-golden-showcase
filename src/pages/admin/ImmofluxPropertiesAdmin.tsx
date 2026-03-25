import { useState, useMemo } from "react";
import { useProperties, formatPrice, getTitle, getMainImage, getSurface, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyGridSkeleton } from "@/components/skeletons";
import { MapPin, BedDouble, Maximize, ChevronLeft, ChevronRight, AlertCircle, ExternalLink, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getImmofluxPropertyUrl } from "@/lib/propertySlug";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ImmofluxPropertiesAdmin = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useProperties(page);

  // Filters
  const [search, setSearch] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [roomsFilter, setRoomsFilter] = useState<string>("all");

  // Get unique zones/rooms for filter options
  const roomOptions = useMemo(() => {
    if (!data?.data) return [];
    const rooms = [...new Set(data.data.map(p => p.nrcamere).filter(Boolean))].sort((a, b) => a - b);
    return rooms;
  }, [data]);

  // Apply client-side filters
  const filteredProperties = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((property) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const title = getTitle(property).toLowerCase();
        const zone = (property.zona || "").toLowerCase();
        const city = (property.localitate || "").toLowerCase();
        if (!title.includes(q) && !zone.includes(q) && !city.includes(q) && !String(property.idnum).includes(q)) {
          return false;
        }
      }
      // Transaction type
      if (transactionFilter !== "all") {
        const isSale = property.devanzare === 1;
        if (transactionFilter === "sale" && !isSale) return false;
        if (transactionFilter === "rent" && isSale) return false;
      }
      // Rooms
      if (roomsFilter !== "all" && property.nrcamere !== Number(roomsFilter)) {
        return false;
      }
      return true;
    });
  }, [data, search, transactionFilter, roomsFilter]);

  const activeFiltersCount = [transactionFilter !== "all", roomsFilter !== "all", search.length > 0].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setTransactionFilter("all");
    setRoomsFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Proprietăți IMMOFLUX</h2>
          <p className="text-sm text-muted-foreground">
            Proprietăți sincronizate din CRM-ul IMMOFLUX
            {data && ` • ${data.total} total`}
            {data && filteredProperties.length !== data.data.length && ` • ${filteredProperties.length} afișate`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după titlu, zonă, localitate sau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={transactionFilter} onValueChange={setTransactionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tip tranzacție" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            <SelectItem value="sale">Vânzare</SelectItem>
            <SelectItem value="rent">Închiriere</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roomsFilter} onValueChange={setRoomsFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Camere" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate camerele</SelectItem>
            {roomOptions.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} {r === 1 ? "cameră" : "camere"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-destructive gap-1">
            <X className="h-4 w-4" />
            Resetează ({activeFiltersCount})
          </Button>
        )}
      </div>

      {isLoading && <PropertyGridSkeleton count={6} />}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-muted-foreground">Nu am putut încărca proprietățile IMMOFLUX.</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message}</p>
        </div>
      )}

      {data && filteredProperties.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {data.data.length === 0 ? "Nu sunt proprietăți IMMOFLUX disponibile." : "Nicio proprietate nu corespunde filtrelor selectate."}
        </p>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((property: ImmofluxProperty) => {
              const isSale = property.devanzare === 1;
              const surface = getSurface(property);
              return (
                <Card key={property.idnum} className="overflow-hidden group hover:border-gold/30 transition-colors">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getMainImage(property)}
                      alt={getTitle(property)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <Badge className={isSale ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                        {isSale ? "Vânzare" : "Închiriere"}
                      </Badge>
                      {property.top === 1 && (
                        <Badge className="bg-gold text-black font-bold text-[10px]">TOP</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                      {getTitle(property)}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{[property.zona, property.localitate].filter(Boolean).join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {property.nrcamere > 0 && (
                        <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{property.nrcamere} cam.</span>
                      )}
                      {surface > 0 && (
                        <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{surface} mp</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-sm font-bold text-gold">{formatPrice(property)}</span>
                      <Link to={getImmofluxPropertyUrl(property)} target="_blank">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-gold">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Vezi
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.last_page > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {data.current_page} din {data.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Următor <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImmofluxPropertiesAdmin;
