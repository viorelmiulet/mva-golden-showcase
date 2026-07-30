import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const NewsDetail = lazy(() => import("@/pages/NewsDetail"));

export const Route = createFileRoute("/news/$slug")({
  component: () => <NewsDetail />,
});
