import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  articleSchema,
  faqSchema,
} from "@/lib/seo/ViataInMilitariResidence.schema";

const ViataInMilitariResidence = lazy(() => import("@/pages/ViataInMilitariResidence"));

export const Route = createFileRoute("/viata-in-militari-residence")({
  head: () =>
    editorialHead({
      title: "Viața în Militari Residence 2026 — avantaje, dezavantaje, sfaturi",
      description:
        "Cum e să locuiești în Militari Residence: comunitate, rutină zilnică, trafic, școli, magazine. Avantajele și dezavantajele reale ale apartamentelor din Militari Residence.",
      keywords:
        "viata in militari residence, apartamente militari, militari residence pareri, cum e sa locuiesti militari residence, militari residence comunitate",
      path: "/viata-in-militari-residence",
      ogType: "article",
      ogTitle: "Viața în Militari Residence 2026 — avantaje, dezavantaje, sfaturi",
      ogDescription:
        "Ghid onest, lived-in, despre viața în Militari Residence: comunitate, magazine, școli, trafic și sfaturi pentru cumpărători.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <ViataInMilitariResidence />,
});
