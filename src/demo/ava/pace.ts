// DEMO: how fast Ava works on screen. The prototype paced reading and checking
// so a person can watch them. On a sales call that pace is the right size. The
// tests and the crawl run in "fast" mode (`?fast=1` or `window.__DEMO_FAST__`,
// the same switch the API router uses), where every wait is zero.

export function isFast(): boolean {
  if (typeof window === "undefined") return true;
  const w = window as unknown as { __DEMO_FAST__?: boolean };
  if (w.__DEMO_FAST__) return true;
  try {
    return new URLSearchParams(window.location.search).get("fast") === "1";
  } catch {
    return false;
  }
}

/** A wait in milliseconds: the given time on a call, none in fast mode. */
export function wait(ms: number): number {
  return isFast() ? 0 : ms;
}
