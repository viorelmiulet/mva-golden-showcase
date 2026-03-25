import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useProperties, formatPrice, getTitle, getMainImage, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { PropertyGridSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Maximize, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ImmofluxPropertyCard = ({ property }: { property: ImmofluxProperty }) => {
  const isSale = property.devanzare;
  return (
    <Link to={`/proprietate/${property.idnum}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 md:h-56 overflow-hidden">
          <img
            src={getMainImage(property)}
            alt={getTitle(property)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            width={400}
            height={224}
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge className={isSale ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
              {isSale ? "De vânzare" : "De închiriat"}
            </Badge>
            {property.top === 1 && (
              <Badge className="bg-gold text-black font-bold">TOP</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-gold transition-colors">
            {getTitle(property)}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{[property.zona, property.localitate].filter(Boolean).join(', ')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
            {property.nrcamere > 0 && (
              <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.nrcamere} cam.</span>
            )}
            {property.suprafatautila > 0 && (
              <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.suprafatautila} mp</span>
            )}
          </div>
          <div className="pt-2 border-t">
            <span className="text-lg font-bold text-gold">{formatPrice(property)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const ImmofluxProperties = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useProperties(page);

  return (
    <>
      <Helmet>
        <title>Proprietăți Imobiliare | MVA Imobiliare</title>
        <meta name="description" content="Explorează proprietățile disponibile prin MVA Imobiliare – apartamente, case și terenuri de vânzare și închiriere." />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Proprietăți Disponibile
          </h1>

          {isLoading && <PropertyGridSkeleton count={6} />}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg text-muted-foreground">Nu am putut încărca proprietățile.</p>
              <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {data.data.map((p) => (
                  <ImmofluxPropertyCard key={p.idnum} property={p} />
                ))}
              </div>

              {data.last_page > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
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
      </main>
      <Footer />
    </>
  );
};

export default ImmofluxProperties;
