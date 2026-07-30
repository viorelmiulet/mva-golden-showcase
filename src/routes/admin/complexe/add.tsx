import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const AddComplex = lazy(() => import("@/pages/admin/AddComplex"));

export const Route = createFileRoute("/admin/complexe/add")({
  component: () => <AddComplex />,
});
