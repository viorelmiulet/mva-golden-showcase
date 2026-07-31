import { lazy } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { seoLandingPresets } from "@/lib/seoLandingPresets";
import { fetchCatalogOffers } from "@/pages/Properties";
import { filterForPreset } from "@/lib/seoLandingFilter";
import { buildItemListJsonLd } from "@/lib/listingJsonLd";
import { staticHead } from "@/lib/routeMeta";

const SeoLanding = lazy(() => import("@/pages/SeoLanding"));

const SITE = "https://www.mvaimobiliare.ro";

// Dynamic SEO landing pages (one per preset in seoLandingPresets).
// Unknown single-segment slugs fall through to the root notFoundComponent.
export const Route = createFileRoute("/$seoSlug")({
  beforeLoad: ({ params }) => {
    const preset = seoLandingPresets.find((p) => p.slug === params.seoSlug);
    if (!preset) throw notFound();
  },
  // SSR: the ItemList JSON-LD is built from the same rows the page renders.
  loader: async ({ params }) => {
    const preset = seoLandingPresets.find((p) => p.slug === params.seoSlug);
    if (!preset) return { rows: [] as any[] };
    try {
      return { rows: filterForPreset(await fetchCatalogOffers(), preset) };
    } catch {
      return { rows: [] as any[] };
    }
  },
  head: ({ params, loaderData }) => {
    const preset = seoLandingPresets.find((p) => p.slug === params.seoSlug);
    if (!preset) return {};
    const url = `${SITE}/${preset.slug}`;
    const base = staticHead({
      title: preset.title,
      description: preset.description,
      path: `/${preset.slug}`,
    });
    const rows = (loaderData?.rows ?? []) as any[];
    if (rows.length === 0) return base;
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildItemListJsonLd(rows, { name: preset.h1, url, limit: 20 })),
        },
      ],
    };
  },
  component: SeoSlugPage,
});

function SeoSlugPage() {
  const { seoSlug } = Route.useParams();
  const preset = seoLandingPresets.find((p) => p.slug === seoSlug);
  if (!preset) throw notFound();
  return <SeoLanding preset={preset} />;
}
