import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Complexe = lazy(() => import("@/pages/Complexe"));

export const Route = createFileRoute("/complexe/")({
  head: () =>
    staticHead({
      title: "Ansambluri Rezidențiale București | MVA Imobiliare",
      description: "Ansambluri rezidențiale noi în București și împrejurimi: apartamente cu finisaje moderne, facilități complete și prețuri actualizate.",
      path: "/complexe",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Complexe />,
});
