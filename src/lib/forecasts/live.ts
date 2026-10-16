// Live forecasts: the records from `GET /forecasts`, read for the signed-in member.
//
// The engine takes Hunter's reading of a record as `ForecastFacts` (plain title,
// Hunter's take, work fit). For a live record each of those comes from data:
//   · the plain title from the forecast's summary, else the buyer's own title;
//   · the work fit from the member's match record (semantic score, else category fit),
//     and the taxonomy's code fit in place of the engine's code-prefix stand-in;
//   · how much the record gave us to read from the length of its description;
//   · Hunter's take from the engine's own reasons, so it is worked out, not written.

import type { ForecastMemberDto, ForecastRecordDto } from "../forecastsApi";
import {
  FORECASTS_TODAY,
  NO_PUBLIC_RECORDS,
  scoreForecast,
  type ForecastFirm,
  type ScoredForecast,
} from "./engine";
import type { Extraction, ForecastFacts } from "./facts";
import { LIVE } from "./copy";

/** The engine's value for a record with no industry code (scoring-rules v5, opp_no_naics). */
const NO_CODE_FIT = 0.2;
/** Neutral when the member has no industry codes on record (user_no_naics). */
const NO_MEMBER_CODES_FIT = 0.5;
/** Work fit at or above this reads as the member's own kind of work. */
const OWN_WORK = 0.7;
/** Work fit at or above this reads as close to the member's work (the engine's workOk). */
const CLOSE_WORK = 0.5;
/** Description lengths, in characters, that mark how much there is to read. */
const TEXT_LOW = 100;
const TEXT_HIGH = 600;

/** The member's facts, in the shape the engine reads. */
export function firmFromMember(m: ForecastMemberDto): ForecastFirm {
  return {
    naics: m.naics,
    states: m.states,
    certs: m.certs,
    certsKnown: m.certsKnown,
    isSmall: m.isSmall,
    registration: m.registration,
    biggestPastJob: m.biggestPastJob,
    smallestTarget: m.smallestTarget,
  };
}

/**
 * The industry-code fit: the taxonomy's, from the member's match, or the value the
 * taxonomy gives when there is no match. The matching engine skips forecasts outside
 * the member's own and allied trades, and forecasts with no code, so a missing match
 * reads as the taxonomy would have scored it, never as the engine's neutral stand-in.
 */
function codeFitOf(r: ForecastRecordDto, firm: ForecastFirm): number {
  if (r.hunter.categoryFit != null) return r.hunter.categoryFit;
  if (!r.naicsCode) return NO_CODE_FIT;
  if (firm.naics.length === 0) return NO_MEMBER_CODES_FIT;
  return firm.naics.includes(r.naicsCode) ? 1 : 0;
}

/** How much the record gave us to read. A description that repeats the title is little. */
function extractionOf(r: ForecastRecordDto): Extraction {
  const text = r.hgText?.trim() ?? "";
  if (!text) return "none";
  if (text === r.hgTitle?.trim() || text.length < TEXT_LOW) return "low";
  return text.length < TEXT_HIGH ? "medium" : "high";
}

/** The work line agrees with the engine's own test of fitting work (scoreForecast's
 *  workOk): a close enough fit, or no description to read and exactly her industry code. */
function workLine(fit: number, extraction: Extraction, exactCode: boolean): string {
  const fits = fit >= CLOSE_WORK || (extraction === "none" && exactCode);
  if (!fits) return LIVE.work.outside;
  return fit >= OWN_WORK || exactCode ? LIVE.work.own : LIVE.work.close;
}

/** A local record's kind, in plain words where we know the source type. */
function foundOf(r: ForecastRecordDto): string | undefined {
  if (r.lane !== "sled" || !r.oppType) return undefined;
  return LIVE.found[r.oppType] ?? r.oppType;
}

/** "First reason. But the second." — the card's take, from the engine's reasons. */
function takeOf(f: ScoredForecast): string {
  const good = f.reasons.filter((x) => x.ok).map((x) => x.text);
  const bad = f.reasons.filter((x) => !x.ok).map((x) => x.text);
  const lines = [...good, ...bad.map((t, i) => (i === 0 && good.length ? LIVE.but(t) : t))].map(
    (t) => (/[.?!]$/.test(t) ? t : `${t}.`),
  );
  return lines.join(" ") || f.verdict;
}

/** One live record, scored and read for the member. */
export function scoreLive(r: ForecastRecordDto, firm: ForecastFirm): ScoredForecast {
  const codeFit = codeFitOf(r, firm);
  // How well the described work fits: the embeddings where there are any, else the code.
  const fit = r.hunter.semanticFit ?? codeFit;
  const extraction = extractionOf(r);
  const exactCode = !!r.naicsCode && codeFit >= 1;
  const facts: ForecastFacts = {
    title: r.hunter.plainTitle ?? r.hgTitle ?? LIVE.untitled,
    why: "",
    work: workLine(fit, extraction, exactCode),
    scopeFit: fit,
    codeFit,
    extraction,
    found: foundOf(r),
  };
  // The API sends no prior award, buyer page or source document, so none is passed.
  const scored = scoreForecast(r, firm, FORECASTS_TODAY, facts, NO_PUBLIC_RECORDS);
  return { ...scored, facts: { ...facts, why: takeOf(scored) } };
}
