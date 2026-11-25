// Retired. This route served a mock award page whose "SBLO contact" was fabricated
// — a named person the public record does not contain. /awards is the real surface.
//
// Old links carry the award id, so it goes to /awards?award=<id>, which opens the
// real award window (or its not-found state) over the list.

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/opportunities/awarded/$contractId")({
  component: Redirect,
});

function Redirect() {
  const { contractId } = Route.useParams();
  return <Navigate to="/awards" search={{ award: contractId }} replace />;
}
