import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/inventar")({
  component: () => <RentalPlaceholder title="Inventar" description="Gestionează inventarul imobilelor închiriate." />,
});
