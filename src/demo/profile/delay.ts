// DEMO: short waits that make an action feel real. They are near zero in the QA
// harness (`?fast=1`), like the demo API latency.

export function demoDelay(ms: number): number {
  if (typeof window === "undefined") return 0;
  const fast =
    (window as unknown as { __DEMO_FAST__?: boolean }).__DEMO_FAST__ ||
    new URLSearchParams(window.location.search).get("fast") === "1";
  return fast ? Math.min(ms, 60) : ms;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, demoDelay(ms)));
}
