import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ImmofluxCodesPage = lazy(() => import("@/pages/admin/ImmofluxCodesPage"));

export const Route = createFileRoute("/admin/immoflux-codes")({
  component: () => <ImmofluxCodesPage />,
});
