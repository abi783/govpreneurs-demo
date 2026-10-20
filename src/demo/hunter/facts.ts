// DEMO (Hunter): plain facts about one opportunity and the member, for the
// feed's "why" lines and for every chat answer. All inputs come from the story
// (`persona.ts`, `opportunities.ts`, `places.ts`). Nothing is typed twice.

import { money } from "../../lib/money";
import { findPastPerformance, PERSONA, type PastPerformance } from "../story/persona";
import { aSetAside, holds, SET_ASIDES, type SetAsideCode } from "../story/setAsides";
import type { FitFact } from "../story/opportunities";
import { longDate } from "./dates";
import type { FeedRow } from "./data";
import { VOCAB } from "./vocab";

/** "from your kitchen", "from your office". */
export const FROM_BASE = `from your ${VOCAB.base}`;

/** The member's NAICS codes, primary first. */
export const MEMBER_CODES: string[] = [
  PERSONA.primaryNaics,
  ...PERSONA.secondaryNaics.map((n) => n.code),
];

/** The member's value range as text: "$120K to $750K". */
export const RANGE_TEXT = `${money(PERSONA.targetValueMin)} to ${money(PERSONA.targetValueMax)}`;

/** The middle of the value estimate, or null when the notice states none. */
export function midValue(row: FeedRow): number | null {
  if (row.low === null && row.high === null) return null;
  const low = row.low ?? row.high!;
  const high = row.high ?? row.low!;
  return Math.round((low + high) / 2);
}

export type RangeStatus = "in" | "above" | "below" | "none";

/** Where the value sits against the member's target range. */
export function rangeStatus(row: FeedRow): RangeStatus {
  const mid = midValue(row);
  if (mid === null) return "none";
  if (row.low !== null && row.low > PERSONA.targetValueMax) return "above";
  if (mid > PERSONA.targetValueMax) return "above";
  if (mid < PERSONA.targetValueMin) return "below";
  return "in";
}

/** "$540K to $780K", "$185K to $235K", or "no value stated". */
export function valueText(row: FeedRow): string {
  if (row.low === null && row.high === null) return "no value stated";
  const per = row.o.valueBasis === "per_year" ? " a year" : "";
  if (row.low !== null && row.high !== null && row.low !== row.high) {
    return `${money(row.low)} to ${money(row.high)}${per}`;
  }
  return `${money(row.low ?? row.high!)}${per}`;
}

/** "about $660K" or "about $2M a year". */
export function aboutValue(row: FeedRow): string {
  const mid = midValue(row);
  if (mid === null) return "no stated value";
  return `about ${money(mid)}${row.o.valueBasis === "per_year" ? " a year" : ""}`;
}

/** The short form for a fit line. */
export function distanceShort(row: FeedRow): string {
  if (row.miles <= 5) return VOCAB.hometown;
  if (row.miles <= 60) return `under an hour ${FROM_BASE}`;
  if (row.miles <= PERSONA.serviceRadiusMiles) return `${row.miles} miles ${FROM_BASE}`;
  return `${row.miles} miles away, outside your ${PERSONA.serviceRadiusMiles}-mile area`;
}

/** Who a set-aside is for, by SAM code. */
const SET_ASIDE_FOR: Record<string, { name: string; firms: string }> = SET_ASIDES;

/** "Woman-owned (WOSB)", for the readiness card. */
export function setAsideName(row: FeedRow): string {
  return SET_ASIDE_FOR[row.setAside]?.name ?? row.setAside;
}

/** Plain name of the set-aside, and whether the member holds it. */
export function setAsideText(row: FeedRow): string {
  return row.setAside ? aSetAside(row.setAside as SetAsideCode) : "open to every business";
}

/** True when the member can compete for the set-aside (or there is none). */
export function holdsSetAside(row: FeedRow): boolean {
  return holds(row.setAside);
}

/** A past job that matches this notice, by what the notice is about. */
export function pastJobFor(row: FeedRow): PastPerformance | undefined {
  const id = VOCAB.pastJobId(row);
  return id ? findPastPerformance(id) : undefined;
}

/** One past job as a short phrase: "Cumberland County Schools summer meals, $198K". */
export function pastJobText(p: PastPerformance): string {
  return `${p.projectTitle.replace(/ \(subcontract\)/, "")} (${money(p.totalValue)})`;
}

/** A leading capital letter. */
export function cap(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

/** "Closes in 26 days (Nov 11)". */
export function closesText(row: FeedRow): string {
  return `closes in ${row.o.closesInDays} days (${longDate(row.o.closesInDays)})`;
}

/** The notice type as the member reads it. */
export function noticeText(row: FeedRow): string {
  switch (row.o.noticeType) {
    case "Request for Quote":
      return "a request for quote (the buyer asks for a price)";
    case "Request for Proposal":
      return "a request for proposal (the buyer asks for a written plan and a price)";
    case "Invitation for Bid":
      return "an invitation for bid (a sealed price)";
    case "Sources Sought":
      return "a Sources Sought notice (an early look, not a bid yet)";
    case "Combined Synopsis/Solicitation":
      return "a combined notice and request";
    case "Special Notice":
      return "a special notice (the buyer tells sellers its plans; it asks for no price)";
    default:
      return "a solicitation";
  }
}

/** What one story fit fact says in a full sentence, for "why does this match me". */
export function fitSentence(row: FeedRow, f: FitFact): string {
  switch (f.kind) {
    case "naics":
      // The story's own words for the code ("your food-service code"), as the card's line says them.
      return `It uses ${f.says}, NAICS ${f.code} (${row.naicsLabel}).`;
    case "setAside":
      return f.code === "SBA"
        ? "It is set aside for small businesses, and you are one."
        : `Only ${SET_ASIDES[f.code].firms} can compete for it, and you are one.`;
    case "providerLock":
      return "The work is written around one provider's own platform and crew, so other firms can't meet it as written.";
    case "lockedOut":
      return `Only ${row.o.lockedTo} can bid, and you are not one of them.`;
    case "setAsideGap":
      return `It is set aside for ${SET_ASIDE_FOR[row.setAside]?.firms ?? "a group you are not in"}, and you are not one, so the way in is as a subcontractor.`;
    case "valueInRange":
      return `The value is ${aboutValue(row)}. That is inside your ${RANGE_TEXT} range.`;
    case "valueAboveRange":
      return `The value is ${aboutValue(row)}. That is above your ${RANGE_TEXT} range, so it may be a team job.`;
    case "distance":
      return `${VOCAB.place} is ${row.miles} miles ${FROM_BASE} in ${PERSONA.hqCity}.`;
    case "pastPerformance": {
      const p = findPastPerformance(f.id);
      return p
        ? `You did this kind of work before: ${pastJobText(p)}.`
        : "You did this kind of work before.";
    }
    case "targetAgency":
      return `${row.o.agency} is one of your target buyers.`;
    case "noticeType":
      return `It is ${noticeText(row)}.`;
    case "clearanceGap":
      return "One concern: every worker needs a security clearance, and your team holds none.";
  }
}

/** One fit fact as a short reason for the matches card. */
function reasonOf(f: FitFact): string {
  switch (f.kind) {
    case "valueAboveRange":
      return `Above your range: ${f.says.replace(/\s+it is above your range.*$/, "")}`;
    case "targetAgency":
      return "One of your target buyers";
    case "clearanceGap":
      return "Needs cleared staff, and your team holds none";
    default:
      return cap(f.says);
  }
}

/** Up to three short reasons for the matches card. */
export function reasonList(row: FeedRow): string[] {
  const fit = row.o.hunter.fit;
  if (fit && fit.length > 0) {
    // A concern goes last so that the good reasons lead.
    const ordered = [...fit].sort(
      (a, b) => Number(a.kind === "clearanceGap") - Number(b.kind === "clearanceGap"),
    );
    // A provider lock, a lockout or a set-aside she does not hold always shows, in third place.
    const gap = fit.find((f) => f.kind === "providerLock" || f.kind === "lockedOut" || f.kind === "setAsideGap");
    if (gap) return [...ordered.filter((f) => f !== gap).slice(0, 2), gap].map(reasonOf);
    return ordered.slice(0, 3).map(reasonOf);
  }
  const out: string[] = [];
  out.push(cap(codePhrase(row)));
  if (row.setAside && holdsSetAside(row)) out.push(cap(setAsideText(row)));
  out.push(cap(distanceShort(row)));
  return out.slice(0, 3);
}

/** "your food-service code" for the member's primary code, and so on. */
export function codePhrase(row: FeedRow): string {
  return VOCAB.codePhrases[row.o.naics] ?? "one of your codes";
}

/** The Hunter line for a card: the story line, or a short true line built from the story facts. */
export function hunterLine(row: FeedRow): string {
  if (row.o.hunter.line) return row.o.hunter.line;
  return generatedLine(row);
}

/**
 * A line for an opportunity that has none in the story. It uses only facts that
 * are true of this notice and this member. It never says "bid" as a verdict,
 * and it never promises a win.
 */
export function generatedLine(row: FeedRow): string {
  const o = row.o;
  const parts: string[] = [codePhrase(row)];
  if (o.noticeType === "Sources Sought") {
    parts.push("an early notice, not a bid yet");
  } else if (row.setAside) {
    parts.push(setAsideText(row));
  }
  const status = rangeStatus(row);
  if (status === "in") parts.push(aboutValue(row));
  const tail: string[] = [];
  if (status === "above") tail.push(`At ${aboutValue(row)} it is above your ${RANGE_TEXT} range`);
  if (status === "below") tail.push(`At ${aboutValue(row)} it is below your usual range`);
  if (o.clearanceRequired)
    tail.push("every worker needs a security clearance and your team holds none");
  if (row.miles > PERSONA.serviceRadiusMiles) {
    tail.push(
      `it is ${row.miles} miles away, outside your ${PERSONA.serviceRadiusMiles}-mile area`,
    );
  } else if (row.miles <= 60) {
    parts.push(distanceShort(row));
  } else {
    tail.push(`it is ${row.miles} miles ${FROM_BASE}`);
  }
  const lead = `${cap(o.plainTitle)}: ${joinList(parts)}.`;
  if (tail.length === 0) return lead;
  const [first, ...rest] = tail;
  const second = rest.length ? `, and ${rest.join(" and ")}` : "";
  return `${lead} ${cap(first)}${second}.`;
}

/** "a, b, and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
