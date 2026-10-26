// DEMO: Grant's analysis of every opportunity that has no hand-written review.
//
// It reads only the story: Grant's call and one-line reason, the value against
// the member's range, the miles from places.ts, the set-aside, the NAICS code, the
// past jobs, and the days left. It never says anything about a roofing firm.
// Production's own fallback (`synthesize` in lib/grant/index.ts) is not used.
//
// The call itself is the story's. The generator never changes it: it builds the
// reads, limits and next move so they explain that call.

import { byMember, own } from "@/demo/member";
import { dueTimeOf } from "@/demo/story/opportunities";
import type { GrantCall } from "@/demo/story/opportunities";
import { findPastPerformance, PERSONA, type PastPerformanceId } from "@/demo/story/persona";
import { holds, SET_ASIDES } from "@/demo/story/setAsides";
import type {
  CapturePath,
  ComplianceRow,
  GrantAnalysis,
  OpenQuestion,
  Pin,
  Read,
  RedTeamObjection,
  RichLine,
  RoadmapItem,
  SuggestedChip,
  TrailGroup,
  TypedWarning,
  WarningKind,
} from "@/lib/grant/types";
import { coverageFor } from "./coverage";
import { buyerShort, domainFor, offerWord, type Domain } from "./domains";
import { analyzedAt, gateInputsFor, localize, statusFor, verdictOf } from "./encode";
import {
  cap,
  CERTIFIED,
  COOKS,
  customerShort,
  driveText,
  longDate,
  PP,
  shareWords,
  UNCERTIFIED,
  usd,
  usdAbout,
  type OppFacts,
} from "./facts";
import { boldIn, firstSentence, pinComputed, rt, sentences } from "./rich";
import { clauseOf, clausePinMaybe, type Solicitation } from "./solicitation";
import { V } from "./vocab";

const { CAVEATS: PACK_CAVEATS } = own(
  import.meta.glob<typeof import("@/demo/members/agency/grant/vocab")>("/src/demo/members/*/grant/vocab.ts", { eager: true }),
);

type Rating = "strong" | "good" | "watch" | "weak";
const ORDER: Record<Rating, number> = { strong: 0, good: 1, watch: 2, weak: 3 };

interface Take {
  name: Read["name"];
  rating: Rating;
  text: string;
  bold?: string;
  pins: Pin[];
  dossier?: string[];
}

// ── Facts that decide the call ───────────────────────────────────────────

const VOLUME = new Set(["dining", "field", "school", "boxed", "senior", "detention", "hospital"]);
const DAILY = new Set(["dining", "cafe", "school", "hospital", "senior", "detention", "boxed", "staffing", "field"]);
const WITH_VANS = new Set(["field", "boxed", "senior", "detention", "hospital", "events"]);

/** The past job that is the best reference for each kind of work. */
function referenceFor(d: Domain) {
  if (d.reference) return findPastPerformance(d.reference) ?? null;
  switch (d.key) {
    case "school":
    case "senior":
    case "detention":
    case "cafe":
      return PP.county;
    case "hospital":
      return PP.womack;
    case "events":
      return PP.church;
    case "dining":
    case "field":
    case "boxed":
      return PP.cdg;
    default:
      return null;
  }
}

/** A risk the story's one-liner names that the facts alone do not show. */
export interface Caveat {
  limit: string;
  kind: WarningKind;
  change?: string;
  /** The caveat is what the call turns on, even for Needs review or No-bid. */
  decides?: boolean;
  /** The caveat in a few words, when it decides: "the GSA schedule". */
  phrase?: string;
  /** No-bid: the first step of the roadmap, with one bold phrase in `item`. */
  roadmap?: { item: string; why: string; takes: string };
  /** A closer reference than the kind of work gives. */
  ref?: PastPerformanceId;
  /** Replaces the trail's set-aside line, for a notice limited to some firms another way. */
  trail?: string;
  /** The read the caveat rewrites, with one bold phrase inside `text`. */
  read?: { name: Read["name"]; rating: Rating; text: string; bold?: string };
  /** Needs review: the open question to ask, the word on its chip ("Answer the media question"), and what an answer changes. */
  question?: {
    id: string;
    question: string;
    payoff: string;
    chip: string;
    yes: { gist: string; ack: string };
    no: { gist: string; ack: string };
  };
}

/** Notes for opportunities where the story's one-liner names a risk that the facts alone do not show. */
const CATERER_CAVEATS: Record<string, Caveat> = {
  "W912PM-26-Q-0017": {
    limit: "Large dinners: the notice includes dinners of up to 600 guests. Price staff, rentals and holding equipment for the largest ones.",
    kind: "winning-hurts",
    change: "If the Army posts a price list for each event size, I'd check that your largest dinner still earns a margin.",
  },
  "VA247-26-R-0112": {
    limit: `Performance rating: your ${customerShort(PP.womack)} job has no performance rating filed yet. Ask for an interim rating before you send the proposal.`,
    kind: "proposal-weakness",
    change: "If you cannot get the interim rating before the due date, I'd tell you which other reference to lead with.",
  },
  "W912PM-26-Q-0033": {
    limit: "Capacity: winning this and Camp Mackall field meals together would stretch a kitchen of five. Plan to hire two more staff first.",
    kind: "winning-hurts",
    change: "If you decide to bid Camp Mackall field meals as well, I'd move this to Needs review until you have two more staff.",
  },
  "NCNG-2026-21": {
    limit: "Weekends: drill weekends fall on one Saturday and Sunday a month. Check that your crew can work them.",
    kind: "winning-hurts",
  },
  "FA4800-26-Q-0044": {
    limit: "Early starts: a 5 AM delivery means a 3:30 AM start every day.",
    kind: "winning-hurts",
  },
  "NCDOT-2026-FAC-09": {
    limit: "Spread: five highway districts across the state mean five delivery routes from one kitchen.",
    kind: "winning-hurts",
  },
  "W912PM-26-R-0118": {
    limit: "Scope: fourteen facilities at once is a large-firm job.",
    kind: "winning-hurts",
  },
};

const CAVEATS: Record<string, Caveat> = byMember({ pack: PACK_CAVEATS, caterer: CATERER_CAVEATS });

// ── The generator ────────────────────────────────────────────────────────

export function generateAnalysis(f: OppFacts, sol: Solicitation): GrantAnalysis {
  const opp = f.opp;
  const d = domainFor(opp);
  const call: GrantCall = opp.grant;
  const verdict = verdictOf(f);
  const offer = offerWord(opp);
  const buyer = buyerShort(opp);
  const place = f.place.city;
  const annual = f.annual ?? 0;
  const mid = f.mid ?? 0;
  /** Yearly value against yearly revenue: how much work a year of it adds. */
  const share = f.share ?? 0;
  /** Total value against yearly revenue: the measure the story uses for "size". */
  const ratio = mid / PERSONA.annualRevenue;
  const ratioText = ratio >= 5 ? `${Math.round(ratio)}` : ratio.toFixed(1).replace(/\.0$/, "");
  const band: "small" | "fits" | "edge" | "above" | "far" =
    mid < PERSONA.targetValueMin ? "small" : mid <= 450_000 ? "fits" : mid <= PERSONA.targetValueMax ? "edge" : mid <= 1_200_000 ? "above" : "far";
  const range = `${usd(PERSONA.targetValueMin)} to ${usd(PERSONA.targetValueMax)}`;
  const miles = f.miles;
  const daily = DAILY.has(d.key);
  const caveat = CAVEATS[f.id];
  const ref = (caveat?.ref ? findPastPerformance(caveat.ref) : undefined) ?? referenceFor(d);
  /** Work not tied to one place, such as a statewide campaign run from the office (agency only). */
  const wideLine = V.wide(f);
  const wide = wideLine !== null;
  /** A drive long enough to matter. */
  const far = !wide && miles > 60;
  const subGo = call.prime === "no_go" && call.sub === "go";
  const cp = (kind: string, label?: string): Pin | null => clausePinMaybe(sol, kind, label);
  const pins = (...list: (Pin | null)[]): Pin[] => list.filter((p): p is Pin => p !== null);
  const hasBond = clausePinMaybe(sol, "bond") !== null;
  // A member with a bond line bonds most of its jobs: a bond is a limit only when the job does not fit the line.
  const line = PERSONA.bondLine;
  const bondFits = hasBond && line !== undefined && mid <= line.single && line.inUse + mid <= line.aggregate;
  const bondLimit = hasBond && !bondFits;
  const bondSays = line
    ? `The ${offer} needs performance and payment bonds of about ${usdAbout(mid)}. ${mid > line.single ? `That is more than your ${usd(line.single)} single-job bond.` : bondFits ? `That fits your ${usd(line.single)} single-job bond, with ${usd(line.aggregate - line.inUse)} of room left in your total.` : `Only ${usd(line.aggregate - line.inUse)} of room is left in your ${usd(line.aggregate)} total.`}`
    : `The notice asks for a bond near the annual price, about ${usdAbout(annual)}. Your largest bond is ${usd(PERSONA.largestBond)}.`;
  const srcOf = (kindOf: string): string => {
    const hit = clauseOf(sol, kindOf);
    return hit ? `§${hit.clause.ref}` : "Notice";
  };
  const outsideArea = !wide && miles > PERSONA.serviceRadiusMiles;
  const outOfState = f.place.state !== PERSONA.hqState;
  const shortDeadline = f.opp.closesInDays <= 10;
  const fitWeak = d.fit.rating === "weak";
  const priceOnly = f.isSealedBid;

  // ── The nine reads ────────────────────────────────────────────────────
  const fitBold: Record<string, string> = {
    dining: "the work your kitchen already does",
    cafe: "A daily counter is new for you",
    events: "Event catering is your strongest work",
    school: "to USDA meal patterns",
    hospital: "That is direct proof",
    field: "cook, pack and deliver",
    boxed: "your two vans can run a route",
    senior: "Older adult nutrition rules are new for you",
    detention: "cooked off site and delivered",
    staffing: "does not use your kitchen",
    construction: "outside your business",
  };
  const kind: Take = {
    name: "Is it your kind of work?",
    rating: d.fit.rating,
    text: d.fit.text,
    bold: d.fitBold ?? fitBold[d.key],
    pins: pins(cp("scope"), pinComputed("Your codes", `The notice uses NAICS ${opp.naics}. Your codes: ${[PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)].join(", ")}.`)),
  };

  const carry =
    share < 0.12
      ? "It is easy to carry, and it adds little."
      : share < 0.6
        ? `A year of it is ${shareWords(share)}. ${cap(V.crew)} can carry it.`
        : share < 0.95
          ? `A year of it is ${shareWords(share)}. Plan the staff first.`
          : `A year of it is ${shareWords(share)}. It would stretch ${V.teamOf}.`;
  const rangeSentence =
    band === "above" || band === "far"
      ? `That is ${ratioText} times your yearly revenue, and above your usual range of ${range}.`
      : band === "small"
        ? `That is below your usual range of ${range}.`
        : `That is inside your usual range of ${range}.`;
  const sizeText = `About ${usdAbout(mid)} over the full term, or ${usdAbout(annual)} a year. ${rangeSentence} ${carry}`;
  const sizeBold = band === "above" || band === "far" ? `${ratioText} times your yearly revenue` : band === "small" ? "below your usual range" : "inside your usual range";
  const size: Take = {
    name: "Does the size fit?",
    rating: band === "far" ? "weak" : band === "above" || share >= 0.95 ? "watch" : band === "fits" ? "strong" : "good",
    text: sizeText,
    bold: sizeBold,
    pins: pins(cp("value"), pinComputed("Size against revenue", `${usd(mid)} over ${f.years} years is ${usd(annual)} a year. Your yearly revenue is ${usd(PERSONA.annualRevenue)}. The total is ${ratioText} times it, and a year of it is ${Math.round(share * 100)}%.`)),
  };

  const perform: Take = wideLine
    ? {
        name: "Can you perform there?",
        rating: "good",
        text: wideLine,
        bold: firstSentence(wideLine),
        pins: pins(cp("place")),
      }
    : {
        name: "Can you perform there?",
        rating: miles <= 25 ? "strong" : miles <= 60 ? "good" : miles <= 110 ? "watch" : "weak",
        text:
          miles <= 5
            ? `${place} is your hometown, ${miles} miles from ${V.base}. ${cap(driveText(miles))} each way.`
            : miles <= 60
              ? `${place} is ${miles} miles from ${V.base}, ${driveText(miles)} each way. ${V.nearRun}`
              : outsideArea
                ? `${place} is ${miles} miles from ${V.base}. That is outside your ${PERSONA.serviceRadiusMiles}-mile service area.`
                : daily
                  ? `${place} is ${miles} miles from ${V.base}, ${driveText(miles)} each way. A daily run is hard to staff, and fuel and driver time add up.`
                  : `${place} is ${miles} miles from ${V.base}, ${driveText(miles)} each way. ${V.farTrip}`,
        bold: miles <= 5 ? "your hometown" : outsideArea ? "outside your 200-mile service area" : `${miles} miles from ${V.base}`,
        pins: pins(cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to ${f.placeText}: about ${miles} miles. Your service radius is ${PERSONA.serviceRadiusMiles} miles.`)),
      };

  const certGap = VOLUME.has(d.key) && UNCERTIFIED > 0;
  const doText =
    d.key === "construction"
      ? "You hold no construction license, and the build is half of this contract."
      : d.key === "staffing"
        ? `You would hire a crew of workers fast for twelve sites. Your ${COOKS}-person kitchen does this work for itself, not for others.`
        : band === "far"
          ? `The work needs a crew far larger than your ${COOKS} staff.`
          : certGap
            ? `Every cook needs a food-handler certificate. ${UNCERTIFIED} of your ${COOKS} cooks do not have one yet.`
            : V.canRun;
  const doBold =
    d.key === "construction"
      ? "no construction license"
      : d.key === "staffing"
        ? "hire a crew of workers fast"
        : band === "far"
          ? `far larger than your ${COOKS} staff`
          : certGap
            ? `${UNCERTIFIED} of your ${COOKS} cooks`
            : undefined;
  const doWork: Take = {
    name: "Can you do the work?",
    rating: d.key === "construction" || band === "far" ? "weak" : d.key === "staffing" || certGap || band === "above" || share >= 0.95 ? "watch" : "good",
    text: doText,
    bold: doBold,
    pins: pins(cp("certs"), cp("needs")),
  };

  const winText =
    subGo && call.prime === "no_go"
      ? `As a prime you would compete with firms far bigger than yours. As a subcontractor you ride the winning prime and share in the work.`
      : f.setAside && f.setAside !== "SBA"
        ? `Only ${SET_ASIDES[f.setAside].firms} can compete. That removes the large ${V.peers}.${ref ? ` Your ${customerShort(ref)} record is your closest reference.` : ""}`
        : f.setAside === "SBA"
          ? `Only small businesses can compete. That removes the large national firms, but other small ${V.peers} will bid.${ref ? ` Your ${customerShort(ref)} record is your closest reference.` : ""}`
          : priceOnly
            ? (V.priceOnlyWin ?? `The lowest price from a qualified bidder wins. Your cost is low if the kitchen is close.`)
            : `No set-aside. Large and small firms can bid, so your record and your price decide it.${ref ? ` Your ${customerShort(ref)} record helps.` : " You have no past job of this kind."}`;
  const winBold =
    subGo && call.prime === "no_go"
      ? "As a subcontractor you ride the winning prime"
      : f.setAside && f.setAside !== "SBA"
        ? `removes the large ${V.peers}`
        : f.setAside === "SBA"
          ? "removes the large national firms"
          : priceOnly
            ? "lowest price from a qualified bidder wins"
            : "your record and your price decide it";
  const win: Take = {
    name: "Can you win it?",
    rating: subGo && call.prime === "no_go" ? "weak" : f.setAside ? "good" : ref ? "watch" : "weak",
    text: winText,
    bold: winBold,
    pins: pins(cp("setAside"), cp("factors") ?? cp("evaluate")),
  };

  const moneyText =
    d.key === "staffing"
      ? "Staffing margins are thin, and the wage determination sets the rates."
      : d.key === "construction"
        ? "The build carries a bond and a long wait before the food service starts to pay."
        : outsideArea
          ? `The long drive adds ${V.travelCost}. Price it before you decide, because it can erase the margin.`
          : far && daily
            ? "The daily drive adds fuel and driver time. Price it before you commit."
            : band === "above" || band === "far" || share >= 0.95
              ? `A contract this large pays slowly at first: ${V.frontCost} before the first invoice is paid.`
              : priceOnly
                ? (V.priceOnlyMoney ?? "A price-only bid is thin. Hold food cost low or walk away.")
                : V.priceAdvice;
  const money: Take = {
    name: "Will you make money?",
    rating: d.key === "staffing" || d.key === "construction" || outsideArea ? "weak" : (far && daily) || band === "above" || band === "far" || share >= 0.95 || priceOnly ? "watch" : "good",
    text: moneyText,
    bold: d.key === "staffing" ? "thin" : outsideArea ? "erase the margin" : undefined,
    pins: pins(cp("price"), cp("wage")),
  };

  const survive: Take = {
    name: "Can you survive winning?",
    rating: bondLimit || band === "far" ? "weak" : band === "above" || share >= 0.95 ? "watch" : "good",
    text: hasBond
      ? bondSays
      : band === "far"
        ? `A win would be ${ratioText} times your yearly revenue. You would need a crew and cash far beyond what you have today.`
        : band === "above" || share >= 0.95
          ? `A win would add about as much work as you do in a year. You would need new staff and a cash cushion for the first 90 days.`
          : `No bond is needed. ${V.fitsWin}`,
    bold: hasBond ? (line ? "performance and payment bonds" : "a bond near the annual price") : band === "far" ? "far beyond what you have today" : band === "above" || share >= 0.95 ? "as much work as you do in a year" : "No bond is needed",
    pins: pins(cp("bond"), cp("term")),
  };

  const intentSentences = sentences(d.intent);
  const intent: Take = {
    name: "Do you understand the buyer's intent?",
    rating: "good",
    text: d.intent,
    bold: intentSentences[1] ?? undefined,
    pins: pins(cp("factors") ?? cp("evaluate"), cp("needs")),
  };

  const isTarget = V.isTarget(f);
  const forward: Take = {
    name: "Does this move you forward?",
    rating: isTarget ? "strong" : miles <= 60 ? "good" : "watch",
    text: isTarget
      ? `${opp.agency} is one of your target buyers. A win builds the record you need.`
      : miles <= 60
        ? `It adds a new buyer and a new reference close to home.`
        : `It builds a record, but not near home. It is not one of your target buyers.`,
    bold: isTarget ? "one of your target buyers" : miles <= 60 ? "a new reference close to home" : "not one of your target buyers",
    pins: pins(pinComputed("Your targets", `Your target buyers: ${PERSONA.targetAgencies.join("; ")}.`)),
  };

  let takes: Take[] = [kind, size, perform, doWork, win, money, survive, intent, forward];
  const told = caveat?.read;
  if (told) takes = takes.map((t) => (t.name === told.name ? { ...t, rating: told.rating, text: told.text, bold: told.bold } : t));

  // Make the ratings agree with the story's call.
  if (verdict === "bid") {
    takes = takes.map((t) => (t.rating === "weak" ? { ...t, rating: "watch" as Rating } : t));
  } else if (verdict === "review") {
    if (!takes.some((t) => ORDER[t.rating] >= ORDER.watch)) {
      takes = takes.map((t) => (t === perform || t === size ? { ...t, rating: "watch" as Rating } : t));
    }
  } else if (!takes.some((t) => t.rating === "weak")) {
    const worst = [...takes].sort((a, b) => ORDER[b.rating] - ORDER[a.rating])[0];
    takes = takes.map((t) => (t === worst ? { ...t, rating: "weak" as Rating } : t));
  }
  const limitingTake =
    (caveat?.decides && told && takes.find((t) => t.name === told.name)) ||
    [...takes].sort((a, b) => ORDER[b.rating] - ORDER[a.rating] || takes.indexOf(a) - takes.indexOf(b))[0];
  const limiting = ORDER[limitingTake.rating] >= ORDER.watch ? limitingTake : null;

  const reads: Read[] = takes.map((t, i) => {
    const text = localize(t.text, f);
    const { status, epistemic } = statusFor(t.rating, verdict === "no-bid" && t === limiting);
    const first = firstSentence(text);
    return {
      id: i + 1,
      name: t.name,
      status,
      epistemic,
      order: i,
      limiting: limiting === t ? true : undefined,
      short: boldIn(first, t.bold && first.includes(t.bold) && t.bold !== first ? t.bold : undefined),
      sentence: boldIn(text, t.bold),
      evidence: t.pins,
      dossier: t.dossier?.map((l) => rt(l)),
    };
  });

  // ── Limits ────────────────────────────────────────────────────────────
  // Each issue has a severity. The strongest ones become the limits, and the
  // strongest of all names what the call turns on.
  const bigJob = band === "above" || band === "far" || share >= 0.95;
  interface Issue {
    key: "bond" | "fit" | "size" | "distance" | "caveat" | "deadline" | "certs" | "registration" | "competition" | "record";
    sev: number;
    w: TypedWarning;
  }
  const issues: Issue[] = [];
  const add = (key: Issue["key"], sev: number, kindOf: WarningKind, label: string, text: string) =>
    issues.push({ key, sev, w: { kind: kindOf, summary: [{ text: label, bold: true }, { text: `: ${text}` }] } });
  if (bondLimit) add("bond", 10, "responsibility", "Bond", `${bondSays.charAt(0).toLowerCase()}${bondSays.slice(1)}`);
  if (fitWeak) add("fit", 9, "proposal-weakness", "Fit", d.fit.text);
  if (band === "far") add("size", 9.5, "winning-hurts", "Size", `the total is ${ratioText} times your yearly revenue and above your usual range of ${range}.`);
  else if (bigJob) add("size", 6.5, "winning-hurts", "Size", band === "above" ? `the total is above your usual range of ${range}. ${cap(V.crew)} would need more staff and more cash.` : `a year of it is ${shareWords(share)}. ${cap(V.crew)} would need more staff and more cash.`);
  if (outsideArea) add("distance", 8, "responsibility", "Distance", `${place} is ${miles} miles from ${V.base}, outside your ${PERSONA.serviceRadiusMiles}-mile service area.`);
  else if (far) add("distance", 7, "winning-hurts", "Distance", `${place} is ${miles} miles from ${V.base}, ${driveText(miles)} each way${daily ? `. A daily round trip is ${miles * 2} miles` : ""}.`);
  if (caveat) add("caveat", caveat.decides ? 11 : 7.5, caveat.kind, caveat.limit.split(": ")[0], caveat.limit.split(": ").slice(1).join(": "));
  if (shortDeadline) add("deadline", 6, "responsibility", "Time", `only ${f.daysLeft} days are left. A short window leaves little room for questions and references.`);
  if (certGap && verdict !== "no-bid") add("certs", 5, "responsibility", "Food-handler certificates", `${UNCERTIFIED} of your ${COOKS} cooks need one before you send the ${offer}.`);
  if (outOfState) add("registration", 4, "responsibility", "Registration", `you need a vendor registration in ${f.place.state} before award.`);
  if (!f.setAside && !priceOnly && verdict !== "bid") add("competition", 3, "proposal-weakness", "Competition", `no set-aside applies, so large firms can bid too.`);
  if (!ref && d.key !== "staffing" && d.key !== "construction") add("record", 3, "proposal-weakness", "Record", `you have no past job of this kind.`);
  issues.sort((x, y) => y.sev - x.sev);
  const warnings: TypedWarning[] = issues.slice(0, verdict === "bid" ? 2 : 3).map((i) => i.w);
  if (warnings.length === 0) {
    warnings.push({ kind: "proposal-weakness", summary: rt(`**Record:** this ${offer} is your first of its kind to ${buyer}. Lead with your closest past job.`) });
  }
  const PHRASE: Record<Issue["key"], string> = {
    bond: "the bond",
    fit: "the fit",
    size: "the size",
    distance: "the distance",
    caveat: "the price risk",
    deadline: "the short deadline",
    certs: "the food-handler certificates",
    registration: "the registration",
    competition: "the competition",
    record: "your record",
  };
  const mainKey: Issue["key"] = issues.find((i) => i.key !== "caveat" || verdict === "bid" || caveat?.decides)?.key ?? "record";
  const mainIssue = mainKey === "caveat" && caveat?.phrase ? caveat.phrase : PHRASE[mainKey];

  // ── Compliance matrix ─────────────────────────────────────────────────
  const rows: ComplianceRow[] = [];
  const row = (
    requirement: string,
    kindOf: string,
    category: ComplianceRow["category"],
    required: string,
    firm: string,
    status: ComplianceRow["status"],
    closable?: boolean,
  ) => {
    const pin = cp(kindOf);
    if (!pin) return;
    rows.push({
      requirement: rt(requirement),
      sourceClause: pin,
      category,
      requiredValue: required,
      firmValue: firm,
      status,
      closableInWindow: status === "missing" ? (closable ?? false) : undefined,
    });
  };
  if (f.setAside && f.setAside !== "SBA") {
    const sa = SET_ASIDES[f.setAside];
    row(f.setAside === "WOSB" ? "Woman-owned small business (WOSB) certification" : `${sa.name} certification`, "setAside", "eligibility", `${sa.abbr} certified`, holds(f.setAside) ? "Certified in SBA's MySBA Certifications" : "Not certified", holds(f.setAside) ? "have" : "missing");
  }
  else if (f.setAside === "SBA") row("Small business under the size standard", "setAside", "eligibility", "a small business", `You are small: ${usd(PERSONA.annualRevenue)} yearly revenue`, "have");
  if (f.isFederal) {
    row(`Registered under NAICS ${opp.naics}`, "naics", "eligibility", `NAICS ${opp.naics}`, opp.naics === PERSONA.primaryNaics ? "Your primary code" : "One of your codes", "have");
    row("SAM registration active", "sam", "eligibility", "active at award", `Active until ${new Date(`${PERSONA.samActiveUntil}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, "have");
  } else {
    row(`Vendor registration with ${buyer}`, "sam", "submission", "on the buyer's vendor list", "Register before award", "confirm");
  }
  if (!fitWeak) {
    row(
      outOfState ? `Food service permit for ${f.place.state}` : "Food service permit (Cumberland County)",
      "permit",
      "license",
      "a current permit",
      outOfState ? `Confirm the rule for ${f.place.state}` : "Current",
      outOfState ? "confirm" : "have",
    );
  }
  if (certGap) row("Food-handler certificate for every cook", "certs", "submission", "a certificate for every cook", `${CERTIFIED} of ${COOKS} cooks certified`, "confirm");
  if (!fitWeak) row("Written food-safety plan (HACCP)", "haccp", "submission", "a written plan", "On file from your Fort Bragg subcontract", "have");
  row("General liability insurance, $1M per occurrence", "insurance", "insurance", "$1M per occurrence", "On file", "have");
  if (WITH_VANS.has(d.key)) row("Commercial vehicle insurance", "insurance", "insurance", "commercial vehicle cover", "Both vans covered", "have");
  if (hasBond && line) row(`Performance and payment bonds (about ${usd(mid)})`, "bond", "bonding", `${usd(mid)} for this job`, `${usd(line.single)} single, ${usd(line.aggregate - line.inUse)} room left`, bondFits ? "have" : "missing", false);
  else if (hasBond) row(`Performance and payment bond (about ${usd(annual)})`, "bond", "bonding", `${usd(annual)} single job`, `${usd(PERSONA.largestBond)} largest bond`, "missing", false);
  if (!f.isSourcesSought && d.key !== "staffing" && d.key !== "construction") {
    row(
      "Past-performance references",
      "content",
      "artifact",
      "references for similar work",
      ref ? `${customerShort(ref)} and ${PP.county === ref ? customerShort(PP.cdg) : customerShort(PP.county)}` : "No past job of this kind",
      ref ? "have" : "confirm",
    );
  }

  // ── Path, confidence, next move ──────────────────────────────────────
  const path: CapturePath = verdict === "no-bid" ? "skip" : subGo ? "sub" : verdict === "bid" ? "prime" : "shape-watch";
  const dots = verdict === "bid" ? (share >= 0.6 || certGap ? 3 : 4) : verdict === "review" ? (!wide && miles > 140 ? 2 : 3) : outsideArea || fitWeak || band === "far" ? 5 : 4;
  const level: "high" | "medium" | "low" = dots >= 4 ? "high" : dots === 3 ? "medium" : "low";

  const thesis: RichLine[] =
    verdict === "bid"
      ? [
          rt(`**${cap(d.service)}** fits ${V.fitsYou}.`),
          rt(f.setAside ? `Only ${f.setAside === "SBA" ? "small" : SET_ASIDES[f.setAside].short} firms can bid, so the field is smaller.` : "Anyone can bid, so your record and your price must carry it."),
          rt(`Send the ${offer} before ${longDate(f.closes)}.`),
        ]
      : verdict === "review"
        ? [
            rt(`The work fits, but **${mainIssue}** needs a decision before you commit.`),
            rt(subGo ? "A subcontract under a prime is the way in this year." : `Look at it with Diana, or find a partner, before you spend time on the ${offer}.`),
          ]
        : [
            rt(`**${cap(mainIssue)}** puts this one out of reach today.`),
            rt(subGo ? "Watch for a prime who needs a subcontractor for this work." : "Spend your time on the matches that fit. Hunter has better ones for you."),
          ];

  const wouldChange: RichLine[] = [];
  if (verdict === "bid") {
    wouldChange.push(
      certGap
        ? rt(`If your last ${UNCERTIFIED} cooks are not certified before the due date, I'd move this to **Needs review**.`)
        : rt(`If an amendment adds sites or hours, I'd check that ${V.crew} **still covers them**.`),
    );
    wouldChange.push(rt(caveat?.change ?? "If the buyer changes the set-aside, I'd run all the checks again and tell you."));
  } else if (verdict === "review") {
    wouldChange.push(
      caveat?.decides && caveat.change
        ? rt(caveat.change)
        : subGo
        ? rt(`If a prime that holds this kind of contract asks you to join its team, I'd move the **subcontract path** to Go.`)
        : far
          ? rt(`If you can place a crew near ${place}, or team with a local firm, I'd move this to **Bid**.`)
          : bigJob
            ? rt(`If you team with a prime, or add a second crew, I'd move this to **Bid**.`)
            : shortDeadline
              ? rt(`If the buyer moves the due date out, I'd look at this **again**.`)
              : rt(`If you settle ${mainIssue}, I'd move this to **Bid**.`),
    );
    wouldChange.push(rt("If an amendment changes the scope or the set-aside, I'd run all the checks again and tell you."));
  } else {
    wouldChange.push(
      caveat?.decides && caveat.change ? rt(caveat.change) : rt(`If the buyer split out a **smaller part** that fits ${V.crew}, I'd look again.`),
    );
    wouldChange.push(rt(subGo ? "If a prime asks you to join its team, I'd check the subcontract path first." : "If you teamed with a firm that fits this scope, I'd run the checks again."));
  }

  const avaTarget = `/ava/${f.id}`;
  const primary =
    verdict === "bid" && !subGo
      ? { label: `Build the ${offer} with Ava`, target: avaTarget }
      : subGo || far || bigJob
        ? { label: subGo ? "Find a prime on Partners" : "Find a partner on Partners", target: "/partners" }
        : { label: "Back to your matches", target: "/opportunities" };
  const rationale: RichLine =
    verdict === "bid" && !subGo
      ? rt(`${f.daysLeft} days is ${f.daysLeft >= 14 ? "enough" : "short but possible"}. Ava drafts the ${offer} from your answers and your record.`)
      : verdict === "review"
        ? rt(`Settle ${mainIssue} first. A partner or a second opinion can answer it quickly.`)
        : rt(`Your time is better spent on matches that fit.`);

  // ── Trail, red team, roadmap ─────────────────────────────────────────
  const trail: TrailGroup[] = [
    {
      title: f.isSourcesSought ? "Reading the notice" : `Reading the ${offer === "bid" ? "invitation for bid" : "solicitation"}`,
      checkCount: 7,
      items: [
        caveat?.trail
          ? { glyph: "blocked" as const, text: rt(caveat.trail), source: srcOf("setAside") }
          : { glyph: f.setAside ? "ok" : "neutral", text: rt(f.setAside ? `Set-aside: **${f.setAsideLabel.replace(/ set-aside$/, "")}**. You are eligible.` : "No set-aside. Any qualified firm can bid."), source: srcOf("setAside") },
        { glyph: "neutral", text: rt(`Scoring: ${priceOnly ? "**lowest price** from a qualified bidder" : d.scoring.map((s) => `${s.factor.toLowerCase()} ${s.weight}`).join(", ")}.`), source: srcOf("factors") !== "Notice" ? srcOf("factors") : srcOf("evaluate") },
        { glyph: bondLimit ? "blocked" : "ok", text: rt(hasBond ? (line ? `Performance and payment bonds of **about ${usd(mid)}**. ${bondFits ? "They fit your bond line." : "They don't fit your bond line."}` : `A **bond near ${usd(annual)}** is required.`) : "No bond is required."), source: hasBond ? srcOf("bond") : srcOf("insurance") },
        { glyph: "neutral", text: rt(`Key dates: due ${longDate(f.closes)}, ${dueTimeOf(f.opp)}.`), source: "Notice" },
      ],
    },
    {
      title: "Checking the competition",
      checkCount: 5,
      items: [
        { glyph: "neutral", text: rt(d.competition), source: "Award records" },
        { glyph: f.setAside ? "ok" : "warn", text: rt(f.setAside ? `The ${SET_ASIDES[f.setAside].short} set-aside keeps the large firms out.` : "No set-aside, so large firms can bid."), source: "Notice" },
      ],
    },
    {
      title: "Checking your business",
      checkCount: 6,
      items: [
        { glyph: share < 0.95 ? "ok" : "warn", text: rt(`The yearly value, about ${usdAbout(annual)}, is ${shareWords(share)}.`), source: "Computed" },
        { glyph: far ? "warn" : "ok", text: rt(wideLine ? firstSentence(wideLine) : `${place} is ${miles} miles from ${V.base}.`), source: "Computed" },
        { glyph: ref ? "ok" : "warn", text: rt(ref ? `Closest past job: ${customerShort(ref)}.` : "No past job of this kind on file."), source: "Your record" },
      ],
    },
  ];

  const redTeam: RedTeamObjection[] =
    verdict === "bid"
      ? [
          {
            challenge: rt(`Is ${V.teamOf} enough for this?`),
            resolution: boldIn(
              share < 0.6
                ? `Yes. The yearly value is ${shareWords(share)}, which ${V.crew} can carry.`
                : `Yes, with planning. The yearly value is ${shareWords(share)}. Hire before you start, not after.`,
              share < 0.6 ? `${V.crew} can carry` : "Hire before you start",
            ),
          },
          {
            challenge: rt(f.setAside ? "Could a large firm undercut you on price?" : "Could a large firm outspend you on this?"),
            resolution: boldIn(
              f.setAside ? "No. The set-aside limits bidders to small firms." : `Yes, it can. Your edge is ${V.edge}.`,
              f.setAside ? "The set-aside limits bidders" : V.edge,
            ),
          },
        ]
      : verdict === "review"
        ? [
            {
              challenge: rt("Is it worth doing despite the doubt?"),
              resolution: boldIn(`Only if you can settle ${mainIssue}. Without that, the cost can erase the margin.`, `settle ${mainIssue}`),
            },
          ]
        : [
            {
              challenge: rt("Am I being too hard on this one?"),
              resolution: boldIn(`No. ${cap(mainIssue)} is a real limit, and it will not change before the due date.`, "a real limit"),
            },
          ];

  const roadmap: RoadmapItem[] | undefined =
    verdict === "no-bid"
      ? [
          caveat?.roadmap
            ? {
                item: rt(caveat.roadmap.item),
                whyItMattered: rt(caveat.roadmap.why),
                whatItTakes: rt(caveat.roadmap.takes),
                cta: { kind: "mentor" },
              }
            : {
                item: rt(
                  far || outsideArea
                    ? `A **partner or crew** near ${place}`
                    : fitWeak
                      ? (V.offTrade?.item ?? `A **kitchen-based** contract that fits`)
                      : V.cashLine,
                ),
                whyItMattered: rt(
                  far || outsideArea
                    ? `${place} is ${miles} miles from ${V.base}. ${V.localPartner}`
                    : fitWeak
                      ? (V.offTrade?.why ?? "This notice does not use your kitchen, so it does not build the record you want.")
                      : `The yearly value is ${shareWords(share)}. A larger contract needs more cash cover and more staff.`,
                ),
                whatItTakes: rt("A conversation with a mentor about who to team with, and a plan for the next year."),
                cta: { kind: "mentor" },
              },
          {
            item: rt("A **federal record** near home"),
            whyItMattered: rt(V.recordWhy),
            whatItTakes: rt(`Bid the matches that fit. ${V.firstMatch} is the first one.`),
          },
          subGo
            ? {
                item: rt("A profile that **primes can find**"),
                whyItMattered: rt("Primes look for small firms to join their teams. A visible profile gets you the call."),
                whatItTakes: rt("A day to set up your visibility profile."),
                cta: { kind: "dfy", service: "SBS Visibility Setup" },
              }
            : {
                item: rt("A **custom roadmap** for the next two quarters"),
                whyItMattered: rt("A plan keeps you from spending time on notices that do not fit."),
                whatItTakes: rt("A planning session with your mentor and a written plan."),
                cta: { kind: "dfy", service: "Custom Roadmap" },
              },
        ]
      : undefined;

  // ── Rail ──────────────────────────────────────────────────────────────
  const openQuestions: OpenQuestion[] = [];
  if (verdict === "review") {
    if (caveat?.question) {
      openQuestions.push({
        id: caveat.question.id,
        question: rt(caveat.question.question),
        payoff: rt(caveat.question.payoff),
        verdictSwing: 0.5,
        input: { kind: "yesno" },
        status: "open",
      });
    } else if (subGo) {
      openQuestions.push({
        id: "has-prime",
        question: rt("Do you know a **prime** that bids contracts like this one?"),
        payoff: rt("A yes turns the **subcontract path** from an idea into a plan."),
        verdictSwing: 0.5,
        input: { kind: "yesno" },
        status: "open",
      });
    } else if (far) {
      openQuestions.push({
        id: "local-crew",
        question: rt(V.localQuestion.question(place)),
        payoff: rt(V.localQuestion.payoff),
        verdictSwing: 0.6,
        input: { kind: "yesno" },
        status: "open",
      });
    } else if (bigJob) {
      openQuestions.push({
        id: "second-crew",
        question: rt("Could you add a **second crew** or team with a larger firm?"),
        payoff: rt("A yes shows whether the **size** is a real limit."),
        verdictSwing: 0.6,
        input: { kind: "yesno" },
        status: "open",
      });
    } else {
      openQuestions.push({
        id: "enough-time",
        question: rt(`Can you finish a ${offer} in **${f.daysLeft} days**?`),
        payoff: rt("A yes shows whether the **short window** is a real limit."),
        verdictSwing: 0.5,
        input: { kind: "yesno" },
        status: "open",
      });
    }
  }

  const chipsByVerdict: Record<string, string[]> = {
    bid: ["Can I win it?", "Do I have enough time?", "What should my response say?"],
    review: ["Where am I weak?", "Can I fix this in time?", "Should I team up?"],
    "no-bid": ["Why not bid?", "What would put me in range?", "What should I bid instead?"],
  };
  const slots = ["doubt", "improve", "act"] as const;
  const chips: SuggestedChip[] = chipsByVerdict[verdict].map((label, i) => ({ slot: slots[i], label, kind: "ask" as const }));
  if (openQuestions.length > 0) {
    chips[1] = { slot: "improve", label: `Answer the ${caveat?.question?.chip ?? (openQuestions[0].id === "has-prime" ? "prime" : openQuestions[0].id === "local-crew" ? "crew" : openQuestions[0].id === "second-crew" ? "size" : "time")} question`, kind: "elicit", target: openQuestions[0].id };
  }

  const when = analyzedAt(f);
  const docWord = priceOnly ? "invitation for bid" : f.isSourcesSought ? "notice" : offer === "quote" ? "request for quote" : "request for proposal";
  const briefing: RichLine[] = [
    rt(`I read the ${docWord} and the work statement.`),
    verdict === "bid"
      ? rt(`It fits ${V.fitsYou}. **${cap(mainIssue)}** is the one thing to watch.`)
      : verdict === "review"
        ? rt(`The work fits, but **${mainIssue}** needs a decision. I would not commit yet.`)
        : rt(`**${cap(mainIssue)}** stops this one. I would not bid it.`),
    rt(openQuestions.length > 0 ? "I have a question for you, or pick one below." : "Ask me anything, or pick a question below."),
  ];

  return {
    id: `grant-${f.id}`,
    opportunityId: f.id,
    firmProfileVersion: "demo",
    amendmentVersion: "0",
    postNoBidRoadmap: roadmap,
    sectionCoverage: coverageFor(sol, {}),
    meta: {
      stage: "complete",
      analyzedAt: when.iso,
      checksRun: 12 + (f.id.length % 7),
      sourcesConsulted: 4 + (f.id.length % 3),
      freshnessLine: when.line,
      noticeType: "solicitation",
    },
    gateInputs: gateInputsFor(f),
    realDeadlineInputs: {
      responseDue: f.closesAtISO,
      bondingLeadDays: hasBond && !subGo ? 14 : 0,
      ppqTurnaroundDays: f.isFederal ? 5 : 3,
      subQuoteDays: subGo ? 7 : 0,
      writingDays: offer === "proposal" ? 5 : offer === "quote" ? 3 : 2,
      passedEvents: [],
    },
    complianceMatrix: rows,
    verdict: {
      value: verdict,
      path,
      gist: boldIn(call.oneLine, firstSentence(call.oneLine)),
      warnings,
      headline: thesis,
      wouldChange,
      competitiveRisk: rt(
        f.setAside && f.setAside !== "SBA"
          ? `the **other ${SET_ASIDES[f.setAside].short} ${V.peers}** near you who list your code`
          : f.setAside === "SBA"
            ? `**other small ${V.peers}** with a federal record`
            : `**larger firms** with more ${V.bigWork}`,
      ),
      confidence: {
        level,
        dots,
        openQuestions: openQuestions.length,
        remedy:
          openQuestions.length > 0
            ? rt(`Answer my question about ${mainIssue} and I can call this properly.`)
            : rt(verdict === "no-bid" ? "Nothing you tell me changes this call." : "Send the first draft to Diana and I can call this with more confidence."),
      },
    },
    reads,
    action: {
      path,
      primary,
      secondaries:
        verdict === "no-bid"
          ? [{ label: "Add the gap to my Roadmap", target: "/roadmap" }]
          : [{ label: "Send to Diana for a second opinion", target: "mentor", price: 97 }],
      rationale,
    },
    trail,
    findings: [],
    redTeam,
    citations: pins(cp("setAside"), cp("factors") ?? cp("evaluate"), cp("scope")),
    rail: {
      briefing,
      openQuestions,
      suggestedChips: chips,
    },
  };
}
