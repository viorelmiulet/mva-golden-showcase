import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { articleSchema, faqSchema } from "@/lib/seo/GhidMilitariResidence.schema";

const GhidMilitariResidence = lazy(() => import("@/pages/GhidMilitariResidence"));

export const Route = createFileRoute("/ghid-militari-residence")({
  head: () =>
    editorialHead({
      title: "Ghid Militari Residence 2026 — cartier, prețuri, transport",
      description:
        "Ghid complet Militari Residence: locație, transport STB și metrou Pacii, școli, magazine, parcuri și prețuri apartamente 2026. Sfaturi MVA Imobiliare.",
      keywords:
        "militari residence, ghid militari residence, apartamente militari residence, chiajna apartamente, militari residence pret, militari residence harta",
      path: "/ghid-militari-residence",
      ogType: "article",
      ogTitle: "Ghid Militari Residence 2026 — cartier, prețuri, transport",
      ogDescription:
        "Tot ce trebuie să știi înainte să cumperi în Militari Residence: locație, amenajări, transport, școli, prețuri și sfaturi din partea MVA Imobiliare.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <GhidMilitariResidence />,
});
