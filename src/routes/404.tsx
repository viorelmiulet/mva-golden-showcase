import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const NotFound = lazy(() => import("@/pages/NotFound"));

export const Route = createFileRoute("/404")({
  component: () => <NotFound />,
});
