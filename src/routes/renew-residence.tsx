import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { structuredData } from "@/lib/seo/RenewResidence.schema";

const RenewResidence = lazy(() => import("@/pages/RenewResidence"));

export const Route = createFileRoute("/renew-residence")({
  head: () =>
    editorialHead({
      title: "Apartamente de Vânzare Renew Residence – MVA Imobiliare",
      description:
        "Apartamente noi de vânzare în Renew Residence. Oferte actualizate, prețuri corecte, vizionare gratuită. MVA Imobiliare – specialiști în zona Militari.",
      path: "/renew-residence",
      ogType: "website",
      ogTitle: "Apartamente Renew Residence – MVA Imobiliare",
      ogDescription:
        "Apartamente noi de vânzare în Renew Residence, zona Militari. Vizionare gratuită cu MVA Imobiliare.",
      image: "https://www.mvaimobiliare.ro/og-default.jpg",
      imageWidth: 1216,
      imageHeight: 640,
      twitterTitle: "Apartamente Renew Residence – MVA Imobiliare",
      twitterDescription: "Apartamente noi în Renew Residence.",
      schemas: [structuredData],
    }),
  component: () => <RenewResidence />,
});
