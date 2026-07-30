import { useMemo, lazy, Suspense } from "react";
import { Link } from "@/lib/router-compat";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home as HomeIcon, Ruler, Euro, ArrowRight } from "lucide-react";
import { getPropertyUrl } from "@/lib/propertySlug";

const SITE_URL = "https://www.mvaimobiliare.ro";

export interface SeoLandingPreset {
  slug: string; // url path without leading /
  h1: string;
  title: string;
  description: string;
  intro: string;
  filter: {
    rooms?: number; // exact
    minRooms?: number;
    transactionType?: "sale" | "rent";
    propertyType?: "apartment" | "house" | "land" | "garsoniera";
    zone?: string; // single uppercase keyword to match
    zones?: string[]; // ANY of these uppercase keywords match (OR)
    newBuild?: boolean;
  };
  breadcrumb: string;
  /** Optional related landing pages shown at the bottom. */
  relatedLinks?: { slug: string; label: string }[];
  /** Optional custom empty-state message (used when 0 matches). */
  emptyStateMessage?: string;
}

interface Props {
  preset: SeoLandingPreset;
}

const matchesAnyZone = (p: any, zones: string[]) => {
  const hay = `${p.title || ""} ${p.zone || ""} ${p.location || ""} ${p.city || ""} ${p.project_name || ""}`.toUpperCase();
  return zones.some((z) => hay.includes(z.toUpperCase()));
};


const detectIsHouse = (p: any) => {
  const t = `${p.title || ""} ${p.description || ""}`.toLowerCase();
  return /\bcas[aă]\b|\bvil[aă]\b/.test(t) && !/apartament/.test(t);
};

const detectIsLand = (p: any) => {
  const t = `${p.title || ""} ${p.description || ""}`.toLowerCase();
  return /\bteren\b|\bteren(uri)?\b/.test(t);
};

const SeoLanding = ({ preset }: Props) => {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["catalog_offers", "seo-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .is("project_id", null)
        .neq("is_published", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    return all.filter((p: any) => {
      const f = preset.filter;
      if (f.rooms !== undefined && p.rooms !== f.rooms) return false;
      if (f.minRooms !== undefined && (!p.rooms || p.rooms < f.minRooms)) return false;
      if (f.transactionType && p.transaction_type && p.transaction_type !== f.transactionType) return false;
      if (f.zone && !matchesAnyZone(p, [f.zone])) return false;
      if (f.zones && f.zones.length > 0 && !matchesAnyZone(p, f.zones)) return false;

      if (f.propertyType === "house" && !detectIsHouse(p)) return false;
      if (f.propertyType === "land" && !detectIsLand(p)) return false;
      if (f.propertyType === "garsoniera" && p.rooms && p.rooms > 1) return false;
      if (f.propertyType === "apartment") {
        if (detectIsHouse(p) || detectIsLand(p)) return false;
      }
      if (f.newBuild) {
        const currentYear = new Date().getFullYear();
        const yb = p.year_built || 0;
        const isNew = yb >= currentYear - 3 || /bloc nou|apartamente noi|finisat la cheie|ansamblu nou/i.test(`${p.title || ""} ${p.description || ""}`);
        if (!isNew) return false;
      }
      return true;
    });
  }, [all, preset]);

  const canonical = `${SITE_URL}/${preset.slug}`;
  const count = filtered.length;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: preset.h1,
    numberOfItems: count,
    itemListElement: filtered.slice(0, 20).map((p: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}${getPropertyUrl(p)}`,
      name: p.title,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{preset.title}</title>
        <meta name="description" content={preset.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={preset.title} />
        <meta property="og:description" content={preset.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Proprietăți", href: "/proprietati" }, { label: preset.breadcrumb }]} />
        <BreadcrumbSchema items={[{ name: "Acasă", url: "/" }, { name: "Proprietăți", url: "/proprietati" }, { name: preset.breadcrumb, url: `/${preset.slug}` }]} />

        <header className="mt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{preset.h1}</h1>
          <p className="text-muted-foreground max-w-3xl">{preset.intro}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isLoading ? "Se încarcă oferte…" : `${count} ${count === 1 ? "ofertă disponibilă" : "oferte disponibile"}`}
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-16 px-4 rounded-lg border border-border bg-card/40">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              În curând proprietăți în această zonă
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              {preset.emptyStateMessage ||
                "Nu avem încă oferte publicate pentru această zonă. Lasă-ne datele tale și te contactăm imediat ce apare o proprietate potrivită, sau descoperă alte zone."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild>
                <Link to="/contact">Contactează un consultant</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/proprietati">Vezi toate proprietățile</Link>
              </Button>
            </div>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.slice(0, 60).map((p: any) => (
              <Link key={p.id} to={getPropertyUrl(p)} className="group">
                <Card className="overflow-hidden h-full transition-shadow ">
                  <div className="relative aspect-[4/3] bg-muted">
                    <OptimizedPropertyImage
                      src={p.images?.[0]}
                      alt={p.title || preset.h1}
                      aspectRatio="4/3"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.rooms && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        {p.rooms === 1 ? "Garsonieră" : `${p.rooms} camere`}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h2 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      {(p.zone || p.location || p.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {p.zone || p.location || p.city}
                        </span>
                      )}
                      {p.surface_min && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5" />
                          {p.surface_min} mp
                        </span>
                      )}
                      {p.rooms && (
                        <span className="flex items-center gap-1">
                          <HomeIcon className="h-3.5 w-3.5" />
                          {p.rooms} {p.rooms === 1 ? "cameră" : "camere"}
                        </span>
                      )}
                    </div>
                    {p.price_min && (
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {Number(p.price_min).toLocaleString("ro-RO")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <section className="mt-12 prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Despre {preset.breadcrumb.toLowerCase()}</h2>
          <p className="text-muted-foreground">{preset.intro}</p>
        </section>

        {preset.relatedLinks && preset.relatedLinks.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Explorează și alte zone</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/proprietati"
                className="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent text-sm text-foreground transition-colors"
              >
                Toate proprietățile
              </Link>
              {preset.relatedLinks.map((l) => (
                <Link
                  key={l.slug}
                  to={`/${l.slug}`}
                  className="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent text-sm text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default SeoLanding;
