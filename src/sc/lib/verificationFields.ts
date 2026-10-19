// What a verification RESULT shows, shared by both roadmaps.
//
// v2's SubStepVerificationPanel and v3's VerifyPanel render the same
// MemberValidation rows — the same extracted legal name, UEI, CAGE, expiry —
// so the map from stored keys to human labels has to be one map. It was v2's
// private helper until v3 needed it too (2026-08-29); a second copy would
// have drifted the first time a validator added a field.
//
// Pure data + one pure function: no React, so either renderer can own the
// markup while agreeing on what to show and in what order.

/**
 * SBA certification → color-tagged badge metadata. Keeps the SBS card
 * scan-friendly even when a center has several certifications.
 */
export const SBA_CERT_BADGES: Record<string, { label: string; bg: string; fg: string; border: string; tip: string }> = {
  "8(a)": { label: "8(a)", bg: "#fef3c7", fg: "#92400e", border: "#fcd34d", tip: "8(a) Business Development Program" },
  "HUBZone": { label: "HUBZone", bg: "#dbeafe", fg: "#1e3a8a", border: "#93c5fd", tip: "Historically Underutilized Business Zone" },
  "WOSB": { label: "WOSB", bg: "#fce7f3", fg: "#9d174d", border: "#f9a8d4", tip: "Women-Owned Small Business" },
  "EDWOSB": { label: "EDWOSB", bg: "#fae8ff", fg: "#86198f", border: "#f0abfc", tip: "Economically-Disadvantaged Women-Owned Small Business" },
  "SDVOSB": { label: "SDVOSB", bg: "#dcfce7", fg: "#14532d", border: "#86efac", tip: "Service-Disabled Veteran-Owned Small Business" },
  "VOSB": { label: "VOSB", bg: "#ccfbf1", fg: "#115e59", border: "#5eead4", tip: "Veteran-Owned Small Business" },
};

/** Stored key → the label the member reads. Order is the render order. */
const FIELD_LABELS: Record<string, string> = {
  documentType: "Document Type",
  legalName: "Legal Name",
  companyName: "Company",
  state: "State",
  statusText: "Status",
  status: "Status",
  sosId: "SOS ID",
  entityType: "Entity Type",
  issueDate: "Issued",
  filingDate: "Filed",
  registrationDate: "Registered",
  expirationDate: "Expires",
  registeredAgent: "Registered Agent",
  uei: "UEI",
  cage: "CAGE",
  physicalAddress: "Address",
  primaryNaics: "Primary NAICS",
  contactName: "Contact",
  contactEmail: "Email",
  contactPhone: "Phone",
  // profileUrl is rendered as a clickable "Open SBA profile" link
  // above the field grid for SBS; suppress from the generic key list.
  // Website / Email / A2P
  url: "URL",
  pageTitle: "Page Title",
  metaDescription: "Description",
  domain: "Domain",
  mxCount: "MX Records",
  spfRecord: "SPF",
  brandId: "Brand ID",
  idType: "Type",
  // CMMC report
  cmmcUid: "CMMC UID",
  statusType: "Status Type",
  level: "Level",
  assessmentDate: "Assessed",
  scope: "Scope",
  affirmingOfficial: "Affirming Official",
};

/**
 * The keys either roadmap actually renders. Everything else in a stored
 * result — SAM's `_raw`, up to 23KB of API response — is dropped before the
 * page ships: it is never read, and a member's page should not carry it.
 */
const EXTRA_KEYS = [
  "requiresConfirmation",
  "issues",
  // SBS
  "certifications",
  "profileUrl",
  "capabilitiesNarrative",
  "searchUrl",
  // SLED
  "entries",
] as const;

/** A stored result, reduced to what a panel will show. */
export function trimVerificationData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of [...Object.keys(FIELD_LABELS), ...EXTRA_KEYS]) {
    if (d[k] !== undefined) out[k] = d[k];
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function pickFields(data: unknown): Array<{ label: string; value: string }> {
  if (!data || typeof data !== "object") return [];
  const out: Array<{ label: string; value: string }> = [];
  const d = data as Record<string, unknown>;
  // Order matters — put doc-type / name first so they read top-left in the grid.
  const map = FIELD_LABELS;
  const seen = new Set<string>();
  for (const [k, label] of Object.entries(map)) {
    if (seen.has(label)) continue;
    const v = d[k];
    if (v != null && (typeof v === "string" || typeof v === "number")) {
      out.push({ label, value: String(v) });
      seen.add(label);
    }
    if (out.length >= 8) break;
  }
  return out;
}

