import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ContractsPage = lazy(() => import("@/pages/admin/ContractsPage"));

export const Route = createFileRoute("/admin/contracte")({
  component: () => <ContractsPage />,
});
