// Category pill — the ONE label for HigherGov's non-contract opportunity
// types (grant / forecast / product buy). Contracts are the unlabeled
// default: explicit where it differs, silent where it doesn't. Rendered in
// the same slot on cards and the detail header; always glossed.

import { CalendarClock, HandCoins, Package } from "lucide-react";
import type { OppCategory } from "../../lib/mock/opportunities";
import { JargonGloss } from "./JargonGloss";
import { termGloss } from "../../lib/filterGlosses";

export const CATEGORY_LABEL: Record<Exclude<OppCategory, "contract">, string> = {
  grant: "Grant",
  forecast: "Forecast",
  product_buy: "Product buy",
};

const CATEGORY_ICON = {
  grant: HandCoins,
  forecast: CalendarClock,
  product_buy: Package,
} as const;

const CATEGORY_GLOSS_KEY: Record<Exclude<OppCategory, "contract">, string> = {
  grant: "grant",
  forecast: "forecast",
  product_buy: "productBuy",
};

export function CategoryPill({ category }: { category?: OppCategory }) {
  if (!category || category === "contract") return null;
  const Icon = CATEGORY_ICON[category];
  const label = CATEGORY_LABEL[category];
  return (
    <JargonGloss gloss={termGloss(CATEGORY_GLOSS_KEY[category])!} inline>
      <span className={`category-pill category-pill--${category}`}>
        <Icon size={11} aria-hidden /> {label}
      </span>
    </JargonGloss>
  );
}
