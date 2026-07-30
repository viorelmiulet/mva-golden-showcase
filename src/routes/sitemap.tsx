import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Sitemap = lazy(() => import("@/pages/Sitemap"));

export const Route = createFileRoute("/sitemap")({
  component: () => <Sitemap />,
});
