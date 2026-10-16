// Legacy /partner-finder URL — kept as a redirect so external bookmarks and
// any in-flight CommandBar/aliases continue to work. The real surface is /partners.

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/partner-finder")({
  component: () => <Navigate to="/partners" search={{ view: "find" } as never} replace />,
});
