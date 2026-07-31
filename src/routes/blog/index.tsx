import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Blog = lazy(() => import("@/pages/Blog"));

export const Route = createFileRoute("/blog/")({
  head: () =>
    staticHead({
      title: "Blog imobiliar București | Sfaturi și analize — MVA Imobiliare",
      description: "Ghiduri, analize de piață și sfaturi practice despre cumpărarea, vânzarea și închirierea de locuințe în București.",
      path: "/blog",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Blog />,
});
