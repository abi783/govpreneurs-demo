// DEMO: a stand-in for Next.js `router.refresh()`.
//
// In Next.js, `router.refresh()` asks the server to send fresh data. Here the
// `next/navigation` shim calls `demoRefresh()` instead. The call raises an event.
// A component that wants new data reads the counter from `useDemoRefresh()` and
// lists it as a dependency of its fetch effect:
//
//   const refreshTick = useDemoRefresh();
//   useEffect(() => { load(); }, [refreshTick]);
//
// `ScPage` can also remount its whole subtree on each refresh (`remountOnRefresh`).

import { useSyncExternalStore } from "react";

let tick = 0;
const listeners = new Set<() => void>();

/** Ask every listening component to load its data again. */
export function demoRefresh(): void {
  tick += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeDemoRefresh(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** A counter that goes up by one on each `demoRefresh()`. */
export function useDemoRefresh(): number {
  return useSyncExternalStore(
    subscribeDemoRefresh,
    () => tick,
    () => 0,
  );
}
