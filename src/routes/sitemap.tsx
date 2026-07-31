import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Sitemap = lazy(() => import("@/pages/Sitemap"));

export const Route = createFileRoute("/sitemap")({
  head: () =>
    staticHead({
      title: "Hartă Site (Sitemap) | MVA Imobiliare",
      description: "Harta completă a site-ului MVA Imobiliare — toate paginile și secțiunile importante într-un singur loc.",
      path: "/sitemap",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Sitemap />,
});
