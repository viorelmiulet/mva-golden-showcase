import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MilitariVsChiajna = lazy(() => import("@/pages/MilitariVsChiajna"));

export const Route = createFileRoute("/militari-vs-chiajna-comparatie")({
  component: () => <MilitariVsChiajna />,
});
