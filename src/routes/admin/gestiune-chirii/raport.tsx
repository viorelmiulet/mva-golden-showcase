import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/raport")({
  component: () => <RentalPlaceholder title="Rapoarte" description="Generează rapoarte de venituri, cheltuieli și ocupare." />,
});
