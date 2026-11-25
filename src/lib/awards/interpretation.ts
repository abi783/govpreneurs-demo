import { usd, type AwardInterpretation, type AwardPanelFilters } from "../awardsApi";

export interface InterpretationChip {
  key: string;
  label: string;
  /** The interpretation with just this part taken out. */
  remove: (i: AwardInterpretation) => AwardInterpretation;
}

const drop = (...keys: (keyof AwardPanelFilters)[]) => (i: AwardInterpretation): AwardInterpretation => {
  const panel = { ...i.panel };
  for (const k of keys) delete panel[k];
  return { ...i, panel };
};

const money = (lo?: number, hi?: number) =>
  lo !== undefined && hi !== undefined ? `${usd(lo)}–${usd(hi)}` : lo !== undefined ? `${usd(lo)} or more` : `Up to ${usd(hi ?? 0)}`;

/** Days as the unit a person says it in: months up to two years, then years. */
function span(days: number): string {
  if (days < 60) return `${Math.round(days)} days`;
  const months = Math.round(days / 30);
  return months >= 24 ? `${+(days / 365).toFixed(1)} years` : `${months} months`;
}
const range = (lo?: number, hi?: number, tail = "") => {
  if (lo !== undefined && hi !== undefined) return `${span(lo).replace(/ \w+$/, "")}–${span(hi)}${tail}`;
  return lo !== undefined ? `${span(lo)}+${tail}` : `Up to ${span(hi ?? 0)}${tail}`;
};

/** The parts of what we understood, each removable. */
export function interpretationChips(i: AwardInterpretation): InterpretationChip[] {
  const p = i.panel;
  const out: InterpretationChip[] = [];
  const has = (...k: (keyof AwardPanelFilters)[]) => k.some((x) => p[x] !== undefined);
  if (i.q) out.push({ key: "q", label: i.q.charAt(0).toUpperCase() + i.q.slice(1), remove: (x) => ({ ...x, q: "" }) });
  if (has("dollarMin", "dollarMax"))
    out.push({ key: "dollar", label: money(p.dollarMin, p.dollarMax), remove: drop("dollarMin", "dollarMax") });
  if (has("durationMinDays", "durationMaxDays"))
    out.push({ key: "duration", label: range(p.durationMinDays, p.durationMaxDays, " long"), remove: drop("durationMinDays", "durationMaxDays") });
  if (has("awardedMinDays", "awardedMaxDays"))
    out.push({ key: "awarded", label: `Awarded ${range(p.awardedMinDays, p.awardedMaxDays, " ago")}`, remove: drop("awardedMinDays", "awardedMaxDays") });
  if (has("endsMinDays", "endsMaxDays"))
    out.push({ key: "ends", label: `Ends in ${range(p.endsMinDays, p.endsMaxDays)}`, remove: drop("endsMinDays", "endsMaxDays") });
  if (p.chooseStates?.length) out.push({ key: "states", label: p.chooseStates.join(", "), remove: drop("chooseStates") });
  if (p.setAsides?.length) out.push({ key: "setAsides", label: p.setAsides.map((s) => s.toUpperCase()).join(", ") + " set-aside", remove: drop("setAsides") });
  if (has("bidsMin", "bidsMax"))
    out.push({ key: "bids", label: `${p.bidsMin ?? 0}${p.bidsMax !== undefined ? `–${p.bidsMax}` : "+"} bids`, remove: drop("bidsMin", "bidsMax") });
  if (p.competed) out.push({ key: "competed", label: p.competed === "yes" ? "Competed" : "Sole source", remove: drop("competed") });
  if (p.hasSubs) out.push({ key: "hasSubs", label: "Has subcontractors", remove: drop("hasSubs") });
  if (p.subPlanRequired) out.push({ key: "subPlan", label: "Needs a subcontracting plan", remove: drop("subPlanRequired") });
  return out;
}
