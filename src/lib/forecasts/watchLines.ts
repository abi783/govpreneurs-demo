// The forecast watch's events, as lines for the box "What changed since you tracked it"
// (feature 9, ARCHITECTURE-forecasts-watch.md §11). Pure.
//
// The server sends facts; this file turns each one into words. Every value goes through
// the reader the page already uses for it, so the box says a date, an amount or who may
// bid the same way the page does: the date through `readTiming` (a federal
// first-of-quarter date reads as its quarter, as B11 does), an amount through
// `money`, a set-aside code through `readSetAside`. A null value is NOT_STATED.
// Every word comes from watchCopy.ts.
//
// A notice event (ARCHITECTURE-forecast-links.md §8.3–8.4) is a NoticeLine. An exact link
// and a republished record are counted, as a change is. A suggestion is not counted: it
// carries no New/Seen tag, and the server leaves it out of `unseen`.

import {
  cityName,
  isUndecidedSetAside,
  longDate,
  readSetAside,
  readTiming,
  stateName,
  type ForecastFirm,
  type ScoredForecast,
} from "./engine";
import { money, openEndedHigh } from "../money";
import {
  isCountedKind,
  type ForecastWatchEvent,
  type ForecastWatchNotice,
  type ForecastWatchNoticeBasis,
  type ForecastWatchNoticeTarget,
  type ForecastWatchValue,
} from "./watch";
import { NOT_STATED, WATCH_BOX, WATCH_LINE, WATCH_NOTICE } from "./watchCopy";

/** What every line carries. */
interface LineBase {
  id: string;
  /** "Noticed on 27 September 2026". */
  noticed: string;
  /** True while the member has not marked the event seen. */
  unseen: boolean;
  /** True when the line has a New/Seen tag and joins "Mark as seen". False on a suggestion. */
  counted: boolean;
}

/** A change to the forecast's own record. */
export interface ChangeLine extends LineBase {
  kind: "change";
  text: string;
}

/** The page a notice line opens. Our own key, never a source URL. */
export interface NoticeLink {
  /** `opportunity`: `/opportunities/$noticeId`. `forecast`: `/forecasts/$forecastId`. */
  target: ForecastWatchNoticeTarget;
  id: string;
  /** The link's words. */
  label: string;
}

/** A notice the watch links to this forecast: posted, published again, or suggested. */
export interface NoticeLine extends LineBase {
  kind: "notice";
  headline: string;
  /** Title, office and posted day. Null when the record gives none of them. */
  names: string | null;
  /** The basis and what it means, one sentence each. */
  sentences: string[];
  /** Only while we hold the record. */
  link: NoticeLink | null;
  /** Said instead of the link when we do not hold the record. */
  unavailable: string | null;
}

export type WatchLine = ChangeLine | NoticeLine;

/** The forecast the lines are about, and the member the who-may-bid reader reads for. */
export interface WatchLineContext {
  forecast: ScoredForecast;
  firm: ForecastFirm;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
/** A calendar day, "YYYY-MM-DD", with a month and a day that can exist. */
const CALENDAR_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** The length of "YYYY-MM-DD", the day part of an ISO date. */
const ISO_DAY_LENGTH = 10;
const MONTH_NAMES = new Set([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

/**
 * A reader's words set inside a sentence: "Around April 2027" → "around April 2027",
 * "Not decided yet." → "not decided yet". A month name, a number or an acronym keeps
 * its case. Only the reader's first sentence is kept, without its full stop, because
 * the line is one sentence and adds its own: "Kept for X. You do not hold that
 * certificate." → "kept for X".
 */
function inSentence(text: string): string {
  const trimmed = (text.trim().split(/\.\s+/)[0] ?? "").replace(/\.$/, "");
  const first = trimmed.split(" ")[0] ?? "";
  const lowerable = /^[A-Z][a-z]/.test(first) && !MONTH_NAMES.has(first);
  return lowerable ? `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}` : trimmed;
}

/** A value the reader cannot take, as the record sent it. */
function asSent(value: ForecastWatchValue): string {
  return value == null ? NOT_STATED : String(value);
}

/** An expected posting date, read at the precision the page reads it at. */
function dateWords(value: ForecastWatchValue, ctx: WatchLineContext): string {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return asSent(value);
  const { forecast } = ctx;
  // The page's own overrides (a window, a lifecycle) describe the page's date, not this one.
  const facts = { ...forecast.facts, timing: undefined, lifecycle: undefined };
  const day = value.slice(0, ISO_DAY_LENGTH);
  const record = { ...forecast.record, dueOn: day };
  return inSentence(readTiming(record, facts, day).label);
}

/** One end of the buyer's estimate. */
function amountWords(value: ForecastWatchValue): string {
  if (typeof value !== "number") return asSent(value);
  const amount = openEndedHigh(value);
  return amount == null ? NOT_STATED : money(amount);
}

/** Reader kinds that say nothing about the code (every local code reads "Not shared"). */
const SILENT_WHO = new Set(["local", "not_shared"]);

/** A set-aside code, as the page says who may bid. Null: the reader does not word it. */
function whoWords(value: ForecastWatchValue, ctx: WatchLineContext): string | null {
  if (value == null) return NOT_STATED;
  const read = readSetAside(ctx.forecast.record, ctx.firm, String(value));
  return SILENT_WHO.has(read.who.kind) ? null : inSentence(read.who.text);
}

/** A set-aside code as the record sent it, trimmed and upper-cased as the reader reads it. */
function codeWords(value: ForecastWatchValue): string {
  const code = value == null ? "" : String(value).trim().toUpperCase();
  return code === "" ? NOT_STATED : code;
}

/** "Undecided" is null, blank or TBD, as the backend's diff reads it (§4.3). */
function undecided(value: ForecastWatchValue): boolean {
  return isUndecidedSetAside(value == null ? null : String(value));
}

/** The change in the reader's words. Null when a side it needs is not worded or both read the same. */
function wordedSetAside(
  e: ForecastWatchEvent,
  before: string | null,
  after: string | null,
): string | null {
  if (e.decided === true) return after == null ? null : WATCH_LINE.setAsideDecided(after);
  if (before == null) return null;
  if (undecided(e.after)) return WATCH_LINE.setAsideRemoved(before);
  return after == null || after === before ? null : WATCH_LINE.setAsideChanged(before, after);
}

/**
 * A set-aside change. When the who-may-bid reader cannot word it (a side it does not
 * word, or the same words on both sides), the line names the codes, so it never says
 * "changed from X to X". Null when the codes are the same too: nothing changed to say.
 */
function setAsideText(e: ForecastWatchEvent, ctx: WatchLineContext): string | null {
  const worded = wordedSetAside(e, whoWords(e.before, ctx), whoWords(e.after, ctx));
  if (worded != null) return worded;
  const from = codeWords(e.before);
  const to = codeWords(e.after);
  return from === to ? null : WATCH_LINE.setAsideCode(from, to);
}

function valueText(e: ForecastWatchEvent): string {
  const line = e.field === "valLow" ? WATCH_LINE.valueLow : WATCH_LINE.valueHigh;
  return line(amountWords(e.before), amountWords(e.after));
}

function codeText(e: ForecastWatchEvent): string {
  const line = e.field === "pscCode" ? WATCH_LINE.psc : WATCH_LINE.naics;
  return line(asSent(e.before), asSent(e.after));
}

function placeText(e: ForecastWatchEvent): string {
  if (e.field === "popCity") {
    const city = (v: ForecastWatchValue) =>
      typeof v === "string" ? (cityName(v) ?? NOT_STATED) : asSent(v);
    return WATCH_LINE.city(city(e.before), city(e.after));
  }
  const state = (v: ForecastWatchValue) =>
    typeof v === "string" && v.trim() ? stateName(v.trim().toUpperCase()) : asSent(v);
  return WATCH_LINE.state(state(e.before), state(e.after));
}

/** The sentence for a change to the record. Null for a kind that is not a change. */
function changeText(e: ForecastWatchEvent, ctx: WatchLineContext): string | null {
  switch (e.kind) {
    case "date_moved":
      return WATCH_LINE.dateMoved(dateWords(e.before, ctx), dateWords(e.after, ctx));
    case "set_aside_changed":
      return setAsideText(e, ctx);
    case "value_changed":
      return valueText(e);
    case "code_changed":
      return codeText(e);
    case "place_changed":
      return placeText(e);
    case "expected_date_passed":
      return WATCH_LINE.expectedDatePassed;
    case "no_longer_listed":
      return WATCH_LINE.noLongerListed;
    default:
      return null;
  }
}

/** A stated value, or null when the record gives nothing. */
function present(value: string | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

type PostedHeadline = keyof typeof WATCH_NOTICE.postedHeadline;

/** The stored notice types, with case, spaces and hyphens removed, by headline. */
const HEADLINE_OF_TYPE = new Map<string, PostedHeadline>([
  ["solicitation", "bidRequest"],
  ["synopsissolicitation", "bidRequest"],
  ["presolicitation", "earlyNotice"],
  ["sourcessought", "sourcesSought"],
]);

function postedHeadline(noticeType: string | null): PostedHeadline {
  const key = (noticeType ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return HEADLINE_OF_TYPE.get(key) ?? "other";
}

/** The posted day in the page's words, or null when it is not a calendar day. */
function postedWords(postedOn: string | null): string | null {
  const day = postedOn?.trim() ?? "";
  return CALENDAR_DAY.test(day) ? longDate(day) : null;
}

/** The link's words: a suggestion is a check, and only a bid request is called one. */
function linkLabel(n: ForecastWatchNotice): string {
  if (n.basis.kind === "suggested") return WATCH_NOTICE.open.suggested;
  if (n.target === "forecast") return WATCH_NOTICE.open.forecast;
  return postedHeadline(n.noticeType) === "bidRequest"
    ? WATCH_NOTICE.open.opportunity
    : WATCH_NOTICE.open.notice;
}

/** The headline and the basis sentences for one basis kind. */
function noticeWords(
  n: ForecastWatchNotice,
  basis: ForecastWatchNoticeBasis,
): { headline: string; sentences: string[] } {
  switch (basis.kind) {
    case "named":
      return {
        headline: WATCH_NOTICE.postedHeadline[postedHeadline(n.noticeType)],
        sentences: [WATCH_NOTICE.namedBasis(basis.number)],
      };
    case "same_plan":
      return {
        headline: WATCH_NOTICE.republishedHeadline,
        sentences: [WATCH_NOTICE.planBasis(basis.sourceId), WATCH_NOTICE.republishedFollow],
      };
    case "suggested":
      return {
        headline: WATCH_NOTICE.suggestedHeadline,
        sentences: [
          officeSentence(basis),
          WATCH_NOTICE.suggestedOverlap[basis.overlap],
          WATCH_NOTICE.suggestedOnly,
        ],
      };
  }
}

/** How the suggested notice's office relates to the forecast's office. */
function officeSentence(basis: Extract<ForecastWatchNoticeBasis, { kind: "suggested" }>): string {
  if (basis.office === "same") return WATCH_NOTICE.suggestedOffice.same;
  const name = present(basis.officeName);
  return name
    ? WATCH_NOTICE.suggestedOffice.within(name)
    : WATCH_NOTICE.suggestedOffice.withinUnnamed;
}

function noticeLineOf(base: LineBase, n: ForecastWatchNotice): NoticeLine {
  return {
    ...base,
    kind: "notice",
    ...noticeWords(n, n.basis),
    names: WATCH_NOTICE.names(present(n.title), present(n.agencyName), postedWords(n.postedOn)),
    link: n.held ? { target: n.target, id: n.oppKey, label: linkLabel(n) } : null,
    unavailable: n.held ? null : WATCH_NOTICE.notHeld,
  };
}

/** The notice kinds. Their line comes from the notice, never from `field`, `before` or `after`. */
const NOTICE_KINDS = new Set(["bid_request_posted", "republished", "notice_suggested"]);

function lineOf(e: ForecastWatchEvent, ctx: WatchLineContext): WatchLine | null {
  const base: LineBase = {
    id: e.id,
    noticed: WATCH_BOX.noticed(longDate(e.observedAt)),
    unseen: e.seenAt == null,
    counted: isCountedKind(e.kind),
  };
  if (NOTICE_KINDS.has(e.kind)) return e.notice ? noticeLineOf(base, e.notice) : null;
  const text = changeText(e, ctx);
  return text == null ? null : { ...base, kind: "change", text };
}

/** The events as lines, newest first. An event the client cannot word is left out. */
export function watchLines(events: ForecastWatchEvent[], ctx: WatchLineContext): WatchLine[] {
  return [...events]
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
    .map((e) => lineOf(e, ctx))
    .filter((line): line is WatchLine => line != null);
}
