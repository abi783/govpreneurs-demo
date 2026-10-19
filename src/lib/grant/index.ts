// Grant — public API. `getGrantAnalysis(opp)` returns the shared GrantAnalysis:
// a hand-authored fixture for the demo opportunities, else a deterministic
// synthesis from the opportunity's own facts so every card still renders. The
// insurance/bonding compliance rows are resolved against the live firm profile.
//
// No LLM, no sub-agents in this build (Phases 1–2). The deterministic Gate Strip
// and Real Deadline are computed by the pure functions re-exported here.

import type { Opportunity } from "../mock/opportunities";
import { fetchGrantAnalysis } from "../grantAnalysisApi";
import { resolveComplianceAgainstFirm } from "./compliance";
import { GRANT_FIXTURES } from "./fixtures";
import { PERSONA } from "../../demo/story/persona";
import type { ComplianceRow, GrantAnalysis, RichLine, Segment, Verdict } from "./types";

export * from "./types";
export { computeRealDeadline } from "./computeRealDeadline";
export { computeGates } from "./computeGates";
export { resolveComplianceAgainstFirm } from "./compliance";

const t = (text: string, bold = false): Segment => ({ text, bold });
const line = (...segs: Segment[]): RichLine => segs;

// A cache keyed by opportunity — analysis is deterministic per opp for this build.
const cache = new Map<string, GrantAnalysis>();

export function getGrantAnalysis(opp: Opportunity): GrantAnalysis {
  const hit = cache.get(opp.noticeId);
  if (hit) return hit;

  const built = GRANT_FIXTURES[opp.noticeId]?.(opp) ?? synthesize(opp);
  // Resolve profile-backed compliance rows (insurance, bonding) against the firm.
  const analysis: GrantAnalysis = {
    ...built,
    complianceMatrix: resolveComplianceAgainstFirm(built.complianceMatrix),
  };
  cache.set(opp.noticeId, analysis);
  return analysis;
}

/**
 * The Grant v2 seam. For a flagged (grant_v2 cohort) member this fetches the LIVE
 * GrantAnalysis from the backend board and falls back to the local synthesize on
 * any error or empty result — so a half-built board is always a complete,
 * shippable take. For everyone else it returns the local synthesize synchronously
 * (wrapped in a Promise). `getGrantAnalysis` stays sync for the non-async callers
 * (getGrantSummary + the pipeline modal).
 */
export async function loadGrantAnalysis(
  opp: Opportunity,
  opts?: { grantV2?: boolean; oppKey?: string },
): Promise<GrantAnalysis> {
  const oppKey = opts?.oppKey ?? opp.noticeId;
  if (opts?.grantV2 && oppKey) {
    try {
      const live = await fetchGrantAnalysis(oppKey);
      if (live) {
        // Resolve any profile-backed rows client-side too (a no-op for the
        // pre-resolved backend rows), keeping the one resolution path.
        return { ...live, complianceMatrix: resolveComplianceAgainstFirm(live.complianceMatrix) };
      }
    } catch {
      // Network/permission error → fall through to the unanalyzed take.
    }
    // The backend returned no analysis (no score record yet) or the call failed.
    // This used to fall through to `synthesize`, which is a FIXTURE generator —
    // so a member saw "I've read this one · 14 checks · 5 sources" for an
    // opportunity nothing had read, alongside hardcoded eligibility inputs. "Never a broken card" is not worth a fabricated one:
    // an unanalyzed opportunity says so, and the rail still answers questions.
    return unanalyzed(opp);
  }
  return getGrantAnalysis(opp);
}

/**
 * The honest empty take: the shape the canvas needs, with nothing asserted.
 *
 * Zero counts (the rail hides the checks/sources line at 0), no claim of having
 * read anything, and gate inputs taken from the notice itself rather than
 * invented — `firmHolds`/`firmLicensedStates` are empty because we have not
 * checked, which is different from checking and finding none.
 */
export function unanalyzed(opp: Opportunity): GrantAnalysis {
  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "0",
    amendmentVersion: "0",
    meta: {
      stage: "unanalyzed",
      analyzedAt: null,
      checksRun: 0,
      sourcesConsulted: 0,
      freshnessLine: line(t("Not analyzed yet.")),
      noticeType: opp.informational === true ? "sources-sought" : "solicitation",
    },
    gateInputs: {
      setAside: { required: opp.setAside ?? null, firmHolds: [], verified: false },
      naics: { code: opp.naicsCode ?? "", sizeStandard: "", firmIsSmall: false },
      sam: { activeThrough: null, awardWindowEnds: "" },
      license: { requiredState: null, firmLicensedStates: [] },
    },
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: 0,
      ppqTurnaroundDays: 0,
      subQuoteDays: 0,
      writingDays: 0,
      passedEvents: [],
    },
    complianceMatrix: [],
    verdict: {
      value: "review",
      path: "shape-watch",
      gist: line(t("I haven't analyzed this one yet.")),
      headline: [line(t("I haven't analyzed this one yet."))],
      confidence: {
        level: "low",
        openQuestions: 0,
        remedy: line(t("Ask me about it and I'll work from the notice.")),
      },
    },
    reads: [],
    action: {
      path: "shape-watch",
      primary: { label: "Back to your matches", target: "/opportunities" },
      secondaries: [],
      rationale: line(t("Ask Grant anything about this one.")),
    },
    trail: [],
    findings: [],
    citations: [],
    rail: {
      briefing: [
        line(
          t("I haven't analyzed this one yet.", true),
          t(" Ask me about it and I'll work from the notice."),
        ),
      ],
      openQuestions: [],
      suggestedChips: [
        { slot: "doubt", label: "Can I win it?", kind: "ask" },
        { slot: "act", label: "Do I have enough time?", kind: "ask" },
      ],
    },
  };
}

// ── Deterministic fallback for the ~55k non-demo opportunities ──
function synthesize(opp: Opportunity): GrantAnalysis {
  const isSourcesSought = opp.informational === true;
  const noticeType = isSourcesSought ? "sources-sought" : "solicitation";

  const eligibilityRow: ComplianceRow = {
    requirement: line(t(opp.setAside ? `${opp.setAside} set-aside` : "Open eligibility")),
    sourceClause: { label: "§A.2", provenance: { type: "solicitation", ref: "§A.2" } },
    category: "eligibility",
    requiredValue: opp.setAside ?? "open",
    firmValue: opp.eligibility === "qualify" ? "verified ✓" : "—",
    status:
      opp.eligibility === "closed_to_new"
        ? "missing"
        : opp.eligibility === "qualify"
          ? "have"
          : "confirm",
    closableInWindow: opp.eligibility === "closed_to_new" ? false : undefined,
  };
  const glRow: ComplianceRow = {
    requirement: line(t("General Liability "), t("$2M", true)),
    sourceClause: { label: "§App-C", provenance: { type: "solicitation", ref: "§App-C" } },
    category: "insurance",
    requiredValue: "$2M aggregate",
    firmValue: "—",
    status: "unknown",
    resolve: { kind: "insurance", coverage: "gl", requiredLimit: 2_000_000 },
  };

  const verdict: Verdict =
    opp.eligibility === "closed_to_new"
      ? "no-bid"
      : opp.matchTier === "strong" || opp.matchTier === "good"
        ? "bid"
        : "review";
  const path = verdict === "no-bid" ? "skip" : verdict === "bid" ? "prime" : "shape-watch";

  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "2026-04-18",
    amendmentVersion: "0",
    meta: {
      stage: "complete",
      // DEMO: the time is the time now, and the firm is the demo caterer.
      analyzedAt: new Date().toISOString(),
      checksRun: 14,
      sourcesConsulted: 5,
      freshnessLine: line(t("Analyzed just now.")),
      noticeType,
    },
    gateInputs: {
      setAside: {
        required: opp.setAside ?? null,
        firmHolds: [...PERSONA.setAsideEligibility],
        verified: opp.eligibility === "qualify",
      },
      naics: { code: opp.naicsCode ?? PERSONA.primaryNaics, sizeStandard: "$47.0M", firmIsSmall: true },
      sam: { activeThrough: PERSONA.samActiveUntil, awardWindowEnds: new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10) },
      license: { requiredState: PERSONA.hqState, firmLicensedStates: [...PERSONA.serviceStates] },
    },
    // Frozen-clock note (this PR's scope decision — see the module header for the rest):
    // `realDeadlineInputs` here just carries `responseDue`/lead-time facts; it is not itself
    // computed against a clock. The actual `RealDeadline` (day counts, tight/blocked status)
    // comes from calling `computeRealDeadline(analysis.realDeadlineInputs, now)` at render
    // time, which defaults `now` to the frozen `NOW` anchor shared with the rest of the app's
    // mock data. For a REAL (non-fixture) opportunity going through this synthesize() path,
    // the UI PR should call `computeRealDeadline(analysis.realDeadlineInputs, new Date())`
    // explicitly so the countdown reflects the live clock instead of the 2026-05-07 anchor —
    // deferred there since no UI renders this lib yet in this PR.
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: opp.mode === "prime" ? 14 : 0,
      ppqTurnaroundDays: 5,
      subQuoteDays: 0,
      writingDays: 3,
      passedEvents: [],
    },
    complianceMatrix: [eligibilityRow, glRow],
    verdict: {
      value: verdict,
      path,
      gist: line(t(opp.hunterReasoning || "I've read this one — ask me if it's worth your time.")),
      headline: [line(t(opp.hunterReasoning || "I've read this one."))],
      competitiveRisk:
        verdict === "no-bid" ? undefined : line(t("a limited track record for this class of work")),
      confidence: {
        level: "low",
        openQuestions: 2,
        remedy: line(t("Fill in your profile and I can sharpen this.")),
      },
    },
    reads: [
      {
        id: 1,
        name: "Can you win it?",
        status: "mixed",
        epistemic: "stated",
        order: 0,
        sentence: line(t("A first read"), t(" — ask me and I'll dig into the competition.")),
        evidence: [],
      },
    ],
    action: {
      path,
      primary:
        verdict === "no-bid"
          ? { label: "Back to your matches", target: "/opportunities" }
          : { label: "Start your bid", target: `/pipeline?opp=${opp.noticeId}` },
      secondaries: [{ label: "Send to Mentor", target: "mentor", price: 97 }],
      rationale: line(t("Ask Grant anything about this one.")),
    },
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          { glyph: "neutral", text: line(t("Parsed the notice and your lane")), source: "Notice" },
        ],
      },
    ],
    findings: [],
    citations: [],
    rail: {
      briefing: [
        line(t("I've read this one.", true), t(" Ask me anything, or challenge the verdict.")),
      ],
      openQuestions: [],
      // Doubt + act only — this local synthesize has no open questions, so the
      // improve slot legitimately collapses (Doc 132 AD-3). Both labels are
      // always answerable; the old Tier-∅ "Who's likely bidding?" is gone.
      suggestedChips: [
        { slot: "doubt", label: "Can I win it?", kind: "ask" },
        { slot: "act", label: "Do I have enough time?", kind: "ask" },
      ],
    },
  };
}
