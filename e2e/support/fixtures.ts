import type {
  ForecastListResponseDto,
  ForecastListRowDto,
  ForecastMatchRead,
  ForecastMemberDto,
  ForecastRecordDto,
  ForecastResponseDto,
  ForecastViewCounts,
} from "../../src/lib/forecastsApi";
import type { ForecastGrantMessage } from "../../src/lib/forecasts/grantChatApi";
import type { ForecastTakeResponse } from "../../src/lib/forecasts/grantTakeApi";
import type {
  ForecastWatchEvent,
  ForecastWatchForecast,
  ForecastWatchNotice,
  ForecastWatchNoticeBasis,
  ForecastWatchResponse,
} from "../../src/lib/forecasts/watch";
import type { SavedOppDetail } from "../../src/lib/workspace";
import { emptyTakeFixture, takeFixture, tallyFact } from "../../src/lib/forecasts/take.fixture";

/**
 * Response fixtures for stubbed specs.
 *
 * Shapes mirror the DTOs in `src/lib/discoverApi.ts`, `src/lib/enrichment.ts`,
 * `src/lib/hunterChat.ts` and `src/lib/businessProfile.tsx` — build them from the
 * real interface, never from what a response "looks like". The discovery envelope
 * key is `data`, not `opportunities`; a stub with the wrong key still renders an
 * empty feed, so a guessed shape produces a test that passes for the wrong reason.
 */

/** Title of the default fixture opportunity. Shared so specs and page objects
 *  reference one string rather than repeating a literal that can drift. */
export const OPPORTUNITY_TITLE = "Roof Replacement, Building 400";

/** One scored opportunity, shaped to `DiscoverV2OpportunityDto`. */
export function makeOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: "opp-1",
    title: OPPORTUNITY_TITLE,
    scope: "fed",
    geminiPlainEnglishTitle: null,
    agency: { name: "USACE" },
    noticeType: "Solicitation",
    responseDeadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    setAside: "SDVOSB",
    naicsCode: "238160",
    placeOfPerformance: { city: "Raleigh", state: "NC" },
    status: "active",
    quickSummary: "Replace the roof on Building 400.",
    relevanceScore: 80,
    tier: "priority",
    matchReasons: ["NAICS 238160 matches your profile"],
    matchBreakdown: { eligible: true },
    scoreBreakdown: {
      businessCategoryMatch: 30,
      certificationMatch: 25,
      locationMatch: 20,
    },
    ...overrides,
  };
}

/** `DiscoverV2ResponseDto` envelope. `profileIndexing:false` keeps the feed out
 *  of the full-screen "matches generating" state (see lib/matchesGenerating.ts). */
export function discoverResponse(opportunities: object[] = []) {
  return {
    data: opportunities,
    total: opportunities.length,
    page: 1,
    limit: 20,
    totalPages: 1,
    scoringEngine: "e2e-stub",
    profileIndexing: false,
  };
}

/** `GET /workspace` — saved opps and saved searches. */
export function workspaceResponse(savedOpps: string[] = []) {
  return { savedOpps, savedSearches: [] };
}

/** `GET /business-profile` — the Success Center record the knows-you panel merges
 *  with the learned facts (shaped to `BusinessProfile`). Deliberately minimal: one
 *  profile row keeps the panel's three-line viewport on a single page, so a spec
 *  asserting a row is not racing the cycle. */
export function businessProfileResponse(overrides: Record<string, unknown> = {}) {
  return {
    ghlLocationId: "e2e-location",
    primaryNaics: "238160",
    naicsLabels: { "238160": "Roofing Contractors" },
    certifications: [],
    capabilityStatementUrl: null,
    uei: null,
    cage: null,
    ein: null,
    website: null,
    ...overrides,
  };
}

/**
 * One fact as `GET /hunter-chat/profile` returns it (`StoredProfileFact`).
 *
 * `id` is the STORED KEY, which for every known field IS its vocabulary field
 * (`factKey` in `profile-facts/fact-merge.ts`) — and that is exactly what decides
 * whether the panel offers to edit the row, so it is a required argument here
 * rather than something a fixture invents.
 */
export function learnedFact(
  id: string,
  label: string,
  value: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    label,
    value,
    confidence_tag: "attested",
    updatedAt: "2026-07-20T00:00:00Z",
    provenance: { source: "member_stated", observedAt: "2026-07-20T00:00:00Z" },
    ...overrides,
  };
}

/** The milestone rail (`MilestoneRailItem[]`) every enrichment payload carries. */
export const MILESTONE_RAIL = [
  {
    milestone: "A_work_and_where",
    label: "What you do & where",
    status: "done",
    answered: 3,
    total: 3,
  },
  { milestone: "B_how_you_win", label: "How you win", status: "active", answered: 1, total: 3 },
  { milestone: "C_readiness", label: "Readiness", status: "upcoming", answered: 0, total: 5 },
  { milestone: "D_sharpen", label: "Sharpen", status: "upcoming", answered: 0, total: 2 },
];

/** `GET /hunter-chat/enrichment/state` (`EnrichmentStatePayload`). */
export function enrichmentState(overrides: Record<string, unknown> = {}) {
  return {
    posture: "ENRICHMENT",
    active: true,
    paused: false,
    atCheckpoint: false,
    milestone: "B_how_you_win",
    rail: MILESTONE_RAIL,
    payoffDelta: { unlocked: 4, sharpened: 2 },
    scoringMode: "rule_only",
    embedReady: false,
    ...overrides,
  };
}

/**
 * One question card (`NextQuestionPayload`). `canGoBack` is what the client reads
 * to decide whether a Back control may exist at all, so it is explicit here.
 * A `proposal` makes the card confirm-and-extend: the value rides along and the
 * client pre-fills the input with it.
 */
export function enrichmentQuestion(opts: {
  field: string;
  label: string;
  question: string;
  canGoBack?: boolean;
  proposal?: string;
  elicitShape?: string;
}) {
  return {
    kind: "question",
    milestone: "B_how_you_win",
    ask: {
      id: `${opts.field}:${opts.proposal ? "confirm" : "open"}`,
      field: opts.field,
      label: opts.label,
      askType: opts.proposal ? "confirm" : "open",
      question: opts.question,
      allowNotSure: false,
      ...(opts.proposal
        ? {
            proposal: {
              value: opts.proposal,
              provenance: { source: "member_stated", observedAt: "2026-07-20T00:00:00Z" },
              confidence_tag: "attested",
            },
          }
        : {}),
    },
    elicitShape: opts.elicitShape ?? "paragraph",
    rail: MILESTONE_RAIL,
    canGoBack: opts.canGoBack ?? false,
  };
}

// ── Forecasts (`src/lib/forecastsApi.ts`, `src/lib/forecasts/grantChatApi.ts`) ──

const DAY_MS = 86_400_000;
const EXPECTED_IN_DAYS = 120;
const POSTED_DAYS_AGO = 10;
const CHECKED_DAYS_AGO = 1;
const REGISTRATION_ENDS_IN_DAYS = 700;

/** A YYYY-MM-DD date `days` from the browser's today. The dev server does not pin
 *  the forecast clock, so a fixed date would age out of the open window. */
function isoDay(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The route id of the default forecast. It matches the chat's `oppKey` pattern. */
export const FORECAST_OPP_KEY = "e2e-forecast-1";

/** The one starter chip that the default forecast's read carries, and its fixed answer. */
export const FORECAST_STARTER = {
  ask: "What should I do first?",
  answer: "Fill in your past job sizes in My Business. Then I can judge this one.",
};

/** One live forecast, shaped to `ForecastRecordDto`. */
export function makeForecastRecord(overrides: Partial<ForecastRecordDto> = {}): ForecastRecordDto {
  return {
    id: FORECAST_OPP_KEY,
    lane: "federal",
    oppKey: FORECAST_OPP_KEY,
    hgTitle: "Janitorial Services, Federal Building",
    hgText: "Custodial services for the federal building in Raleigh.",
    sourceId: "F2026000001",
    postedOn: isoDay(-POSTED_DAYS_AGO),
    dueOn: isoDay(EXPECTED_IN_DAYS),
    agencyName: "General Services Administration",
    agencyAbbr: "GSA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "New",
    setAsideCode: null,
    valLow: 200_000,
    valHigh: 500_000,
    popState: "NC",
    popCity: "Raleigh",
    contactName: null,
    contactRole: null,
    contactEmail: null,
    sourceName: null,
    sourceLink: null,
    docKey: null,
    files: [],
    checkedOn: isoDay(-CHECKED_DAYS_AGO),
    hunter: {
      plainTitle: "Cleaning a federal building in Raleigh",
      semanticFit: 0.9,
      categoryFit: null,
    },
    ...overrides,
  };
}

/**
 * The member, shaped to `ForecastMemberDto`. Her past job sizes and her size are
 * not on file, so Grant's derived read waits on My Business: the call is
 * `review`, the page has no plan, and the rail carries `FORECAST_STARTER`.
 */
export function makeForecastMember(overrides: Partial<ForecastMemberDto> = {}): ForecastMemberDto {
  return {
    naics: ["561720"],
    states: ["NC"],
    certs: [],
    certsKnown: false,
    isSmall: null,
    registration: { status: "active", endsOn: isoDay(REGISTRATION_ENDS_IN_DAYS) },
    biggestPastJob: null,
    smallestTarget: null,
    businessName: "Tar Heel Clean LLC",
    address: "1 Main St, Raleigh, NC 27601",
    ...overrides,
  };
}

/** `GET /forecasts/:oppKey` (`ForecastResponseDto`). */
export function forecastResponse(
  forecast: ForecastRecordDto = makeForecastRecord(),
  member: ForecastMemberDto = makeForecastMember(),
): ForecastResponseDto {
  return { member, forecast };
}

/** `GET /forecasts/:oppKey/grant/session`: the stored thread, newest last. */
export function forecastGrantSession(messages: ForecastGrantMessage[] = []) {
  return { messages };
}

/** `POST /forecasts/:oppKey/grant/reply`: a 200 body. */
export function forecastGrantReply(reply: string) {
  return { reply };
}

// ── Grant's take on a forecast (`src/lib/forecasts/grantTakeApi.ts`) ──
// The take itself is the unit tests' fixture (`src/lib/forecasts/take.fixture.ts`), so the
// two tiers prove their rules against one take. Only the winners change here.

/** One firm the market-winners tally names. */
export interface TakeFirm {
  name: string;
  awards: number;
}

/** `GET /forecasts/:oppKey/grant/take`: every fact counted. `firms`, when given, are the winners. */
export function forecastTake(
  firms?: TakeFirm[],
  oppKey: string = FORECAST_OPP_KEY,
): ForecastTakeResponse {
  if (!firms) return takeFixture(oppKey);
  const marketWinners = tallyFact("market-winners", {
    figure: 31,
    countedOver: 31,
    firms: firms.map((firm) => ({ ...firm, totalValue: null })),
  });
  return takeFixture(oppKey, { marketWinners });
}

/** `GET /forecasts/:oppKey/grant/take`: a take in which no fact was checked. */
export function forecastTakeNotChecked(oppKey: string = FORECAST_OPP_KEY): ForecastTakeResponse {
  return emptyTakeFixture(oppKey);
}

// ── The forecast watch (`src/lib/forecasts/watch.ts`, `src/lib/workspace.ts`) ──

/** When the watch on the default forecast started. It is before every event below. */
const WATCH_STARTED_AT = "2026-09-10T10:00:00.000Z";

/** One watch event, shaped to `ForecastWatchEvent`. Unseen unless `seenAt` is given. */
export function makeWatchEvent(overrides: Partial<ForecastWatchEvent> = {}): ForecastWatchEvent {
  return {
    id: "ev-naics",
    kind: "code_changed",
    field: "naicsCode",
    before: "561710",
    after: "561720",
    decided: null,
    notice: null,
    observedAt: "2026-09-20T12:19:00.000Z",
    seenAt: null,
    ...overrides,
  };
}

/** The notice event kinds, each with the basis it carries (`BASIS_KIND_OF` in `watch.ts`). */
export type WatchNoticeKind = "bid_request_posted" | "republished" | "notice_suggested";

const BASIS_OF: Record<WatchNoticeKind, ForecastWatchNoticeBasis> = {
  bid_request_posted: { kind: "named", number: "70Z03825QB0000139" },
  republished: { kind: "same_plan", sourceId: "F2026000001" },
  notice_suggested: {
    kind: "suggested",
    office: "same",
    officeName: null,
    overlap: "strong",
    naicsGroupSame: true,
  },
};

/**
 * One notice event, shaped to `ForecastWatchEvent` with its `ForecastWatchNotice`. By
 * default the notice is a held Solicitation from the forecast's office; a republished
 * record targets a forecast page.
 */
export function makeNoticeEvent(
  kind: WatchNoticeKind,
  notice: Partial<ForecastWatchNotice> = {},
  overrides: Partial<ForecastWatchEvent> = {},
): ForecastWatchEvent {
  return makeWatchEvent({
    id: `ev-${kind}`,
    kind,
    field: null,
    before: null,
    after: null,
    notice: {
      oppKey: `${kind}-key-1`,
      target: kind === "republished" ? "forecast" : "opportunity",
      title: "Custodial Services, Federal Building",
      agencyName: "General Services Administration",
      noticeType: kind === "republished" ? "Forecast" : "Solicitation",
      postedOn: "2026-09-25",
      held: true,
      basis: BASIS_OF[kind],
      ...notice,
    },
    observedAt: "2026-09-27T12:19:00.000Z",
    ...overrides,
  });
}

/** Kinds the server leaves out of `unseen` (the backend's `FORECAST_WATCH_UNCOUNTED_KINDS`). */
const UNCOUNTED_KINDS: readonly string[] = ["notice_suggested"];

/**
 * One watched forecast, shaped to `ForecastWatchForecast`. `unseen` counts its unseen
 * events as the server does: a suggestion is not counted.
 */
export function makeWatchForecast(
  events: ForecastWatchEvent[],
  oppKey: string = FORECAST_OPP_KEY,
): ForecastWatchForecast {
  return {
    oppKey,
    startedAt: WATCH_STARTED_AT,
    unseen: events.filter((e) => e.seenAt == null && !UNCOUNTED_KINDS.includes(e.kind)).length,
    events,
  };
}

/** `GET /forecast-watch` (`ForecastWatchResponse`). Watching is on and email is off by default. */
export function forecastWatchResponse(
  forecasts: ForecastWatchForecast[] = [],
  overrides: Partial<Omit<ForecastWatchResponse, "forecasts">> = {},
): ForecastWatchResponse {
  return { watching: true, notify: false, forecasts, ...overrides };
}

/** The list's page size (`FORECAST_PAGE_SIZE` in `src/lib/forecasts/listQuery.ts`). */
const FORECAST_LIST_PAGE_SIZE = 20;

/**
 * `GET /forecasts` (`ForecastListResponseDto`): page 1 of any view, holding the
 * default forecast alone, with its page-1 counts. By default the forecast has no
 * match row. The capture counts are shapes, not the runway rule's answer.
 */
export function forecastsResponse(
  forecast: ForecastRecordDto = makeForecastRecord(),
  member: ForecastMemberDto = makeForecastMember(),
  match: ForecastMatchRead | null = null,
): ForecastListResponseDto {
  return {
    member,
    forecasts: [{ ...forecast, match }],
    page: 1,
    limit: FORECAST_LIST_PAGE_SIZE,
    hasMore: false,
    total: 1,
    captureCounts: { all: 1, act_now: 0, start_capture: 0, position_early: 0, watch: 1 },
    // The same one row answers every view, so each view counts it.
    viewCounts: { for_you: 1, all: 1, saved: 1 },
    facets: {
      states: forecast.popState ? [{ value: forecast.popState, count: 1 }] : [],
      cities: [],
      naics: forecast.naicsCode ? [{ value: forecast.naicsCode, count: 1 }] : [],
    },
  };
}

/**
 * One row of the paged list (`ForecastListRowDto`): the default forecast under its own
 * key and plain title, expected `expectedInDays` from today, with `match` as her row.
 */
export function makeForecastListRow(
  oppKey: string,
  title: string,
  match: ForecastMatchRead | null,
  expectedInDays: number = EXPECTED_IN_DAYS,
): ForecastListRowDto {
  const record = makeForecastRecord({
    id: oppKey,
    oppKey,
    dueOn: isoDay(expectedInDays),
    hunter: { plainTitle: title, semanticFit: 0.9, categoryFit: null },
  });
  return { ...record, match };
}

/** What one stubbed page of `GET /forecasts` holds. */
export interface ForecastsPageStub {
  rows: ForecastListRowDto[];
  page: number;
  hasMore: boolean;
  /** Rows that match the query over every page. Sent on page 1 only. */
  total: number;
  /** The view badges. Sent on page 1 only. */
  viewCounts: ForecastViewCounts;
}

/**
 * One page of `GET /forecasts` (`ForecastListResponseDto`). Page 1 carries the counts
 * and the facets; a later page carries none, as the server sends it. The capture
 * counts are shapes, not the runway rule's answer.
 */
export function forecastsPage(stub: ForecastsPageStub): ForecastListResponseDto {
  const base: ForecastListResponseDto = {
    member: makeForecastMember(),
    forecasts: stub.rows,
    page: stub.page,
    limit: FORECAST_LIST_PAGE_SIZE,
    hasMore: stub.hasMore,
  };
  if (stub.page !== 1) return base;
  return {
    ...base,
    total: stub.total,
    captureCounts: {
      all: stub.total,
      act_now: 0,
      start_capture: 0,
      position_early: 0,
      watch: stub.total,
    },
    viewCounts: stub.viewCounts,
    facets: { states: [], cities: [], naics: [] },
  };
}

/** `GET /workspace/saved-opps/details` (`SavedOppDetail[]`): the default forecast, tracked. */
export function trackedForecastDetails(title: string): SavedOppDetail[] {
  return [
    {
      oppKey: FORECAST_OPP_KEY,
      title,
      agency: "General Services Administration",
      dueDate: null,
      sourceType: "forecast",
    },
  ];
}
