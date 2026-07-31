import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const TermeniConditii = lazy(() => import("@/pages/TermeniConditii"));

export const Route = createFileRoute("/termeni-conditii")({
  head: () =>
    staticHead({
      title: "Termeni și condiții | MVA Imobiliare",
      description: "Termenii și condițiile de utilizare a site-ului MVA Imobiliare și a serviciilor imobiliare oferite.",
      path: "/termeni-conditii",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <TermeniConditii />,
});
