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
