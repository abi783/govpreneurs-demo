// Legacy /whos-winning URL — the prototype "Who's winning" page ran on mock data
// (lib/mock/explore) and was still reachable on production. The real surface is the
// Partners page's market tab; partners.tsx already maps the legacy name via LEGACY_VIEW.

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/whos-winning")({
  component: () => <Navigate to="/partners" search={{ view: "market" } as never} replace />,
});
