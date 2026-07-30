import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const EditComplex = lazy(() => import("@/pages/admin/EditComplex"));

export const Route = createFileRoute("/admin/complexe/$id/edit")({
  component: () => <EditComplex />,
});
