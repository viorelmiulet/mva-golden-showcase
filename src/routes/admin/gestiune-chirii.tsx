import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalLayout = lazy(() => import("@/pages/admin/rental/RentalLayout"));

export const Route = createFileRoute("/admin/gestiune-chirii")({
  component: () => <RentalLayout />,
});
