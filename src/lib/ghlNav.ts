import { basepath } from "./basepath";
import { demoNavigate } from "../demo/nav/navigate";

/** Cross-page navigation intent relayed via the GHL parent frame. */
export type GhlNavIntent = {
  v: 1;
  /** Semantic page key the parent maps to a top-level GHL URL, e.g. "opportunities". */
  page: string;
  /** App-relative route the target app should land on, e.g. "/opportunities/123". */
  route: string;
  /** Epoch ms the intent was created; used for the staleness guard. */
  ts: number;
};

/** localStorage slot shared by both same-origin custom-page iframes. */
export const NAV_INTENT_KEY = "ghl:nav-intent";
/**
 * An intent older than this (ms) is ignored on boot.
 *
 * 60s, not 15s: measured on prod, Partners boots in ~14s inside GHL — a 15s TTL
 * races that boot and can drop the intent before the app is even ready to
 * consume it. 60s leaves headroom without letting a truly stale intent (a
 * reloaded tab, a bookmarked nav) fire long after the click that made it.
 */
export const NAV_INTENT_TTL_MS = 60_000;
/** postMessage `message` discriminator the parent listens for. */
export const NAV_MESSAGE = "REQUEST_NAVIGATION";

/** Build a versioned intent. Pure — `now` is injected for testability. */
export function buildNavIntent(page: string, route: string, now: number): GhlNavIntent {
  return { v: 1, page, route, ts: now };
}

function isNavIntent(value: unknown): value is GhlNavIntent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.page === "string" &&
    v.page.length > 0 &&
    typeof v.route === "string" &&
    v.route.startsWith("/") &&
    !v.route.startsWith("//") &&
    typeof v.ts === "number"
  );
}

/**
 * Parse a raw localStorage value into a fresh intent, or null if absent,
 * malformed, wrong-version, or older than the TTL. Pure — `now` is injected.
 */
export function readFreshIntent(raw: string | null, now: number): GhlNavIntent | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isNavIntent(parsed)) return null;
  if (now - parsed.ts >= NAV_INTENT_TTL_MS) return null;
  return parsed;
}

/**
 * True when the app runs inside the GHL parent frame (a custom-page iframe),
 * false when served standalone (local dev or direct access). Cross-page
 * navigation only needs the parent relay when embedded; standalone the app is
 * a single SPA and an in-app router navigation reaches every route directly.
 */
export function isEmbeddedInGhl(): boolean {
  // DEMO: the demo is never inside a GHL frame, so nothing relays to a parent.
  return false;
}

/** The Mentors page's GoHighLevel custom-menu-link id. */
export const MENTORS_MENU_LINK_ID = "16ced954-8fdc-4f9a-91eb-97d3b9c6922b";

/** The Mentors page for one location, as a top-level GoHighLevel URL. */
export function mentorsPageUrl(_locationId?: string): string {
  // DEMO: the Mentors menu link (16ced954) is the in-app mentor directory.
  return "/find-a-mentor";
}

/**
 * Take her to the Mentors page.
 *
 * Embedded in GoHighLevel, the parent bridge switches the TOP page to the
 * Mentors custom-menu-link for the current location; a plain link would load
 * GoHighLevel nested inside this iframe. Standalone, there is no parent, so the
 * browser goes to that same menu-link URL. With no location id either, the
 * caller's in-app fallback runs.
 */
export function openMentorsPage(_locationId: string | null | undefined, _fallback?: () => void): void {
  // DEMO: go to the mentor directory inside the app.
  demoNavigate(mentorsPageUrl());
}

/**
 * The surfaces that are their own GHL custom-menu-link. The parent's custom JS
 * maps each key to a menu link (docs/ghl/request-navigation-custom-js.md). The
 * parent ignores a key it does not know, so add a key here only after the
 * parent has it. "pipeline" (My Bids) is not here: its menu link id is not
 * known yet.
 */
const PAGE_KEYS = [
  "opportunities",
  "mentors",
  "partners",
  "awards",
  "small-orders",
  "forecasts",
] as const;

/**
 * Maps an app route to its GHL page key by leading path segment, e.g.
 * "/awards/123" and "/awards?q=x" both map to "awards". Everything else
 * (routes that live within the current menu-link page) maps to null.
 */
export function pageKeyForRoute(route: string): string | null {
  const segment = route.split("?")[0].split("/").filter(Boolean)[0];
  return (PAGE_KEYS as readonly string[]).includes(segment ?? "") ? (segment as string) : null;
}

/**
 * Emit a cross-page navigation request from within a GHL custom-page iframe.
 * Writes the intent to the shared-origin localStorage, then asks the parent to
 * switch the top-level page. Fire-and-forget: the parent navigation tears this
 * iframe down, so there is no response to await.
 */
export function requestCrossPageNav(_page: string, route: string): void {
  // DEMO: there is no parent frame. Move to the route inside the app.
  demoNavigate(route);
}

/** A click event, as far as the relay needs one. */
type CancelableEvent = { preventDefault(): void };

/**
 * A click handler for a <Link> to a route on another GHL page. Embedded, it
 * cancels the in-app navigation and asks the parent to open `page`. Standalone
 * (local dev, direct access), it does nothing, so the <Link> navigates as usual.
 */
export function relayWhenEmbedded(page: string, route: string) {
  return (e: CancelableEvent) => {
    if (!isEmbeddedInGhl()) return;
    e.preventDefault();
    requestCrossPageNav(page, route);
  };
}
// DEMO: `isEmbeddedInGhl()` is always false, so this handler does nothing and
// the <Link> it sits on navigates inside the app.

/** The in-app route this iframe shows now, without the router basepath. */
export function currentAppPath(): string {
  const path = window.location.pathname;
  if (basepath === "/" || !path.startsWith(basepath)) return path;
  return path.slice(basepath.length) || "/";
}

/**
 * The GHL page that shows `path`.
 * DEMO: the opportunities feed is `/opportunities`, so the leading segment is enough.
 */
function currentPageKey(path: string): string | null {
  return pageKeyForRoute(path);
}

/**
 * Relay `route` through the parent when this app is embedded in GHL and the
 * route lives on a different GHL page from `currentPath`. Returns true when it
 * relayed, so the caller must not navigate as well. A route with no page key
 * (for example /business-profile) never relays: it opens inside this iframe.
 */
export function relayCrossPageNav(route: string, currentPath: string = currentAppPath()): boolean {
  const page = pageKeyForRoute(route);
  if (!page || page === currentPageKey(currentPath) || !isEmbeddedInGhl()) return false;
  requestCrossPageNav(page, route);
  return true;
}

/**
 * A click handler for a <Link> to `route`. When `relayCrossPageNav` relays, it
 * cancels the in-app navigation. Otherwise the <Link> navigates as usual.
 */
export function crossPageClick(route: string, currentPath?: string) {
  return (e: CancelableEvent) => {
    if (relayCrossPageNav(route, currentPath)) e.preventDefault();
  };
}

/**
 * On app boot, consume any pending nav intent. Always clears the slot first
 * (so stale entries and loops are impossible), then navigates only when the
 * intent is fresh.
 */
export function consumePendingNavIntent(navigate: (route: string) => void): void {
  const raw = window.localStorage.getItem(NAV_INTENT_KEY);
  const intent = readFreshIntent(raw, Date.now());
  window.localStorage.removeItem(NAV_INTENT_KEY);
  if (intent) navigate(intent.route);
}

/**
 * Cross-origin deep-link handoff: a notification link hits the backend's
 * `/opportunities/redirect/v2` hop, which hard-redirects the browser into the
 * GHL custom-menu-link page. Because that hop is a full-page navigation (not
 * an in-app router transition), the pending opportunity id is relayed via the
 * same shared-origin localStorage pattern as `GhlNavIntent` above, but kept
 * separate since it targets a specific opportunity route rather than a
 * semantic page key.
 */

/** localStorage slot carrying a pending opportunity deep-link across the GHL page load. */
export const OPP_DEEPLINK_KEY = "ghl:opp-deeplink";
/** A deep-link older than this (ms) is ignored on boot. */
export const OPP_DEEPLINK_TTL_MS = 60_000;

/**
 * What a deep-link opens. `small-order` is a DLA DIBBS order, whose id is also
 * its `oppKey`. A stored link without `kind` (written before small orders had
 * links) means an opportunity, so `v` stays 1 and an old link still works.
 */
export type OppDeepLinkKind = "opportunity" | "small-order";

export type OppDeepLink = { v: 1; opportunityId: string; ts: number; kind?: "small-order" };

/** Build a versioned deep-link. Pure — `now` is injected for testability. */
export function buildOppDeepLink(
  opportunityId: string,
  now: number,
  kind: OppDeepLinkKind = "opportunity",
): OppDeepLink {
  return kind === "small-order"
    ? { v: 1, opportunityId, ts: now, kind }
    : { v: 1, opportunityId, ts: now };
}

function isOppDeepLink(value: unknown): value is OppDeepLink {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.opportunityId === "string" &&
    v.opportunityId.length > 0 &&
    typeof v.ts === "number" &&
    (v.kind === undefined || v.kind === "small-order")
  );
}

/** The kind a stored deep-link opens. No `kind` means an opportunity. */
export function oppDeepLinkKind(link: OppDeepLink): OppDeepLinkKind {
  return link.kind === "small-order" ? "small-order" : "opportunity";
}

/**
 * Parse a raw localStorage value into a fresh deep-link, or null if absent,
 * malformed, wrong-version, or older than the TTL. Pure — `now` is injected.
 */
export function readFreshOppDeepLink(raw: string | null, now: number): OppDeepLink | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isOppDeepLink(parsed)) return null;
  if (now - parsed.ts >= OPP_DEEPLINK_TTL_MS) return null;
  return parsed;
}

/** Persist an opportunity or small-order deep-link before a full-page redirect into the GHL menu page. */
export function storeOppDeepLink(
  opportunityId: string,
  kind: OppDeepLinkKind = "opportunity",
): void {
  // DEMO: no GHL page load sits in between. Open the target inside the app.
  demoNavigate(
    kind === "small-order"
      ? `/small-orders/${encodeURIComponent(opportunityId)}`
      : `/opportunities/${encodeURIComponent(opportunityId)}`,
  );
}

/**
 * The `target` query that `/redirect` sends to `/opportunities/redirect/v2`.
 * Mentor links land on the Mentors menu-link so the correct nav tab is active;
 * small-order links land on Small Orders; opportunity links keep the default
 * Opportunities menu-link (no parameter, as before).
 */
export function redirectTargetParam(search: {
  kind?: "small-order";
  reviewId?: string;
  ticketId?: string;
}): string {
  if (search.ticketId || search.reviewId) return "&target=mentors";
  if (search.kind === "small-order") return "&target=small-orders";
  return "";
}

/** The in-app route a consumed deep-link opens. */
export function oppDeepLinkRoute(opportunityId: string, kind: OppDeepLinkKind) {
  return kind === "small-order"
    ? ({ to: "/small-orders/$orderId", params: { orderId: opportunityId } } as const)
    : ({ to: "/opportunities/$noticeId", params: { noticeId: opportunityId } } as const);
}

/**
 * On app boot, consume any pending opportunity deep-link. Always clears the
 * slot first (so stale entries and loops are impossible), then navigates only
 * when the deep-link is fresh.
 */
export function consumeOppDeepLink(
  navigate: (opportunityId: string, kind: OppDeepLinkKind) => void,
): void {
  const raw = window.localStorage.getItem(OPP_DEEPLINK_KEY);
  const link = readFreshOppDeepLink(raw, Date.now());
  window.localStorage.removeItem(OPP_DEEPLINK_KEY);
  if (link) navigate(link.opportunityId, oppDeepLinkKind(link));
}

/**
 * NOTE: in-app "View in Mentor" navigation (already embedded in GHL) does NOT
 * use the deep-link below. Because the app runs inside a GHL iframe, jumping to
 * the Mentors menu-link must switch the TOP-LEVEL parent frame — so it reuses
 * the generic parent relay above: `requestCrossPageNav("mentors",
 * "/mentors/<reviewId>")`. The parent custom JS maps the "mentors" page key to
 * the Mentors custom-menu-link (id 0216dbf0-67b0-409d-8358-8a68b11bc25a) and
 * the in-app route rides in the shared `ghl:nav-intent` slot, consumed on boot
 * by consumePendingNavIntent.
 *
 * The store/consume pair below is the COLD cross-origin case instead: a mentor
 * notification link (email/SMS) hits `/redirect` before any GHL session, same
 * as the opportunity deep-link above but targeting a specific mentor review.
 */

/** localStorage slot carrying a pending mentor-review deep-link across the GHL page load. */
export const REVIEW_DEEPLINK_KEY = "ghl:review-deeplink";
/** A deep-link older than this (ms) is ignored on boot. */
export const REVIEW_DEEPLINK_TTL_MS = 60_000;

export type ReviewDeepLink = { v: 1; reviewId: string; ts: number };

/** Build a versioned deep-link. Pure — `now` is injected for testability. */
export function buildReviewDeepLink(reviewId: string, now: number): ReviewDeepLink {
  return { v: 1, reviewId, ts: now };
}

function isReviewDeepLink(value: unknown): value is ReviewDeepLink {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 && typeof v.reviewId === "string" && v.reviewId.length > 0 && typeof v.ts === "number"
  );
}

/**
 * Parse a raw localStorage value into a fresh deep-link, or null if absent,
 * malformed, wrong-version, or older than the TTL. Pure — `now` is injected.
 */
export function readFreshReviewDeepLink(raw: string | null, now: number): ReviewDeepLink | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isReviewDeepLink(parsed)) return null;
  if (now - parsed.ts >= REVIEW_DEEPLINK_TTL_MS) return null;
  return parsed;
}

/** Persist a mentor-review deep-link before a full-page redirect into the GHL menu page. */
export function storeReviewDeepLink(reviewId: string): void {
  // DEMO: no GHL page load sits in between. Open the review inside the app.
  demoNavigate(`/mentors/${encodeURIComponent(reviewId)}`);
}

/**
 * On app boot, consume any pending mentor-review deep-link. Always clears the
 * slot first (so stale entries and loops are impossible), then navigates only
 * when the deep-link is fresh.
 */
export function consumeReviewDeepLink(navigate: (reviewId: string) => void): void {
  const raw = window.localStorage.getItem(REVIEW_DEEPLINK_KEY);
  const link = readFreshReviewDeepLink(raw, Date.now());
  window.localStorage.removeItem(REVIEW_DEEPLINK_KEY);
  if (link) navigate(link.reviewId);
}
