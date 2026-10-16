import { createFileRoute, redirect } from "@tanstack/react-router";

// DEMO: the demo's home page is the Success Center at "/". Production's own
// /home page showed the prototype roadmap, so any old link to it goes to "/".
export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
