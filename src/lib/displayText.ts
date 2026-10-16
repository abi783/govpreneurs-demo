// Display-safety for untrusted text the member reads back as their own.
//
// A bidi override (U+202E) or a zero-width joiner does not change what is
// STORED — it changes what the member SEES. A value stored as "Residential
// roofing" + U+202E + reversed text reads as a claim they never made, and an
// "SDVOSB" padded with U+200B reads as a certification whose stored token
// matches no set-aside gate. Confirming either one is a consent defect, not a
// cosmetic one (ARCHITECTURE.md §7.14).
//
// The backend has `stripInvisible`/`foldToAscii` in
// `profile-facts/facts-normalize.ts`; this is deliberately NOT that code. This
// is a DISPLAY concern — it runs on values already on file, from any age of the
// store, and it must never be reachable from the write path.

/**
 * Characters that are invisible or that reorder what follows them:
 * zero-width space/non-joiner/joiner, the LRM/RLM marks, the embedding and
 * override controls (U+202A–U+202E), the isolate controls (U+2066–U+2069) and
 * the byte-order mark.
 */
const BIDI_AND_INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;

/** The text with every invisible and bidi-control character removed, so what is
 *  rendered reads in the order it is stored. */
export function stripInvisible(text: string): string {
  return text.replace(BIDI_AND_INVISIBLE, "");
}
