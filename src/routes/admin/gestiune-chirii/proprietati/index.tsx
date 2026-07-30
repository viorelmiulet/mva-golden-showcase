import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalProperties = lazy(() => import("@/pages/admin/rental/RentalProperties"));

export const Route = createFileRoute("/admin/gestiune-chirii/proprietati/")({
  component: () => <RentalProperties />,
});
