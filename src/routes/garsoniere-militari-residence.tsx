import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const GarsoniereMilitariResidence = lazy(() => import("@/pages/GarsoniereMilitariResidence"));

export const Route = createFileRoute("/garsoniere-militari-residence")({
  component: () => <GarsoniereMilitariResidence />,
});
