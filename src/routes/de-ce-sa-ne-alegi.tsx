import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const WhyChooseUs = lazy(() => import("@/pages/WhyChooseUs"));

export const Route = createFileRoute("/de-ce-sa-ne-alegi")({
  head: () =>
    staticHead({
      title: "De ce să alegi MVA Imobiliare | Agenție imobiliară București",
      description: "Transparență, expertiză locală și asistență completă la tranzacție — motivele pentru care clienții aleg MVA Imobiliare.",
      path: "/de-ce-sa-ne-alegi",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <WhyChooseUs />,
});
