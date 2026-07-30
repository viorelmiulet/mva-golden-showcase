import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const GhidMilitariResidence = lazy(() => import("@/pages/GhidMilitariResidence"));

export const Route = createFileRoute("/ghid-militari-residence")({
  component: () => <GhidMilitariResidence />,
});
