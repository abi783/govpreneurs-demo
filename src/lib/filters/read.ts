// Shared rules for reading filter values back from a URL. A hand-edited or old link must
// never add a blank chip, a huge list, or a crash.

/** The most values one filter list keeps. */
export const MAX_LIST = 200;
/** The longest value one filter keeps. */
export const MAX_TEXT = 100;

/** A list of short, non-empty strings, trimmed, without repeats, at most MAX_LIST long. */
export function readStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t.length > 0 && t.length <= MAX_TEXT) out.add(t);
    if (out.size >= MAX_LIST) break;
  }
  return [...out];
}
