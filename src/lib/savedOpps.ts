// Saved opportunities — in-memory set, resets on reload.
import { bus } from "./eventBus";

let saved: Set<string> = new Set();

export function isSaved(id: string): boolean {
  return saved.has(id);
}

export function toggleSaved(id: string): boolean {
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  bus.publish("savedOpps");
  return saved.has(id);
}

export function resetSavedOpps(): void {
  saved = new Set();
  bus.publish("savedOpps");
}
