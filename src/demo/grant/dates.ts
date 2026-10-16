// DEMO: the key dates of each opportunity, in one place.
//
// The page timeline, the solicitation clauses, the sample documents and Grant's
// trail all use these, so a date is never different in two places. A hand-written
// Grant review lists its own dates (the story brief, or heroBriefs.ts). Other
// notices follow a rule of thumb.

import { getGrantBrief } from "@/demo/story/grantBriefs";
import { offerWord } from "./domains";
import { longDate, type OppFacts } from "./facts";
import { AUTHORED_BRIEFS } from "./heroBriefs";

export interface KeyDate {
  label: string;
  /** Days from today, on the demo clock. */
  inDays: number;
  time: string;
}

/** The dates a hand-written review lists, if there is one. */
function briefKeyDates(id: string): { label: string; inDays: number }[] | undefined {
  return getGrantBrief(id)?.keyDates ?? AUTHORED_BRIEFS[id]?.keyDates;
}

export function dueLabel(f: OppFacts): string {
  const offer = offerWord(f.opp);
  return offer === "bid" ? "Bids due" : offer === "quote" ? "Quotes due" : offer === "reply" ? "Replies due" : "Proposals due";
}

export function keyDatesFor(f: OppFacts): KeyDate[] {
  const label = dueLabel(f);
  const brief = briefKeyDates(f.id);
  if (brief && brief.length > 0) {
    return brief.map((k) => ({
      label: /proposals? due|quotes? due|bids? due/i.test(k.label) ? label : k.label,
      inDays: k.inDays,
      time: /conference/i.test(k.label) ? "10:00 AM Eastern" : "5:00 PM Eastern",
    }));
  }
  const close = f.opp.closesInDays;
  const out: KeyDate[] = [];
  if (!f.isSourcesSought) {
    out.push({ label: "Questions due", inDays: Math.max(3, close - Math.max(7, Math.round(close * 0.45))), time: "5:00 PM Eastern" });
  }
  out.push({ label, inDays: close, time: "5:00 PM Eastern" });
  if (!f.isSourcesSought) {
    out.push({ label: "Anticipated award", inDays: close + (f.isFederal ? 21 : 28), time: "" });
  }
  return out;
}

/** The calendar day of a key date. */
export function dateOfKey(f: OppFacts, k: KeyDate): Date {
  return new Date(f.closes.getTime() + (k.inDays - f.opp.closesInDays) * 86_400_000);
}

/** The date written out, for example "Questions due: October 28, 2026, 5:00 PM Eastern". */
export function keyDateBullets(f: OppFacts, dates: KeyDate[] = keyDatesFor(f)): string[] {
  return dates.map((k) => {
    const d = dateOfKey(f, k);
    return /award/i.test(k.label) ? `Anticipated award date: ${longDate(d)}` : `${k.label}: ${longDate(d)}, ${k.time}`;
  });
}

/** When written questions are due. */
export function questionsDate(f: OppFacts): Date {
  const q = keyDatesFor(f).find((k) => /question/i.test(k.label));
  return q ? dateOfKey(f, q) : new Date(f.closes.getTime() - 10 * 86_400_000);
}

/** When the buyer expects to award, or null. */
export function awardDate(f: OppFacts): Date | null {
  const a = keyDatesFor(f).find((k) => /award/i.test(k.label));
  return a ? dateOfKey(f, a) : null;
}
