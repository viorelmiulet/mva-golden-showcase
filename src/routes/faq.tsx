import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const FAQ = lazy(() => import("@/pages/FAQ"));

export const Route = createFileRoute("/faq")({
  head: () =>
    staticHead({
      title: "Întrebări frecvente imobiliare | MVA Imobiliare",
      description: "Răspunsuri la întrebările frecvente despre comisioane, acte, credite ipotecare și pașii unei tranzacții imobiliare în București.",
      path: "/faq",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <FAQ />,
});
