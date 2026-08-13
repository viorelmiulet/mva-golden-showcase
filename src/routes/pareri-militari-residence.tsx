import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  reviewSchema,
  aggregateSchema,
  faqSchema,
} from "@/lib/seo/PareriMilitariResidence.schema";

const PareriMilitariResidence = lazy(() => import("@/pages/PareriMilitariResidence"));

export const Route = createFileRoute("/pareri-militari-residence")({
  head: () =>
    editorialHead({
      title: "Militari Residence Păreri 2026 — review onest, note și opinii reale",
      description:
        "Militari Residence păreri 2026: review complet cu note pe fiecare capitol, avantaje, dezavantaje, testimoniale reale ale locatarilor și răspunsuri la cele mai frecvente întrebări.",
      keywords:
        "militari residence pareri, militari residence review, opinii militari residence, militari residence merita, pareri apartamente militari residence",
      path: "/pareri-militari-residence",
      ogType: "article",
      ogTitle: "Militari Residence Păreri 2026 — review onest, note și opinii reale",
      ogDescription:
        "Review complet Militari Residence: note pe calitate construcție, comunitate, trafic, comerț și testimoniale reale ale locatarilor.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
      schemas: [reviewSchema, aggregateSchema, faqSchema],
    }),
  component: () => <PareriMilitariResidence />,
});
