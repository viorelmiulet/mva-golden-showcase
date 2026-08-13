import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  articleSchema,
  faqSchema,
} from "@/lib/seo/FacilitatiMilitariResidence.schema";

const FacilitatiMilitariResidence = lazy(() => import("@/pages/FacilitatiMilitariResidence"));

export const Route = createFileRoute("/facilitati-militari-residence")({
  head: () =>
    editorialHead({
      title: "Facilități Militari Residence — stil de viață, magazine, școli, parcuri",
      description:
        "Descoperă facilitățile din Militari Residence: parcuri, centre comerciale, săli fitness, școli, restaurante și viața de cartier. Ghid complet pentru viitori locuitori.",
      keywords:
        "facilitati militari residence, militari residence lifestyle, parcuri militari residence, scoli chiajna, centre comerciale militari, wellness spa militari, la strada militari",
      path: "/facilitati-militari-residence",
      ogType: "article",
      ogTitle: "Facilități și stil de viață în Militari Residence",
      ogDescription:
        "Descoperă ce oferă viața în Militari Residence: parcuri, magazine, fitness, școli și restaurante — ghid complet MVA Imobiliare.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <FacilitatiMilitariResidence />,
});
