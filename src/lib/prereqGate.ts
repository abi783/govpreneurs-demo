// Prereq gate — narrow, cert-based rules driven by the firm's real Success
// Center profile. A set-aside opportunity is gated when the profile does not
// list the certification the set-aside requires. Soft/advisory only: it never
// blocks viewing, it shows a warm amber invitation with a path to resolve.

export interface UnmetPrereq {
  key: string;
  label: string;
  why: string;
  dfyPrice?: number;
}

/**
 * Set-asides that require a specific certification the firm must hold, paired
 * with the set-aside ids that satisfy each (an SDVOSB firm also satisfies a
 * VOSB requirement). Ids match `GET /opportunities/filters/defaults` setAsides,
 * which the portal derives from the firm's socioEconomicCerts. "SB" (Total
 * Small Business) is intentionally absent — it needs no certification.
 */
const CERT_REQUIREMENTS: {
  test: RegExp;
  satisfiedBy: string[];
  label: string;
  why: string;
  dfyPrice: number;
}[] = [
  {
    test: /8\(a\)|\b8a\b/i,
    satisfiedBy: ["8A"],
    label: "8(a) certification on file",
    why: "Restricted to firms with an active SBA 8(a) certification — we don't have one on your profile.",
    dfyPrice: 1200,
  },
  {
    test: /hubzone/i,
    satisfiedBy: ["HUBZone"],
    label: "HUBZone certification on file",
    why: "Restricted to HUBZone-certified firms — we don't have your HUBZone cert on file.",
    dfyPrice: 1200,
  },
  {
    test: /wosb|edwosb/i,
    satisfiedBy: ["WOSB"],
    label: "WOSB / EDWOSB certification on file",
    why: "Restricted to women-owned firms with an active WOSB/EDWOSB certification — we don't have it on file.",
    dfyPrice: 1200,
  },
  {
    test: /sdvosb/i,
    satisfiedBy: ["SDVOSB"],
    label: "SDVOSB verification on file",
    why: "Restricted to service-disabled veteran-owned firms — we don't have your SDVOSB verification on file.",
    dfyPrice: 1200,
  },
  {
    test: /\bvosb\b/i,
    satisfiedBy: ["VOSB", "SDVOSB"],
    label: "VOSB verification on file",
    why: "Restricted to veteran-owned firms — we don't have your VOSB verification on file.",
    dfyPrice: 1200,
  },
];

/**
 * Cert-based prerequisites from the firm's real profile. `heldSetAsides` are the
 * user's set-aside ids from `GET /opportunities/filters/defaults`. Returns the
 * set-asides the opportunity requires that the firm does not hold.
 *
 * SLED out-of-state vendor-registration gating is intentionally deferred until
 * the profile's sledRegistrations are exposed to the client.
 */
export function computeCertPrereqs(
  oppSetAside: string | undefined,
  heldSetAsides: string[],
): UnmetPrereq[] {
  const sa = oppSetAside ?? "";
  const out: UnmetPrereq[] = [];
  for (const req of CERT_REQUIREMENTS) {
    if (req.test.test(sa) && !req.satisfiedBy.some((id) => heldSetAsides.includes(id))) {
      out.push({ key: req.satisfiedBy[0].toLowerCase(), label: req.label, why: req.why, dfyPrice: req.dfyPrice });
    }
  }
  return out;
}
