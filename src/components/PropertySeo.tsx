import { Helmet } from "@/lib/helmet-compat";
import { buildPageTitle } from "@/lib/pageTitle";

export interface PropertySeoInput {
  title: string;                 // listing title (used for og/twitter and H1 source)
  description: string;           // visible/long description
  metaDescription: string;       // trimmed for <meta>
  canonicalPath: string;         // e.g. /proprietati/<slug>
  images?: string[];             // absolute URLs preferred
  price?: number | null;
  currency?: string | null;
  isAvailable?: boolean;
  rooms?: number | null;
  bathrooms?: number | null;
  surface?: number | null;
  floor?: number | string | null;
  yearBuilt?: number | null;
  zone?: string | null;
  city?: string | null;
  street?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  datePosted?: string | null;
  isSale?: boolean;
  projectName?: string | null;   // used to build a concise <title> when `title` is long
}

const SITE = "https://www.mvaimobiliare.ro";
const PHONE = "+40767941512";

/** Compose a short, factual base title from real fields: e.g.
 *  "Apartament 2 camere — Militari Residence" or "Garsonieră — Chiajna". */
const composeShortBaseTitle = (
  rooms: number | null | undefined,
  projectName: string | null | undefined,
  zone: string | null | undefined,
  city: string | null | undefined,
): string => {
  const r = rooms && rooms > 0 ? Number(rooms) : null;
  const head = r === 1 ? 'Garsonieră' : r ? `Apartament ${r} camere` : 'Apartament';
  const tail = (projectName || zone || city || '').toString().trim();
  return tail ? `${head} — ${tail}` : head;
};


const PropertySeo = ({
  title,
  description,
  metaDescription,
  canonicalPath,
  images = [],
  price,
  currency,
  isAvailable = true,
  rooms,
  bathrooms,
  surface,
  floor,
  yearBuilt,
  zone,
  city,
  street,
  latitude,
  longitude,
  datePosted,
  isSale = true,
  projectName,
}: PropertySeoInput) => {
  const url = `${SITE}${canonicalPath}`;
  const fullCandidate = (title || '').trim();
  const shortCandidate = composeShortBaseTitle(rooms, projectName, zone, city);
  const baseTitle = fullCandidate || shortCandidate;
  const pageTitle = baseTitle ? `${baseTitle} | MVA Imobiliare` : 'MVA Imobiliare';
  const firstImage = images[0] || `${SITE}/mva-logo-luxury-horizontal.svg`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description: metaDescription,
    url,
    image: images.length > 0 ? images.slice(0, 10) : [firstImage],
    datePosted: datePosted || new Date().toISOString(),
    ...(rooms ? { numberOfRooms: Number(rooms) } : {}),
    ...(bathrooms ? { numberOfBathroomsTotal: Number(bathrooms) } : {}),
    ...(yearBuilt ? { yearBuilt: Number(yearBuilt) } : {}),
    ...(floor !== null && floor !== undefined && floor !== '' ? { floorLevel: String(floor) } : {}),
    ...(surface
      ? { floorSize: { "@type": "QuantitativeValue", value: Number(surface), unitCode: "MTK" } }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: city || "București",
      ...(zone ? { addressRegion: zone } : {}),
      ...(street ? { streetAddress: street } : {}),
      addressCountry: "RO",
    },
    ...(latitude && longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: Number(latitude), longitude: Number(longitude) } }
      : {}),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price: Number(price),
            priceCurrency: currency || "EUR",
            availability: isAvailable
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url,
            seller: {
              "@type": "RealEstateAgent",
              name: "MVA Imobiliare",
              url: SITE,
              telephone: PHONE,
            },
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Proprietăți", item: `${SITE}/proprietati` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="MVA Imobiliare" />
      <meta property="og:locale" content="ro_RO" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullCandidate || pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={firstImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullCandidate || pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={firstImage} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
  );
};

export default PropertySeo;
