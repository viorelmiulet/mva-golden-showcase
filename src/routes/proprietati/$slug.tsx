import { createFileRoute, notFound } from "@tanstack/react-router";
import ImmofluxPropertyDetail, { fetchImmofluxFromCatalog } from "@/pages/ImmofluxPropertyDetail";
import PropertyDetail from "@/pages/PropertyDetail";
import NotFound from "@/pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { composePropertyDescription, composeMetaDescription } from "@/lib/propertyDescription";
import { parseFloor, parseTotalFloors } from "@/lib/floorParsing";
import { generatePropertySlug, extractShortIdFromSlug } from "@/lib/propertySlug";

const SITE = "https://www.mvaimobiliare.ro";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Secondary lookup for legacy catalog slugs (UUID or short-id suffix). */
async function fetchCatalogFallback(slug: string): Promise<any | null> {
  if (UUID_RE.test(slug)) {
    const { data } = await supabase.from("catalog_offers").select("*").eq("id", slug).maybeSingle();
    return data || null;
  }
  // Stored slug column is authoritative — check it before any prefix heuristics.
  const { data: bySlug } = await supabase
    .from("catalog_offers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug) return bySlug;

  const shortId = extractShortIdFromSlug(slug);
  if (!shortId) return null;
  const { data: candidates } = await supabase.rpc("find_properties_by_id_prefix", { prefix: shortId });
  if (!candidates || candidates.length === 0) return null;
  const exact = candidates.find((p: any) => generatePropertySlug(p) === slug);
  return exact || (candidates.length === 1 ? candidates[0] : null);
}


export const Route = createFileRoute("/proprietati/$slug")({
  // SSR loader: metadata (inclusiv og:image real) există în HTML-ul livrat, fără JS.
  loader: async ({ params }) => {
    let row: any = null;
    let lookupFailed = false;
    try {
      row = await fetchImmofluxFromCatalog(params.slug);
      if (!row) row = await fetchCatalogFallback(params.slug);
    } catch {
      lookupFailed = true;
    }

    if (!row) {
      // Transient DB error → let the client page retry; genuinely missing → real 404.
      if (lookupFailed) return null;
      throw notFound();
    }

    const images: string[] = Array.isArray(row.images)
      ? row.images.filter((s: unknown): s is string => typeof s === "string" && /^https?:\/\//.test(s))
      : [];
    const isSale = row.transaction_type === "sale";
    const rooms = row.rooms ? Number(row.rooms) : null;
    const zone = row.zone || null;
    const city = (row.city || "București").trim();

    const description = composePropertyDescription({
      rooms,
      surface: row.surface_min ?? null,
      floor: parseFloor(row.floor_label, null, row.floor),
      totalFloors: parseTotalFloors(row.total_floors, null, null, row.total_floors),
      price: row.price_min ?? null,
      currency: row.currency || "EUR",
      isSale,
      projectName: row.project_name || null,
      zone,
      city,
      bathrooms: row.bathrooms ? Number(row.bathrooms) : null,
      yearBuilt: row.year_built ? Number(row.year_built) : null,
      furnished: row.furnished || null,
      propertyType: (row.property_type || "apartament").trim(),
      storedDescription: row.description || null,
    });

    const baseTitle =
      (row.title || "").trim() ||
      `${rooms === 1 ? "Garsonieră" : rooms ? `Apartament ${rooms} camere` : "Apartament"}${
        row.project_name || zone || city ? ` — ${row.project_name || zone || city}` : ""
      }`;

    const canonicalSlug = row.immoflux_slug || row.slug || params.slug;
    const metaDescription = composeMetaDescription(description);
    const title = `${baseTitle} | MVA Imobiliare`;
    const url = `${SITE}/proprietati/${canonicalSlug}`;

    return {
      title,
      description: metaDescription,
      image: images[0] || null,
      url,
      // Immoflux-sourced rows keep their dedicated renderer; everything else uses PropertyDetail.
      variant: row.immoflux_slug === params.slug ? ("immoflux" as const) : ("catalog" as const),
      jsonLd: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: baseTitle.trim(),
        description: metaDescription.trim(),
        url,
        ...(images.length ? { image: images.slice(0, 6) } : {}),
        ...(row.price_min
          ? {
              offers: {
                "@type": "Offer",
                price: row.price_min,
                priceCurrency: (row.currency || "EUR").trim(),
                availability: "https://schema.org/InStock",
                url,
              },
            }
          : {}),
        // Approximate location only — no streetAddress is published.
        address: {
          "@type": "PostalAddress",
          addressLocality: city.trim(),
          ...(zone ? { addressRegion: String(zone).trim() } : {}),
          addressCountry: "RO",
        },
        ...(row.surface_min
          ? { floorSize: { "@type": "QuantitativeValue", value: row.surface_min, unitCode: "MTK" } }
          : {}),
        ...(rooms ? { numberOfRooms: rooms } : {}),
      }),
      breadcrumbLd: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Proprietăți", item: `${SITE}/proprietati` },
          { "@type": "ListItem", position: 3, name: baseTitle.trim(), item: url },
        ],
      }),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Proprietatea nu a fost găsită — MVA Imobiliare" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const { title, description, image, url, jsonLd, breadcrumbLd } = loaderData;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:url", content: url },
        ...(image
          ? [
              { property: "og:image", content: image },
              { property: "og:image:alt", content: title },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: jsonLd },
        { type: "application/ld+json", children: breadcrumbLd },
      ],
    };
  },
  notFoundComponent: NotFound,
  component: PropertyRoute,
});

function PropertyRoute() {
  const data = Route.useLoaderData();
  return data?.variant === "immoflux" ? <ImmofluxPropertyDetail /> : <PropertyDetail />;
}
