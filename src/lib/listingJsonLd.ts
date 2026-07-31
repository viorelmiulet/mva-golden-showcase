import { getPropertyUrl } from "@/lib/propertySlug";

const SITE = "https://www.mvaimobiliare.ro";

/** Minimal shape shared by catalog_offers rows. */
interface ListingRow {
  id: string;
  slug?: string | null;
  title?: string | null;
  rooms?: number | null;
  surface_min?: number | null;
  price_min?: number | null;
  currency?: string | null;
  city?: string | null;
  zone?: string | null;
  images?: unknown;
  transaction_type?: string | null;
  [k: string]: any;
}

const firstImage = (row: ListingRow): string | null => {
  const imgs = Array.isArray(row.images) ? row.images : [];
  const img = imgs.find((s: unknown) => typeof s === "string" && /^https?:\/\//.test(s));
  return (img as string) || null;
};

const listingItem = (row: ListingRow) => {
  const url = `${SITE}${getPropertyUrl(row as any)}`;
  const image = firstImage(row);
  const rooms = row.rooms ? Number(row.rooms) : null;
  const name =
    (row.title || "").trim() ||
    (rooms === 1 ? "Garsonieră" : rooms ? `Apartament ${rooms} camere` : "Proprietate");

  return {
    "@type": "RealEstateListing",
    name,
    url,
    ...(image ? { image } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: (row.city || "București").trim(),
      ...(row.zone ? { addressRegion: String(row.zone).trim() } : {}),
      addressCountry: "RO",
    },
    ...(rooms ? { numberOfRooms: rooms } : {}),
    ...(row.surface_min
      ? { floorSize: { "@type": "QuantitativeValue", value: Number(row.surface_min), unitCode: "MTK" } }
      : {}),
    ...(row.price_min
      ? {
          offers: {
            "@type": "Offer",
            price: Number(row.price_min),
            priceCurrency: (row.currency || "EUR").trim(),
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };
};

/**
 * ItemList JSON-LD describing the property cards rendered on a listing page.
 * Each entry embeds a full RealEstateListing so Google can associate the card
 * with its detail page.
 */
export function buildItemListJsonLd(
  rows: ListingRow[],
  opts: { name: string; url: string; limit?: number }
) {
  const items = rows.slice(0, opts.limit ?? 20);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: opts.url,
    numberOfItems: rows.length,
    itemListElement: items.map((row, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE}${getPropertyUrl(row as any)}`,
      item: listingItem(row),
    })),
  };
}
