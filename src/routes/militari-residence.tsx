import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { structuredData, faqStructuredData } from "@/lib/seo/MilitariResidence.schema";

const MilitariResidence = lazy(() => import("@/pages/MilitariResidence"));

export const Route = createFileRoute("/militari-residence")({
  head: () =>
    editorialHead({
      title: "Apartamente de Vânzare Militari Residence – MVA Imobiliare",
      description:
        "Apartamente noi de vânzare în Militari Residence, Chiajna. Garsoniere, 2 și 3 camere, prețuri actualizate. Contactează MVA Imobiliare.",
      path: "/militari-residence",
      ogType: "website",
      ogTitle: "Apartamente Militari Residence – MVA Imobiliare",
      ogDescription:
        "Apartamente noi de vânzare în Militari Residence, Chiajna. Vizionare gratuită cu MVA Imobiliare.",
      image: "https://www.mvaimobiliare.ro/og-default.jpg",
      imageWidth: 1216,
      imageHeight: 640,
      twitterTitle: "Apartamente Militari Residence – MVA Imobiliare",
      twitterDescription: "Apartamente noi în Militari Residence, Chiajna.",
      schemas: [structuredData, faqStructuredData],
    }),
  component: () => <MilitariResidence />,
});
