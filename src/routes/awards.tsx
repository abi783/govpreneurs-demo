import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /awards.
 *
 * The <Outlet /> is load-bearing: without it the child routes never render, the URL
 * changes and the list stays on screen. That exact bug shipped in the prototype and
 * was invisible to typecheck, lint and the copy checker — only browser testing
 * caught it. Do not remove.
 */
export const Route = createFileRoute("/awards")({
  component: () => <Outlet />,
});
