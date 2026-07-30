import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalPlaceholder = lazy(() => import("@/pages/admin/rental/RentalPlaceholder"));

export const Route = createFileRoute("/admin/gestiune-chirii/tichete")({
  component: () => <RentalPlaceholder title="Tichete" description="Urmărește și rezolvă problemele raportate de chiriași." />,
});
