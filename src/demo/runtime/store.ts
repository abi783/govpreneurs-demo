// DEMO: a tiny state store that survives a page reload.
//
// Page agents keep every change a visitor makes here: saved opportunities, the
// wallet balance, reviews sent to the mentor, ticked tasks, profile edits.
// A change in one place then shows in every other place, and it stays after a
// reload. The state lives in `sessionStorage` under `gp-demo:v1:<name>`.
//
//   const [saved, setSaved] = useDemoState<string[]>("saved-opps", []);
//   setSaved((prev) => [...prev, id]);
//
// Rules:
//   - A value must be JSON-safe. Store dates as ISO strings.
//   - Pass a STABLE `init`: a constant, or a function that returns a new value.
//     The store calls the function once and keeps the result.
//   - Handlers in `src/demo/api/*` may call `readDemoState` and `writeDemoState`
//     directly. Components that use `useDemoState` then update on their own.
//   - `resetDemo()` wipes everything and returns to the Success Center.

import { useCallback, useSyncExternalStore } from "react";

export const DEMO_STATE_PREFIX = "gp-demo:v1:";

type Init<T> = T | (() => T);

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
let resetting = false;

function storageKey(name: string): string {
  return `${DEMO_STATE_PREFIX}${name}`;
}

function resolveInit<T>(init: Init<T>): T {
  return typeof init === "function" ? (init as () => T)() : init;
}

function notify(name: string): void {
  listeners.get(name)?.forEach((fn) => fn());
}

/** Read a value. The first read for a name caches `init` (or the stored value). */
export function readDemoState<T>(name: string, init: Init<T>): T {
  if (cache.has(name)) return cache.get(name) as T;
  let value: T;
  let found = false;
  try {
    const raw = window.sessionStorage.getItem(storageKey(name));
    if (raw !== null) {
      value = JSON.parse(raw) as T;
      found = true;
    }
  } catch {
    // Storage can be missing or full. The cache still works for this page view.
  }
  if (!found) value = resolveInit(init);
  cache.set(name, value!);
  return value!;
}

/** Write a value. Every subscriber to `name` updates. */
export function writeDemoState<T>(name: string, value: T): void {
  if (resetting) return;
  cache.set(name, value);
  try {
    window.sessionStorage.setItem(storageKey(name), JSON.stringify(value));
  } catch {
    // Keep the in-memory value when storage fails.
  }
  notify(name);
}

/** Change a value from its current value. */
export function updateDemoState<T>(name: string, init: Init<T>, updater: (prev: T) => T): T {
  const next = updater(readDemoState(name, init));
  writeDemoState(name, next);
  return next;
}

/** Run `fn` each time `name` changes. Returns the unsubscribe function. */
export function subscribeDemoState(name: string, fn: () => void): () => void {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
  };
}

/** React hook: `[value, setValue]`. `setValue` takes a value or an updater function. */
export function useDemoState<T>(
  name: string,
  init: Init<T>,
): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribeDemoState(name, cb), [name]),
    () => readDemoState(name, init),
    () => resolveInit(init),
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(readDemoState(name, init))
          : next;
      writeDemoState(name, resolved);
    },
    // `init` is only read for the first value, so it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name],
  );
  return [value, set];
}

/** Remove one stored value. Subscribers fall back to their `init`. */
export function clearDemoState(name: string): void {
  cache.delete(name);
  try {
    window.sessionStorage.removeItem(storageKey(name));
  } catch {
    /* ignore */
  }
  notify(name);
}

/**
 * Wipe the demo and start again.
 *
 * It clears all of `sessionStorage` and `localStorage`. The demo owns this
 * origin, so this removes the `gp-demo:` keys and also every key that the app
 * itself writes (the feed view memory, onboarding answers, the Hunter chat, and
 * so on). Then it loads `/`. The reload also drops the module-level caches.
 */
export function resetDemo(): void {
  resetting = true;
  cache.clear();
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  const keepFast = new URLSearchParams(window.location.search).get("fast") === "1";
  const target = keepFast ? "/?fast=1" : "/";
  const already =
    window.location.pathname === "/" && window.location.search === (keepFast ? "?fast=1" : "");
  if (already) window.location.reload();
  else window.location.assign(target);
}
