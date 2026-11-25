// What a member did with one company on the My partners board, beyond its stage.
//
// The facts (registration path, do-it-yourself checklist, job details, finished date,
// past-performance flag) are stored on the member's saved-partner record on the backend
// (PUT /partners/pipeline/:awardeeKey/journey), so they follow her across browsers and
// devices. This module is the in-memory view of them. The done-for-you order status
// stays here only: it has to come from the Success Center order, not from this app.
//
// Before this, the facts lived in localStorage ("proto.partners.journey"). On load,
// `hydrateJourneys` moves any such data for a company on her board to the server once,
// then deletes the local copy. Nothing else reads or writes localStorage.

import { useSyncExternalStore } from "react";
import { setPipelineJourney, type PipelineEntry } from "../partnersApi";

export interface PartnerJourney {
  /** How she chose to get on their vendor list. */
  path?: "dfy" | "diy";
  /** The Prime Contractor Registration order for this company. */
  dfy?: { purchasedAt: string; status: "in_progress" | "done"; doneAt?: string };
  /** The do-it-yourself checklist. `registeredAt` is set when she says she is on their list. */
  diy?: { steps: boolean[]; registeredAt?: string };
  /** What she told us about the job they do together. */
  job?: { what: string; startedOn?: string; value?: string };
  finishedAt?: string;
  /** True once she added the finished job to her past performance. */
  pastPerformanceAdded?: boolean;
}

const LEGACY_KEY = "proto.partners.journey";
const listeners = new Set<() => void>();
let cache: Record<string, PartnerJourney> = {};

const notify = () => listeners.forEach((l) => l());

/** The part of a journey the server keeps. */
function serverPart({ dfy: _dfy, ...rest }: PartnerJourney) {
  return rest;
}

function readLegacy(): Record<string, PartnerJourney> {
  try {
    return JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? "{}") as Record<string, PartnerJourney>;
  } catch {
    return {};
  }
}

function writeLegacy(all: Record<string, PartnerJourney>): void {
  try {
    if (Object.keys(all).length === 0) window.localStorage.removeItem(LEGACY_KEY);
    else window.localStorage.setItem(LEGACY_KEY, JSON.stringify(all));
  } catch {
    /* storage blocked: nothing to clean */
  }
}

/**
 * Loads the journeys from her saved-partner records. The server wins. A company the
 * server holds nothing for, but that has old localStorage data, is moved to the server
 * once; the local copy is deleted only after the save worked, so a failure retries.
 */
export async function hydrateJourneys(entries: PipelineEntry[]): Promise<void> {
  if (typeof window === "undefined") return;
  const legacy = readLegacy();
  const next = { ...cache };
  const moves: Promise<void>[] = [];
  for (const e of entries) {
    const key = String(e.awardeeKey);
    const local = legacy[key];
    if (e.journey) {
      next[key] = { ...next[key], ...e.journey };
      delete legacy[key];
    } else if (local && Object.keys(serverPart(local)).length > 0) {
      next[key] = { ...next[key], ...local };
      moves.push(
        setPipelineJourney(e.awardeeKey, serverPart(local)).then(() => {
          delete legacy[key];
        }),
      );
    }
  }
  cache = next;
  notify();
  await Promise.allSettled(moves);
  writeLegacy(legacy);
}

const EMPTY: PartnerJourney = {};

export function getJourney(awardeeKey: number): PartnerJourney {
  return cache[String(awardeeKey)] ?? EMPTY;
}

/** Merges `patch` into the journey for one company, saves it, and tells every subscriber. */
export function updateJourney(awardeeKey: number, patch: Partial<PartnerJourney>): void {
  const merged = { ...getJourney(awardeeKey), ...patch };
  cache = { ...cache, [String(awardeeKey)]: merged };
  notify();
  setPipelineJourney(awardeeKey, serverPart(merged)).catch((err) =>
    console.error("Could not save your partner notes", err),
  );
}

/** The journey for one company. The component renders again when it changes. */
export function useJourney(awardeeKey: number): PartnerJourney {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getJourney(awardeeKey),
    () => EMPTY,
  );
}
