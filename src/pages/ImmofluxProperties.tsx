import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useProperties, formatPrice, getTitle, getMainImage, getSurface, type ImmofluxProperty } from "@/hooks/useImmoflux";
import { getImmofluxPropertyUrl } from "@/lib/propertySlug";
import { useImmofluxSlugMap, resolveImmofluxUrl } from "@/hooks/useImmofluxSlugMap";
import { PropertyGridSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, BedDouble, Maximize, ChevronLeft, ChevronRight, AlertCircle, Sofa, Filter, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const detectFurnished = (p: any): { label: 'Mobilat' | 'Parțial mobilat' | 'Nemobilat'; tone: 'furnished' | 'partial' | 'unfurnished' } | null => {
  const codeMap: Record<string, 'Mobilat' | 'Parțial mobilat' | 'Nemobilat'> = {
    '30301': 'Nemobilat', '30302': 'Parțial mobilat', '30303': 'Mobilat', '30304': 'Mobilat',
  };
  const toResult = (label: 'Mobilat' | 'Parțial mobilat' | 'Nemobilat') => ({
    label,
    tone: (label === 'Nemobilat' ? 'unfurnished' : label === 'Parțial mobilat' ? 'partial' : 'furnished') as 'furnished' | 'partial' | 'unfurnished',
  });
  const normalize = (raw: string) => {
    const v = raw.toLowerCase();
    if (/nemobilat/.test(v)) return toResult('Nemobilat');
    if (/parțial|partial/.test(v)) return toResult('Parțial mobilat');
    if (/mobilat/.test(v)) return toResult('Mobilat');
    return null;
  };
  const raw = p?.mobilat_value ? String(p.mobilat_value).trim() : '';
  if (raw) {
    if (codeMap[raw]) return toResult(codeMap[raw]);
    const n = normalize(raw);
    if (n) return n;
  }
  const src = String(p?.dotari || '');
  const n = normalize(src);
  if (n) return n;
  for (const [code, label] of Object.entries(codeMap)) {
    if (src.includes(code)) return toResult(label);
  }
  return null;
};

const ImmofluxPropertyCard = ({ property, slugMap }: { property: ImmofluxProperty; slugMap?: Map<number, string> | null }) => {
  const isSale = property.devanzare === 1;
  const surface = getSurface(property);
  const furnished = detectFurnished(property as any);
  const href = resolveImmofluxUrl(property as any, slugMap);
  const furnishedClass = furnished?.tone === 'furnished'
    ? 'bg-amber-500 text-black'
    : furnished?.tone === 'partial'
      ? 'bg-amber-200 text-black'
      : 'bg-slate-600 text-white';
  return (
    <Link to={getImmofluxPropertyUrl(property as any)}>
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
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
            <Badge className={isSale ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
              {isSale ? "De vânzare" : "De închiriat"}
            </Badge>
            {property.top === 1 && (
              <Badge className="bg-gold text-black font-bold">TOP</Badge>
            )}
            {furnished && (
              <Badge className={`${furnishedClass} flex items-center gap-1`}>
                <Sofa className="h-3 w-3" />
                {furnished.label}
              </Badge>
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
            {surface > 0 && (
              <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{surface} mp</span>
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

  // Quick filters
  const [zone, setZone] = useState("");
  const [rooms, setRooms] = useState("all");
  const [transaction, setTransaction] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const filtered = useMemo(() => {
    if (!data?.data) return [];
    const z = zone.trim().toLowerCase();
    const min = priceMin ? parseInt(priceMin) : null;
    const max = priceMax ? parseInt(priceMax) : null;
    return data.data.filter((p) => {
      if (transaction === "sale" && p.devanzare !== 1) return false;
      if (transaction === "rent" && p.devanzare === 1) return false;
      if (z) {
        const hay = `${p.zona || ""} ${p.localitate || ""} ${p.judet || ""} ${getTitle(p)}`.toLowerCase();
        if (!hay.includes(z)) return false;
      }
      if (rooms !== "all") {
        if (rooms === "4") { if ((p.nrcamere || 0) < 4) return false; }
        else if ((p.nrcamere || 0) !== parseInt(rooms)) return false;
      }
      const price = p.devanzare === 1 ? p.pretvanzare : (p.pretinchiriere || p.pretvanzare);
      if (min !== null && (!price || price < min)) return false;
      if (max !== null && (!price || price > max)) return false;
      return true;
    });
  }, [data, zone, rooms, transaction, priceMin, priceMax]);

  const activeCount = [zone !== "", rooms !== "all", transaction !== "all", priceMin !== "", priceMax !== ""].filter(Boolean).length;
  const clearFilters = () => { setZone(""); setRooms("all"); setTransaction("all"); setPriceMin(""); setPriceMax(""); };

  return (
    <>
      <Helmet>
        <title>Proprietăți Imobiliare | MVA Imobiliare</title>
        <meta name="description" content="Explorează proprietățile disponibile prin MVA Imobiliare – apartamente, case și terenuri de vânzare și închiriere." />
        <link rel="canonical" href="https://www.mvaimobiliare.ro/proprietati" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mvaimobiliare.ro/proprietati" />
        <meta property="og:title" content="Proprietăți Imobiliare | MVA Imobiliare" />
        <meta property="og:description" content="Apartamente, case și terenuri de vânzare și închiriere — MVA Imobiliare." />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-default.jpg" />
        <meta property="og:image:width" content="1216" />
        <meta property="og:image:height" content="640" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proprietăți Imobiliare | MVA Imobiliare" />
        <meta name="twitter:image" content="https://www.mvaimobiliare.ro/og-default.jpg" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Proprietăți Disponibile
          </h1>

          {/* Quick filters */}
          <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-gold" />
              Filtre rapide
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeCount}</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Zonă / oraș</Label>
                <Input
                  placeholder="ex: Militari, Pipera..."
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tranzacție</Label>
                <Select value={transaction} onValueChange={setTransaction}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="sale">Vânzare</SelectItem>
                    <SelectItem value="rent">Închiriere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Camere</Label>
                <Select value={rooms} onValueChange={setRooms}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="1">1 cameră</SelectItem>
                    <SelectItem value="2">2 camere</SelectItem>
                    <SelectItem value="3">3 camere</SelectItem>
                    <SelectItem value="4">4+ camere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Preț min (€)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Preț max (€)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="∞"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            {activeCount > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? 'proprietate găsită' : 'proprietăți găsite'} pe această pagină
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                  <X className="h-3 w-3 mr-1" /> Resetează
                </Button>
              </div>
            )}
          </div>

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
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground">
                    {activeCount > 0 ? 'Nicio proprietate nu corespunde filtrelor selectate.' : 'Nu sunt proprietăți disponibile momentan.'}
                  </p>
                  {activeCount > 0 && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Resetează filtrele
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filtered.map((p) => (
                    <ImmofluxPropertyCard key={p.idnum} property={p} />
                  ))}
                </div>
              )}

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
