import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Properties = lazy(() => import("@/pages/Properties"));

export const Route = createFileRoute("/proprietati/")({
  head: () =>
    staticHead({
      title: "Proprietăți de vânzare și închiriere în București | MVA Imobiliare",
      description: "Caută apartamente, garsoniere și case în București: filtre după zonă, preț, camere și suprafață. Ofertele MVA Imobiliare, actualizate zilnic.",
      path: "/proprietati",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Properties />,
});
