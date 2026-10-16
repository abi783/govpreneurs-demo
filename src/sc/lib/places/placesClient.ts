"use client";

// Client half of the address lookup: GET /api/places/autocomplete and
// /api/places/details, both of which fail soft to empty by their own contract.
// Same shape as citiesClient.ts — cache what came back, never cache a failure.

import type { PlaceSuggestion } from "./address";
import type { Address } from "@sc/lib/businessProfile/mbValue";

const suggestionCache = new Map<string, Promise<PlaceSuggestion[]>>();

/**
 * A Places "session": every keystroke plus the one details call are billed
 * together when they share a token, and separately when they do not. One token
 * per address being filled in — `newSession()` is called again after a pick.
 */
export function newSession(): string {
  return globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Suggestions for what she has typed. Never throws; `[]` means "no help",
 *  which is also what a missing API key looks like from here. */
export function searchAddresses(query: string, session: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return Promise.resolve([]);
  const cacheKey = `${session}::${q.toLowerCase()}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached) return cached;

  const job = fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}&session=${encodeURIComponent(session)}`)
    .then((res) => (res.ok ? (res.json() as Promise<PlaceSuggestion[]>) : []))
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .catch(() => {
      suggestionCache.delete(cacheKey); // a retry should reach Google, not the failure
      return [] as PlaceSuggestion[];
    });
  suggestionCache.set(cacheKey, job);
  return job;
}

/** The picked address in parts, or null — which the caller treats as "fill
 *  nothing in", leaving what she typed exactly as it is. */
export function addressForPlace(placeId: string, session: string): Promise<Address | null> {
  return fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}&session=${encodeURIComponent(session)}`)
    .then((res) => (res.ok ? (res.json() as Promise<Address | null>) : null))
    .catch(() => null);
}
