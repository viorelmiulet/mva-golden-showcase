import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/intrebari-frecvente")({
  head: () =>
    staticHead({
      title: "Întrebări frecvente imobiliare | MVA Imobiliare",
      description: "Răspunsuri la cele mai frecvente întrebări despre comisioane, acte, credite și pașii unei tranzacții imobiliare în București.",
      path: "/intrebari-frecvente",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  beforeLoad: () => {
    throw redirect({ to: "/faq", replace: true });
  },
});
