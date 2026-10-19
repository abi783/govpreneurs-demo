// The story's own checks. Each returns a list of problems; story.test.ts
// fails the build if any list is not empty. This is what makes "every reason
// Hunter gives is true" a fact rather than a hope.

import { MEMBER } from "../member";
import { OTHER_MEMBERS_WORDS } from "../members/words";
import {
  AVA_BIDS,
  FOR_YOU,
  OPPORTUNITIES,
  type FitFact,
  type StoryOpportunity,
} from "./opportunities";
import { PAST_PERFORMANCE, PERSONA } from "./persona";
import { PLACES } from "./places";
import { CLOSED_PURSUITS, MENTOR_REVIEWS, TASKS, WALLET } from "./workspace";

/** Routes the story may link to. Dynamic segments are checked by prefix. */
const KNOWN_ROUTES = [
  "/",
  "/roadmap",
  "/tasks",
  "/opportunities",
  "/forecasts",
  "/small-orders",
  "/partners",
  "/awards",
  "/my-business",
  "/pipeline",
  "/ava",
  "/find-a-mentor",
  "/mentors",
];

function routeOk(to: string): boolean {
  if (KNOWN_ROUTES.includes(to)) return true;
  if (to.startsWith("/opportunities/")) return Boolean(OPPORTUNITIES.find((o) => to === `/opportunities/${o.id}`));
  if (to.startsWith("/ava/")) return Boolean(AVA_BIDS.find((o) => to === `/ava/${o.id}`));
  if (to.startsWith("/mentors/")) return Boolean(MENTOR_REVIEWS.find((r) => to === `/mentors/${r.id}`));
  if (to.startsWith("/my-business/")) return true;
  return false;
}

/** "$660K" → 660000, "$2M" → 2000000. */
function parseMoney(text: string): number | null {
  const m = text.match(/\$(\d+(?:\.\d+)?)\s*([KM])/);
  if (!m) return null;
  return Number(m[1]) * (m[2] === "M" ? 1_000_000 : 1_000);
}

export function factProblem(o: StoryOpportunity, f: FitFact): string | null {
  const miles = PLACES[o.place].milesFromBase;
  const mid = o.valueLow !== null && o.valueHigh !== null ? (o.valueLow + o.valueHigh) / 2 : null;
  switch (f.kind) {
    case "naics": {
      const codes = [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)] as string[];
      if (o.naics !== f.code) return `naics fact ${f.code} but opportunity is ${o.naics}`;
      if (!codes.includes(f.code)) return `naics ${f.code} is not one of the member's codes`;
      return null;
    }
    case "setAside":
      if (o.setAside !== f.code) return `set-aside fact ${f.code} but opportunity is ${o.setAside}`;
      if (!(PERSONA.setAsideEligibility as readonly string[]).includes(f.code))
        return `member is not eligible for ${f.code}`;
      return null;
    case "valueInRange": {
      if (mid === null) return "value fact on an opportunity with no value";
      if (mid < PERSONA.targetValueMin || mid > PERSONA.targetValueMax)
        return `midpoint ${mid} is outside the member's range`;
      const said = parseMoney(f.says);
      if (said !== null && (said < (o.valueLow ?? 0) || said > (o.valueHigh ?? 0)))
        return `"${f.says}" is outside ${o.valueLow}–${o.valueHigh}`;
      return null;
    }
    case "valueAboveRange": {
      if (o.valueLow === null || o.valueLow <= PERSONA.targetValueMax)
        return "value-above-range fact, but the low value is inside the range";
      const said = parseMoney(f.says);
      if (said !== null && (said < (o.valueLow ?? 0) || said > (o.valueHigh ?? 0)))
        return `"${f.says}" is outside ${o.valueLow}–${o.valueHigh}`;
      return null;
    }
    case "distance": {
      const s = f.says;
      const milesSaid = s.match(/(\d+) miles/);
      const minutesSaid = s.match(/(\d+) minutes/);
      if (milesSaid && Math.abs(Number(milesSaid[1]) - miles) > 5) return `"${s}" but the place is ${miles} miles`;
      if (minutesSaid && miles > Number(minutesSaid[1]) * 1.2 + 3) return `"${s}" but the place is ${miles} miles`;
      if (/under an hour/.test(s) && miles > 60) return `"${s}" but the place is ${miles} miles`;
      if (/hometown|across town/.test(s) && miles > 5) return `"${s}" but the place is ${miles} miles`;
      if (miles > PERSONA.serviceRadiusMiles && !/outside/.test(s)) return `${miles} miles is outside the service area`;
      return null;
    }
    case "pastPerformance":
      return PAST_PERFORMANCE.some((p) => p.id === f.id) ? null : `no past job ${f.id}`;
    case "targetAgency":
      return o.targetAgency ? null : "target-agency fact on a non-target buyer";
    case "noticeType":
      if (/not a bid/i.test(f.says)) return o.noticeType === "Sources Sought" ? null : "says 'not a bid' on a real bid";
      if (/sealed/i.test(f.says)) return o.noticeType === "Invitation for Bid" ? null : "says 'sealed' on a non-IFB";
      return `unchecked notice-type phrase "${f.says}"`;
    case "clearanceGap":
      return o.clearanceRequired && PERSONA.clearances.length === 0 ? null : "clearance-gap fact is not true";
    case "providerLock":
      return o.exclusiveProvider ? null : "provider-lock fact on work open to any provider";
    case "lockedOut":
      return o.lockedTo ? null : "locked-out fact on work any firm can bid";
    case "setAsideGap":
      return o.setAside && !(PERSONA.setAsideEligibility as readonly string[]).includes(o.setAside)
        ? null
        : "set-aside-gap fact, but the member can bid this set-aside";
  }
}

export function checkStory(): string[] {
  const problems: string[] = [];
  const p = (o: { id: string }, msg: string) => problems.push(`${o.id}: ${msg}`);

  const ids = new Set<string>();
  for (const o of OPPORTUNITIES) {
    if (ids.has(o.id)) p(o, "duplicate id");
    ids.add(o.id);
    if (o.closesInDays < 7) p(o, `closes in ${o.closesInDays} days; must be 7 or more`);
    if (o.postedDaysAgo < 0) p(o, "posted in the future");
    if (o.valueLow !== null && o.valueHigh !== null && o.valueLow > o.valueHigh) p(o, "value low > high");
    if (/\b(Amira's Kitchen|Marcus|Williams Construction|roof)/i.test(JSON.stringify(o))) p(o, "old persona text");
    // A pack member's story must never fall back to another member's words.
    if (MEMBER !== "caterer" && OTHER_MEMBERS_WORDS.test(JSON.stringify(o))) p(o, "another member's word in the story");

    const { line, fit, forYouRank } = o.hunter;
    if (forYouRank !== undefined) {
      if (!line) p(o, "For You pick has no Hunter line");
      if (!fit || fit.length < 2) p(o, "For You pick needs at least 2 fit facts");
    }
    if (line) {
      if (line.length > 210) p(o, `Hunter line is ${line.length} chars (max 210)`);
      if (/\b(win|wins|winning|guarantee\w*|no-bid|lean bid)\b/i.test(line)) p(o, "Hunter line uses a verdict or win word");
      for (const f of fit ?? []) {
        if (!line.includes(f.says)) p(o, `Hunter line does not contain "${f.says}"`);
        const why = factProblem(o, f);
        if (why) p(o, why);
      }
    }

    if (o.ava) {
      if (!o.pursuit || !["drafting", "with_mentor"].includes(o.pursuit.stage))
        p(o, "Ava is building it, but the Pipeline does not say so");
      if (o.grant.verdict === "no_bid") p(o, "Ava is building a bid Grant said not to bid");
    }
    if (o.grant.verdict === "no_bid" && o.pursuit && !["declined"].includes(o.pursuit.stage))
      p(o, "Grant said no-bid but the pursuit is still open");
    if (o.pursuit && !routeOk(o.pursuit.next.to)) p(o, `pursuit links to unknown route ${o.pursuit.next.to}`);
    if (o.mentorReviewId) {
      const r = MENTOR_REVIEWS.find((m) => m.id === o.mentorReviewId);
      if (!r) p(o, `no mentor review ${o.mentorReviewId}`);
      else if (r.oppId !== o.id) p(o, `mentor review ${r.id} points at ${r.oppId}`);
    }
  }

  const ranks = FOR_YOU.map((o) => o.hunter.forYouRank);
  ranks.forEach((r, i) => {
    if (r !== i + 1) problems.push(`For You ranks must run 1..${ranks.length}; found ${ranks.join(",")}`);
  });

  for (const r of MENTOR_REVIEWS) {
    if (r.oppId && !ids.has(r.oppId)) problems.push(`${r.id}: unknown opportunity ${r.oppId}`);
  }
  for (const c of CLOSED_PURSUITS) {
    if (ids.has(c.id)) problems.push(`${c.id}: closed pursuit is also an open opportunity`);
    if (!routeOk(c.next.to)) problems.push(`${c.id}: links to unknown route ${c.next.to}`);
  }
  for (const t of TASKS) {
    if (!routeOk(t.to)) problems.push(`${t.id}: links to unknown route ${t.to}`);
  }
  const sum = WALLET.entries.reduce((s, e) => s + e.amount, 0);
  if (sum !== WALLET.balance) problems.push(`wallet entries sum to ${sum}, balance says ${WALLET.balance}`);

  return problems;
}
