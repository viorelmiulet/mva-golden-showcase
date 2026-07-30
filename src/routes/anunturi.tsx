import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/anunturi")({
  beforeLoad: () => {
    throw redirect({ to: "/proprietati", replace: true });
  },
});
