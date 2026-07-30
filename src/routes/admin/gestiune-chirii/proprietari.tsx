import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/proprietari")({
  component: () => <RentalPlaceholder title="Proprietari" description="Gestionează proprietarii imobilelor din portofoliu." />,
});
