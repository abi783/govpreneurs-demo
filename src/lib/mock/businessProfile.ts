// CANONICAL Business Profile mock state for Marcus Williams.
// Every Business Profile prompt depends on this exact shape — do not mutate
// these values in later prompts unless the prompt explicitly says so.

import { getMicroState, type PastPerformanceRecord } from "../state/microPurchases";

export type FieldState =
  | "verified"
  | "needs_review"
  | "attested"
  | "inferred"
  | "stale"
  | "missing"
  | "conflict"
  | "pending_dfy"
  | "error";

export type FieldTier = "T1" | "T2" | "T3" | "T1_conditional";

export type DfyRef = {
  service: string;
  price: number;
  perState?: boolean;
  leadField?: boolean;
};

export type FieldRecord<T> = {
  value: T | null;
  state: FieldState;
  tier: FieldTier;
  source?: string;
  verifiedAt?: string;
  attestedAt?: string;
  attemptedAt?: string;
  error?: string;
  extractedFrom?: string;
  dfy?: DfyRef | null;
};

export type SledRegistration = {
  state: string;
  status: FieldState;
  deliveryEta?: string | null;
  enrolledAt?: string | null;
  vendorId?: string | null;
};

export type GeographicPreference = {
  scope: "local" | "statewide" | "multi_state_radius" | "national";
  states: string[];
  radiusMiles: number | null;
  hqState?: string;
  willingToTravel?: boolean;
  travelConditions?: string;
};

export type PastPerformanceEntry = {
  id: string;
  projectTitle: string;
  customerName: string;
  customerType: "federal_prime" | "federal_sub" | "state" | "local" | "commercial";
  contractType: string;
  periodStart: string;
  periodEnd: string;
  totalValue: number;
  role: "prime" | "sub";
  subPercent?: number;
  naicsCode: string;
  scopeDescription: string;
  referencePOCName?: string;
  referencePOCTitle?: string;
  successful: boolean;
  state: FieldState;
  extractedFrom?: string;
};

export type MentorSession = {
  id: string;
  dateTime: string;
  mentorName: string;
  status: "scheduled" | "completed" | "cancelled";
  takeaway?: string;
  takeawayBy?: string;
};

export type BusinessProfile = {
  identity: Record<string, FieldRecord<unknown>>;
  capabilities: Record<string, FieldRecord<unknown>>;
  certifications: Record<string, FieldRecord<unknown>>;
  digital: Record<string, FieldRecord<unknown>>;
  sled: Record<string, FieldRecord<unknown>>;
  positioning: Record<string, FieldRecord<unknown>>;
  bidderProfile: Record<string, FieldRecord<unknown>>;
  pastPerformance: {
    entries: PastPerformanceEntry[];
    totalValue: number;
    federalCount: number;
    sledCount: number;
    commercialCount: number;
  };
  mentorHistory: {
    sessions: MentorSession[];
    activeMentorProtege: null | { partner: string; since: string };
  };
};

export const businessProfile: BusinessProfile = {
  identity: {
    legalName: { value: "Williams Construction LLC", state: "verified", source: "SAM.gov", verifiedAt: "2026-04-15", tier: "T1" },
    entityType: { value: "LLC", state: "verified", source: "Articles of Organization", verifiedAt: "2026-04-12", tier: "T2" },
    formationState: { value: "North Carolina", state: "verified", source: "Articles of Organization", verifiedAt: "2026-04-12", tier: "T2" },
    formationDate: { value: "June 14, 2024", state: "verified", source: "Articles of Organization", verifiedAt: "2026-04-12", tier: "T3" },
    EIN: { value: null, state: "missing", tier: "T1", dfy: null },
    UEI: { value: "LW1SL1HLED3", state: "verified", source: "SAM Registration.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    CAGE: { value: "16WG0", state: "verified", source: "SAM Registration.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    samStatus: { value: "Active until 2027-04-15", state: "verified", source: "SAM Registration.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    sosStatus: { value: "Active", state: "stale", source: "Cobalt SOS", verifiedAt: "2026-04-29", tier: "T2" },
    physicalAddress: { value: "201 Hay St, Fayetteville, NC 28301", state: "verified", source: "SAM.gov", verifiedAt: "2026-04-15", tier: "T2" },
    mailingAddress: { value: "PO Box 5512, Fayetteville, NC 28302", state: "attested", source: "You typed this", attestedAt: "2026-04-20", tier: "T3" },
    businessPhone: { value: null, state: "missing", tier: "T2", dfy: { service: "GovCompliant Digital Setup", price: 2997, leadField: false } },
    linkedInProfile: { value: null, state: "missing", tier: "T3", dfy: null },
    yearsInBusiness: { value: "~2 years", state: "inferred", source: "Computed from formation date", tier: "T3" },
  },
  capabilities: {
    primaryNaics: { value: "238160 Roofing Contractors", state: "verified", source: "Capability Statement v2.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    secondaryNaics: { value: ["238170 Siding Contractors"], state: "verified", source: "Capability Statement v2.pdf", verifiedAt: "2026-04-15", tier: "T2" },
    coreCapabilities: {
      value: "Commercial re-roofing · Modified bitumen & TPO systems · Roof repair & maintenance · Building envelope / weatherproofing",
      state: "attested",
      source: "You told Hunter",
      attestedAt: "2026-04-18",
      tier: "T1",
    },
    differentiators: {
      value: "SDVOSB-eligible · Fort Bragg-area focus · 15+ years commercial roofing experience · Quick mobilization within 300mi of Fayetteville",
      state: "attested",
      source: "You told Hunter",
      attestedAt: "2026-04-18",
      tier: "T2",
    },
    pastPerformanceCount: { value: 4, state: "attested", source: "You added these", tier: "T2" },
    pscCodes: { value: null, state: "missing", tier: "T3", dfy: null },
    keywordsSkills: { value: null, state: "missing", tier: "T3", dfy: null },
    clearanceLevels: { value: null, state: "missing", tier: "T3", dfy: null },
    vehiclesHeld: { value: null, state: "missing", tier: "T3", dfy: null },
    dcaaCompliant: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  certifications: {
    samBusinessTypes: { value: ["Small Business", "SDVOSB eligible"], state: "verified", source: "Capability Statement v2.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    smallBusinessStatus: { value: "Small (per NAICS 238160)", state: "verified", source: "Capability Statement v2.pdf", verifiedAt: "2026-04-15", tier: "T1" },
    dsbsProfileUrl: { value: null, state: "missing", tier: "T2", dfy: { service: "SBS Visibility Setup", price: 997 } },
    sdvosbDocument: { value: null, state: "missing", tier: "T3", dfy: null },
    eightaDocument: { value: null, state: "missing", tier: "T3", dfy: null },
    hubzoneDocument: { value: null, state: "missing", tier: "T3", dfy: null },
    wosbDocument: { value: null, state: "missing", tier: "T3", dfy: null },
    cmmcLevel: { value: null, state: "missing", tier: "T3", dfy: null },
    isoCertifications: { value: null, state: "missing", tier: "T3", dfy: null },
    soc2Report: { value: null, state: "missing", tier: "T3", dfy: null },
    stateDiversityCerts: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  digital: {
    website: {
      value: "williamsconstructionnc.com",
      state: "error",
      source: "DNS lookup",
      error: "No MX records found — your domain may not have email set up yet, or DNS may be slow.",
      attemptedAt: "2026-05-08",
      tier: "T2",
      dfy: { service: "GovCompliant Digital Setup", price: 2997 },
    },
    customEmailDomain: {
      value: "marcus@williamsconstructionnc.com",
      state: "error",
      source: "DNS lookup",
      error: "We couldn't verify williamsconstructionnc.com — no MX records.",
      attemptedAt: "2026-05-08",
      tier: "T2",
      dfy: { service: "GovCompliant Digital Setup", price: 2997, leadField: false },
    },
    a2pBrandId: { value: null, state: "missing", tier: "T3", dfy: null },
    ghlSignals: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  sled: {
    sledTargetStates: { value: ["NC", "VA", "SC", "GA"], state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T2" },
    sledRegistrations: {
      value: [
        { state: "NC", status: "pending_dfy", deliveryEta: "2026-05-13", enrolledAt: "2026-05-06", vendorId: null } as SledRegistration,
      ],
      state: "pending_dfy",
      tier: "T1_conditional",
      dfy: { service: "SLED Enrollment", price: 2497, perState: true },
    },
    stateTaxIds: { value: null, state: "missing", tier: "T3", dfy: null },
    stateInsurance: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  positioning: {
    targetValueRangeMin: { value: 250000, state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T1" },
    targetValueRangeMax: { value: 1000000, state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T1" },
    geographicPreference: {
      value: {
        scope: "multi_state_radius",
        states: ["NC", "VA", "SC", "GA"],
        radiusMiles: 300,
        hqState: "NC",
        willingToTravel: true,
        travelConditions: "for contracts over $500K",
      } as GeographicPreference,
      state: "attested",
      source: "You told Hunter",
      attestedAt: "2026-04-18",
      tier: "T1",
    },
    setAsideHunger: { value: "Both, leaning set-aside", state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T1" },
    targetAgencies: { value: ["U.S. Army Corps of Engineers (USACE)"], state: "attested", source: "You told Hunter", attestedAt: "2026-05-02", tier: "T2" },
    notificationCadence: { value: "Weekly digest", state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T2" },
    winThemes: { value: null, state: "missing", tier: "T2", dfy: null },
    naicsTargetingPriorities: { value: null, state: "missing", tier: "T3", dfy: null },
    agenciesToAvoid: { value: null, state: "missing", tier: "T3", dfy: null },
    keyPersonnel: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  bidderProfile: {
    annualRevenueBand: { value: null, state: "missing", tier: "T2", dfy: null },
    totalEmployeesW2: { value: 3, state: "attested", source: "You told Hunter", attestedAt: "2026-04-18", tier: "T2" },
    basicInsurance: { value: null, state: "missing", tier: "T2", dfy: null },
    concurrentContractCapacity: { value: "1 contract at a time", state: "inferred", source: "Hunter's guess based on your team size of 3", tier: "T2" },
    cashFlowTolerance: { value: null, state: "missing", tier: "T3", dfy: null },
    bondingCapability: { value: null, state: "missing", tier: "T3", dfy: null },
    insurancePerType: { value: null, state: "missing", tier: "T3", dfy: null },
    riskAppetite: { value: null, state: "missing", tier: "T3", dfy: null },
    competitorsKnown: { value: null, state: "missing", tier: "T3", dfy: null },
    teamingPartners: { value: null, state: "missing", tier: "T3", dfy: null },
    bidNoBidDealBreakers: { value: null, state: "missing", tier: "T3", dfy: null },
    subcontractorPoolSize: { value: null, state: "missing", tier: "T3", dfy: null },
    mentorProtegeAgreement: { value: null, state: "missing", tier: "T3", dfy: null },
    jointVentures: { value: null, state: "missing", tier: "T3", dfy: null },
  },
  pastPerformance: {
    entries: [
      {
        id: "pp1",
        projectTitle: "Cumberland County HVAC retrofit",
        customerName: "Cumberland County NC",
        customerType: "local",
        contractType: "FFP",
        periodStart: "2023-04-01",
        periodEnd: "2024-03-15",
        totalValue: 245000,
        role: "prime",
        naicsCode: "238220",
        scopeDescription:
          "Removed and replaced rooftop HVAC units across three county administration buildings, including curb adapters, weatherproof flashing, and minor roof patching at penetrations.",
        referencePOCName: "Janet Reyes",
        referencePOCTitle: "Facilities Director, Cumberland County",
        successful: true,
        state: "attested",
      },
      {
        id: "pp2",
        projectTitle: "Fort Bragg housing roof replacement (sub)",
        customerName: "Sub to Apex Roofing (federal prime)",
        customerType: "federal_sub",
        contractType: "FFP",
        periodStart: "2022-08-01",
        periodEnd: "2023-06-30",
        totalValue: 890000,
        role: "sub",
        subPercent: 35,
        naicsCode: "238160",
        scopeDescription:
          "Subcontracted roof replacement on 22 on-post family housing units. Modified bitumen on low-slope sections, asphalt shingle on steep-slope sections, full tear-off and deck inspection.",
        referencePOCName: "Mike Sutton",
        referencePOCTitle: "Project Manager, Apex Roofing",
        successful: true,
        state: "attested",
      },
      {
        id: "pp3",
        projectTitle: "Hay Street Methodist Church re-roof",
        customerName: "Hay Street United Methodist Church",
        customerType: "commercial",
        contractType: "FFP",
        periodStart: "2021-06-01",
        periodEnd: "2021-09-15",
        totalValue: 48000,
        role: "prime",
        naicsCode: "238160",
        scopeDescription:
          "Complete steep-slope re-roof of the sanctuary including underlayment upgrade, ice and water shield in valleys, copper flashing repair around the bell tower, and gutter replacement.",
        referencePOCName: "Pastor David Hall",
        successful: true,
        state: "attested",
      },
      {
        id: "pp4",
        projectTitle: "Womack Army Medical Center roof maintenance",
        customerName: "Womack Army Medical Center (federal direct)",
        customerType: "federal_prime",
        contractType: "FFP",
        periodStart: "2024-02-15",
        periodEnd: "2024-08-30",
        totalValue: 156000,
        role: "prime",
        naicsCode: "238160",
        scopeDescription:
          "Quarterly preventive maintenance and emergency repair across Womack medical campus low-slope roofs. TPO seam re-welds, drain assembly cleaning, infrared moisture survey, and minor patch work.",
        successful: true,
        state: "needs_review",
        extractedFrom: "Capability statement draft uploaded 2026-05-05",
      },
    ],
    totalValue: 1339000,
    federalCount: 2,
    sledCount: 0,
    commercialCount: 1,
  },
  mentorHistory: {
    sessions: [
      {
        id: "m1",
        dateTime: "2026-04-22T09:00:00Z",
        mentorName: "Diana Potts",
        status: "completed",
        takeaway:
          "Focus on USACE small business set-asides; capability statement needs more recent past performance.",
        takeawayBy: "Marcus paraphrased after the call",
      },
    ],
    activeMentorProtege: null,
  },
};

export function useBusinessProfile(): BusinessProfile {
  return businessProfile;
}

/** True when any field anywhere in the profile maps to a real DFY service. */
export function hasAnyDfy(p: BusinessProfile = businessProfile): boolean {
  const buckets = [
    p.identity,
    p.capabilities,
    p.certifications,
    p.digital,
    p.sled,
    p.positioning,
    p.bidderProfile,
  ];
  for (const b of buckets) {
    for (const k of Object.keys(b)) {
      if (b[k]?.dfy) return true;
    }
  }
  return false;
}

// ── Small orders — the wins this feature produces ──────────────────────────
//
// PORTED from the micro-purchases prototype. `getMicroState().wins` is the one
// writer; these three are the only readers a buyer-facing document may use.

/**
 * Her federal micro-purchase wins, newest first.
 *
 * Returned as the record it is, deliberately NOT mapped into
 * `PastPerformanceEntry`. That type requires `contractType`, `periodEnd`,
 * `naicsCode` and `successful`, and we hold none of the four in the shape it
 * wants. Her delivery answer is her word on one field, not a period end and not
 * a verified `successful: true`. A record with four made-up fields is worse
 * than a record in its own shape.
 *
 * EVERY win, including one she told us she could not deliver. This is her
 * record and she must be able to see what we hold about her. What may LEAVE
 * the product is a different question — `federalMicroWinsForBuyer()` below.
 * Never hand this array to a buyer-facing document.
 *
 * Sorted here rather than at each caller so the capability statement and the
 * "Orders you won" page can never list the same jobs in two different orders.
 */
export function federalMicroWins(): PastPerformanceRecord[] {
  return [...getMicroState().wins].sort((a, b) => b.wonOn.localeCompare(a.wonOn));
}

/**
 * May this win be printed on a document that goes to a buyer?
 *
 * ONE rule, one owner, all four branches read — a switch rather than a test, so
 * a fifth outcome fails to compile instead of silently publishing.
 *
 *  · `delivered` — publishes. It is what a past-performance line claims.
 *  · `late` — publishes. Late is not failure, and hiding it would make the
 *    document a selection rather than a record.
 *  · `unknown` — HELD until she answers. Past performance is proof the work was
 *    done and we do not know yet. The wins page says it is held and why, so the
 *    omission is visible to her rather than silent.
 *  · `not_delivered` — NEVER. She told us that in confidence, on a screen that
 *    promised "Only Hunter sees this. We do not tell DLA." Publishing it as a
 *    past-performance line, under a contracting officer's direct phone number,
 *    turns her honest answer into the thing that harms her.
 */
export function publishableToBuyer(w: PastPerformanceRecord): boolean {
  switch (w.outcome) {
    case "delivered":
    case "late":
      return true;
    case "unknown":
    case "not_delivered":
      return false;
  }
}

/** The wins that may leave the product. Derived from `federalMicroWins()`, so
 *  the two lists can never fall into different orders. */
export function federalMicroWinsForBuyer(): PastPerformanceRecord[] {
  return federalMicroWins().filter(publishableToBuyer);
}
