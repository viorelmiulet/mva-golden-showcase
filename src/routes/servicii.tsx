import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Servicii = lazy(() => import("@/pages/Servicii"));

export const Route = createFileRoute("/servicii")({
  head: () =>
    staticHead({
      title: "Servicii imobiliare în București | MVA Imobiliare",
      description: "Vânzare, cumpărare, închiriere și administrare de proprietăți în București. Evaluare, promovare și asistență la tranzacție.",
      path: "/servicii",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Servicii />,
});
