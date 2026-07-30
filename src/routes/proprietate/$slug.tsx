import { createFileRoute } from "@tanstack/react-router";
import ImmofluxPropertyDetail, { fetchImmofluxFromCatalog } from "@/pages/ImmofluxPropertyDetail";
import { composePropertyDescription, composeMetaDescription } from "@/lib/propertyDescription";
import { parseFloor, parseTotalFloors } from "@/lib/floorParsing";

const SITE = "https://www.mvaimobiliare.ro";

export const Route = createFileRoute("/proprietate/$slug")({
  // SSR loader: metadata (inclusiv og:image real) există în HTML-ul livrat, fără JS.
  loader: async ({ params }) => {
    try {
      const row = await fetchImmofluxFromCatalog(params.slug);
      if (!row) return null;

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

      return {
        title: `${baseTitle} | MVA Imobiliare`,
        description: composeMetaDescription(description),
        image: images[0] || null,
        url: `${SITE}/proprietate/${row.immoflux_slug || params.slug}`,
      };
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Proprietate — MVA Imobiliare" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const { title, description, image, url } = loaderData;
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
    };
  },
  component: ImmofluxPropertyDetail,
});
