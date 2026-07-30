import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const AdminLayout = lazy(() => import("@/pages/AdminLayout"));

export const Route = createFileRoute("/admin")({
  component: () => <AdminLayout />,
});
