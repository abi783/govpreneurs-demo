import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: "Agencies" merged into "Government Buyers" — one buyer surface.
// Keep this route so inbound links/bookmarks redirect cleanly.
export const Route = createFileRoute("/agencies")({
  beforeLoad: () => {
    throw redirect({ to: "/government-buyers", search: { q: "", near: "nc", buys: "food" } });
  },
});
