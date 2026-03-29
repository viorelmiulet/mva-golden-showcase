import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealEstateStats = () => {
  return useQuery({
    queryKey: ["real-estate-stats"],
    queryFn: async () => {
      // Count properties
      const { count: propertiesCount, error: propertiesError } = await supabase
        .from("catalog_offers")
        .select("*", { count: "exact", head: true })
        .is("project_id", null)
        .eq("is_published", true)
        .eq("availability_status", "available");

      if (propertiesError) {
        console.error("Error fetching properties count:", propertiesError);
        // Return default values instead of throwing to prevent UI breaks
        return {
          propertiesCount: 0,
          projectsCount: 0,
        };
      }

      // Count projects
      const { count: projectsCount, error: projectsError } = await supabase
        .from("real_estate_projects")
        .select("*", { count: "exact", head: true });

      if (projectsError) {
        console.error("Error fetching projects count:", projectsError);
        // Return default values instead of throwing to prevent UI breaks
        return {
          propertiesCount: propertiesCount || 0,
          projectsCount: 0,
        };
      }

      return {
        propertiesCount: propertiesCount || 0,
        projectsCount: projectsCount || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
    retry: false, // Don't retry on storage quota errors
  });
};
