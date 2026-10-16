// Fixed reference "now" so SSR and client agree. Prototype uses mock dates.
export const NOW = new Date("2026-05-07T12:00:00Z");

export function daysUntil(iso: string, now: Date = NOW): number {
  const target = new Date(iso).getTime();
  const diff = target - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDeadline(iso: string, now: Date = NOW): {
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