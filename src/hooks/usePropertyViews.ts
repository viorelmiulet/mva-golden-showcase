import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPropertyViewCounts,
  getAllPropertyViewCounts,
  recordPropertyView,
} from "@/lib/propertyViews.functions";

/**
 * Total + last-7-days view counts for one property, from the dedicated
 * `property_views` table (deduplicated per visitor per 24h, bots excluded).
 */
export const usePropertyViews = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: ["property-views", propertyId],
    queryFn: async () => {
      if (!propertyId) return { total: 0, last7: 0 };
      return getPropertyViewCounts({ data: { propertyId } });
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
};

/** Records the view client-side after hydration, once per mounted property. */
export const useRecordPropertyView = (propertyId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void recordPropertyView({ data: { propertyId } })
      .then((res) => {
        if (!cancelled && res?.recorded) {
          queryClient.invalidateQueries({ queryKey: ["property-views", propertyId] });
        }
      })
      .catch(() => {
        /* view tracking must never break the page */
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, queryClient]);
};

/** Admin: counts for every property that has views. */
export const useAllPropertyViews = () => {
  return useQuery({
    queryKey: ["property-views-all"],
    queryFn: () => getAllPropertyViewCounts(),
    staleTime: 5 * 60 * 1000,
  });
};
