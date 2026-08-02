import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BlogPost = lazy(() => import("@/pages/BlogPost"));

const SITE = "https://www.mvaimobiliare.ro";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    try {
      const { data } = await supabase
        .from("blog_posts")
        .select("title, excerpt, meta_title, meta_description, cover_image, author, created_at, updated_at, category")
        .eq("slug", params.slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!data) return null;

      const url = `${SITE}/blog/${params.slug}`;
      const description = data.meta_description || data.excerpt || data.title;
      const image = data.cover_image || `${SITE}/og-image.jpg`;

      return {
        title: `${data.meta_title || data.title} | MVA Imobiliare`,
        description,
        image,
        url,
        articleLd: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title,
          description,
          image,
          datePublished: data.created_at,
          dateModified: data.updated_at || data.created_at,
          author: { "@type": "Person", name: data.author || "MVA Imobiliare" },
          publisher: {
            "@type": "Organization",
            name: "MVA Imobiliare",
            logo: { "@type": "ImageObject", url: `${SITE}/og-image.jpg` },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          ...(data.category ? { articleSection: data.category } : {}),
        }),
        breadcrumbLd: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
            { "@type": "ListItem", position: 3, name: data.title, item: url },
          ],
        }),
      };
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { title, description, image, url, articleLd, breadcrumbLd } = loaderData;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: articleLd },
        { type: "application/ld+json", children: breadcrumbLd },
      ],
    };
  },
  component: () => <BlogPost />,
});
