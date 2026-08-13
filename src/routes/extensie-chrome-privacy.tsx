import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";

const ExtensionPrivacyPolicy = lazy(() => import("@/pages/ExtensionPrivacyPolicy"));

export const Route = createFileRoute("/extensie-chrome-privacy")({
  head: () =>
    editorialHead({
      title: "Politica de Confidențialitate — Extensie Chrome MVA Admin Panel",
      description:
        "Politica de confidențialitate pentru extensia Chrome MVA Admin Panel. Află ce date colectăm și cum le protejăm.",
      path: "/extensie-chrome-privacy",
      ogType: "website",
      ogTitle: "Politica de Confidențialitate — Extensie Chrome MVA",
      ogDescription:
        "Politica de confidențialitate pentru extensia Chrome MVA Admin Panel.",
      image: "https://www.mvaimobiliare.ro/og-default.jpg",
      imageWidth: 1216,
      imageHeight: 640,
      twitterTitle: "Politica de Confidențialitate — Extensie MVA",
    }),
  component: () => <ExtensionPrivacyPolicy />,
});
