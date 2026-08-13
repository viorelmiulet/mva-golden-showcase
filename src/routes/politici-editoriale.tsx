import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";

const PoliticiEditoriale = lazy(() => import("@/pages/PoliticiEditoriale"));

export const Route = createFileRoute("/politici-editoriale")({
  head: () =>
    editorialHead({
      title: "Politici Editoriale | MVA Imobiliare",
      description:
        "Standardele editoriale și principiile redacționale ale MVA Imobiliare pentru conținutul publicat pe blog și site.",
      path: "/politici-editoriale",
      ogType: "website",
      image: "https://www.mvaimobiliare.ro/og-default.jpg",
      imageWidth: 1216,
      imageHeight: 640,
      twitterDescription: "Standardele editoriale MVA Imobiliare.",
    }),
  component: () => <PoliticiEditoriale />,
});
