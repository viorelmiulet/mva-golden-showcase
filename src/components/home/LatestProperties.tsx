import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import SpecRail from "@/components/SpecRail";
import { getPropertyUrl } from "@/lib/propertySlug";

const isCoordinates = (str: string | null | undefined) => !!str && /^\d{2,}\.\d{3,}/.test(str.trim());

const getZone = (p: any): string => {
  if (p.zone && !isCoordinates(p.zone)) return p.zone;
  if (p.location && !isCoordinates(p.location)) return p.location;
  if (p.city && !isCoordinates(p.city)) return p.city;
  return "București";
};

const formatPrice = (value: number | null | undefined, currency?: string | null) => {
  if (!value) return "Preț la cerere";
  const symbol = (currency || "EUR").toUpperCase() === "EUR" ? "€" : currency;
  return `${Number(value).toLocaleString("ro-RO")} ${symbol}`;
};

/** Exactly one badge, or none. COMISION 0% wins over NOU. */
const getBadge = (p: any): "COMISION 0%" | "NOU" | null => {
  const zeroCommission =
    Number(p.commission_value) === 0 ||
    String(p.commission_type || "").toLowerCase().includes("0");
  if (zeroCommission) return "COMISION 0%";
  const created = p.created_at ? new Date(p.created_at).getTime() : 0;
  if (created && Date.now() - created < 21 * 24 * 60 * 60 * 1000) return "NOU";
  return null;
};

const floorLabel = (p: any) => {
  if (p.floor_label) return String(p.floor_label);
  if (p.floor === 0) return "PARTER";
  if (typeof p.floor === "number") return `ET ${p.floor}`;
  return null;
};

const LatestProperties = () => {
  const { data: offers = [] } = useQuery({
    queryKey: ["home-latest-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .is("project_id", null)
        .neq("availability_status", "sold")
        .neq("is_published", false)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: offers.map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `https://www.mvaimobiliare.ro${getPropertyUrl(p)}`,
    })),
  };

  return (
    <section className="py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-display-md text-foreground mb-8">Ultimele proprietăți</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((p: any, index: number) => {
            const badge = getBadge(p);
            return (
              <Link key={p.id} to={getPropertyUrl(p)} className="group block">
                <div className="relative overflow-hidden rounded-sm border border-stone">
                  <OptimizedPropertyImage
                    src={p.images?.[0]}
                    alt={`${p.title || "Proprietate"} — ${getZone(p)}`}
                    aspectRatio="4/3"
                    className="w-full h-full object-cover"
                    width={640}
                    height={480}
                    quality={75}
                    loading={index < 3 ? "eager" : "lazy"}
                  />
                  {badge && (
                    <span className="absolute top-2 left-2 bg-pine text-paper text-spec px-2 py-1 rounded-sm">
                      {badge}
                    </span>
                  )}
                </div>

                <p className="mt-3 font-sans font-semibold text-[1.375rem] leading-tight tabular text-foreground">
                  {formatPrice(p.price_min, p.currency)}
                </p>
                <p className="text-small text-muted-foreground mt-1">{getZone(p)}</p>
                <SpecRail
                  className="mt-2"
                  items={[
                    p.rooms ? `${p.rooms} CAM` : null,
                    p.surface_min ? `${p.surface_min} MP` : null,
                    floorLabel(p),
                    p.year_built || null,
                  ]}
                />
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <Link to="/proprietati" className="text-small text-brass hover:underline">
            Vezi toate proprietățile →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestProperties;
