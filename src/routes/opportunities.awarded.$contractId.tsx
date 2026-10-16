// Retired. This route served a mock award page whose "SBLO contact" was fabricated
// — a named person the public record does not contain. /awards is the real surface.
//
// It redirects to the LIST, not a detail id: the contractIds this route was linked
// with are mock ids that do not exist in the award record, so /awards/:id would 404.

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/opportunities/awarded/$contractId")({
  component: () => <Navigate to="/awards" replace />,
});
