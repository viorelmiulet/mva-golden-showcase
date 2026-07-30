import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import { getPropertyUrl } from "@/lib/propertySlug";


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
          {offers.map((p: any, index: number) => (
            <PropertyCard key={p.id} property={p} priority={index < 3} />
          ))}
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
