import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { articleSchema, faqSchema } from "@/lib/seo/MilitariVsChiajna.schema";

const MilitariVsChiajna = lazy(() => import("@/pages/MilitariVsChiajna"));

export const Route = createFileRoute("/militari-vs-chiajna-comparatie")({
  head: () =>
    editorialHead({
      title: "Militari Residence vs. Chiajna 2026 — comparație prețuri, metrou, școli",
      description:
        "Compară Militari Residence și Chiajna: preț pe metru pătrat, distanța până la metroul Pacii, școli și calitate vieții. Ghid 2026 pentru cumpărători.",
      path: "/militari-vs-chiajna-comparatie",
      ogType: "article",
      ogTitle: "Militari Residence vs. Chiajna — comparație 2026",
      ogDescription:
        "Care zonă e mai bună pentru cumpărători: Militari Residence sau Chiajna? Prețuri, metrou, școli, infrastructură.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <MilitariVsChiajna />,
});
