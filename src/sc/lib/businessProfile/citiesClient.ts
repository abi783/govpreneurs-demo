"use client";

// GET /api/hunter/cities?state= client + per-state cache, backing the
// States field's lazy city-child loader (TreePicker's `loadChildren` prop).
// Ported from Hunter's WarmStartWizard `loadCityChildren` pattern
// (frontend-v2 `discoverApi.fetchCities` via `cityChildrenOf`).

import { cityChildrenOf } from "./treeData";
import type { TreeChild } from "./treeSelection";

interface CityFacet {
  city: string;
  count: number;
}
interface StateCities {
  state: string;
  cities: CityFacet[];
}

const cache = new Map<string, Promise<TreeChild[]>>();

/** Loads (and caches per state) the city children for one state, converted
 *  to namespaced TreeChild[] via cityChildrenOf. Never throws synchronously
 *  — a failed fetch resolves to [] so TreePicker's error/retry row can offer
 *  a retry (retrying clears this state's cache entry first). */
export function loadCityChildren(state: string): Promise<TreeChild[]> {
  const cached = cache.get(state);
  if (cached) return cached;
  const job = fetch(`/api/hunter/cities?state=${encodeURIComponent(state)}`)
    .then((res) => (res.ok ? (res.json() as Promise<StateCities[]>) : []))
    .then((groups) => cityChildrenOf(state, groups.find((g) => g.state === state)?.cities ?? []))
    .catch(() => {
      cache.delete(state); // let a retry try again rather than caching a failure
      return [] as TreeChild[];
    });
  cache.set(state, job);
  return job;
}
