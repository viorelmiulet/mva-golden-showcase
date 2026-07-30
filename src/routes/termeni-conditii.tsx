import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const TermeniConditii = lazy(() => import("@/pages/TermeniConditii"));

export const Route = createFileRoute("/termeni-conditii")({
  component: () => <TermeniConditii />,
});
