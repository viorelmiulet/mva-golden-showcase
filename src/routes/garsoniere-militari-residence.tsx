import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  articleSchema,
  faqSchema,
} from "@/lib/seo/GarsoniereMilitariResidence.schema";

const GarsoniereMilitariResidence = lazy(() => import("@/pages/GarsoniereMilitariResidence"));

export const Route = createFileRoute("/garsoniere-militari-residence")({
  head: () =>
    editorialHead({
      title: "Garsoniere Militari Residence — Prețuri, Layout & ROI | MVA",
      description:
        "Ghid complet pentru cumpărarea unei garsoniere în Militari Residence: prețuri 55.000–75.000 €, layout-uri tipice, randament 6–8% la închiriere. Vezi oferta MVA Imobiliare.",
      path: "/garsoniere-militari-residence",
      ogType: "article",
      ogTitle: "Garsoniere Militari Residence — Ghid expert de cumpărare",
      ogDescription:
        "Layout-uri, prețuri actuale și potențial de investiție pentru garsonierele din Militari Residence.",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <GarsoniereMilitariResidence />,
});
