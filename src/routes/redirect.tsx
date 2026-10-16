import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { API_BASE_URL } from "../lib/api";
import { redirectTargetParam, storeOppDeepLink, storeReviewDeepLink } from "../lib/ghlNav";

type RedirectSearch = {
  locationId?: string;
  opportunityId?: string;
  /** `small-order` when `opportunityId` holds a small-order id; absent for an opportunity. */
  kind?: "small-order";
  reviewId?: string;
  ticketId?: string;
};

/**
 * Notification deep-link landing hop:
 * `/v2/ui/redirect?locationId=X&opportunityId=Y` (opportunity),
 * `/v2/ui/redirect?locationId=X&opportunityId=Y&kind=small-order` (a small
 * order, which opens on the Small Orders menu-link) or
 * `/v2/ui/redirect?locationId=X&ticketId=N` (mentor review — the notification
 * source knows only the Freshdesk ticket id). Mirrors v1's `RedirectOpportunity`
 * page. Runs before the user has a GHL session (see `/redirect` bypass in
 * `__root.tsx`'s `AuthGate`): resolves `ticketId` to the review's Mongo _id via
 * the unauthenticated `/mentor-reviews/by-ticket/:ticketId`, stores the target
 * id for `consumeOppDeepLink`/`consumeReviewDeepLink` to pick up after the GHL
 * page reload, resolves the v2 custom-menu-link portal URL from the backend,
 * and hard-redirects there. (`reviewId` is still accepted directly for testing.)
 */
export const Route = createFileRoute("/redirect")({
  validateSearch: (search: Record<string, unknown>): RedirectSearch => ({
    locationId: typeof search.locationId === "string" ? search.locationId : undefined,
    opportunityId: typeof search.opportunityId === "string" ? search.opportunityId : undefined,
    kind: search.kind === "small-order" ? "small-order" : undefined,
    reviewId: typeof search.reviewId === "string" ? search.reviewId : undefined,
    // TanStack's default search parser JSON-parses a bare numeric query value,
    // so `?ticketId=175` arrives as the NUMBER 175 — coerce it back to a string
    // (a string-only guard would silently drop every numeric ticket id).
    ticketId:
      typeof search.ticketId === "string"
        ? search.ticketId
        : typeof search.ticketId === "number"
          ? String(search.ticketId)
          : undefined,
  }),
  component: RedirectPage,
});

function RedirectPage() {
  const { locationId, opportunityId, kind, reviewId, ticketId } = Route.useSearch();

  useEffect(() => {
    if (opportunityId) storeOppDeepLink(opportunityId, kind ?? "opportunity");
    if (reviewId) storeReviewDeepLink(reviewId);

    const run = async () => {
      if (!locationId) {
        window.location.href = "https://app.govpreneurs.com";
        return;
      }
      // Resolve a Freshdesk ticket id to the review's Mongo _id BEFORE the GHL
      // hop (the id must be stored before the full-page reload). Best-effort: a
      // failure just means the user lands on the menu-link without the specific
      // thread, rather than blocking the redirect.
      if (ticketId && !reviewId) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/mentor-reviews/by-ticket/${encodeURIComponent(ticketId)}`,
          );
          if (res.ok) {
            const { reviewId: resolved } = (await res.json()) as { reviewId: string };
            if (resolved) storeReviewDeepLink(resolved);
          }
        } catch {
          /* fall through to the menu-link redirect */
        }
      }
      const target = redirectTargetParam({ kind, reviewId, ticketId });
      try {
        const res = await fetch(
          `${API_BASE_URL}/opportunities/redirect/v2?locationId=${encodeURIComponent(locationId)}${target}`,
        );
        const data: { link: string } = await res.json();
        window.location.href = data.link;
      } catch {
        window.location.href = "https://app.govpreneurs.com";
      }
    };
    void run();
  }, [locationId, opportunityId, kind, reviewId, ticketId]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <div className="t-body-sm" style={{ color: "var(--text-2)" }}>
        Loading…
      </div>
    </div>
  );
}
