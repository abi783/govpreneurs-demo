// The DFY vs Send-to-Mentor split (Diana / dfy-alignment.md, §C6).
//
// The rule, enforced here so the UI can never fake it: a gap gets a "Have us do it —
// $price" CTA ONLY if it maps to one of the NINE real GovPreneurs services below. Every
// other help-moment — the "Bucket B" strategy work Grant surfaces — routes to a mentor
// referral (a ticket + in-product conversation), never a productized CTA we don't sell.

export interface DfyService {
  name: string;
  price: string;
}

/** The nine real services from govpreneurs.com/services — the ONLY gaps that earn a CTA. */
export const DFY_SERVICES: DfyService[] = [
  { name: "LLC Application", price: "$600" },
  { name: "SAM.gov Registration", price: "$2,997" },
  { name: "Capability Statement", price: "$2,000" },
  { name: "SBS Visibility Setup", price: "$997" },
  { name: "SLED Enrollment", price: "$2,497/state" },
  { name: "GovCompliant Digital Setup", price: "$2,997" },
  { name: "Profile Maintenance & Compliance Alerts", price: "$290/mo" },
  { name: "Custom Roadmap", price: "$1,997" },
  { name: "Prime Contractor Registration", price: "$297" },
];

/** Bucket B — help-moments Grant surfaces that have NO productized service, so they
 *  route to a mentor referral. Listed for reference; the split is by DFY_SERVICES lookup. */
export const BUCKET_B_MOMENTS = [
  "Bid/no-bid decision support",
  "Teaming strategy",
  "Compliance matrix",
  "Win-theme development",
  "Commercial→relevant-PP translation",
  "Pricing / execution reality check",
  "Red-team review before submission",
];

/** Resolve a gap's service name to a real service (→ DFY CTA) or null (→ Send to Mentor).
 *  This is the single gate that keeps the UI from inventing a service to monetize a moment. */
export function dfyService(name: string): DfyService | null {
  return DFY_SERVICES.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
}
