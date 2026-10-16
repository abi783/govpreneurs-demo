// Helpers for writing Ava bid fixtures. Pure constructors, no logic.
//
// `doc()` builds a Source whose `quote` is the BUYER'S words. A quotation is
// not our copy: the plain-English gate skips text inside an unclosed `doc(`
// call (scripts/check-plain-english.ts), because we do not get to redraft a
// city's bid request to reach Grade 6. Everything else in a fixture — titles,
// why-lines, notes — is our copy and is held to the bar.

import type { Proof, Source } from "./types";

/** A place in the buyer's files, with the buyer's exact words. */
export function doc(fileId: string, locator: string, short: string, quote?: string): Source {
  return quote === undefined ? { fileId, locator, short } : { fileId, locator, short, quote };
}

/** A fact from one of the member's own documents. */
export function yourDoc(from: string, locator: string, quote: string): Proof {
  return { kind: "your-document", from, locator, quote };
}

/** A fact from the member's GovPreneurs profile. */
export function profile(locator: string, quote: string): Proof {
  return { kind: "profile", from: "Your GovPreneurs profile", locator, quote };
}

/** A fact from the member's SAM.gov registration. */
export function sam(locator: string, quote: string): Proof {
  return { kind: "sam", from: "Your SAM.gov registration", locator, quote };
}

/** A fact the member confirmed to Ava. */
export function confirmed(locator: string, quote: string): Proof {
  return { kind: "you-confirmed", from: "You told Ava", locator, quote };
}
