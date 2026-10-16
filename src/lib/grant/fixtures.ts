// Hand-authored GrantAnalysis fixtures for the canonical persona (Marcus Williams /
// Williams Construction LLC). No LLM, no sub-agents — this is the realistic example
// the shell renders against in Phases 1–2. Three cases exercise the deterministic
// engine and the demo-walk:
//   • W912EE-26-R-0066  Fort Bragg re-roof   → Bid · as a SUB (Confirm bonding, tight)
//   • SP4701-26-R-0078  Camp Mackall (TS)    → No Bid (unclosable clearance gate)
//   • DEMO-SPECIAL-02   Sources Sought       → Shape & watch
//
// Gate/deadline/compliance fields are authored carefully (they render now). The
// insurance/bonding rows carry a `resolve` hint so their status is computed against
// the live firm profile (compliance.ts). Verdict/reads/action/trail/rail are present
// as realistic data; their polished UI lands in later phases.

import type { Opportunity } from "../mock/opportunities";
import type {
  ComplianceRow,
  Conversation,
  GrantAnalysis,
  Pin,
  Provenance,
  ProvenanceType,
  RichLine,
  Segment,
} from "./types";

// ── tiny authoring helpers ──
const t = (text: string, bold = false): Segment => ({ text, bold });
const line = (...segs: Segment[]): RichLine => segs;
const pin = (label: string, type: ProvenanceType, ref: string, quote?: string): Pin => ({
  label,
  provenance: { type, ref, quote },
});

/** A PUBLIC-RECORD pin — the fourth geometry. The object type rides in the ref
 *  (`award:<id>#<fields>`), and the register row travels with the pin because
 *  the client holds no award dataset of its own. The demo fixtures carry a real
 *  award shape so this path is exercised outside the live cohort too; the live
 *  board supplies the same payload from Mongo. */
const pinPublic = (label: string, ref: string, payload: Partial<Provenance>): Pin => ({
  label,
  provenance: { type: "public", ref, ...payload },
});

/** A pin carrying the surrounding context the source sheet renders around the
 *  highlighted span. `before`/`after` are the real neighbouring clauses — they
 *  exist so a reader can see the quote wasn't cherry-picked, which is the whole
 *  point of showing a source rather than asserting one. */
const pinx = (
  label: string,
  ref: string,
  locator: string,
  before: string | undefined,
  span: string,
  after: string | undefined,
): Pin => ({
  label,
  provenance: {
    type: "solicitation",
    ref,
    quote: span,
    locator,
    excerpt: { before, span, after },
  },
});

/** A source we know we could not read. Shown as an explicit state, never a dead
 *  chip — and it states whether the analysis leaned on it. */
const pinMissing = (label: string, ref: string, reason: string, usedInAnalysis: boolean): Pin => ({
  label,
  provenance: { type: "solicitation", ref, unavailable: { reason, usedInAnalysis } },
});

/** A pin backed by something that was SAID — the member's own words to an agent,
 *  or a stretch of mentor-call transcript. Surrounding turns are mandatory here,
 *  not optional: see the note on `Conversation` in types.ts. */
const pinSaid = (
  label: string,
  type: "chat" | "transcript",
  ref: string,
  conversation: Conversation,
): Pin => ({
  label,
  provenance: {
    type,
    ref,
    quote: conversation.turns.find((turn) => turn.id === conversation.citedTurnId)?.text,
    conversation,
  },
});

// ── Conversation fixtures ────────────────────────────────────────────────
// Marcus answering Hunter's direct question about bonding. This is the exchange
// behind the profile's `state: "attested" · source: "You told Hunter"` cells —
// the link that was missing until now.
const BONDING_CHAT: Conversation = {
  channel: "hunter",
  occurredAt: "2026-04-18T15:42:00Z",
  citedTurnId: "c3",
  attested: true,
  turns: [
    {
      id: "c1",
      speaker: "Hunter",
      role: "agent",
      at: "2026-04-18T15:41:00Z",
      text: "Two more and your profile is complete. Do you have a surety line in place — a bonding company that has already approved you for a single job?",
    },
    {
      id: "c2",
      speaker: "You",
      role: "member",
      at: "2026-04-18T15:41:40Z",
      text: "Not a federal one. We have done bonded work for the county before.",
    },
    {
      id: "c3",
      speaker: "You",
      role: "member",
      at: "2026-04-18T15:42:10Z",
      text: "Largest single bond we have carried is about $600K, on the Cumberland County HVAC job. Nothing above that.",
    },
    {
      id: "c4",
      speaker: "Hunter",
      role: "agent",
      at: "2026-04-18T15:42:30Z",
      text: "Noted — I will treat $600K as your proven single-job capacity until a surety confirms a higher line.",
    },
  ],
  learning:
    "Proven single-job bonding capacity is $600K, county-level, not federal. Anything requiring a $2M federal bond needs a new surety line or a prime to carry it.",
  learningBy: "Hunter, from this exchange",
};

// Diana on the positioning call, telling Marcus to subcontract first. The
// verbatim advice and the learning we derived are deliberately separate.
const DIANA_CALL: Conversation = {
  channel: "mentor-call",
  title: "Positioning call with Diana",
  occurredAt: "2026-04-22T09:00:00Z",
  citedTurnId: "t3",
  attested: true,
  playAt: "14:32",
  turns: [
    {
      id: "t1",
      speaker: "Diana Potts",
      role: "mentor",
      at: "14:11",
      text: "So where are you? Can you do something just in two hours around you, or is this something you sell nationally?",
    },
    {
      id: "t2",
      speaker: "You",
      role: "member",
      at: "14:24",
      text: "Realistically two, maybe three hours. Fayetteville out to Raleigh. Crew of three.",
    },
    {
      id: "t3",
      speaker: "Diana Potts",
      role: "mentor",
      at: "14:32",
      text: "Then do not chase primes on day one. With a crew of three you go in as a sub on the big roofing packages, build the past performance, and we revisit prime in about a year. I will send you twenty-five primes who buy what you sell.",
    },
    {
      id: "t4",
      speaker: "Diana Potts",
      role: "mentor",
      at: "14:58",
      text: "And we are not calling you a roofing contractor on the capability statement. Government does not buy roofing contractors. You are a building envelope and weatherproofing firm.",
    },
  ],
  learning:
    "Diana set the strategy as sub-first for at least a year, on crew-size grounds, with a prime list to work from. Grant weights bid-as-sub accordingly.",
  learningBy: "Grant, from the recording",
};

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Fort Bragg barracks re-roof — the canonical "Bid, as a sub" case
// ─────────────────────────────────────────────────────────────────────────────
function fortBragg(opp: Opportunity): GrantAnalysis {
  const complianceMatrix: ComplianceRow[] = [
    {
      requirement: line(t("SDVOSB set-aside")),
      sourceClause: pinx(
        "§A.2",
        "§A.2",
        "Section A · Set-aside and eligibility · p.3",
        "A.1  This acquisition is conducted under the authority of FAR Part 19. The North American Industry Classification System code assigned to this requirement is set forth at A.3.",
        "A.2  This acquisition is a total small business set-aside restricted to Service-Disabled Veteran-Owned Small Business (SDVOSB) concerns verified in the SBA certification database as of the date of proposal submission.",
        "A.2.1  A concern whose verification lapses between proposal submission and award shall be ineligible for award. Offerors are responsible for maintaining continuous verification.",
      ),
      category: "eligibility",
      requiredValue: "SDVOSB",
      firmValue: "verified ✓",
      status: "have",
    },
    {
      requirement: line(t("Small under NAICS "), t("238160", true)),
      sourceClause: pinx(
        "§A.3",
        "§A.3",
        "Section A · Set-aside and eligibility · p.4",
        "A.2.1  A concern whose verification lapses between proposal submission and award shall be ineligible for award.",
        "A.3  The applicable NAICS code is 238160 — Roofing Contractors — with a corresponding small business size standard of $19.0 million in average annual receipts.",
        "A.3.1  Size shall be determined as of the date of proposal submission, computed over the offeror's five most recently completed fiscal years.",
      ),
      category: "eligibility",
      requiredValue: "small under 238160 ($19M)",
      firmValue: "small ✓",
      status: "have",
    },
    {
      requirement: line(t("NC roofing license")),
      sourceClause: pin("§L.2", "solicitation", "§L.2"),
      category: "license",
      requiredValue: "active NC license",
      firmValue: "NC ✓",
      status: "have",
    },
    {
      requirement: line(t("General Liability "), t("$2M", true)),
      sourceClause: pinx(
        "§App-C",
        "§App-C",
        "Appendix C · Insurance requirements · p.48",
        "The following minimum coverages shall be maintained for the full period of performance and for twelve (12) months thereafter.",
        "Commercial General Liability: $1,000,000 per occurrence and $2,000,000 general aggregate, written on an occurrence basis, carrier rated A- or better by A.M. Best.",
        "Workers' Compensation: statutory limits for the state of performance. Commercial Automobile: $1,000,000 combined single limit. Professional Liability is not required for this requirement.",
      ),
      category: "insurance",
      requiredValue: "$2M aggregate",
      firmValue: "—",
      status: "unknown",
      resolve: { kind: "insurance", coverage: "gl", requiredLimit: 2_000_000 },
    },
    {
      requirement: line(t("Performance & payment bond "), t("$2M", true)),
      sourceClause: pinx(
        "§L.4",
        "§L.4",
        "Section L · Instructions to offerors · p.14",
        "L.3  Offerors shall submit evidence of the insurance coverages listed at Appendix C with their proposal. Certificates naming the Government as additional insured are not required at proposal.",
        "L.4  In accordance with the Miller Act (40 U.S.C. 3131), the successful offeror shall furnish performance and payment bonds, each in an amount equal to one hundred percent (100%) of the total contract price, executed prior to award.",
        "L.4.1  Bonds shall be executed on Standard Form 25 and Standard Form 25A. L.4.2  Evidence of bonding capacity sufficient to meet this requirement shall accompany the proposal. L.4.3  For contracts below the simplified acquisition threshold the Contracting Officer may, at their sole discretion, accept alternative payment protection under FAR 28.102-1(b) in lieu of bonds.",
      ),
      category: "bonding",
      requiredValue: "$2M single job",
      firmValue: "—",
      status: "unknown",
      closableInWindow: true,
      resolve: { kind: "bonding", requiredAmount: 2_000_000 },
    },
    {
      requirement: line(t("Proof of Insurance — "), t("Vol. III", true)),
      sourceClause: pinMissing(
        "Attachment 4",
        "attachment-4",
        "Attachment 4 is a scanned document with no extractable text, so Grant could not read the Volume III page-limit table.",
        true,
      ),
      category: "submission",
      requiredValue: "Volume III",
      firmValue: "—",
      status: "confirm",
    },
  ];

  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "2026-04-18",
    amendmentVersion: "2",
    amendment: {
      label: "Amendment 2",
      postedAt: "yesterday",
      summary: line(
        t("Raised the performance bond to "),
        t("$2M", true),
        t(" (was $1M) and confirmed the site-visit date."),
      ),
      impact: line(
        t("That's what pushed you from "),
        t("prime to sub", true),
        t(" — I re-ran all 23 checks. Your real window tightened by "),
        t("3 days", true),
        t("."),
      ),
    },
    meta: {
      stage: "complete",
      analyzedAt: "2026-05-07T08:56:00-05:00",
      checksRun: 23,
      sourcesConsulted: 6,
      freshnessLine: line(t("Analyzed just now.")),
      noticeType: "solicitation",
    },
    gateInputs: {
      setAside: { required: "SDVOSB", firmHolds: ["SDVOSB"], verified: true },
      naics: { code: "238160", sizeStandard: "$19.0M", firmIsSmall: true },
      sam: { activeThrough: "2027-01-31", awardWindowEnds: "2026-08-01" },
      license: { requiredState: "NC", firmLicensedStates: ["NC"] },
    },
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: 0, // subbing — the prime carries the bond, not Marcus
      ppqTurnaroundDays: 5,
      subQuoteDays: 0,
      writingDays: 2,
      passedEvents: [{ label: "Site visit", date: "2026-03-12" }],
    },
    complianceMatrix,
    verdict: {
      value: "bid",
      path: "sub",
      gist: line(t("Great fit — but the "), t("$2M bond is out of reach today", true), t(".")),
      warnings: [
        {
          kind: "disqualifier",
          summary: line(
            t("There was a "),
            t("required site visit and it already passed", true),
            t(" — you can't bid as the prime now, but going in as a sub is fine."),
          ),
        },
        {
          kind: "responsibility",
          summary: line(
            t("Before they pick you, they must be sure you can "),
            t("afford to finish the job", true),
            t(". With no bond set up, they can't be sure yet."),
          ),
        },
        {
          kind: "proposal-weakness",
          summary: line(
            t("You have "),
            t("little past federal work to show", true),
            t(" — so you'll score lower when they compare bids."),
          ),
        },
        {
          kind: "winning-hurts",
          summary: line(
            t("If you win as the prime, it would "),
            t("strain your cash and crew", true),
            t(" hard in the first 90 days."),
          ),
        },
      ],
      headline: [
        line(t("The work is squarely yours"), t(" and the veteran set-aside thins the field.")),
        line(
          t("But the $2M performance bond is out of reach today", true),
          t(", and Sterling Roofing has held this since 2019."),
        ),
        line(
          t("Sub under one of the three primes bidding it", true),
          t(" — that's your realistic way in."),
        ),
      ],
      competitiveRisk: line(
        t("the "),
        t("company that has the job now", true),
        t(" — the Army has kept Sterling for four years, so they may not want to switch"),
      ),
      confidence: {
        level: "medium",
        openQuestions: 3,
        remedy: line(t("Answer the bonding question", true), t(" and I can call this properly.")),
        softCap: "review",
      },
    },
    reads: [
      {
        id: 1,
        name: "Can you bid?",
        status: "strong",
        epistemic: "verified",
        order: 0,
        short: line(t("Yes — you "), t("clear every gate", true), t(".")),
        sentence: line(
          t("Fully eligible", true),
          t(" — SDVOSB-verified, small under NAICS 238160, NC-licensed."),
        ),
        evidence: [pin("§A.2", "solicitation", "§A.2")],
        dossier: [
          line(
            t("The set-aside, size standard, and state license all check out — "),
            t("nothing here disqualifies you", true),
            t("."),
          ),
          line(t("The one bar is the passed site visit, and that only blocks a prime bid.")),
        ],
      },
      {
        id: 2,
        name: "Do you understand the buyer's intent?",
        status: "mixed",
        epistemic: "unknown",
        order: 1,
        short: line(t("Partly — "), t("no pre-RFP contact", true), t(" with the office.")),
        sentence: line(
          t("Buyer intent is thin", true),
          t(
            " — USACE Wilmington wants a roofer who won't slip the barracks schedule; you've done no capture.",
          ),
        ),
        evidence: [pin("§M.2", "solicitation", "§M.2")],
        dossier: [
          line(
            t("Section M weights past performance heavily — the office is "),
            t("protecting against schedule and quality risk", true),
            t(", not chasing the lowest price."),
          ),
          line(
            t("You haven't engaged them before the RFP, so this read is "),
            t("inference, not confirmed", true),
            t(" — which pushes the call more cautious."),
          ),
        ],
      },
      {
        id: 5,
        name: "Can you survive winning?",
        status: "blocking",
        epistemic: "unknown",
        order: 4,
        limiting: true,
        short: line(t("The bond blocks it — and winning would "), t("strain you", true), t(".")),
        sentence: line(
          t("Two problems in one", true),
          t(
            " — the $2M bond blocks a prime bid today, and winning as prime would strain your cash and crew.",
          ),
        ),
        evidence: [
          pin("Your profile", "profile", "profile.bidderProfile.insuranceBonding"),
          pinSaid("You told Hunter", "chat", "chat.bonding-capacity", BONDING_CHAT),
        ],
        dossier: [
          line(
            t("Performability (S7): the Miller Act requires a "),
            t("$2M performance and payment bond", true),
            t(" you don't carry yet — weeks to set up."),
          ),
          line(
            t("Business consequence (S10): as prime you'd "),
            t("front payroll and materials", true),
            t(
              " before the first invoice clears, on top of your backlog. As a sub the prime carries both.",
            ),
          ),
        ],
      },
      {
        id: 3,
        name: "Can you realistically win?",
        status: "mixed",
        epistemic: "stated",
        order: 2,
        short: line(t("Hard — the "), t("same firm has held it since 2019", true), t(".")),
        sentence: line(
          t("Incumbent-defended", true),
          t(" — Sterling has held it since 2019, options exercised 4 of 4."),
        ),
        evidence: [
          pinPublic("Sterling — prior award", "award:W912PM-19-C-0043#winner", {
            award: {
              awardId: "W912PM-19-C-0043",
              title: null,
              description: "Barracks roofing — modified bitumen replacement",
              awardeeName: "Sterling Roofing Systems",
              agencyName: "Department of Defense · Army",
              naicsCode: "238160",
              naicsDescription: "Roofing Contractors",
              value: 4_180_000,
              offers: null,
              fiscalYear: 2019,
              actionDate: "2019-06-14",
              setAside: null,
              extentCompeted: null,
              popState: "NC",
              solicitationId: null,
              sourceUrl: null,
              asOf: "2026-07-20T11:42:23.602Z",
            },
          }),
        ],
        dossier: [
          line(
            t("Sterling Roofing has held this since 2019, and the government "),
            t("exercised all four option years", true),
            t(" — a satisfied customer."),
          ),
          line(
            t("Unseating them means clearly beating their price or record. As a sub you "),
            t("don't have to beat them", true),
            t(" — you ride the winning prime."),
          ),
        ],
      },
      {
        id: 4,
        name: "Can you do the work?",
        status: "strong",
        epistemic: "verified",
        order: 3,
        short: line(t("Yes — it's your "), t("core roofing work", true), t(".")),
        sentence: line(
          t("Squarely in your lane", true),
          t(" — modified-bitumen barracks re-roofing is your core scope."),
        ),
        evidence: [
          pin("Your past performance", "profile", "profile.pastPerformance"),
          pinSaid("Diana's call, 22 Apr", "transcript", "call.diana-positioning", DIANA_CALL),
        ],
        dossier: [
          line(
            t("Modified-bitumen barracks re-roofing is "),
            t("exactly what your crew does", true),
            t("."),
          ),
          line(
            t(
              "Your past performance covers the scope, the size, and the roofing system this notice calls for.",
            ),
          ),
        ],
      },
      {
        id: 6,
        name: "Will you make money?",
        status: "mixed",
        epistemic: "stated",
        order: 5,
        short: line(t("As a sub, yes — for the "), t("track record you'd gain", true), t(".")),
        sentence: line(
          t("Thin as prime, real as a sub", true),
          t(" — the federal past performance is the prize here."),
        ),
        evidence: [pin("§B.2", "solicitation", "§B.2")],
        dossier: [
          line(
            t(
              "As the prime the margin is thin — the bond cost and the incumbent's pricing eat into it.",
            ),
          ),
          line(
            t("As a sub the real prize is the "),
            t("federal past-performance record", true),
            t(" you earn — that's what opens bigger doors."),
          ),
        ],
      },
      {
        id: 7,
        name: "Does this move you forward?",
        status: "strong",
        epistemic: "verified",
        order: 6,
        short: line(t("Yes — it opens the door to "), t("bigger jobs next year", true), t(".")),
        sentence: line(
          t("Subbing unlocks priming next year", true),
          t(" — your first federal roofing record above $500K."),
        ),
        evidence: [pin("Your Roadmap", "profile", "roadmap")],
        dossier: [
          line(
            t("This becomes your "),
            t("first federal roofing record above $500K", true),
            t("."),
          ),
          line(
            t("With it on file you can "),
            t("prime a similar job next year", true),
            t(" instead of subbing — a step up in size and margin."),
          ),
        ],
      },
    ],
    action: {
      path: "sub",
      primary: {
        label: "Find the primes bidding this",
        target: "/partners?award=W912PM-19-C-0043",
      },
      secondaries: [{ label: "Send to Mentor", target: "mentor", price: 97 }],
      rationale: line(
        t("Subbing gets you the "),
        t("federal past performance", true),
        t(" that unlocks priming next year."),
      ),
    },
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 7,
        items: [
          { glyph: "ok", text: line(t("Set-aside: SDVOSB — you hold it")), source: "§A.2" },
          {
            glyph: "ok",
            text: line(t("Size standard: NAICS 238160, $19M — you're small")),
            source: "§A.3",
          },
          {
            glyph: "warn",
            text: line(t("Best-value tradeoff, past performance heavily weighted")),
            source: "§M.2",
          },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          {
            glyph: "warn",
            text: line(t("Incumbent: Sterling Roofing, held since 2019")),
            source: "FPDS W912PM-19-C-0043",
          },
          {
            glyph: "warn",
            text: line(t("Options exercised 4 of 4 — a satisfied customer")),
            source: "FPDS",
          },
          {
            glyph: "neutral",
            text: line(t("Similar roofing set-asides here drew 6 offers on average")),
            source: "FPDS, 3-yr avg",
          },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 5,
        items: [
          {
            glyph: "confirm",
            text: line(t("Bonding capacity: not on file — I need this")),
            source: "Your profile",
          },
          {
            glyph: "ok",
            text: line(t("General Liability $2M — you carry it")),
            source: "Your profile",
          },
        ],
      },
    ],
    findings: [],
    redTeam: [
      {
        challenge: line(t("Is the incumbent really unbeatable?")),
        resolution: line(
          t("As prime, effectively — "),
          t("4 of 4 options exercised", true),
          t(
            " is a satisfied customer. You'd need a clearly better price or record, and you have neither today.",
          ),
        ),
      },
      {
        challenge: line(t("Is subbing worth the thin margin?")),
        resolution: line(
          t("Yes — the "),
          t("federal past-performance record", true),
          t(" is worth more than this job's margin. It's what unlocks priming next year."),
        ),
      },
      {
        challenge: line(t("Could the $2M bond come together in time?")),
        resolution: line(
          t("No — a surety needs "),
          t("weeks of underwriting", true),
          t(" and financials you don't have on file. Not in this window."),
        ),
      },
    ],
    citations: [pin("§A.2", "solicitation", "§A.2"), pin("§M.2", "solicitation", "§M.2")],
    sectionCoverage: [
      {
        section: "A",
        title: "Solicitation / Contract Form",
        owners: ["S1", "S9"],
        finding: line(t("SDVOSB total set-aside; you hold it.")),
        state: "reviewed_complete",
      },
      {
        section: "B",
        title: "Supplies / Services & Prices",
        owners: ["S4", "S10"],
        finding: line(t("Firm-fixed-price re-roof; not an IDIQ.")),
        state: "reviewed_complete",
      },
      {
        section: "C",
        title: "Description / Specs / SOW",
        owners: ["S5", "S9"],
        finding: line(t("Modified-bitumen scope — squarely your lane.")),
        state: "reviewed_with_findings",
      },
      {
        section: "E",
        title: "Inspection & Acceptance",
        owners: ["S5", "S10"],
        finding: line(t("Standard USACE QA; CQM manager expected.")),
        state: "reviewed_with_findings",
      },
      {
        section: "H",
        title: "Special Contract Requirements",
        owners: ["S1", "S7", "S10"],
        finding: line(t("Miller Act bonding — the $2M blocker.")),
        state: "reviewed_with_findings",
      },
      {
        section: "I",
        title: "Contract Clauses",
        owners: ["S1", "S4"],
        finding: line(t("FAR 52.219-14 cited by reference — not yet expanded.")),
        state: "incorporated_by_reference",
      },
      {
        section: "J",
        title: "Attachments / Exhibits",
        owners: ["S1", "S4", "S6"],
        finding: line(t("Wage determination attachment not opened yet.")),
        state: "attachment_dependent",
      },
      {
        section: "K",
        title: "Representations & Certifications",
        owners: ["S1"],
        finding: line(t("SAM reps current; SDVOSB verified.")),
        state: "reviewed_complete",
      },
      {
        section: "L",
        title: "Instructions to Offerors",
        owners: ["S1"],
        finding: line(t("Three volumes; submitted electronically via SAM.gov.")),
        state: "reviewed_complete",
      },
      {
        section: "M",
        title: "Evaluation Factors",
        owners: ["S2", "S9", "S6"],
        finding: line(t("Best-value tradeoff; past performance heavily weighted.")),
        state: "reviewed_with_findings",
      },
    ],
    rail: {
      briefing: [
        line(
          t("Analysis complete.", true),
          t(" I ran "),
          t("23 checks across 6 sources", true),
          t("."),
        ),
        line(
          t("The verdict's on the left — but "),
          t("3 things I still need from you", true),
          t(" could change it."),
        ),
        line(t("Want the one that matters most?")),
      ],
      openQuestions: [
        {
          id: "bonding",
          question: line(t("What's your "), t("bonding capacity", true), t("?")),
          payoff: line(
            t("Moves this from a "),
            t("maybe", true),
            t(" to a "),
            t("yes-or-no", true),
            t("."),
          ),
          verdictSwing: 0.8,
          input: { kind: "currency" },
          status: "open",
        },
        {
          id: "cqm",
          question: line(t("Is your QC manager "), t("CQM-certified", true), t("?")),
          payoff: line(t("USACE requires it — decides the "), t("do-the-work", true), t(" read.")),
          verdictSwing: 0.5,
          input: { kind: "yesno" },
          status: "open",
        },
        {
          id: "site-visit",
          question: line(t("Did you attend the "), t("site visit", true), t("?")),
          payoff: line(t("Confirms you can still bid as a "), t("sub", true), t(".")),
          verdictSwing: 0.3,
          input: { kind: "yesno" },
          status: "open",
        },
      ],
      suggestedChips: [
        { slot: "doubt", label: "Why not as prime?", kind: "ask" },
        {
          slot: "improve",
          label: "Answer the bonding question",
          kind: "elicit",
          target: "bonding",
        },
        {
          slot: "act",
          label: "How do I find a partner?",
          kind: "route",
          target: "/partners",
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Camp Mackall (TS-cleared) — the unclosable hard-gate case (No Bid, no upsell)
// ─────────────────────────────────────────────────────────────────────────────
function campMackall(opp: Opportunity): GrantAnalysis {
  const complianceMatrix: ComplianceRow[] = [
    {
      requirement: line(t("Facility clearance + "), t("TS-cleared personnel", true)),
      sourceClause: pin(
        "§L.6",
        "solicitation",
        "§L.6",
        "Contractor must hold a Top Secret FCL and TS-cleared personnel.",
      ),
      category: "clearance",
      requiredValue: "TS FCL + cleared crew",
      firmValue: "none on file",
      status: "missing",
      closableInWindow: false, // an FCL needs a government sponsor and takes months (§S1)
    },
    {
      requirement: line(t("SDVOSB set-aside")),
      sourceClause: pin("§A.2", "solicitation", "§A.2"),
      category: "eligibility",
      requiredValue: "SDVOSB",
      firmValue: "verified ✓",
      status: "have",
    },
    {
      requirement: line(t("General Liability "), t("$2M", true)),
      sourceClause: pin("§App-C", "solicitation", "§App-C"),
      category: "insurance",
      requiredValue: "$2M aggregate",
      firmValue: "—",
      status: "unknown",
      resolve: { kind: "insurance", coverage: "gl", requiredLimit: 2_000_000 },
    },
  ];

  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "2026-04-18",
    amendmentVersion: "0",
    meta: {
      stage: "complete",
      analyzedAt: "2026-05-07T08:56:00-05:00",
      checksRun: 12,
      sourcesConsulted: 4,
      freshnessLine: line(t("Analyzed just now.")),
      noticeType: "solicitation",
    },
    gateInputs: {
      setAside: { required: "SDVOSB", firmHolds: ["SDVOSB"], verified: true },
      naics: { code: "238160", sizeStandard: "$19.0M", firmIsSmall: true },
      sam: { activeThrough: "2027-01-31", awardWindowEnds: "2026-09-01" },
      license: { requiredState: "NC", firmLicensedStates: ["NC"] },
      clearance: { fcl: "Top Secret", personnel: "TS" },
    },
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: 0,
      ppqTurnaroundDays: 5,
      subQuoteDays: 0,
      writingDays: 5,
      passedEvents: [],
    },
    complianceMatrix,
    verdict: {
      value: "no-bid",
      path: "skip",
      gist: line(
        t("It needs a "),
        t("Top Secret clearance you can't get in time", true),
        t(". Nothing to do here this cycle."),
      ),
      headline: [
        line(t("This one's blocked before fit even matters", true), t(".")),
        line(
          t("It needs a Top Secret facility clearance", true),
          t(" — that requires a government sponsor and takes months, not weeks."),
        ),
        line(t("There's no way in on this cycle.", true)),
      ],
      confidence: {
        level: "high",
        openQuestions: 0,
        remedy: line(t("Nothing you tell me changes an FCL requirement.")),
      },
    },
    reads: [
      {
        id: 2,
        name: "Can you do the work?",
        status: "blocking",
        epistemic: "verified",
        order: 0,
        limiting: true,
        short: line(t("No — it needs a "), t("clearance you can't get in time", true), t(".")),
        sentence: line(
          t("Blocked on clearance", true),
          t(" — a Top Secret FCL you can't obtain in this window."),
        ),
        evidence: [pin("§L.6", "solicitation", "§L.6")],
        dossier: [
          line(
            t("A Top Secret facility clearance can't be bought — it needs a "),
            t("government sponsor", true),
            t(" and a full investigation."),
          ),
          line(
            t("That's a "),
            t("12+ month path", true),
            t(", far past this deadline. Nothing you submit now changes it."),
          ),
        ],
      },
    ],
    action: {
      path: "skip",
      primary: { label: "Back to your matches", target: "/opportunities" },
      secondaries: [{ label: "Add the gap to my Roadmap", target: "/roadmap" }],
      rationale: line(
        t("A facility clearance is a "),
        t("12+ month path", true),
        t(" — worth planning, not chasing here."),
      ),
      gapToWin: [
        { item: line(t("Top Secret facility clearance"), t(" (needs a sponsor)")), have: false },
      ],
    },
    postNoBidRoadmap: [
      {
        item: line(t("A "), t("cleared-work capability statement", true)),
        whyItMattered: line(
          t("Cleared buyers and primes vet your record before they'll sponsor anyone."),
        ),
        whatItTakes: line(t("A day with our team and your project history.")),
        cta: { kind: "dfy", service: "Capability Statement" },
      },
      {
        item: line(t("An "), t("FCL sponsor", true)),
        whyItMattered: line(
          t("A facility clearance needs a government or prime sponsor — you have none today."),
        ),
        whatItTakes: line(t("A prime relationship; a mentor can map the intro.")),
        cta: { kind: "mentor" },
      },
      {
        item: line(t("A "), t("federal past-performance record", true)),
        whyItMattered: line(t("Cleared primes want a track record before they bring you in.")),
        whatItTakes: line(t("One or two unclassified federal subs over the next year.")),
      },
    ],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          {
            glyph: "blocked",
            text: line(t("Top Secret FCL + cleared personnel required")),
            source: "§L.6",
          },
          { glyph: "ok", text: line(t("Set-aside: SDVOSB — you hold it")), source: "§A.2" },
        ],
      },
    ],
    findings: [],
    redTeam: [
      {
        challenge: line(t("Am I being too harsh on the clearance?")),
        resolution: line(
          t("No — a Top Secret FCL "),
          t("needs a government sponsor", true),
          t(" and months of investigation. There's no version of this you can rush."),
        ),
      },
      {
        challenge: line(t("Is there a sub path here, like Fort Bragg?")),
        resolution: line(
          t("No — cleared work means "),
          t("cleared personnel", true),
          t(", not just a cleared prime. Subbing doesn't get you in."),
        ),
      },
    ],
    citations: [pin("§L.6", "solicitation", "§L.6")],
    rail: {
      briefing: [
        line(
          t("This one's blocked.", true),
          t(" I ran "),
          t("12 checks", true),
          t(" and stopped at the clearance."),
        ),
        line(
          t("A Top Secret FCL", true),
          t(" needs a government sponsor and months of lead time."),
        ),
        line(t("Ask me anything, but there's no bid here this cycle.")),
      ],
      openQuestions: [],
      suggestedChips: [
        { slot: "doubt", label: "Why can't I get cleared in time?", kind: "ask" },
        { slot: "act", label: "What would put me in range?", kind: "ask" },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Sources Sought — path capped at Shape & watch
// ─────────────────────────────────────────────────────────────────────────────
function sourcesSought(opp: Opportunity): GrantAnalysis {
  const complianceMatrix: ComplianceRow[] = [
    {
      requirement: line(t("SDVOSB capability of interest")),
      sourceClause: pin("Notice", "solicitation", "Notice"),
      category: "eligibility",
      requiredValue: "SDVOSB roofers",
      firmValue: "verified ✓",
      status: "have",
    },
  ];

  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "2026-04-18",
    amendmentVersion: "0",
    meta: {
      stage: "complete",
      analyzedAt: "2026-05-07T08:56:00-05:00",
      checksRun: 8,
      sourcesConsulted: 3,
      freshnessLine: line(t("Analyzed just now.")),
      noticeType: "sources-sought",
    },
    gateInputs: {
      setAside: { required: null, firmHolds: ["SDVOSB"], verified: true },
      naics: { code: "238160", sizeStandard: "$19.0M", firmIsSmall: true },
      sam: { activeThrough: "2027-01-31", awardWindowEnds: "2026-08-01" },
      license: { requiredState: "NC", firmLicensedStates: ["NC"] },
    },
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: 0,
      ppqTurnaroundDays: 0,
      subQuoteDays: 0,
      writingDays: 2,
      passedEvents: [],
    },
    complianceMatrix,
    verdict: {
      value: "review",
      path: "shape-watch",
      gist: line(
        t("Not a bid yet — "),
        t("a quick response now puts you on the buyer's radar", true),
        t("."),
      ),
      headline: [
        line(t("This isn't a bid yet — it's your chance to shape it.", true)),
        line(
          t("Responding puts you on the radar", true),
          t(" at Fort Bragg DPW before the real solicitation drops."),
        ),
      ],
      confidence: {
        level: "medium",
        openQuestions: 1,
        remedy: line(t("Tell me your capability highlights and I'll shape the response.")),
      },
    },
    reads: [
      {
        id: 5,
        name: "Does it move you forward?",
        status: "strong",
        epistemic: "verified",
        order: 0,
        short: line(t("Yes — it gets you "), t("known at this buying office", true), t(".")),
        sentence: line(
          t("Relationship value beats the bid", true),
          t(" — the buying office learns you exist."),
        ),
        evidence: [pin("Notice", "solicitation", "Notice")],
        dossier: [
          line(
            t("This isn't a bid — it's the buying office "),
            t("asking who's out there", true),
            t("."),
          ),
          line(
            t("A short capability response gets your name in front of them and can "),
            t("shape the real RFP", true),
            t(" toward your strengths."),
          ),
        ],
      },
    ],
    action: {
      path: "shape-watch",
      primary: {
        label: "Respond to the Sources Sought",
        target: "/opportunities/" + opp.noticeId + "/respond",
      },
      secondaries: [{ label: "Set a recompete reminder", target: "/roadmap" }],
      rationale: line(
        t("A response here can "),
        t("shape the requirement", true),
        t(" toward what you do best."),
      ),
    },
    trail: [
      {
        title: "Reading the notice",
        checkCount: 4,
        items: [
          {
            glyph: "ok",
            text: line(t("Sources Sought — capability responses requested")),
            source: "Notice",
          },
          {
            glyph: "neutral",
            text: line(t("No award, no price — this shapes the future RFP")),
            source: "Notice",
          },
        ],
      },
    ],
    findings: [],
    citations: [pin("Notice", "solicitation", "Notice")],
    rail: {
      briefing: [
        line(t("This is a Sources Sought", true), t(", not a bid.")),
        line(t("Responding is cheap and "), t("puts you on the buyer's radar", true), t(".")),
        line(t("Want me to shape a response?")),
      ],
      openQuestions: [],
      suggestedChips: [
        { slot: "doubt", label: "Can I bid this?", kind: "ask" },
        { slot: "act", label: "What should my response say?", kind: "ask" },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Degraded run — a source (FPDS) was unreachable, so the competition read is
//     thin. Grant says so honestly instead of faking a complete analysis (§10).
// ─────────────────────────────────────────────────────────────────────────────
function degradedRfi(opp: Opportunity): GrantAnalysis {
  return {
    id: `grant-${opp.noticeId}`,
    opportunityId: opp.noticeId,
    firmProfileVersion: "2026-04-18",
    amendmentVersion: "0",
    degradation: {
      source: "FPDS",
      affected: line(
        t("the "),
        t("competition read is thinner than usual", true),
        t(", so I can't size the field yet."),
      ),
      note: line(t("Everything else is solid — I'll refresh that read when the source is back.")),
    },
    meta: {
      stage: "degraded",
      analyzedAt: "2026-05-07T08:56:00-05:00",
      checksRun: 6,
      sourcesConsulted: 4,
      freshnessLine: line(t("Analyzed just now.")),
      noticeType: "rfi",
    },
    gateInputs: {
      setAside: { required: null, firmHolds: ["SDVOSB"], verified: true },
      naics: { code: "238160", sizeStandard: "$19.0M", firmIsSmall: true },
      sam: { activeThrough: "2027-01-31", awardWindowEnds: "2026-08-01" },
      license: { requiredState: "NC", firmLicensedStates: ["NC"] },
    },
    realDeadlineInputs: {
      responseDue: opp.closesAt,
      bondingLeadDays: 0,
      ppqTurnaroundDays: 0,
      subQuoteDays: 0,
      writingDays: 1,
      passedEvents: [],
    },
    complianceMatrix: [
      {
        requirement: line(t("SDVOSB roofing capability")),
        sourceClause: pin("Notice", "solicitation", "Notice"),
        category: "eligibility",
        requiredValue: "roofing know-how",
        firmValue: "verified ✓",
        status: "have",
      },
    ],
    verdict: {
      value: "review",
      path: "shape-watch",
      gist: line(
        t("Worth a quick response — but I "),
        t("couldn't size the competition", true),
        t(" (FPDS was down)."),
      ),
      headline: [
        line(t("An RFI is free intel and a chance to shape the real solicitation.", true)),
      ],
      confidence: {
        level: "low",
        openQuestions: 0,
        remedy: line(t("I'll firm this up once I can reach FPDS again.")),
      },
    },
    reads: [
      {
        id: 1,
        name: "Can you win it?",
        status: "unknown",
        epistemic: "unknown",
        order: 0,
        short: line(t("Can't tell yet — "), t("FPDS was unreachable", true), t(".")),
        sentence: line(
          t("Competition unknown", true),
          t(" — I couldn't pull the incumbent or offer counts. This read is thin."),
        ),
        evidence: [],
        dossier: [
          line(
            t("FPDS was down when I ran, so I "),
            t("can't size the field", true),
            t(" or name an incumbent."),
          ),
          line(t("I'll re-run that check when the source is back — the rest of the read holds.")),
        ],
      },
      {
        id: 5,
        name: "Does it move you forward?",
        status: "strong",
        epistemic: "verified",
        order: 1,
        short: line(t("Yes — it gets you "), t("in front of USACE Wilmington", true), t(".")),
        sentence: line(
          t("Relationship value is real", true),
          t(" — responding puts your name in front of the buying office."),
        ),
        evidence: [pin("Notice", "solicitation", "Notice")],
      },
    ],
    action: {
      path: "shape-watch",
      primary: {
        label: "Respond to the RFI",
        target: "/opportunities/" + opp.noticeId + "/respond",
      },
      secondaries: [{ label: "Set a recompete reminder", target: "/roadmap" }],
      rationale: line(
        t("A strong RFI response can "),
        t("shape the requirement", true),
        t(" toward your strengths."),
      ),
    },
    trail: [
      {
        title: "Reading the notice",
        checkCount: 4,
        items: [
          { glyph: "ok", text: line(t("RFI — market research, no award")), source: "Notice" },
          {
            glyph: "warn",
            text: line(t("FPDS unreachable — competition not sized")),
            source: "FPDS",
          },
        ],
      },
    ],
    findings: [],
    citations: [pin("Notice", "solicitation", "Notice")],
    rail: {
      briefing: [
        line(t("This is an RFI", true), t(" — free intel, not a bid.")),
        line(
          t("Heads up: "),
          t("FPDS was down", true),
          t(", so I couldn't size the competition this run."),
        ),
        line(t("Want me to shape a response?")),
      ],
      openQuestions: [],
      suggestedChips: [
        {
          slot: "doubt",
          label: "Why couldn't you size the competition?",
          kind: "ask",
        },
        { slot: "act", label: "What should my response say?", kind: "ask" },
      ],
    },
  };
}

export const GRANT_FIXTURES: Record<string, (opp: Opportunity) => GrantAnalysis> = {
  "W912EE-26-R-0066": fortBragg,
  "SP4701-26-R-0078": campMackall,
  "DEMO-SPECIAL-02": sourcesSought,
  "DEMO-SPECIAL-03": degradedRfi,
};
