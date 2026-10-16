// Tiny in-process pub/sub used by in-memory data slices to notify subscribers
// when mutations happen. Replaces the duplicated CustomEvent / window listener
// scaffolding used previously alongside localStorage. No browser storage —
// everything lives in module memory and resets on reload (demo behavior).

import { useSyncExternalStore } from "react";

export type SliceKey =
  | "wallet"
  | "tasks"
  | "savedOpps"
  | "trackedForecasts"
  | "trackedForecastWrites"
  | "forecastWatch"
  | "forecastSteps"
  | "stayReady"
  | "knowledge"
  | "capStatement"
  | "capFresh"
  | "mentorReviews"
  | "mockSMS"
  | "partnersSaved"
  | "partnersList"
  | "onboarding"
  | "microPurchases"
  | "smallOrdersFeed"
  | "smallOrdersSaved"
  | "smallOrdersFit"
  // DEMO: Ava's bid state, her facts for Grant and the mentor reviews she asks for (src/demo/ava).
  | "ava";

const listeners: Map<SliceKey, Set<() => void>> = new Map();

export const bus = {
  publish(key: SliceKey) {
    const set = listeners.get(key);
    if (!set) return;
    set.forEach((fn) => {
      try { fn(); } catch (e) { console.warn("eventBus listener failed", e); }
    });
  },
  subscribe(key: SliceKey, fn: () => void): () => void {
    let set = listeners.get(key);
    if (!set) { set = new Set(); listeners.set(key, set); }
    set.add(fn);
    return () => { set!.delete(fn); };
  },
};

// React hook: re-render whenever the given slice publishes, returning the
// freshly-read value. `read` must be a stable reference (or memoized).
export function useLiveSlice<T>(key: SliceKey, read: () => T): T {
  return useSyncExternalStore(
    (cb) => bus.subscribe(key, cb),
    read,
    read,
  );
}

// Multi-key variant for derivations that depend on more than one slice.
export function useLiveSlices<T>(keys: SliceKey[], read: () => T): T {
  return useSyncExternalStore(
    (cb) => {
      const unsubs = keys.map((k) => bus.subscribe(k, cb));
      return () => unsubs.forEach((u) => u());
    },
    read,
    read,
  );
}
