import { createFileRoute, notFound } from "@tanstack/react-router";
import ComplexDetail from "@/pages/ComplexDetail";
import NotFound from "@/pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { getComplexUrl } from "@/lib/complexSlug";
import { getPropertyUrl } from "@/lib/propertySlug";
import { buildItemListJsonLd } from "@/lib/listingJsonLd";
import { resolvePropertyVideo } from "@/lib/videoEmbed";
import { isUUID } from "@/lib/complexSlug";

const SITE = "https://www.mvaimobiliare.ro";

export const Route = createFileRoute("/complexe/$slug")({
  loader: async ({ params }) => {
    // Legacy UUID URLs are resolved client-side (redirect to the canonical slug).
    if (isUUID(params.slug)) return null;

    const { data: project } = await supabase
      .from("real_estate_projects")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();

    if (!project) throw notFound();

    const { data: props } = await supabase
      .from("catalog_offers")
      .select("*")
      .eq("project_id", project.id)
      .order("title");

    const properties = props ?? [];
    const active = properties.filter(
      (p: any) => p.is_published !== false && p.availability_status !== "sold"
    );

    return { project, properties, activeCount: active.length };
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project as any;
    if (!project) {
      return { meta: [{ title: "Ansamblu rezidențial — MVA Imobiliare" }] };
    }
    const properties = (loaderData?.properties ?? []) as any[];
    const activeCount = loaderData?.activeCount ?? 0;
    const url = `${SITE}${getComplexUrl(project)}`;
    const title = `${project.name}${project.location ? ` — ${project.location}` : ""} | MVA Imobiliare`;
    const description = (
      project.description ||
      `Apartamente disponibile în ${project.name}${project.location ? `, ${project.location}` : ""}. Prețuri, suprafețe, planuri și disponibilitate actualizată.`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 158);
    const image: string | null =
      typeof project.main_image === "string" && /^https?:\/\//.test(project.main_image)
        ? project.main_image
        : null;

    const linkable = properties.filter(
      (p) => p.is_published !== false && p.availability_status !== "sold"
    );

    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Ansambluri", item: `${SITE}/complexe` },
            { "@type": "ListItem", position: 3, name: project.name, item: url },
          ],
        }),
      },
    ];

    if (linkable.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(
          buildItemListJsonLd(linkable, { name: project.name, url, limit: 24 })
        ),
      });
    }

    const video = resolvePropertyVideo(null, project);
    if (video) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: `Tur video — ${project.name}`,
          description,
          ...(video.thumbnailUrl || image ? { thumbnailUrl: video.thumbnailUrl || image } : {}),
          uploadDate: new Date(project.updated_at || project.created_at || Date.now()).toISOString(),
          embedUrl: video.embedUrl,
          ...(video.watchUrl ? { contentUrl: video.watchUrl } : {}),
        }),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(activeCount === 0 ? [{ name: "robots", content: "noindex, follow" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { property: "og:image:alt", content: `${project.name} — ansamblu rezidențial` },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  notFoundComponent: NotFound,
  errorComponent: NotFound,
  component: ComplexRoute,
});

function ComplexRoute() {
  const data = Route.useLoaderData();
  return (
    <ComplexDetail
      initialProject={data?.project ?? null}
      initialProperties={data?.properties ?? null}
    />
  );
}

export { getPropertyUrl };
