import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/servicii")({
  component: () => <RentalPlaceholder title="Servicii" description="Administrează serviciile asociate proprietăților." />,
});
