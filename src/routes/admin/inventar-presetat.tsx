import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const InventoryPresetsPage = lazy(() => import("@/pages/admin/InventoryPresetsPage"));

export const Route = createFileRoute("/admin/inventar-presetat")({
  component: () => <InventoryPresetsPage />,
});
