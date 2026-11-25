// Fixed reference "now" so SSR and client agree. Prototype uses mock dates.
export const NOW = new Date("2026-05-07T12:00:00Z");

export function daysUntil(iso: string, now: Date = NOW): number {
  const target = new Date(iso).getTime();
  const diff = target - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDeadline(
  iso: string,
  now: Date = NOW,
): {
  text: string;
  tone: "normal" | "soon" | "crit";
} {
  const d = daysUntil(iso, now);
  // Same hole as the card's helper: an unparseable or empty `iso` yields NaN,
  // every comparison below is false, and the fall-through printed
  // "Closes in NaN weeks". State the absence instead.
  if (!Number.isFinite(d)) return { text: "No deadline on file", tone: "normal" };
  if (d < 0) return { text: "Closed", tone: "normal" };
  if (d === 0) return { text: "Closes today", tone: "crit" };
  if (d === 1) return { text: "Closes tomorrow", tone: "crit" };
  if (d <= 2) return { text: `Closes in ${d} days`, tone: "crit" };
  if (d <= 6) return { text: `Closes in ${d} days`, tone: "soon" };
  if (d <= 60) return { text: `Closes in ${d} days`, tone: "normal" };
  const weeks = Math.round(d / 7);
  return { text: `Closes in ${weeks} weeks`, tone: "normal" };
}

/** Formats an ISO date string as an absolute "Mon D, YYYY" label. Returns null
 *  for a falsy or unparseable input rather than throwing/rendering "Invalid Date". */
export function formatDateAbsolute(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function relativeTime(iso: string, now: Date = NOW): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  return `${w}w ago`;
}
/** "1 day" or "N days". */
export function daysText(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/** Short acronyms that contain a vowel, so the no-vowel test below misses them. */
const KNOWN_ACRONYMS = new Set([
  "HVAC",
  "IDIQ",
  "BPA",
  "DOD",
  "GSA",
  "NASA",
  "FAA",
  "EPA",
  "NIH",
  "USPS",
  "ADA",
  "LED",
]);

/**
 * Sentence case for record text: "HVAC REPAIR, BLDG 12" becomes "HVAC repair, BLDG 12".
 * In mixed-case text, a word of 4 letters or fewer in capitals is an acronym, so it stays.
 * In text that is all capitals, a word stays in capitals only if it has a digit, has
 * no vowel (2 to 4 letters), or is a known acronym. The function does not change words.
 */
export function sentenceCase(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  const allCaps = t === t.toUpperCase();
  const out = t.replace(/[A-Za-z0-9]+/g, (w) => {
    const up = w.toUpperCase();
    const keep = allCaps
      ? /\d/.test(w) || KNOWN_ACRONYMS.has(up) || /^[B-DF-HJ-NP-TV-XZ]{2,4}$/.test(up)
      : w === up && /[A-Z]/.test(w) && w.length <= 4 && w.length > 1;
    return keep ? up : w.toLowerCase();
  });
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** A date written out, the way the member reads it: "22 July 2027". Null when unknown. */
export function dateWords(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "FORT BRAGG" -> "Fort Bragg". For place names that the record sends in capitals. */
export function titleCaseWords(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
