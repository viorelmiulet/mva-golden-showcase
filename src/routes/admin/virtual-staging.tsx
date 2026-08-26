import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const VirtualStagingPage = lazy(() => import("@/pages/admin/VirtualStagingPage"));

export const Route = createFileRoute("/admin/virtual-staging")({
  head: () => ({
    meta: [
      { title: "Virtual Staging AI | Admin MVA Imobiliare" },
      { name: "description", content: "Mobilare virtuală AI pentru fotografiile proprietăților MVA Imobiliare." },
      { property: "og:title", content: "Virtual Staging AI | Admin MVA Imobiliare" },
      { property: "og:description", content: "Mobilare virtuală AI pentru fotografiile proprietăților MVA Imobiliare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <VirtualStagingPage />,
});
