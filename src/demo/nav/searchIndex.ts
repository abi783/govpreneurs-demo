// DEMO: the extra entries in the command palette (the search box in the menu).
//
// The palette always lists the menu pages. A page agent adds more entries here
// so that a visitor can search for things, for example opportunities, tasks,
// partners or mentors:
//
//   registerSearchEntries([
//     { label: "Fort Bragg dining services", hint: "Opportunity", to: "/opportunities/abc123" },
//   ]);
//
// Call it at module load time in the page's data file. A second entry with the
// same `to` and `label` replaces the first one. `keywords` is optional.

import { useSyncExternalStore } from "react";

export interface SearchEntry {
  label: string;
  /** A short group name that the palette shows next to the label. */
  hint: string;
  /** An app path. The palette navigates here on select. */
  to: string;
  keywords?: string[];
}

const entries = new Map<string, SearchEntry>();
const listeners = new Set<() => void>();
let snapshot: SearchEntry[] = [];

export function registerSearchEntries(list: readonly SearchEntry[]): void {
  for (const e of list) entries.set(`${e.to}\u0000${e.label}`, e);
  snapshot = Array.from(entries.values());
  listeners.forEach((fn) => fn());
}

export function getSearchEntries(): SearchEntry[] {
  return snapshot;
}

export function useSearchEntries(): SearchEntry[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => snapshot,
    () => snapshot,
  );
}
