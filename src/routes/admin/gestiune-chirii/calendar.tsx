import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RentalCalendar = lazy(() => import("@/pages/admin/rental/RentalCalendar"));

export const Route = createFileRoute("/admin/gestiune-chirii/calendar")({
  component: () => <RentalCalendar />,
});
