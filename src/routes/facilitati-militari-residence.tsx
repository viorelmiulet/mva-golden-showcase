import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const FacilitatiMilitariResidence = lazy(() => import("@/pages/FacilitatiMilitariResidence"));

export const Route = createFileRoute("/facilitati-militari-residence")({
  component: () => <FacilitatiMilitariResidence />,
});
