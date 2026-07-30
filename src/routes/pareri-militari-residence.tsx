import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const PareriMilitariResidence = lazy(() => import("@/pages/PareriMilitariResidence"));

export const Route = createFileRoute("/pareri-militari-residence")({
  component: () => <PareriMilitariResidence />,
});
