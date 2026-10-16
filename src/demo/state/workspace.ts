// DEMO: the member's saved list and saved searches — one state for every page
// that saves things (feed, opportunity page, forecasts, small orders, Pipeline).
// Kept in the demo store, so it survives a reload; "Reset demo" restores it.

import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import { OPPORTUNITIES, getOpportunity } from "@/demo/story/opportunities";
import { deadlineIso } from "@/demo/story/clock";
import type { SavedOppDetail, SavedSearch } from "@/lib/workspace";

const SAVED = "workspace.savedOpps";
const SEARCHES = "workspace.savedSearches";

const initialSaved = () => OPPORTUNITIES.filter((o) => o.saved).map((o) => o.id);

export function getSavedOpps(): string[] {
  return readDemoState<string[]>(SAVED, initialSaved);
}

export function setSaved(oppKey: string, saved: boolean): void {
  updateDemoState<string[]>(SAVED, initialSaved, (prev) => {
    const has = prev.includes(oppKey);
    if (saved && !has) return [...prev, oppKey];
    if (!saved && has) return prev.filter((k) => k !== oppKey);
    return prev;
  });
}

export function getSavedSearches(): SavedSearch[] {
  return readDemoState<SavedSearch[]>(SEARCHES, []);
}

export function addSavedSearch(s: SavedSearch): void {
  updateDemoState<SavedSearch[]>(SEARCHES, [], (prev) => [...prev, s]);
}

export function removeSavedSearch(id: string): void {
  updateDemoState<SavedSearch[]>(SEARCHES, [], (prev) => prev.filter((s) => s.id !== id));
}

/** Other areas (forecasts, small orders) register how to describe their saved keys. */
type Resolver = (oppKey: string) => SavedOppDetail | null;
const resolvers: Resolver[] = [];

export function registerSavedResolver(fn: Resolver): void {
  resolvers.push(fn);
}

/** A saved key as the Pipeline card shows it. Story opportunities first. */
export function describeSaved(oppKey: string): SavedOppDetail | null {
  const o = getOpportunity(oppKey);
  if (o) {
    return {
      oppKey: o.id,
      title: o.plainTitle,
      agency: o.agency,
      dueDate: deadlineIso(o.closesInDays),
      sourceType: o.scope === "sled" ? "sled" : "sam",
    };
  }
  for (const r of resolvers) {
    const d = r(oppKey);
    if (d) return d;
  }
  return null;
}
