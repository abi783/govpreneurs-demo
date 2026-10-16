// Resolves the profile-backed compliance rows (insurance, bonding) against the
// live firm profile so the Gate Strip reads required-vs-held, deterministically,
// in code (PRD 97 §S1 silent-disqualifier). Rows without a `resolve` hint are
// authored directly (set-aside, submission, license, etc.).

import { firmInsurance, type InsuranceCoverageType } from "./firmProfile";
import type { ComplianceRow } from "./types";

const COVERAGE_LABEL: Record<InsuranceCoverageType, string> = {
  gl: "General Liability",
  "professional-eo": "Professional Liability",
  "tech-eo": "Technology E&O",
  cyber: "Cyber Liability",
  auto: "Business Auto",
  "workers-comp": "Workers' Comp",
  umbrella: "Umbrella",
};

function fmtUSD(n: number): string {
  return n >= 1_000_000 ? `$${n / 1_000_000}M` : `$${Math.round(n / 1000)}K`;
}

/** The best limit the firm carries for a coverage type (aggregate, else per-occurrence). */
function heldLimit(coverage: InsuranceCoverageType): number | null {
  const c = firmInsurance().coverages.find((x) => x.type === coverage);
  if (!c) return null;
  return c.aggregate ?? c.perOccurrence ?? null;
}

function resolveInsurance(
  coverage: InsuranceCoverageType,
  requiredLimit: number,
): Pick<ComplianceRow, "firmValue" | "status"> {
  const held = heldLimit(coverage);
  if (held == null) return { firmValue: "none on file", status: "missing" };
  if (held >= requiredLimit) return { firmValue: `${fmtUSD(held)} ✓`, status: "have" };
  return { firmValue: `${fmtUSD(held)} on file`, status: "missing" };
}

function resolveBonding(requiredAmount: number): Pick<ComplianceRow, "firmValue" | "status"> {
  const bonding = firmInsurance().bonding;
  // Not on file → a required coverage we don't yet know, not a hard block (§S1 return note).
  if (bonding == null) return { firmValue: "not on file", status: "confirm" };
  if (bonding.single >= requiredAmount)
    return { firmValue: `${fmtUSD(bonding.single)} single ✓`, status: "have" };
  return { firmValue: `${fmtUSD(bonding.single)} single`, status: "missing" };
}

/** Fill firmValue + status on every `resolve` row from the live firm profile. */
export function resolveComplianceAgainstFirm(rows: ComplianceRow[]): ComplianceRow[] {
  return rows.map((row) => {
    if (!row.resolve) return row;
    if (row.resolve.kind === "insurance") {
      const { firmValue, status } = resolveInsurance(
        row.resolve.coverage,
        row.resolve.requiredLimit,
      );
      return { ...row, firmValue, status };
    }
    const { firmValue, status } = resolveBonding(row.resolve.requiredAmount);
    return { ...row, firmValue, status };
  });
}

export { COVERAGE_LABEL };
