import { lazy } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { seoLandingPresets } from "@/lib/seoLandingPresets";

const SeoLanding = lazy(() => import("@/pages/SeoLanding"));

// Dynamic SEO landing pages (one per preset in seoLandingPresets).
// Unknown single-segment slugs fall through to the root notFoundComponent.
export const Route = createFileRoute("/$seoSlug")({
  beforeLoad: ({ params }) => {
    const preset = seoLandingPresets.find((p) => p.slug === params.seoSlug);
    if (!preset) throw notFound();
  },
  component: SeoSlugPage,
});

function SeoSlugPage() {
  const { seoSlug } = Route.useParams();
  const preset = seoLandingPresets.find((p) => p.slug === seoSlug);
  if (!preset) throw notFound();
  return <SeoLanding preset={preset} />;
}
