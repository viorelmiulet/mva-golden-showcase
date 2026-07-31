import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const PoliticaConfidentialitate = lazy(() => import("@/pages/PoliticaConfidentialitate"));

export const Route = createFileRoute("/politica-confidentialitate")({
  head: () =>
    staticHead({
      title: "Politica de confidențialitate | MVA Imobiliare",
      description: "Cum colectăm, folosim și protejăm datele personale ale utilizatorilor site-ului MVA Imobiliare, conform GDPR.",
      path: "/politica-confidentialitate",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <PoliticaConfidentialitate />,
});
