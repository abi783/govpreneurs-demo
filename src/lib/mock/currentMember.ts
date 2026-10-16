import { useLiveSlices } from "../eventBus";
import { isLow } from "../wallet";
import { countOpenUnread } from "../tasks";
import { useGhlUser } from "../ghlUser";
import {
  useBusinessProfile,
  deriveCertLabels,
  titleCaseCity,
  type BusinessProfile,
} from "../businessProfile";

export type GeographicPreference = {
  scope: "local" | "statewide" | "multi_state_radius" | "national";
  states: string[];
  radiusMiles: number | null;
};

export type Readiness = {
  status: "preview" | "ready";
  stepsComplete: number;
  stepsTotal: number;
};

export type CurrentMember = {
  ownerName: string;
  businessName: string;
  hqState: string;
  hqCity: string;
  primaryNaics: string;
  naicsDescription: string;
  secondaryNaics: string[];
  samBusinessTypes: string[];
  samStatus: "active" | "inactive" | "expired" | "not_registered";
  samVerifiedAt: string | null;
  uei: string | null;
  cage: string | null;
  pastPerformanceCount: number;
  federalSubPerformanceCount: number;
  capabilityStatementUploaded: boolean;
  websiteVerified: boolean;
  dsbsProfileVerified: boolean;
  sledRegistrationsByState: Record<string, unknown>;
  targetAgencies: string[];
  targetValueRangeMin: number | null;
  targetValueRangeMax: number | null;
  geographicPreference: GeographicPreference;
  setAsideHunger: "set_aside_only" | "both_lean_set_aside" | "both_lean_open" | "open_only";
  notificationCadence: "daily" | "weekly" | "monthly";
  einProvided: boolean;
  bondingCapability: number | null;
  insuranceBasic: boolean | null;
  concurrentContractCapacity: number | null;
  annualRevenueBand: string | null;
  totalEmployeesW2: number | null;
  /** Display-ready certification / set-aside short labels (e.g. "SDVOSB"). */
  certifications: string[];
  readiness: Readiness;
};

export const currentMember: CurrentMember = {
  ownerName: "Marcus Williams",
  businessName: "Williams Construction LLC",
  hqState: "NC",
  hqCity: "Fayetteville",
  primaryNaics: "238160",
  naicsDescription: "Roofing Contractors",
  secondaryNaics: [
    "238170 — Siding Contractors",
    "236220 — Commercial Building Construction",
    "238290 — Other Building Equipment Contractors",
  ],
  samBusinessTypes: ["small_business", "sdvosb_eligible"],
  samStatus: "active",
  samVerifiedAt: "2027-04-15",
  uei: "LW1SL1HLED3",
  cage: "16WG0",
  pastPerformanceCount: 4,
  federalSubPerformanceCount: 1,
  capabilityStatementUploaded: false,
  websiteVerified: false,
  dsbsProfileVerified: false,
  sledRegistrationsByState: {},
  targetAgencies: ["USACE", "Fort Bragg-area federal", "VA"],
  targetValueRangeMin: 250000,
  targetValueRangeMax: 1000000,
  geographicPreference: {
    scope: "multi_state_radius",
    states: ["NC", "VA", "SC", "GA"],
    radiusMiles: 300,
  },
  setAsideHunger: "both_lean_set_aside",
  notificationCadence: "weekly",
  einProvided: false,
  bondingCapability: null,
  insuranceBasic: null,
  concurrentContractCapacity: null,
  annualRevenueBand: "$500K–$1M",
  totalEmployeesW2: 3,
  certifications: ["SDVOSB", "Small Business"],
  readiness: { status: "preview", stepsComplete: 4, stepsTotal: 5 },
};

// Identity/display fields shown as blank until the real profile loads, so the
// mock firm (Marcus Williams) is never surfaced as if it were the user.
const BLANK_IDENTITY = {
  businessName: "",
  hqCity: "",
  hqState: "",
  primaryNaics: "",
  naicsDescription: "",
  secondaryNaics: [] as string[],
  certifications: [] as string[],
  uei: null,
  cage: null,
} satisfies Partial<CurrentMember>;

/** Overlays the real profile onto the structural mock scaffolding (readiness,
 *  roadmap, etc. that has no backend source yet). Every identity/display field
 *  comes from the real profile only — never the mock firm. */
function overlayProfile(
  base: CurrentMember,
  profile: BusinessProfile,
  ownerNameFallback: string,
): CurrentMember {
  return {
    ...base,
    ...BLANK_IDENTITY,
    ownerName: profile.ownerName ?? ownerNameFallback ?? "",
    businessName: profile.legalName ?? profile.accountName ?? "",
    hqCity: profile.cities?.[0] ? titleCaseCity(profile.cities[0]) : "",
    hqState: profile.stateCodes?.[0]?.toUpperCase() ?? "",
    primaryNaics: profile.primaryNaics ?? "",
    // Real economic certs live in `socioEconomicCerts` (e.g. ["8A","WOSB"]);
    // `certifications` carries registration markers ("sam", "capability").
    certifications: deriveCertLabels(profile.socioEconomicCerts ?? []),
    capabilityStatementUploaded: profile.capabilityStatementUrl != null,
    uei: profile.uei ?? null,
    cage: profile.cage ?? null,
    einProvided: profile.ein != null,
    websiteVerified: profile.website != null,
  };
}

export function useCurrentMember(): CurrentMember {
  const { session } = useGhlUser();
  const { profile } = useBusinessProfile();
  if (!profile) {
    // No real profile yet (loading or not on file) — never surface the mock
    // firm. Keep structural scaffolding, blank all identity/display fields.
    return { ...currentMember, ...BLANK_IDENTITY, ownerName: session?.userName ?? "" };
  }
  return overlayProfile(currentMember, profile, session?.userName ?? "");
}

export type SubStepState = "done" | "in_progress" | "todo";
export type RoadmapSubStep = { id: string; label: string; state: SubStepState };
export type RoadmapStepState = "complete" | "current" | "locked";
export type RoadmapStep = {
  index: number;
  label: string;
  state: RoadmapStepState;
  subSteps: RoadmapSubStep[];
};
export type Roadmap = {
  overallPercent: number;
  currentStepIndex: number;
  currentStepLabel: string;
  currentStepSub: { complete: number; total: number };
  estWeeksRemaining: number;
  steps: RoadmapStep[];
};

export const currentRoadmap: Roadmap = {
  overallPercent: 29,
  currentStepIndex: 1,
  currentStepLabel: "Get Registered",
  currentStepSub: { complete: 4, total: 5 },
  estWeeksRemaining: 9,
  steps: [
    {
      index: 1,
      label: "Get Registered",
      state: "current",
      subSteps: [
        { id: "entity", label: "Entity Registration", state: "done" },
        { id: "sam", label: "Federal Ready (SAM)", state: "done" },
        { id: "sbs", label: "SBS Profile Review", state: "done" },
        { id: "capability", label: "Capability Statement", state: "todo" },
        { id: "sled", label: "SLED Ready", state: "in_progress" },
      ],
    },
    {
      index: 2,
      label: "Digital Compliance Check",
      state: "locked",
      subSteps: [
        { id: "website", label: "Website", state: "todo" },
        { id: "biz-email", label: "Business Email", state: "todo" },
        { id: "biz-info", label: "Business Info Review", state: "todo" },
      ],
    },
    {
      index: 3,
      label: "Get Positioned",
      state: "locked",
      subSteps: [
        { id: "positioning-call", label: "Positioning Call", state: "todo" },
        { id: "targeting-call", label: "Targeting Call", state: "todo" },
        { id: "tracking", label: "Tracking Setup", state: "todo" },
        { id: "custom-roadmap", label: "Custom Roadmap", state: "todo" },
      ],
    },
    {
      index: 4,
      label: "Meet your AI employees",
      state: "locked",
      subSteps: [
        { id: "hunter", label: "Hunter", state: "todo" },
        { id: "grant", label: "Grant", state: "todo" },
        { id: "ava", label: "Ava", state: "todo" },
      ],
    },
    {
      index: 5,
      label: "Start bidding",
      state: "locked",
      subSteps: [
        { id: "bid-no-bid", label: "Bid/No-Bid", state: "todo" },
        { id: "prepare", label: "Prepare Proposal", state: "todo" },
        { id: "submit", label: "Submit", state: "todo" },
      ],
    },
    {
      index: 6,
      label: "Additional Registrations",
      state: "locked",
      subSteps: [
        { id: "prime", label: "Prime Contractor Registration", state: "todo" },
        { id: "cmmc", label: "CMMC 2.0", state: "todo" },
      ],
    },
  ],
};

export type Journey = {
  readiness: Readiness;
  roadmap: Roadmap;
  profileCompleteness: number;
  bidsCount: number;
  tasksUnread: number;
  mentorUnread: number;
  walletLow: boolean;
  activeBid: { id: string; title: string } | null;
  previewMatchCount: number;
};

// Derived: AI team unlocks at Step 4 — that's when "preview" flips to "ready".
const derivedReadinessStatus: Readiness["status"] =
  currentRoadmap.currentStepIndex >= 4 ? "ready" : "preview";

// Static fields of the journey. walletLow + tasksUnread are computed live by
// useJourney() so the sidebar and consuming pages agree on a single derivation.
export const journeyBase = {
  readiness: { ...currentMember.readiness, status: derivedReadinessStatus },
  roadmap: currentRoadmap,
  profileCompleteness: 82,
  bidsCount: 3,
  mentorUnread: 1,
  activeBid: null as Journey["activeBid"],
  previewMatchCount: 247,
};

// Back-compat export — prefer useJourney() in components for live values.
export const currentJourney: Journey = {
  ...journeyBase,
  tasksUnread: 2,
  walletLow: true,
};

// Cached snapshot — getSnapshot must return a stable reference when inputs
// are unchanged, or useSyncExternalStore loops.
let cachedJourney: Journey | null = null;
let cachedJourneyKey = "";
function readJourney(): Journey {
  const low = isLow();
  const unread = countOpenUnread();
  const key = `${low}|${unread}`;
  if (cachedJourney && cachedJourneyKey === key) return cachedJourney;
  cachedJourneyKey = key;
  cachedJourney = { ...journeyBase, walletLow: low, tasksUnread: unread };
  return cachedJourney;
}

export function useJourney(): Journey {
  return useLiveSlices<Journey>(["wallet", "tasks"], readJourney);
}

export function findNextSubStep(
  roadmap: Roadmap,
): { stepIndex: number; stepLabel: string; subStep: RoadmapSubStep } | null {
  for (const step of roadmap.steps) {
    for (const sub of step.subSteps) {
      if (sub.state !== "done") {
        return { stepIndex: step.index, stepLabel: step.label, subStep: sub };
      }
    }
  }
  return null;
}


