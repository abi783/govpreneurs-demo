// Ported from the GovPreneurs funnel's caps-builder.js.
export const CAPSTMT_STORAGE_KEY = "gp_capstmt_v1";
export const CAPSTMT_TPL_KEY = "gp_capstmt_tpl_v1";

export const CAPSTMT_STEPS = [
  "company",
  "branding",
  "competencies",
  "certifications",
  "contact",
] as const;
export type CapStmtStep = (typeof CAPSTMT_STEPS)[number];

export type CapStmtTemplate = "classic" | "modern" | "executive";

export interface CapStmtState {
  legalName: string;
  dba: string;
  yearInc: string;
  stateInc: string;
  corpType: string;
  uei: string;
  cage: string;
  slogan: string;
  summary: string;
  primaryColor: string;
  secondaryColor: string;
  logoDataUrl: string;
  logoName: string;
  competencies: string;
  differentiators: string;
  fedCerts: string;
  vehicles: string;
  stateCerts: string;
  localAgencies: string;
  clients: string;
  naics: string;
  partners: string;
  clearances: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  contactAddress: string;
}

export const CAPSTMT_DEFAULTS: CapStmtState = {
  legalName: "",
  dba: "",
  yearInc: "",
  stateInc: "",
  corpType: "",
  uei: "",
  cage: "",
  slogan: "",
  summary: "",
  primaryColor: "#051A53",
  secondaryColor: "#f59e0b",
  logoDataUrl: "",
  logoName: "",
  competencies: "",
  differentiators: "",
  fedCerts: "",
  vehicles: "",
  stateCerts: "",
  localAgencies: "",
  clients: "",
  naics: "",
  partners: "",
  clearances: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactWebsite: "",
  contactAddress: "",
};

/** Sample content shown when the form is empty, so the customer sees what the finished doc looks like. */
export const CAPSTMT_SAMPLE: CapStmtState = {
  legalName: "Acme Federal Services, LLC",
  dba: "Acme Federal",
  yearInc: "2018",
  stateInc: "Virginia",
  corpType: "LLC",
  uei: "ABC123DEF456",
  cage: "9X8Y7",
  slogan: "Mission-ready solutions for federal agencies.",
  summary:
    "Acme Federal Services is a Virginia-based small business specializing in cybersecurity and IT modernization for federal civilian and defense agencies. Founded in 2018, our team of cleared engineers delivers mission-critical solutions across the DoD and civilian markets with measured speed, security, and accountability.",
  primaryColor: "#051A53",
  secondaryColor: "#f59e0b",
  logoDataUrl: "",
  logoName: "",
  competencies:
    "Cybersecurity assessments & risk management\nCloud migration & FedRAMP authorization\nIT modernization & legacy system replacement\nNetwork architecture & zero-trust design\nIncident response & SOC operations",
  differentiators:
    "CMMI Maturity Level 3 appraised\n98% on-time delivery across 47 federal contracts\nIn-house Secret and Top Secret clearance pool\nNationwide 24/7 incident response coverage",
  fedCerts: "8(a) Certified, WOSB, HUBZone",
  vehicles: "GSA Schedule 70, SeaPort-NxG, NITAAC CIO-SP3",
  stateCerts: "Virginia SWaM, Maryland MBE",
  localAgencies: "Fairfax County · DC OCTO · Montgomery County",
  clients: "U.S. Army Cyber Command · GSA · Dept. of Veterans Affairs · Dept. of Education",
  naics: "541512, 541511, 541519, 518210",
  partners: "Microsoft Federal · AWS Federal · Splunk · Tenable",
  clearances: "Secret + Top Secret clearances on staff · CISSP, CISM, PMP, AWS Solutions Architect",
  contactName: "Jane Mitchell",
  contactPhone: "(703) 555-0142",
  contactEmail: "jane.mitchell@acmefederal.com",
  contactWebsite: "acmefederal.com",
  contactAddress: "2200 Federal Way, Arlington, VA 22202",
};

/** Fields that count toward "the form has real content" (mirrors isFormEmpty's key list). */
const EMPTY_CHECK_KEYS: (keyof CapStmtState)[] = [
  "legalName",
  "dba",
  "summary",
  "slogan",
  "competencies",
  "differentiators",
  "fedCerts",
  "vehicles",
  "stateCerts",
  "localAgencies",
  "clients",
  "partners",
  "clearances",
  "contactName",
  "contactEmail",
  "contactPhone",
  "contactWebsite",
  "contactAddress",
  "uei",
  "cage",
  "naics",
];

export function isFormEmpty(state: CapStmtState): boolean {
  return EMPTY_CHECK_KEYS.every((k) => !state[k]);
}

/** The sample-backed values actually rendered, unless the user has typed real content. */
export function getEffective(state: CapStmtState): CapStmtState {
  if (!isFormEmpty(state)) return state;
  const eff: CapStmtState = { ...CAPSTMT_SAMPLE };
  if (state.logoDataUrl) {
    eff.logoDataUrl = state.logoDataUrl;
    eff.logoName = state.logoName;
  }
  if (state.primaryColor) eff.primaryColor = state.primaryColor;
  if (state.secondaryColor) eff.secondaryColor = state.secondaryColor;
  return eff;
}

export function loadCapStmtState(): CapStmtState | null {
  try {
    const raw = window.localStorage.getItem(CAPSTMT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCapStmtState(state: CapStmtState): void {
  try {
    window.localStorage.setItem(CAPSTMT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore — private browsing / storage blocked */
  }
}

export function loadCapStmtTemplate(): CapStmtTemplate | null {
  try {
    const v = window.localStorage.getItem(CAPSTMT_TPL_KEY);
    return v === "classic" || v === "modern" || v === "executive" ? v : null;
  } catch {
    return null;
  }
}

export function saveCapStmtTemplate(tpl: CapStmtTemplate): void {
  try {
    window.localStorage.setItem(CAPSTMT_TPL_KEY, tpl);
  } catch {
    /* ignore */
  }
}
