import type { CardOpportunity } from "./mock/opportunities";

/**
 * One-slot memory of the feed, so returning to it from an opportunity lands the
 * member where they left off instead of at the top of page 1.
 *
 * WHY THIS EXISTS RATHER THAN ROUTER SCROLL RESTORATION. `scrollRestoration` is
 * already enabled on the router, and it cannot help here for two independent
 * reasons:
 *
 *   1. The detail page returns via `<Link to="/opportunities">`, a forward PUSH
 *      (which then redirects to `/`). Scroll restoration applies to POP — back
 *      and forward — so this path never triggers it.
 *   2. Even on a POP it would restore nothing useful. The feed accumulates pages
 *      into component state; unmounting discards them, so the route remounts
 *      showing only page 1. A member who had scrolled through 200 rows comes
 *      back to a document too short to hold their old offset.
 *
 * So the LIST is what has to be preserved, not just the offset. Restoring the
 * offset alone would scroll to the bottom of 50 rows and look broken.
 *
 * Deliberately module scope, not sessionStorage: a full page reload SHOULD start
 * clean, and this data is far too large to be worth persisting. It dies with the
 * tab, which is the intended lifetime.
 */
export interface FeedSnapshot {
  /** Identifies the query these rows answer — see {@link feedSnapshotKey}. */
  key: string;
  cards: CardOpportunity[];
  /** Highest page appended, so "load more" resumes rather than re-fetching. */
  currentPage: number;
  totalPages: number;
  totalOpps: number;
  /**
   * Hunter's Take lines already generated for these rows, keyed by oppKey, plus
   * the ids already requested.
   *
   * Carried because a take REPLACES a card's reasoning line and therefore
   * changes its HEIGHT. Restoring the rows without them re-rendered the feed at
   * different heights than the member left it at, and then shifted it again as
   * the takes were re-fetched — so the member landed near their place and then
   * watched it slide. Both were reported as "it scrolls a bit further than
   * where I was".
   */
  takes: ReadonlyMap<string, string>;
  requestedTakes: ReadonlySet<string>;
  /** The row the member was looking at — see {@link FeedAnchor}. Null when no
   *  card was on screen, in which case {@link applyFeedScroll} falls back to
   *  the raw offset. */
  anchor: FeedAnchor | null;
  /** Raw document offset. Only a fallback; the anchor is what normally drives
   *  restoration. See {@link applyFeedScroll} for why. */
  scrollY: number;
  savedAt: number;
}

/**
 * Where the member was, expressed as a ROW rather than a pixel offset.
 *
 * This is what makes restoration survive the environment the app actually runs
 * in. The SPA is served inside a GoHighLevel custom-page iframe
 * (`isEmbedded()`, `lib/ghlNav.ts`), and in that frame the inner document is
 * not necessarily the thing that scrolls — when the parent sizes the iframe to
 * its content, `window.scrollY` reads 0 forever and `window.scrollTo` is a
 * no-op, because the scroller is the cross-origin parent document we cannot
 * touch. `Element.scrollIntoView()` propagates to whichever ancestor actually
 * scrolls, across frame boundaries, so it works under both regimes.
 *
 * Anchoring to a row is also more honest than an offset even when the inner
 * document does scroll: card heights change with wrapped text and chip counts,
 * so the same pixel offset does not reliably mean the same place in the list.
 */
export interface FeedAnchor {
  /** `id` of the row that was at the top of the member's viewport. */
  oppKey: string;
  /** Where that row's top edge sat relative to the viewport top, in px.
   *  Negative when the row had been partly scrolled past. */
  offset: number;
}

/** DOM attribute each feed card carries so a snapshot can find its way back to
 *  the exact row. Written by `OpportunityCard`, read by the two functions
 *  below — it is a functional anchor, not a test hook. */
export const OPP_KEY_ATTR = "data-opp-key";

/**
 * How stale a snapshot may be and still be shown. Scores, deadlines and the
 * saved/closed state of a row all move; restoring a list from an hour ago would
 * quietly show a member a feed that no longer exists. Five minutes covers
 * "I opened an opportunity and came back", which is the whole use case.
 */
export const FEED_SNAPSHOT_MAX_AGE_MS = 5 * 60 * 1000;

let snapshot: FeedSnapshot | null = null;

/**
 * The identity of a feed query. A snapshot is only ever restored onto the exact
 * same question — change the tab, a filter, the sort or the search and the key
 * changes, so the stale list is ignored rather than shown under a filter it does
 * not satisfy.
 */
export function feedSnapshotKey(parts: {
  locationId: string | undefined;
  tab: string;
  filters: unknown;
  sort: unknown;
  search: string;
  preview: boolean;
  /** The buyer lane. Absent reads as "all". */
  lane?: string;
}): string {
  return JSON.stringify([
    parts.locationId ?? "",
    parts.tab,
    parts.filters,
    parts.sort,
    parts.search.trim(),
    parts.preview,
    parts.lane ?? "all",
  ]);
}

/** Records where the member was. Overwrites any previous snapshot — one slot is
 *  enough, because only the feed saves and only the feed restores. */
export function saveFeedSnapshot(
  entry: Omit<FeedSnapshot, "savedAt">,
  now: number = Date.now(),
): void {
  snapshot = { ...entry, savedAt: now };
}

/**
 * The snapshot for this query, or null when there is nothing usable — no
 * snapshot, a different query, or one too old to trust.
 *
 * Does NOT consume it. React 18's StrictMode mounts effects twice in
 * development, and a read-once slot would hand the second mount nothing, so
 * restoration would appear to work in production and not in dev.
 */
export function readFeedSnapshot(key: string, now: number = Date.now()): FeedSnapshot | null {
  if (!snapshot || snapshot.key !== key) return null;
  if (now - snapshot.savedAt > FEED_SNAPSHOT_MAX_AGE_MS) return null;
  return snapshot;
}

/** Forgets the snapshot. Used when the feed knowingly invalidates its own list
 *  (a save/unsave, a refetch), so the next return re-queries rather than
 *  restoring rows the member has already changed. */
export function clearFeedSnapshot(): void {
  snapshot = null;
}

/** Every card currently in the document, in render order. */
function cardElements(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(`[${OPP_KEY_ATTR}]`));
}

/**
 * The topmost card the member can actually see, given the set of card ids an
 * IntersectionObserver currently reports as visible.
 *
 * WHY THE VISIBILITY HAS TO COME FROM AN OBSERVER. The obvious implementation —
 * scan the cards and take the first whose `getBoundingClientRect().bottom > 0` —
 * is correct only when this document is the one that scrolls. Inside the
 * GoHighLevel custom-page iframe it usually is not: the parent sizes the frame
 * to its content and scrolls itself, so every card keeps a fixed rect in this
 * document's coordinates and the scan reports the FIRST card no matter where
 * the member has scrolled to. An IntersectionObserver with a null root resolves
 * against the top-level viewport and computes intersection through the frame
 * chain, so it reports what the member is really looking at under both regimes.
 *
 * The offset is still read from the rect: it is meaningful when this document
 * scrolls, and harmless when it does not, because the `scrollBy` that consumes
 * it is a no-op there.
 */
export function topmostVisibleAnchor(
  visible: ReadonlySet<string>,
  doc: Document = document,
): FeedAnchor | null {
  if (visible.size === 0) return null;
  for (const el of cardElements(doc)) {
    const oppKey = el.getAttribute(OPP_KEY_ATTR);
    // Cards are scanned in DOM order, so the first visible one is the topmost.
    if (oppKey && visible.has(oppKey)) {
      return { oppKey, offset: Math.round(el.getBoundingClientRect().top) };
    }
  }
  return null;
}

/**
 * Puts the member back where they were.
 *
 * Prefers the anchor row and `scrollIntoView`, which is the only mechanism that
 * works whether the scroller is this document or the GoHighLevel parent frame
 * (see {@link FeedAnchor}). The subsequent `scrollBy` restores the member's
 * exact offset within that row when this document IS the scroller, and is a
 * harmless no-op when it is not.
 *
 * Falls back to the raw offset only when the anchor row is not in the document
 * — a snapshot saved with no rows on screen, or one whose row a filter has
 * since removed.
 */
export function applyFeedScroll(snap: FeedSnapshot, doc: Document = document): void {
  const view = doc.defaultView;
  const anchor = snap.anchor;
  if (anchor) {
    const el = cardElements(doc).find((n) => n.getAttribute(OPP_KEY_ATTR) === anchor.oppKey);
    if (el) {
      el.scrollIntoView({ block: "start" });
      const delta = el.getBoundingClientRect().top - anchor.offset;
      if (delta) view?.scrollBy(0, delta);
      return;
    }
  }
  view?.scrollTo(0, snap.scrollY);
}

/**
 * The one-shot guard around restoration.
 *
 * Restoring is a MOUNT concern: it must happen once, and must never suppress
 * the refetch a later filter or sort change is supposed to cause. But "once" and
 * "on mount" are not the same instant, and conflating them is what broke this in
 * production. The feed's filters are seeded from the member's profile by an
 * async fetch that lands a beat AFTER mount, and seeding changes the feed key.
 * A guard that fired on the first render compared the snapshot against the
 * UNSEEDED key, missed, and spent its single attempt — so for every member whose
 * profile carries NAICS, states or set-asides (in practice, all of them) the
 * snapshot was written on the way out and never read on the way back.
 *
 * Hence `ready`: the attempt is not spent until the key is final.
 */
export interface RestoreGate {
  /**
   * Replays the snapshot for `key`, or null when there is nothing to replay.
   *
   * Returns null WITHOUT consuming the attempt while `ready` is false, so an
   * early call cannot cost the member their place.
   */
  attempt(key: string, ready: boolean, now?: number): FeedSnapshot | null;
}

export function createRestoreGate(): RestoreGate {
  let spent = false;
  return {
    attempt(key, ready, now = Date.now()) {
      if (spent || !ready) return null;
      spent = true;
      return readFeedSnapshot(key, now);
    },
  };
}
