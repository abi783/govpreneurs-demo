// Grant — the bid/no-bid analysis surface. Shared state contract.
//
// ONE GrantAnalysis object carries the data for every canvas block (①–⑦) and
// the rail, so the contract is stable across all 8 design phases (PRD 96 §13).
// Phases 1–2 RENDER only: the shell/layout, the streaming skeleton, the Gate
// Strip ①, and the Real Deadline. The verdict/reads/action/trail/rail fields
// are present in the fixtures now; their polished UI lands in later phases.
//
// Deterministic parts (Gate Strip, Real Deadline) are COMPUTED IN CODE from the
// `*Inputs` fields by pure functions — never by a model (PRD 97 §S1, §6.5).
//
// Epistemic states are THREE, on purpose: a first-time SMB owner should never
// meet a fourth "inferred" label (fails the simplicity bar, PRD 96 §12.9). A
// judgment call is carried as plain hedged wording + a source pin, not a badge.

export type Verdict = "bid" | "review" | "no-bid"; // a WORD, never a number (§11.1, §12.10)
export type CapturePath = "prime" | "sub" | "shape-watch" | "skip"; // co-equal to the verdict (§4a)

/** Verified = source of truth · Stated = in the solicitation, unconfirmed against the firm ·
 *  Unknown = Grant doesn't know and names the question that resolves it (a designed state, §12.4). */
export type EpistemicState = "verified" | "stated" | "unknown";

export type NoticeType = "solicitation" | "sources-sought" | "rfi" | "presolicitation";
/**
 * "unanalyzed" is the state before any run: no analysis exists for this member
 * and opportunity. It is distinct from "failed" (a run that broke) — nothing was
 * attempted. Modelled explicitly so the UI cannot mistake an absent analysis for
 * a finished one, which is how a fixture-generated take once reached members.
 */
export type RunStage =
  | "unanalyzed"
  | "investigating"
  | "complete"
  | "degraded"
  | "failed";
export type ReadStatus = "strong" | "mixed" | "weak" | "blocking" | "unknown";

/** Every colored signal pairs a hue with a glyph so it survives grayscale (§11 global rule). */
export type Tone = "ok" | "warn" | "blocked" | "confirm" | "neutral";

// ─── Provenance & pins — every claim carries one; no pin, no ship (§12.3) ───
//
// Sources come in three GEOMETRIES, and each needs a different locator:
//   • a document is located in SPACE      → section, page
//   • a record is located in STRUCTURE    → which field
//   • a conversation is located in TIME   → who said it, and when
// `chat` and `transcript` are the third geometry: the member's own words to an
// agent, and what was said on a mentor call.
export type ProvenanceType =
  | "solicitation"
  | "fpds"
  | "sam"
  | "web"
  | "profile"
  | "computed"
  | "chat"
  | "transcript"
  // The FOURTH geometry (public-records-PRD.md): a claim resting on a government
  // REGISTER. The object type rides in the `ref` (`award:<id>#<fields>`,
  // `tally:<name>`) rather than in this union, so adding a register stays cheap —
  // no Record<ProvenanceType, X> map anywhere needs a new entry. `fpds` is the
  // pre-existing spelling of the same thing and still resolves.
  | "public";

/** The passage that backs a claim, plus enough of what surrounds it that a
 *  reader can see it wasn't cherry-picked. `span` is the highlighted text;
 *  `before`/`after` are rendered dimmed around it.
 *
 *  This is the contract with retrieval: the retriever must return the
 *  surrounding context, not just the matched chunk. When absent, the sheet
 *  falls back to the bare quote and says so; it never dead-ends. */
export interface Excerpt {
  before?: string;
  span: string;
  after?: string;
}

/** One utterance. `role` drives the visual treatment: the member's own words
 *  read differently from an agent's prompt or a mentor's advice. */
export interface Turn {
  id: string;
  speaker: string; // "You", "Hunter", "Diana Potts"
  role: "member" | "agent" | "mentor";
  /** Position in time: an ISO instant for chat, "14:32" for a call. */
  at?: string;
  text: string;
}

/** A conversation source — a chat exchange, or a stretch of a call transcript.
 *
 *  WHY THE SURROUNDING TURNS ARE NOT OPTIONAL HERE: a sentence in a document is
 *  rarely reversed by the sentence next to it. A sentence in conversation
 *  constantly is — "$2M" means nothing without the question that prompted it,
 *  and "yes, we can do that" can be undone by the next breath. The legal system
 *  settled this a long time ago: Federal Rule of Evidence 106, the rule of
 *  completeness, exists so that a quoted statement cannot mislead by omission.
 *  We hold quoted speech to the same standard.
 *
 *  Deposition practice also tells us what a citation must answer: WHO spoke,
 *  WHERE the words fall, WHEN it happened, and WHAT source it came from. That is
 *  exactly the locator this type carries. */
export interface Conversation {
  channel: "hunter" | "grant" | "mentor-call";
  /** "Positioning call with Diana", or omitted for an ongoing chat. */
  title?: string;
  occurredAt: string; // ISO
  /** The cited turn plus enough either side to satisfy the rule above. */
  turns: Turn[];
  citedTurnId: string;
  /** True when the cited turn was a direct answer to a direct question, so it
   *  carries the weight of an attestation rather than a passing remark. Only
   *  attested turns should be used to back a claim. */
  attested?: boolean;
  /** What WE concluded from this exchange. Rendered in AI chrome, separately
   *  from the verbatim turns — what someone said and what we inferred from it
   *  must never share a surface. */
  learning?: string;
  learningBy?: string; // "Grant, from the recording"
  /** Timestamp to resume the recording at, e.g. "14:32". */
  playAt?: string;
}

export interface Provenance {
  type: ProvenanceType;
  ref: string; // "§L.3.2" | "FPDS W912PM-19-C-0043" | "profile.bidderProfile.insuranceBonding" | URL
  quote?: string; // verbatim source text, shown in the provenance popover
  retrievedAt?: string; // ISO — for web/fpds freshness
  /** Passage + surrounding context, for the document body of the source sheet. */
  excerpt?: Excerpt;
  /** Human-readable coordinate: "Section L · Instructions to offerors · p.14". */
  locator?: string;
  /** Set when the source is known to be unreadable, so the sheet can say why
   *  instead of showing an empty body. */
  unavailable?: { reason: string; usedInAnalysis: boolean };
  /** Present on `chat` and `transcript` pins — the thread body of the sheet. */
  conversation?: Conversation;
  /** Present on an `award:` ref — the register row behind the claim. */
  award?: AwardCitation;
  /** Present on a `tally:` ref — a figure counted over many register rows,
   *  with the basis that makes it a finding rather than an assertion. */
  tally?: AwardTally;
  /** Present on an `entity:` ref — one registered contractor. */
  entity?: EntityCitation;
  /** Present on a `buyer:` ref — one contracting office. */
  buyer?: BuyerCitation;
  /** Present on a `subaward:` ref — what a prime reported paying its subs. */
  subaward?: SubawardCitation;
  /** Present on a `vehicle:` ref — one contract vehicle. */
  vehicle?: VehicleCitation;
  /** Present on a `forecast:` ref — one agency forecast. */
  forecast?: ForecastCitation;
}

/** One registered contractor — mirrors the backend EntityCitation. `certified`
 *  per business type is load-bearing: SAM distinguishes a SELF-CERTIFIED claim
 *  from a certified one, and that difference decides whether a set-aside bid is
 *  responsive. */
export interface EntityCitation {
  awardeeKey: number | null;
  name: string | null;
  legalName: string | null;
  uei: string | null;
  cageCode: string | null;
  basedIn: string | null;
  primaryNaics: string | null;
  primaryNaicsDescription: string | null;
  busTypes: { label: string; certified: boolean }[];
  registrationExpires: string | null;
  yearFounded: string | null;
  awardsOnRecord: number | null;
  totalAwarded: number | null;
  asOf: string | null;
}

/** One AGENCY FORECAST — mirrors the backend ForecastCitation. The only
 *  forward-looking register, and still a record: the agency published it.
 *  `contractingOfficer` sits on only ~6% of rows. */
export interface ForecastCitation {
  oppKey: string | null;
  title: string | null;
  agencyName: string | null;
  agencyKey: number | null;
  forecastType: string | null;
  expectedDate: string | null;
  estValueLow: number | null;
  estValueHigh: number | null;
  contractingOfficer: string | null;
  naicsCode: string | null;
  setAside: string | null;
  popState: string | null;
  alsoUpcoming: number | null;
  asOf: string | null;
}

/** One contract VEHICLE — mirrors the backend VehicleCitation. `whoCanUse`
 *  decides whether the member can use it at all. */
export interface VehicleCitation {
  vehicleKey: number | null;
  name: string | null;
  vehicleType: string | null;
  whoCanUse: string | null;
  sharedCeiling: number | null;
  lastDateToOrder: string | null;
  setAside: string | null;
  naicsCode: string | null;
  sponsorAgency: string | null;
  associatedSolicitation: string | null;
  asOf: string | null;
}

/** What a prime reported paying its SUBCONTRACTORS — mirrors the backend
 *  SubawardCitation. Upstream is federal subcontract reporting, not SAM. */
export interface SubawardCitation {
  primeKey: number | null;
  primeName: string | null;
  subCount: number | null;
  awardCount: number | null;
  totalSubcontracted: number | null;
  mostRecent: string | null;
  subs: { name: string; awards: number | null; total: number | null }[];
  asOf: string | null;
}

/** One contracting office — mirrors the backend BuyerCitation. */
export interface BuyerCitation {
  agencyKey: number | null;
  name: string | null;
  abbreviation: string | null;
  agencyType: string | null;
  isDefense: boolean;
  parents: string[];
  buys: { code: string; description: string | null; awards: number }[];
  awardsExamined: number | null;
  setAsideAwards: number | null;
  officers: number | null;
  asOf: string | null;
}

export interface AwardTally {
  kind: "comparable-awards" | "field-size" | "market-winners" | "sub-use";
  /** The headline number, raw — this file's job is data, the descriptor formats. */
  figure: number;
  low: number | null;
  high: number | null;
  /** How many records the figure was counted over. */
  countedOver: number;
  /** The filter actually applied — never one that wasn't. */
  matchedOn: string;
  /** Observed award-year span of the counted rows, e.g. "FY2016–FY2024". */
  yearsCovered: string | null;
  /** A few of the actual rows, so the figure can be spot-checked. */
  sample: AwardCitation[];
  /** Rows for a tally whose unit is not an award — market-winners counts FIRMS. */
  firms?: { name: string; awards: number; totalValue: number | null }[];
  /** Rows for a sub-use tally — the subcontractors counted. */
  subs?: { name: string; awards: number | null; total: number | null }[];
  /** When our copy of the register was last synced — freshness, not coverage. */
  asOf: string | null;
}

/**
 * A past federal award, as a citable RECORD rather than a link.
 *
 * Mirrors `AwardCitation` in the backend's grant-analysis contract. There is no
 * agency-issued URL for an award — every URL on the underlying vendor row points
 * at HigherGov — so the citation is the award itself: the facts we read, plus the
 * FPDS award id, a real public identifier a member can check in any federal
 * system. `sourceUrl` is the rare exception (~3% of awards): the ISSUING
 * AGENCY's posting, resolved through our own opportunities collection.
 */
export interface AwardCitation {
  awardId: string;
  title: string | null;
  description: string | null;
  awardeeName: string | null;
  agencyName: string | null;
  naicsCode: string | null;
  naicsDescription: string | null;
  value: number | null;
  offers: number | null;
  fiscalYear: number | null;
  actionDate: string | null;
  setAside: string | null;
  extentCompeted: string | null;
  popState: string | null;
  solicitationId: string | null;
  sourceUrl: string | null;
  /** When our copy of this register row was last synced — freshness, not the
   *  period the award covers. */
  asOf: string | null;
}

export interface Pin {
  label: string; // short, tappable: "§App-A", "FPDS W912…", "Your profile"
  provenance: Provenance;
}

/** A run of text with an optional bold span. Exactly ONE bold segment per line
 *  should carry the consequence, so a user scanning only bold reaches the right
 *  decision (§11 global rules, §12.12). */
export interface Segment {
  text: string;
  bold?: boolean;
}
export type RichLine = Segment[];

// ─── ① Gate Strip + Real Deadline — DETERMINISTIC (computed from these inputs) ───

export interface GateInputs {
  setAside: { required: string | null; firmHolds: string[]; verified: boolean };
  naics: { code: string; sizeStandard: string; firmIsSmall: boolean };
  sam: { activeThrough: string | null; awardWindowEnds: string };
  license: { requiredState: string | null; firmLicensedStates: string[] };
  clearance?: { fcl?: string | null; personnel?: string | null; cmmc?: string | null };
}

export interface RealDeadlineInputs {
  responseDue: string | null; // ISO — the date on the notice; null = not published
  bondingLeadDays: number;
  ppqTurnaroundDays: number;
  subQuoteDays: number;
  writingDays: number;
  /** Mandatory events already in the past hard-stop the real deadline (§3). */
  passedEvents: { label: string; date: string }[];
}

/** S1's compliance_matrix backbone (PRD 97 §S1). Every eligibility/submission
 *  requirement is one atomic row; this object powers BOTH the Gate Strip and the
 *  Compliance Matrix artifact ⑥b, so the two can never disagree (§8, §11.4). */
export interface ComplianceRow {
  requirement: RichLine; // "Professional Liability $2M" — the number bolded
  sourceClause: Pin; // clickable clause ref
  category:
    | "eligibility"
    | "insurance"
    | "bonding"
    | "clearance"
    | "artifact"
    | "license"
    | "submission"
    | "cert";
  requiredValue: string;
  firmValue: string; // "$1M on file" | "none on file" | "—"  (computed for `resolve` rows)
  status: "have" | "missing" | "confirm" | "unknown"; // (computed for `resolve` rows)
  /** Drives the hard-gates-never-sell rule: an unclosable block offers only the exit (§3, §12.6). */
  closableInWindow?: boolean;
  /** When present, `firmValue` + `status` are computed against the live firm profile
   *  (the Gate Strip reads the profile, PRD 97 §S1/§4). Absent ⇒ authored directly. */
  resolve?:
    | {
        kind: "insurance";
        coverage:
          | "gl"
          | "professional-eo"
          | "tech-eo"
          | "cyber"
          | "auto"
          | "workers-comp"
          | "umbrella";
        requiredLimit: number;
      }
    | { kind: "bonding"; requiredAmount: number };
}

// ── Computed outputs (produced by computeGates / computeRealDeadline) ──

export interface RealDeadline {
  /** Passthrough of the input — null when the notice has no published date. */
  responseDue: string | null;
  realDeadline: string | null;
  noticeDays: number;
  realRunwayDays: number;
  /** `phrase` is the words the sentence uses for the row ("past-performance forms"). */
  deductions: { label: string; phrase: string; days: number }[];
  passedEvents: { label: string; date: string; missed: boolean }[];
  status: "ok" | "tight" | "blocked";
  sentence: RichLine; // "The notice says 18 days. After 5 days for past-performance forms and 3 for writing, you have 10."
}

export interface GateLight {
  question: string; // "Can you legally bid this?"
  tone: Tone;
  word: string; // "Clear" | "Blocked" | "Confirm" | "Tight" | "Yes"
  glyph: string; // paired glyph name (e.g. "check", "x", "help", "alert-triangle")
  reason: RichLine;
  blocker?: {
    gate: string;
    unlockPath: string;
    closableInWindow: boolean;
    timeToClear: string;
  };
  evidence: Pin[];
}

export interface GateStrip {
  legal: GateLight; // "Can you legally bid this?"
  submittable: GateLight; // "Can you get a compliant bid in?"
  /** A hard fail dominates the panel and de-emphasizes the rest — no pillar theater (§3). */
  dominated: boolean;
}

// ─── ② Verdict card (data present now; UI Phase 3) ───

// ─── Typed warnings (Diana evolution) — the verdict carries up to four distinct
//     warning classes, each demanding a different member response (grant-chair §6).
//     "winning-hurts" is the subtle one: a caution, NOT a rejection or disqualifier. ───
export type WarningKind = "disqualifier" | "responsibility" | "proposal-weakness" | "winning-hurts";
export interface TypedWarning {
  kind: WarningKind;
  summary: RichLine; // one plain-language line
}

export interface VerdictCard {
  value: Verdict;
  path: CapturePath;
  /** The single plain-language reason, Grant's voice, ≤2 lines — the hero sentence
   *  a low-English reader gets in one glance. `headline` is the fuller "why" below. */
  gist: RichLine;
  /** Diana evolution: typed warnings, each rendered in a distinct treatment (§C1). */
  warnings?: TypedWarning[];
  headline: RichLine[]; // 2–3 sentences, one bold clause each
  /** DEMO: what would change the call, one condition per line ("If … I would move this to …"). */
  wouldChange?: RichLine[];
  /** Diana evolution: the named primary competitive risk — replaces the win-% / "real
   *  shot". Rendered as "Your profile aligns with the stated evaluation factors and the
   *  historical award environment. Your primary competitive risk is [risk]." (§C3) */
  competitiveRisk?: RichLine;
  confidence: {
    level: "high" | "medium" | "low";
    /** DEMO: how many of the five dots to light (1–5). The level alone gives 5, 3 or 1. */
    dots?: number;
    openQuestions: number;
    remedy: RichLine; // "Answer the bonding one and I can call it."
    softCap?: Verdict; // "I can't call this above Review until I know your bonding" (§10)
  };
}

// ─── ③ The five reads (data present now; UI Phase 4) ───

export interface Read {
  id: number; // 1–7 canonical read position (Diana evolution grew five reads to seven)
  /** Constant across opportunities so the framework stays learnable (§5). */
  name: string;
  status: ReadStatus;
  epistemic: EpistemicState;
  sentence: RichLine; // one personalized sentence, one bold consequence phrase
  /** ≤8-word plain answer for the compact "Why" glance layer (the ESL reader).
   *  Falls back to the sentence's first bold phrase if absent. */
  short?: RichLine;
  evidence: Pin[];
  /** Canonical display position (0-based). Reads render in this order (Diana: the
   *  seven-read sequence is fixed; the limiting read is emphasized in place, not moved). */
  order: number;
  /** The single decision-limiting read — foregrounded with a hairline accent. */
  limiting?: boolean;
  dossier?: RichLine[]; // ⑥ full-analysis expansion (Phase 6)
}

// ─── ④ Action block (data present now; UI Phase 5) ───

export interface ActionBlock {
  path: CapturePath;
  primary: { label: string; target: string }; // position is fixed across opps (§12.2)
  secondaries: { label: string; target: string; price?: number }[];
  rationale: RichLine;
  gapToWin?: { item: RichLine; have: boolean }[]; // bold noun each; → Add to Roadmap
}

// ─── ⑤ Glass box — the investigation trail (data present now; UI Phase 6) ───

export interface TrailItem {
  glyph: Tone;
  text: RichLine;
  source: string; // right-aligned mono ref, e.g. "§L.5.1", "FPDS W912…"
}
export interface TrailGroup {
  title: string; // "Reading the solicitation" — never a sub-agent name (§12.8)
  checkCount: number;
  items: TrailItem[];
}

// ─── Findings — raw structured returns the rail retrieves from (Phase 7). ───
// PRD 97 §3 envelope. NOT populated in Phases 1–2 (fixtures set `findings: []`);
// included so the contract is stable and the rail can be built without a re-shape.
export interface FindingClaim {
  key: string;
  value: string;
  epistemicState: EpistemicState;
  provenance: Provenance;
  confidence: number; // 0..1
}
export interface Finding {
  specialist: string; // internal only — never surfaced to the user (§12.8)
  claims: FindingClaim[];
  gaps: { question: string; whyItMatters: string; verdictSwing: number }[];
  readContribution: { read: 1 | 2 | 3 | 4 | 5; status: ReadStatus; why: string };
}

// ─── The rail — Interviewer output + opening briefing (data now; UI Phase 7) ───

export interface OpenQuestion {
  id: string;
  question: RichLine; // "What's your bonding capacity?"
  payoff: RichLine; // the VOI, stated: "Moves this from a maybe to a yes-or-no."
  verdictSwing: number; // 0..1 — ranks the queue
  input: { kind: "currency" | "yesno" | "date" | "text"; config?: unknown };
  status: "open" | "answered" | "skipped";
  /** The plain noun the Improve chip names ("Answer the bonding question", §8.2). */
  chipNoun?: string;
}

/** An answered open question surfaced back to the rail so the member can revise
 *  it. `id` is the interviewer's stable questionId — re-answering overwrites. */
export interface AnsweredQuestionCard {
  id: string;
  question: RichLine;
  /** The member's current stored answer. */
  value: string;
}

// ─── Suggested chips (Doc 132) — the three questions under the rail thread, in
//     fixed decision-stage order: doubt → improve → act. Selection is deterministic
//     backend code (resolveSuggestedChips); a chip ships only when the analysis can
//     back it, and the strip is never padded to three. Mirror of the backend type. ───
export type ChipSlot = "doubt" | "improve" | "act";

export interface SuggestedChip {
  slot: ChipSlot; // fixed render order: doubt → improve → act
  label: string; // what the member SEES; ≤ 8 words, reworded by Block B. Never "ask a question".
  query?: string; // what an `ask` chip actually SENDS — pinned to the original wording (PR #25)
  kind: "ask" | "elicit" | "route"; // ask Grant · focus the card · navigate
  target?: string; // kind="elicit": the OpenQuestion id · kind="route": the nav path
  search?: Record<string, unknown>; // kind="route": optional search params
}

// ─── Red Team — the adversarial pass, surfaced honestly (§11.5, §14 q2). Each is
//     a challenge Grant put to his own read, and how he resolved it. ───
export interface RedTeamObjection {
  challenge: RichLine; // the adversarial question ("Is the incumbent really beatable?")
  resolution: RichLine; // how it was settled, with the evidence — one bold verdict phrase
}

// ─── Degradation — a source was unreachable, so a read is thinner than usual.
//     Honest partial-analysis handling (Doc 96 §10 states), never a silent gap. ───
export interface DegradationInfo {
  source: string; // the source that failed: "FPDS", "SAM.gov"
  affected: RichLine; // which read is thinner and why
  note?: RichLine; // what happens next ("I'll refresh when it's back")
}

// ─── Section-Coverage ledger (Diana / am-section-coverage-ledger) — the member-visible
//     proof that the WHOLE solicitation was reviewed. Every UCF section A–M is tagged with
//     its reviewing specialist(s), a one-line finding, and a coverage state. Any non-complete
//     ("open coverage") state is flagged and blocks a confident Bid (Red Team gate). ───
export type CoverageState =
  | "reviewed_complete" // fully analyzed, nothing outstanding
  | "reviewed_with_findings" // analyzed; issues surfaced
  | "present_not_owned" // section exists but no specialist owns it — flag
  | "incorporated_by_reference" // e.g. a FAR clause cited but not expanded — open
  | "attachment_dependent" // depends on an attachment that must be opened — open
  | "incomplete" // started but could not fully analyze — open
  | "not_applicable" // genuinely N/A for this opportunity
  | "missing"; // referenced but not present — flag

export interface SectionCoverage {
  section: string; // "A".."M" | "attachment-3" | "amendment-2"
  title: string; // "Solicitation / Contract Form"
  owners: string[]; // reviewing specialists, e.g. ["S1", "S9"]
  finding: RichLine; // one-line finding
  state: CoverageState;
}

// ─── Post-No-Bid roadmap (Diana / S8) — a No-Bid is never delivered cold: "you're not
//     ready for THIS one today; here's the ordered list of what to fix to be positioned
//     for the next." Each item names what it is, why it mattered here, and what closing it
//     takes. A gap that maps to a real DFY service gets a "Have us do it" CTA; a strategy
//     moment gets a "Send to Mentor" referral; the rest are plain (never a fake CTA, §C6). ───
export interface RoadmapItem {
  item: RichLine; // what it is
  whyItMattered: RichLine; // why it mattered here
  whatItTakes: RichLine; // roughly what closing it takes
  /** A real DFY service (resolved to a price via dfyServices — an unknown service falls
   *  back to a mentor referral, never a fake CTA) or an explicit mentor moment. */
  cta?: { kind: "dfy"; service: string } | { kind: "mentor" };
}

// ─── Amendment — a solicitation change Grant read and re-ran against (§5, §8) ───
export interface AmendmentInfo {
  label: string; // "Amendment 2"
  postedAt: string; // human-legible: "yesterday", "2 days ago"
  summary: RichLine; // what the amendment changed
  impact: RichLine; // how Grant's read moved after re-running
}

// ─── The published analysis ───

export interface GrantAnalysis {
  id: string;
  opportunityId: string;
  firmProfileVersion: string;
  amendmentVersion: string;
  /** Present when the notice was amended since first analysis — surfaces a banner. */
  amendment?: AmendmentInfo;
  /** Present when meta.stage is "degraded" — a source failed and a read is thinner. */
  degradation?: DegradationInfo;
  /** Rendered as a first-class element on a No-Bid — the ordered "fix to be positioned
   *  next time" list (S8). Never deliver a cold No-Bid (§C4). */
  postNoBidRoadmap?: RoadmapItem[];
  /** The A–M section-coverage ledger, shown in the glass box — proof the whole
   *  solicitation was reviewed; open-coverage rows are flagged (§C5). */
  sectionCoverage?: SectionCoverage[];
  meta: {
    stage: RunStage;
    /** ISO, or null when stage is "unanalyzed" — there is no time it ran. */
    analyzedAt: string | null;
    checksRun: number;
    sourcesConsulted: number;
    freshnessLine: RichLine;
    noticeType: NoticeType;
  };

  // ① deterministic — computed from these inputs in Phase 2
  gateInputs: GateInputs;
  realDeadlineInputs: RealDeadlineInputs;
  complianceMatrix: ComplianceRow[];

  // ②–⑤ present now, UI later phases
  verdict: VerdictCard;
  reads: Read[];
  action: ActionBlock;
  trail: TrailGroup[];
  findings: Finding[];
  /** The adversarial pass, shown in the full-analysis layer (§14 q2). */
  redTeam?: RedTeamObjection[];
  citations: Pin[]; // ⑦ anchors into the source doc

  // rail (Phase 7)
  rail: {
    briefing: RichLine[]; // the three-line opening (§9.2)
    openQuestions: OpenQuestion[];
    /** Answered questions with their current values — the edit affordance. */
    answeredQuestions?: AnsweredQuestionCard[];
    suggestedChips: SuggestedChip[]; // doubt → improve → act (Doc 132); 1–3, never padded
  };
}
