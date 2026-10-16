// Grant verdict + solicitation detail authored on top of the Opportunity mock.
// Three opportunities have bespoke content; everything else is synthesized
// deterministically from the existing Opportunity fields.

import type { Opportunity } from "./opportunities";
import { OPPORTUNITIES } from "./opportunities";

export type VerdictCall =
  | "Bid"
  | "Lean Bid"
  | "Lean Pass"
  | "Pass"
  | "Worth reaching out"
  | "Skip"
  | "Review"
  | "No Bid";

export type WinTier = "Open" | "Competitive" | "Long shot";

export type FitMarker = "ok" | "warn" | "bad";

export interface FitRow {
  marker: FitMarker;
  dimension: string;
  line: string;
  citation?: { label: string; anchor: SectionId };
}

export interface GrantSuggestion {
  id: string;
  label: string;
  response: string; // citations as [§L.3] / [p.4] tokens render inline
}

export interface GrantVerdict {
  call: VerdictCall;
  rationale: string;
  winTier: WinTier;
  winTierReason: string;
  fitMatrix: FitRow[];
  nextStep: string;
  uncertainty?: string;
  seedMessage: string;
  suggestions: GrantSuggestion[];
  authored: boolean;
}

export type SectionId =
  | "needs"
  | "eligibility"
  | "submission"
  | "evaluation"
  | "dates"
  | "risks"
  | "checklist"
  | "amendments"
  | "edge";

export interface SolicitationSection {
  id: SectionId;
  title: string;
  body: string;
}

export interface SolicitationDetail {
  rewrittenTitle: string;
  officialTitle: string;
  quickSummary: string;
  keyInfo: { label: string; value: string }[];
  timeline: { postedAt: string; dueAt: string };
  sections: SolicitationSection[];
  referenceDocs: { name: string; size?: string }[];
  referenceLinks: { label: string; href: string }[];
}

function fmtUSD(low: number, high: number): string {
  const f = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` :
    n >= 1_000 ? `$${Math.round(n / 1_000)}K` : `$${n}`;
  if (low === 0 && high === 0) return "Not disclosed";
  if (low === high) return f(low);
  return `${f(low)} – ${f(high)}`;
}

function rewriteTitle(t: string): string {
  // Title-case the simplest words; preserve proper nouns roughly.
  return t.replace(/\b([A-Z]{3,})\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
}

function daysFromNow(iso: string): number {
  const now = new Date("2026-05-07T09:00:00-05:00").getTime();
  return Math.ceil((new Date(iso).getTime() - now) / 86400000);
}

// ───── Synthesizers (default per-opportunity content) ─────

function synthesizeSolicitation(opp: Opportunity): SolicitationDetail {
  const value = fmtUSD(opp.valueLow, opp.valueHigh);
  const days = daysFromNow(opp.closesAt);
  // Guard against opportunities with no posted date AND no/invalid close date:
  // `new Date('').getTime()` is NaN, so `.toISOString()` would throw
  // `RangeError: Invalid time value` and crash the whole detail render.
  const closesTime = opp.closesAt ? new Date(opp.closesAt).getTime() : NaN;
  const postedIso =
    opp.postedAt ??
    (Number.isFinite(closesTime)
      ? new Date(closesTime - 30 * 86400000).toISOString()
      : new Date().toISOString());

  // Dateless opportunities: show clean copy instead of "NaN days" / "Invalid Date".
  const dueLabel = Number.isFinite(closesTime)
    ? new Date(closesTime).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "date TBD";
  const duePhrase = Number.isFinite(days)
    ? `Responses are due in ${days} days.`
    : "A response deadline has not been posted yet.";

  return {
    rewrittenTitle: rewriteTitle(opp.title),
    officialTitle: opp.title.toUpperCase(),
    quickSummary:
      `${opp.agency}${opp.subAgency ? ` (${opp.subAgency})` : ""} is soliciting bids for ${opp.workType.toLowerCase()} work in ${opp.location}. ` +
      `Estimated value is ${value}. ${duePhrase}`,
    keyInfo: [
      { label: "Work type", value: opp.workType },
      { label: "Location", value: opp.location },
      { label: "Value", value: value },
      { label: "Agency", value: opp.agency + (opp.subAgency ? ` — ${opp.subAgency}` : "") },
      { label: "Set-aside", value: opp.setAside ?? "Full and open" },
      { label: "Notice ID", value: opp.noticeId },
    ],
    timeline: { postedAt: postedIso, dueAt: opp.closesAt },
    sections: [
      { id: "needs", title: "What the buyer needs",
        body: `${opp.agency} requires ${opp.workType.toLowerCase()} services at ${opp.location}. Scope includes site preparation, execution per plans and specifications, and standard close-out documentation. Performance period typically runs 120–180 days from notice to proceed.` },
      { id: "eligibility", title: "Eligibility & compliance",
        body: opp.setAside
          ? `This solicitation is set aside under ${opp.setAside}. Bidders must hold the relevant SAM.gov registration and certification at time of award. Standard FAR clauses apply.`
          : `Open competition. Bidders must be active in SAM.gov with cage code and DUNS/UEI. Standard FAR clauses 52.219 (small business), 52.222 (labor standards), and 52.225 (Buy American) apply.` },
      { id: "submission", title: "Submission instructions",
        body: `Proposals must be submitted electronically via SAM.gov no later than the response deadline. Late submissions will not be considered. Required volumes: Technical, Past Performance, Price.` },
      { id: "evaluation", title: "Evaluation criteria",
        body: `Award will be made on a best-value tradeoff basis. Factors in descending order of importance: (1) Technical Capability, (2) Past Performance, (3) Price. The Government reserves the right to award without discussions.` },
      { id: "dates", title: "Key dates",
        body: `Posted: ${new Date(postedIso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Questions due: 10 days before close. Proposals due: ${dueLabel}.` },
      { id: "risks", title: "Risks & gotchas",
        body: `Standard performance bond required at award (typically 100% of contract value). Verify bonding capacity early. Site visit attendance is strongly recommended where offered. ${opp.amendedAt ? "Note: this solicitation has been amended — review the latest version carefully." : ""}` },
      { id: "checklist", title: "Quick checklist",
        body: `• Active SAM.gov registration\n• Bonding letter to required limit\n• Three relevant past-performance references\n• Technical narrative (page limit per Section L)\n• Pricing schedule per Section B` },
      { id: "amendments", title: "Amendment summary",
        body: opp.amendedAt ? `Most recent amendment posted ${new Date(opp.amendedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. Acknowledge all amendments in your offer or it will be deemed non-responsive.` : "No amendments posted as of today." },
      { id: "edge", title: "Edge cases",
        body: "If the apparent low bidder is non-responsive on bonding or past performance, the CO may go to the next lowest responsive bidder. Pricing is firm-fixed-price; no allowance for material escalation unless specified in Section H." },
    ],
    referenceDocs: [
      { name: "Solicitation.pdf", size: "1.2 MB" },
      { name: "Drawings.zip", size: "8.7 MB" },
      { name: "Wage_Determination.pdf", size: "212 KB" },
    ],
    referenceLinks: [],
  };
}

// ───── Verdict + matrix logic (deterministic, per-opportunity) ─────
//
// Anchored to Marcus Williams / Williams Construction:
//   - Largest past contract ~$890K; comfort ceiling ~$1.5M
//   - SDVOSB-eligible (SAM business type confirmed); no 8(a)
//   - Primary NAICS 238160 (roofing), adjacent 238170 (siding), 236220, 238290
//   - Home base Fayetteville, NC. NC = local; VA/SC/GA = drivable but priced
//
// All synthesized verdicts are deterministic functions of the opportunity's
// own fields — never random, never generic.

const ROOFING_LANE = /\broof|tpo|bitumen|shingle|metal roof|envelope|weatherproof|siding\b/i;
const ADJACENT_LANE = /\bfacility|maintenance|building|exterior|construction|renovation\b/i;
const NC_LOCAL = /\bNC\b|North Carolina|Fayetteville|Fort Bragg|Pope|Lejeune|Cherry Point|Goldsboro|Durham|Raleigh|Wilmington|Salisbury|Hope Mills|Lumberton|Chapel Hill|Greensboro|Jacksonville|Charlotte/i;
const NEARBY_STATE = /\b(SC|VA|GA)\b|South Carolina|Virginia|Georgia|Charleston|Augusta|Virginia Beach/i;

function pickVerdict(opp: Opportunity): { call: VerdictCall; rationale: string } {
  const value = fmtUSD(opp.valueLow, opp.valueHigh);
  const setAside = opp.setAside ?? "open competition";

  if (opp.mode === "partner") {
    if (opp.matchTier === "stretch" || opp.matchTier === "longshot") {
      return {
        call: "Skip",
        rationale: `${opp.partnerName ?? "This prime"} is a poor fit on scope or size right now — pass and focus on the partners in your strongest lane.`,
      };
    }
    return {
      call: "Worth reaching out",
      rationale: `${opp.partnerName ?? "The prime"} ${opp.partnerContext ?? "won recent work in your space"} — your ${opp.workType.toLowerCase()} past performance and NC base line up with what they'll be staffing.`,
    };
  }

  if (opp.eligibility === "needs_cert" || opp.eligibility === "closed_to_new") {
    return { call: "Pass", rationale: "You're not eligible to bid as configured today — pass." };
  }

  const ceiling = opp.valueHigh;
  const overSized = ceiling > 2_000_000;
  const wayOverSized = ceiling > 5_000_000;

  if (opp.matchTier === "strong" && !overSized) {
    return {
      call: "Bid",
      rationale: `Strong capability and ${setAside} fit at ${value} — sized to your bonding line and squarely in your lane. This is a bid.`,
    };
  }
  if ((opp.matchTier === "strong" || opp.matchTier === "good") && overSized) {
    return {
      call: "Lean Bid",
      rationale: `Scope is in your lane but ${value} is ${wayOverSized ? "well beyond" : "above"} your comfort ceiling — only bid if you can line up a teaming partner for capacity.`,
    };
  }
  if (opp.matchTier === "good") {
    return {
      call: "Lean Bid",
      rationale: `Solid match at ${value} with one realistic complication — bid if your estimator has bandwidth this cycle.`,
    };
  }
  if (opp.matchTier === "stretch") {
    return {
      call: "Lean Pass",
      rationale: `Possible if you team, but the gap-to-bid as prime on ${value} ${opp.workType.toLowerCase()} is real.`,
    };
  }
  return {
    call: "Pass",
    rationale: `Field skews to larger or incumbent primes at ${value} — too many things would have to break your way.`,
  };
}

function pickWinTier(opp: Opportunity): { tier: WinTier; reason: string } {
  if (opp.eligibility === "closed_to_new") return { tier: "Long shot", reason: "On-ramp is closed to new entrants right now." };
  if (opp.eligibility === "needs_cert") return { tier: "Long shot", reason: "Reserved for a certification you don't currently hold." };
  if (opp.mode === "partner") {
    return opp.matchTier === "strong" || opp.matchTier === "good"
      ? { tier: "Competitive", reason: `${opp.partnerName ?? "The prime"}'s small-business sub spend will land with 2–4 NC firms — early outreach wins the seat.` }
      : { tier: "Long shot", reason: "Fit gap means you're unlikely to make their short list." };
  }
  const overSized = opp.valueHigh > 2_000_000;
  if (opp.setAside && opp.matchTier === "strong" && !overSized) {
    return { tier: "Open", reason: `${opp.setAside} set-aside in your home region typically pulls 4–6 NC-local firms — favorable for you.` };
  }
  if (opp.setAside) {
    return { tier: "Competitive", reason: `${opp.setAside} set-aside narrows the field, but expect 5–8 qualified bidders at this size.` };
  }
  if (opp.matchTier === "strong") return { tier: "Competitive", reason: "Open competition at this size — expect 5–9 bidders, pricing discipline decides it." };
  if (opp.matchTier === "good") return { tier: "Competitive", reason: "Expect 5–9 bidders. Pricing discipline matters more than narrative." };
  return { tier: "Long shot", reason: "Field skews to larger or incumbent primes at this dollar tier." };
}

function synthesizeFitMatrix(opp: Opportunity): FitRow[] {
  const rows: FitRow[] = [];
  const value = fmtUSD(opp.valueLow, opp.valueHigh);

  // 1. Capability — based on workType keywords
  const inLane = ROOFING_LANE.test(opp.workType);
  const adjacent = !inLane && ADJACENT_LANE.test(opp.workType);
  rows.push({
    marker: inLane ? "ok" : adjacent ? "warn" : "bad",
    dimension: "Capability fit",
    line: inLane
      ? `${opp.workType} is core to your portfolio — past performance maps cleanly.`
      : adjacent
      ? `${opp.workType} is adjacent to your roofing lane — expect a small learning premium.`
      : `${opp.workType} is outside your primary trades. Don't lead with this one.`,
    citation: { label: "§C.1", anchor: "needs" },
  });

  // 2. Eligibility
  const sa = opp.setAside ?? "";
  const eligOk = opp.eligibility === "qualify" || opp.eligibility === null;
  const isEightA = /8\(a\)/.test(sa);
  rows.push({
    marker: !eligOk ? "bad" : isEightA ? "warn" : "ok",
    dimension: "Certification & eligibility",
    line: isEightA
      ? "8(a) set-aside — you're adjacent but not certified today. Pass unless you team with an 8(a) prime."
      : !eligOk
      ? `Reserved for ${sa || "a certification"} firms — verify your status before investing time.`
      : opp.setAside
      ? `You qualify for the ${opp.setAside} set-aside.`
      : "Open competition — no certification gate.",
    citation: { label: "§L.1", anchor: "eligibility" },
  });

  // 3. Location
  const local = NC_LOCAL.test(opp.location);
  const nearby = !local && NEARBY_STATE.test(opp.location);
  const smallDollarFar = !local && opp.valueHigh < 500_000;
  rows.push({
    marker: local ? "ok" : smallDollarFar ? "warn" : nearby ? "warn" : "warn",
    dimension: "Location & performance area",
    line: local
      ? `${opp.location} is well within your NC crew's reach from Fayetteville.`
      : smallDollarFar
      ? `${opp.location} adds travel cost the ${value} ceiling won't fully absorb — only bid if you can stack it with a nearby job.`
      : `${opp.location} adds mobilization cost — price it in.`,
  });

  // 4. Capacity vs Marcus's ~$890K largest / ~$1.5M comfort
  const ceiling = opp.valueHigh;
  if (ceiling > 5_000_000) {
    rows.push({ marker: "bad", dimension: "Capacity", line: `${value} ceiling is well beyond your usual range. Realistic only as a teaming partner.`, citation: { label: "§B.2", anchor: "needs" } });
  } else if (ceiling > 1_500_000) {
    rows.push({ marker: "warn", dimension: "Capacity", line: `${value} is above your past ceiling. Bondable, but confirm your surety can write to the high end before committing.`, citation: { label: "§B.2", anchor: "needs" } });
  } else {
    rows.push({ marker: "ok", dimension: "Capacity", line: `${value} fits comfortably within your bonding line and crew availability.`, citation: { label: "§B.2", anchor: "needs" } });
  }

  // 5. Competition / sub credibility
  if (opp.mode === "partner") {
    rows.push({
      marker: "ok",
      dimension: "Sub credibility",
      line: `Your scope and NC geography match what ${opp.partnerName ?? "the prime"} will need to fill.`,
      citation: { label: "§L.4", anchor: "evaluation" },
    });
  } else {
    const newField = opp.setAside && opp.newToBidders;
    rows.push({
      marker: newField ? "ok" : opp.setAside ? "ok" : opp.matchTier === "stretch" || opp.matchTier === "longshot" ? "warn" : "warn",
      dimension: "Competition",
      line: newField
        ? `${opp.setAside} set-aside and no incumbent — the field is open and a firm your size has a real path.`
        : opp.setAside
        ? `${opp.setAside} set-aside narrows the bidder pool — favorable for you.`
        : opp.matchTier === "stretch" || opp.matchTier === "longshot"
        ? "Incumbents and larger primes dominate this tier — pricing has to be sharp to break in."
        : "Open competition pulls a wider field — pricing discipline carries you here.",
      citation: { label: "§M.1", anchor: "evaluation" },
    });
  }
  return rows;
}

function synthesizeNextStep(opp: Opportunity, call: VerdictCall): string {
  if (opp.mode === "partner") {
    if (call === "Skip") return "Skip and stay focused on the partner leads in your strongest lane.";
    return `Draft a one-page capability statement and email ${opp.partnerName ?? "the prime's"} small-business liaison this week. Reference the recent award and propose a 15-minute call.`;
  }
  if (call === "Bid") return "Confirm bonding, calendar the site walk, and start the technical narrative. Move now — the field will set quickly.";
  if (call === "Lean Bid") return "If you want to pursue this, the move is to team with a larger prime for capacity — I can help you think through who. Otherwise save it and focus on right-sized work first.";
  if (call === "Lean Pass") return "Save and revisit only if your pipeline thins out. Better-fit work is in your feed today.";
  return "Skip and stay focused on the strong matches in your feed.";
}

function synthesizeSeed(opp: Opportunity, call: VerdictCall, rationale: string): string {
  const title = opp.title.length > 60 ? opp.title.slice(0, 57) + "…" : opp.title;
  if (opp.mode === "partner") {
    return `I looked at the recent award behind "${title}". Short version: ${call}. ${rationale} Ask me anything, or I'll walk you through my reasoning.`;
  }
  return `I dug into "${title}". Short version: it's a ${call}. ${rationale} Ask me anything, or I'll walk you through my reasoning.`;
}

function synthesizeSuggestions(opp: Opportunity, call: VerdictCall, fitMatrix: FitRow[]): GrantSuggestion[] {
  if (opp.mode === "partner") {
    return [
      { id: "why-outreach", label: `Why "${call}"?`,
        response: `${opp.partnerName ?? "The prime"} just took on a contract with small-business sub goals to hit [§L.2]. Your scope (${opp.workType.toLowerCase()}) and location (${opp.location}) line up with what they'll need to fill. The window for warm outreach is short — typically 30–60 days after award.` },
      { id: "what-to-send", label: "What should I send them?",
        response: `A one-page capability statement: SDVOSB-eligible status, three past-performance projects in this scope [§L.4], bonding capacity, and one sentence on why you're a fit for THIS contract. Don't attach a generic deck.` },
      { id: "who-to-contact", label: "Who do I contact?",
        response: `Look for "small business liaison officer" or "subcontracting program manager" on ${opp.partnerName ?? "the prime"}'s website. Failing that, the project manager named in the award notice [§A.1] is a good second choice.` },
      { id: "follow-up", label: "How do I follow up?",
        response: `One email, one voicemail, one week apart. If no response after two weeks, move on — don't burn the relationship by pushing harder.` },
    ];
  }
  // Read back the fit matrix for "Why this verdict?" — generated tier
  const matrixSummary = fitMatrix.map((r) => `${r.marker === "ok" ? "✓" : r.marker === "warn" ? "⚠" : "✗"} ${r.dimension}: ${r.line}`).join("\n");
  return [
    { id: "why-this-call", label: `Why "${call}"?`,
      response: `My read is built from the fit matrix above:\n\n${matrixSummary}\n\nShortest answer: ${call === "Bid" ? "scope, region, and size all line up and the agency awards at this tier regularly." : call === "Lean Bid" ? "scope fits but one dimension (usually capacity or competition) is a stretch." : call === "Lean Pass" ? "the gap between you and the typical winner is real today." : "you're not the natural buyer here."}` },
    { id: "make-strong", label: "What would make this a strong bid?",
      response: `Three levers move the needle: (1) bonding letter at or above contract ceiling [§L.3], (2) two-to-three past-performance projects within ±25% of this dollar size and scope [§L.4], (3) a named PM with relevant experience listed in your technical volume.` },
    { id: "bonding", label: "Walk me through the bonding requirement",
      response: `Standard FAR 52.228-15 applies — performance and payment bonds at 100% of contract value [§I.5]. Your surety needs to write at the ceiling, not just the base. On a ${fmtUSD(opp.valueLow, opp.valueHigh)} ceiling, ${opp.valueHigh <= 1_500_000 ? "you're well inside your line." : "confirm your line stretches to the high end before bid day, or arrange a co-surety."}` },
    { id: "competition", label: "Who's likely bidding against me?",
      response: opp.setAside
        ? `${opp.setAside} pools in NC typically have 8–15 active firms. Of those, 3–5 actively pursue ${opp.workType.toLowerCase()} work at this size. Pricing tends to cluster within 12%.`
        : `Open competition at this size usually pulls 5–9 bidders. Mix is regional NC/VA mid-size primes plus one or two SE firms going on the edges of their footprint.` },
  ];
}

export function synthesizeGrant(opp: Opportunity): GrantVerdict {
  const { call, rationale } = pickVerdict(opp);
  const { tier, reason } = pickWinTier(opp);
  const fitMatrix = synthesizeFitMatrix(opp);
  return {
    call,
    rationale,
    winTier: tier,
    winTierReason: reason,
    fitMatrix,
    nextStep: synthesizeNextStep(opp, call),
    // uncertainty omitted for generated tier — it's an authored-only signal
    seedMessage: synthesizeSeed(opp, call, rationale),
    suggestions: synthesizeSuggestions(opp, call, fitMatrix),
    authored: false,
  };
}

// ───── Bespoke overrides (authored: true) ─────

const BESPOKE: Record<string, () => GrantVerdict> = {
  // 1. PRIME — Lean Bid: Fort Bragg barracks re-roof, $480K SDVOSB
  "W912EE-26-R-0066": () => ({
    call: "Lean Bid",
    rationale: "Right scope, right size, right place — SDVOSB set-aside narrows the field to firms exactly your size. The only watch-out is the 90-day schedule on 6 occupied barracks.",
    winTier: "Open",
    winTierReason: "SDVOSB set-aside in the Fort Bragg DPW pool typically pulls 4–6 bidders at this dollar tier. Field is favorable for a NC-local firm.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Modified bitumen re-roofing on multiple buildings is your exact scope — three of your four past projects are this work.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "SDVOSB set-aside — you qualify (SAM business type confirmed; certification doc still pending but not required at bid).", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "Fort Bragg is 20 minutes from your shop. Crews can mobilize same-day.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Capacity", line: "$480K is right in your sweet spot — well within your bonding line and crew availability.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "warn", dimension: "Schedule", line: "90-day window across 6 occupied barracks is tight. Pricing must include occupied-building staging and weather contingency.", citation: { label: "§F.4", anchor: "risks" } },
    ],
    nextStep: "Confirm bonding letter, calendar the site walk (offered next week at Bldg 4-2701), and start the technical narrative this week. Lead past-performance with your Cumberland County Detention re-roof.",
    seedMessage: "I dug into the Fort Bragg barracks re-roof contract. Short version: it's a Lean Bid — exactly your scope and size, SDVOSB set-aside, but the 90-day schedule on 6 occupied barracks is the one flag. Ask me anything, or I'll walk you through my reasoning.",
    suggestions: [
      { id: "why-lean", label: 'Why "Lean Bid" instead of full Bid?',
        response: "Four of five fit dimensions are green. The flag is the schedule [§F.4]: 90 days across 6 occupied barracks means staged demo, weather contingency, and resident coordination — all real cost. If your estimator can price that risk cleanly, this flips to a Bid." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) Attend the site walk — Fort Bragg DPW scoring favors firms whose PM showed up. (2) Lead past performance with your county detention re-roof [§L.4] — same building type. (3) Price the weather contingency explicitly; the CO has rejected low bids before for missing it." },
      { id: "bonding", label: "Walk me through the bonding requirement",
        response: "Standard FAR 52.228-15 — performance and payment bonds at 100% of contract value [§I.5]. On $480K that's well inside any small surety line. Pull the bonding letter early; DPW wants it with offer submission." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "Fort Bragg SDVOSB roofing pool — typically 4–6 firms at this size. I can name 3 that bid most DPW re-roofs (all NC-local). Pricing usually clusters within 10% of the median." },
    ],
    authored: true,
  }),

  // 2. PRIME — Bid: VA Fayetteville roof replacement, $720K TSB
  "VA247-26-R-0112": () => ({
    call: "Bid",
    rationale: "Right scope, right size, right region. Total Small Business set-aside narrows the field. This is exactly the work you should be chasing.",
    winTier: "Open",
    winTierReason: "TSB set-aside plus the modest dollar size keeps the field to 4–6 local NC firms — favorable for you.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Modified bitumen re-roofing on a single building is core to your portfolio — your last three jobs were this scope.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "Total Small Business set-aside — you qualify (well inside the SBA size standard).", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "VA Fayetteville is 12 minutes from your shop. You drive past it weekly.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Capacity", line: "$620–840K is slightly above your largest past job but well within reach and bondable.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "ok", dimension: "Competition", line: "TSB set-aside in NCO 6 typically pulls 4–6 NC-local bidders for roofing at this size. Field is favorable.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "Confirm bonding, calendar the site walk (offered next week), and start the technical narrative. Move now — local roofing competitors will move fast on this.",
    seedMessage: "I dug into the VA Fayetteville Bldg 4 roof replacement. Short version: it's a Bid — right size, set-aside narrows the field, and this is your exact scope. Ask me anything, or I'll walk you through my reasoning.",
    suggestions: [
      { id: "why-bid", label: 'Why "Bid"?',
        response: "All five fit dimensions are green. The shortest read: VA NCO 6 awards roofing at this size to small-business primes like you almost every year. Your past four commercial roofs at $400–890K give you the past-performance citation you need [§L.4]." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) Attend the site walk — NCO 6 scoring favors firms whose PM showed up. (2) Lead past performance with your largest commercial re-roof and your Cumberland County school work [§L.4]. (3) Sharp pricing; the field will be tight." },
      { id: "bonding", label: "Walk me through the bonding requirement",
        response: "Standard FAR 52.228-15 — performance and payment bonds at 100% of contract value [§I.5]. On $720K your surety line covers this comfortably. VA wants the bonding letter with offer submission, not at award." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "Fayetteville-area small-business roofing primes — typically 4–6 firms compete at this dollar tier. I can name 3 that bid most VA roofing in NCO 6. Pricing usually clusters within 10% of the median." },
    ],
    authored: true,
  }),

  // 3. PARTNER — Worth reaching out: Sterling Roofing Camp Lejeune envelope
  "NEW-partner-1": () => ({
    call: "Worth reaching out",
    rationale: "Sterling Roofing won this $3.2M Camp Lejeune envelope job last month — they're a large prime with small-business sub goals to hit, and your scope and region line up exactly.",
    winTier: "Competitive",
    winTierReason: "Sterling's small-business spend on this job will land with 2–4 NC roofing subs — getting in the door early matters.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Your roofing and envelope past performance matches the sub package on the Lejeune barracks renovation almost exactly.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "Sterling's small-business sub goals favor SDVOSB and SBA-certified firms like you.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "Camp Lejeune is 2.5h from Fayetteville — Sterling will want NC-based subs to limit their own travel costs.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Sub credibility", line: "Your four NC commercial re-roofing references give Sterling exactly the past performance they're looking for.", citation: { label: "§L.4", anchor: "evaluation" } },
      { marker: "warn", dimension: "Timing", line: "Window for warm outreach is ~30–60 days after award. You're at week 4 — move this week, not next month.", citation: { label: "§A.1", anchor: "dates" } },
    ],
    nextStep: "Draft a one-page capability statement this week and email Sterling Roofing's small-business liaison officer. Reference the $3.2M Lejeune award, your four NC commercial re-roofs, and ask for a 15-minute call.",
    seedMessage: "I looked at the Sterling Roofing Lejeune award. Short version: Worth reaching out — they have small-business sub goals to hit and your NC roofing past performance is a clean fit. Ask me anything, or I'll walk you through my reasoning.",
    suggestions: [
      { id: "why-reach", label: "Why reach out now?",
        response: "Three reasons: (1) Sterling's small-business spend commitment on this job is binding [§L.2] and they'll be staffing subs in the next 60 days. (2) Your scope (roofing & envelope) and geography (NC) match what they need. (3) Warm outreach in the post-award window has a much higher response rate than cold outreach later." },
      { id: "what-to-send", label: "What should I send them?",
        response: "A one-page capability statement: SDVOSB-eligible status, four past-performance projects on commercial re-roofing in NC, bonding capacity, and one sentence on why you're a fit for THIS Lejeune scope specifically [§L.4]. Don't attach your generic deck — make it match." },
      { id: "who-to-contact", label: "Who do I contact?",
        response: "Sterling's Small Business Liaison Officer (SBLO) is your first call. Failing that, the project manager named in the award notice [§A.1] is a good second choice — usually findable on SAM.gov." },
      { id: "follow-up", label: "How do I follow up?",
        response: "One email, one voicemail, one week apart. If no response after two weeks, move on — Hensel Phelps, Clark, Whiting-Turner, and Mortenson are in your feed for the same reason. Don't burn the relationship by pushing harder." },
    ],
    authored: true,
  }),

  // 4. PRIME — Lean Bid (capacity): Seymour Johnson 3-hangar phased re-roof, ~$2.2M TSB
  // The classic "3x your largest, team or pass" case.
  "FA4800-26-R-0091": () => ({
    call: "Lean Bid",
    rationale: "Your roofing capability is a strong match, but at ~$2.2M this is about 2.5x your largest past job — I'd bid only if you can line up a teaming partner for capacity and bonding.",
    winTier: "Competitive",
    winTierReason: "TSB set-aside narrows the field in your favor, but expect 3–5 experienced bidders — most will be teams.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Multi-hangar re-roofing maps directly to your metal-roof and TPO past performance. You already work at Seymour Johnson on the smaller hangar.", citation: { label: "§C.2", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "Total Small Business set-aside — your SAM size standing qualifies you cleanly.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "Goldsboro is 70 miles from Fayetteville — well within your crew range and you already mobilize there.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "warn", dimension: "Capacity", line: "$1.8–2.6M is roughly 2.5x your largest contract. Phased delivery helps but bonding and concurrent crew capacity are real risks. Consider teaming with a larger civil prime.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "warn", dimension: "Competition", line: "The 4 CONS office tends to see incumbent-favored bids on phased work — you'd be unseating whoever did Phase 1.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "If you can secure a teaming partner for bonding and concurrent crews, bid. If not, save it and target the right-sized Seymour Johnson jobs first — there's a smaller hangar repair in your feed at $480K that's a cleaner win.",
    uncertainty: "The phasing language in Section F is a little ambiguous — could be 3 separate task orders or one continuous contract with milestones. Worth a question to the CO before you commit estimator hours; the answer changes the bonding math.",
    seedMessage: "I dug into the Seymour Johnson 3-hangar re-roof. Short version: Lean Bid — scope is exactly yours and you already work that base, but $2.2M is ~2.5x your largest job. Only bid if you can team for capacity. Ask me anything.",
    suggestions: [
      { id: "why-lean", label: 'Why only "Lean Bid"?',
        response: "Capability, eligibility, and location are all green. The flag is capacity [§B.2]: $1.8–2.6M is well above your $890K largest past job, and the schedule wants concurrent crews on multiple hangars. Bonding to the ceiling and crew availability are the gates — if you can solve both via teaming, this flips to a Bid." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) A named teaming partner with $5M+ bonding capacity — propose JV or prime/sub with you on the roofing scope [§H.3]. (2) Lead past performance with the Seymour Johnson Bldg 3700 hangar repair you're already running [§L.4]. (3) Concrete phasing plan that shows 4 CONS you can run two hangars in parallel without crew dilution." },
      { id: "phasing", label: "Walk me through the phased delivery",
        response: "Section F.5 outlines three hangars over 18 months, with phase gates after each [§F.5]. The bonding question is whether each phase is a separate task order (smaller bond per phase) or one rolling contract (full $2.6M bond up front). The amendment doesn't fully clarify — that's the CO question I'd send Monday." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "Phased Air Force re-roofing at this size typically pulls 3–5 bidders — usually mid-size NC/VA primes with $5M+ bonding lines. The Phase 1 incumbent will bid hard to keep continuity. Your edge is local crews and the Seymour Johnson relationship; the gap is bonding scale." },
    ],
    authored: true,
  }),

  // 5. PRIME — Lean Bid (good fit, slightly above ceiling): VA Salisbury multi-building roof program
  "VA247-26-R-0166": () => ({
    call: "Lean Bid",
    rationale: "Solid VA fit at $1.75M, but this is above your past ceiling — bid if your surety can write to $2.1M, otherwise team or pass.",
    winTier: "Competitive",
    winTierReason: "TSB in NCO 6 typically pulls 5–7 bidders at $1M+. Field is qualified but not packed.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Multi-building re-roofing is exactly your scope — you ran the same shape of work at Cumberland County Schools (3 schools).", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "Total Small Business set-aside — you qualify cleanly. VA NCO 6 has awarded to you before in your size range.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "warn", dimension: "Location & performance area", line: "Salisbury is 2.5h from Fayetteville — drivable but adds per-trip cost. Crews would stage on-site, not commute.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "warn", dimension: "Capacity", line: "$1.4–2.1M is above your $890K past ceiling. Bondable, but call your surety this week — confirm they can write to $2.1M, not just the midpoint.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "ok", dimension: "Competition", line: "TSB at this size typically pulls 5–7 NC/VA mid-size primes. Your VA past performance and SDVOSB optional preference give you a real edge.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "Call your surety Monday to confirm the bonding ceiling. If they write to $2.1M, bid. If not, look for a teaming partner or save this for after the next Salisbury cycle.",
    uncertainty: "Section M weights past performance heavily but the language on 'similar size' is vague — could mean within ±25% of $1.75M (which would exclude your $890K largest) or just 'multi-building re-roofing.' Worth a clarifying question to the CO; the answer determines whether your past performance citation lands or not.",
    seedMessage: "I dug into the VA Salisbury multi-building roof program. Short version: Lean Bid — clean scope and you've done this shape of work, but $1.75M is above your past ceiling. Bonding capacity is the gate. Ask me anything.",
    suggestions: [
      { id: "why-lean", label: 'Why "Lean Bid"?',
        response: "Capability and eligibility are green; competition is favorable. The two yellow flags are capacity [§B.2] and travel [§F.2]. Neither is a deal-killer alone, but together they want a confident answer before you commit estimator hours." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) Confirmed bonding to $2.1M (call your surety this week). (2) Lead past performance with the Cumberland County 3-school re-roof — same shape, same scale [§L.4]. (3) A staging plan that shows VA you'll camp crews on-site, not commute — they've rejected low bids before for unrealistic mobilization assumptions." },
      { id: "bonding", label: "Walk me through the bonding requirement",
        response: "Standard FAR 52.228-15 — performance and payment bonds at 100% of contract value [§I.5]. On a $2.1M ceiling, your surety needs to write to the high end. If your line caps at $1.5M, you need a co-surety arrangement before bid day. This is the single biggest unlock." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "VA Salisbury roofing at $1.5M+ typically pulls 5–7 firms — mix of regional NC/VA primes and one or two SC firms on the edges of their footprint. Pricing tends to come in within 15%. SDVOSB preference (FAR 19.1404) gives you a real edge over non-veteran primes." },
    ],
    authored: true,
  }),

  // 6. PRIME — clean Bid: Pope AAF TPO hangar re-roof, $390K SDVOSB
  "W912PM-26-Q-0017": () => ({
    call: "Bid",
    rationale: "Textbook strong match — TPO hangar re-roof at Pope, $390K, SDVOSB. 15 minutes from your shop and the scope is straight out of your portfolio. Bid this.",
    winTier: "Open",
    winTierReason: "SDVOSB set-aside at this dollar size in the Fort Bragg / Pope pool pulls 3–5 NC-local firms — among the most favorable fields in your feed.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "TPO single-ply roofing on a hangar maps directly to your past work — your last two commercial TPO jobs are within ±20% of this scope.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "SDVOSB set-aside — you qualify. Pope contracting recognizes your SAM business type.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "Pope AAF is 15 minutes from your shop — same-day mobilization, no travel premium.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Capacity", line: "$310–470K is squarely in your sweet spot — well inside your bonding line and a single-crew job.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "ok", dimension: "Competition", line: "SDVOSB set-aside at sub-$500K pulls a thin field — typically 3–5 NC-local firms, and your local relationships give you an edge on past-performance scoring.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "Confirm bonding (trivial at this size), attend the site walk this Thursday at Hangar 4, and start the technical narrative. The amendment posted 28 hours ago — make sure you're working from the latest version.",
    seedMessage: "I dug into the Pope AAF Hangar 4 TPO re-roof. Short version: Bid — five-of-five green and the field will be thin. This is the kind you should be winning regularly. Ask me anything.",
    suggestions: [
      { id: "why-bid", label: 'Why "Bid"?',
        response: "Every fit dimension is green. Shortest read: SDVOSB set-aside + sub-$500K + Fort Bragg area = a 3–5 firm field where your local presence and TPO past performance both win on past-performance scoring [§M.1]. Pope CONS has awarded to firms exactly your size on similar work three times in the last 18 months." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) Attend the Thursday site walk — Pope CONS scoring meaningfully favors firms whose PM showed up. (2) Lead past performance with your two most recent TPO jobs [§L.4]. (3) Acknowledge the amendment in your offer (it adjusted the lightning-protection scope) — bids that miss the amendment get tossed as non-responsive." },
      { id: "amendment", label: "Walk me through the amendment",
        response: "Amendment 1 (posted 28h ago) clarifies that lightning protection tie-ins are part of the base scope, not a separate option [§Amendments]. Pricing impact is small — ~$8K of materials plus a half day of labor — but you have to acknowledge it explicitly or your bid is deemed non-responsive [§L.6]." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "Fort Bragg / Pope SDVOSB roofing at sub-$500K — 3–5 NC firms typically bid. I can name 2 that show up on most Pope CONS roofing and one Fayetteville firm that bids sporadically. Pricing usually clusters within 8% of the median. Your local relationships are a real edge." },
    ],
    authored: true,
  }),

  // 7. PRIME — Bid (SLED strong match): Cumberland County Schools 3-elementary re-roof
  "CCSC-2026-22": () => ({
    call: "Bid",
    rationale: "Your home county, your past-performance shape, and $795K is right at your largest job ceiling. This is your strongest possible past-performance unlock — bid it.",
    winTier: "Open",
    winTierReason: "Open competition but the field for school re-roofing in Cumberland tends to be 4–6 NC firms — your local presence and SDVOSB optional preference both help.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "3-school re-roofing program is the exact shape of work in your Cumberland County Detention re-roof — past performance maps 1:1.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "Open competition — no certification gate. Cumberland County procurement gives optional preference to local SDVOSB firms.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "ok", dimension: "Location & performance area", line: "Fayetteville — this is literally your home county. No travel, and you know the procurement officer by name.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Capacity", line: "$680–910K is right at your largest past contract size. Bondable, and the 3-school structure lets you stagger crews.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "ok", dimension: "Competition", line: "Open competition but the local SLED field is thin — typically 4–6 NC firms. Your county relationships and on-the-ground references are the unlock.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "Call your Cumberland County procurement contact this week, confirm the site walk schedule (typically rotates across the 3 schools over 2 days), and lead past performance with your Detention Annex re-roof. Move now — local primes will move fast on this.",
    seedMessage: "I dug into the Cumberland County 3-school re-roof. Short version: Bid — your home county, your scope, your size. This is the kind of job that becomes your next great past-performance citation. Ask me anything.",
    suggestions: [
      { id: "why-bid", label: 'Why "Bid"?',
        response: "Five of five green. Shortest read: your Cumberland County Detention re-roof is the textbook past-performance citation for this exact buyer [§L.4], and the local field for SLED school roofing is genuinely thin. Cumberland procurement has awarded to local SDVOSB firms on similar work twice in the last 24 months." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) Attend all 3 site walks (they're across 2 days) — Cumberland scoring tracks PM attendance. (2) Lead past performance with the Detention Annex re-roof — same buyer, same scope, same shape [§L.4]. (3) Reference your local hires explicitly; the county's small-business preference rewards local employment, not just local address." },
      { id: "scheduling", label: "Walk me through the 3-school sequencing",
        response: "Section F sequences the work across summer 2026 — School A in June, B in July, C in August. The cost driver is whether you run one crew across all three (sequential, 12 weeks) or two crews (overlap, 8 weeks). Sequential is lower bid but exposes you to weather; parallel is faster but higher mobilization. Cumberland's selection past has rewarded the sequential bid." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "Cumberland County school re-roofing — typically 4–6 NC firms bid. The two local roofing primes will both bid hard (this is in their backyard too). Pricing tends to cluster within 10%. Your edge is the SDVOSB preference and your direct work with this exact buyer." },
    ],
    authored: true,
  }),

  // 8. PRIME — Bid (good match, slight stretch on multi-site): MCAS Cherry Point shingle housing
  "N40085-26-R-0102": () => ({
    call: "Bid",
    rationale: "Strong Navy fit at $615K SDVOSB — shingle re-roofing on a housing block is exactly what your crews do weekly. The 3-hour drive is the only friction.",
    winTier: "Competitive",
    winTierReason: "SDVOSB set-aside in NAVFAC Mid-Atlantic at this size typically pulls 5–7 bidders — favorable but not thin.",
    fitMatrix: [
      { marker: "ok", dimension: "Capability fit", line: "Asphalt shingle re-roofing on a residential block is core work for your crews — multiple past projects within ±25% of this size.", citation: { label: "§C.1", anchor: "needs" } },
      { marker: "ok", dimension: "Certification & eligibility", line: "SDVOSB set-aside — you qualify. NAVFAC Mid-Atlantic recognizes your SAM standing.", citation: { label: "§L.1", anchor: "eligibility" } },
      { marker: "warn", dimension: "Location & performance area", line: "Cherry Point is 3h from Fayetteville. Driveable but you'd stage a crew on-site for the duration, not commute daily.", citation: { label: "§F.2", anchor: "needs" } },
      { marker: "ok", dimension: "Capacity", line: "$510–720K is squarely in your sweet spot and bondable with no surety stretch.", citation: { label: "§B.2", anchor: "needs" } },
      { marker: "ok", dimension: "Competition", line: "SDVOSB at this size in NAVFAC Mid-Atlantic typically pulls 5–7 bidders — most are NC/VA mid-size primes. Sharp pricing wins it.", citation: { label: "§M.1", anchor: "evaluation" } },
    ],
    nextStep: "If your crew calendar has a 6–8 week window this quarter, bid. Build the staging cost in honestly (lodging + per diem for the on-site crew) — low bids that under-price travel are commonly rejected here.",
    seedMessage: "I dug into the MCAS Cherry Point shingle housing re-roof. Short version: Bid — clean scope, right size, SDVOSB set-aside. The only friction is the 3-hour drive. Ask me anything.",
    suggestions: [
      { id: "why-bid", label: 'Why "Bid"?',
        response: "Four of five green, one yellow on travel. Shortest read: SDVOSB set-aside + your shingle past performance + bondable at this size = a real path to win. NAVFAC Mid-Atlantic has awarded to firms exactly your size on similar housing scope. The travel premium is real but not disqualifying." },
      { id: "make-strong", label: "What would make this a strong bid?",
        response: "(1) An honest staging plan that prices on-site crew lodging and per diem for the full performance period [§F.3]. (2) Lead past performance with your shingle housing-block work [§L.4]. (3) Reference any NC/coastal NC past work to show you understand the salt-air weatherproofing tweaks Cherry Point cares about." },
      { id: "travel", label: "Walk me through the travel cost",
        response: "Cherry Point is 175 miles from your shop. Daily commute is unrealistic — you'll stage a crew (typically 4–6 people) on-site for 6–8 weeks. Budget roughly $1,200/week per person for lodging + per diem. On a 6-week schedule with 5 people, that's ~$36K of travel cost to bake into your bid. Low bids that miss this get rejected as unrealistic." },
      { id: "competition", label: "Who's likely bidding against me?",
        response: "SDVOSB roofing at NAVFAC Mid-Atlantic in this size — typically 5–7 firms. Mix is NC eastern-coast primes (closer to Cherry Point than you) plus 1–2 VA firms. The local advantage is real for the coastal primes; your edge is your past performance scale and pricing discipline." },
    ],
    authored: true,
  }),
};

// ───── Public API ─────

const cache = new Map<string, GrantVerdict>();
const solicitationCache = new Map<string, SolicitationDetail>();

export function getGrantVerdict(opp: Opportunity): GrantVerdict {
  if (cache.has(opp.noticeId)) return cache.get(opp.noticeId)!;
  const verdict = BESPOKE[opp.noticeId]?.() ?? synthesizeGrant(opp);
  cache.set(opp.noticeId, verdict);
  return verdict;
}

export function getSolicitation(opp: Opportunity): SolicitationDetail {
  if (solicitationCache.has(opp.noticeId)) return solicitationCache.get(opp.noticeId)!;
  const sol = synthesizeSolicitation(opp);
  solicitationCache.set(opp.noticeId, sol);
  return sol;
}

export function findOpportunity(noticeId: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.noticeId === noticeId);
}

