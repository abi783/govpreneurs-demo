"use client";

/**
 * The PSC register's face of the shared code-description cache, beside the
 * NAICS one. Backed by our own `/api/hunter/psc-*` proxies so the shared
 * partner key never reaches the browser.
 *
 * PSC hits carry more than a label: `segment` says whether the code is for a
 * product, a service or R&D, and `groupCode`/`groupTitle` are its two-character
 * bucket. The picker groups results by `groupTitle`, which is the only thing
 * that makes a list of twenty four-character codes readable.
 */

import { createDescriptionCache, searchCodes } from "./codeDescriptions";

/** Mirrors Hunter's `PscSegment` verbatim — R&D is `randd`, as the workbook's
 *  own split names it. */
export type PscSegment = "product" | "service" | "randd";

export interface PscSearchResult {
  code: string;
  description: string;
  segment: PscSegment;
  groupCode: string;
  groupTitle: string;
}

const psc = createDescriptionCache("/api/hunter/psc-descriptions");

/** Fetches titles for any of `codes` not already cached, in batches of ≤100
 *  (backend cap). Never throws — an unresolved code renders as the bare code. */
export function ensurePscDescriptions(codes: string[]): Promise<void> {
  return psc.ensure(codes);
}

export function describePscFromCache(code: string): string | undefined {
  return psc.describe(code);
}

/** GET /api/hunter/psc-search?q= — the PSC field's search. Capped upstream at
 *  20 hits, ranked so the cap cannot hide the answer. */
export function searchPsc(q: string): Promise<PscSearchResult[]> {
  return searchCodes<PscSearchResult>("/api/hunter/psc-search", q);
}

/**
 * Which group each of `codes` sits in, from the same descriptions call that
 * resolves their titles.
 *
 * The picker needs this to show a code she saved earlier as TICKED in the tree
 * rather than only as a chip: a code carries no group of its own, and the
 * branch it belongs to is not guessable from the code alone. Unknown codes are
 * simply absent from the answer — they stay in the chips, which is where they
 * are removable. Never throws.
 */
export async function placementOf(codes: string[]): Promise<Record<string, string>> {
  if (codes.length === 0) return {};
  try {
    const res = await fetch(
      `/api/hunter/psc-descriptions?codes=${encodeURIComponent(codes.join(","))}`,
    );
    if (!res.ok) return {};
    const rows = (await res.json()) as PscSearchResult[];
    return Object.fromEntries(rows.map((row) => [row.code, row.groupCode]));
  } catch {
    return {};
  }
}

/** One PSC group: the two-character bucket, and how many codes it holds. */
export interface PscGroup {
  groupCode: string;
  groupTitle: string;
  segment: PscSegment;
  /** The workbook's Level 1 Category — the picker's section heading. */
  category: string;
  count: number;
}

let groupsJob: Promise<PscGroup[]> | null = null;

/**
 * The picker's top level, fetched once per page. Never throws — an unreachable
 * Hunter gives an empty tree, and the search box and the "code you already
 * have" door both still work.
 */
export function loadPscGroups(): Promise<PscGroup[]> {
  if (!groupsJob) {
    groupsJob = fetch("/api/hunter/psc-groups")
      .then((res) => (res.ok ? (res.json() as Promise<PscGroup[]>) : []))
      .catch(() => {
        groupsJob = null; // a retry should try again, not re-serve the failure
        return [] as PscGroup[];
      });
  }
  return groupsJob;
}

const groupCodes = new Map<string, Promise<PscSearchResult[]>>();

/**
 * The codes inside one group, cached per group — `TreePicker`'s `loadChildren`,
 * the same shape `loadCityChildren` has. A failed load drops its cache entry so
 * the picker's retry row can genuinely retry rather than re-serving nothing.
 */
export function loadPscGroupCodes(groupCode: string): Promise<PscSearchResult[]> {
  const held = groupCodes.get(groupCode);
  if (held) return held;
  const job = fetch(`/api/hunter/psc-group?code=${encodeURIComponent(groupCode)}`)
    .then((res) => (res.ok ? (res.json() as Promise<PscSearchResult[]>) : []))
    .catch(() => {
      groupCodes.delete(groupCode);
      return [] as PscSearchResult[];
    });
  groupCodes.set(groupCode, job);
  return job;
}
