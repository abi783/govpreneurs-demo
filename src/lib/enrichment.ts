// Client for the proactive profile-enrichment journey (#6). Typed wrappers over
// the `/hunter-chat/enrichment/*` surface, mirroring the backend payload types in
// `backend/src/hunter-chat/enrichment/enrichment.types.ts`. Identity is
// server-derived from the GHL session — no locationId is ever sent.
import { apiFetch, API_BASE_URL, buildApiError } from "./api";
import { answerProfileAsk, type ProfileAsk, type ActPayload } from "./hunterChat";

/** The four themed milestones, in journey order. */
export type Milestone = "A_work_and_where" | "B_how_you_win" | "C_readiness" | "D_sharpen";

/** Journey order — the sequence checkpoints advance through. */
export const MILESTONE_ORDER: readonly Milestone[] = [
  "A_work_and_where",
  "B_how_you_win",
  "C_readiness",
  "D_sharpen",
];

/** Human labels for the four milestones (rail + copy). */
export const MILESTONE_LABEL: Record<Milestone, string> = {
  A_work_and_where: "What you do & where",
  B_how_you_win: "How you win",
  C_readiness: "Readiness",
  D_sharpen: "Sharpen",
};

/** NORMAL = ordinary chat (nudges live). ENRICHMENT = the guided journey is in-session. */
export type EnrichmentPosture = "NORMAL" | "ENRICHMENT";

/** The served ranking's phase: rule-only (thin), matches being (re)generated, or
 *  semantic-blended (embedded). */
export type ScoringMode = "rule_only" | "generating" | "hybrid";

/** The accumulated (or per-answer) payoff, in the contract's two numbers. */
export interface PayoffDelta {
  /** Newly gate-qualifying opps. */
  unlocked: number;
  /** Already-matched opps that moved UP a tier. */
  sharpened: number;
  /** Notable newly-qualifying oppKeys (capped) for checkpoint copy. */
  newlyInList?: string[];
}

/** One milestone's progress row for the frontend rail. */
export interface MilestoneRailItem {
  milestone: Milestone;
  label: string;
  status: "done" | "active" | "upcoming";
  answered: number;
  total: number;
}

/** GET state — posture + milestone rail (no side effects). */
export interface EnrichmentStatePayload {
  posture: EnrichmentPosture;
  active: boolean;
  paused: boolean;
  atCheckpoint: boolean;
  milestone: Milestone | null;
  rail: MilestoneRailItem[];
  payoffDelta: PayoffDelta;
  scoringMode: ScoringMode;
  /** Whether all 5 scored embedding field-texts are producible from the consolidated
   *  profile — with `scoringMode`, decides the thin-feed banner state. */
  embedReady: boolean;
}

/** How a milestone field is collected/validated on the client — mirrors the
 *  backend `ElicitShape` (`enrichment.types.ts`). `multi_select` is a CLOSED set
 *  of values (states, set-asides, NAICS): it renders a picker, so a value
 *  outside the set cannot be typed in the first place. */
export type ElicitShape = "gate" | "multi_select" | "list" | "project_list" | "paragraph" | "range";

/** The next honest question, surfaced under its milestone. */
export interface NextQuestionPayload {
  kind: "question";
  milestone: Milestone;
  ask: ProfileAsk;
  /** How the selected field is collected on the client (list-builder, textarea,
   *  etc) — drives which input renders. */
  elicitShape: ElicitShape;
  rail: MilestoneRailItem[];
  /** Whether a previously visited card exists to step back to. False on the first
   *  card, so no Back affordance is rendered that could not work. */
  canGoBack?: boolean;
  /** An adaptive follow-up ask for a thin answer (Task 4). Absent when the answer
   *  was sufficient. Mirrors the backend field of the same name — it was missing
   *  here, so the follow-up probe had no e2e reachability at all. */
  followUp?: ProfileAsk;
  /** A synthesized capability-summary draft, prefilled into the editable textarea
   *  for the member to confirm/edit (F1). Only set for the `capability summary`
   *  field, and only when it could be synthesized. */
  draft?: string;
}

/** A milestone checkpoint: summary → payoff delta → continue/stop. */
export interface CheckpointPayload {
  kind: "checkpoint";
  milestone: Milestone;
  summary: string[];
  /** Payoff accrued this milestone. */
  payoffDelta: PayoffDelta;
  /** Cumulative payoff across the journey so far. */
  totalPayoff: PayoffDelta;
  options: readonly ["continue", "stop"];
  rail: MilestoneRailItem[];
  /** A re-embed is QUEUED for this member and fires once they have been idle.
   *  Deliberately not "embedTriggered": the journey no longer embeds, so it must
   *  not claim to — the worker's idle sweep does. */
  embedPending?: boolean;
  /** True when this is the final milestone (continue → journey complete). */
  isFinal: boolean;
}

/** Result of recording one answer — the ack + delta, and whether we hit a checkpoint. */
export interface AnswerResultPayload {
  kind: "answer";
  /** The text was a QUESTION, not an answer — nothing was written, ask stays open. */
  notAnAnswer?: true;
  acknowledged: string;
  /** The payoff this answer earned. ABSENT when it could not be MEASURED — the
   *  profile read defining the member's gate failed, so the delta is unknown
   *  rather than zero and nothing may be claimed about it (backend §7.8).
   *  Declared REQUIRED here until the hardening pass, which is why callers
   *  dereferenced it straight through the server's own documented branch. */
  delta?: PayoffDelta;
  totalPayoff: PayoffDelta;
  /** A re-embed is queued and fires once the member goes idle (never on this
   *  answer). What the payoff card may honestly say. */
  embedPending: boolean;
  scoringMode: ScoringMode;
  atCheckpoint: boolean;
  checkpoint?: CheckpointPayload;
  /** An adaptive follow-up ask for a thin answer — always free-text; rendered as
   *  the next ask (a plain open textarea) before advancing. */
  followUp?: ProfileAsk;
  /** The next card, resolved by the save itself so advancing costs no second
   *  round trip. Absent on a follow-up, on a checkpoint, or if the server could
   *  not resolve it — the caller then falls back to `getNextEnrichment()`. */
  next?: NextPayload;
}

/** Result of skipping (or deferring) a field. A service-mappable deferral returns
 *  the full Act payload (rendered as the ActCard) — one intent-before-price offer. */
export interface SkipResultPayload {
  kind: "skip";
  field: string;
  parked: true;
  deferAct?: ActPayload;
  atCheckpoint: boolean;
  checkpoint?: CheckpointPayload;
}

/** Journey completion — no more milestones to walk. */
export interface CompletePayload {
  kind: "complete";
  rail: MilestoneRailItem[];
  totalPayoff: PayoffDelta;
}

/** What `next()` returns — a question, a checkpoint, or journey completion. */
export type NextPayload = NextQuestionPayload | CheckpointPayload | CompletePayload;

const ENRICHMENT_BASE = `${API_BASE_URL}/hunter-chat/enrichment`;

/** Current posture + milestone rail (read-only). */
export async function getEnrichmentState(): Promise<EnrichmentStatePayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/state`);
  if (!res.ok) return buildApiError(res, "Failed to load enrichment state");
  return res.json() as Promise<EnrichmentStatePayload>;
}

/** Enter or resume the journey; `optIn` opens it even for a viable profile.
 *  `reopen` is the explicit "sharpen my matches" re-entry: it un-parks skipped
 *  fields and re-offers what the member already told us, pre-filled, to edit.
 *  `fields` narrows that re-entry to exactly those fields — the "edit this one
 *  row" path — and `milestone` narrows it to one rail step; omitting both re-offers
 *  the whole journey as before. The server owns which fields a milestone contains,
 *  so the client sends the milestone, never a field list for it. */
export async function enterEnrichment(
  optIn = false,
  opts: { reopen?: boolean; fields?: string[]; milestone?: Milestone } = {},
): Promise<EnrichmentStatePayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/enter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      optIn,
      reopen: opts.reopen ?? false,
      ...(opts.fields ? { fields: opts.fields } : {}),
      ...(opts.milestone ? { milestone: opts.milestone } : {}),
    }),
  });
  if (!res.ok) return buildApiError(res, "Failed to start enrichment");
  return res.json() as Promise<EnrichmentStatePayload>;
}

/**
 * Close the builder and keep the member's place — the "I'll come back to this"
 * action, reachable from ANY card rather than only at a checkpoint.
 *
 * Nothing is discarded: every answer was written as it was given. The server
 * sets `paused`, which is what makes the entry button read "Resume profile
 * setup" the next time the member sees it. `enterEnrichment` resumes.
 */
export async function pauseEnrichment(): Promise<EnrichmentStatePayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/pause`, { method: "POST" });
  if (!res.ok) return buildApiError(res, "Failed to close profile setup");
  return res.json() as Promise<EnrichmentStatePayload>;
}

/** Step back one card — the previously visited field is re-offered PRE-FILLED so
 *  the member can correct it. An edit, never an undo: nothing already saved is
 *  removed until they replace it. A no-op on the journey's first card. */
export async function backEnrichment(): Promise<NextPayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/back`, { method: "POST" });
  if (!res.ok) return buildApiError(res, "Failed to go back");
  return res.json() as Promise<NextPayload>;
}

/**
 * The fields the journey can re-open for editing — MIRRORS the `field` column of
 * the backend's `hunter-chat/enrichment/milestone-config.ts`, exactly as
 * `MILESTONE_ORDER`/`MILESTONE_LABEL` above mirror `enrichment.types.ts`. Used to
 * decide whether a fact row gets an edit affordance at all: a field absent here
 * has no question in the journey, so offering to edit it would do nothing.
 */
export const EDITABLE_JOURNEY_FIELDS: ReadonlySet<string> = new Set([
  "naics_codes",
  "service_states",
  "capability_summary",
  "set_asides",
  "specializations",
  "differentiators",
  "core_capabilities",
  "credentials",
  "past_performance",
  "capability_statement",
  "sam_registration",
  "bonding_capacity",
  "insurance_coverage",
]);

/** The next honest question, the milestone checkpoint, or completion. */
export async function getNextEnrichment(): Promise<NextPayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/next`);
  if (!res.ok) return buildApiError(res, "Failed to load the next question");
  return res.json() as Promise<NextPayload>;
}

/** Record one confirmed answer; returns the payoff delta + any checkpoint. */
export async function answerEnrichment(input: {
  field: string;
  value: string;
  documentUrl?: string;
  /** The member typed prose instead of using the list builder. Only then does the
   *  backend spend an LLM round trip normalizing it into the comma-list shape. */
  freeText?: boolean;
}): Promise<AnswerResultPayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return buildApiError(res, "Failed to record your answer");
  return res.json() as Promise<AnswerResultPayload>;
}

/** Skip (park) a field; a service-mappable collectible returns one Act offer. */
export async function skipEnrichment(field: string): Promise<SkipResultPayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/skip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field }),
  });
  if (!res.ok) return buildApiError(res, "Failed to skip that question");
  return res.json() as Promise<SkipResultPayload>;
}

/** Continue to the next milestone, or stop (pause with data intact). */
export async function decideCheckpoint(
  decision: "continue" | "stop",
): Promise<EnrichmentStatePayload> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/checkpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) return buildApiError(res, "Failed to record your choice");
  return res.json() as Promise<EnrichmentStatePayload>;
}

/** The applied-filter subset a search can imply a profile fact from (a slice of
 *  the feed's filters). Sent to the organic-offer endpoint. */
export interface OrganicFilters {
  states?: string[];
  naics?: string[];
  setAsides?: string[];
}

/** One light confirm-before-write offer implied by a search — the honest ask the
 *  OrganicOfferChips renders. Reuses the ProfileAsk contract (#5). */
export type OrganicOffer = ProfileAsk;

/** Detect at most ONE organic offer implied by the search's applied filters, or
 *  null when nothing new is implied. Never writes — confirm is a separate action. */
export async function fetchOrganicOffer(filters: OrganicFilters): Promise<OrganicOffer | null> {
  const res = await apiFetch(`${ENRICHMENT_BASE}/organic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) return buildApiError(res, "Failed to check for an organic offer");
  const body = (await res.json()) as { offer: OrganicOffer | null };
  return body.offer;
}

/** Confirm an organic offer — writes the proposed value through the existing
 *  tagged-write path (never assumed; only on this explicit confirm). Dismiss is
 *  local and calls nothing. */
export async function confirmOrganicOffer(offer: OrganicOffer): Promise<void> {
  const value = offer.proposal?.value;
  if (!value) return;
  await answerProfileAsk({ askId: offer.id, field: offer.field, value });
}

/**
 * Whether the guided journey currently OWNS the conversation.
 *
 * `active` alone is not that question. A paused journey is `active: true,
 * paused: true` — the backend keeps it active so `POST /enter` can resume it at
 * the right milestone, and models "in session" as `active && !paused`
 * (`EnrichmentService.suspendsNudges`). Every client surface used to read
 * `active` on its own, so "Stop here for now" set `paused` and the builder
 * carried on rendering; the tell was `EnrichCTA`'s "Resume profile setup"
 * label, written for a state its own early-return made unreachable.
 *
 * One predicate, so the three surfaces cannot drift apart again.
 */
export function isJourneyInSession(
  state: Pick<EnrichmentStatePayload, "active" | "paused"> | null | undefined,
): boolean {
  return Boolean(state?.active && !state.paused);
}

/**
 * Whether the served ranking is still thin enough to ask the member for more.
 *
 * The idle dock gates its entry button on it. A `generating` feed is not thin —
 * it is not ranked yet — and a rule-only feed that is already embed-ready has
 * its real matches on the way.
 */
export function showsSharpenNudge(state: EnrichmentStatePayload): boolean {
  if (isJourneyInSession(state)) return false;
  return state.scoringMode === "rule_only" && !state.embedReady;
}

/**
 * Whether every milestone question has been answered.
 *
 * Deliberately NOT `deriveStrength(rail).level === 4`: the tier reaches 4 at
 * 75% (`1 + floor(pct * 4)`), so a member reading "sharp · 4 of 4" may still
 * have a quarter of the journey left. Hiding the dock on the tier would retire
 * the entry point while questions remain.
 *
 * An absent or empty rail is NOT complete — "we recorded no milestones" is a
 * degraded read, not a finished profile.
 */
export function isProfileComplete(rail: MilestoneRailItem[] | undefined | null): boolean {
  const items = rail ?? [];
  const total = items.reduce((n, r) => n + r.total, 0);
  if (total === 0) return false;
  return items.reduce((n, r) => n + r.answered, 0) >= total;
}

/** Profile-strength tier derived from real rail progress (answered / total across
 *  all milestones). No fabrication — a thin profile reads as "just started". */
export interface ProfileStrength {
  level: number;
  of: number;
  label: string;
}

const STRENGTH_LABELS = ["just started", "building", "solid", "sharp"] as const;

/** Derives a 1–4 strength tier from the milestone rail's answered/total counts.
 *  `rail` is read straight off `/state`, so a degraded response can deliver
 *  nothing at all — an absent rail is "no progress recorded", never a throw
 *  taken all the way up to the router's error component. */
export function deriveStrength(rail: MilestoneRailItem[] | undefined | null): ProfileStrength {
  const items = rail ?? [];
  const total = items.reduce((n, r) => n + r.total, 0);
  const answered = items.reduce((n, r) => n + r.answered, 0);
  const pct = total > 0 ? answered / total : 0;
  // 0 → level 1, then each full quarter of completion raises the tier (cap at 4).
  const level = Math.min(4, 1 + Math.floor(pct * 4));
  return { level, of: 4, label: STRENGTH_LABELS[level - 1] };
}
