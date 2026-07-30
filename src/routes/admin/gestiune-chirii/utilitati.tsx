import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/utilitati")({
  component: () => <RentalPlaceholder title="Utilități" description="Monitorizează și gestionează plățile la utilități." />,
});
