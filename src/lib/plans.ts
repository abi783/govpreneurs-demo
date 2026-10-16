// Plan catalogue for the Pilot → Expert → Elite upsell journey.
//
// Mirrors the v1 frontend's `config/constant.ts` STARTER_PLANS / ELITE_PLAN so
// the upgrade modal shows the same ladder. Product ids are env-overridable and
// fall back to the same hard-coded ids the v1 app ships with.

export const PILOT_PLAN_PRODUCT_ID =
  (import.meta.env.VITE_PILOT_PLAN_PRODUCT_ID as string | undefined) || "prod_SenduTQ9yEI58g";

export const EXPERT_PLAN_PRODUCT_ID =
  (import.meta.env.VITE_EXPERT_PLAN_PRODUCT_ID as string | undefined) || "prod_RyCnZGtd77e3a6";

export const ELITE_PLAN_PRODUCT_ID =
  (import.meta.env.VITE_ELITE_PLAN_PRODUCT_ID as string | undefined) || "prod_RyCniw2GwDwIJw";

export const UPGRADE_PLAN_LINK = "https://govpreneurs.com/membership";

export interface Plan {
  name: string;
  price: string;
  period: string;
  duration: string;
  consultations: string;
  includesLabel: string;
  features: string[];
  whosThisFor: string;
  productId: string;
}

// Canonical plan data — mirrors the v1 frontend's config/constant.ts. Keep in
// sync with that file (it is the source of truth for pricing and features).
export const STARTER_PLANS: Plan[] = [
  {
    name: "Pilot",
    price: "997",
    period: "One time payment",
    duration: "8 months program",
    consultations: "1 complimentary consultation",
    includesLabel: "Includes",
    features: [
      "Active Community",
      "Success Center",
      "Access to mentors",
      "Learning classes",
      "Recurring Q&A calls",
      "Office hours",
      "Gov compliant CRM System",
    ],
    whosThisFor:
      "Learn & Get Oriented with Pilot access designed specifically for entrepreneurs who are curious about government contracting and want to explore how it works before committing to the pursuit.",
    productId: PILOT_PLAN_PRODUCT_ID,
  },
  {
    name: "Expert",
    price: "2497",
    period: "One time payment",
    duration: "10 months program",
    consultations: "2 complimentary consultation",
    includesLabel: "Everything in Pilot +",
    features: ["GovMatch AI", "AI Document Vault", "AI Proposal Draft"],
    whosThisFor:
      "Prepare & Actively Compete. The Expert access is built for businesses that are already set up and preparing to pursue real govcon opportunities.",
    productId: EXPERT_PLAN_PRODUCT_ID,
  },
];

export const ELITE_PLAN: Plan = {
  name: "Elite",
  price: "4997",
  period: "One time payment",
  duration: "12 months program",
  consultations: "5 complimentary consultation",
  includesLabel: "Everything in Expert +",
  features: [
    "Mentorship",
    "Custom roadmap",
    "Accountability check",
    "VIP private group with mentors",
  ],
  whosThisFor:
    "Our Elite access is designed for businesses that want to move faster with hands-on execution and guidance.",
  productId: ELITE_PLAN_PRODUCT_ID,
};

/**
 * The plan ladder to show a user, given their current product id — same logic
 * as the v1 UpgradePlanModal: Pilot sees the full ladder, Expert sees Expert +
 * Elite, everyone else just sees Elite.
 */
export function plansForProduct(productId: string | null): Plan[] {
  const current = STARTER_PLANS.find((p) => p.productId === productId);
  if (!current) return [ELITE_PLAN];
  if (current.name === "Pilot") return [...STARTER_PLANS, ELITE_PLAN];
  if (current.name === "Expert") return [current, ELITE_PLAN];
  return [ELITE_PLAN];
}

export const isPilotPlan = (productId: string | null): boolean =>
  productId === PILOT_PLAN_PRODUCT_ID;
