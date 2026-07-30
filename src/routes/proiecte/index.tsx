import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/proiecte/")({
  beforeLoad: () => {
    throw redirect({ to: "/complexe", replace: true });
  },
});
