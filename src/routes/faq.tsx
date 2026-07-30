import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const FAQ = lazy(() => import("@/pages/FAQ"));

export const Route = createFileRoute("/faq")({
  component: () => <FAQ />,
});
