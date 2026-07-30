import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const PoliticiEditoriale = lazy(() => import("@/pages/PoliticiEditoriale"));

export const Route = createFileRoute("/politici-editoriale")({
  component: () => <PoliticiEditoriale />,
});
