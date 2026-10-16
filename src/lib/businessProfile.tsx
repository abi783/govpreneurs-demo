import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE_URL, apiFetch } from "./api";
import { useGhlUser } from "./ghlUser";
import { subscribeDemoState } from "../demo/runtime/store";

/**
 * Real business profile returned by `GET /business-profile?locationId=`.
 * Mirrors the subset of the backend `BusinessProfileResponse` the UI reads.
 * All fields are optional/nullable because a freshly-provisioned profile may
 * not have them populated yet.
 */
export interface BusinessProfile {
  ghlLocationId: string;
  ownerName?: string;
  legalName?: string;
  accountName?: string;
  primaryNaics?: string;
  naicsCodes?: string[];
  /** Human-readable NAICS titles keyed by code (from the backend taxonomy join).
   *  Only codes present in the taxonomy appear; unknown codes fall back to the code. */
  naicsLabels?: Record<string, string>;
  stateCodes?: string[];
  cities?: string[];
  /** Socio-economic certification codes (e.g. ["8A", "WOSB"]). This is the
   *  firm's real certification list; `certifications` also carries registration
   *  markers ("sam", "capability") so it is NOT used for display. */
  socioEconomicCerts?: string[];
  /** Small-business status → Total Small Business set-aside eligibility. */
  isSmall?: boolean;
  certifications: string[];
  certificationCategories?: string[];
  capabilityStatementUrl: string | null;
  uei: string | null;
  cage: string | null;
  ein: string | null;
  website: string | null;
}

// Full, display-ready labels for the socio-economic certification codes the
// profile API returns — spelled out rather than acronyms (e.g. MOB →
// "Minority-Owned Business") so "Hunter knows you" reads in plain English.
// Registration markers (SAM) and "no set-aside" are dropped so they never
// render as a certification.
const CERT_LABELS: Record<string, string> = {
  SB: "Small Business",
  SBA: "Small Business",
  SBP: "Small Business",
  ESB: "Emerging Small Business",
  "8A": "8(a)",
  "8AN": "8(a)",
  HZC: "HUBZone",
  HZS: "HUBZone",
  WOSB: "Women-Owned Small Business",
  WOSBSS: "Women-Owned Small Business",
  EDWOSB: "Economically Disadvantaged Women-Owned Small Business",
  EDWOSBSS: "Economically Disadvantaged Women-Owned Small Business",
  SDVOSBC: "Service-Disabled Veteran-Owned Small Business",
  SDVOSBS: "Service-Disabled Veteran-Owned Small Business",
  VSA: "Veteran-Owned Small Business",
  VSS: "Veteran-Owned Small Business",
  MOB: "Minority-Owned Business",
  MBE: "Minority Business Enterprise",
  SDB: "Small Disadvantaged Business",
  WOB: "Woman-Owned Business",
  VOB: "Veteran-Owned Business",
  DBE: "Disadvantaged Business Enterprise",
};

const CERT_CODES_TO_SKIP = new Set(["SAM", "NONE"]);

/** Maps raw socio-economic cert codes to de-duplicated short display labels. */
export function deriveCertLabels(codes: string[]): string[] {
  const labels: string[] = [];
  for (const code of codes) {
    const upper = code.toUpperCase();
    if (CERT_CODES_TO_SKIP.has(upper)) continue;
    const label = CERT_LABELS[upper] ?? code;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

/** Title-cases a portal city (stored lowercase, e.g. "houston" → "Houston"). */
export function titleCaseCity(city: string): string {
  return city
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Human-readable label for a NAICS code — the taxonomy title when known
 *  (e.g. "Roofing Contractors"), else the raw code. */
export function naicsLabel(profile: BusinessProfile, code: string): string {
  return profile.naicsLabels?.[code] ?? code;
}

/** Deduped human-readable NAICS labels for the profile (primary first). */
function naicsLabelsFor(profile: BusinessProfile): string[] {
  const codes: string[] = [];
  if (profile.primaryNaics) codes.push(profile.primaryNaics);
  for (const c of profile.naicsCodes ?? []) if (!codes.includes(c)) codes.push(c);
  return codes.map((c) => naicsLabel(profile, c));
}

/**
 * Flat, human-readable facts straight off the structured profile.
 *
 * Superseded for the docked "Hunter knows you" card by `useKnowsYouFacts()`
 * (`lib/knowsYouFacts.ts`), which is learned-fact aware and returns provenance
 * rather than bare strings — this branch removed it for that reason. It is kept
 * because `HunterKnowsYouEmbed` (added independently on `main`) still reads it;
 * deleting it would have been a silent removal of another branch's component
 * during a merge. If that component is retired, this goes with it.
 */
export function profileFacts(profile: BusinessProfile): string[] {
  const facts: string[] = [];
  const certs = deriveCertLabels(profile.socioEconomicCerts ?? []);
  if (certs.length) facts.push(certs.join(", "));
  if (profile.isSmall) facts.push("Small Business set-aside");
  const city = profile.cities?.[0];
  const state = profile.stateCodes?.[0];
  if (city && state) facts.push(`${titleCaseCity(city)}, ${state.toUpperCase()}`);
  else if (state) facts.push(state.toUpperCase());
  if (profile.primaryNaics) {
    const label = profile.naicsLabels?.[profile.primaryNaics];
    facts.push(label ?? `Primary NAICS ${profile.primaryNaics}`);
  }
  return facts;
}

/** The three dimensions the discovery feed weights matches by, resolved to the
 *  user's real profile values (human-readable). Powers the "Why these?" panel.
 *  Any dimension may be empty when the profile lacks that data. */
export function weightingDimensions(profile: BusinessProfile): {
  scopeFit: string[];
  location: string | null;
  certEligibility: string[];
} {
  const city = profile.cities?.[0];
  const state = profile.stateCodes?.[0];
  const location =
    city && state
      ? `${titleCaseCity(city)}, ${state.toUpperCase()}`
      : state
        ? state.toUpperCase()
        : null;

  const certEligibility = deriveCertLabels(profile.socioEconomicCerts ?? []);
  if (profile.isSmall) certEligibility.push("Small Business set-aside");

  return { scopeFit: naicsLabelsFor(profile), location, certEligibility };
}

// DEMO: the profile the app shows follows what the visitor changes on the Business
// Profile page (a legal name, an EIN, a new capability statement). This counter goes
// up on each change, and the provider loads the profile again.
function useProfileStoreVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const offFields = subscribeDemoState("profile.fields", bump);
    const offCap = subscribeDemoState("profile.capStatement", bump);
    return () => {
      offFields();
      offCap();
    };
  }, []);
  return version;
}

/** Fetches the caller's real business profile. `locationId` is server-derived
 *  in prod (via the GHL token) and overridden by `?locationId=` in mock/staging. */
export async function fetchBusinessProfile(locationId: string): Promise<BusinessProfile> {
  const url = `${API_BASE_URL}/business-profile?locationId=${encodeURIComponent(locationId)}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Failed to load business profile");
  }
  return res.json() as Promise<BusinessProfile>;
}

interface BusinessProfileCtx {
  profile: BusinessProfile | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<BusinessProfileCtx | null>(null);

/** Fetches the real business profile once per session and shares it with every
 *  consumer (Hunter chat, "Hunter knows you" embed, sidebar, cap-statement
 *  builder). Mount under `GhlUserProvider` so the session locationId is ready. */
export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useGhlUser();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  // Start in a loading state so consumers show a spinner/empty rather than the
  // "no profile" CTA during the initial fetch (avoids a flash before data).
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useProfileStoreVersion();

  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    // DEMO: a reload after a change keeps what is on screen; only the first load shows loading.
    if (version === 0) setLoading(true);
    setError(null);
    fetchBusinessProfile(locationId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.locationId, version]);

  // Keep consumers in a loading state while the GHL session itself is still
  // resolving, so the "no profile" CTA never flashes before we can fetch.
  return (
    <Ctx.Provider value={{ profile, loading: sessionLoading || loading, error }}>
      {children}
    </Ctx.Provider>
  );
}

/** Reads the shared business profile. Returns nulls when rendered outside the
 *  provider (e.g. isolated tests) so callers can fall back to mock defaults. */
export function useBusinessProfile(): BusinessProfileCtx {
  return useContext(Ctx) ?? { profile: null, loading: false, error: null };
}
