import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealEstateStats = () => {
  return useQuery({
    queryKey: ["real-estate-stats"],
    queryFn: async () => {
      // Count properties
      const { count: propertiesCount, error: propertiesError } = await supabase
        .from("catalog_offers")
        .select("*", { count: "exact", head: true });

      if (propertiesError) {
        console.error("Error fetching properties count:", propertiesError);
        throw propertiesError;
      }

      // Count projects
      const { count: projectsCount, error: projectsError } = await supabase
        .from("real_estate_projects")
        .select("*", { count: "exact", head: true });

      if (projectsError) {
        console.error("Error fetching projects count:", projectsError);
        throw projectsError;
      }

      return {
        propertiesCount: propertiesCount || 0,
        projectsCount: projectsCount || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });
};
