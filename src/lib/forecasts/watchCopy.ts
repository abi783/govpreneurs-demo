// The words of the forecast watch, in one place: the box "What changed since you
// tracked it" (feature 9), the change markers (feature 10) and the watch promises per
// copy state (feature 12). ARCHITECTURE-forecasts-watch.md §11.
//
// Owner: F0 wrote it; after F0 only feature 12 changes words here, and no feature
// renames a key. Values arrive formatted: the box formats a date, an amount or a
// who-may-bid code with the page's own readers before it calls these.
//
// Rules this file is held to: scripts/check-plain-english.ts, one instruction per
// sentence, and none of "deadline", "due", "closes" or the aggregator's name.

import type { WatchCopyState } from "./watch";

/** A value the record did not state. */
export const NOT_STATED = "not stated";

/** The box on the forecast page. */
export const WATCH_BOX = {
  title: "What changed since you tracked it",
  markSeen: "Mark as seen",
  newTag: "New",
  seenTag: "Seen",
  noticed: (day: string) => `Noticed on ${day}`,
  /** An unseen change that no line can word. It names no change it cannot state. */
  unworded: "The watch recorded a change that this page cannot show.",
};

/** One line per event kind. `before` and `after` arrive formatted. */
export const WATCH_LINE = {
  dateMoved: (before: string, after: string) =>
    `The expected posting date moved. Before, it was ${before}. Now it is ${after}.`,
  setAsideDecided: (after: string) => `The buyer now says who may bid: ${after}.`,
  setAsideChanged: (before: string, after: string) =>
    `Who may bid changed from ${before} to ${after}.`,
  setAsideRemoved: (before: string) =>
    `The record no longer says who may bid. Before, it said ${before}.`,
  /** When the who-may-bid reader says the same, or nothing, on a side: the codes. */
  setAsideCode: (before: string, after: string) =>
    `The set-aside code changed from ${before} to ${after}.`,
  valueLow: (before: string, after: string) =>
    `The low end of the estimate changed from ${before} to ${after}.`,
  valueHigh: (before: string, after: string) =>
    `The high end of the estimate changed from ${before} to ${after}.`,
  naics: (before: string, after: string) => `The NAICS code changed from ${before} to ${after}.`,
  psc: (before: string, after: string) =>
    `The product or service code changed from ${before} to ${after}.`,
  state: (before: string, after: string) =>
    `The state of the work changed from ${before} to ${after}.`,
  city: (before: string, after: string) =>
    `The city of the work changed from ${before} to ${after}.`,
  expectedDatePassed:
    "The buyer's expected posting date passed. This forecast no longer shows on the forecasts list. The buyer did not say that it closed.",
  noLongerListed:
    "The source no longer lists this forecast. The record does not say why. It may have posted, moved or stopped.",
};

/**
 * A notice the watch links to this forecast (ARCHITECTURE-forecast-links.md §8.3).
 * `bid_request_posted` and `republished` are certain: the forecast names the number, or
 * the new record has the same plan number. A suggestion is never a claim: it says "may"
 * and "check", and it states its basis as words, never as a number. No line names the
 * notice's own response date.
 */
export const WATCH_NOTICE = {
  /** The headline of an exact link, by the notice's own type. */
  postedHeadline: {
    bidRequest: "The bid request for this forecast has posted.",
    earlyNotice: "An early notice for this forecast's bid request has posted.",
    sourcesSought: "The agency posted a request to find companies for this work.",
    other: "The agency posted a notice for this forecast.",
  },
  /**
   * The notice's title, office and posted day. A part the record does not give is left
   * out, never filled. Null when the record gives none of the three.
   */
  names: (title: string | null, office: string | null, posted: string | null): string | null => {
    if (!title && !office && !posted) return null;
    const subject = title ? `“${title}”` : "A notice";
    const from = office ? ` from ${office}` : "";
    const when = posted ? `, posted on ${posted}` : "";
    return `${subject}${from}${when}.`;
  },
  namedBasis: (number: string) =>
    `This forecast names the number ${number}. The agency posted a notice with that number.`,
  republishedHeadline: "The agency published this forecast again as a new record.",
  planBasis: (sourceId: string) => `The new record has the same plan number, ${sourceId}.`,
  republishedFollow: "This watch stays on this record. To see changes to the new record, track it.",
  suggestedHeadline: "A notice that may be this one. Check it.",
  suggestedOffice: {
    same: "It comes from the same office as this forecast.",
    within: (name: string) => `It comes from an office under ${name}.`,
    /** The agency tree gave no name for the forecast's office. */
    withinUnnamed: "It comes from an office under this forecast's office.",
  },
  /** A band, never a percentage or a probability. */
  suggestedOverlap: {
    strong: "Many of its words are also in this forecast.",
    some: "Some of its words are also in this forecast.",
  },
  suggestedOnly: "We found it by these two facts only. We do not know that it is this forecast.",
  /** The link's words. `notice`: an exact link whose type is not a bid request. */
  open: {
    opportunity: "Open the bid request",
    notice: "Open the notice",
    forecast: "Open the new forecast",
    suggested: "Check the notice",
  },
  notHeld: "No page is available for this notice now.",
};

/** The marker on a card or a row: text and an icon, never colour alone. */
export const WATCH_MARKER = {
  label: (n: number) => (n === 1 ? "1 change" : `${n} changes`),
  accessibleName: (n: number) =>
    n === 1 ? "1 unseen change to this forecast" : `${n} unseen changes to this forecast`,
};

/** What the page may promise in one copy state. `null`: the surface shows no promise. */
export interface WatchPromises {
  /** The Track control's tooltip (PRD B1). */
  trackTooltip: string;
  /** The chip on a "watch" unknown before she tracks. Null: use the process A4 names. */
  chipUntracked: string | null;
  /** The chip on a "watch" unknown once she tracks. Null: use the process A4 names. */
  chipTracked: string | null;
  /** The line under Still unknown. Null: the line is hidden. */
  trackLine: string | null;
  /** The last sentence of Grant's bounds (MEET.bounds). Null: it ends before it. */
  boundsPromise: string | null;
}

/**
 * The watch promises, per copy state.
 * "off": no promise at all; the Track control keeps it on the saved list, nothing more.
 * "inApp": the promise names this page and My Bids, never email.
 * "email": the promise may name email, only while the server says `notify`.
 */
export const WATCH_PROMISE: Record<WatchCopyState, WatchPromises> = {
  off: {
    trackTooltip: "Keep this forecast on your saved list.",
    chipUntracked: null,
    chipTracked: null,
    trackLine: null,
    boundsPromise: null,
  },
  inApp: {
    trackTooltip:
      "Keep this forecast on your saved list. Changes show on this page and in My Bids.",
    chipUntracked: "Watched once you track it",
    chipTracked: "Watched",
    trackLine: "Track this forecast at the top. Changes to it show on this page and in My Bids.",
    boundsPromise: "Track it, and I will show changes on this page and in My Bids.",
  },
  email: {
    trackTooltip:
      "Keep this forecast on your saved list. Changes show on this page, in My Bids and by email.",
    chipUntracked: "Watched once you track it",
    chipTracked: "Watched",
    trackLine:
      "Track this forecast at the top. Changes to it show on this page and in My Bids. We also send you an email.",
    boundsPromise:
      "Track it, and I will show changes on this page and in My Bids. We also send you an email.",
  },
};
