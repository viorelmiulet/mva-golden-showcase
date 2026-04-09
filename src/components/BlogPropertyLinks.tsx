import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Home, ArrowRight } from "lucide-react";
import { getPropertyUrl } from "@/lib/propertySlug";
import { getComplexUrl } from "@/lib/complexSlug";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";

interface BlogPropertyLinksProps {
  postContent: string | null;
  postCategory: string;
}

const COMPLEX_KEYWORDS: Record<string, string[]> = {
  "militari": ["militari", "militari residence"],
  "renew": ["renew", "renew residence"],
  "viscolului": ["viscolului", "viscolului residence"],
  "eurocasa": ["eurocasa", "eurocasa residence"],
  "afi": ["afi", "afi city"],
};

const BlogPropertyLinks = ({ postContent, postCategory }: BlogPropertyLinksProps) => {
  const contentLower = (postContent || "").toLowerCase();

  // Detect which complexes are mentioned
  const mentionedComplexes = Object.entries(COMPLEX_KEYWORDS)
    .filter(([_, keywords]) => keywords.some(kw => contentLower.includes(kw)))
    .map(([key]) => key);

  // Determine if the post is about properties/real estate
  const isPropertyRelated = ["piata", "ghiduri", "investitii", "complexe", "sfaturi"].includes(postCategory) ||
    /apartament|proprietat|imobiliar|cumpăr|vânzar|chirie|preț/i.test(contentLower);

  // Fetch featured properties from mentioned complexes or generally available
  const { data: properties = [] } = useQuery({
    queryKey: ["blog-linked-properties", mentionedComplexes],
    queryFn: async () => {
      let query = supabase
        .from("catalog_offers")
        .select("id, title, location, price_min, surface_min, rooms, images, project_name, availability_status, zone")
        .eq("availability_status", "available")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (mentionedComplexes.length > 0) {
        const patterns = mentionedComplexes.map(c => `%${c}%`);
        query = query.or(patterns.map(p => `project_name.ilike.${p}`).join(","));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isPropertyRelated,
  });

  // Fetch complexes to link to
  const { data: complexes = [] } = useQuery({
    queryKey: ["blog-linked-complexes", mentionedComplexes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_projects")
        .select("id, name, slug, location, price_range, main_image")
        .eq("is_published", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: isPropertyRelated,
  });

  // Filter complexes that match mentioned keywords
  const relevantComplexes = mentionedComplexes.length > 0
    ? complexes.filter(c => mentionedComplexes.some(mc => c.name.toLowerCase().includes(mc)))
    : complexes.slice(0, 3);

  if (!isPropertyRelated || (properties.length === 0 && relevantComplexes.length === 0)) {
    return null;
  }

  return (
    <div className="mt-12 space-y-8">
      {/* Link to complexes */}
      {relevantComplexes.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 text-foreground">
            Ansambluri Rezidențiale Menționate
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relevantComplexes.map((complex) => (
              <Link
                key={complex.id}
                to={getComplexUrl(complex)}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all hover:border-gold/50 overflow-hidden">
                  {complex.main_image && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={complex.main_image}
                        alt={`Ansamblu rezidențial ${complex.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold group-hover:text-gold transition-colors">
                      {complex.name}
                    </h4>
                    {complex.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {complex.location}
                      </p>
                    )}
                    {complex.price_range && (
                      <p className="text-sm text-gold font-medium mt-1">
                        {complex.price_range}
                      </p>
                    )}
                    <span className="text-xs text-gold flex items-center gap-1 mt-2">
                      Vezi detalii <ArrowRight className="w-3 h-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured properties */}
      {properties.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 text-foreground">
            Proprietăți Disponibile
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {properties.map((prop) => {
              const firstImage = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : null;
              return (
                <Link
                  key={prop.id}
                  to={getPropertyUrl(prop)}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:border-gold/50 overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      {firstImage ? (
                        <OptimizedPropertyImage
                          src={firstImage}
                          alt={`${prop.title} - ${prop.location}`}
                          title={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Home className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                        Disponibil
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-gold transition-colors mb-1">
                        {prop.title}
                      </h4>
                      <div className="flex items-center text-muted-foreground text-xs mb-1">
                        <MapPin className="w-3 h-3 mr-1 text-gold" />
                        <span className="truncate">{prop.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gold">
                          €{prop.price_min?.toLocaleString("de-DE")}
                        </span>
                        <span className="text-muted-foreground">
                          {prop.surface_min} mp • {prop.rooms} cam
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/proprietati"
              className="text-gold hover:text-gold/80 text-sm font-medium inline-flex items-center gap-1"
            >
              Vezi toate proprietățile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPropertyLinks;
