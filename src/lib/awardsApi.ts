import { apiFetch, buildApiError, API_BASE_URL } from "./api";

/**
 * Awards API — the contract lens on the public record: what was bought, for how
 * much, by whom. (Partners is the company lens on the same records.)
 *
 * Identity is the authenticated GHL session resolved server-side — no locationId is
 * ever sent from the client.
 */

/** The five named questions that replace a wall of filter primitives. */
export type AwardFilterId = "trade" | "area" | "size" | "justAwarded" | "comingUpAgain";

export type AwardSort = "relevant" | "recent" | "largest";

export const AWARD_FILTERS: { id: AwardFilterId; label: string; hint: string }[] = [
  { id: "trade", label: "My kind of work", hint: "Jobs like the ones you do" },
  { id: "area", label: "Near me", hint: "In the states you work in" },
  {
    id: "size",
    label: "My size",
    hint: "Big enough to need subs, small enough to join",
  },
  {
    id: "justAwarded",
    label: "Just awarded",
    hint: "Awarded in the last few months",
  },
  {
    id: "comingUpAgain",
    label: "Up for bid again",
    hint: "Up for bid again within a year",
  },
];

export const AWARD_SORTS: { id: AwardSort; label: string }[] = [
  { id: "relevant", label: "Best match" },
  { id: "recent", label: "Most recent" },
  { id: "largest", label: "Biggest" },
];

/** What a member lands on: their trade, their area. Removable, never hidden. */
export const DEFAULT_AWARD_FILTERS: AwardFilterId[] = ["trade", "area"];

export interface AwardWinner {
  name: string;
  /** Join key into Partners — an award's winner IS a company there. */
  uei: string | null;
  awardeeKey: number | null;
  parentUei: string | null;
}

export interface AwardRecency {
  /**
   * A FLOOR on when the contract existed, not a signing date — federal award records
   * carry no signing date. Render as "work started around…", never "awarded on…".
   */
  awardedAt: string | null;
  daysSinceAward: number | null;
  /**
   * null (not false) when the date is unknown — the badge is SUPPRESSED rather than
   * shown as a negative. A blank means we do not know when this happened, and the
   * page's loudest claim must not go to the records we know least about.
   */
  justAwarded: boolean | null;
  comingUpAgain: boolean;
  recompeteAt: string | null;
  /** Defense-aware: the 30–90d window sits inside the ~90d defense reporting lag. */
  reportingLagNote: string;
}

/**
 * The prime's disclosed sub relationships IN THE LAST 24 MONTHS. Render `distinctSubs`
 * as "at least N", NEVER an exact count — public filings cover first-tier subcontracts
 * above $30K only, and reporting is known to be incomplete, so the true number is
 * always higher. The window means a prime with only older disclosed subs on file
 * renders as "we do not know" (bench: null) rather than a lifetime count.
 */
export interface AwardBench {
  distinctSubs: number;
  repeatSubs: number;
  sampleSubs: { name: string; uei: string | null; awards: number }[];
}

export interface AwardRecord {
  awardId: string;
  title: string;
  solicitationId: string | null;
  winner: AwardWinner;
  agency: { name: string; abbrev: string | null; isDefense: boolean };
  /** Three distinct figures, never conflated. */
  obligated: number | null;
  currentValue: number | null;
  ceiling: number | null;
  recency: AwardRecency;
  location: { city: string | null; state: string | null };
  naicsCode: string | null;
  /** Plain-language scope. Members never see a raw code. */
  workType: string | null;
  pscCode: string | null;
  /** The COUNT of bidders. Who they were is not published. */
  offersReceived: number | null;
  extentCompeted: string | null;
  setAside: string | null;
  subcontractingPlan: string | null;
  bench: AwardBench | null;
  sourceUrl: string | null;
}

export interface AwardListResult {
  awards: AwardRecord[];
  page: number;
  limit: number;
  hasMore: boolean;
  /** Which filters actually applied — shown as removable chips, never hidden. */
  appliedFilters: AwardFilterId[];
  /**
   * Filters the member turned ON that narrowed nothing, because their profile has
   * no value to narrow by — a nationwide member's "Near me". Without this the chip
   * sits pressed and changes no results, which reads as a broken filter.
   */
  droppedFilters?: AwardFilterId[];
  /**
   * The member's profile has no trade on file, so we could not scope the search.
   * The UI asks them to finish their profile rather than showing an empty feed that
   * reads as "there is no work in your trade".
   */
  needsProfile?: boolean;
}

export interface AwardListRequest {
  filters?: AwardFilterId[];
  sort?: AwardSort;
  q?: string;
  page?: number;
  limit?: number;
}

/** POST /awards — the list. A read; POST because the filter set is a structured body. */
export async function fetchAwards(
  body: AwardListRequest,
  signal?: AbortSignal,
): Promise<AwardListResult> {
  const response = await apiFetch(`${API_BASE_URL}/awards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load awards");
  }
  return response.json() as Promise<AwardListResult>;
}

/** GET /awards/:awardId — one award, with the winner's sub bench. */
export async function fetchAward(awardId: string, signal?: AbortSignal): Promise<AwardRecord> {
  const response = await apiFetch(`${API_BASE_URL}/awards/${encodeURIComponent(awardId)}`, {
    signal,
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load that award");
  }
  return response.json() as Promise<AwardRecord>;
}

// ── saved awards ────────────────────────────────────────────────────────────

export interface SavedAward {
  awardId: string;
  /** Where the save came from, e.g. "from Awards · just awarded". */
  sourceTag: string;
  savedAt: string;
}

/** GET /awards/saved — the member's shelf, newest first. */
export async function fetchSavedAwards(signal?: AbortSignal): Promise<SavedAward[]> {
  const response = await apiFetch(`${API_BASE_URL}/awards/saved`, { signal });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load saved awards");
  }
  const body = (await response.json()) as { awards: SavedAward[] };
  return body.awards;
}

/** POST /awards/saved — idempotent. */
export async function saveAward(awardId: string, sourceTag: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/awards/saved`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ awardId, sourceTag }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to save that award");
  }
}

/** DELETE /awards/saved/:awardId — idempotent, and never validates the id. */
export async function unsaveAward(awardId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/awards/saved/${encodeURIComponent(awardId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to remove that award");
  }
}

// ── presentation helpers ────────────────────────────────────────────────────
// Kept next to the client so wording rules travel with the data they describe.

export function usd(n: number | null): string {
  // 0 is a placeholder in this data, not a real "paid nothing yet" — same as null.
  if (n === null || n === 0) return "—";
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  // Round, and group — sub-$1,000 figures otherwise carry cents (see partnersApi.usd).
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

/** A figure the record actually carries — mirrors usd()'s 0/null-is-absent rule. */
function isPresent(n: number | null): n is number {
  return n !== null && n !== 0;
}

/**
 * Three money fields (obligated/currentValue/ceiling) collapse to one number when
 * every PRESENT one agrees — three identical cells under the big figure above them
 * just make the reader hunt for a difference that isn't there. When they differ,
 * the PRD's "never conflated" rule wins: they stay separate and distinctly labelled.
 *
 * `explainNoGrowth` only fires when we hold BOTH obligated and ceiling and they
 * match — that pair is the actual evidence the job has no room to grow. A single
 * present figure collapses trivially (nothing to compare it to) but proves nothing
 * about growth, so it renders with no claim attached.
 */
export function collapseAwardMoney(
  a: Pick<AwardRecord, "obligated" | "currentValue" | "ceiling">,
): { figure: number; explainNoGrowth: boolean } | null {
  const present = [a.obligated, a.currentValue, a.ceiling].filter(isPresent);
  if (present.length === 0) return null;
  const allEqual = present.every((n) => n === present[0]);
  if (!allEqual) return null;
  return {
    figure: present[0],
    explainNoGrowth: isPresent(a.obligated) && isPresent(a.ceiling) && a.obligated === a.ceiling,
  };
}

/** Relative age. Returns null when the date is unknown, so callers omit the phrase. */
export function awardedAgo(a: AwardRecord): string | null {
  const d = a.recency.daysSinceAward;
  if (d === null) return null;
  if (d < 45) return `${d} days ago`;
  const months = Math.round(d / 30);
  if (months < 18) return `${months} months ago`;
  return `${Math.round(months / 12)} years ago`;
}

/** Sub counts are a floor, never an exact figure, and cover the last 24 months
 *  only — see AwardBench. Plain sixth-grade English: "in the last two years". */
export function atLeastSubs(bench: AwardBench): string {
  return `at least ${bench.distinctSubs} ${bench.distinctSubs === 1 ? "firm" : "firms"} in the last two years`;
}

/**
 * "What happens next" — when to actually make contact, in one sentence.
 *
 * The award-detail section the PRD asks for (awards-prd §3) and the surface's whole
 * job: a member can read every other section and still not know whether to call today
 * or in six months. Four phases, strongest-timing first.
 *
 * Returns null when we know neither the recompete date nor how old the award is —
 * an unknown timeline gets no advice rather than a guess, the same rule the recency
 * badge follows.
 */
export function whatHappensNext(a: AwardRecord): string | null {
  const months = a.recency.recompeteAt
    ? (new Date(a.recency.recompeteAt).getTime() - Date.now()) / (30 * 86_400_000)
    : null;
  // A known rebid date beats age: it is a real date to prepare for, which is
  // different advice from "go court them now".
  if (months !== null && months > 0 && months <= 18) {
    return `This job comes up for bid again in about ${Math.round(months)} months. Getting on their radar now is what puts you on the team next time.`;
  }
  const days = a.recency.daysSinceAward;
  if (days === null) return null;
  // Defense awards publish ~90 days late (reportingLagNote), so a defense award
  // reading as "days < 30" may actually be four months old — "just won, give them a
  // few weeks" asserts freshness on a date we know is lagged. Skip straight to the
  // date-agnostic advice for defense; the lag caveat is still shown elsewhere on
  // the page (reportingLagNote).
  if (days < 30 && !a.agency.isDefense) {
    return "This was just won. Give them a few weeks to get set up, then reach out.";
  }
  if (days < 275) {
    return "Reach out and ask who is already on the team — in some trades it is set before the award, in others it is still open.";
  }
  return "This job is well underway. Reaching out still works if your work fits a part they have not filled yet.";
}

/**
 * Fix #5: a sole-source / non-competed award is not "a small field" — it was never
 * open to competition at all, which is the opposite claim. FPDS/USASpending's
 * `extent_competed` domain values that mean "not competed" all contain one of these
 * two phrases (e.g. "Not Competed", "Not Competed under SAP", "Not Available for
 * Competition"); every genuinely competitive value (Full and Open Competition,
 * Follow On to Competed Action, Subject to Multiple Award Fair Opportunity, …) is
 * clear of both. Case-insensitive — HigherGov ships this Title Case.
 */
const NOT_COMPETED = /not competed|not available for competition/i;

/** True only when the record affirmatively says the award was not competed. Null
 *  (unknown) must never be treated as either competed or not — see the caller. */
export function isSoleSource(extentCompeted: string | null): boolean {
  return extentCompeted !== null && NOT_COMPETED.test(extentCompeted);
}

/**
 * "How much competition there was" — the sentence, not just the count.
 *
 * `extentCompeted === null` asserts nothing either way: we do not know how this was
 * procured, so the field-size sentence stays silent rather than guessing "small" or
 * "sole source". A field of 1 is normal for genuinely competitive procurements too
 * (GAO: 13-14% of competed contracts draw a single offer) — the sole-source callout
 * only fires when the record affirmatively says it was not competed.
 */
export function competitionSummary(
  a: Pick<AwardRecord, "offersReceived" | "extentCompeted">,
): string | null {
  if (a.offersReceived === null) return null;
  if (isSoleSource(a.extentCompeted)) {
    return "This job was not put out for open competition — it was awarded without one.";
  }
  if (a.extentCompeted === null) return null;
  return a.offersReceived <= 3
    ? "That is a small field — work like this is not heavily contested."
    : "That is a crowded field. Expect to compete hard on price.";
}

/**
 * The one line saying why this award is in front of you. Strongest first — something
 * a member can act on beats a similarity. Never mentions a subcontracting goal
 * percentage: that figure is not public and would be invented.
 */
export function whyThisAward(a: AwardRecord): string {
  const ago = awardedAgo(a);
  if (a.recency.justAwarded && ago) {
    return `Won ${ago}. Worth asking who is already on the team.`;
  }
  if (a.recency.comingUpAgain && a.recency.recompeteAt) {
    const months = Math.max(
      1,
      Math.round((new Date(a.recency.recompeteAt).getTime() - Date.now()) / (30 * 86_400_000)),
    );
    return `This job comes up for bid again in about ${months} months. Start getting ready and you could bid it.`;
  }
  if (a.location.state) {
    return `This is your kind of work, in your area. It shows you who pays for it.`;
  }
  return `This is your kind of work. It shows you which buyers pay for it.`;
}
