import { createFileRoute } from "@tanstack/react-router";
import PropertyDetail from "@/pages/PropertyDetail";

export const Route = createFileRoute("/proprietati/$slug")({
  component: PropertyDetail,
});
