import { useState } from "react";
import { useProperties, formatPrice, getTitle, getMainImage, getSurface, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyGridSkeleton } from "@/components/skeletons";
import { MapPin, BedDouble, Maximize, ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const ImmofluxPropertiesAdmin = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useProperties(page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Proprietăți IMMOFLUX</h2>
          <p className="text-sm text-muted-foreground">
            Proprietăți sincronizate din CRM-ul IMMOFLUX
            {data && ` • ${data.total} total`}
          </p>
        </div>
      </div>

      {isLoading && <PropertyGridSkeleton count={6} />}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-muted-foreground">Nu am putut încărca proprietățile IMMOFLUX.</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message}</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Nu sunt proprietăți IMMOFLUX disponibile.</p>
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
                      <Link to={`/proprietate/${property.idnum}`} target="_blank">
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
