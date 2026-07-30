import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const AddProperty = lazy(() => import("@/pages/AddProperty"));

export const Route = createFileRoute("/adauga")({
  component: () => <AddProperty />,
});
