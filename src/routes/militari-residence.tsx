import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MilitariResidence = lazy(() => import("@/pages/MilitariResidence"));

export const Route = createFileRoute("/militari-residence")({
  component: () => <MilitariResidence />,
});
