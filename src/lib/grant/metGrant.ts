// Whether this member has already met Grant on THIS opportunity — dismissed
// the first-meeting card, MeetGrant — persisted so a reload doesn't show the
// introduction again. Keyed per (locationId, oppKey), not globally per
// member: the card's job is to cover each opportunity's own analysis-fetch
// latency, and every opportunity fetches independently, so every opportunity
// gets its own first meeting.

const KEY_PREFIX = "grant:met:";

function key(locationId: string, oppKey: string): string {
  return `${KEY_PREFIX}${locationId}:${oppKey}`;
}

export function hasMetGrant(
  locationId: string | null | undefined,
  oppKey: string | null | undefined,
): boolean {
  if (!locationId || !oppKey || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key(locationId, oppKey)) === "1";
  } catch {
    return false;
  }
}

export function markMetGrant(
  locationId: string | null | undefined,
  oppKey: string | null | undefined,
): void {
  if (!locationId || !oppKey || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(locationId, oppKey), "1");
  } catch {
    // Storage unavailable (private mode, quota) — the dismissal still applies
    // to the current render, it just won't survive a reload.
  }
}
