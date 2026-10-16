/**
 * The pilot checkout rule that only roadmap v3's two purchase screens need
 * (PRD §8.2): the government fee disclosure of the drawer (`DfyDrawer`) and
 * the intake offer (`IntakeOfferModal`). The terms rules that every checkout
 * shares are in `../checkoutTerms.ts`.
 *
 * Layer: Interface Adapters (client). Pure.
 */

import type { DfySlug } from "@sc/lib/roadmapV3/types";
import { CHECKOUT_GOV_FEE_SAM } from "@sc/lib/walletCopy";

/**
 * The services that show a government fee disclosure (PRD §8.2 item 3,
 * `governmentFeeDisclosure`), with the text of each.
 */
const GOVERNMENT_FEE_DISCLOSURES: Partial<Record<DfySlug, string>> = {
  "sam-registration": CHECKOUT_GOV_FEE_SAM,
};

/** The disclosure text of a service, or null when the service shows none. */
export function governmentFeeDisclosureFor(slug: DfySlug | undefined): string | null {
  return (slug && GOVERNMENT_FEE_DISCLOSURES[slug]) || null;
}
