// Bounds on what a server-supplied list may put in the DOM, and on what a turn
// may put in sessionStorage.
//
// Every one of these arrays arrives from a backend that is itself fed by a
// model or a third-party catalog, and each was rendered 1:1: 10 000 citations
// became 10 000 anchors (>5 s to paint), 10 000 bands became 10 000 buttons, and
// a 1 MB reply was JSON.stringify'd whole into a ~5 MB origin quota — after
// which persistence dies silently for the rest of the browser session
// (ARCHITECTURE.md §7.14, "bounded DOM").
//
// The caps are DISPLAY limits, chosen at the size a member could plausibly use;
// each surface says how many it dropped rather than dropping them silently.

/** Sources under one research answer. A cited answer with more than this is a
 *  malformed payload, not a better-researched one. */
export const MAX_CITATIONS = 20;

/** Rows in one "best matches" shortlist — the card is a shortlist by design. */
export const MAX_MATCH_ROWS = 25;

/** Values on one profile card. MIRRORS the server's `MAX_PROFILE_CARD_ROWS`,
 *  so a well-formed payload is never cut twice. */
export const MAX_PROFILE_ROWS = 40;

/** Change cards, and notes, on one profile update. MIRRORS the server's
 *  `MAX_UPDATE_CARDS` and `MAX_UPDATE_NOTES`. */
export const MAX_PROFILE_UPDATE_CARDS = 10;

/** Pieces of one proposed change. MIRRORS the server's `MAX_UPDATE_LINES`. */
export const MAX_PROFILE_UPDATE_LINES = 25;

/** Items she may pick from on one change. MIRRORS the server's `MAX_CHOICE_ITEMS`. */
export const MAX_PROFILE_UPDATE_ITEMS = 50;

/** Steps in one Act bid checklist. */
export const MAX_CHECKLIST_STEPS = 20;

/** Choices on one range ask. Past this it is not a choosable set of bands. */
export const MAX_RANGE_BANDS = 12;

/** Pending capability-statement conflicts shown at once. MIRRORS the server's
 *  `MAX_PENDING_CONFLICTS` — the hint is a whisper at both ends. */
export const MAX_CONFLICT_HINTS = 3;

/** Longest single message text written to sessionStorage. The visible
 *  conversation keeps the full reply; only the persisted copy is clamped. */
export const MAX_PERSISTED_TEXT_CHARS = 4_000;

/** Turns kept in the persisted conversation, newest last. */
export const MAX_PERSISTED_MESSAGES = 50;

/** The first `max` entries, plus how many were left out. */
export function boundedList<T>(items: readonly T[], max: number): { shown: T[]; hidden: number } {
  if (items.length <= max) return { shown: [...items], hidden: 0 };
  return { shown: items.slice(0, max), hidden: items.length - max };
}
