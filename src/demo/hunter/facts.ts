// DEMO (Hunter): plain facts about one opportunity and the member, for the
// feed's "why" lines and for every chat answer. All inputs come from the story
// (`persona.ts`, `opportunities.ts`, `places.ts`). Nothing is typed twice.

import { money } from "../../lib/money";
import { PAST_PERFORMANCE, PERSONA, type PastPerformance } from "../story/persona";
import type { FitFact } from "../story/opportunities";
import { longDate } from "./dates";
import type { FeedRow } from "./data";

/** The member's NAICS codes, primary first. */
export const MEMBER_CODES: string[] = [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)];

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

/** How far the place is from the kitchen, in words. */
export function distanceText(row: FeedRow): string {
  if (row.miles <= 5) return "in your own town";
  if (row.miles <= 60) return row.miles <= 20 ? `${row.miles} miles from your kitchen` : `${row.miles} miles from your kitchen, under an hour`;
  return `${row.miles} miles from your kitchen`;
}

/** The short form for a fit line. */
export function distanceShort(row: FeedRow): string {
  if (row.miles <= 5) return "in your hometown";
  if (row.miles <= 60) return "under an hour from your kitchen";
  if (row.miles <= PERSONA.serviceRadiusMiles) return `${row.miles} miles from your kitchen`;
  return `${row.miles} miles away, outside your ${PERSONA.serviceRadiusMiles}-mile area`;
}

/** Plain name of the set-aside, and whether the member holds it. */
export function setAsideText(row: FeedRow): string {
  if (row.setAside === "WOSB") return "a woman-owned set-aside";
  if (row.setAside === "SBA") return "a small-business set-aside";
  return "open to every business";
}

/** The member holds every set-aside the story uses (WOSB and small business). */
export function holdsSetAside(row: FeedRow): boolean {
  if (!row.setAside) return true;
  return (PERSONA.setAsideEligibility as readonly string[]).includes(row.setAside);
}

/** A past job that matches this notice, by what the notice is about. */
export function pastJobFor(row: FeedRow): PastPerformance | undefined {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  const byId = (id: PastPerformance["id"]) => PAST_PERFORMANCE.find((p) => p.id === id);
  if (row.o.naics === "722320") return byId("pp-church");
  if (/patient|hospital|medical|nutrition|veterans/.test(text)) return byId("pp-womack");
  if (/school|cafeteria|child nutrition|senior|detention|meal program|meals for/.test(text)) {
    return byId("pp-county-schools");
  }
  if (/fort bragg|camp mackall|pope|dining|army|mess|barracks|airfield|flight line|lodging/.test(text)) {
    return byId("pp-cdg-sub");
  }
  return byId("pp-county-schools");
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
    default:
      return "a solicitation";
  }
}

/** What one story fit fact says in a full sentence, for "why does this match me". */
export function fitSentence(row: FeedRow, f: FitFact): string {
  switch (f.kind) {
    case "naics":
      return `It uses your food-service code, NAICS ${f.code} (${row.naicsLabel}).`;
    case "setAside":
      return f.code === "WOSB"
        ? "Only woman-owned small businesses can compete for it, and you are one."
        : "It is set aside for small businesses, and you are one.";
    case "valueInRange":
      return `The value is ${aboutValue(row)}. That is inside your ${RANGE_TEXT} range.`;
    case "valueAboveRange":
      return `The value is ${aboutValue(row)}. That is above your ${RANGE_TEXT} range, so it may be a team job.`;
    case "distance":
      return `The site is ${row.miles} miles from your kitchen in ${PERSONA.hqCity}.`;
    case "pastPerformance": {
      const p = PAST_PERFORMANCE.find((x) => x.id === f.id);
      return p ? `You did this kind of work before: ${pastJobText(p)}.` : "You did this kind of work before.";
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
    const ordered = [...fit].sort((a, b) => Number(a.kind === "clearanceGap") - Number(b.kind === "clearanceGap"));
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
  if (row.o.naics === PERSONA.primaryNaics) return "your food-service code";
  if (row.o.naics === "722320") return "your catering code";
  if (row.o.naics === "722330") return "your mobile-food code";
  return "one of your codes";
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
  if (o.clearanceRequired) tail.push("every worker needs a security clearance and your team holds none");
  if (row.miles > PERSONA.serviceRadiusMiles) {
    tail.push(`it is ${row.miles} miles away, outside your ${PERSONA.serviceRadiusMiles}-mile area`);
  } else if (row.miles <= 60) {
    parts.push(distanceShort(row));
  } else {
    tail.push(`it is ${row.miles} miles from your kitchen`);
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
