import { createFileRoute, notFound } from "@tanstack/react-router";
import { seoLandingPresets } from "@/lib/seoLandingPresets";
import { fetchCatalogOffers } from "@/pages/Properties";
import { filterForPreset } from "@/lib/seoLandingFilter";
import { buildItemListJsonLd } from "@/lib/listingJsonLd";
import { staticHead } from "@/lib/routeMeta";
import SeoLanding from "@/pages/SeoLanding";

const SITE = "https://www.mvaimobiliare.ro";

// Dynamic SEO landing pages (one per preset in seoLandingPresets).
// Unknown single-segment slugs fall through to the root notFoundComponent.
export const Route = createFileRoute("/$seoSlug")({
  beforeLoad: ({ params }) => {
    const preset = seoLandingPresets.find((p) => p.slug === params.seoSlug);
    if (!preset) throw notFound();
  },
  // SSR: the cards and their JSON-LD are built from the same rows.
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
    const rows = (loaderData?.rows ?? []) as any[];
    // No inventory = nothing worth indexing; the page returns to the index
    // automatically once matching properties exist again.
    const base = staticHead({
      title: preset.title,
      description: preset.description,
      path: `/${preset.slug}`,
      noindex: rows.length === 0,
    });

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Acasă", item: SITE },
        { "@type": "ListItem", position: 2, name: "Proprietăți", item: `${SITE}/proprietati` },
        { "@type": "ListItem", position: 3, name: preset.breadcrumb, item: url },
      ],
    };

    const scripts: { type: string; children: string }[] = [
      { type: "application/ld+json", children: JSON.stringify(breadcrumb) },
    ];
    if (rows.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(buildItemListJsonLd(rows, { name: preset.h1, url, limit: 20 })),
      });
    }

    return { ...base, scripts };
  },
  component: SeoSlugPage,
});

function SeoSlugPage() {
  const { seoSlug } = Route.useParams();
  const { rows } = Route.useLoaderData();
  const preset = seoLandingPresets.find((p) => p.slug === seoSlug);
  if (!preset) throw notFound();
  return <SeoLanding preset={preset} initialRows={rows} />;
}
