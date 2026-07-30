import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/intrebari-frecvente")({
  beforeLoad: () => {
    throw redirect({ to: "/faq", replace: true });
  },
});
