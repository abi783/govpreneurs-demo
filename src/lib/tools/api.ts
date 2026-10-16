// Plain (non-GHL) fetch client for the public /public/tools/* API. Deliberately
// does not reuse apiFetch from lib/api.ts — these routes are unauthenticated by
// GHL and instead carry the tools-specific bearer token issued by /auth/*.

// tools.govpreneurs.com serves the SPA and API from the same origin — force
// same-origin requests there regardless of the build-time env var.
const TOOLS_HOST = import.meta.env.VITE_TOOLS_HOST ?? "tools.govpreneurs.com";
const API_BASE_URL: string =
  typeof window !== "undefined" && window.location.hostname === TOOLS_HOST
    ? ""
    : (import.meta.env.VITE_API_BASE_URL ?? "");

const TOKEN_KEY = "tools:token";

export const getToolsToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToolsToken = (token: string): void => {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore — private browsing / storage blocked */
  }
};

export const clearToolsToken = (): void => {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ToolsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ToolsApiError";
    this.status = status;
  }
}

async function toolsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToolsToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 429) {
    throw new ToolsApiError("Too many requests, try again in a minute.", 429);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore parse error */
    }
    throw new ToolsApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export interface AgencyStat {
  name: string;
  count: number;
  obligated: number;
}

export interface StateStat {
  state: string;
  count: number;
}

export type SetAsideKey = "8a" | "sdvosb" | "wosb" | "hubzone" | "sb" | "none" | "other";

export interface SetAsideMixEntry {
  key: SetAsideKey;
  count: number;
  obligated: number;
  share: number; // share of dollars, 0-1, sorted desc
}

export type SizeBandKey = "under25k" | "25k-250k" | "over250k";

export interface SizeBandEntry {
  key: SizeBandKey;
  count: number;
  share: number; // share of award count, 0-1
}

export interface FiscalYearEntry {
  fy: number;
  count: number;
  obligated: number;
}

export interface QuarterEntry {
  q: 1 | 2 | 3 | 4; // federal FY: Q1=Oct-Dec ... Q4=Jul-Sep
  count: number;
  share: number;
}

export interface NaicsStat {
  code: string;
  title: string;
  category: string;
  subcategory: string;
  fiscalYears: number[];
  awardCount: number;
  obligated: number;
  medianValue: number | null;
  topAgencies: AgencyStat[];
  topStates: StateStat[];
  setAsideShare: number | null;
  openOppCount: number;
  asOf: string;
  // Gated fields — absent/empty when anonymous, present once unlocked.
  medianOffers?: number | null;
  setAsideMix?: SetAsideMixEntry[];
  sizeBands?: SizeBandEntry[];
  byFiscalYear?: FiscalYearEntry[];
  byQuarter?: QuarterEntry[];
  top5Share?: number | null;
}

export interface DemandResult {
  naics: NaicsStat | null;
  alternatives: NaicsStat[];
}

export type ScorecardColor = "red" | "yellow" | "green";

export interface SummitPitch {
  pitch: string;
  coupon: string;
  url: string;
}

export interface ScorecardResult {
  color: ScorecardColor;
  gates: string[];
  naics: NaicsStat | null;
  openOppCount: number;
  summitPitch: SummitPitch | null;
}

export const searchNaics = (q: string): Promise<{ results: NaicsStat[] }> =>
  toolsFetch(`/public/tools/naics?q=${encodeURIComponent(q)}`);

export const getNaics = (code: string): Promise<NaicsStat> =>
  toolsFetch(`/public/tools/naics/${encodeURIComponent(code)}`);

// Batch lookup for the industry browser — up to 20 6-digit codes, comma
// separated. Results come back in the order given; unknown codes are skipped.
export const getNaicsByCodes = (codes: string[]): Promise<{ results: NaicsStat[] }> =>
  toolsFetch(`/public/tools/naics?codes=${encodeURIComponent(codes.join(","))}`);

export const getDemand = (q: string): Promise<DemandResult> =>
  toolsFetch(`/public/tools/demand?q=${encodeURIComponent(q)}`);

export interface RelatedNaicsLink {
  code: string;
  title: string;
  obligated: number;
}

export const getRelatedNaics = (code: string): Promise<{ related: RelatedNaicsLink[] }> =>
  toolsFetch(`/public/tools/naics/${encodeURIComponent(code)}/related`);

export interface BrowseCategory {
  category: string;
  slug: string;
  codes: RelatedNaicsLink[];
}

export const getBrowseByCategory = (): Promise<{ categories: BrowseCategory[] }> =>
  toolsFetch(`/public/tools/demand/browse`);

export const postScorecard = (body: {
  answers: Record<string, string>;
  naics?: string;
}): Promise<ScorecardResult> =>
  toolsFetch("/public/tools/scorecard", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const authGoogle = (
  credential: string,
): Promise<{ token: string; email: string; name: string }> =>
  toolsFetch("/public/tools/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

export const sendOtp = (email: string): Promise<{ ok: true }> =>
  toolsFetch("/public/tools/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyOtp = (email: string, code: string): Promise<{ token: string; email: string }> =>
  toolsFetch("/public/tools/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export interface LeadPayload {
  source: "demand" | "naics" | "scorecard" | "account" | "capstatement" | "checklist" | "hubzone";
  naics?: string;
  state?: string;
  color?: ScorecardColor;
  gates?: string[];
  consent: boolean;
  name?: string;
}

export const postLead = (body: LeadPayload): Promise<{ ok: true }> =>
  toolsFetch("/public/tools/lead", {
    method: "POST",
    body: JSON.stringify(body),
  });

export interface ToolsSummary {
  codes: number;
  totalAwards: number;
  totalObligated: number;
  fiscalYears?: number[];
  openOpps: number;
  asOf: string;
  cadence?: "weekly";
}

export const getSummary = (): Promise<ToolsSummary> => toolsFetch("/public/tools/summary");

export interface ToolsUser {
  email: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export const getMe = (): Promise<ToolsUser> => toolsFetch("/public/tools/me");

export const updateMe = (name: string): Promise<ToolsUser> =>
  toolsFetch("/public/tools/me", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export interface ToolResultSummary {
  id: string;
  tool: string;
  naics?: string;
  title?: string;
  summary?: string;
  color?: ScorecardColor;
  data?: unknown;
  createdAt: string;
}

export const getResults = (): Promise<{ results: ToolResultSummary[] }> =>
  toolsFetch("/public/tools/results");

export const deleteResult = (id: string): Promise<void> =>
  toolsFetch(`/public/tools/results/${encodeURIComponent(id)}`, { method: "DELETE" });

export const postResult = (body: {
  tool: string;
  naics?: string;
  title?: string;
  summary?: string;
  color?: ScorecardColor;
  gates?: string[];
  data?: unknown;
  notify?: boolean;
}): Promise<{ id: string; emailed: boolean }> =>
  toolsFetch("/public/tools/results", {
    method: "POST",
    body: JSON.stringify(body),
  });
