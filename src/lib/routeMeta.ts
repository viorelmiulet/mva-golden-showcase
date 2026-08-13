const SITE = "https://www.mvaimobiliare.ro";

export interface StaticHeadInput {
  title: string;
  description: string;
  /** Path starting with "/" (no trailing slash, except the homepage "/"). */
  path: string;
  /** Absolute https image URL. Omit to let hosting pick the preview image. */
  image?: string;
  ogType?: string;
  noindex?: boolean;
}

/**
 * Server-rendered metadata for static public routes.
 * Returns the object shape expected by a TanStack route `head()`.
 */
export function staticHead({
  title,
  description,
  path,
  image,
  ogType = "website",
  noindex = false,
}: StaticHeadInput) {
  const url = `${SITE}${path === "/" ? "" : path}` || SITE;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image
        ? [
            { property: "og:image", content: image },
            { property: "og:image:alt", content: title },
            { name: "twitter:image", content: image },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url || SITE }],
  };
}

export interface EditorialHeadInput extends StaticHeadInput {
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  imageWidth?: number;
  imageHeight?: number;
  /** JSON-LD objects rendered as <script type="application/ld+json"> */
  schemas?: unknown[];
}

/**
 * Server-rendered metadata for editorial/landing routes.
 * Mirrors the values these pages previously emitted client-side via <Helmet>.
 */
export function editorialHead({
  title,
  description,
  path,
  image,
  imageWidth,
  imageHeight,
  ogType = "article",
  ogTitle,
  ogDescription,
  keywords,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noindex = false,
  schemas = [],
}: EditorialHeadInput) {
  const url = `${SITE}${path === "/" ? "" : path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:title", content: ogTitle ?? title },
      { property: "og:description", content: ogDescription ?? description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      ...(image
        ? [
            { property: "og:image", content: image },
            ...(imageWidth
              ? [{ property: "og:image:width", content: String(imageWidth) }]
              : []),
            ...(imageHeight
              ? [{ property: "og:image:height", content: String(imageHeight) }]
              : []),
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: twitterTitle ?? ogTitle ?? title },
      {
        name: "twitter:description",
        content: twitterDescription ?? ogDescription ?? description,
      },
      ...(twitterImage ?? image
        ? [{ name: "twitter:image", content: (twitterImage ?? image) as string }]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: schemas.map((s) => ({
      type: "application/ld+json",
      children: JSON.stringify(s),
    })),
  };
}
