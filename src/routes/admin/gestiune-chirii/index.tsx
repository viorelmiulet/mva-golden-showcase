import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalDashboard = lazy(() => import("@/pages/admin/rental/RentalDashboard"));

export const Route = createFileRoute("/admin/gestiune-chirii/")({
  component: () => <RentalDashboard />,
});
