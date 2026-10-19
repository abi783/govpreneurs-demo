import { apiFetch, API_BASE_URL } from "./api";

export interface HunterFilterDelta {
  states?: string[];
  cities?: string[];
  setAsides?: string[];
  valueRange?: { min: number | null; max: number | null };
  dueWindow?: string[];
  naics?: string[];
  noticeTypes?: string[];
  /** An older backend may still send this. The feed holds contracts only,
   *  so it has no type filter and ignores the field. */
  categories?: string[];
  vehicles?: string[];
  postedWithin?: number;
  scope?: { fed: boolean; sled: boolean };
  dodOnly?: boolean;
  civilianOnly?: boolean;
  search?: string;
}

export interface DiscoveryPayload {
  filters: HunterFilterDelta;
  note: string | null;
  /** Replace the client's filters entirely (profile/clear queries) vs. merge (refine). */
  fresh?: boolean;
  /** DEMO: open this tab before the filters apply. Hunter sends it when the filters
   *  leave nothing on the tab the member is on, but leave results on another tab. */
  tab?: FeedTab;
}

/** Column identity in the comparison table header. */
export interface CompareCol {
  oppKey: string;
  title: string;
  agency: string | null;
  location: string | null;
}

/** One compared dimension; `winner` is the index of the leading opp (or null). */
export interface CompareRow {
  field: string;
  values: string[];
  winner: number | null;
  /** An optional second line PER CELL, parallel to `values` — the runway under
   *  a deadline, the basis under a counted figure. `null` where a cell has
   *  nothing to add, and the whole array is absent where no cell does.
   *
   *  A note may only explain the value above it. It is never a place to put a
   *  figure the value itself could not support. */
  notes?: (string | null)[];
}

/** Calibrated recommendation across the compared opps. */
export interface CompareVerdict {
  winnerOppKey: string;
  winnerTitle: string;
  strengthPct: number; // drives the bar width only — not shown as a number
  strengthLabel: string;
}

export interface ComparePayload {
  opps: CompareCol[];
  rows: CompareRow[];
  verdict: CompareVerdict;
  tradeoff: string;
}

/** Overall eligibility outcome for a single opportunity. */
export type EligibilityVerdict = "eligible" | "certify_to_qualify" | "ineligible";

/** One eligibility dimension (set-aside, NAICS, location, deadline). */
export interface EligibilityRow {
  field: string;
  value: string;
  status: "pass" | "warn" | "fail" | "neutral";
}

/** `check_eligibility` payload — a single opportunity's eligibility verdict. */
export interface EligibilityPayload {
  oppKey: string;
  title: string;
  agency: string | null;
  verdict: EligibilityVerdict;
  verdictLabel: string;
  soleSource: boolean;
  rows: EligibilityRow[];
  note: string | null;
}

/** The feed tabs Hunter can switch between (internal ids): For You | Explore | Saved. */
export type FeedTab = "for_you" | "all" | "saved";

/** The page the member talks to Hunter from. The backend declares the same union
 *  as `HunterSurface` in `hunter-chat.types.ts`, and reads a missing value as `feed`. */
export type HunterSurface = "feed" | "forecasts";

/** `switch_tab` payload — move the feed to another tab. */
export interface SwitchTabPayload {
  tab: FeedTab;
}

/** `save_opportunity` payload — the opp keys whose saved-state just changed. */
export interface SaveOpportunityPayload {
  saved: string[];
  unsaved: string[];
}

/** Match tier used by the matching-v2 engine (`get_best_matches` chat tool). */
export type MatchesTier = "priority" | "strong" | "stretch" | "low";

/** One scored opportunity row in a `get_best_matches` result. */
export interface MatchesRow {
  oppKey: string;
  title: string;
  tier: MatchesTier;
  matchReasons: string[]; // max 3
  dueDate: string | null; // ISO string
  agency: string | null;
  /** The record's HigherGov source type. Absent from an older backend. */
  sourceType?: string | null;
}

/** `get_best_matches` payload — a ranked shortlist of the user's best-fit opportunities.
 *  Score/total are intentionally omitted here — the backend keeps them for the
 *  LLM's own reasoning, but never surfaces raw scores/counts to the UI. */
export interface MatchesPayload {
  rows: MatchesRow[];
}

/** One catalog-backed DFY service offer resolving a readiness gap. Carries the
 *  service name/benefit/turnaround + the always-coexisting DIY route — NEVER a
 *  price (the flat mentor fee is the only monetary figure Act may surface). */
export interface DfyOffer {
  slug: string;
  name: string;
  benefit?: string;
  turnaround?: string;
  /** Success Center destination for the DIY route (resolved to a URL by the
   *  client — the portal has no per-service page and is reached via a
   *  location-scoped GHL custom-menu link). */
  selfServeDestination: SelfServeDestination | null;
  externalGuidance: string | null;
}

/** A self-serve certification route (certs are never sold as a DFY service). */
export interface SelfServeRoute {
  cert: string;
  label: string;
  authority: "sba" | "vetcert" | "state_local" | "generic";
  url: string;
  guidance: string;
  mentorOptional: boolean;
}

/** One ordered bid-readiness step, marked done or still to-do. */
export interface BidChecklistItem {
  label: string;
  done: boolean;
}

/** The kind of readiness gap the act agent resolves. */
export type GapKind =
  | "set_aside"
  | "llc"
  | "sam"
  | "capability"
  | "sled"
  | "sbs"
  | "prime"
  | "govcompliant";

/** Where a DIY self-serve route sends the member (mirrors the backend union). */
export type SelfServeDestination = "roadmap";

/** `act` payload — gap resolution for a member/opportunity pair, rendered as the
 *  ActCard under the reply: ≤2 DFY offers (no price), an optional self-serve cert
 *  route + flat mentor fee, and a bid-checklist. */
export interface ActPayload {
  gap: {
    kind: GapKind;
    oppKey: string | null;
    title: string | null;
    verdict?: EligibilityVerdict;
    setAsideName: string | null;
    note: string | null;
  };
  trustLevel: "high" | "medium" | "low";
  offers: DfyOffer[];
  selfServe?: SelfServeRoute;
  bidChecklist?: BidChecklistItem[];
  mentorFeeUSD?: number;
}

/** One cited web source backing a `web_research` answer. `index` is the 1-based
 *  marker referenced inline in the answer as `[n]`; `trusted` flags authoritative
 *  .gov/.mil + curated gov-contracting sources. */
export interface WebResearchCitation {
  index: number;
  title: string;
  url: string;
  host: string;
  trusted: boolean;
}

/** `web_research` payload — an answer synthesised from a live web search over
 *  authoritative gov-contracting sources, with inline `[n]` citation markers. */
export interface WebResearchPayload {
  query: string;
  answer: string;
  citations: WebResearchCitation[];
}

/** Where a value on the profile card comes from. Mirrors the backend's
 *  `ProfileCardSource` (`backend/src/hunter-chat/hunter-chat.types.ts`). */
export type ProfileCardSource = "profile" | "capability_statement" | "you_told_us" | "unconfirmed";

/** One value on the profile card. */
export interface ProfileCardRow {
  label: string;
  /** The row as one text. The card shows `items` instead when they are present. */
  value: string;
  source: ProfileCardSource;
  /** The row's entries, for a row that is a list. */
  items?: string[];
  /** How many entries the server left out of `items`. */
  moreItems?: number;
}

/** `profile` payload — the member's record as `get_profile` read it. */
export interface ProfilePayload {
  rows: ProfileCardRow[];
  /** How many rows the server left out. The card states this number. */
  hiddenCount: number;
  /** Labels of fields she asked about that hold no value. */
  notOnFile: string[];
  capabilityStatement: "parsed" | "unparsed" | "none";
  /** The saved answers could not be read on this turn. */
  factsUnavailable: boolean;
}

/** One piece of a proposed change. Mirrors the backend's `ProfileUpdateLine`. */
export interface ProfileUpdateLine {
  /** A label for the piece, or null when the piece stands on its own. */
  label: string | null;
  text: string;
}

/** The pick she must make before Save, when the row keeps fewer items. */
export interface ProfileUpdateChoice {
  /** The most items she may keep. */
  maxItems: number;
  /** Every item the proposal names, in order. */
  items: string[];
  /** One sentence that says how many she may keep. */
  note: string;
}

/** One change she is asked to Save or Cancel. Nothing is written before Save. */
export interface ProfileUpdateCard {
  /** The Success Center proposal id that Save and Cancel answer. */
  proposalId: string;
  /** The My Business row label. */
  label: string;
  lines: ProfileUpdateLine[];
  /** Her own words, when Success Center kept them. */
  heard: string | null;
  choice: ProfileUpdateChoice | null;
}

/** A fact she said that did not become a card, with the sentence she reads. */
export interface ProfileUpdateNote {
  label: string;
  note: string;
}

/** `profile_update` payload: the changes that wait for her Save. Mirrors the
 *  backend's `ProfileUpdatePayload`. */
export interface ProfileUpdatePayload {
  cards: ProfileUpdateCard[];
  notes: ProfileUpdateNote[];
}

/** What her Save or Cancel on a profile update card came to. */
export type ProfileUpdateAnswer =
  | { status: "confirmed"; label: string }
  | { status: "rejected" }
  | { status: "refused"; message: string }
  | { status: "gone"; message: string }
  | { status: "unavailable"; message: string };

/** A fact the profile-learning agent saved automatically this turn. */
export interface LearnedFactDto {
  label: string;
  value: string;
}

/** A proposed profile change that conflicts with an existing fact — shown to the
 *  user to confirm (Update / Keep) rather than saved silently. */
export interface ConflictProposalDto {
  label: string;
  existingValue: string;
  proposedValue: string;
}

/** How much a stored profile fact can be trusted (#5). Mirrors the backend
 *  `ConfidenceTag`. A member claim is at most `attested`, never `verified`. */
export type ConfidenceTag =
  | "verified"
  | "needs_review_confirmed"
  | "document_backed"
  | "attested"
  | "needs_review"
  | "inferred"
  | "stale"
  | "missing";

/** Who supplied a fact value: the member, a document, or a machine. */
export type FactSource =
  | "member_stated"
  | "signal"
  | "passive_extraction"
  | "document"
  | "success_center";

/** Where a proposed fact value came from — shown as the provenance line (#5). */
export interface FactProvenance {
  source: FactSource;
  signal?: string;
  documentUrl?: string;
  observedAt: string;
}

/** The kind of honest ask Hunter poses (#5). */
export type AskType = "confirm" | "range" | "doc" | "open";

/** One honest profile question. A `confirm`/`open` ask NEVER shows a fabricated
 *  default — a value appears only when `proposal` is present (signal-backed) and
 *  carries visible provenance. `range` asks show bands + a "not sure" escape. */
export interface ProfileAsk {
  id: string;
  field: string;
  label: string;
  askType: AskType;
  question: string;
  proposal?: {
    value: string;
    provenance: FactProvenance;
    confidence_tag: ConfidenceTag;
  };
  bands?: string[];
  allowNotSure: boolean;
}

export interface HunterTurnResponse {
  chatReply: string;
  uiPayload: {
    kind:
      | "discovery"
      | "eligibility"
      | "compare"
      | "matches"
      | "reset"
      | "switch_tab"
      | "save"
      | "act"
      | "web_research"
      | "profile"
      | "profile_update"
      | "none";
    data: unknown;
  };
  sessionId: string;
  /** Id of the persisted chat-log document for this exchange — used to attach
   *  feedback after the fact. Absent/null when logging failed server-side. */
  turnId?: string | null;
  /** Facts learned this turn (auto-saved) + conflicts needing confirmation. */
  /** Chained eligibility→act only: the act card rides here so the eligibility
   *  card stays in `uiPayload` and both render. */
  actPayload?: ActPayload;
  /** DEMO: follow-up questions that the rail shows as buttons under the reply. */
  suggestions?: string[];
}

/** An opportunity the user is currently viewing, sent so Hunter can resolve
 *  references like "the two remaining" / "the first one". */
export interface VisibleOpp {
  oppKey: string;
  title: string;
  /** "City, State" — lets Hunter resolve place references like "Houston". */
  location?: string;
}

/** Reads a non-2xx backend body into a log-friendly detail string. Handles the
 *  NestJS error shape (`message` as a string or a validation string[]). */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body?.message)) return body.message.join("; ");
    if (body?.message) return String(body.message);
  } catch {
    /* body was not JSON */
  }
  return res.statusText || "unknown error";
}

/** Sends one chat turn to the Hunter orchestrator. locationId is server-derived.
 *  `visibleOpps` is the user's current feed, used for reference resolution.
 *  `surface` is the page the member talks from. The body always carries it,
 *  and it is `feed` when the caller gives none.
 *  Throws with the real status + backend message on failure so the caller can
 *  log it (the UI still shows a friendly, generic message to the user). */
export async function postHunterMessage(
  message: string,
  visibleOpps: VisibleOpp[] = [],
  tab?: FeedTab,
  surface: HunterSurface = "feed",
): Promise<HunterTurnResponse> {
  const res = await apiFetch(`${API_BASE_URL}/hunter-chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, visibleOpps, tab, surface }),
  });
  if (!res.ok) {
    throw new Error(`Hunter chat request failed (${res.status}): ${await errorDetail(res)}`);
  }
  return res.json() as Promise<HunterTurnResponse>;
}

/** Confirms/updates one learned profile fact (the "Update" action on a conflict
 *  card). Upserts by label. Best-effort: throws only so the caller can surface a
 *  retry; the UI treats failure gracefully. */
export async function applyProfileFact(label: string, value: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/hunter-chat/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, value }),
  });
  if (!res.ok) {
    throw new Error(`Save profile fact failed (${res.status}): ${await errorDetail(res)}`);
  }
}

/** Answers one honest profile ask (#5): a confirmed value, a chosen band, the
 *  literal "not_sure" (writes nothing), or a document reference. Identity is
 *  server-derived. Throws on failure so the caller can leave the ask actionable. */
export async function answerProfileAsk(input: {
  askId: string;
  field: string;
  value: string;
  documentUrl?: string;
}): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/hunter-chat/profile/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Answer profile ask failed (${res.status}): ${await errorDetail(res)}`);
  }
}

/** One durable fact on file, as returned by `GET /hunter-chat/profile`. The
 *  subset of the backend `LearnedFact` the UI reads: every fact carries a
 *  `confidence_tag`, so a guess can be told apart from something the member
 *  stated or a document proved. */
export interface StoredProfileFact extends LearnedFactDto {
  id: string;
  confidence_tag?: ConfidenceTag;
  /** Where the value came from. The backend backfills it on read, so it is
   *  present in practice — but a legacy payload may still omit it. */
  provenance?: FactProvenance;
}

/** Reads the caller's learned profile facts (identity is server-derived). Never
 *  throws: this feeds a passive display, so a failed or empty read simply shows
 *  nothing at all. */
export async function fetchProfileFacts(): Promise<StoredProfileFact[]> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/hunter-chat/profile`);
    if (!res.ok) {
      console.warn(`Hunter profile facts failed (${res.status}): ${await errorDetail(res)}`);
      return [];
    }
    const body = (await res.json()) as { facts?: StoredProfileFact[] };
    return Array.isArray(body?.facts) ? body.facts : [];
  } catch (err) {
    console.warn("Hunter profile facts failed:", err);
    return [];
  }
}

/** One claim Hunter overheard that the member's capability statement refused.
 *  The capability statement is the source of truth, so nothing was changed —
 *  this is only surfaced as a passive hint, never as a chat message. */
export interface ProfileConflictHint {
  /** Canonical field id — the stable key, never a value. */
  field: string;
  /** Canonical field label, e.g. "Capability summary". */
  label: string;
  /** What Hunter heard: the extracted value, never the raw message. */
  heardValue: string;
  observedAt: string;
}

/** Reads the caller's pending conflict hints (identity is server-derived).
 *  Never throws: a hint is a whisper, so a failed or empty read simply renders
 *  nothing at all. */
export async function fetchProfileConflicts(): Promise<ProfileConflictHint[]> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/hunter-chat/memory-conflicts`);
    if (!res.ok) {
      console.warn(`Hunter conflict hints failed (${res.status}): ${await errorDetail(res)}`);
      return [];
    }
    const body = (await res.json()) as { conflicts?: ProfileConflictHint[] };
    return Array.isArray(body?.conflicts) ? body.conflicts : [];
  } catch (err) {
    console.warn("Hunter conflict hints failed:", err);
    return [];
  }
}

/** How a member settles one surfaced conflict. */
export type ConflictDecision = "prefer_document" | "keep_mine";

/**
 * Settles one conflict, and says whether it stuck.
 *
 * Deliberately NOT silent like `fetchProfileConflicts`. A missing whisper costs
 * nothing, so that read swallows every failure — but this is a member ACTING. If
 * the write did not land, the hint has to stay on screen: telling someone their
 * decision was recorded when it was not is how the same conflict reappears next
 * week with no explanation.
 *
 * Neither decision changes a stored value. `prefer_document` records a retraction
 * so passive extraction stops re-raising the same claim; `keep_mine` writes
 * nothing at all, because the capability statement is the source of truth and the
 * only way to change what it says is to change the document.
 */
export async function resolveProfileConflict(
  field: string,
  value: string,
  decision: ConflictDecision,
): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/hunter-chat/memory-conflicts/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value, decision }),
    });
    if (!res.ok) {
      console.warn(`Conflict resolve failed (${res.status}): ${await errorDetail(res)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Conflict resolve failed:", err);
    return false;
  }
}

/** Clears the user's accumulated narrowing so the next turn starts fresh. */
export async function resetHunterSession(): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/hunter-chat/reset`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Hunter reset request failed (${res.status}): ${await errorDetail(res)}`);
  }
}

/** Records feedback on a persisted chat turn. Best-effort: never throws into
 *  UI code — logs and swallows on failure so a feedback hiccup can't disrupt
 *  the chat experience. */
export async function postHunterFeedback(
  turnId: string,
  rating: "up" | "down" | "flag",
  comment?: string,
): Promise<void> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/hunter-chat/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnId, rating, comment }),
    });
    if (!res.ok) {
      console.warn(`Hunter feedback request failed (${res.status}): ${await errorDetail(res)}`);
    }
  } catch (err) {
    console.warn("Hunter feedback request failed:", err);
  }
}
