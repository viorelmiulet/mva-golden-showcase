import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const OfertaRedirect = lazy(() => import("@/components/OfertaRedirect"));

export const Route = createFileRoute("/oferta-{$id}")({
  component: () => <OfertaRedirect />,
});
