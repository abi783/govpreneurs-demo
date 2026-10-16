// The mark in front of the name — one per CATEGORY, never per item.
//
// The design this was built from draws a mop head on "Wet mop head" and a
// bracket on "Mounting bracket". That is item-level art and we do not hold it:
// the record carries a Federal Supply Class, mapped to the twelve categories
// she already picked from, and nothing finer. Drawing the real thing for the
// one order we happen to have a picture of and a box for the next would read as
// a claim that the two are different KINDS of thing, when the only difference
// is which item somebody drew.
//
// So it is the same twelve marks she chose from on the category sheet — the
// icon on the board is the icon she picked. It is there to be scanned, not
// read: `aria-hidden`, and every fact it sits beside is still written in words
// on the card. Nothing on this row depends on recognising a glyph.
//
// `other` is a real state — the supply class was null, or is not in our mapping
// (PRD 7.1) — and it takes the neutral box rather than a guess. The map is
// TOTAL over `MicroCategory` on purpose: a thirteenth category added to the
// union fails typecheck here instead of quietly rendering nothing.
import {
  Bolt,
  Cable,
  Cog,
  Disc3,
  Droplets,
  Funnel,
  HardHat,
  Layers,
  Lightbulb,
  Package,
  SprayCan,
  Waves,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { MicroCategory } from "../../lib/microPurchases/categories";

const CATEGORY_ICON: Record<MicroCategory, LucideIcon> = {
  "office-cleaning": SprayCan,
  "hand-tools": Wrench,
  "safety-gear": HardHat,
  filters: Funnel,
  "hoses-belts": Waves,
  "bearings-seals": Disc3,
  "pipes-valves": Droplets,
  // Cable for the wire group, a lamp for the electrical one. Both categories
  // are electrical and the sheet tells them apart by what she would be holding
  // — "Electrical wire and plugs" against "Switches, relays, lamps" — so the
  // marks do too. A plug on both would be one mark for two rows.
  "wire-cable": Cable,
  electrical: Lightbulb,
  "metal-stock": Layers,
  "engine-parts": Cog,
  fasteners: Bolt,
  other: Package,
};

export function CategoryIcon({ category }: { category: MicroCategory }) {
  // NOT Zap, on any row. The fast-award line in the card foot is a Zap, and it
  // is the one mark on this card that means "act today". A second bolt an inch
  // to its left, meaning "this is an electrical part", spends that signal.
  const Icon = CATEGORY_ICON[category];
  return (
    <span className="mp-card__icon" aria-hidden>
      <Icon size={20} strokeWidth={1.75} />
    </span>
  );
}
