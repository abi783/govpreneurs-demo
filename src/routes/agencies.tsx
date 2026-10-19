// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: "Agencies" merged into "Government Buyers" — one buyer surface.
// Keep this route so inbound links/bookmarks redirect cleanly.
// DEMO: `buys: "food"` is the filter's key for "buys the member's trade"; the agency's
// pill reads "Buys · Marketing and advertising" (BuyerSearchBar).
export const Route = createFileRoute("/agencies")({
  beforeLoad: () => {
    throw redirect({ to: "/government-buyers", search: { q: "", near: "nc", buys: "food" } });
  },
});
