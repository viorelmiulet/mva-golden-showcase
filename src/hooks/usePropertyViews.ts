import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePropertyViews = (pagePath: string | undefined) => {
  return useQuery({
    queryKey: ['property-views', pagePath],
    queryFn: async () => {
      if (!pagePath) return 0;
      const { count, error } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('page_path', pagePath);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!pagePath,
    staleTime: 5 * 60 * 1000,
  });
};
