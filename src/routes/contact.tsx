import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const ContactPage = lazy(() => import("@/pages/ContactPage"));

export const Route = createFileRoute("/contact")({
  head: () =>
    staticHead({
      title: "Contact MVA Imobiliare | Agenție imobiliară București",
      description: "Contactează echipa MVA Imobiliare: telefon, email, adresă și program. Îți răspundem rapid pentru orice proprietate din București.",
      path: "/contact",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <ContactPage />,
});
