import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const GhidNouaCasa2024 = lazy(() => import("@/pages/GhidNouaCasa2024"));

export const Route = createFileRoute("/ghid-noua-casa-2024")({
  component: () => <GhidNouaCasa2024 />,
});
