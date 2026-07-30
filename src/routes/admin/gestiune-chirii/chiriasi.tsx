import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalTenants = lazy(() => import("@/pages/admin/rental/RentalTenants"));

export const Route = createFileRoute("/admin/gestiune-chirii/chiriasi")({
  component: () => <RentalTenants />,
});
