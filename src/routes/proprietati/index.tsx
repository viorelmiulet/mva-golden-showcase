import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Properties = lazy(() => import("@/pages/Properties"));

export const Route = createFileRoute("/proprietati/")({
  component: () => <Properties />,
});
