import { createFileRoute, redirect } from "@tanstack/react-router";

// Signup is unified into the passwordless /login flow.
export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
