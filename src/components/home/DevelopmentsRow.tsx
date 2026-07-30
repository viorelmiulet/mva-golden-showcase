import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import OptimizedPropertyImage from "@/components/OptimizedPropertyImage";
import SpecRail from "@/components/SpecRail";
import { getComplexUrl } from "@/lib/complexSlug";

const DevelopmentsRow = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ["home-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("real_estate_projects")
        .select("*")
        .neq("is_published", false)
        .order("name")
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["home-project-units"],
    enabled: projects.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("id, project_id, availability_status, price_min")
        .not("project_id", "is", null);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const statsFor = (projectId: string) => {
    const rows = units.filter((u: any) => u.project_id === projectId && u.availability_status !== "sold");
    const prices = rows.map((r: any) => Number(r.price_min)).filter((n) => n > 0);
    const range =
      prices.length === 0
        ? null
        : `${Math.min(...prices).toLocaleString("ro-RO")} – ${Math.max(...prices).toLocaleString("ro-RO")} €`;
    return { available: rows.length, range };
  };

  if (projects.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-t border-stone">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-display-md text-foreground mb-8">Ansambluri rezidențiale</h2>

        <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x md:grid md:grid-cols-3 md:overflow-visible">
          {projects.map((project: any) => {
            const { available, range } = statsFor(project.id);
            return (
              <Link
                key={project.id}
                to={getComplexUrl(project)}
                className="group block min-w-[280px] snap-start md:min-w-0"
              >
                <div className="overflow-hidden rounded-sm border border-stone">
                  <OptimizedPropertyImage
                    src={project.main_image}
                    alt={`Ansamblul rezidențial ${project.name}`}
                    aspectRatio="video"
                    className="w-full h-full object-cover"
                    width={640}
                    height={320}
                  />
                </div>
                <p className="text-title text-foreground mt-3 group-hover:text-brass transition-colors">
                  {project.name}
                </p>
                <p className="text-small text-muted-foreground mt-1">{project.location || "București"}</p>
                <SpecRail
                  className="mt-2"
                  items={[
                    available > 0 ? `${available} UNITĂȚI DISPONIBILE` : null,
                    range || project.price_range || null,
                  ]}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DevelopmentsRow;
