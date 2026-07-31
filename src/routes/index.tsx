import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () =>
    staticHead({
      title: "Agenție Imobiliară București | Apartamente și Ansambluri Rezidențiale — MVA Imobiliare",
      description: "Agenție imobiliară în București: apartamente de vânzare, închirieri și ansambluri rezidențiale în toată Capitala, cu expertiză aprofundată în vestul Bucureștiului — Militari, Chiajna și împrejurimi.",
      path: "/",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: Index,
});
