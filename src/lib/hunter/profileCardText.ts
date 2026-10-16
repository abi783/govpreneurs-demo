// Presentation rules for the profile card's values. Pure: no React, no DOM.
//
// A capability statement is parsed into lower-case phrases ("federal market
// research"), and a list of those read as a run-on sentence. The card starts
// each entry with a capital letter and folds long text, but it never changes a
// code, an identifier or a brand name the member or the government wrote.

/** Entries a list row shows before "Show all". */
export const COLLAPSED_LIST_ITEMS = 5;

/**
 * Rows the card shows before "Show N more". The server orders the record first
 * (company name, NAICS codes, certifications, Success Center checks, service
 * area, SAM), so these are the facts that decide whether she can bid. A row
 * the record does not hold moves the next one up.
 */
export const MAIN_PROFILE_ROWS = 6;

/** Characters of text a row shows before "Show more". */
export const FOLDED_TEXT_CHARS = 280;

/** A first word written only in lower-case letters (hyphens and apostrophes allowed). */
const LOWER_CASE_FIRST_WORD = /^([a-z][a-z'’-]*)(?=$|[\s,;:.)])/;

/** A six-digit NAICS code, then its name: "541810 — Advertising services". */
const NAICS_ENTRY = /^(\d{6}) — (.+)$/;

/** How far back from the fold a word boundary may be before a hard cut. */
const WORD_BOUNDARY_SHARE = 0.6;

/**
 * The text cut at the last word boundary before `max`, with an ellipsis, or the
 * text itself when it fits. Used for the folded view only: "Show more" shows
 * the whole text again.
 */
export function foldText(text: string, max: number = FOLDED_TEXT_CHARS): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const kept = space >= max * WORD_BOUNDARY_SHARE ? cut.slice(0, space) : cut;
  return `${kept.replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** A NAICS entry split into its code and its name, or null for any other entry. */
export function naicsEntry(entry: string): { code: string; name: string } | null {
  const match = NAICS_ENTRY.exec(entry.trim());
  return match ? { code: match[1], name: match[2] } : null;
}

/**
 * The text with its first letter in upper case, when its first word is written
 * only in lower-case letters. A code ("541810"), an identifier ("UEI …") and a
 * mixed-case brand ("iOS", "eBay") are returned unchanged.
 */
export function startWithCapital(text: string): string {
  const trimmed = text.trim();
  if (!LOWER_CASE_FIRST_WORD.test(trimmed)) return trimmed;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}
