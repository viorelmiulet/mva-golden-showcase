import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const DespreNoi = lazy(() => import("@/pages/DespreNoi"));

export const Route = createFileRoute("/despre-noi")({
  component: () => <DespreNoi />,
});
