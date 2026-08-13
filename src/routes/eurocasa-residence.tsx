import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { structuredData } from "@/lib/seo/EurocasaResidence.schema";

const EurocasaResidence = lazy(() => import("@/pages/EurocasaResidence"));

export const Route = createFileRoute("/eurocasa-residence")({
  head: () =>
    editorialHead({
      title: "Apartamente de Vânzare Eurocasa Residence – MVA Imobiliare",
      description:
        "Apartamente noi disponibile în Eurocasa Residence. MVA Imobiliare – agenție specializată în ansambluri rezidențiale zona Militari, Chiajna.",
      path: "/eurocasa-residence",
      ogType: "website",
      ogTitle: "Apartamente Eurocasa Residence – MVA Imobiliare",
      ogDescription:
        "Apartamente noi în Eurocasa Residence, Chiajna. Garsoniere, 2 și 3 camere. Vizionare gratuită.",
      image: "https://www.mvaimobiliare.ro/og-default.jpg",
      imageWidth: 1216,
      imageHeight: 640,
      twitterTitle: "Apartamente Eurocasa Residence – MVA Imobiliare",
      twitterDescription: "Apartamente noi în Eurocasa Residence, Chiajna.",
      schemas: [structuredData],
    }),
  component: () => <EurocasaResidence />,
});
