import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ComparatieComplexuriMilitariChiajna = lazy(() => import("@/pages/ComparatieComplexuriMilitariChiajna"));

export const Route = createFileRoute("/comparatie-complexuri-militari-chiajna")({
  component: () => <ComparatieComplexuriMilitariChiajna />,
});
