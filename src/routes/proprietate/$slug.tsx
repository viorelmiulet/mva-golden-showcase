import { createFileRoute } from "@tanstack/react-router";
import ImmofluxPropertyDetail from "@/pages/ImmofluxPropertyDetail";

export const Route = createFileRoute("/proprietate/$slug")({
  component: ImmofluxPropertyDetail,
});
