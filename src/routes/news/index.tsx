import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const News = lazy(() => import("@/pages/News"));

export const Route = createFileRoute("/news/")({
  head: () =>
    staticHead({
      title: "Știri imobiliare București | MVA Imobiliare",
      description: "Noutăți din piața imobiliară din București: prețuri, proiecte rezidențiale noi, credite și tendințe actuale.",
      path: "/news",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <News />,
});
