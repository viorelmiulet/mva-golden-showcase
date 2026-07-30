import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const TopAnsambluriRezidentialeSector6 = lazy(() => import("@/pages/TopAnsambluriRezidentialeSector6"));

export const Route = createFileRoute("/top-ansambluri-rezidentiale-sector-6")({
  component: () => <TopAnsambluriRezidentialeSector6 />,
});
