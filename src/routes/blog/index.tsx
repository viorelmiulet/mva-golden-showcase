import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Blog = lazy(() => import("@/pages/Blog"));

export const Route = createFileRoute("/blog/")({
  component: () => <Blog />,
});
