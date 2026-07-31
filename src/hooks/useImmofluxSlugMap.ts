import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getImmofluxPropertyUrl } from "@/lib/propertySlug";

/**
 * Fetches the canonical map of Immoflux external_id (idnum) -> stored immoflux_slug
 * from catalog_offers. All internal /proprietati/ links MUST use this stored slug,
 * never recompute one from list-payload fields, so URL === canonical === og:url.
 */
export function useImmofluxSlugMap() {
  return useQuery({
    queryKey: ["immoflux-slug-map"],
    queryFn: async () => {
      const map = new Map<number, string>();
      const PAGE = 1000;
      let from = 0;
      // Fetch all immoflux rows that have a stored slug (paged to bypass 1k default limit).
      // The table is small enough (~few thousand) and the result is cached 10 min.
      for (;;) {
        const { data, error } = await supabase
          .from("catalog_offers")
          .select("external_id, immoflux_slug")
          .eq("crm_source", "immoflux")
          .not("immoflux_slug", "is", null)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = data || [];
        for (const r of rows) {
          const raw = (r as any).external_id as string | null;
          const slug = (r as any).immoflux_slug as string | null;
          if (!raw || !slug) continue;
          const idnum = Number(String(raw).replace("immoflux-", ""));
          if (Number.isFinite(idnum)) map.set(idnum, slug);
        }
        if (rows.length < PAGE) break;
        from += PAGE;
      }
      return map;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Resolve the canonical URL for an Immoflux item.
 * - If the stored slug is known for this idnum, use it (matches canonical/og:url).
 * - Otherwise fall back to on-the-fly slug from the live payload (legacy behavior).
 */
export function resolveImmofluxUrl(
  property: Parameters<typeof getImmofluxPropertyUrl>[0],
  slugMap?: Map<number, string> | null,
): string {
  const stored = slugMap?.get(Number(property.idnum));
  if (stored) return `/proprietati/${stored}`;
  return getImmofluxPropertyUrl(property);
}
