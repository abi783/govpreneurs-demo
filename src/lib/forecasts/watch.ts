// The forecast watch: the client for `GET /forecast-watch` and
// `POST /forecast-watch/:oppKey/seen`, and its per-session store.
// Owner: feature 8. The contract is ARCHITECTURE-forecasts-watch.md, and the
// backend half is `backend/src/forecast-watch/forecast-watch.types.ts`
// (`watch.parity.test.ts` holds the two arrays below equal to it).
//
// Identity is the signed-in session, resolved on the server. No call here sends a
// `locationId`. A failed read is an ERROR state, never "no changes" and never
// "watching on": an unread list is not an empty one.

import { useEffect } from "react";
import { API_BASE_URL, apiFetch } from "../api";
import { bus, useLiveSlice } from "../eventBus";
import { mentionsVendor } from "../sourceLink";

/** The watched fields, as the backend names them. `expectedOn` is the record's `dueOn`. */
export const FORECAST_WATCH_FIELDS = [
  "expectedOn",
  "setAsideCode",
  "valLow",
  "valHigh",
  "naicsCode",
  "pscCode",
  "popState",
  "popCity",
  "status",
] as const;
export type ForecastWatchField = (typeof FORECAST_WATCH_FIELDS)[number];

export const FORECAST_WATCH_EVENT_KINDS = [
  "date_moved",
  "set_aside_changed",
  "value_changed",
  "code_changed",
  "place_changed",
  "expected_date_passed",
  "no_longer_listed",
  "bid_request_posted",
  "republished",
  "notice_suggested",
] as const;
/** A kind the server may send. */
export type ForecastWatchWireKind = (typeof FORECAST_WATCH_EVENT_KINDS)[number];

/**
 * Kinds that are shown but never counted: no New/Seen tag, nothing added to the marker.
 * Equal to the backend's list; a suggestion is not a claim.
 */
export const FORECAST_WATCH_UNCOUNTED_KINDS = ["notice_suggested"] as const;

/** True when an event of `kind` is counted, as the backend's `isCountedKind` decides. */
export function isCountedKind(kind: string): boolean {
  return !(FORECAST_WATCH_UNCOUNTED_KINDS as readonly string[]).includes(kind);
}

/** Which page a notice opens: `/opportunities/$noticeId` or `/forecasts/$forecastId`. */
export const FORECAST_WATCH_NOTICE_TARGETS = ["opportunity", "forecast"] as const;
export type ForecastWatchNoticeTarget = (typeof FORECAST_WATCH_NOTICE_TARGETS)[number];

/** The basis kinds, one per notice event kind. */
export const FORECAST_WATCH_NOTICE_BASIS_KINDS = ["named", "same_plan", "suggested"] as const;
export type ForecastWatchNoticeBasisKind = (typeof FORECAST_WATCH_NOTICE_BASIS_KINDS)[number];

/** The basis kind each notice event carries. A kind not named here carries no notice. */
const BASIS_KIND_OF: Partial<Record<ForecastWatchWireKind, ForecastWatchNoticeBasisKind>> = {
  bid_request_posted: "named",
  republished: "same_plan",
  notice_suggested: "suggested",
};

/** Why a notice is on the watch. Facts only; this client writes the words. */
export type ForecastWatchNoticeBasis =
  | { kind: "named"; number: string }
  | { kind: "same_plan"; sourceId: string }
  | {
      kind: "suggested";
      office: "same" | "within";
      officeName: string | null;
      overlap: "strong" | "some";
      naicsGroupSame: boolean | null;
    };

type SuggestedBasis = Extract<ForecastWatchNoticeBasis, { kind: "suggested" }>;
const SUGGESTED_OFFICES: readonly SuggestedBasis["office"][] = ["same", "within"];
/** A band, never a number: no similarity reaches the client. */
const SUGGESTED_OVERLAPS: readonly SuggestedBasis["overlap"][] = ["strong", "some"];

/** A notice a watch event points at. `held`: the page opens. Our own key, never a URL. */
export interface ForecastWatchNotice {
  oppKey: string;
  target: ForecastWatchNoticeTarget;
  title: string | null;
  agencyName: string | null;
  noticeType: string | null;
  postedOn: string | null;
  held: boolean;
  basis: ForecastWatchNoticeBasis;
}

export type ForecastWatchValue = string | number | null;

/** One watch event. The read skips a kind this client does not know, a retired one included. */
export interface ForecastWatchEvent {
  id: string;
  kind: ForecastWatchWireKind;
  field: ForecastWatchField | null;
  before: ForecastWatchValue;
  after: ForecastWatchValue;
  decided: boolean | null;
  /** Set on the three notice kinds, null on every other. */
  notice: ForecastWatchNotice | null;
  /** ISO 8601. */
  observedAt: string;
  /** ISO 8601, or null while unseen. */
  seenAt: string | null;
}

export interface ForecastWatchForecast {
  oppKey: string;
  startedAt: string;
  unseen: number;
  events: ForecastWatchEvent[];
}

export interface ForecastWatchResponse {
  watching: boolean;
  notify: boolean;
  forecasts: ForecastWatchForecast[];
}

/** The session's read of the watch. `error` is a failed read, never an empty one. */
export type ForecastWatchRead =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ForecastWatchResponse }
  | { status: "error" };

/** Which promises the page may make (ARCHITECTURE-forecasts-watch.md §11). */
export type WatchCopyState = "off" | "inApp" | "email";

const IDLE: ForecastWatchRead = { status: "idle" };
const LOADING: ForecastWatchRead = { status: "loading" };
const FAILED: ForecastWatchRead = { status: "error" };

const WATCH_PATH = "/forecast-watch";

type Json = Record<string, unknown>;

/** The session's read. Replaced whole on each change, so `useSyncExternalStore` sees a new object. */
let current: ForecastWatchRead = IDLE;
/** The request in flight. Every caller that asks while it runs gets this promise. */
let pending: Promise<ForecastWatchRead> | null = null;
/** Counts requests, so an older answer never overwrites a newer one. */
let generation = 0;

function readCurrent(): ForecastWatchRead {
  return current;
}

function publish(read: ForecastWatchRead): void {
  current = read;
  bus.publish("forecastWatch");
}

function isObject(value: unknown): value is Json {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** A watched value is a day, a code, a place, an amount or null. A value naming the aggregator is not one. */
function isValue(value: unknown): value is ForecastWatchValue {
  if (value === null) return true;
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && !mentionsVendor(value);
}

/** A text the notice may carry: a string that does not name the aggregator, or null. */
function isShownText(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && !mentionsVendor(value));
}

/** A key or a number the notice must carry: a non-empty string that does not name the aggregator. */
function isShownId(value: unknown): value is string {
  return isNonEmptyString(value) && !mentionsVendor(value);
}

/** The basis, field by field, when it is the kind `want` and valid. Null otherwise. */
function toBasis(
  value: unknown,
  want: ForecastWatchNoticeBasisKind,
): ForecastWatchNoticeBasis | null {
  if (!isObject(value) || value.kind !== want) return null;
  if (want === "named")
    return isShownId(value.number) ? { kind: want, number: value.number } : null;
  if (want === "same_plan")
    return isShownId(value.sourceId) ? { kind: want, sourceId: value.sourceId } : null;
  const { office, officeName, overlap, naicsGroupSame } = value;
  const valid =
    isOneOf(SUGGESTED_OFFICES, office) &&
    isShownText(officeName) &&
    isOneOf(SUGGESTED_OVERLAPS, overlap) &&
    (naicsGroupSame === null || typeof naicsGroupSame === "boolean");
  return valid ? { kind: want, office, officeName, overlap, naicsGroupSame } : null;
}

/**
 * The notice, field by field, when it is valid for basis kind `want`. Null otherwise.
 * Only declared fields are copied, so a `similarity` or a URL the server sends is not kept.
 */
function toNotice(value: unknown, want: ForecastWatchNoticeBasisKind): ForecastWatchNotice | null {
  if (!isObject(value)) return null;
  const { oppKey, target, title, agencyName, noticeType, postedOn, held } = value;
  const basis = toBasis(value.basis, want);
  const valid =
    basis !== null &&
    isShownId(oppKey) &&
    isOneOf(FORECAST_WATCH_NOTICE_TARGETS, target) &&
    isShownText(title) &&
    isShownText(agencyName) &&
    isShownText(noticeType) &&
    isShownText(postedOn) &&
    typeof held === "boolean";
  return valid ? { oppKey, target, title, agencyName, noticeType, postedOn, held, basis } : null;
}

/** The event's notice. Undefined when the notice does not fit the kind: a malformed event. */
function noticeFor(
  event: Json,
  kind: ForecastWatchWireKind,
): ForecastWatchNotice | null | undefined {
  const want = BASIS_KIND_OF[kind];
  const raw = event.notice ?? null;
  if (want === undefined) return raw === null ? null : undefined;
  return toNotice(raw, want) ?? undefined;
}

/** The event, field by field, or null when it is malformed. An undeclared field is never kept. */
function toEvent(value: Json, kind: ForecastWatchWireKind): ForecastWatchEvent | null {
  const { id, field, before, after, decided, observedAt, seenAt } = value;
  const notice = noticeFor(value, kind);
  const valid =
    notice !== undefined &&
    isNonEmptyString(id) &&
    (field === null || isOneOf(FORECAST_WATCH_FIELDS, field)) &&
    isValue(before) &&
    isValue(after) &&
    (decided === null || typeof decided === "boolean") &&
    isNonEmptyString(observedAt) &&
    isStringOrNull(seenAt);
  return valid ? { id, kind, field, before, after, decided, notice, observedAt, seenAt } : null;
}

/**
 * The events this client reads, or null when one is malformed. An event of a kind this
 * client does not know (a later kind, or a retired one) is skipped, so a new kind never
 * blanks the box. The box words the gap as an unseen change it cannot show.
 */
function toEvents(list: unknown[]): ForecastWatchEvent[] | null {
  const events: ForecastWatchEvent[] = [];
  for (const value of list) {
    if (!isObject(value) || typeof value.kind !== "string") return null;
    if (!isOneOf(FORECAST_WATCH_EVENT_KINDS, value.kind)) continue;
    const event = toEvent(value, value.kind);
    if (event === null) return null;
    events.push(event);
  }
  return events;
}

/**
 * A forecast whose every event is valid, or null. One malformed event drops the forecast
 * whole: `unseen` counts every event, so a list with one event removed would disagree with it.
 */
function toForecast(value: unknown): ForecastWatchForecast | null {
  if (!isObject(value) || !Array.isArray(value.events)) return null;
  const { oppKey, startedAt, unseen } = value;
  const events = toEvents(value.events);
  const valid =
    events !== null &&
    isNonEmptyString(oppKey) &&
    isNonEmptyString(startedAt) &&
    typeof unseen === "number" &&
    Number.isInteger(unseen) &&
    unseen >= 0;
  return valid ? { oppKey, startedAt, unseen, events } : null;
}

/** The response, or null when the body is not one. An absent or non-boolean flag reads as off. */
function toResponse(body: unknown): ForecastWatchResponse | null {
  if (!isObject(body) || !Array.isArray(body.forecasts)) return null;
  return {
    watching: body.watching === true,
    notify: body.notify === true,
    forecasts: body.forecasts.map(toForecast).filter((f): f is ForecastWatchForecast => f !== null),
  };
}

/** Reads a JSON body, or `null` when the body is not JSON. */
async function jsonOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (err) {
    console.warn("forecast watch: the response body is not JSON", err);
    return null;
  }
}

async function requestWatch(): Promise<ForecastWatchRead> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}${WATCH_PATH}`);
  } catch (err) {
    console.warn("forecast watch: the request failed", err);
    return FAILED;
  }
  if (!response.ok) return FAILED;
  const data = toResponse(await jsonOrNull(response));
  return data ? { status: "ready", data } : FAILED;
}

/** Starts a read. Only the newest read writes the store. */
function startRead(): Promise<ForecastWatchRead> {
  generation += 1;
  const mine = generation;
  if (current.status === "idle") publish(LOADING);
  const request = requestWatch().then((read) => {
    if (mine === generation) {
      pending = null;
      publish(read);
    }
    return read;
  });
  pending = request;
  return request;
}

/** Reads the watch once per session. A failed read stays an error until the next refresh. */
export function loadForecastWatch(): Promise<ForecastWatchRead> {
  if (pending) return pending;
  if (current.status === "ready" || current.status === "error") return Promise.resolve(current);
  return startRead();
}

/** Reads the watch again: after a track, an untrack or a mark-as-seen. */
export function refreshForecastWatch(): Promise<ForecastWatchRead> {
  return startRead();
}

/** Marks one forecast's changes seen, then refreshes. False when the POST failed. */
export async function markForecastSeen(oppKey: string): Promise<boolean> {
  const url = `${API_BASE_URL}${WATCH_PATH}/${encodeURIComponent(oppKey)}/seen`;
  try {
    const response = await apiFetch(url, { method: "POST" });
    if (!response.ok) return false;
  } catch (err) {
    console.warn("forecast watch: marking as seen failed", err);
    return false;
  }
  await refreshForecastWatch();
  return true;
}

/** The session's read, re-rendering the caller when it changes. Starts the one load on mount. */
export function useForecastWatch(): ForecastWatchRead {
  useEffect(() => {
    void loadForecastWatch();
  }, []);
  return useLiveSlice("forecastWatch", readCurrent);
}

/** Drops what this session holds. For tests and the demo reset. */
export function resetForecastWatch(): void {
  generation += 1;
  pending = null;
  publish(IDLE);
}

/** "off" unless the read is ready and the server says watching is on. */
export function watchCopyState(read: ForecastWatchRead): WatchCopyState {
  if (read.status !== "ready" || !read.data.watching) return "off";
  return read.data.notify ? "email" : "inApp";
}

/** Unseen changes to one forecast. Zero for any read that is not ready. */
export function unseenFor(read: ForecastWatchRead, oppKey: string): number {
  if (read.status !== "ready") return 0;
  return read.data.forecasts.find((f) => f.oppKey === oppKey)?.unseen ?? 0;
}
