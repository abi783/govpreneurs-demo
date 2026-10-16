// Grant's take on the forecast page: the client for `GET /forecasts/:oppKey/grant/take`.
// Owner: feature 6. The contract is ARCHITECTURE-forecasts-take.md, and the
// backend half is `backend/src/forecast-grant/forecast-take.types.ts`.
//
// Identity is the signed-in session, resolved on the server. The call sends no
// `locationId`. A failed call resolves to a typed error, never to a take. The take
// is fetched at most once per forecast per browser session, a failed one included.

import { API_BASE_URL, apiFetch } from "../api";
import type { Pin, ReadStatus, RichLine } from "../grant/types";

/** The counted facts of a take. Equal to the backend's list; change both or neither. */
export const FORECAST_TAKE_COUNTED_KEYS = [
  "comparableAwards",
  "fieldSize",
  "marketWinners",
  "buyer",
  "upcoming",
  "subUse",
] as const;
export type ForecastTakeCountedKey = (typeof FORECAST_TAKE_COUNTED_KEYS)[number];

/** The two states of a counted fact. Equal to the backend's list. */
export const FORECAST_TAKE_FACT_STATES = ["counted", "notChecked"] as const;

/** The member reads a take can use. Equal to the backend's list. */
export const FORECAST_TAKE_MEMBER_SOURCES = [
  "profile",
  "capabilityStatement",
  "learnedFacts",
  "match",
] as const;
export type ForecastTakeMemberSource = (typeof FORECAST_TAKE_MEMBER_SOURCES)[number];

/** What a member read gave the take. `used`: a value the take used. `empty`: the read
 *  succeeded and nothing is on file. `notChecked`: the read failed or was not made.
 *  Equal to the backend's list. */
export const FORECAST_TAKE_MEMBER_SOURCE_STATES = ["used", "empty", "notChecked"] as const;
export type ForecastTakeMemberSourceState = (typeof FORECAST_TAKE_MEMBER_SOURCE_STATES)[number];

/** What a counted figure was counted over. */
export interface ForecastTakeBasis {
  countedOver: number;
  matchedOn: string;
  yearsCovered: string | null;
  /** True when the count reached a scan cap, so it reads "at least". */
  atLeast: boolean;
}

/** A figure counted over public records, with its basis and its source pin. */
export interface ForecastTakeCountedFact {
  state: "counted";
  figure: number;
  basis: ForecastTakeBasis;
  source: Pin;
  asOf: string | null;
}

/** A fact that was not checked. The page hides it; it is never a zero. */
export interface ForecastTakeNotChecked {
  state: "notChecked";
}

export type ForecastTakeFact = ForecastTakeCountedFact | ForecastTakeNotChecked;

/** One of Grant's stage reads. */
export interface ForecastTakeRead {
  id: number;
  name: string;
  status: ReadStatus;
  sentence: RichLine;
  evidence: Pin[];
}

/** `GET /forecasts/:oppKey/grant/take`, status 200. */
export interface ForecastTakeResponse {
  oppKey: string;
  noticeType: "forecast";
  /** ISO 8601. */
  analyzedAt: string;
  counted: Record<ForecastTakeCountedKey, ForecastTakeFact>;
  reads: ForecastTakeRead[];
  memberSources: Record<ForecastTakeMemberSource, ForecastTakeMemberSourceState>;
}

/** Why the take could not be read. `notFound` is a 404; `failed` is anything else. */
export type ForecastTakeError = "notFound" | "failed";

export type ForecastTakeResult =
  | { ok: true; take: ForecastTakeResponse }
  | { ok: false; error: ForecastTakeError };

/** One promise per forecast for the browser session. */
const cache = new Map<string, Promise<ForecastTakeResult>>();

const NOT_FOUND = 404;
const FAILED: ForecastTakeResult = { ok: false, error: "failed" };

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/** Every `ReadStatus`. `satisfies` keeps the list complete in both directions. */
const READ_STATUSES = {
  strong: true,
  mixed: true,
  weak: true,
  blocking: true,
  unknown: true,
} satisfies Record<ReadStatus, true>;

function isReadStatus(value: unknown): value is ReadStatus {
  return typeof value === "string" && Object.hasOwn(READ_STATUSES, value);
}

/** A basis is counted over at least one record and names the filter it applied. */
function isBasis(value: unknown): value is ForecastTakeBasis {
  return (
    isObject(value) &&
    typeof value.countedOver === "number" &&
    Number.isFinite(value.countedOver) &&
    value.countedOver >= 1 &&
    typeof value.matchedOn === "string" &&
    value.matchedOn.trim() !== "" &&
    isStringOrNull(value.yearsCovered) &&
    typeof value.atLeast === "boolean"
  );
}

/** A counted fact's source is a public-record pin, so the page resolves it with `resolvePublic`. */
function isPublicPin(value: unknown): value is Pin {
  return (
    isObject(value) &&
    typeof value.label === "string" &&
    isObject(value.provenance) &&
    value.provenance.type === "public" &&
    typeof value.provenance.ref === "string"
  );
}

/** A counted fact carries a figure, its basis and its source; anything else is not a fact. */
function isFact(value: unknown): value is ForecastTakeFact {
  if (!isObject(value)) return false;
  if (value.state === "notChecked") return true;
  return (
    value.state === "counted" &&
    Number.isFinite(value.figure) &&
    isBasis(value.basis) &&
    isPublicPin(value.source) &&
    isStringOrNull(value.asOf)
  );
}

function isRead(value: unknown): value is ForecastTakeRead {
  return (
    isObject(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    isReadStatus(value.status) &&
    Array.isArray(value.sentence) &&
    Array.isArray(value.evidence)
  );
}

function hasEveryFact(counted: unknown): boolean {
  return isObject(counted) && FORECAST_TAKE_COUNTED_KEYS.every((k) => isFact(counted[k]));
}

function hasEverySource(sources: unknown): boolean {
  return (
    isObject(sources) &&
    FORECAST_TAKE_MEMBER_SOURCES.every((k) =>
      (FORECAST_TAKE_MEMBER_SOURCE_STATES as readonly unknown[]).includes(sources[k]),
    )
  );
}

/** The take for `oppKey`, or null when the body is not one. Malformed reads are dropped. */
function toTake(body: unknown, oppKey: string): ForecastTakeResponse | null {
  if (!isObject(body)) return null;
  const valid =
    body.oppKey === oppKey &&
    body.noticeType === "forecast" &&
    typeof body.analyzedAt === "string" &&
    Array.isArray(body.reads) &&
    hasEveryFact(body.counted) &&
    hasEverySource(body.memberSources);
  if (!valid) return null;
  const take = body as unknown as ForecastTakeResponse;
  return { ...take, reads: (body.reads as unknown[]).filter(isRead) };
}

/** Reads a JSON body, or `null` when the body is not JSON. */
async function jsonOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (err) {
    console.warn("forecast take: the response body is not JSON", err);
    return null;
  }
}

async function requestTake(oppKey: string): Promise<ForecastTakeResult> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/forecasts/${encodeURIComponent(oppKey)}/grant/take`);
  } catch (err) {
    console.warn("forecast take: the request failed", err);
    return FAILED;
  }
  if (response.status === NOT_FOUND) return { ok: false, error: "notFound" };
  if (!response.ok) return FAILED;
  const take = toTake(await jsonOrNull(response), oppKey);
  return take ? { ok: true, take } : FAILED;
}

/**
 * Grant's take on one forecast. Resolves to the take or to a typed error. The
 * first call per forecast fetches; every later call in the session, a failed
 * one included, gets the same promise.
 */
export function fetchForecastTake(oppKey: string): Promise<ForecastTakeResult> {
  let pending = cache.get(oppKey);
  if (!pending) {
    pending = requestTake(oppKey);
    cache.set(oppKey, pending);
  }
  return pending;
}

/** Clears the session cache. For tests only. */
export function resetForecastTakeCache(): void {
  cache.clear();
}
