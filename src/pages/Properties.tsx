import { useMemo, useState, useEffect } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { useSearchParams } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PropertyCard, { PropertyCardSkeleton, getCardZone } from "@/components/PropertyCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getPropertyUrl, generateImmofluxSlug } from "@/lib/propertySlug";

const PER_PAGE = 24;

const isCoordinates = (str: string): boolean => {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,?\s*-?\d+\.\d+$/.test(str.trim());
};

const shouldUseImmofluxRoute = (property: any): boolean =>
  property.availability_status !== "sold" &&
  Boolean(property._immoflux_id) &&
  Boolean(property._immoflux_slug) &&
  !String(property._immoflux_slug).includes("undefined");

const getListingPropertyUrl = (property: any): string =>
  shouldUseImmofluxRoute(property) ? `/proprietati/${property._immoflux_slug}` : getPropertyUrl(property);

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ş/g, "s")
    .replace(/ț/g, "t")
    .replace(/ţ/g, "t");

const detectTransactionType = (property: any): "sale" | "rent" => {
  const text = normalize(`${property.title || ""} ${property.description || ""}`);
  const rentKeywords = [
    "de inchiriat",
    "se inchiriaza",
    "inchiriere",
    "inchiriez",
    "chirie",
    "for rent",
    "/luna",
    "/ luna",
    "eur/luna",
  ];
  const saleKeywords = ["de vanzare", "se vinde", "for sale", "vand "];
  const hasRentText = rentKeywords.some((k) => text.includes(k));
  const hasSaleText = saleKeywords.some((k) => text.includes(k));
  const price = Number(property.price_min) || 0;
  const looksLikeRentPrice = price > 0 && price < 3000;
  const looksLikeSalePrice = price >= 10000;

  if (hasRentText && !hasSaleText) return "rent";
  if (looksLikeRentPrice && hasRentText) return "rent";
  if (hasSaleText && !hasRentText) return "sale";
  if (property.transaction_type === "rent" || property.transaction_type === "sale") {
    if (property.transaction_type === "sale" && looksLikeRentPrice) return "rent";
    if (property.transaction_type === "rent" && looksLikeSalePrice) return "sale";
    return property.transaction_type;
  }
  if (looksLikeRentPrice) return "rent";
  if (looksLikeSalePrice) return "sale";
  return "sale";
};

const PRICE_STEPS = [50000, 75000, 100000, 125000, 150000, 200000, 300000];
const SURFACE_STEPS = [40, 50, 60, 80, 100, 120];

const SORTS = [
  { value: "recente", label: "Cele mai noi" },
  { value: "pret_asc", label: "Preț crescător" },
  { value: "pret_desc", label: "Preț descrescător" },
  { value: "suprafata", label: "Suprafață" },
] as const;

/** Pure mapping of catalog rows → listing items (shared by SSR loader and client query). */
export const mapCatalogRows = (rows: any[]) =>
  (rows || []).map((p: any) => {
    const isImmoflux = p.crm_source === "immoflux" || p.source === "immoflux";
    const immofluxId =
      isImmoflux && p.external_id ? Number(String(p.external_id).replace("immoflux-", "")) : null;
    return {
      ...p,
      _immoflux_id: immofluxId,
      _immoflux_slug:
        isImmoflux && immofluxId
          ? p.immoflux_slug ||
            generateImmofluxSlug({
              idnum: immofluxId,
              nrcamere: p.rooms,
              zona: p.zone,
              localitate: p.location || p.city,
              suprutila: p.surface_min,
              etaj: p.floor,
            } as any)
          : null,
      _immoflux_top: isImmoflux && p.promotion_type === "top",
      _immoflux_pole: isImmoflux && p.promotion_type === "pole_position",
    };
  });

/** Same Supabase query used by the SSR loader and the client refetch. */
export const fetchCatalogOffers = async () => {
  const { data, error } = await supabase
    .from("catalog_offers")
    .select("*")
    .is("project_id", null)
    .neq("is_published", false)
    .neq("availability_status", "sold")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

interface PropertiesProps {
  /** Rows pre-fetched on the server so the first HTML already contains cards. */
  initialRows?: any[];
}

const Properties = ({ initialRows }: PropertiesProps = {}) => {

  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  // ---- URL is the single source of truth -------------------------------
  const param = (key: string) => searchParams.get(key) || "";
  const zona = param("zona");
  const camere = param("camere");
  const pretMax = param("pret_max");
  const tip = param("tip");
  const suprMin = param("supr_min");
  const etaj = param("etaj");
  const compartimentare = param("compartimentare");
  const an = param("an");
  const ansamblu = param("ansamblu");
  const sort = param("sort") || "recente";
  const page = Math.max(1, parseInt(param("p") || "1", 10) || 1);

  const setParam = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    if (resetPage) next.delete("p");
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => setSearchParams(new URLSearchParams(), { replace: true });

  // ---- Data (unchanged Supabase query) ---------------------------------
  const initialData = useMemo(
    () => (initialRows ? mapCatalogRows(initialRows) : undefined),
    [initialRows]
  );

  const { data: catalogProperties = [], isLoading } = useQuery({
    queryKey: ["catalog_offers"],
    queryFn: async () => mapCatalogRows(await fetchCatalogOffers()),
    ...(initialData ? { initialData } : {}),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });


  const properties = useMemo(
    () =>
      [...catalogProperties].sort((a: any, b: any) => {
        const aScore = (a._immoflux_pole ? 2 : 0) + (a._immoflux_top ? 1 : 0);
        const bScore = (b._immoflux_pole ? 2 : 0) + (b._immoflux_top ? 1 : 0);
        return bScore - aScore;
      }),
    [catalogProperties]
  );

  // ---- Options derived from data --------------------------------------
  const zoneOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) {
      const raw = (p.zone || "").trim();
      if (raw && !isCoordinates(raw)) set.add(raw.toUpperCase());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"));
  }, [properties]);

  const compartmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) if (p.compartment) set.add(String(p.compartment).trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"));
  }, [properties]);

  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) if (p.project_name) set.add(String(p.project_name).trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"));
  }, [properties]);

  // ---- Filtering --------------------------------------------------------
  const filtered = useMemo(() => {
    return properties.filter((p: any) => {
      if (zona) {
        const raw = (p.zone || "").trim();
        if (!raw || isCoordinates(raw) || raw.toUpperCase() !== zona.toUpperCase()) return false;
      }
      if (camere) {
        const n = parseInt(camere, 10);
        if (camere === "5") {
          if (!p.rooms || p.rooms < 5) return false;
        } else if (p.rooms !== n) return false;
      }
      if (pretMax) {
        const max = parseInt(pretMax, 10);
        if (!p.price_min || p.price_min > max) return false;
      }
      if (tip && detectTransactionType(p) !== tip) return false;
      if (suprMin) {
        const min = parseInt(suprMin, 10);
        const surface = p.surface_min || p.surface_max;
        if (!surface || surface < min) return false;
      }
      if (etaj) {
        if (etaj === "parter") {
          if (p.floor !== 0) return false;
        } else if (etaj === "ultimul") {
          if (!p.floor || !p.total_floors || p.floor !== p.total_floors) return false;
        } else if (p.floor !== parseInt(etaj, 10)) return false;
      }
      if (compartimentare && String(p.compartment || "").trim() !== compartimentare) return false;
      if (an) {
        if (!p.year_built) return false;
        const current = new Date().getFullYear();
        if (an === "nou" && p.year_built < current - 2) return false;
        if (an === "recent" && p.year_built < current - 5) return false;
        if (an === "2010s" && (p.year_built < 2010 || p.year_built > 2019)) return false;
        if (an === "vechi" && p.year_built >= 2010) return false;
      }
      if (ansamblu && String(p.project_name || "").trim() !== ansamblu) return false;
      return true;
    });
  }, [properties, zona, camere, pretMax, tip, suprMin, etaj, compartimentare, an, ansamblu]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "pret_asc") list.sort((a, b) => (a.price_min || 0) - (b.price_min || 0));
    else if (sort === "pret_desc") list.sort((a, b) => (b.price_min || 0) - (a.price_min || 0));
    else if (sort === "suprafata")
      list.sort((a, b) => (b.surface_min || b.surface_max || 0) - (a.surface_min || a.surface_max || 0));
    else
      list.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    return list;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // ---- Active chips -----------------------------------------------------
  const chips: { key: string; label: string }[] = [];
  if (zona) chips.push({ key: "zona", label: zona });
  if (camere) chips.push({ key: "camere", label: camere === "5" ? "5+ camere" : `${camere} camere` });
  if (pretMax) chips.push({ key: "pret_max", label: `max ${Number(pretMax).toLocaleString("ro-RO")} €` });
  if (tip) chips.push({ key: "tip", label: tip === "rent" ? "Închiriere" : "Vânzare" });
  if (suprMin) chips.push({ key: "supr_min", label: `min ${suprMin} mp` });
  if (etaj) chips.push({ key: "etaj", label: etaj === "parter" ? "Parter" : etaj === "ultimul" ? "Ultimul etaj" : `Etaj ${etaj}` });
  if (compartimentare) chips.push({ key: "compartimentare", label: compartimentare });
  if (an) chips.push({ key: "an", label: `An: ${an}` });
  if (ansamblu) chips.push({ key: "ansamblu", label: ansamblu });

  // ---- Controls ---------------------------------------------------------
  const selectClass = "h-10 rounded-sm border-stone bg-paper text-small";

  const MainFilters = ({ stacked = false }: { stacked?: boolean }) => (
    <div className={stacked ? "grid grid-cols-1 gap-3" : "flex flex-wrap items-center gap-2"}>
      <Select value={zona || "all"} onValueChange={(v) => setParam("zona", v)}>
        <SelectTrigger className={`${selectClass} ${stacked ? "w-full" : "w-[150px]"}`}>
          <SelectValue placeholder="Zonă" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Toate zonele</SelectItem>
          {zoneOptions.map((z) => (
            <SelectItem key={z} value={z}>
              {z}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={camere || "all"} onValueChange={(v) => setParam("camere", v)}>
        <SelectTrigger className={`${selectClass} ${stacked ? "w-full" : "w-[130px]"}`}>
          <SelectValue placeholder="Camere" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice camere</SelectItem>
          {["1", "2", "3", "4"].map((n) => (
            <SelectItem key={n} value={n}>
              {n} camere
            </SelectItem>
          ))}
          <SelectItem value="5">5+ camere</SelectItem>
        </SelectContent>
      </Select>

      <Select value={pretMax || "all"} onValueChange={(v) => setParam("pret_max", v)}>
        <SelectTrigger className={`${selectClass} ${stacked ? "w-full" : "w-[150px]"}`}>
          <SelectValue placeholder="Preț" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice preț</SelectItem>
          {PRICE_STEPS.map((v) => (
            <SelectItem key={v} value={String(v)}>
              până în {v.toLocaleString("ro-RO")} €
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tip || "all"} onValueChange={(v) => setParam("tip", v)}>
        <SelectTrigger className={`${selectClass} ${stacked ? "w-full" : "w-[130px]"}`}>
          <SelectValue placeholder="Tip" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Toate tipurile</SelectItem>
          <SelectItem value="sale">Vânzare</SelectItem>
          <SelectItem value="rent">Închiriere</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const MoreFilters = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <Select value={suprMin || "all"} onValueChange={(v) => setParam("supr_min", v)}>
        <SelectTrigger className={selectClass}>
          <SelectValue placeholder="Suprafață utilă" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice suprafață</SelectItem>
          {SURFACE_STEPS.map((v) => (
            <SelectItem key={v} value={String(v)}>
              peste {v} mp
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={etaj || "all"} onValueChange={(v) => setParam("etaj", v)}>
        <SelectTrigger className={selectClass}>
          <SelectValue placeholder="Etaj" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice etaj</SelectItem>
          <SelectItem value="parter">Parter</SelectItem>
          {["1", "2", "3", "4", "5"].map((n) => (
            <SelectItem key={n} value={n}>
              Etaj {n}
            </SelectItem>
          ))}
          <SelectItem value="ultimul">Ultimul etaj</SelectItem>
        </SelectContent>
      </Select>

      <Select value={compartimentare || "all"} onValueChange={(v) => setParam("compartimentare", v)}>
        <SelectTrigger className={selectClass}>
          <SelectValue placeholder="Compartimentare" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice compartimentare</SelectItem>
          {compartmentOptions.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={an || "all"} onValueChange={(v) => setParam("an", v)}>
        <SelectTrigger className={selectClass}>
          <SelectValue placeholder="An construcție" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice an</SelectItem>
          <SelectItem value="nou">Construcție nouă</SelectItem>
          <SelectItem value="recent">Ultimii 5 ani</SelectItem>
          <SelectItem value="2010s">2010 – 2019</SelectItem>
          <SelectItem value="vechi">Înainte de 2010</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ansamblu || "all"} onValueChange={(v) => setParam("ansamblu", v)}>
        <SelectTrigger className={selectClass}>
          <SelectValue placeholder="Ansamblu" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Orice ansamblu</SelectItem>
          {projectOptions.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const [showMore, setShowMore] = useState(false);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Proprietăți disponibile",
    numberOfItems: sorted.length,
    itemListElement: pageItems.slice(0, 10).map((property: any, index: number) => ({
      "@type": "ListItem",
      position: (currentPage - 1) * PER_PAGE + index + 1,
      name: property.title,
      url: `https://www.mvaimobiliare.ro${getListingPropertyUrl(property)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />


      <Header />

      <main className="min-h-screen bg-background pt-16">
        {/* Filter bar */}
        <div className="sticky top-16 z-40 bg-paper border-b border-stone">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <MainFilters />
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="h-10 px-3 text-small text-muted-foreground hover:text-brass transition-colors"
              >
                Mai multe filtre
              </button>
            </div>
            {showMore && <div className="hidden md:block pt-3">{<MoreFilters />}</div>}

            {/* Mobile */}
            <div className="md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-11 border border-stone rounded-sm text-small text-foreground"
                  >
                    Filtre{chips.length > 0 ? ` (${chips.length})` : ""}
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-sm">
                  <SheetHeader>
                    <SheetTitle className="text-title">Filtre</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3 pb-24">
                    <MainFilters stacked />
                    <MoreFilters />
                  </div>
                  <div className="sticky bottom-0 bg-background pt-3 pb-4">
                    <button
                      type="button"
                      onClick={() => setSheetOpen(false)}
                      className="w-full h-11 bg-brass text-ink rounded-sm text-small font-medium"
                    >
                      Arată {sorted.length} proprietăți
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setParam(c.key, "")}
                    className="inline-flex items-center gap-1.5 border border-brass text-brass text-small px-2.5 py-1 rounded-sm hover:bg-brass/10 transition-colors"
                  >
                    {c.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {chips.length >= 2 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-small text-muted-foreground hover:text-brass underline"
                  >
                    Șterge tot
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-6 py-6">
          <Breadcrumbs items={[{ label: "Proprietăți" }]} />

          {/* Results header */}
          <div className="flex items-center justify-between gap-4 mt-4 mb-6">
            <h1 className="text-title text-foreground">
              {isLoading ? "Se încarcă…" : `${sorted.length} proprietăți`}
            </h1>
            <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
              <SelectTrigger className={`${selectClass} w-[190px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-8">
              <h2 className="text-display-md text-foreground">Nicio proprietate cu aceste filtre</h2>
              <p className="text-body text-muted-foreground mt-3 max-w-xl">
                {pretMax
                  ? "Încearcă să mărești pragul de preț sau să elimini filtrul de zonă."
                  : "Încearcă să elimini filtrul de zonă sau să alegi un alt număr de camere."}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 h-11 px-5 bg-brass text-ink rounded-sm text-small font-medium"
              >
                Șterge filtrele
              </button>

              {properties.length > 0 && (
                <div className="mt-12">
                  <p className="text-spec text-muted-foreground mb-4">PROPRIETĂȚI SIMILARE</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.slice(0, 6).map((p: any, i: number) => (
                      <PropertyCard key={p.id} property={p} to={getListingPropertyUrl(p)} priority={i < 3} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((p: any, i: number) => (
                  <PropertyCard key={p.id} property={p} to={getListingPropertyUrl(p)} priority={i < 3} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex flex-wrap items-center gap-2 mt-10" aria-label="Paginare">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    const active = n === currentPage;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setParam("p", n === 1 ? "" : String(n), false)}
                        aria-current={active ? "page" : undefined}
                        className={`h-10 min-w-10 px-3 rounded-sm border text-small transition-colors ${
                          active
                            ? "border-brass text-brass"
                            : "border-stone text-muted-foreground hover:text-brass hover:border-brass"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Properties;
