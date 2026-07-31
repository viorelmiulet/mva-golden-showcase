import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";

/** 6 available properties, shown on the not-found page so it is never an empty dead end. */
const NotFoundProperties = () => {
  const { data } = useQuery({
    queryKey: ["not-found-properties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const properties = data || [];
  if (properties.length === 0) return null;

  return (
    <div className="mx-auto mb-12 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Proprietăți disponibile
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p: any) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to="/proprietati" className="text-sm font-semibold text-foreground underline">
          Vezi toate proprietățile
        </Link>
      </div>
    </div>
  );
};

export default NotFoundProperties;
